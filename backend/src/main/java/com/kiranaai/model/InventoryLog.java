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
@Document(collection = "inventory_logs")
public class InventoryLog {

    @Id
    private String id;

    private String userId;
    private String productId;
    private String note;

    private InventoryChangeType changeType;

    private Integer quantityBefore;
    private Integer quantityChange;
    private Integer quantityAfter;

    @CreatedDate
    private Instant createdAt;
}
