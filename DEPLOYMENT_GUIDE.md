# 🚔 KSP Crime Intelligence Platform — Catalyst Deployment & Operations Guide

**Version**: 3.0.0 — Catalyst-First Architecture  
**Target Platform**: Zoho Catalyst (AppSail + File Store + NoSQL + DataStore + Cache + Zia + Mail + Signals + Cron)  
**Primary Database**: PostgreSQL (OLTP)  

---

## 📐 Architecture Overview

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                   React Web Frontend                    │
                        └────────────────────────────┬────────────────────────────┘
                                                     │ HTTP REST / WebSockets
                                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Backend Service (Catalyst AppSail)                              │
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

## 🛠️ Step 1: Pre-Deployment Setup

### 1.1 Prerequisites
- Node.js v18+ and npm installed
- Python 3.11 installed
- Zoho Catalyst CLI installed:
  ```bash
  npm install -g zcatalyst-cli
  ```
- Active Zoho Catalyst account with project `KSP_Crime_AI` (Project ID: `45574000000028001`)

### 1.2 Catalyst CLI Login
```bash
catalyst login
```

---

## ⚙️ Step 2: Zoho Catalyst Console Configuration

Log in to [Zoho Catalyst Console](https://catalyst.zoho.com) and perform the following setups:

### 2.1 File Store (Folders)
Navigate to **File Store** -> **Folders** -> **Create Folders**:
Create the following 12 folders and note their numeric IDs:

| Folder Name | Description | Environment Variable Name |
| :--- | :--- | :--- |
| `Evidence Images` | Photos of crime scenes, suspects, items | `CATALYST_FILE_STORE_FOLDER_EVIDENCE_IMAGES` |
| `Evidence Videos` | CCTV clips, bodycam footage | `CATALYST_FILE_STORE_FOLDER_EVIDENCE_VIDEOS` |
| `Evidence Audio` | Voice recordings, wiretaps, interviews | `CATALYST_FILE_STORE_FOLDER_EVIDENCE_AUDIO` |
| `FIR Documents` | Original FIR PDFs | `CATALYST_FILE_STORE_FOLDER_FIR` |
| `Charge Sheets` | Formal chargesheets | `CATALYST_FILE_STORE_FOLDER_CHARGESHEETS` |
| `Court Orders` | Warrants, court summons, orders | `CATALYST_FILE_STORE_FOLDER_COURT_ORDERS` |
| `Forensic Reports` | Lab & ballistics analysis | `CATALYST_FILE_STORE_FOLDER_FORENSIC` |
| `Fingerprints` | Fingerprint scans | `CATALYST_FILE_STORE_FOLDER_FINGERPRINTS` |
| `DNA Reports` | Genetic profiles | `CATALYST_FILE_STORE_FOLDER_DNA` |
| `CCTV` | Raw CCTV footage | `CATALYST_FILE_STORE_FOLDER_CCTV` |
| `Witness Statements` | Recorded witness statements | `CATALYST_FILE_STORE_FOLDER_WITNESS` |
| `Misc` | Other documents | `CATALYST_FILE_STORE_FOLDER_MISC` |

### 2.2 Cache (Segments)
Navigate to **Cache** -> **Create Segments**:
Create the following 7 cache segments and copy their IDs:

| Segment Name | Default TTL | Environment Variable |
| :--- | :--- | :--- |
| `DashboardStats` | 300s | `CATALYST_CACHE_SEGMENT_DASHBOARD` |
| `OfficerProfiles` | 600s | `CATALYST_CACHE_SEGMENT_OFFICER` |
| `AnalyticsData` | 1800s | `CATALYST_CACHE_SEGMENT_ANALYTICS` |
| `CrimeHeatmaps` | 3600s | `CATALYST_CACHE_SEGMENT_HEATMAP` |
| `AICache` | 300s | `CATALYST_CACHE_SEGMENT_AI` |
| `SessionCache` | 1800s | `CATALYST_CACHE_SEGMENT_SESSION` |
| `CasesCache` | 120s | `CATALYST_CACHE_SEGMENT_CASES` |

### 2.3 DataStore (Relational Store for New Entities)
Navigate to **DataStore** -> **Create Table**:
Create the following 5 tables matching these exact table names:
1. `InvestigationLogs` (Columns: `case_id`, `officer_id`, `action`, `description`, `timestamp`)
2. `Notifications` (Columns: `officer_id`, `message`, `notification_type`, `read_status`, `case_id`)
3. `AuditLogs` (Columns: `officer_id`, `action`, `resource_type`, `resource_id`, `details`, `timestamp`)
4. `AnalyticsSummaries` (Columns: `execution_date`, `total_cases`, `resolved_cases`, `summary_json`)
5. `CrimeHeatmapCache` (Columns: `district_id`, `crime_type`, `coordinates_json`, `updated_at`)

### 2.4 NoSQL (Document Store)
Navigate to **NoSQL** -> **Create Table**:
Create the following 6 tables:
1. `ConversationHistory` (Document key: `session_key`)
2. `EvidenceMetadata` (Document key: `evidence_id`)
3. `OCROutputs` (Document key: `file_id`)
4. `SpeechTranscripts` (Document key: `file_id`)
5. `AnalyticsCache` (Document key: `cache_key`)
6. `ActivityTimeline` (Document key: `event_id`)

### 2.5 Mail Configuration
Navigate to **Mail** -> **Sender Addresses**:
- Add and verify `notifications@ksp.gov.in` (or your authorized domain email).
- Set `CATALYST_MAIL_FROM_ADDRESS` in `.env`.

### 2.6 Cron Scheduling
Navigate to **Cron** -> **Create Cron Job**:
- **Job Name**: `nightly_analytics`
- **Schedule**: Daily at 00:30 IST (`0 0:30 * * *`)
- **Target Function**: `nightly_analytics`

---

## 🚀 Step 3: Local Environment Setup

1. **Copy Environment Template**:
   ```bash
   cp backend/.env.catalyst.example backend/.env
   ```

2. **Fill Credentials**: Edit `backend/.env` and supply:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `GOOGLE_API_KEY` (Gemini API key)
   - `SECRET_KEY` (JWT secret)
   - All `CATALYST_*` folder IDs and segment IDs generated in Step 2.

3. **Install Dependencies**:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\Activate.ps1   # Windows
   pip install -r requirements.txt
   ```

4. **Run Server Locally**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 🚢 Step 4: Deployment to Zoho Catalyst

### 4.1 Deploy AppSail Backend
```bash
catalyst deploy --only appsail
```

### 4.2 Deploy Nightly Analytics Cron Function
```bash
catalyst deploy --only functions:nightly_analytics
```

### 4.3 Deploy React Web Client (Optional)
```bash
cd frontend
npm run build
cd ..
catalyst deploy --only client
```

### 4.4 Verify Full Deployment
```bash
catalyst deploy
```

---

## 🔍 Step 5: Verification & Health Checks

Once deployed, verify all endpoints using the automated health check:

1. **Core API Health**:
   ```http
   GET https://your-app.catalystserverless.in/health
   ```
   *Expected*: `{"status": "healthy", "version": "3.0.0"}`

2. **Catalyst 13-Service Diagnostic**:
   ```http
   GET https://your-app.catalystserverless.in/api/catalyst/health
   ```
   *Expected*: Status summary showing `ok` for all configured Catalyst services.

3. **Interactive API Documentation**:
   Navigate to `https://your-app.catalystserverless.in/docs` to test:
   - `/api/files/{file_id}/details`
   - `/api/ocr/extract`
   - `/api/audio/transcribe`
   - `/api/notifications`

---

## 📋 Step 6: Operations & Troubleshooting

### Log Inspection
- View AppSail logs:
  ```bash
  catalyst logs --app appsail
  ```
- View Cron Function logs:
  ```bash
  catalyst logs --function nightly_analytics
  ```

### Graceful Degradation Strategy
The platform is designed with defensive fallbacks:
- If **Catalyst File Store** is unreachable $\rightarrow$ Files save to local disk (`uploads/evidence/`).
- If **Catalyst NoSQL** is offline $\rightarrow$ Chat history falls back to in-memory L1 cache.
- If **Catalyst Cache** misses $\rightarrow$ Queries fall back to PostgreSQL.
- If **Catalyst Mail/Signals** fail $\rightarrow$ Errors are logged without breaking user HTTP requests.
