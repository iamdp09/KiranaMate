package com.kiranaai.controller;

import com.kiranaai.dto.request.AskAdvisorRequest;
import com.kiranaai.dto.response.ApiResponse;
import com.kiranaai.dto.response.ForecastResponse;
import com.kiranaai.dto.response.ReorderItemResponse;
import com.kiranaai.security.UserPrincipal;
import com.kiranaai.service.ForecastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forecasts")
@RequiredArgsConstructor
@Tag(name = "Forecasts", description = "AI-powered demand forecasting via Gemini")
public class ForecastController {

    private final ForecastService forecastService;

    @PostMapping("/generate")
    @Operation(summary = "Run AI forecast for all products")
    public ResponseEntity<ApiResponse<List<ForecastResponse>>> generate(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(
                "Forecasts generated", forecastService.generateForecasts(user.getId())));
    }

    @GetMapping
    @Operation(summary = "Get latest forecasts (deduplicated per product)")
    public ResponseEntity<ApiResponse<List<ForecastResponse>>> getAll(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(forecastService.getAllForecasts(user.getId())));
    }

    @GetMapping("/{productId}")
    @Operation(summary = "Get forecast for a specific product")
    public ResponseEntity<ApiResponse<ForecastResponse>> getByProduct(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success(
                forecastService.getProductForecast(user.getId(), productId)));
    }

    @GetMapping("/reorder-list")
    @Operation(summary = "Get AI-prioritized reorder list (what to buy today)")
    public ResponseEntity<ApiResponse<List<ReorderItemResponse>>> getReorderList(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(
                "Reorder list generated", forecastService.getReorderList(user.getId())));
    }

    @PostMapping("/ask")
    @Operation(summary = "Ask the AI advisor a business question")
    public ResponseEntity<ApiResponse<String>> askAdvisor(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody AskAdvisorRequest req) {
        String answer = forecastService.askAdvisor(user.getId(), req.question());
        return ResponseEntity.ok(ApiResponse.success("AI response", answer));
    }
}
