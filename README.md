# 🚔 KSP AI Investigation Platform

> An AI-powered platform that helps Karnataka State Police streamline investigations, manage digital evidence and assist officers with intelligent case analysis.

---

## 📌 Project Overview

Criminal investigations often involve fragmented records, manual workflows, and delayed access to critical information. KSP AI Investigation Platform addresses these challenges by providing a centralized AI-powered solution for case management, digital evidence handling, intelligent investigation assistance, and secure role-based collaboration.

Designed for the Karnataka State Police, the platform combines modern cloud technologies with AI to improve operational efficiency, enhance decision-making, and support faster investigations.

---

## 🌐 Live Demo

| Service | Link |
|----------|------|
| 🚀 Frontend | https://police-tjrilmgj.onslate.in |
| ⚙️ Backend API | https://police-98i7.onrender.com |
| 📖 API Documentation | https://police-98i7.onrender.com/docs |
| ❤️ Health Check | https://police-98i7.onrender.com/health |

---

## 🎥 Demo Video

---

## ✨ Key Features

| Feature                        | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| 🔐 Role-Based Authentication   | Secure login with permission-based access for different police ranks |
| 🤖 AI Investigation Assistant  | Google Gemini powered chatbot for investigation support              |
| 📂 Case Management             | Create, assign, and monitor investigations                           |
| 📁 Digital Evidence Repository | Upload and organize investigation evidence                           |
| 📊 Crime Analytics             | Interactive dashboards and crime insights                            |
| 🔔 Real-Time Notifications     | Instant officer notifications                                        |
| ☁️ Cloud Deployment            | Hosted using Render and Zoho Catalyst                                |

---

## 🛠 Technology Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | FastAPI |
| Database | PostgreSQL |
| AI | Google Gemini 2.5 Flash |
| Authentication | JWT, Zoho Catalyst |
| Storage | Catalyst FileStore |
| Deployment | Render, Zoho Catalyst |


---

## 👥 Team Contributions

#### Jeevan : ***Team Lead & Full Stack Developer***

- Led the overall project development and system architecture.
- Implemented core backend functionalities and integrated AI and cloud services.
- Managed deployment, coordinated the team, and oversaw end-to-end project integration.

#### Shubha : ***Backend Developer***

- Diagnosed and resolved backend issues affecting the AI investigation assistant, improving response accuracy and reliability.
- Implemented and refined the role-based authentication system for secure, permission-based access.
- Contributed to backend enhancements and redesigned key frontend interfaces to improve overall user experience.

#### Druthi : ***Demo & Storytelling***

- Created the project demonstration video.
- Developed the product walkthrough to effectively showcase the platform's features and workflow.

#### Kishan : ***Presentation Team***

- Prepared presentation materials.
- Contributed to the final project presentation.

#### Dharun : ***Presentation Team***

- Assisted in preparing presentation materials.
- Participated in the final project presentation.
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


## 🔐 Role-Based Access Control & Permissions

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

# Run database seeder 
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

## ⚙️ Environment Configuration

Create a `.env` file in the respective directories and configure the required environment variables.

### Backend

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL database connection string |
| `GOOGLE_API_KEY` | Google Gemini API key |
| `SECRET_KEY` | JWT secret key |
| `FRONTEND_URL` | Frontend application URL |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## 📊 Demo Dataset

The seeder generates realistic police records for development and testing.

Run the seeder using:

```bash
python backend/scripts/seed_demo.py
```

| Dataset | Count |
|----------|------:|
| Police Officers | 100 |
| FIRs | 500 |
| Cases | 300 |
| Accused Records | 450 |
| Evidence Files | 900 |
| Victims | 250 |
| Witnesses | 200 |
| Chargesheets | 120 |
| Court Orders | 75 |
| Notifications | 500 |


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

---

## 🏆 Hackathon Submission

From investigation to intelligence, this platform was developed to empower the **Karnataka State Police** with AI-driven insights, secure digital workflows, and smarter investigation capabilities.

---

> **Built with ❤️ for Hack2skill Datathon 2026**

---

