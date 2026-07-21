# 🚔 KSP Intelligent Crime AI Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.139.0-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2.7-61DAFB?logo=react)](https://react.dev)
[![Zoho Catalyst](https://img.shields.io/badge/Zoho_Catalyst-AppSail_%26_Hosting-007BE5)](https://catalyst.zoho.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Primary_OLTP-4169E1?logo=postgresql)](https://www.postgresql.org)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E44AD?logo=google)](https://ai.google.dev)

An enterprise-grade, AI-powered Crime Intelligence and Investigation Support Platform developed for the **Karnataka State Police (KSP)**.

---

## 🌐 Live Production Deployments

- **Frontend Application**: [https://police-tjrilmgj.onslate.in/](https://police-tjrilmgj.onslate.in/)
- **Backend API Service (Render)**: [https://police-98i7.onrender.com](https://police-98i7.onrender.com)
- **Interactive API Documentation (Swagger)**: [https://police-98i7.onrender.com/docs](https://police-98i7.onrender.com/docs)
- **System Health Check**: [https://police-98i7.onrender.com/health](https://police-98i7.onrender.com/health)

---

## 🏗️ Architecture Overview

```
                      ┌─────────────────────────────────────────────────────────┐
                      │              React 19 + Vite + TailwindCSS              │
                      │        (Deployed on Onslate / Catalyst Hosting)         │
                      └────────────────────────────┬────────────────────────────┘
                                                   │ HTTPS / Bearer JWT
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       FastAPI Backend Microservice                                     │
│                                           (Deployed on Render)                                         │
│                                                                                                        │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────────┐  │
│  │   Auth Bridge    │    │ Evidence Repo    │    │ Notification Svc │    │   Conversation Store     │  │
│  │ (Catalyst + JWT) │    │(FileStore+Zia)   │    │  (Mail + Signals)│    │     (Catalyst NoSQL)     │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘    └────────────┬─────────────┘  │
└───────────┼───────────────────────┼───────────────────────┼───────────────────────────┼────────────────┘
            │                       │                       │                           │
            ▼                       ▼                       ▼                           ▼
 ┌────────────────────┐   ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────────────┐
 │   PostgreSQL DB    │   │Catalyst FileStore │   │Catalyst Mail/Signal│  │     Catalyst NoSQL        │
 │   (Primary OLTP)   │   │(Evidence Assets)  │   │ (Emails + Push)   │   │  (Conversation & Metadata)│
 └────────────────────┘   └───────────────────┘   └───────────────────┘   └───────────────────────────┘
```

---

## 🔐 Role-Based Access Control (RBAC) & Permissions

The platform enforces a 10-tier rank hierarchy with permission keys:

| Rank / Role | Dashboard | Cases | Evidence | Analytics & AI | Crime Trends | Admin Tools |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Constable** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Head Constable** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sub Inspector** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Inspector** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **DSP** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **SP / DIG / IGP / DGP**| ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## ⚡ Quick Start & Local Running

### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1   # On Windows
# source .venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run database seeder (Populates 100 Officers, 500 FIRs, 300 Cases, 450 Accused, 900 Evidence)
python scripts/seed_demo.py

# Start local server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup (React)
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
```env
PORT=8000
FRONTEND_URL=https://police-tjrilmgj.onslate.in
EXTRA_CORS_ORIGINS="https://police-tjrilmgj.onslate.in,http://localhost:5173"
DATABASE_URL=postgresql://postgres:password@localhost:5432/ksp_crime_ai
AI_PROVIDER=gemini
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
SECRET_KEY=YOUR_JWT_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://police-98i7.onrender.com
```

---

## 📊 Demo Seeder Script (`backend/scripts/seed_demo.py`)

Run the master seeder script to populate PostgreSQL and Catalyst DataStore/NoSQL collections with realistic Karnataka police records:

```bash
python backend/scripts/seed_demo.py
```

**Seeded Data Quota:**
- 10 Districts & 30 Police Stations
- 100 Officers (Credentials: `admin@ksp.gov.in` / `Admin@123`, `officer1@ksp.gov.in` / `Officer@123`)
- 500 FIRs & 300 Active/Solved Cases
- 450 Accused Persons & Suspects
- 900 Evidence Items (Images, Videos, Audio, PDFs)
- 250 Victims & 200 Witnesses
- 120 Chargesheets & 75 Court Orders
- 50 Investigation Logs, 100 AI Conversations, 500 Notifications

---

## 🛠️ API Endpoint Catalogue

| Method | Endpoint | Description | Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate officer & return JWT tokens | Public |
| `POST` | `/api/auth/logout` | Discard tokens & invalidate Catalyst session | Public |
| `GET` | `/health` | Live status for Backend, DB, Gemini & Catalyst | Public |
| `GET` | `/version` | Environment & version metadata | Public |
| `GET` | `/api/dashboard/stats` | KPI metrics for total FIRs, cases, wanted, evidence | `dashboard` |
| `GET` | `/api/cases` | Paginated list of FIRs & cases with jurisdiction filter | `cases` |
| `GET` | `/api/evidence` | Paginated evidence grid with file previews | `evidence` |
| `POST` | `/api/evidence/upload` | Catalyst File Store upload & automatic Zia OCR | `evidence` |
| `POST` | `/api/ai/chat` | Gemini LLM conversation endpoint with streaming | `dashboard` |
| `GET` | `/api/notifications` | Real-time notifications for active officer | `dashboard` |
