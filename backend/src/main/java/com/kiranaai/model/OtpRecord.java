package com.kiranaai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "otp_records")
public class OtpRecord {

    @Id
    private String id;

    private String phone;
    private String otp;

    @Builder.Default
    private boolean used = false;

    @CreatedDate
    private Instant createdAt;

    /**
     * MongoDB TTL index — the document is automatically deleted by MongoDB
     * once this timestamp is reached (expireAfterSeconds = 0 means "expire
     * at the exact moment stored in this field").
     */
    @Indexed(expireAfterSeconds = 0)
    private Instant expiresAt;
}
