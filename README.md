# 🚨 KSP Crime AI

> Transforming traditional crime record management into an intelligent, AI-assisted investigation ecosystem.

## 📌 Overview

**KSP Crime AI** is an AI-powered investigation and crime intelligence platform designed to help law enforcement teams efficiently analyze crime records, manage investigations, and extract actionable insights.

The platform combines **Natural Language AI, intelligent database querying, case management, evidence tracking, analytics, and automated reporting** into a unified system.

Instead of manually searching through large crime databases or writing complex SQL queries, investigators can simply ask questions in natural language and receive meaningful insights instantly.

Example:

> "Show me all repeat offenders involved in vehicle theft cases in Bangalore."

The AI assistant understands the request, generates the required database query, retrieves relevant records, and presents investigation-ready insights.

---

# 🌟 Key Features

<table>
<tr>
<td width="50%">

## 🤖 AI Investigation Assistant

Transform investigation queries into meaningful insights.

**Capabilities**
- Natural language crime record search
- AI-powered SQL query generation
- Automated investigation insights
- Conversational database interaction

</td>

<td width="50%">

## 📂 Crime Case Management

Centralized digital management of investigation records.

**Capabilities**
- Crime case tracking
- Suspect information management
- Investigation workflow support
- Structured record organization

</td>
</tr>

<tr>
<td width="50%">

## 🔍 Evidence Intelligence

Simplify evidence organization and investigation analysis.

**Capabilities**
- Evidence record management
- Investigation data linking
- Faster information retrieval
- AI-assisted analysis support

</td>

<td width="50%">

## 📊 Analytics & Reporting

Convert crime data into actionable intelligence.

**Capabilities**
- Crime trend visualization
- Investigation statistics
- Automated report generation
- Exportable documentation

</td>
</tr>

<tr>
<td colspan="2">

## 🗺️ Interactive Crime Mapping

Visualize crime patterns through location-based intelligence.

**Capabilities**
- Geographic crime visualization
- Location-based analysis
- Pattern identification
- Map-driven investigation insights

</td>
</tr>

</table>

---


## 🏗️ System Architecture

```
                  Investigator
                       |
                       ↓
             React Investigation UI
                       |
                       ↓
                 FastAPI Backend
                       |
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
 AI Query Engine   PostgreSQL     Analytics
        |
        ↓
 Natural Language Processing
        |
        ↓
 AI SQL Generation
        |
        ↓
 Query Validation
        |
        ↓
 Database Execution
        |
        ↓
 Investigation Insights
```

---

## 🧠 AI Workflow

```
User Question
      |
      ↓
Natural Language Understanding
      |
      ↓
Database Schema Analysis
      |
      ↓
AI Generated SQL Query
      |
      ↓
SQL Validation & Security Checks
      |
      ↓
PostgreSQL Execution
      |
      ↓
AI-Powered Investigation Response
```

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Backend** | FastAPI, Python, SQLAlchemy |
| **Database** | PostgreSQL, psycopg2 |
| **Frontend** | React 19, Vite, React Router |
| **UI & Visualization** | Recharts, Leaflet Maps |
| **Reporting** | jsPDF, html2canvas |
| **Artificial Intelligence** | Zoho Catalyst QuickML, Google Gemini |
| **Development Tools** | Git, GitHub, VS Code |

---

## 📁 Project Structure

```
KPS-Crime-AI/

├── backend/
│   ├── app/
│   │   ├── api/          # API Routes
│   │   ├── ai/           # AI Engine & LLM Integration
│   │   ├── services/     # Business Logic
│   │   ├── database/     # Database Configuration
│   │   └── main.py
│   │
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   └── UI Logic
    │
    └── package.json
```

---

# 🚀 Getting Started

## Prerequisites

<div align="center">

| Requirement | Version |
|-------------|---------|
| Python | 3.10+ |
| Node.js | Latest |
| PostgreSQL | Latest |

</div>

## Backend Setup

<div align="center">

| Step | Command |
|------|---------|
| Navigate | `cd backend` |
| Create Environment | `python -m venv venv` |
| Activate | `venv\Scripts\activate` |
| Install Dependencies | `pip install -r requirements.txt` |
| Start Server | `uvicorn app.main:app --reload` |

</div>

```
Backend runs at: http://localhost:8000
```

---

## 🎨 Frontend Setup

<div align="center">

| Step | Command |
|------|---------|
| Navigate | `cd frontend` |
| Install Packages | `npm install` |
| Start Development Server | `npm run dev` |

</div>

```
Frontend runs at: http://localhost:5173

```

---

## 🔐 AI Configuration

The platform currently uses: Zoho Catalyst QuickML

AI Pipeline:

```
User Query
     ↓
Catalyst LLM
     ↓
SQL Generation
     ↓
SQL Validation
     ↓
PostgreSQL
     ↓
AI Response
```

Gemini integration is available as an alternative AI provider.

---
## 🔮 Future Roadmap

| Enhancement                 | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| Real-Time Crime Prediction  | Predict potential crime patterns using historical data     |
| Facial Recognition Support  | Assist identification through image-based analysis         |
| Advanced Forensic Analytics | Extract deeper insights from forensic records              |
| Relationship Intelligence   | Discover connections between suspects, cases, and evidence |
| Role-Based Access Control   | Introduce secure access levels for different users         |
| Cloud Deployment            | Deploy the platform for scalable real-world usage          |
| Mobile Investigation App    | Enable field officers to access intelligence remotely      |


---

## 🏆 Project Vision

KSP Crime AI aims to bridge the gap between traditional crime record systems and modern artificial intelligence.

---

## 👥 Team & Contributions

---

## 🎥 Project Demo

Watch the complete walkthrough of KSP Crime AI:

---

 KSP Crime AI was developed as part of **Datathon 2026 — a Karnataka State Police innovation challenge** 

> ⭐ **Where data meets decisions, and intelligence supports justice.**

