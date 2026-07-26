package com.kiranaai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record WhatsAppOtpRequest(
        @NotBlank String phone
) {}
