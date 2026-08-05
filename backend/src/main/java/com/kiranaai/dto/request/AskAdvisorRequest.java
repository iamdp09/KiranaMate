package com.kiranaai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AskAdvisorRequest(
        @NotBlank String question
) {}
