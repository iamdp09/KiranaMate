package com.kiranaai.service;

import com.kiranaai.config.TwilioConfig;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    private final TwilioConfig twilioConfig;
    private final ChatbotService chatbotService;

    /**
     * Sends a WhatsApp message via Twilio. Falls back to demo mode log if Twilio is disabled.
     */
    public void sendMessage(String toPhone, String message) {
        if (twilioConfig.isEnabled()) {
            try {
                String toWhatsApp = toPhone.startsWith("whatsapp:") ? toPhone : "whatsapp:" + toPhone;
                Message.creator(
                        new PhoneNumber(toWhatsApp),
                        new PhoneNumber(twilioConfig.getWhatsappFrom()),
                        message
                ).create();
                log.info("WhatsApp sent to {}", toPhone);
            } catch (Exception e) {
                log.error("Failed to send WhatsApp message to {}: {}", toPhone, e.getMessage());
            }
        } else {
            log.info("[DEMO MODE] WhatsApp to {}: {}", toPhone, message);
        }
    }

    /**
     * Processes an incoming WhatsApp webhook message from Twilio.
     */
    public String processIncomingWebhook(String fromPhone, String messageBody) {
        log.info("Incoming WhatsApp from {}: {}", fromPhone, messageBody);
        String response = chatbotService.processMessage(fromPhone, messageBody);
        // Don't send via Twilio here — TwiML response is returned directly from controller
        return response;
    }

    /**
     * Simulate a chatbot message for the web UI demo.
     */
    public String simulateMessage(String phone, String message) {
        return chatbotService.processMessage(phone, message);
    }
}
