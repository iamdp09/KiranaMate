package com.kiranaai.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreatePurchaseOrderRequest {

    @NotBlank
    private String supplierId;

    @NotEmpty
    private List<PurchaseOrderItemRequest> items;

    public record PurchaseOrderItemRequest(
            @NotBlank String productId,
            @NotNull @Positive Integer quantityOrdered,
            @NotNull @Positive Double costPrice
    ) {}
}
