package com.kiranaai.dto.request;

import jakarta.validation.constraints.*;

public record CreateProductRequest(
        @NotBlank String name,
        String sku,
        @NotBlank String category,
        @NotBlank String unit,
        @NotNull @Positive Double sellingPrice,
        @NotNull @Positive Double costPrice,
        @NotNull @Min(0) Integer currentStock,
        @NotNull @Min(0) Integer reorderThreshold,
        Integer maxStock,
        String supplierId
) {}
