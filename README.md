# 🛒 KiranaAI — AI-Powered Inventory Management System

> Final Year College Project | AI + Web Development

KiranaAI is a full-stack inventory management system designed for small **kirana (grocery) stores**. It helps store owners manage products, track inventory, record daily sales, predict future demand using AI/ML, manage suppliers and purchase orders, and automate stock alerts through WhatsApp.

---

## 🚀 Key Features

* 📦 **Product & SKU Management** — Add, update, delete, and manage products
* 📊 **Inventory Management** — Track current stock and reorder thresholds
* 💰 **Sales Management** — Record and analyze daily sales
* 🤖 **AI-Based Demand Forecasting** — Predict future product demand
* 🔔 **Smart Reorder Alerts** — Identify products that need replenishment
* 🧾 **Purchase Order Management** — Create and track supplier orders
* 👨‍💼 **Supplier Management** — Maintain supplier information
* 📱 **WhatsApp Integration** — Send inventory and reorder alerts through WhatsApp
* 🔐 **JWT Authentication** — Secure user authentication and authorization
* 📈 **Dashboard & Analytics** — View inventory, sales, and forecasting insights

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    │   React + Vite      │
                    └──────────┬──────────┘
                               │
                          REST APIs
                               │
                    ┌──────────▼──────────┐
                    │   Spring Boot API   │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────▼─────┐   ┌──────▼─────┐  ┌──────▼──────┐
       │  MongoDB   │   │ AI/ML Layer │  │   Twilio    │
       │  Database  │   │ Forecasting │  │  WhatsApp   │
       └────────────┘   └─────────────┘  └─────────────┘
```

---

# 🚀 Quick Start

## Prerequisites

Make sure the following are installed:

* **Java 17+**
* **Maven 3.8+**
* **Node.js 18+**
* **MongoDB** (Local or MongoDB Atlas)
* Git

---

# 1. Start MongoDB

### Local MongoDB

```bash
mongod --dbpath C:/data/db
```

Or use **MongoDB Atlas** and configure the connection string in the backend `.env`/application configuration.

---

# 2. Setup Backend

Navigate to the backend:

```bash
cd backend
```

Build the Spring Boot application:

```bash
mvn clean install
```

Run the application:

```bash
mvn spring-boot:run
```

Alternatively, run the generated JAR:

```bash
java -jar target/kirana-ai-0.0.1-SNAPSHOT.jar
```

The backend will be available at:

```text
http://localhost:8080
```

---

# 3. Configure Backend

Update:

```text
backend/src/main/resources/application.properties
```

Example configuration:

```properties
spring.application.name=kirana-ai

server.port=8080

spring.data.mongodb.uri=mongodb://localhost:27017/kirana_ai
spring.data.mongodb.database=kirana_ai

# JWT
jwt.secret=your-secret-key
jwt.expiration=86400000

# Twilio
twilio.account-sid=ACxxxxxxxxxxxxxxxxxxxxxxxx
twilio.auth-token=xxxxxxxxxxxxxxxxxxxxxxxx
twilio.whatsapp-from=whatsapp:+14155238886
```

> For production, sensitive credentials should be provided through environment variables rather than committed to Git.

---

# 4. Setup Frontend

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

---

# 5. Demo Login

```text
Email:    demo@kiranaai.com
Password: demo123
```

---

# 📁 Project Structure

```text
KiranaAI/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── kiranaai/
│   │   │   │           ├── controller/
│   │   │   │           │   ├── AuthController.java
│   │   │   │           │   ├── ProductController.java
│   │   │   │           │   ├── SupplierController.java
│   │   │   │           │   ├── InventoryController.java
│   │   │   │           │   ├── SalesController.java
│   │   │   │           │   ├── ForecastController.java
│   │   │   │           │   ├── PurchaseOrderController.java
│   │   │   │           │   ├── WhatsAppController.java
│   │   │   │           │   └── DashboardController.java
│   │   │   │           │
│   │   │   │           ├── service/
│   │   │   │           │   ├── AuthService.java
│   │   │   │           │   ├── ProductService.java
│   │   │   │           │   ├── InventoryService.java
│   │   │   │           │   ├── SalesService.java
│   │   │   │           │   ├── ForecastService.java
│   │   │   │           │   ├── PurchaseOrderService.java
│   │   │   │           │   └── WhatsAppService.java
│   │   │   │           │
│   │   │   │           ├── repository/
│   │   │   │           │   ├── UserRepository.java
│   │   │   │           │   ├── ProductRepository.java
│   │   │   │           │   ├── SupplierRepository.java
│   │   │   │           │   ├── InventoryRepository.java
│   │   │   │           │   ├── SalesRepository.java
│   │   │   │           │   └── PurchaseOrderRepository.java
│   │   │   │           │
│   │   │   │           ├── model/
│   │   │   │           │   ├── User.java
│   │   │   │           │   ├── Product.java
│   │   │   │           │   ├── Supplier.java
│   │   │   │           │   ├── Inventory.java
│   │   │   │           │   ├── Sale.java
│   │   │   │           │   └── PurchaseOrder.java
│   │   │   │           │
│   │   │   │           ├── dto/
│   │   │   │           ├── security/
│   │   │   │           │   ├── JwtService.java
│   │   │   │           │   ├── JwtAuthenticationFilter.java
│   │   │   │           │   └── SecurityConfig.java
│   │   │   │           │
│   │   │   │           ├── config/
│   │   │   │           └── exception/
│   │   │   │
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   │
│   │   ├── test/
│   │   └── pom.xml
│   │
│   ├── seed/
│   │   └── seed-data.json
│   │
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   └── endpoints.js
│   │   │
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Badges.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Sales.jsx
│   │   │   ├── Forecasts.jsx
│   │   │   ├── PurchaseOrders.jsx
│   │   │   └── WhatsApp.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# 🧠 AI/ML Demand Forecasting

KiranaAI uses a **tiered demand forecasting approach** depending on the amount of historical sales data available.

| Historical Data | Forecasting Approach                     |
| --------------- | ---------------------------------------- |
| < 7 days        | Weighted Moving Average                  |
| 7–13 days       | Linear Regression + Day-of-Week Features |
| 14+ days        | Polynomial Regression + Seasonality      |

The forecasting service analyzes historical sales to estimate future demand for individual products.

### Reorder Formula

```text
Reorder Qty =
max(0, (7-day forecast - current stock) × 1.2)
```

### Low Stock Alert

An inventory alert is generated when:

```text
Current Stock < 3-day predicted demand
        OR
Current Stock ≤ Reorder Threshold
```

---

# 📱 WhatsApp Integration

KiranaAI supports WhatsApp-based inventory alerts using **Twilio WhatsApp API**.

## Demo Mode

The application includes a simulated WhatsApp workflow that can be used without a Twilio account.

This allows the project to be demonstrated locally without requiring external messaging credentials.

## Real Twilio Integration

### 1. Create a Twilio Account

Create a Twilio account and enable the WhatsApp Sandbox.

### 2. Configure Credentials

Add the following environment variables:

```text
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. Expose Local Backend

Using ngrok:

```bash
ngrok http 8080
```

### 4. Configure Webhook

Set the Twilio WhatsApp webhook to:

```text
https://YOUR-NGROK-URL.ngrok.io/api/v1/whatsapp/webhook
```

---

# 🔌 REST API Endpoints

| Method | Endpoint                               | Description                        |
| ------ | -------------------------------------- | ---------------------------------- |
| POST   | `/api/v1/auth/register`                | Register store owner               |
| POST   | `/api/v1/auth/login`                   | Authenticate user and generate JWT |
| GET    | `/api/v1/dashboard/stats`              | Get dashboard statistics           |
| GET    | `/api/v1/products`                     | Get all products                   |
| POST   | `/api/v1/products`                     | Add a product                      |
| GET    | `/api/v1/sales`                        | Get sales history                  |
| POST   | `/api/v1/sales`                        | Record a sale                      |
| GET    | `/api/v1/inventory`                    | Get inventory levels               |
| PATCH  | `/api/v1/inventory/{id}`               | Update stock                       |
| POST   | `/api/v1/forecasts/generate`           | Generate demand forecast           |
| GET    | `/api/v1/purchase-orders`              | Get purchase orders                |
| POST   | `/api/v1/purchase-orders`              | Create purchase order              |
| PATCH  | `/api/v1/purchase-orders/{id}/deliver` | Mark order as delivered            |
| POST   | `/api/v1/whatsapp/demo/send-alert`     | Send demo WhatsApp alert           |

---

# 🛠️ Technology Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Frontend         | React 18 + Vite                 |
| Routing          | React Router                    |
| Styling          | Vanilla CSS                     |
| Charts           | Recharts                        |
| Backend          | **Java 17 + Spring Boot**       |
| API              | Spring Boot REST API            |
| Security         | **Spring Security + JWT**       |
| Password Hashing | BCrypt                          |
| Database         | **MongoDB**                     |
| Database Access  | Spring Data MongoDB             |
| Validation       | Jakarta Bean Validation         |
| AI/ML            | Forecasting / Regression Models |
| Messaging        | Twilio WhatsApp API             |
| Build Tool       | Maven                           |
| API Testing      | Postman                         |
| Deployment       | Vercel + Render                 |

---

# 🔐 Authentication & Security

KiranaAI uses **JWT-based authentication** with Spring Security.

Authentication flow:

```text
User
 │
 │ Login
 ▼
Spring Boot API
 │
 ├── Validate Credentials
 │
 ├── BCrypt Password Verification
 │
 └── Generate JWT
          │
          ▼
       Frontend
          │
          │ Authorization: Bearer <JWT>
          ▼
   Protected REST APIs
```

Protected endpoints require a valid JWT token.

---

# 📊 Demo Data

The application can be populated with sample data for demonstration purposes.

Demo dataset includes:

* **1 store owner**

  * Ramesh Kumar
  * Ramesh General Store
* **3 suppliers**

  * Dairy Supplier
  * National Foods
  * Local FMCG
* **15 products**
* **5 product categories**
* **60 days of sales history**
* **2 sample purchase orders**

The historical sales data is used by the forecasting module to generate demand predictions.

---

# 🧪 Testing

Backend tests can be executed using Maven:

```bash
cd backend

mvn test
```

API endpoints can be tested using:

* Postman
* Swagger/OpenAPI
* Browser for GET endpoints

---

# 🚀 Deployment

## Backend — Render

1. Push the project to GitHub.
2. Create a new **Web Service** on Render.
3. Select the backend directory.
4. Configure the build command:

```bash
mvn clean package -DskipTests
```

5. Configure the start command:

```bash
java -jar target/kirana-ai-0.0.1-SNAPSHOT.jar
```

6. Add environment variables:

```text
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=your-jwt-secret
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=your-whatsapp-number
```

---

## Frontend — Vercel

1. Import the GitHub repository into Vercel.
2. Select the `frontend` directory.
3. Install dependencies:

```bash
npm install
```

4. Build the application:

```bash
npm run build
```

5. Configure the backend API URL:

```text
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

6. Deploy.

---

# 📚 Documentation

Project documentation:

```text
KiranaAI_Project_Report.md
```

API documentation can be accessed through the configured Swagger/OpenAPI endpoint when enabled.

---

| Role                | Responsibilities                                    |
| ------------------- | --------------------------------------------------- |
| Frontend Developer  | React UI, routing, API integration                  |
| Backend Developer   | Spring Boot, REST APIs, MongoDB, JWT authentication |
| ML Developer        | Forecasting models and data preprocessing           |
| Full Stack / DevOps | Integration, testing and deployment                 |

---

# 🎯 Project Objective

The primary objective of KiranaAI is to help small grocery stores make **data-driven inventory decisions** without requiring complex enterprise inventory software.

By combining:

```text
Sales Data
     ↓
Inventory Tracking
     ↓
Demand Forecasting
     ↓
Low-Stock Detection
     ↓
Reorder Recommendation
     ↓
Purchase Order
     ↓
WhatsApp Notification
```

KiranaAI provides a simple workflow for managing inventory and reducing both **stock-outs** and **overstocking**.

---

## ⭐ Future Enhancements

* Advanced time-series forecasting using LSTM/Prophet
* Automated purchase-order generation
* Supplier price comparison
* Multi-store management
* Barcode/QR code scanning
* GST invoice generation
* Voice-based inventory management
* WhatsApp-based inventory queries
* Sales and profit analytics
* Cloud-based scheduled forecasting
* Role-based access control for store employees

---

## 📄 License

This project was developed as a **Final Year College Project** for educational and demonstration purposes.
