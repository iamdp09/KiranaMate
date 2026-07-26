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
@Document(collection = "sales")
public class Sale {

    @Id
    private String id;

    private String userId;
    private String productId;
    private String productName;
    private String unit;

    private Integer quantity;
    private Double sellingPrice;
    private Double totalAmount;

    private Instant saleDate;

    @Builder.Default
    private SaleSource source = SaleSource.MANUAL;

    @CreatedDate
    private Instant createdAt;
}
