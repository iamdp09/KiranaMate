package com.kiranaai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "forecasts")
public class Forecast {

    @Id
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
