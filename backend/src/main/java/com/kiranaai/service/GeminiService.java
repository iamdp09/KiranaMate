package com.kiranaai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kiranaai.model.Product;
import com.kiranaai.model.Sale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String baseUrl;

    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equals("YOUR_GEMINI_API_KEY_HERE");
    }

    // ── 1. Per-product forecast ─────────────────────────────────────────────
    public record ForecastResult(
            double predictedDemand,
            double recommendedReorder,
            double confidence,
            String reasoning
    ) {}

    public ForecastResult analyzeForecast(Product product, List<Sale> recentSales) {
        if (!isConfigured()) throw new IllegalStateException("Gemini API key not configured");

        // Build concise sales summary string
        Map<String, Integer> salesByDate = new LinkedHashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MMM");
        recentSales.forEach(s -> {
            String date = fmt.format(s.getSaleDate().atZone(java.time.ZoneOffset.UTC));
            salesByDate.merge(date, s.getQuantity(), Integer::sum);
        });
        String salesStr = salesByDate.entrySet().stream()
                .map(e -> e.getKey() + ":" + e.getValue() + product.getUnit())
                .collect(Collectors.joining(", "));

        int totalSold = recentSales.stream().mapToInt(Sale::getQuantity).sum();

        String prompt = String.format("""
                You are a demand forecasting engine for a Kirana (Indian grocery) store.
                Analyze the following product and predict demand for the next 7 days.
                
                PRODUCT:
                - Name: %s
                - Category: %s
                - Unit: %s
                - Current Stock: %d %s
                - Minimum Stock Level (reorder point): %d %s
                - Total sold in last 30 days: %d %s
                - Daily sales (last 30 days): %s
                
                TASK:
                Return ONLY a valid JSON object (no markdown, no explanation outside JSON):
                {
                  "predictedDemand": <number — predicted units needed in next 7 days>,
                  "recommendedReorder": <number — units to order NOW to stay safe>,
                  "confidence": <number 0-100 — your confidence percentage>,
                  "reasoning": "<1-2 sentence plain English explanation why>"
                }
                
                Rules:
                - If current stock is below reorder point, recommendedReorder should be higher
                - Account for weekends having higher sales in grocery stores
                - confidence should reflect data quality (less history = lower confidence)
                """,
                product.getName(),
                product.getCategory() != null ? product.getCategory() : "General",
                product.getUnit(),
                product.getCurrentStock(), product.getUnit(),
                product.getReorderThreshold() != null ? product.getReorderThreshold() : 0, product.getUnit(),
                totalSold, product.getUnit(),
                salesStr.isEmpty() ? "no data" : salesStr
        );

        String raw = callGemini(prompt);
        return parseForecastResult(raw);
    }

    // ── 1b. BATCH forecast — all products in ONE API call ──────────────────
    public Map<String, ForecastResult> analyzeAllForecasts(
            List<Product> products, Map<String, List<Sale>> salesMap) {

        if (!isConfigured()) throw new IllegalStateException("Gemini API key not configured");

        // Build compact product summaries
        StringBuilder sb = new StringBuilder();
        for (Product p : products) {
            List<Sale> sales = salesMap.getOrDefault(p.getId(), List.of());
            int totalSold = sales.stream().mapToInt(Sale::getQuantity).sum();
            sb.append(String.format(
                "- id:%s name:%s stock:%d/%s reorder:%d sold30d:%d%n",
                p.getId(), p.getName(),
                p.getCurrentStock(), p.getUnit(),
                p.getReorderThreshold() != null ? p.getReorderThreshold() : 0,
                totalSold
            ));
        }

        String prompt = String.format("""
                You are a demand forecasting engine for a Kirana (Indian grocery) store.
                Forecast demand for the NEXT 7 DAYS for EACH product listed below.

                PRODUCTS (id, name, currentStock/unit, reorderThreshold, soldLast30Days):
                %s

                Return a JSON ARRAY — one entry per product, in the SAME order:
                [
                  {
                    "productId": "<same id from input>",
                    "predictedDemand": <number — units expected in next 7 days>,
                    "recommendedReorder": <units to order now to stay safe>,
                    "confidence": <0-100>,
                    "reasoning": "<1 sentence>"
                  }
                ]

                Rules:
                - Base predictions on sold30d patterns
                - If stock < reorderThreshold, recommendedReorder must be higher
                - Products with 0 sales: predictedDemand=0, confidence=20, reasoning="No sales history"
                - Return ONLY the JSON array, no extra text.
                """, sb.toString());

        String raw = callGemini(prompt);
        Map<String, ForecastResult> results = new LinkedHashMap<>();
        try {
            String json = extractJson(raw, true);
            JsonNode arr = objectMapper.readTree(json);
            if (!arr.isArray()) return results;
            for (JsonNode node : arr) {
                String pid = node.path("productId").asText();
                if (!pid.isBlank()) {
                    results.put(pid, new ForecastResult(
                            Math.max(0, node.path("predictedDemand").asDouble(0)),
                            Math.max(0, node.path("recommendedReorder").asDouble(0)),
                            Math.min(100, node.path("confidence").asDouble(50)),
                            node.path("reasoning").asText("AI forecast")
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse batch forecast JSON. Raw:\n{}", raw);
        }
        return results;
    }

    // ── 2. Smart Reorder List ───────────────────────────────────────────────
    public record ReorderItem(
            String productId,
            String productName,
            String unit,
            int currentStock,
            double orderQty,
            String urgency,        // HIGH | MEDIUM | LOW
            String reason
    ) {}

    public List<ReorderItem> generateReorderList(List<Product> products, Map<String, List<Sale>> salesByProduct) {
        if (!isConfigured()) throw new IllegalStateException("Gemini API key not configured");
        if (products.isEmpty()) return List.of();

        // Build products JSON for prompt
        StringBuilder productsInfo = new StringBuilder();
        for (Product p : products) {
            List<Sale> sales = salesByProduct.getOrDefault(p.getId(), List.of());
            int soldLast7 = sales.stream().mapToInt(Sale::getQuantity).sum();
            productsInfo.append(String.format(
                    "- id:%s | name:%s | stock:%d %s | reorderAt:%d | sold7d:%d\n",
                    p.getId(), p.getName(), p.getCurrentStock(), p.getUnit(),
                    p.getReorderThreshold() != null ? p.getReorderThreshold() : 0,
                    soldLast7
            ));
        }

        String prompt = String.format("""
                You are an inventory advisor for a Kirana (Indian grocery) store.
                Analyze the following products and create a prioritized reorder list.
                
                PRODUCTS (id | name | currentStock | reorderThreshold | soldLast7Days):
                %s
                
                TASK:
                Return ONLY a valid JSON array of products that need reordering.
                Only include products where stock is low OR will run out within 7 days.
                Sort by urgency (HIGH first).
                
                Format (no markdown, pure JSON array):
                [
                  {
                    "productId": "<id>",
                    "productName": "<name>",
                    "orderQty": <number to order>,
                    "urgency": "HIGH" | "MEDIUM" | "LOW",
                    "reason": "<short reason, max 10 words>"
                  }
                ]
                
                Urgency rules:
                - HIGH: stock = 0 or will run out in < 3 days
                - MEDIUM: stock below reorder threshold or < 5 days runway
                - LOW: approaching reorder threshold
                """,
                productsInfo
        );

        String raw = callGemini(prompt);
        return parseReorderList(raw, products);
    }

    // ── Custom exception for rate limiting ─────────────────────────────────
    public static class GeminiRateLimitException extends RuntimeException {
        private final int retryAfterSeconds;
        public GeminiRateLimitException(int retryAfterSeconds) {
            super("Gemini daily quota exhausted. Retry in " + retryAfterSeconds + "s");
            this.retryAfterSeconds = retryAfterSeconds;
        }
        public int getRetryAfterSeconds() { return retryAfterSeconds; }
    }

    // ── 3. AI Advisor chat ──────────────────────────────────────────────────
    public String askAdvisor(String question, String storeContext) {
        if (!isConfigured()) return "Gemini API key not configured. Add GEMINI_API_KEY to your .env file.";

        String prompt = String.format("""
                You are KiranaAI — an intelligent business advisor for a Kirana (Indian grocery) store.
                Be concise, practical, and specific to Indian grocery retail.
                
                STORE CONTEXT:
                %s
                
                USER QUESTION: %s
                
                Answer in 3-5 sentences max. Be actionable and specific.
                """,
                storeContext, question
        );

        return callGeminiText(prompt);
    }

    // ── Internal: call Gemini for structured JSON responses ────────────────
    private String callGemini(String prompt) {
        return callGeminiInternal(prompt, true);
    }

    // ── Internal: call Gemini for plain text (advisor chat) ────────────────
    private String callGeminiText(String prompt) {
        return callGeminiInternal(prompt, false);
    }

    private String callGeminiInternal(String prompt, boolean forceJson) {
        String url = baseUrl + "/" + model + ":generateContent?key=" + apiKey;
        log.info("Calling Gemini API: model={}, url prefix={}", model, baseUrl);

        // Build generation config
        Map<String, Object> genConfig = new java.util.LinkedHashMap<>();
        genConfig.put("temperature", forceJson ? 0.1 : 0.7);
        // JSON forecasts need less tokens; chat advisor needs more for full sentences
        genConfig.put("maxOutputTokens", forceJson ? 1024 : 2048);
        if (forceJson) {
            // Force Gemini to return ONLY valid JSON — no markdown fences, no explanation
            genConfig.put("responseMimeType", "application/json");
        }

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
        body.put("generationConfig", genConfig);

        try {
            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 429) {
                // Extract retry-after seconds from Gemini error body
                int retryAfter = 60;
                try {
                    JsonNode errBody = objectMapper.readTree(response.body());
                    JsonNode details  = errBody.path("error").path("details");
                    for (JsonNode d : details) {
                        if (d.has("retryDelay")) {
                            String delay = d.path("retryDelay").asText("60s");
                            retryAfter = Integer.parseInt(delay.replace("s", "").trim());
                            break;
                        }
                    }
                } catch (Exception ignored) {}
                log.warn("Gemini rate limited. Retry after {}s", retryAfter);
                throw new GeminiRateLimitException(retryAfter);
            }

            if (response.statusCode() != 200) {
                log.error("Gemini API error HTTP {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Gemini API returned HTTP " + response.statusCode()
                        + " — check your GEMINI_API_KEY and GEMINI_MODEL in .env");
            }

            JsonNode root = objectMapper.readTree(response.body());
            // Check for API-level errors in 200 response
            if (root.has("error")) {
                String errMsg = root.path("error").path("message").asText("Unknown error");
                log.error("Gemini API error in response: {}", errMsg);
                throw new RuntimeException("Gemini error: " + errMsg);
            }

            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            log.info("Gemini raw response (first 300 chars): {}",
                    text.length() > 300 ? text.substring(0, 300) + "..." : text);
            return text;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Gemini HTTP call failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }

    // ── Parsers ─────────────────────────────────────────────────────────────

    /** Extracts the first JSON object or array from a raw string (handles markdown fences) */
    private String extractJson(String raw, boolean expectArray) {
        if (raw == null) return expectArray ? "[]" : "{}";
        // 1. Try stripping markdown code fences first
        String cleaned = raw.replaceAll("(?s)```json\\s*", "")
                            .replaceAll("(?s)```\\s*", "")
                            .trim();
        // 2. Use regex to find first { } or [ ] block
        char open  = expectArray ? '[' : '{';
        char close = expectArray ? ']' : '}';
        int start  = cleaned.indexOf(open);
        if (start < 0) {
            // try the other type
            start = cleaned.indexOf(expectArray ? '{' : '[');
            if (start < 0) return expectArray ? "[]" : "{}";
            open  = expectArray ? '{' : '[';
            close = expectArray ? '}' : ']';
        }
        int depth = 0;
        for (int i = start; i < cleaned.length(); i++) {
            char c = cleaned.charAt(i);
            if (c == open)  depth++;
            if (c == close) depth--;
            if (depth == 0) return cleaned.substring(start, i + 1);
        }
        return cleaned; // fallback: return whole cleaned string
    }

    private ForecastResult parseForecastResult(String raw) {
        log.debug("Gemini raw forecast response: {}", raw);
        try {
            String json = extractJson(raw, false);
            JsonNode node = objectMapper.readTree(json);
            double demand  = node.path("predictedDemand").asDouble(-1);
            double reorder = node.path("recommendedReorder").asDouble(-1);
            // If keys not found try alternate names Gemini sometimes uses
            if (demand  < 0) demand  = node.path("predicted_demand").asDouble(0);
            if (reorder < 0) reorder = node.path("recommended_reorder").asDouble(0);
            String reasoning = node.path("reasoning").asText(null);
            if (reasoning == null) reasoning = node.path("reason").asText("AI forecast generated");
            return new ForecastResult(
                    Math.max(0, demand),
                    Math.max(0, reorder),
                    Math.min(100, node.path("confidence").asDouble(60)),
                    reasoning
            );
        } catch (Exception e) {
            log.warn("Failed to parse Gemini forecast JSON. Raw response was:\n{}", raw);
            return new ForecastResult(0, 0, 30, "Parsing error — check backend logs for Gemini response");
        }
    }

    private List<ReorderItem> parseReorderList(String raw, List<Product> products) {
        log.debug("Gemini raw reorder response: {}", raw);
        try {
            String json = extractJson(raw, true);
            // If Gemini wrapped the array in an object like { "items": [...] }
            JsonNode node = objectMapper.readTree(json);
            JsonNode arr  = node;
            if (node.isObject()) {
                if      (node.has("items"))      arr = node.get("items");
                else if (node.has("reorderList")) arr = node.get("reorderList");
                else if (node.has("products"))   arr = node.get("products");
            }
            if (!arr.isArray()) return List.of();

            List<ReorderItem> result = new ArrayList<>();
            Map<String, Product> productMap = products.stream()
                    .collect(Collectors.toMap(Product::getId, p -> p));
            for (JsonNode item : arr) {
                String pid = item.path("productId").asText();
                Product p  = productMap.get(pid);
                result.add(new ReorderItem(
                        pid,
                        item.path("productName").asText(p != null ? p.getName() : pid),
                        p != null ? p.getUnit() : "units",
                        p != null ? p.getCurrentStock() : 0,
                        item.path("orderQty").asDouble(0),
                        item.path("urgency").asText("MEDIUM"),
                        item.path("reason").asText("Low stock")
                ));
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to parse Gemini reorder list. Raw response was:\n{}", raw);
            return List.of();
        }
    }
}
