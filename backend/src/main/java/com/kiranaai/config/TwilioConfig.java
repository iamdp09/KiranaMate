package com.kiranaai.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Getter
@Configuration
public class TwilioConfig {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.whatsapp-from}")
    private String whatsappFrom;

    @Value("${twilio.sandbox-number:+14155238886}")
    private String sandboxNumber;

    @Value("${twilio.sandbox-keyword:join sandbox-keyword}")
    private String sandboxKeyword;

    @Value("${twilio.enabled:false}")
    private boolean enabled;

    @PostConstruct
    public void init() {
        if (enabled) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio initialized with account SID: {}",
                    accountSid.substring(0, Math.min(accountSid.length(), 6)) + "***");
        } else {
            log.info("Twilio is disabled — skipping initialization");
        }
    }
}
