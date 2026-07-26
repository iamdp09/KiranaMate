package com.kiranaai.dto.response;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InventoryLogResponse {
    private String id;
    private String userId;
    private String productId;
    private String changeType;
    private Integer quantityBefore;
    private Integer quantityChange;
    private Integer quantityAfter;
    private String note;
    private Instant createdAt;
}
