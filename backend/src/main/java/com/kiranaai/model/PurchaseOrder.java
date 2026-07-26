package com.kiranaai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "purchase_orders")
public class PurchaseOrder {

    @Id
    private String id;

    private String userId;
    private String supplierId;
    private String supplierName;

    private List<PurchaseOrderItem> items;

    private Double totalAmount;

    @Builder.Default
    private PurchaseOrderStatus status = PurchaseOrderStatus.PENDING;

    private Instant orderedAt;
    private Instant deliveredAt;

    @CreatedDate
    private Instant createdAt;

    // -------------------------------------------------------------------------
    // Embedded line-item document
    // -------------------------------------------------------------------------

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseOrderItem {

        private String productId;
        private String productName;
        private Integer quantityOrdered;
        private Integer quantityReceived;
        private Double costPrice;
    }
}
