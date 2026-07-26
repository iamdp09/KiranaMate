package com.kiranaai.dto.request;

import jakarta.validation.constraints.*;

public record CreateSaleRequest(
        @NotBlank String productId,
        @NotNull @Positive Integer quantity,
        String source
) {}
