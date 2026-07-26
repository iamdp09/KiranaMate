package com.kiranaai.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PurchaseOrderResponse {
    private String id;
    private String userId;
    private String supplierId;
    private String supplierName;
    private List<PurchaseOrderItemResponse> items;
    private Double totalAmount;
    private String status;
    private Instant orderedAt;
    private Instant deliveredAt;
    private Instant createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PurchaseOrderItemResponse {
        private String productId;
        private String productName;
        private Integer quantityOrdered;
        private Integer quantityReceived;
        private Double costPrice;
    }
}
