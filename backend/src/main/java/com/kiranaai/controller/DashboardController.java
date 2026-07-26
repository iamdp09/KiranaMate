package com.kiranaai.controller;

import com.kiranaai.dto.response.*;
import com.kiranaai.security.UserPrincipal;
import com.kiranaai.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard stats and analytics")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats(user.getId())));
    }

    @GetMapping("/recent-sales")
    public ResponseEntity<ApiResponse<List<SaleResponse>>> getRecentSales(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getRecentSales(user.getId())));
    }

    @GetMapping("/low-stock-alerts")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockAlerts(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getLowStockAlerts(user.getId())));
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueChart(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getRevenueChart(user.getId(), days)));
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopProducts(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getTopProducts(user.getId(), limit)));
    }
}
