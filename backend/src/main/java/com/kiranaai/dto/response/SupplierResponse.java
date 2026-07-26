package com.kiranaai.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SupplierResponse {
    private String id;
    private String userId;
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private List<String> productsSupplied;
    private boolean isActive;
    private Instant createdAt;
}
