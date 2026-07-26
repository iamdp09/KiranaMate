package com.kiranaai.dto.response;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ForecastResponse {
    private String id;
    private String userId;
    private String productId;
    private String modelUsed;
    private Integer forecastPeriodDays;
    private Double predictedDemand;
    private Double recommendedReorder;
    private Double confidence;
    private Instant generatedAt;
}
