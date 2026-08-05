package com.kiranaai.service;

import com.kiranaai.dto.response.ForecastResponse;
import com.kiranaai.dto.response.ReorderItemResponse;
import com.kiranaai.model.Forecast;
import com.kiranaai.model.Product;
import com.kiranaai.model.Sale;
import com.kiranaai.repository.ForecastRepository;
import com.kiranaai.repository.ProductRepository;
import com.kiranaai.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForecastService {

    private final ForecastRepository forecastRepository;
    private final ProductRepository  productRepository;
    private final SaleRepository     saleRepository;
    private final GeminiService      geminiService;

    // ── Generate forecasts for all products ────────────────────────────────
    public List<ForecastResponse> generateForecasts(String userId) {
        List<Product> products = productRepository.findByUserIdAndIsActiveTrue(userId);
        if (products.isEmpty()) return List.of();

        Instant from = Instant.now().minus(30, ChronoUnit.DAYS);

        // Pre-load all sales in one pass
        Map<String, List<Sale>> salesMap = new HashMap<>();
        for (Product p : products) {
            List<Sale> sales = saleRepository
                    .findByUserIdAndProductIdOrderBySaleDateDesc(userId, p.getId())
                    .stream()
                    .filter(s -> s.getSaleDate().isAfter(from))
                    .collect(Collectors.toList());
            salesMap.put(p.getId(), sales);
        }

        // ── Try Gemini BATCH (1 API call for ALL products) ─────────────────
        Map<String, GeminiService.ForecastResult> geminiResults = new HashMap<>();
        if (geminiService.isConfigured()) {
            try {
                geminiResults = geminiService.analyzeAllForecasts(products, salesMap);
                log.info("Gemini batch forecast returned {} results for {} products",
                        geminiResults.size(), products.size());
            } catch (Exception e) {
                log.warn("Gemini batch forecast failed, falling back to Moving Average for all: {}", e.getMessage());
            }
        }

        // ── Apply results per product ───────────────────────────────────────
        Map<String, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        List<Forecast> saved = new ArrayList<>();

        for (Product product : products) {
            Forecast forecast = forecastRepository
                    .findTopByUserIdAndProductIdOrderByGeneratedAtDesc(userId, product.getId())
                    .orElseGet(() -> Forecast.builder()
                            .userId(userId)
                            .productId(product.getId())
                            .build());

            GeminiService.ForecastResult result = geminiResults.get(product.getId());
            if (result != null) {
                forecast.setPredictedDemand(round2(result.predictedDemand()));
                forecast.setRecommendedReorder(round2(result.recommendedReorder()));
                forecast.setConfidence(round2(result.confidence()));
                forecast.setAiReasoning(result.reasoning());
                forecast.setModelUsed("GEMINI_AI");
                log.info("Gemini forecast for {}: demand={}, reorder={}, confidence={}%",
                        product.getName(), result.predictedDemand(),
                        result.recommendedReorder(), result.confidence());
            } else {
                applyMovingAverage(forecast, product, salesMap.getOrDefault(product.getId(), List.of()));
            }

            forecast.setForecastPeriodDays(7);
            forecast.setGeneratedAt(Instant.now());
            saved.add(forecastRepository.save(forecast));
        }

        log.info("Generated/updated {} forecasts for user: {}", saved.size(), userId);
        return saved.stream()
                .map(f -> toResponse(f, productMap.get(f.getProductId())))
                .collect(Collectors.toList());
    }

    // ── Smart Reorder List ─────────────────────────────────────────────────
    public List<ReorderItemResponse> getReorderList(String userId) {
        List<Product> products = productRepository.findByUserIdAndIsActiveTrue(userId);
        if (products.isEmpty()) return List.of();

        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);

        // Gather last 7 days sales per product
        Map<String, List<Sale>> salesMap = new HashMap<>();
        for (Product p : products) {
            List<Sale> sales = saleRepository
                    .findByUserIdAndProductIdOrderBySaleDateDesc(userId, p.getId())
                    .stream()
                    .filter(s -> s.getSaleDate().isAfter(sevenDaysAgo))
                    .collect(Collectors.toList());
            salesMap.put(p.getId(), sales);
        }

        if (geminiService.isConfigured()) {
            try {
                List<GeminiService.ReorderItem> items = geminiService.generateReorderList(products, salesMap);
                return items.stream().map(item -> ReorderItemResponse.builder()
                        .productId(item.productId())
                        .productName(item.productName())
                        .unit(item.unit())
                        .currentStock(item.currentStock())
                        .orderQty(item.orderQty())
                        .urgency(item.urgency())
                        .reason(item.reason())
                        .build()
                ).collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Gemini reorder list failed, using threshold fallback: {}", e.getMessage());
            }
        }

        // ── Fallback: smart threshold-based reorder list ─────────────────
        // A product needs reorder if:
        //   1. Out of stock (always include), OR
        //   2. currentStock <= reorderThreshold (if threshold is set), OR
        //   3. threshold is null AND currentStock <= 10 (sensible default)
        return products.stream()
                .filter(p -> {
                    int stock = p.getCurrentStock() != null ? p.getCurrentStock() : 0;
                    if (stock == 0) return true;                          // always include OOS
                    if (p.getReorderThreshold() != null && p.getReorderThreshold() > 0) {
                        return stock <= p.getReorderThreshold();          // respect set threshold
                    }
                    return stock <= 10;                                   // default: <= 10 units
                })
                .map(p -> {
                    int stock = p.getCurrentStock() != null ? p.getCurrentStock() : 0;
                    int threshold = p.getReorderThreshold() != null ? p.getReorderThreshold() : 10;
                    int soldLast7 = salesMap.getOrDefault(p.getId(), List.of())
                            .stream().mapToInt(Sale::getQuantity).sum();
                    double orderQty = Math.max(
                            threshold * 2.0 - stock,
                            soldLast7 > 0 ? soldLast7 * 1.5 : threshold
                    );
                    String urgency = stock == 0 ? "HIGH"
                            : stock < threshold / 2.0 ? "HIGH" : "MEDIUM";
                    String reason  = stock == 0 ? "Out of stock"
                            : p.getReorderThreshold() != null ? "Below reorder threshold"
                            : "Low stock (auto-detected)";
                    return ReorderItemResponse.builder()
                            .productId(p.getId())
                            .productName(p.getName())
                            .unit(p.getUnit())
                            .currentStock(stock)
                            .orderQty(round2(orderQty))
                            .urgency(urgency)
                            .reason(reason)
                            .build();
                })
                .sorted(Comparator.comparing(r -> r.getUrgency().equals("HIGH") ? 0 : 1))
                .collect(Collectors.toList());
    }

    // ── AI Advisor Chat ────────────────────────────────────────────────────
    public String askAdvisor(String userId, String question) {
        if (!geminiService.isConfigured()) {
            return "AI advisor is not configured. Please add your GEMINI_API_KEY to the backend .env file.";
        }

        // Build store context
        List<Product> products = productRepository.findByUserIdAndIsActiveTrue(userId);
        long lowStock  = products.stream()
                .filter(p -> p.getReorderThreshold() != null && p.getCurrentStock() <= p.getReorderThreshold())
                .count();
        long outOfStock = products.stream().filter(p -> p.getCurrentStock() == 0).count();

        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Sale> weekSales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, weekAgo);
        double weekRevenue   = weekSales.stream().mapToDouble(s -> s.getTotalAmount() != null ? s.getTotalAmount() : 0).sum();

        String context = String.format(
                "Total products: %d | Low stock items: %d | Out of stock: %d | " +
                "Sales this week: %d transactions | Revenue this week: ₹%.0f",
                products.size(), lowStock, outOfStock, weekSales.size(), weekRevenue
        );

        try {
            return geminiService.askAdvisor(question, context);
        } catch (GeminiService.GeminiRateLimitException e) {
            return "Daily Gemini quota exhausted. Please get a fresh API key from aistudio.google.com " +
                    "and update GEMINI_API_KEY in your backend .env file, then restart the backend.";
        } catch (Exception e) {
            log.error("AI advisor error: {}", e.getMessage());
            return "AI advisor is temporarily unavailable. Please try again in a few minutes.";
        }
    }

    // ── All forecasts (latest per product, deduplicated) ──────────────────
    public List<ForecastResponse> getAllForecasts(String userId) {
        // Build a productId -> Product map to enrich names
        List<Product> allProducts = productRepository.findByUserIdAndIsActiveTrue(userId);
        Map<String, Product> productMap = allProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        return forecastRepository.findByUserIdOrderByGeneratedAtDesc(userId)
                .stream()
                .collect(Collectors.toMap(
                        Forecast::getProductId,
                        f -> f,
                        (existing, replacement) -> existing
                ))
                .values()
                .stream()
                .map(f -> toResponse(f, productMap.get(f.getProductId())))
                .collect(Collectors.toList());
    }

    public ForecastResponse getProductForecast(String userId, String productId) {
        return forecastRepository.findTopByUserIdAndProductIdOrderByGeneratedAtDesc(userId, productId)
                .map(this::toResponse)
                .orElseGet(() -> {
                    ForecastResponse stub = new ForecastResponse();
                    stub.setProductId(productId);
                    stub.setModelUsed("NO_DATA");
                    stub.setPredictedDemand(0.0);
                    return stub;
                });
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private void applyMovingAverage(Forecast forecast, Product product, List<Sale> sales) {
        if (sales.isEmpty()) {
            forecast.setModelUsed("NO_DATA");
            forecast.setPredictedDemand(0.0);
            forecast.setRecommendedReorder(0.0);
            forecast.setConfidence(0.0);
            forecast.setAiReasoning("No sales data available for this product.");
            return;
        }
        double totalQty = sales.stream().mapToInt(Sale::getQuantity).sum();
        double avgDaily = totalQty / 30.0;
        double weekly   = avgDaily * 7;
        double reorder  = Math.max(0, (weekly - product.getCurrentStock()) * 1.2);
        forecast.setPredictedDemand(round2(weekly));
        forecast.setRecommendedReorder(round2(reorder));
        forecast.setConfidence(40.0);
        forecast.setModelUsed("MOVING_AVG");
        forecast.setAiReasoning("Based on 7-day moving average of last 30 days of sales.");
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private ForecastResponse toResponse(Forecast f, Product product) {
        return ForecastResponse.builder()
                .id(f.getId()).userId(f.getUserId()).productId(f.getProductId())
                .productName(product != null ? product.getName() : f.getProductId())
                .unit(product != null ? product.getUnit() : "units")
                .modelUsed(f.getModelUsed()).forecastPeriodDays(f.getForecastPeriodDays())
                .predictedDemand(f.getPredictedDemand())
                .recommendedReorder(f.getRecommendedReorder())
                .confidence(f.getConfidence())
                .aiReasoning(f.getAiReasoning())
                .generatedAt(f.getGeneratedAt())
                .build();
    }

    private ForecastResponse toResponse(Forecast f) {
        // Fallback — product not pre-loaded, do individual lookup
        Product product = productRepository.findById(f.getProductId()).orElse(null);
        return toResponse(f, product);
    }
}
