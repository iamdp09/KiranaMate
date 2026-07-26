package com.kiranaai.controller;

import com.kiranaai.config.TwilioConfig;
import com.kiranaai.dto.response.ApiResponse;
import com.kiranaai.security.UserPrincipal;
import com.kiranaai.service.WhatsAppService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/whatsapp")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "WhatsApp", description = "WhatsApp chatbot webhook and messaging")
public class WhatsAppController {

    private final WhatsAppService whatsAppService;
    private final TwilioConfig twilioConfig;

    /**
     * Public endpoint — returns sandbox connection info for the QR code UI.
     * No auth required so the page can show it before login too.
     */
    @GetMapping("/connect-info")
    public ResponseEntity<ApiResponse<Map<String, String>>> getConnectInfo() {
        String number = twilioConfig.getSandboxNumber().replaceAll("[^\\d+]", "");
        String keyword = twilioConfig.getSandboxKeyword();
        // WhatsApp deep-link: opens WhatsApp with pre-filled text
        String waLink = "https://wa.me/" + number.replace("+", "") + "?text=" +
                java.net.URLEncoder.encode(keyword, java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok(ApiResponse.success("Connect info", Map.of(
                "sandboxNumber", twilioConfig.getSandboxNumber(),
                "sandboxKeyword", keyword,
                "whatsappLink", waLink
        )));
    }


    /**
     * Twilio webhook — receives incoming WhatsApp messages.
     * Public endpoint (no JWT required), secured by Twilio signature.
     * Returns TwiML XML response.
     */
    @PostMapping(value = "/webhook", produces = MediaType.APPLICATION_XML_VALUE)
    public String webhook(
            @RequestParam(value = "From", defaultValue = "") String from,
            @RequestParam(value = "Body", defaultValue = "") String body) {
        log.info("WhatsApp webhook: from={}, body={}", from, body);
        String cleanPhone = from.replace("whatsapp:", "").trim();
        String response = whatsAppService.processIncomingWebhook(cleanPhone, body);
        // Return TwiML
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
               "<Response><Message>" + escapeXml(response) + "</Message></Response>";
    }

    /**
     * Send a WhatsApp message manually (for admin/testing).
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<String>> send(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String message = body.get("message");
        whatsAppService.sendMessage(phone, message);
        return ResponseEntity.ok(ApiResponse.success("Message queued", "OK"));
    }

    /**
     * Simulate a chatbot conversation from the web UI demo page.
     */
    @PostMapping("/demo/simulate")
    public ResponseEntity<ApiResponse<String>> simulate(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody Map<String, String> body) {
        String phone = body.getOrDefault("phone", user.getUsername());
        String message = body.get("message");
        String response = whatsAppService.simulateMessage(phone, message);
        return ResponseEntity.ok(ApiResponse.success("Bot response", response));
    }

    /**
     * WhatsApp message logs (placeholder for future implementation).
     */
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<Object>>> getLogs(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success("Logs", List.of()));
    }

    /**
     * Check chatbot status.
     */
    @GetMapping("/chatbot/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "enabled", true,
                "mode", "DEMO",
                "webhook", "/api/v1/whatsapp/webhook"
        )));
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&apos;");
    }
}
