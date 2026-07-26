package com.kiranaai.controller;

import com.kiranaai.dto.request.CreateSaleRequest;
import com.kiranaai.dto.response.*;
import com.kiranaai.security.UserPrincipal;
import com.kiranaai.service.SaleService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
@Tag(name = "Sales", description = "Sales recording and history")
public class SaleController {

    private final SaleService saleService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<SaleResponse>>> getAll(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(saleService.getAllSales(user.getId(), page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SaleResponse>> recordSale(
            @AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody CreateSaleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sale recorded", saleService.recordSale(user.getId(), req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleResponse>> getById(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(saleService.getSaleById(user.getId(), id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
        saleService.deleteSale(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-product/{productId}")
    public ResponseEntity<ApiResponse<List<SaleResponse>>> getByProduct(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success(saleService.getSalesByProduct(user.getId(), productId)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam Instant from,
            @RequestParam Instant to) {
        return ResponseEntity.ok(ApiResponse.success(saleService.getSalesSummary(user.getId(), from, to)));
    }
}
