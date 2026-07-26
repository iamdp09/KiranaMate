package com.kiranaai.service;

import com.kiranaai.model.*;
import com.kiranaai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final WhatsAppSessionRepository sessionRepository;
    private final ProductRepository         productRepository;
    private final SaleRepository            saleRepository;
    private final UserRepository            userRepository;
    private final InventoryLogRepository    inventoryLogRepository;

    // ── Help text ────────────────────────────────────────────────────────────
    private static final String HELP_MESSAGE = """
            🛒 *KiranaAI Bot Commands*
            
            📦 *Stock*
            • check stock — All product stocks
            • low stock — Items running low
            • stock sugar — Specific product stock
            
            ➕ *Add Stock*
            • add 10 sugar — Add 10 units
            • add 10 kg sugar — Add with unit (auto-converts)
            • restock sugar — How much to order
            
            ➖ *Record Sale*
            • sold 5 atta — Record sale
            • sold 2 kg sugar — Sale with unit (auto-converts)
            
            🆕 *Create Product*
            • new product — Start guided product creation
            
            📊 *Reports*
            • today sales — Today's revenue
            • weekly report — Last 7 days
            • top products — Best sellers
            
            Type menu anytime to see this again.
            """;

    // ── Patterns ─────────────────────────────────────────────────────────────
    /** Matches: sold/add/restock <qty> [unit]? <product> */
    private static final Pattern QTY_PATTERN = Pattern.compile(
            "(?:sold?|sale|add|restock)\\s+(\\d+(?:\\.\\d+)?)\\s*" +
            "(?:(kg|g|gm|gram|grams|l|ltr|litre|liter|ml|millilitre|" +
            "pcs?|piece|pieces|unit|units|packet|packets|box|boxes|dozen|bag|bags)\\s+)?(.+)",
            Pattern.CASE_INSENSITIVE);

    /** Matches: restock <product>  (no qty) */
    private static final Pattern RESTOCK_NO_QTY = Pattern.compile(
            "restock\\s+(.+)", Pattern.CASE_INSENSITIVE);

    // ── Unit conversion ───────────────────────────────────────────────────────
    /**
     * Converts inputQty from inputUnit into productUnit.
     * Returns the converted value, or inputQty unchanged if units are
     * compatible/same or conversion is unknown.
     */
    private double convertUnit(double qty, String inputUnit, String productUnit) {
        if (inputUnit == null || inputUnit.isBlank()) return qty;

        String from = inputUnit.toLowerCase().trim();
        String to   = productUnit == null ? "" : productUnit.toLowerCase().trim();

        if (from.equals(to)) return qty;

        // ── Weight ──────────────────────────────────────────────────────────
        if (isKg(from) && isGram(to))  return qty * 1000;
        if (isGram(from) && isKg(to))  return qty / 1000;

        // ── Volume ───────────────────────────────────────────────────────────
        if (isLitre(from) && isMl(to)) return qty * 1000;
        if (isMl(from) && isLitre(to)) return qty / 1000;

        // ── Count ────────────────────────────────────────────────────────────
        if (isDozen(from) && isPcs(to))  return qty * 12;
        if (isPcs(from) && isDozen(to))  return qty / 12;

        // Unknown combination — return as-is
        log.warn("No conversion rule for {} → {}", from, to);
        return qty;
    }

    private boolean isKg(String u)    { return u.equals("kg"); }
    private boolean isGram(String u)  { return u.equals("g") || u.equals("gm") || u.equals("gram") || u.equals("grams"); }
    private boolean isLitre(String u) { return u.equals("l") || u.equals("ltr") || u.equals("litre") || u.equals("liter"); }
    private boolean isMl(String u)    { return u.equals("ml") || u.equals("millilitre"); }
    private boolean isDozen(String u) { return u.equals("dozen"); }
    private boolean isPcs(String u)   { return u.equals("pcs") || u.equals("pc") || u.equals("piece") || u.equals("pieces") || u.equals("unit") || u.equals("units"); }

    private String unitLabel(String inputUnit, String productUnit) {
        if (inputUnit == null || inputUnit.isBlank() || inputUnit.equalsIgnoreCase(productUnit)) return "";
        return " (" + inputUnit + " → " + productUnit + ")";
    }

    // ── Entry point ───────────────────────────────────────────────────────────
    public String processMessage(String phone, String messageBody) {
        String cleanPhone = phone.replace("whatsapp:", "").trim();

        WhatsAppSession session = sessionRepository.findByPhone(cleanPhone)
                .orElseGet(() -> WhatsAppSession.builder()
                        .phone(cleanPhone)
                        .sessionState(SessionState.IDLE)
                        .lastMessageAt(Instant.now())
                        .expiresAt(Instant.now().plus(30, ChronoUnit.MINUTES))
                        .build());

        if (session.getExpiresAt() != null && Instant.now().isAfter(session.getExpiresAt())) {
            session.setSessionState(SessionState.IDLE);
            session.setPendingAction(null);
        }

        String input    = messageBody.trim().toLowerCase();
        String response;

        try {
            // Check if we're in a product-creation flow first
            if (session.getPendingAction() != null &&
                "CREATE_PRODUCT".equals(session.getPendingAction().get("flow"))) {
                response = handleCreateProductFlow(cleanPhone, messageBody.trim(), session);
            } else {
                switch (session.getSessionState()) {
                    case AWAITING_PRODUCT -> response = handleProductSelection(cleanPhone, input, session);
                    case AWAITING_QTY     -> response = handleQtyInput(cleanPhone, input, session);
                    default               -> response = parseNewCommand(cleanPhone, input, messageBody.trim(), session);
                }
            }
        } catch (Exception e) {
            log.error("Chatbot error for {}: {}", cleanPhone, e.getMessage(), e);
            response = "⚠️ Something went wrong. Please try again or type *help*.";
            session.setSessionState(SessionState.IDLE);
            session.setPendingAction(null);
        }

        session.setLastMessageAt(Instant.now());
        session.setExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
        sessionRepository.save(session);
        return response;
    }

    // ── Command router ────────────────────────────────────────────────────────
    private String parseNewCommand(String phone, String input, String rawInput,
                                   WhatsAppSession session) {

        Optional<User> userOpt = findUserByFlexiblePhone(phone);
        if (userOpt.isEmpty()) {
            log.warn("WhatsApp message from unregistered phone: {}", phone);
            return "❌ Your number (" + phone + ") is not registered.\n"
                 + "Please register in the KiranaAI app and use this exact number.\n"
                 + "Type *help* after registering.";
        }
        String userId = userOpt.get().getId();

        // Join sandbox keyword
        if (input.startsWith("join ") || input.equals("join")) {
            return "🎉 *Welcome to KiranaAI Bot!*\n\n"
                 + "Hi " + userOpt.get().getName() + "! 👋\n"
                 + "Your WhatsApp is now connected to *KiranaAI*.\n\n"
                 + HELP_MESSAGE;
        }

        if (input.equals("help") || input.equals("menu")) return HELP_MESSAGE;

        if (input.equals("hi") || input.equals("hello") || input.equals("hey") || input.equals("start")) {
            return "🎉 *Welcome to KiranaAI Bot!*\n\n"
                 + "Hi " + userOpt.get().getName() + "! 👋\n"
                 + "Your WhatsApp is now connected to *KiranaAI*.\n\n"
                 + HELP_MESSAGE;
        }

        if (input.contains("low stock") || input.equals("lowstock"))
            return getLowStockMessage(userId);

        if (input.equals("check stock") || input.equals("stock") || input.equals("inventory"))
            return getAllStockMessage(userId);

        if (input.startsWith("stock "))
            return getProductStockMessage(userId, input.substring(6).trim());

        if (input.startsWith("sold ") || input.startsWith("sale "))
            return parseSaleCommand(userId, input, session);

        if (input.startsWith("add ") || input.startsWith("restock "))
            return parseRestockCommand(userId, input, session);

        if (input.startsWith("today") && input.contains("sale"))
            return getTodaySalesMessage(userId);

        if (input.contains("weekly") || input.contains("week"))
            return getWeeklyReportMessage(userId);

        if (input.contains("top product") || input.contains("best seller"))
            return getTopProductsMessage(userId);

        // New product creation trigger
        if (input.contains("new product") || input.contains("add product") || input.contains("create product")) {
            return startCreateProductFlow(userId, session);
        }

        return "🤔 I didn't understand that.\nType *help* to see all commands.";
    }

    // ── Sale command ──────────────────────────────────────────────────────────
    private String parseSaleCommand(String userId, String input, WhatsAppSession session) {
        Matcher m = QTY_PATTERN.matcher(input);
        if (!m.find())
            return "❓ Format: sold [qty] [product]\nExample: sold 5 atta or sold 2 kg sugar";

        double rawQty;
        try { rawQty = Double.parseDouble(m.group(1)); }
        catch (NumberFormatException e) { return "❓ Invalid quantity."; }

        String inputUnit  = m.group(2);   // may be null
        String productName = m.group(3).trim();

        Optional<Product> productOpt = findProductFuzzy(userId, productName);
        if (productOpt.isEmpty())
            return "❌ Product *" + productName + "* not found.\nType check stock to see all products.";

        Product product  = productOpt.get();
        double converted = convertUnit(rawQty, inputUnit, product.getUnit());
        int qty = (int) Math.round(converted);

        String convNote = unitLabel(inputUnit, product.getUnit());

        if (product.getCurrentStock() < qty) {
            return "⚠️ Insufficient stock!\n" + product.getName() + " has only *"
                    + product.getCurrentStock() + " " + product.getUnit()
                    + "* left.\nRequested: " + qty + " " + product.getUnit() + convNote;
        }

        int before = product.getCurrentStock();
        product.setCurrentStock(before - qty);
        productRepository.save(product);

        Sale sale = Sale.builder()
                .userId(userId).productId(product.getId()).productName(product.getName())
                .quantity(qty).unit(product.getUnit())
                .sellingPrice(product.getSellingPrice())
                .totalAmount(product.getSellingPrice() * qty)
                .saleDate(Instant.now()).source(SaleSource.WHATSAPP).build();
        saleRepository.save(sale);

        inventoryLogRepository.save(InventoryLog.builder()
                .userId(userId).productId(product.getId())
                .changeType(InventoryChangeType.WHATSAPP_UPDATE)
                .quantityBefore(before).quantityChange(-qty)
                .quantityAfter(product.getCurrentStock())
                .note("Sale via WhatsApp bot" + convNote).build());

        return "✅ *Sale Recorded!*" + convNote + "\n"
                + "📦 " + product.getName() + "\n"
                + "🔢 Qty: " + qty + " " + product.getUnit() + "\n"
                + "💰 Revenue: ₹" + String.format("%.2f", sale.getTotalAmount()) + "\n"
                + "📊 Remaining: " + product.getCurrentStock() + " " + product.getUnit();
    }

    // ── Restock/Add command ───────────────────────────────────────────────────
    private String parseRestockCommand(String userId, String input, WhatsAppSession session) {
        Matcher m = QTY_PATTERN.matcher(input);

        // Case A: restock sugar (no qty → show suggestion)
        if (!m.find()) {
            Matcher noQty = RESTOCK_NO_QTY.matcher(input);
            if (noQty.find()) {
                String productName = noQty.group(1).trim();
                Optional<Product> opt = findProductFuzzy(userId, productName);
                if (opt.isEmpty())
                    return "❌ Product *" + productName + "* not found.\nType check stock to see all products.";
                Product p = opt.get();
                int needed = Math.max(0, p.getReorderThreshold() - p.getCurrentStock());
                if (needed == 0)
                    return "✅ " + p.getName() + " is already at or above minimum stock ("
                            + p.getCurrentStock() + " " + p.getUnit() + ").";
                return "📦 *Restock Suggestion — " + p.getName() + "*\n"
                     + "Current: " + p.getCurrentStock() + " " + p.getUnit() + "\n"
                     + "Min Level: " + p.getReorderThreshold() + " " + p.getUnit() + "\n"
                     + "⚠️ Order at least *" + needed + " " + p.getUnit() + "* to reach minimum.\n"
                     + "To add stock, send:\nadd " + needed + " " + p.getName();
            }
            return "❓ Format: add [qty] [product]\nExample: add 10 sugar or add 10 kg sugar";
        }

        // Case B: add 10 [kg] sugar
        double rawQty;
        try { rawQty = Double.parseDouble(m.group(1)); }
        catch (NumberFormatException e) { return "❓ Invalid quantity."; }

        String inputUnit   = m.group(2);
        String productName = m.group(3).trim();

        Optional<Product> productOpt = findProductFuzzy(userId, productName);
        if (productOpt.isEmpty())
            return "❌ Product *" + productName + "* not found.\nType check stock to see all products.";

        Product product  = productOpt.get();
        double converted = convertUnit(rawQty, inputUnit, product.getUnit());
        int qty = (int) Math.round(converted);

        String convNote = unitLabel(inputUnit, product.getUnit());

        int before = product.getCurrentStock();
        product.setCurrentStock(before + qty);
        productRepository.save(product);

        inventoryLogRepository.save(InventoryLog.builder()
                .userId(userId).productId(product.getId())
                .changeType(InventoryChangeType.WHATSAPP_UPDATE)
                .quantityBefore(before).quantityChange(qty)
                .quantityAfter(product.getCurrentStock())
                .note("Restocked via WhatsApp bot" + convNote).build());

        return "✅ *Stock Updated!*" + convNote + "\n"
                + "📦 " + product.getName() + "\n"
                + "➕ Added: " + qty + " " + product.getUnit() + "\n"
                + "📊 New Stock: " + product.getCurrentStock() + " " + product.getUnit();
    }

    // ── Product creation flow ─────────────────────────────────────────────────
    /**
     * Multi-step guided product creation via WhatsApp.
     * Steps stored in session.pendingAction:
     *   flow = "CREATE_PRODUCT"
     *   step = NAME | UNIT | SELLING_PRICE | COST_PRICE | STOCK | CONFIRM
     *   (accumulated fields added as step progresses)
     */
    private String startCreateProductFlow(String userId, WhatsAppSession session) {
        Map<String, Object> action = new HashMap<>();
        action.put("flow",   "CREATE_PRODUCT");
        action.put("step",   "NAME");
        action.put("userId", userId);
        session.setPendingAction(action);
        session.setSessionState(SessionState.AWAITING_PRODUCT);
        return "🆕 *Create New Product*\n\nStep 1/5 — What is the *product name*?\n(e.g. Sugar, Basmati Rice, Amul Butter)";
    }

    private String handleCreateProductFlow(String phone, String rawInput,
                                           WhatsAppSession session) {
        Map<String, Object> action = session.getPendingAction();
        String step   = (String) action.get("step");
        String userId = (String) action.get("userId");

        // Allow cancel at any step
        if (rawInput.equalsIgnoreCase("cancel") || rawInput.equalsIgnoreCase("stop")) {
            session.setPendingAction(null);
            session.setSessionState(SessionState.IDLE);
            return "❌ Product creation cancelled.\nType *help* to see all commands.";
        }

        return switch (step) {
            case "NAME" -> {
                if (rawInput.isBlank()) yield "❓ Please enter a valid product name.";
                action.put("name", rawInput.trim());
                action.put("step", "UNIT");
                yield "✏️ Step 2/5 — What is the *unit* for " + rawInput.trim() + "?\n\n"
                    + "Options: kg / g / l / ml / pcs / packet / dozen / box\n"
                    + "(Type the unit exactly as shown)";
            }
            case "UNIT" -> {
                String unit = rawInput.trim().toLowerCase();
                List<String> validUnits = List.of("kg","g","gm","l","ltr","ml","pcs","pc",
                        "piece","packet","unit","dozen","box","bag");
                if (!validUnits.contains(unit))
                    yield "❓ Invalid unit. Please choose from:\nkg / g / l / ml / pcs / packet / dozen / box";
                action.put("unit", unit);
                action.put("step", "SELLING_PRICE");
                yield "💰 Step 3/5 — What is the *selling price* per " + unit + "? (₹)\n(e.g. 45 or 45.50)";
            }
            case "SELLING_PRICE" -> {
                try {
                    double price = Double.parseDouble(rawInput.trim());
                    if (price <= 0) yield "❓ Price must be greater than 0.";
                    action.put("sellingPrice", price);
                    action.put("step", "COST_PRICE");
                    yield "💵 Step 4/5 — What is the *cost price* per " + action.get("unit") + "? (₹)\n(What you pay to buy it)";
                } catch (NumberFormatException e) {
                    yield "❓ Invalid price. Please enter a number like 45 or 45.50";
                }
            }
            case "COST_PRICE" -> {
                try {
                    double cost = Double.parseDouble(rawInput.trim());
                    if (cost <= 0) yield "❓ Cost must be greater than 0.";
                    action.put("costPrice", cost);
                    action.put("step", "STOCK");
                    yield "📦 Step 5/5 — What is the *current stock* quantity?\n(e.g. 100)";
                } catch (NumberFormatException e) {
                    yield "❓ Invalid cost. Please enter a number like 40 or 40.50";
                }
            }
            case "STOCK" -> {
                try {
                    int stock = Integer.parseInt(rawInput.trim());
                    if (stock < 0) yield "❓ Stock cannot be negative.";
                    action.put("stock", stock);
                    action.put("step", "CONFIRM");

                    String name    = (String) action.get("name");
                    String unit    = (String) action.get("unit");
                    double selling = (Double) action.get("sellingPrice");
                    double cost    = (Double) action.get("costPrice");

                    yield "📋 *Confirm New Product*\n\n"
                        + "Name: *" + name + "*\n"
                        + "Unit: " + unit + "\n"
                        + "Selling Price: ₹" + String.format("%.2f", selling) + " per " + unit + "\n"
                        + "Cost Price: ₹" + String.format("%.2f", cost) + " per " + unit + "\n"
                        + "Current Stock: " + stock + " " + unit + "\n\n"
                        + "Reply *yes* to save or *no* to cancel.";
                } catch (NumberFormatException e) {
                    yield "❓ Invalid quantity. Please enter a whole number like 100";
                }
            }
            case "CONFIRM" -> {
                if (rawInput.equalsIgnoreCase("yes") || rawInput.equalsIgnoreCase("y")) {
                    String name    = (String) action.get("name");
                    String unit    = (String) action.get("unit");
                    double selling = (Double) action.get("sellingPrice");
                    double cost    = (Double) action.get("costPrice");
                    int    stock   = (Integer) action.get("stock");

                    Product product = Product.builder()
                            .userId(userId)
                            .name(name)
                            .unit(unit)
                            .sellingPrice(selling)
                            .costPrice(cost)
                            .currentStock(stock)
                            .reorderThreshold(10)   // default
                            .maxStock(stock * 3)     // default
                            .isActive(true)
                            .build();
                    productRepository.save(product);

                    session.setPendingAction(null);
                    session.setSessionState(SessionState.IDLE);

                    yield "✅ *Product Created!*\n\n"
                        + "📦 " + name + "\n"
                        + "Stock: " + stock + " " + unit + "\n"
                        + "Sell: ₹" + String.format("%.2f", selling) + " | Cost: ₹" + String.format("%.2f", cost) + "\n\n"
                        + "Type *check stock* to see all products.";
                } else {
                    session.setPendingAction(null);
                    session.setSessionState(SessionState.IDLE);
                    yield "❌ Product creation cancelled.";
                }
            }
            default -> {
                session.setPendingAction(null);
                session.setSessionState(SessionState.IDLE);
                yield "Something went wrong. Type *help* to start over.";
            }
        };
    }

    // ── Fuzzy product lookup ──────────────────────────────────────────────────
    private Optional<Product> findProductFuzzy(String userId, String name) {
        Optional<Product> exact =
                productRepository.findByNameIgnoreCaseAndUserIdAndIsActiveTrue(name, userId);
        if (exact.isPresent()) return exact;
        return productRepository.findByUserIdAndIsActiveTrue(userId).stream()
                .filter(p -> p.getName().toLowerCase().contains(name.toLowerCase()))
                .findFirst();
    }

    // ── Flexible phone lookup ─────────────────────────────────────────────────
    private Optional<User> findUserByFlexiblePhone(String phone) {
        Optional<User> user = userRepository.findByPhone(phone);
        if (user.isPresent()) return user;

        if (phone.startsWith("+")) {
            user = userRepository.findByPhone(phone.substring(1));
            if (user.isPresent()) return user;
        }

        String digits = phone.replaceAll("\\D", "");
        if (digits.length() >= 10) {
            String last10 = digits.substring(digits.length() - 10);
            user = userRepository.findByPhone(last10);
            if (user.isPresent()) return user;
            user = userRepository.findByPhone("+91" + last10);
            if (user.isPresent()) return user;
            user = userRepository.findByPhone("91" + last10);
            if (user.isPresent()) return user;
        }
        return Optional.empty();
    }

    // ── Report helpers ────────────────────────────────────────────────────────
    private String getLowStockMessage(String userId) {
        List<Product> lowStock = productRepository.findLowStockByUserId(userId);
        if (lowStock.isEmpty()) return "✅ All products are well-stocked!";
        StringBuilder sb = new StringBuilder("⚠️ *Low Stock Alert!* (" + lowStock.size() + " items)\n\n");
        for (int i = 0; i < lowStock.size(); i++) {
            Product p = lowStock.get(i);
            sb.append(i + 1).append(". ").append(p.getName())
              .append(" — *").append(p.getCurrentStock()).append(" ").append(p.getUnit())
              .append("* left (min: ").append(p.getReorderThreshold()).append(")\n");
        }
        sb.append("\nType: add [qty] [product] to restock.");
        return sb.toString();
    }

    private String getAllStockMessage(String userId) {
        List<Product> products = productRepository.findByUserIdAndIsActiveTrue(userId);
        if (products.isEmpty()) return "📦 No products added yet.\nType *new product* to create one.";
        StringBuilder sb = new StringBuilder("📦 *Current Stock*\n\n");
        int count = Math.min(products.size(), 15);
        for (int i = 0; i < count; i++) {
            Product p = products.get(i);
            String icon = p.getCurrentStock() <= p.getReorderThreshold() ? "🔴" : "🟢";
            sb.append(icon).append(" ").append(p.getName())
              .append(": ").append(p.getCurrentStock()).append(" ").append(p.getUnit()).append("\n");
        }
        if (products.size() > 15)
            sb.append("...and ").append(products.size() - 15).append(" more. Check the app.");
        return sb.toString();
    }

    private String getProductStockMessage(String userId, String productName) {
        Optional<Product> opt = findProductFuzzy(userId, productName);
        if (opt.isEmpty()) return "❌ Product *" + productName + "* not found.";
        Product p = opt.get();
        String status = p.getCurrentStock() <= p.getReorderThreshold() ? "⚠️ LOW STOCK" : "✅ OK";
        return "📦 *" + p.getName() + "*\n"
                + "Stock: *" + p.getCurrentStock() + " " + p.getUnit() + "*\n"
                + "Min Level: " + p.getReorderThreshold() + " " + p.getUnit() + "\n"
                + "Status: " + status;
    }

    private String getTodaySalesMessage(String userId) {
        Instant todayStart = java.time.LocalDate.now(ZoneId.of("Asia/Kolkata"))
                .atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant();
        List<Sale> sales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, todayStart);
        double revenue = sales.stream().mapToDouble(Sale::getTotalAmount).sum();
        return "📊 *Today's Sales*\n"
                + "🛒 Transactions: " + sales.size() + "\n"
                + "💰 Revenue: ₹" + String.format("%.2f", revenue);
    }

    private String getWeeklyReportMessage(String userId) {
        Instant weekStart = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Sale> sales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, weekStart);
        double revenue = sales.stream().mapToDouble(Sale::getTotalAmount).sum();
        return "📈 *Weekly Report (Last 7 Days)*\n"
                + "🛒 Total Transactions: " + sales.size() + "\n"
                + "💰 Total Revenue: ₹" + String.format("%.2f", revenue) + "\n"
                + "📅 Avg/Day: ₹" + String.format("%.2f", revenue / 7);
    }

    private String getTopProductsMessage(String userId) {
        Instant from = Instant.now().minus(30, ChronoUnit.DAYS);
        List<Sale> sales = saleRepository.findByUserIdAndSaleDateAfterOrderBySaleDateDesc(userId, from);
        if (sales.isEmpty()) return "📊 No sales data for last 30 days.";
        var top = sales.stream()
                .collect(Collectors.groupingBy(Sale::getProductName,
                        Collectors.summingLong(s -> (long) s.getQuantity())))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5).toList();
        StringBuilder sb = new StringBuilder("🏆 *Top 5 Products (Last 30 days)*\n\n");
        for (int i = 0; i < top.size(); i++) {
            sb.append(i + 1).append(". ").append(top.get(i).getKey())
              .append(" — ").append(top.get(i).getValue()).append(" units sold\n");
        }
        return sb.toString();
    }

    // ── Legacy session handlers (kept for compatibility) ──────────────────────
    private String handleProductSelection(String phone, String input, WhatsAppSession session) {
        session.setSessionState(SessionState.IDLE);
        session.setPendingAction(null);
        return "Session expired. Please try your command again.";
    }

    private String handleQtyInput(String phone, String input, WhatsAppSession session) {
        session.setSessionState(SessionState.IDLE);
        session.setPendingAction(null);
        return "Session expired. Please try your command again.";
    }
}
