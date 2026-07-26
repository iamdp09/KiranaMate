package com.kiranaai.controller;

import com.kiranaai.dto.response.ApiResponse;
import com.kiranaai.dto.response.ForecastResponse;
import com.kiranaai.security.UserPrincipal;
import com.kiranaai.service.ForecastService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forecasts")
@RequiredArgsConstructor
@Tag(name = "Forecasts", description = "Demand forecasting (Moving Avg stub — ML model coming soon)")
public class ForecastController {

    private final ForecastService forecastService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<List<ForecastResponse>>> generate(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success("Forecasts generated",
                forecastService.generateForecasts(user.getId())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ForecastResponse>>> getAll(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(forecastService.getAllForecasts(user.getId())));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ForecastResponse>> getByProduct(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastService.getProductForecast(user.getId(), productId)));
    }
}
