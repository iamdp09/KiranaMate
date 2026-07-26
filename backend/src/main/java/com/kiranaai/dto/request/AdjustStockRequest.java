package com.kiranaai.dto.request;

import jakarta.validation.constraints.*;

public record AdjustStockRequest(
        @NotNull Integer quantityChange,
        String note
) {}
