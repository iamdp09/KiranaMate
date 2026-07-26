package com.kiranaai.service;

import com.kiranaai.dto.response.ForecastResponse;
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
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;

    /**
     * Generates demand forecasts using Simple 7-day Moving Average.
     * This is a stub — replace with ML model in the future.
     */
    public List<ForecastResponse> generateForecasts(String userId) {
        List<Product> products = productRepository.findByUserIdAndIsActiveTrue(userId);
        Instant from = Instant.now().minus(30, ChronoUnit.DAYS);

        List<Forecast> forecasts = new ArrayList<>();

        for (Product product : products) {
            List<Sale> sales = saleRepository.findByUserIdAndProductIdOrderBySaleDateDesc(userId, product.getId())
                    .stream()
                    .filter(s -> s.getSaleDate().isAfter(from))
                    .collect(Collectors.toList());

            if (sales.isEmpty()) continue;

            // Calculate 7-day moving average
            double totalQty = sales.stream().mapToInt(Sale::getQuantity).sum();
            int daysWithData = Math.min(30, (int) ChronoUnit.DAYS.between(from, Instant.now()));
            double avgDailyDemand = daysWithData > 0 ? totalQty / daysWithData : 0;
            double weeklyForecast = avgDailyDemand * 7;

            // Reorder formula: max(0, (forecast - current stock) * 1.2)
            double reorderQty = Math.max(0, (weeklyForecast - product.getCurrentStock()) * 1.2);

            // ── UPSERT: update existing forecast or create new one ──
            Forecast forecast = forecastRepository
                    .findTopByUserIdAndProductIdOrderByGeneratedAtDesc(userId, product.getId())
                    .orElseGet(() -> Forecast.builder()
                            .userId(userId)
                            .productId(product.getId())
                            .build());

            forecast.setForecastPeriodDays(7);
            forecast.setPredictedDemand(Math.round(weeklyForecast * 100.0) / 100.0);
            forecast.setRecommendedReorder(Math.round(reorderQty * 100.0) / 100.0);
            forecast.setModelUsed("MOVING_AVG");
            forecast.setConfidence(null);
            forecast.setGeneratedAt(Instant.now());

            forecasts.add(forecastRepository.save(forecast));
        }

        log.info("Generated/updated {} forecasts for user: {}", forecasts.size(), userId);
        return forecasts.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ForecastResponse> getAllForecasts(String userId) {
        // Return only the latest forecast per product (no duplicates)
        return forecastRepository.findByUserIdOrderByGeneratedAtDesc(userId)
                .stream()
                .collect(Collectors.toMap(
                        Forecast::getProductId,   // key = productId
                        f -> f,                   // value = forecast
                        (existing, replacement) -> existing  // keep first (latest) per product
                ))
                .values()
                .stream()
                .map(this::toResponse)
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

    private ForecastResponse toResponse(Forecast f) {
        return ForecastResponse.builder()
                .id(f.getId()).userId(f.getUserId()).productId(f.getProductId())
                .modelUsed(f.getModelUsed()).forecastPeriodDays(f.getForecastPeriodDays())
                .predictedDemand(f.getPredictedDemand())
                .recommendedReorder(f.getRecommendedReorder())
                .confidence(f.getConfidence())
                .generatedAt(f.getGeneratedAt())
                .build();
    }
}
