package com.kiranaai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "whatsapp_sessions")
public class WhatsAppSession {

    @Id
    private String id;

    @Indexed
    private String phone;

    private String userId;

    @Builder.Default
    private SessionState sessionState = SessionState.IDLE;

    private Map<String, Object> pendingAction;

    private Instant lastMessageAt;
    private Instant expiresAt;
}
