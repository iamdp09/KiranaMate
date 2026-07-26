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
@Document(collection = "suppliers")
public class Supplier {

    @Id
    private String id;

    private String userId;
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;

    private List<String> productsSupplied;

    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    private Instant createdAt;
}
