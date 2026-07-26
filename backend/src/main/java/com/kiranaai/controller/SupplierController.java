package com.kiranaai.controller;

import com.kiranaai.dto.request.CreateSupplierRequest;
import com.kiranaai.dto.response.ApiResponse;
import com.kiranaai.dto.response.SupplierResponse;
import com.kiranaai.security.UserPrincipal;
import com.kiranaai.service.SupplierService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers", description = "Supplier management")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getAll(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getAllSuppliers(user.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SupplierResponse>> create(
            @AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody CreateSupplierRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Supplier added", supplierService.createSupplier(user.getId(), req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> getById(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getSupplierById(user.getId(), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> update(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable String id,
            @Valid @RequestBody CreateSupplierRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Supplier updated", supplierService.updateSupplier(user.getId(), id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
        supplierService.deleteSupplier(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
