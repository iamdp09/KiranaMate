package com.kiranaai.dto.request;

import jakarta.validation.constraints.*;

public record CreateSupplierRequest(
        @NotBlank String name,
        String contactPerson,
        @NotBlank String phone,
        String email,
        String address
) {}
