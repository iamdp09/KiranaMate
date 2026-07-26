<<<<<<< HEAD
# 🛒 KiranaAI — AI-Powered Inventory Management System

> Final Year College Project | AI + Web Development

KiranaAI is a full-stack web application that helps small kirana (grocery) stores manage inventory, record daily sales, predict future demand using AI/ML, and automate reorder workflows through WhatsApp.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

---

### 1. Start MongoDB

```bash
# If using local MongoDB:
mongod --dbpath C:/data/db
```

Or use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier).

---

### 2. Setup Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
# Edit .env with your MongoDB URL if using Atlas

# Seed demo data (optional but recommended)
python seed_data.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API will be available at: http://localhost:8000  
Swagger docs at: http://localhost:8000/docs

---

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: http://localhost:5173

---

### 4. Demo Login

```
Email:    demo@kiranaai.com
Password: demo123
```

---

## 📁 Project Structure

```
KiranaAI/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── suppliers.py
│   │   │   ├── inventory.py
│   │   │   ├── sales.py
│   │   │   ├── forecasts.py
│   │   │   ├── purchase_orders.py
│   │   │   ├── whatsapp.py
│   │   │   └── dashboard.py
│   │   ├── core/
│   │   │   ├── config.py   # App settings
│   │   │   └── security.py # JWT + bcrypt
│   │   ├── db/
│   │   │   └── database.py # MongoDB connection
│   │   ├── models/
│   │   │   └── schemas.py  # Pydantic models
│   │   ├── services/
│   │   │   ├── ml_service.py       # AI forecasting
│   │   │   └── whatsapp_service.py # WhatsApp messaging
│   │   └── main.py
│   ├── seed_data.py         # Demo data seeder
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js    # Axios base client
│   │   │   └── endpoints.js # All API calls
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Badges.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
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
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## 🧠 AI/ML Forecasting

The system uses a tiered forecasting approach:

| Data Available | Model Used |
|---|---|
| < 7 days | Weighted Moving Average |
| 7–13 days | Linear Regression with day-of-week features |
| 14+ days | Polynomial Regression with seasonality |

**Reorder Formula:**
```
Reorder Qty = max(0, (7-day forecast - current stock) × 1.2)
```

**Alert Trigger:**
```
Current Stock < 3-day predicted demand  OR  Current Stock ≤ Reorder Threshold
```

---

## 📱 WhatsApp Integration

### Demo Mode (Default)
The system includes a full simulation at `/whatsapp` page — no Twilio account needed.

### Real Twilio Integration
1. Create a [Twilio account](https://www.twilio.com/) (free)
2. Enable WhatsApp Sandbox
3. Add credentials to `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxx
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
4. Expose webhook with ngrok:
   ```bash
   ngrok http 8000
   ```
5. Set webhook URL in Twilio console:
   ```
   https://YOUR-NGROK-URL.ngrok.io/api/v1/whatsapp/webhook
   ```

---

## 🔌 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register store owner |
| POST | `/api/v1/auth/login` | Login + get JWT token |
| GET | `/api/v1/dashboard/stats` | Dashboard aggregate stats |
| GET/POST | `/api/v1/products` | List / add products |
| GET/POST | `/api/v1/sales` | View / record daily sales |
| GET | `/api/v1/inventory` | View stock levels |
| PATCH | `/api/v1/inventory/{id}` | Update stock level |
| POST | `/api/v1/forecasts/generate` | Run AI forecast |
| GET | `/api/v1/purchase-orders` | View purchase orders |
| PATCH | `/api/v1/purchase-orders/{id}/deliver` | Mark delivered, update stock |
| POST | `/api/v1/whatsapp/demo/send-alert` | Demo WhatsApp alert |

Full interactive docs at: **http://localhost:8000/docs**

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Styling | Vanilla CSS (custom design system) |
| Charts | Recharts |
| Backend | Python FastAPI |
| Auth | JWT + bcrypt |
| Database | MongoDB (Motor async driver) |
| ML/AI | NumPy, Pandas, Scikit-learn |
| Messaging | Twilio WhatsApp (simulated by default) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 👥 Team

| Role | Responsibilities |
|---|---|
| Frontend Dev | React UI, routing, API integration |
| Backend Dev | FastAPI, MongoDB, JWT auth |
| ML Developer | Forecasting models, data preprocessing |
| Full Stack / DevOps | Integration, deployment, testing |

---

## 📊 Demo Data

After running `python seed_data.py`:
- **1 store owner** (Ramesh Kumar, Ramesh General Store)
- **3 suppliers** (Dairy, National Foods, Local FMCG)
- **15 products** across 5 categories
- **60 days** of realistic sales history
- **2 sample purchase orders**

---

## 🚀 Deployment

### Backend (Render.com)
1. Push to GitHub
2. Create new Web Service on Render
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Frontend (Vercel)
1. Import GitHub repo
2. Set `VITE_API_URL=https://your-backend.render.com/api/v1`
3. Deploy

---

## 📚 Documentation

- Project Report: `../KiranaAI_Project_Report.md`
- API Docs: http://localhost:8000/docs (Swagger UI)

---

=======
# Kirana-AI
>>>>>>> 96beac8049981761351dafc07aafc554a29c0859
