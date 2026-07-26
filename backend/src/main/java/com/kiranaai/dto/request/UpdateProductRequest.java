package com.kiranaai.dto.request;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UpdateProductRequest {
    private String name;
    private String sku;
    private String category;
    private String unit;
    private Double sellingPrice;
    private Double costPrice;
    private Integer reorderThreshold;
    private Integer maxStock;
    private String supplierId;
    private String imageUrl;
}
