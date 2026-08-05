package com.kiranaai.dto.response;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReorderItemResponse {
    private String productId;
    private String productName;
    private String unit;
    private int currentStock;
    private double orderQty;
    private String urgency;   // HIGH | MEDIUM | LOW
    private String reason;
}
