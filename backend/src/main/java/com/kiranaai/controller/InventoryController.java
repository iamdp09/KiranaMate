package com.kiranaai.controller;

import com.kiranaai.dto.request.AdjustStockRequest;
import com.kiranaai.dto.response.*;
import com.kiranaai.security.UserPrincipal;
import com.kiranaai.service.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Stock management and audit logs")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllInventory(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllInventory(user.getId())));
    }

    @PatchMapping("/{productId}/adjust")
    public ResponseEntity<ApiResponse<ProductResponse>> adjustStock(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable String productId,
            @Valid @RequestBody AdjustStockRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted",
                inventoryService.adjustStock(user.getId(), productId, req)));
    }

    @PatchMapping("/{productId}/restock")
    public ResponseEntity<ApiResponse<ProductResponse>> restock(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable String productId,
            @RequestBody Map<String, Object> body) {
        int qty = Integer.parseInt(body.getOrDefault("qty", 0).toString());
        String note = (String) body.get("note");
        return ResponseEntity.ok(ApiResponse.success("Product restocked",
                inventoryService.restockProduct(user.getId(), productId, qty, note)));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<PagedResponse<InventoryLogResponse>>> getAllLogs(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllLogs(user.getId(), page, size)));
    }

    @GetMapping("/{productId}/logs")
    public ResponseEntity<ApiResponse<List<InventoryLogResponse>>> getProductLogs(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable String productId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getProductLogs(user.getId(), productId)));
    }
}
