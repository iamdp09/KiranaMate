package com.kiranaai.service;

import com.kiranaai.dto.response.DashboardStatsResponse;
import com.kiranaai.dto.response.ProductResponse;
import com.kiranaai.dto.response.SaleResponse;
import com.kiranaai.model.Product;
import com.kiranaai.model.Sale;
import com.kiranaai.repository.ProductRepository;
import com.kiranaai.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final ProductService productService;
    private final SaleService saleService;

    public DashboardStatsResponse getStats(String userId) {
        List<Product> allProducts = productRepository.findByUserIdAndIsActiveTrue(userId);
        long totalActiveProducts = allProducts.size();
        long lowStockCount = allProducts.stream()
                .filter(p -> p.getCurrentStock() != null && p.getReorderThreshold() != null
                        && p.getCurrentStock() <= p.getReorderThreshold())
                .count();

        double totalInventoryValue = allProducts.stream()
                .mapToDouble(p -> (p.getCostPrice() != null ? p.getCostPrice() : 0)
                        * (p.getCurrentStock() != null ? p.getCurrentStock() : 0))
                .sum();

        Instant todayStart = LocalDate.now(ZoneId.of("Asia/Kolkata"))
                .atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant();
        Instant weekStart = todayStart.minus(7, java.time.temporal.ChronoUnit.DAYS);
        Instant monthStart = todayStart.minus(30, java.time.temporal.ChronoUnit.DAYS);

        List<Sale> todaySales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, todayStart);
        List<Sale> weekSales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, weekStart);
        List<Sale> monthSales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, monthStart);

        double todayRevenue = todaySales.stream().mapToDouble(Sale::getTotalAmount).sum();
        double weekRevenue = weekSales.stream().mapToDouble(Sale::getTotalAmount).sum();
        double monthRevenue = monthSales.stream().mapToDouble(Sale::getTotalAmount).sum();

        return DashboardStatsResponse.builder()
                .totalProducts(totalActiveProducts)
                .totalActiveProducts(totalActiveProducts)
                .lowStockCount(lowStockCount)
                .todaySalesCount(todaySales.size())
                .todayRevenue(todayRevenue)
                .weekRevenue(weekRevenue)
                .monthRevenue(monthRevenue)
                .totalInventoryValue(totalInventoryValue)
                .build();
    }

    public List<SaleResponse> getRecentSales(String userId) {
        return saleRepository.findTop10ByUserIdOrderBySaleDateDesc(userId)
                .stream().map(saleService::toResponse).collect(Collectors.toList());
    }

    public List<ProductResponse> getLowStockAlerts(String userId) {
        return productRepository.findLowStockByUserId(userId)
                .stream().map(productService::toResponse).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRevenueChart(String userId, int days) {
        Instant from = Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);
        List<Sale> sales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, from);

        // Group by date
        Map<LocalDate, Double> revenueByDate = sales.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getSaleDate().atZone(ZoneId.of("Asia/Kolkata")).toLocalDate(),
                        Collectors.summingDouble(Sale::getTotalAmount)
                ));

        // Fill all days (including zero-revenue days)
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now(ZoneId.of("Asia/Kolkata")).minusDays(i);
            Map<String, Object> point = new HashMap<>();
            point.put("date", date.format(formatter));
            point.put("revenue", revenueByDate.getOrDefault(date, 0.0));
            result.add(point);
        }
        return result;
    }

    public List<Map<String, Object>> getTopProducts(String userId, int limit) {
        Instant from = Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS);
        List<Sale> sales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, from);

        Map<String, Long> salesCountByProduct = sales.stream()
                .collect(Collectors.groupingBy(Sale::getProductId, Collectors.summingLong(s -> s.getQuantity())));

        return salesCountByProduct.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(e -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("productId", e.getKey());
                    item.put("totalQuantitySold", e.getValue());
                    sales.stream().filter(s -> s.getProductId().equals(e.getKey())).findFirst()
                            .ifPresent(s -> item.put("productName", s.getProductName()));
                    item.put("totalRevenue", sales.stream()
                            .filter(s -> s.getProductId().equals(e.getKey()))
                            .mapToDouble(Sale::getTotalAmount).sum());
                    return item;
                })
                .collect(Collectors.toList());
    }
}
