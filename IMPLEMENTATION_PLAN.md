# 🛒 KiranaAI — Full Stack Reboot · Implementation Plan

> **College Project** | Java 21 + Spring Boot · MongoDB · React + Tailwind CSS · JWT · WhatsApp Bot
> 
> **Status:** Planning Phase | **Date:** June 2026

---

## 📌 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [MongoDB Database Schema](#4-mongodb-database-schema)
5. [Authentication & Security](#5-authentication--security)
6. [REST API — Complete List](#6-rest-api--complete-list)
7. [WhatsApp Chatbot — Command System](#7-whatsapp-chatbot--command-system)
8. [Backend Project Structure](#8-backend-project-structure)
9. [Frontend Project Structure](#9-frontend-project-structure)
10. [Maven Dependencies](#10-maven-dependencies)
11. [Development Phases & Timeline](#11-development-phases--timeline)
12. [Deployment Plan](#12-deployment-plan)
13. [Open Questions](#13-open-questions)

---

## 1. Project Overview

**KiranaAI** is an AI-powered inventory management system designed for small kirana (grocery) stores in India. The system is being fully rebooted with a modern, production-grade stack.

### What the System Does
- Helps kirana store owners **manage inventory**, **track sales**, and **place purchase orders**
- Provides a **WhatsApp chatbot** so owners can manage their shop just by sending WhatsApp messages — no app required
- Supports **Login with WhatsApp** (OTP-based) for easy onboarding of non-tech-savvy users
- Generates **demand forecasts** and **reorder suggestions** (ML/DL models to be integrated in future)
- Full **web dashboard** for detailed analytics and management

### What Changed (vs. Previous Version)

| Layer | Before (Deleted) | After (Reboot) |
|---|---|---|
| Backend | Python + FastAPI | **Java 21 + Spring Boot 3.x** |
| Styling | Plain CSS | **Tailwind CSS v3** |
| Auth | Basic JWT | **JWT + WhatsApp OTP Login** |
| WhatsApp | Low-stock alerts only | **Full Inventory Chatbot** |
| ML | Scikit-learn stubs | **Future-ready stub interface** |

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Backend Language** | Java 21 (LTS) | Records, Sealed classes, Virtual threads |
| **Backend Framework** | Spring Boot 3.x | Web, Security, Data MongoDB, Validation |
| **Database** | MongoDB | Spring Data MongoDB, Atlas free tier |
| **Authentication** | Spring Security + JWT | JJWT 0.12.x library |
| **WhatsApp** | Twilio WhatsApp API | **Free sandbox** for dev/demo |
| **Frontend** | React 18 + Vite | Keep existing React code, migrate CSS |
| **Styling** | Tailwind CSS v3 | Replace all plain CSS |
| **Charts** | Recharts | Keep existing chart components |
| **HTTP Client** | Axios | With JWT interceptors |
| **Build Tool** | Maven | Standard Spring Boot project |
| **Deployment** | Railway (backend) + Vercel (frontend) | Both have free tiers |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌──────────────────────┐      ┌──────────────────────────┐   │
│   │   React + Tailwind   │      │    WhatsApp (Owner's     │   │
│   │   Web Dashboard      │      │    Phone via Twilio)     │   │
│   └──────────┬───────────┘      └───────────┬──────────────┘   │
└──────────────│───────────────────────────────│──────────────────┘
               │ HTTPS / REST API              │ Twilio Webhook
               ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SPRING BOOT BACKEND                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │ Products │  │  Sales   │  │  WhatsApp    │   │
│  │Controller│  │Controller│  │Controller│  │  Controller  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │                │           │
│  ┌────▼──────────────▼──────────────▼────────────────▼──────┐  │
│  │                    Service Layer                          │  │
│  │  AuthService │ ProductService │ SaleService │ ChatbotSvc  │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │              Spring Security (JWT Filter)                 │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└───────────────────────────│─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB (Atlas)                               │
│  users │ products │ suppliers │ sales │ inventory_logs          │
│  purchase_orders │ whatsapp_sessions │ forecasts                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. MongoDB Database Schema

### 4.1 Collection: `users`

```json
{
  "_id": "ObjectId",
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "passwordHash": "<bcrypt_hash>",
  "phone": "+919876543210",
  "whatsappVerified": true,
  "storeName": "Ramesh General Store",
  "storeAddress": "Mumbai, Maharashtra",
  "role": "OWNER",
  "isActive": true,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Fields:**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated MongoDB ID |
| `phone` | String | International format (+91XXXXXXXXXX) — used for WhatsApp |
| `whatsappVerified` | Boolean | True after OTP verification |
| `role` | Enum | `OWNER`, `STAFF`, `ADMIN` |

---

### 4.2 Collection: `products`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "Tata Salt",
  "sku": "SKU-001",
  "category": "Grocery",
  "unit": "kg",
  "sellingPrice": 25.00,
  "costPrice": 20.00,
  "currentStock": 50,
  "reorderThreshold": 10,
  "maxStock": 200,
  "supplierId": "ObjectId",
  "isActive": true,
  "imageUrl": null,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

### 4.3 Collection: `suppliers`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "National Foods Pvt Ltd",
  "contactPerson": "Suresh Sharma",
  "phone": "+91XXXXXXXXXX",
  "email": "supplier@example.com",
  "address": "Delhi, India",
  "productsSupplied": ["ObjectId", "ObjectId"],
  "isActive": true,
  "createdAt": "ISODate"
}
```

---

### 4.4 Collection: `sales`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "productId": "ObjectId",
  "productName": "Tata Salt",
  "quantity": 5,
  "unit": "kg",
  "sellingPrice": 25.00,
  "totalAmount": 125.00,
  "saleDate": "ISODate",
  "source": "MANUAL",
  "createdAt": "ISODate"
}
```

**`source` values:** `MANUAL` (web dashboard) | `WHATSAPP` (via chatbot)

---

### 4.5 Collection: `inventory_logs`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "productId": "ObjectId",
  "changeType": "RESTOCK",
  "quantityBefore": 50,
  "quantityChange": +100,
  "quantityAfter": 150,
  "note": "Restocked via WhatsApp bot",
  "createdAt": "ISODate"
}
```

**`changeType` values:** `RESTOCK` | `SALE` | `MANUAL_ADJUST` | `WHATSAPP_UPDATE`

---

### 4.6 Collection: `purchase_orders`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "supplierId": "ObjectId",
  "supplierName": "National Foods",
  "items": [
    {
      "productId": "ObjectId",
      "productName": "Tata Salt",
      "quantityOrdered": 100,
      "costPrice": 20.00,
      "quantityReceived": 0
    }
  ],
  "totalAmount": 2000.00,
  "status": "PENDING",
  "orderedAt": "ISODate",
  "deliveredAt": null,
  "createdAt": "ISODate"
}
```

**`status` values:** `PENDING` | `DELIVERED` | `PARTIAL` | `CANCELLED`

---

### 4.7 Collection: `whatsapp_sessions`

```json
{
  "_id": "ObjectId",
  "phone": "+919876543210",
  "userId": "ObjectId",
  "sessionState": "IDLE",
  "pendingAction": {
    "type": "ADD_STOCK",
    "productId": "ObjectId",
    "qty": null
  },
  "lastMessageAt": "ISODate",
  "expiresAt": "ISODate"
}
```

**`sessionState` values:** `IDLE` | `AWAITING_PRODUCT` | `AWAITING_QTY` | `AWAITING_CONFIRM`

> Session auto-expires after **30 minutes** of inactivity.

---

### 4.8 Collection: `forecasts` *(Future ML — Stub for now)*

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "productId": "ObjectId",
  "generatedAt": "ISODate",
  "forecastPeriodDays": 7,
  "predictedDemand": 35,
  "recommendedReorder": 20,
  "modelUsed": "MOVING_AVG",
  "confidence": null
}
```

---

## 5. Authentication & Security

### 5.1 JWT Token Flow

```
Registration/Login
    │
    ▼
POST /api/v1/auth/login
    │
    ├── Validate email + password (BCrypt)
    ├── Generate Access Token  (expires: 1 hour)
    └── Generate Refresh Token (expires: 7 days)
            │
            ▼
    Response: { accessToken, refreshToken, user }
            │
            ▼
    Frontend stores tokens → sends Bearer <accessToken>
    in every protected API request header
            │
            ▼
    When accessToken expires:
    POST /api/v1/auth/refresh → new accessToken issued
```

### 5.2 WhatsApp OTP Login Flow

```
Step 1:  User enters phone number on Login page
         POST /api/v1/auth/whatsapp/send-otp
         → Server generates 6-digit OTP (valid 5 min)
         → Sends OTP via WhatsApp message (Twilio)

Step 2:  User receives OTP on WhatsApp
         POST /api/v1/auth/whatsapp/verify-otp { phone, otp }
         → Server verifies OTP
         → If new user → auto-register account
         → Issue JWT tokens → Login success
```

### 5.3 Security Configuration

| Config | Value |
|---|---|
| Password Hashing | BCrypt (strength 12) |
| Access Token Expiry | 1 hour |
| Refresh Token Expiry | 7 days |
| OTP Expiry | 5 minutes |
| Public Endpoints | `/api/v1/auth/**`, `/api/v1/whatsapp/webhook` |
| Protected | All other `/api/v1/**` endpoints |
| CORS | `localhost:5173` (dev) + production domain |
| Twilio Webhook | Validated with Twilio signature header |

---

## 6. REST API — Complete List

> **Base URL:** `http://localhost:8080/api/v1`  
> **Auth:** All protected endpoints require `Authorization: Bearer <token>`

---

### 6.1 Auth Module — `/api/v1/auth`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/register` | ❌ | Register with email + password |
| 2 | POST | `/login` | ❌ | Email/password login → JWT |
| 3 | POST | `/refresh` | ❌ | Exchange refresh token → new access token |
| 4 | POST | `/logout` | ✅ | Invalidate refresh token (blacklist) |
| 5 | POST | `/whatsapp/send-otp` | ❌ | Send 6-digit OTP to WhatsApp number |
| 6 | POST | `/whatsapp/verify-otp` | ❌ | Verify OTP → JWT (Login with WhatsApp) |
| 7 | GET | `/me` | ✅ | Get current logged-in user profile |
| 8 | PUT | `/me` | ✅ | Update profile (name, store name, address) |
| 9 | PUT | `/me/change-password` | ✅ | Change password |

---

### 6.2 Dashboard Module — `/api/v1/dashboard`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 10 | GET | `/stats` | ✅ | Total products, today's sales, revenue, low-stock count |
| 11 | GET | `/recent-sales` | ✅ | Last 10 sales transactions |
| 12 | GET | `/low-stock-alerts` | ✅ | All products below reorder threshold |
| 13 | GET | `/revenue-chart?days=30` | ✅ | Daily revenue data for chart (last N days) |
| 14 | GET | `/top-products?limit=5` | ✅ | Top N best-selling products |

---

### 6.3 Products Module — `/api/v1/products`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 15 | GET | `/` | ✅ | List all products (paginated, search/filter) |
| 16 | POST | `/` | ✅ | Create new product |
| 17 | GET | `/{id}` | ✅ | Get product by ID |
| 18 | PUT | `/{id}` | ✅ | Update product details |
| 19 | DELETE | `/{id}` | ✅ | Soft-delete product (`isActive = false`) |
| 20 | GET | `/search?q=` | ✅ | Search by name or SKU |
| 21 | GET | `/low-stock` | ✅ | Products below reorder threshold |
| 22 | GET | `/categories` | ✅ | List all unique product categories |

**Query params for GET `/`:** `page`, `size`, `search`, `category`, `sortBy`, `sortDir`

---

### 6.4 Suppliers Module — `/api/v1/suppliers`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 23 | GET | `/` | ✅ | List all suppliers |
| 24 | POST | `/` | ✅ | Add new supplier |
| 25 | GET | `/{id}` | ✅ | Get supplier details |
| 26 | PUT | `/{id}` | ✅ | Update supplier details |
| 27 | DELETE | `/{id}` | ✅ | Soft-delete supplier |

---

### 6.5 Inventory Module — `/api/v1/inventory`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 28 | GET | `/` | ✅ | All products with current stock levels |
| 29 | PATCH | `/{productId}/adjust` | ✅ | Manual stock adjustment (`+` or `-`) |
| 30 | PATCH | `/{productId}/restock` | ✅ | Restock product (add to stock) |
| 31 | GET | `/{productId}/logs` | ✅ | Change history for a specific product |
| 32 | GET | `/logs` | ✅ | All inventory change logs (paginated) |

---

### 6.6 Sales Module — `/api/v1/sales`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 33 | GET | `/` | ✅ | List all sales (paginated, filter by date range) |
| 34 | POST | `/` | ✅ | Record new sale (auto-deducts stock) |
| 35 | GET | `/{id}` | ✅ | Get sale details |
| 36 | DELETE | `/{id}` | ✅ | Delete sale (reverses stock deduction) |
| 37 | GET | `/summary?from=&to=` | ✅ | Revenue summary for date range |
| 38 | GET | `/by-product/{productId}` | ✅ | Sales history for specific product |

---

### 6.7 Purchase Orders Module — `/api/v1/purchase-orders`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 39 | GET | `/` | ✅ | List all purchase orders |
| 40 | POST | `/` | ✅ | Create new purchase order |
| 41 | GET | `/{id}` | ✅ | Get purchase order details |
| 42 | PATCH | `/{id}/deliver` | ✅ | Mark delivered → auto-update stock levels |
| 43 | PATCH | `/{id}/cancel` | ✅ | Cancel purchase order |

---

### 6.8 WhatsApp Module — `/api/v1/whatsapp`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 44 | POST | `/webhook` | ❌ (Twilio sig) | Receive incoming WhatsApp messages from Twilio |
| 45 | POST | `/send` | ✅ | Send outbound WhatsApp message manually |
| 46 | POST | `/demo/simulate` | ✅ | Simulate chatbot conversation in web UI |
| 47 | GET | `/logs` | ✅ | WhatsApp message history |
| 48 | GET | `/chatbot/status` | ✅ | Is chatbot active and connected? |

---

### 6.9 Forecasts Module — `/api/v1/forecasts` *(ML Stub)*

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 49 | POST | `/generate` | ✅ | Run forecast for all products (moving avg now) |
| 50 | GET | `/` | ✅ | List all forecasts |
| 51 | GET | `/{productId}` | ✅ | Latest forecast for a product |

---

## 7. WhatsApp Chatbot — Command System

A kirana store owner can manage their entire store inventory just by sending WhatsApp messages to the bot. No app download required.

### 7.1 Supported Commands

```
┌─────────────────────────────────────────────────────┐
│  📦  STOCK MANAGEMENT                               │
├─────────────────────────────────────────────────────┤
│  "check stock"              → All product stocks    │
│  "low stock"                → Items below threshold │
│  "stock Tata Salt"          → Stock for one product │
│                                                     │
│  "add 10 kg sugar"          → Add 10kg sugar stock  │
│  "restock rice"             → Add stock for rice    │
│  "sold 5 kg atta"           → Record sale of atta   │
├─────────────────────────────────────────────────────┤
│  📊  REPORTS                                        │
├─────────────────────────────────────────────────────┤
│  "today sales"              → Today's revenue       │
│  "weekly report"            → Last 7 days summary   │
│  "top products"             → Best-selling 5 items  │
├─────────────────────────────────────────────────────┤
│  🆘  HELP                                           │
├─────────────────────────────────────────────────────┤
│  "help" or "menu"           → Show all commands     │
└─────────────────────────────────────────────────────┘
```

### 7.2 Example Conversation

```
Owner → Bot:  "sold 5 kg atta"
Bot → Owner:  "✅ Sale recorded!
               Product: Atta
               Qty Sold: 5 kg
               Revenue: ₹85.00
               Remaining Stock: 45 kg"

Owner → Bot:  "low stock"
Bot → Owner:  "⚠️ 3 items need restocking:
               1. Tata Salt — 5 kg left (min: 10)
               2. Mustard Oil — 2 L left (min: 5)
               3. Basmati Rice — 3 kg left (min: 8)"

Owner → Bot:  "add 20 kg sugar"
Bot → Owner:  "✅ Sugar restocked!
               Added: 20 kg
               New Stock: 120 kg
               Updated at: 7:32 PM"
```

### 7.3 Chatbot Session State Machine

```
  ┌─────────┐
  │  IDLE   │◄──────────────────────────────────┐
  └────┬────┘                                   │
       │ Message received                       │
       ▼                                        │
  ┌──────────┐   Clear intent    ┌──────────┐   │
  │  PARSE   │──────────────────►│ EXECUTE  │───┘
  │  INTENT  │                   │  ACTION  │
  └────┬─────┘                   └──────────┘
       │ Unclear / ambiguous
       ▼
  ┌──────────────────┐    User selects    ┌──────────┐
  │ AWAITING_PRODUCT │───────────────────►│ EXECUTE  │
  │   SELECTION      │                   │  ACTION  │
  └──────────────────┘                   └──────────┘
```

---

## 8. Backend Project Structure

```
backend/
└── src/main/java/com/kiranaai/
    ├── KiranaAiApplication.java
    ├── config/
    │   ├── SecurityConfig.java          # Spring Security + JWT filter chain
    │   ├── MongoConfig.java             # MongoDB auditing config
    │   ├── CorsConfig.java              # CORS for React dev + prod
    │   └── TwilioConfig.java            # Twilio SDK bean config
    ├── controller/
    │   ├── AuthController.java
    │   ├── DashboardController.java
    │   ├── ProductController.java
    │   ├── SupplierController.java
    │   ├── InventoryController.java
    │   ├── SaleController.java
    │   ├── PurchaseOrderController.java
    │   ├── WhatsAppController.java
    │   └── ForecastController.java
    ├── service/
    │   ├── AuthService.java
    │   ├── DashboardService.java
    │   ├── ProductService.java
    │   ├── SupplierService.java
    │   ├── InventoryService.java
    │   ├── SaleService.java
    │   ├── PurchaseOrderService.java
    │   ├── WhatsAppService.java          # Twilio send/receive
    │   ├── ChatbotService.java           # Command parser + session management
    │   ├── OtpService.java               # OTP generate + verify (6-digit, 5 min TTL)
    │   └── ForecastService.java          # Moving avg stub (ML-ready interface)
    ├── repository/
    │   ├── UserRepository.java
    │   ├── ProductRepository.java
    │   ├── SupplierRepository.java
    │   ├── SaleRepository.java
    │   ├── InventoryLogRepository.java
    │   ├── PurchaseOrderRepository.java
    │   ├── WhatsAppSessionRepository.java
    │   └── ForecastRepository.java
    ├── model/
    │   ├── User.java
    │   ├── Product.java
    │   ├── Supplier.java
    │   ├── Sale.java
    │   ├── InventoryLog.java
    │   ├── PurchaseOrder.java
    │   ├── WhatsAppSession.java
    │   └── Forecast.java
    ├── dto/
    │   ├── request/
    │   │   ├── LoginRequest.java
    │   │   ├── RegisterRequest.java
    │   │   ├── WhatsAppOtpRequest.java
    │   │   ├── CreateProductRequest.java
    │   │   ├── CreateSaleRequest.java
    │   │   ├── CreateSupplierRequest.java
    │   │   ├── AdjustStockRequest.java
    │   │   └── CreatePurchaseOrderRequest.java
    │   └── response/
    │       ├── AuthResponse.java          # { accessToken, refreshToken, user }
    │       ├── DashboardStatsResponse.java
    │       ├── ProductResponse.java
    │       ├── SaleResponse.java
    │       └── PagedResponse.java         # Generic paginated wrapper
    ├── security/
    │   ├── JwtTokenProvider.java          # Generate + validate JWT
    │   ├── JwtAuthenticationFilter.java   # OncePerRequestFilter
    │   └── UserPrincipal.java             # Spring UserDetails impl
    └── exception/
        ├── GlobalExceptionHandler.java    # @RestControllerAdvice
        ├── ResourceNotFoundException.java
        ├── UnauthorizedException.java
        └── ValidationException.java
```

```
src/main/resources/
├── application.yml                        # Main config
└── application-dev.yml                    # Dev overrides (local MongoDB)
```

---

## 9. Frontend Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js                      # Axios instance + JWT interceptors
│   │   └── endpoints/
│   │       ├── auth.js
│   │       ├── products.js
│   │       ├── inventory.js
│   │       ├── sales.js
│   │       ├── suppliers.js
│   │       ├── purchaseOrders.js
│   │       ├── whatsapp.js
│   │       └── dashboard.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Layout.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── Toast.jsx
│   │   └── charts/
│   │       ├── RevenueChart.jsx
│   │       └── StockChart.jsx
│   ├── pages/
│   │   ├── Login.jsx                      # Email + WhatsApp OTP login
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx                  # Stats + charts overview
│   │   ├── Products.jsx                   # CRUD for products
│   │   ├── Inventory.jsx                  # Stock levels + logs
│   │   ├── Sales.jsx                      # Sales recording + history
│   │   ├── Suppliers.jsx                  # Supplier management
│   │   ├── PurchaseOrders.jsx             # PO creation + delivery marking
│   │   ├── Forecasts.jsx                  # Demand forecasts (stub UI)
│   │   └── WhatsApp.jsx                   # Chatbot simulator + message logs
│   ├── context/
│   │   └── AuthContext.jsx                # JWT state + login/logout
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProducts.js
│   │   └── useToast.js
│   ├── utils/
│   │   ├── formatters.js                  # ₹ currency, date formatters
│   │   └── validators.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                          # @tailwind directives only
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 10. Maven Dependencies

```xml
<dependencies>

  <!-- ✅ Core Spring Boot -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>

  <!-- ✅ JWT (JJWT 0.12.x) -->
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.5</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
  </dependency>

  <!-- ✅ Twilio WhatsApp SDK -->
  <dependency>
    <groupId>com.twilio.sdk</groupId>
    <artifactId>twilio</artifactId>
    <version>10.4.1</version>
  </dependency>

  <!-- ✅ Utilities -->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>

  <!-- ✅ Testing -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
  </dependency>

</dependencies>
```

---

## 11. Development Phases & Timeline

### Phase 1 — Backend Core (Week 1–2)

| Task | Priority |
|---|---|
| Spring Boot project setup (Maven, MongoDB, Security config) | 🔴 High |
| User model + MongoDB connection | 🔴 High |
| JWT Auth: Register, Login, Refresh, Logout | 🔴 High |
| Product CRUD (Controller + Service + Repository) | 🔴 High |
| Supplier CRUD | 🟡 Medium |
| Inventory management + change logs | 🔴 High |
| Sales recording (auto-deducts stock) | 🔴 High |
| Global exception handler + validation | 🟡 Medium |

---

### Phase 2 — WhatsApp Features (Week 3)

| Task | Priority |
|---|---|
| Twilio SDK setup + webhook endpoint | 🔴 High |
| WhatsApp OTP generation + sending | 🔴 High |
| OTP verification + JWT issuance | 🔴 High |
| Chatbot session state machine (`WhatsAppSession`) | 🔴 High |
| Command parser: `add stock`, `record sale`, `check stock` | 🔴 High |
| Command parser: `reports`, `help`, `menu` | 🟡 Medium |
| Confirmation messages + error handling | 🟡 Medium |

---

### Phase 3 — Frontend Migration (Week 4–5)

| Task | Priority |
|---|---|
| Install Tailwind CSS in existing React project | 🔴 High |
| Migrate `index.css` → Tailwind | 🔴 High |
| Migrate `Login.jsx` (+ add WhatsApp OTP tab) | 🔴 High |
| Migrate `Register.jsx`, `Dashboard.jsx` | 🔴 High |
| Migrate `Products.jsx`, `Inventory.jsx` | 🔴 High |
| Migrate `Sales.jsx`, `Suppliers.jsx` | 🟡 Medium |
| Migrate `PurchaseOrders.jsx`, `WhatsApp.jsx` | 🟡 Medium |
| Update Axios client with JWT interceptors | 🔴 High |

---

### Phase 4 — Purchase Orders + Dashboard + Forecasts (Week 5–6)

| Task | Priority |
|---|---|
| Dashboard stats API | 🔴 High |
| Dashboard charts (revenue, top products) | 🟡 Medium |
| Purchase Orders full flow | 🟡 Medium |
| Forecast stub: Simple Moving Average | 🟢 Low |
| Forecast UI (or "Coming Soon" placeholder) | 🟢 Low |

---

### Phase 5 — Polish + Deployment (Week 7)

| Task | Priority |
|---|---|
| Seed data script (Java) | 🟡 Medium |
| Error boundary + loading states | 🟡 Medium |
| Swagger / OpenAPI docs | 🟡 Medium |
| Deploy backend to Railway | 🔴 High |
| Deploy frontend to Vercel | 🔴 High |
| Demo walkthrough video | 🟡 Medium |

---

## 12. Deployment Plan

### Backend (Railway — Free Tier)
1. Push Spring Boot project to GitHub
2. Connect Railway to GitHub repo
3. Railway auto-detects Maven → builds JAR
4. Set environment variables (see below)
5. App URL: `https://kiranaai-backend.up.railway.app`

### Frontend (Vercel — Free Tier)
1. Push React project to GitHub
2. Import in Vercel → auto-detects Vite
3. Set env: `VITE_API_URL=https://kiranaai-backend.up.railway.app/api/v1`
4. App URL: `https://kiranaai.vercel.app`

### Environment Variables (Backend)
```properties
# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/kiranaai

# JWT
JWT_SECRET=<256-bit-random-secret>
JWT_ACCESS_EXPIRY=3600000       # 1 hour in ms
JWT_REFRESH_EXPIRY=604800000    # 7 days in ms

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # Sandbox number (free)

# Server
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=https://kiranaai.vercel.app
```

---

## 13. Open Questions

> These need answers before development begins:

| # | Question | Default Assumed |
|---|---|---|
| 1 | **Twilio Sandbox (free) or Meta Business API?** | Twilio Sandbox (free) ✅ |
| 2 | **Hindi support in chatbot?** e.g., "10 kg cheeni daalo" | English-only for v1 |
| 3 | **OTP expiry time?** | 5 minutes |
| 4 | **Team size?** (affects parallel dev tracks) | TBD |
| 5 | **Forecast UI:** show moving avg or "Coming Soon"? | "Coming Soon - ML Pending" |
| 6 | **MongoDB:** Atlas free tier or local? | Atlas free tier (512 MB) |

---

*Generated: June 30, 2026 | KiranaAI College Project*
