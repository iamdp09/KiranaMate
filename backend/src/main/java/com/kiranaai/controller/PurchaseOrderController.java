package com.kiranaai.controller;

import com.kiranaai.dto.request.CreatePurchaseOrderRequest;
import com.kiranaai.dto.response.*;
import com.kiranaai.security.UserPrincipal;
import com.kiranaai.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Purchase Orders", description = "Supplier purchase order management")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<PurchaseOrderResponse>>> getAll(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(purchaseOrderService.getAllOrders(user.getId(), page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> create(
            @AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody CreatePurchaseOrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase order created", purchaseOrderService.createOrder(user.getId(), req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getById(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseOrderService.getOrderById(user.getId(), id)));
    }

    @PatchMapping("/{id}/deliver")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> markDelivered(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Order marked as delivered",
                purchaseOrderService.markDelivered(user.getId(), id)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> cancel(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Order cancelled",
                purchaseOrderService.cancelOrder(user.getId(), id)));
    }
}
