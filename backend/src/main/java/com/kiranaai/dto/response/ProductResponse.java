package com.kiranaai.dto.response;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
    private String id;
    private String userId;
    private String name;
    private String sku;
    private String category;
    private String unit;
    private Double sellingPrice;
    private Double costPrice;
    private Integer currentStock;
    private Integer reorderThreshold;
    private Integer maxStock;
    private String supplierId;
    private String imageUrl;
    private boolean isActive;
    private boolean isLowStock;
    private Instant createdAt;
    private Instant updatedAt;
}
