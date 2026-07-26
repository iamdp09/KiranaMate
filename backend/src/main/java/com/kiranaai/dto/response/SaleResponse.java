package com.kiranaai.dto.response;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SaleResponse {
    private String id;
    private String userId;
    private String productId;
    private String productName;
    private Integer quantity;
    private String unit;
    private Double sellingPrice;
    private Double totalAmount;
    private Instant saleDate;
    private String source;
    private Instant createdAt;
}
