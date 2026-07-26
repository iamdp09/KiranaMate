package com.kiranaai.dto.response;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String storeName;
    private String storeAddress;
    private String role;
    private boolean whatsappVerified;
    private Instant createdAt;
}
