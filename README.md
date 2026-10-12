# UrbanPulse — City Infrastructure Anomaly & Impact Intelligence Platform

> **Final-Year Software Engineering Project**  
> A full-stack civic infrastructure telemetry, rule-based priority/impact intelligence, evidence verification, and automated municipal alert dispatch platform.

---

## Table of Contents

1. [Project Title & Overview](#1-project-title--overview)
2. [Problem Statement](#2-problem-statement)
3. [Project Objectives](#3-project-objectives)
4. [Key Features](#4-key-features)
5. [Real-World Applications](#5-real-world-applications)
6. [Technology Stack](#6-technology-stack)
7. [System Architecture Overview](#7-system-architecture-overview)
8. [Frontend Module Description](#8-frontend-module-description)
9. [Backend Module Description](#9-backend-module-description)
10. [Database Design Overview](#10-database-design-overview)
11. [Issue Reporting Workflow](#11-issue-reporting-workflow)
12. [Priority Scoring Explanation (Rule-Based Engine)](#12-priority-scoring-explanation-rule-based-engine)
13. [Impact Analysis Explanation (Rule-Based Engine)](#13-impact-analysis-explanation-rule-based-engine)
14. [Alert Generation & Synchronization Workflow](#14-alert-generation--synchronization-workflow)
15. [Municipal / Civic Sectors Supported](#15-municipal--civic-sectors-supported)
16. [Evidence Upload Support (Photos & Videos)](#16-evidence-upload-support-photos--videos)
17. [REST API Endpoint Reference](#17-rest-api-endpoint-reference)
18. [Project Directory Structure](#18-project-directory-structure)
19. [Prerequisites](#19-prerequisites)
20. [Installation Steps](#20-installation-steps)
21. [PostgreSQL Database Setup Steps](#21-postgresql-database-setup-steps)
22. [Environment Variable Configuration](#22-environment-variable-configuration)
23. [Backend Startup Command](#23-backend-startup-command)
24. [Frontend Startup Command](#24-frontend-startup-command)
25. [Testing & Live Demonstration Instructions](#25-testing--live-demonstration-instructions)
26. [Screenshots](#26-screenshots)
27. [Current Limitations](#27-current-limitations)
28. [Future Scope & Enhancements](#28-future-scope--enhancements)
29. [Author & Project Credits](#29-author--project-credits)

---

## 1. Project Title & Overview

**Project Name:** UrbanPulse  
**Formal Title:** *UrbanPulse — City Infrastructure Anomaly & Impact Intelligence Platform*

**UrbanPulse** is a full-stack web application designed to help citizens report urban infrastructure anomalies—such as road damage, traffic hazards, waterlogging, drainage blockages, street lighting failures, and waste accumulation—while equipping municipal corporations with **rule-based priority scoring**, **urban impact intelligence**, **geospatial hotspot mapping**, **photo/video field evidence verification**, and **automated authority alert dispatch**.

Unlike simple complaint boxes that store reports chronologically, UrbanPulse evaluates every incoming report across multiple weighted dimensions (severity, defect category, workflow status, and spatial cluster density) to ensure the most disruptive civic hazards rise to the top of the municipal response queue.

---

## 2. Problem Statement

Modern cities face thousands of daily civic infrastructure failures—potholes on arterial roads, broken traffic signals, overflowing storm drains, and unlit intersections. Traditional municipal grievance portals suffer from four critical limitations:

1. **Lack of Objective Prioritization:** Complaints are processed in First-In-First-Out (FIFO) order rather than by public safety risk or urban disruption impact.
2. **Departmental Fragmentation:** Reports are rarely categorized into structured municipal service sectors, causing delays in routing incidents to the responsible authority wing (e.g., Public Works Department vs. Sewerage & Drainage Wing).
3. **Unverified Field Claims:** Without attached visual proof (photos or videos) and exact GPS coordinates, maintenance teams waste time locating or verifying reported defects.
4. **Disconnected Alert & Resolution Tracking:** When a field engineer updates an issue's status, municipal dispatch alerts often remain stale or unsynchronized.

---

## 3. Project Objectives

1. **Structured Multi-Sector Ingestion:** Enable structured reporting of civic issues classified by both **Municipal Civic Sector** (11 service wings) and **Defect Category** (7 categories) with GPS coordinates.
2. **Photo & Video Evidence Verification:** Support optional multipart image and video proof uploads (`JPG`, `PNG`, `WEBP`, `MP4`, `WEBM`, `MOV` up to `50 MB`) with instant preview and full-screen modal inspection.
3. **Deterministic Rule-Based Intelligence:** Implement transparent, explainable mathematical models for **Priority Scoring** and **Urban Impact Assessment (0–100)** without relying on opaque black-box claims.
4. **Automated Authority Alerting & Lifecycle Sync:** Automatically generate municipal alerts for high-priority issues (`Priority Score >= 55` or `Severity IN ('High', 'Critical')`), assign them to the corresponding civic department, and synchronize alert states when issue statuses change.
5. **Geospatial & Statistical Visualization:** Provide an interactive OpenStreetMap command center with coordinate clustering, sector/category/severity filters, and live operational analytics optimized for `1366×768` presentation screens.

---

## 4. Key Features

- **Command Center Dashboard:** Real-time 5-KPI summary strip, Priority Intelligence Leaderboard, Active Municipal Alerts dispatch panel, Municipal Sector Distribution overview, Recent Activity feed, and Primary Urban Bottleneck card.
- **11 Municipal Civic Sectors:** High-level departmental classification (e.g., *Roads & Transportation*, *Water Supply & Drainage*, *Traffic & Road Safety*, *Fire & Emergency Services*) distinct from defect categories, with automatic smart sector suggestion.
- **Photo & Video Proof Upload:** Drag-and-drop or file-picker media upload on the Report Issue page, backed by `multer` disk storage and PostgreSQL `issue_evidence` relational metadata.
- **Incident Table & Evidence Inspection Modal:** Searchable, multi-filter incident repository (`Sector`, `Category`, `Severity`, `Status`) with inline status updates and a full-screen modal showing full issue metadata, embedded image/video players, and direct file links.
- **Interactive GIS Map View:** React-Leaflet & OpenStreetMap integration featuring severity-colored custom pins, spatial clustering for co-located issues, auto-fitting bounds, and interactive popups with sector and evidence badges.
- **Rule-Based Priority & Impact Engines:** Multi-factor scoring with per-issue factor breakdown tags (`Severity`, `Category`, `Status`, `Spatial Density`) and human-readable impact explanations.
- **Automated Alert Pipeline:** 4-stage dispatch workflow (`Active` → `Acknowledged` → `Resolved`) with automatic authority routing and bidirectional status synchronization.

---

## 5. Real-World Applications

- **Municipal Corporations & Smart City Command Centers:** Centralizing citizen grievances and field inspector reports into a single prioritized operational dashboard.
- **Public Works & Road Maintenance Wings:** Identifying recurring pothole and road-damage clusters using spatial density scoring.
- **Monsoon & Flood Preparedness Cells:** Tracking waterlogging and storm-drainage bottlenecks in real time during heavy rainfall.
- **Traffic & Public Safety Departments:** Fast-tracking critical road safety hazards and non-functional street lighting along major corridors.
- **Campus & Industrial Township Estate Management:** Managing internal roads, sanitation, lighting, and utility maintenance across large institutional campuses.

---

## 6. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (JSX, Hooks) | Component-based single-page application UI |
| **Build Tool** | Vite 5 | Fast ES module bundler and development server (`Port 5173`) |
| **Routing** | React Router DOM v6 | Client-side navigation and view synchronization |
| **Map & GIS** | Leaflet 1.9 + React-Leaflet 4 | Interactive OpenStreetMap rendering & custom markers |
| **Styling** | Custom CSS (`App.css`, `index.css`) | Dark Slate Command Center theme optimized for `1366×768` |
| **Backend Runtime** | Node.js (v24.x compatible) | Asynchronous server-side JavaScript runtime |
| **Web Framework** | Express.js 5 | RESTful API routing, middleware, and static file serving (`Port 5000`) |
| **File Uploads** | Multer 2 | Multipart/form-data parsing and disk storage for image/video proof |
| **Database** | PostgreSQL 18 | Relational persistence for issues, alerts, and evidence metadata |
| **Database Driver** | `pg` (`node-postgres`) | Connection pooling and parameterized SQL queries |
| **Environment Config** | `dotenv` & `cors` | Secure credential management and Cross-Origin Resource Sharing |

---

## 7. System Architecture Overview

UrbanPulse follows a clean **3-Tier Client–Server–Database Architecture** with a dedicated **Service Intelligence Layer** inside the backend:

```text
+-------------------------------------------------------------------------+
|                        FRONTEND CLIENT (Port 5173)                      |
|  React 18 + Vite + React-Leaflet + Command Center UI                    |
|  Pages: Dashboard |Issues (+Modal) |ReportIssue |MapView |Alerts |Stats |
|  API Layer: frontend/src/services/api.js (Fetch + FormData Multipart)   |
+------------------------------------+------------------------------------+
                                     |
                        HTTP / REST JSON & Multipart
                                     v
+-------------------------------------------------------------------------+
|                      BACKEND REST API (Port 5000)                       |
|  Express.js Entry: backend/src/index.js                                 |
|  Static Media Server: /uploads/* -> backend/uploads/                    |
|                                                                         |
|  +---------------------------+    +----------------------------------+  |
|  | Controllers               |    | Rule-Based Intelligence Services |  |
|  | - healthController.js     |    | - priorityService.js             |  |
|  | - issueController.js      |--->| - impactService.js               |  |
|  | - alertController.js      |    | - alertService.js                |  |
|  | - intelligenceController  |    +----------------------------------+  |
|  +-------------+-------------+                                          |
|                |                  +----------------------------------+  |
|                +----------------->| Multer Upload Middleware         |  |
|                |                  | - config/upload.js (50MB limit)  |  |
|                v                  +----------------------------------+  |
|  +---------------------------+                                          |
|  | PostgreSQL Pool (pg)      |                                          |
|  | - config/db.js            |                                          |
|  +-------------+-------------+                                          |
+----------------|--------------------------------------------------------+
                 |
        Parameterized SQL
                 v
+-------------------------------------------------------------------------+
|                    POSTGRESQL DATABASE (urbanpulse)                     |
|  Tables:                                                                |
|  1. issues         (id, sector, title, category, severity, status, ...) |
|  2. alerts         (id, issue_id [FK], priority_score, authority, ...)  |
|  3. issue_evidence (id, issue_id [FK], file_name, file_path, ...)       |
+-------------------------------------------------------------------------+
```

---

## 8. Frontend Module Description

Located in `D:\UrbanPulse\frontend\src`:

- **`App.jsx`**: Top-level application shell managing active tab routing, live header/sidebar counters (`totalIssues`, `criticalCount`, `activeAlertsCount`), and global refresh synchronization.
- **`services/api.js`**: Centralized REST client exporting constants (`CIVIC_SECTORS`, `ISSUE_CATEGORIES`, `CATEGORY_TO_SECTOR_DEFAULT`), media URL resolver (`getMediaUrl`), and API methods (`getIssues`, `getIssueById`, `createIssue`, `updateIssueStatus`, `getPriorityIssues`, `getImpactIssues`, `getAlerts`, `getActiveAlerts`, `updateAlertStatus`).Automatically switches between `application/json` and `multipart/form-data` when evidence files are attached.
- **`pages/Dashboard.jsx`**: Operational overview displaying 5 KPI cards, the Rule-Based Priority Intelligence Leaderboard, Recent Infrastructure Activity, Active Municipal Alerts, Municipal Sector Distribution, and Primary Urban Bottleneck card.
- **`pages/Issues.jsx`**: Comprehensive Incident Repository featuring search, 4 filter dropdowns (`Sector`, `Category`, `Severity`, `Status`), inline status mutation dropdowns, evidence badges, and the **Issue Detail & Evidence Inspection Modal** (renders full HTML5 `<img>` and `<video controls>` players).
- **`pages/ReportIssue.jsx`**: Structured ingestion form with Municipal Sector selector, Category-to-Sector auto-suggestion, কলকাতা (Kolkata) coordinate presets, drag-and-drop Photo/Video upload with client-side MIME/extension and 50 MB size validation, live preview, and rule-based triage preview.
- **`components/MapView.jsx`**: Interactive Leaflet map with clickable severity filter pills, Sector/Category/Severity toolbar filters, dynamic pin clustering by coordinate proximity, and rich popups showing sector and evidence badges.
- **`pages/Alerts.jsx`**: 4-stage pipeline visualization and filterable alert cards (`All`, `Active`, `Acknowledged`, `Resolved`) showing assigned municipal authority, sector badge, priority score, and one-click Acknowledge/Resolve buttons.
- **`pages/Analytics.jsx` & `components/ImpactIntelligence.jsx`**: Statistical distribution bars for Municipal Civic Sectors, Defect Categories, Severity Breakdown, Workflow Resolution Status, and detailed 0–100 Impact Assessment cards.
- **`components/Badges.jsx` & `components/Icons.jsx`**: Reusable UI primitives (`SeverityBadge`, `StatusBadge`, `ImpactBadge`, `SectorBadge`, `EvidenceBadge`) and clean inline SVG iconography.

---

## 9. Backend Module Description

Located in `D:\UrbanPulse\backend\src`:

- **`index.js`**: Express application entry point. Configures CORS, JSON/URL-encoded body parsers, static serving of `/uploads` from `backend/uploads`, route mounting (`/api/health`, `/api/issues`, `/api/intelligence`, `/api/alerts`), 404 fallback, and global/Multer error handling.
- **`config/db.js`**: Initializes and exports the `pg.Pool` instance using environment variables from `backend/.env` without hardcoding any credentials.
- **`config/upload.js`**: Configures `multer.diskStorage` to store evidence files in `backend/uploads` with collision-safe filenames (`evidence-<timestamp>-<random>.<ext>`), validates allowed MIME types and extensions, enforces a `50 MB` file size limit, and exports `handleEvidenceUpload` middleware.
- **`controllers/issueController.js`**: Handles `getAllIssues` (with optional `sector`, `category`, `severity`, `status` query filters and `LEFT JOIN issue_evidence` aggregated via `json_agg`), `getIssueById`, `createIssue` (validates fields, cleans up orphan files on validation errors, inserts issue + evidence records, and triggers alert evaluation), and `updateIssueStatus` (updates issue status and synchronizes linked alerts).
- **`controllers/alertController.js`**: Handles `getAllAlerts`, `getActiveAlerts`, and `updateAlertStatus` (`Active`, `Acknowledged`, `Resolved`), joining with `issues` to include `title`, `sector`, `category`, `severity`, and coordinates.
- **`controllers/intelligenceController.js`**: Exposes ranked priority intelligence (`getPrioritizedIssues`) and urban impact assessment (`getImpactAnalysis`).
- **`services/priorityService.js`**, **`services/impactService.js`**, **`services/alertService.js`**: Pure rule-based calculation and alert dispatch modules detailed in Sections 12–14 below.

---

## 10. Database Design Overview

The PostgreSQL database (`urbanpulse`) consists of **3 relational tables** defined in [`database/schema.sql`](file:///D:/UrbanPulse/database/schema.sql):

### 1. `issues` Table
Stores core civic anomaly reports and their municipal sector classification.
- `id` (`SERIAL PRIMARY KEY`)
- `sector` (`VARCHAR(100) NOT NULL DEFAULT 'Roads & Transportation'`)
- `title` (`VARCHAR(150) NOT NULL`)
- `category` (`VARCHAR(50) NOT NULL`)
- `description` (`TEXT NOT NULL`)
- `latitude` (`NUMERIC(9,6) NOT NULL`)
- `longitude` (`NUMERIC(9,6) NOT NULL`)
- `severity` (`VARCHAR(20) NOT NULL` — `Low`, `Medium`, `High`, `Critical`)
- `status` (`VARCHAR(20) NOT NULL DEFAULT 'Reported'` — `Reported`, `In Progress`, `Resolved`)
- `created_at` (`TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
- **Indexes:** `idx_issues_sector`, `idx_issues_category`, `idx_issues_severity`, `idx_issues_status`, `idx_issues_created_at`

### 2. `alerts` Table
Stores automated municipal dispatch alerts linked to high-priority issues.
- `id` (`SERIAL PRIMARY KEY`)
- `issue_id` (`INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE`)
- `alert_type` (`VARCHAR(50) NOT NULL`)
- `priority_score` (`INTEGER NOT NULL`)
- `authority` (`VARCHAR(100) NOT NULL`)
- `message` (`TEXT NOT NULL`)
- `status` (`VARCHAR(20) NOT NULL DEFAULT 'Active'` — `Active`, `Acknowledged`, `Resolved`)
- `created_at` (`TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
- **Indexes:** `idx_alerts_issue_id`, `idx_alerts_status`, `idx_alerts_created_at`

### 3. `issue_evidence` Table
Stores metadata for uploaded photo and video proof files linked to an issue.
- `id` (`SERIAL PRIMARY KEY`)
- `issue_id` (`INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE`)
- `file_name` (`VARCHAR(255) NOT NULL`)
- `file_path` (`VARCHAR(500) NOT NULL` — e.g., `/uploads/evidence-1775939434300-740463737.png`)
- `file_type` (`VARCHAR(50) NOT NULL` — `image` or `video`)
- `file_size` (`INTEGER`)
- `created_at` (`TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
- **Indexes:** `idx_issue_evidence_issue_id`

---

## 11. Issue Reporting Workflow

1. **User Input:** A citizen or field inspector opens the **Report Issue** page, selects a **Municipal Civic Sector** and **Defect Category** (selecting a category automatically suggests the default civic sector), enters the title, description, GPS coordinates (or clicks a city location preset), chooses a severity level, and optionally attaches a photo or video file.
2. **Client Validation:** The browser verifies required text lengths, coordinate bounds (`[-90, 90]` and `[-180, 180]`), allowed media MIME/extension types, and the `50 MB` file size cap.
3. **Multipart Transmission:** If media is attached, `api.js` constructs a `FormData` payload and sends `POST /api/issues`; otherwise, it sends a standard JSON payload.
4. **Server Ingestion & Persistence:**
   - `upload.js` validates and saves any uploaded media to `backend/uploads/`.
   - `issueController.js` validates all fields, inserts the issue into `issues`, and inserts any attached media records into `issue_evidence`.
5. **Automated Intelligence & Alert Evaluation:**
   - `alertService.js` computes the issue's rule-based priority score via `priorityService.js`.
   - If the issue qualifies (`priorityScore >= 55` or `severity IN ('High', 'Critical')`), an alert is automatically inserted into `alerts` and routed to the appropriate municipal authority for that sector.
6. **Live UI Update:** The frontend displays confirmation feedback, updates header badges, and lists the new issue across the Dashboard, Incident Table, Map View, and Analytics.

---

## 12. Priority Scoring Explanation (Rule-Based Engine)

> **Important Technical Note:** UrbanPulse uses a **deterministic, multi-factor rule-based scoring engine** (`backend/src/services/priorityService.js`), **not** a black-box machine learning model. Every score is 100% reproducible and explainable.

For each issue, the **Priority Score** is computed as the sum of four components:

$$\text{Priority Score} = W_{\text{severity}} + W_{\text{status}} + W_{\text{category}} + B_{\text{density}}$$

| Component | Values & Weights | Rationale |
| :--- | :--- | :--- |
| **1. Severity Weight ($W_{\text{severity}}$)** | `Critical`: **40**<br>`High`: **30**<br>`Medium`: **20**<br>`Low`: **10** | Reflects direct physical danger and urgency of the anomaly. |
| **2. Status Weight ($W_{\text{status}}$)** | `Reported`: **15**<br>`In Progress`: **8**<br>`Resolved`: **0** | Unaddressed (`Reported`) issues require immediate triage attention over resolved ones. |
| **3. Category Weight ($W_{\text{category}}$)** | `Waterlogging`: **15**<br>`Drainage`: **14**<br>`Road Damage`: **12**<br>`Road Safety`: **12**<br>`Streetlight`: **10**<br>`Garbage`: **8**<br>`Other`: **5** | Reflects typical infrastructure cascading disruption potential. |
| **4. Spatial Density Bonus ($B_{\text{density}}$)** | $\min(\text{nearbyCount} \times 5,\ 15)$<br>where $|\Delta \text{lat}| \le 0.01^\circ$ and $|\Delta \text{lng}| \le 0.01^\circ$ ($\approx 1.1\text{ km}$) | Rewards clusters where multiple issues occur in the same neighborhood (+5 per nearby issue, capped at +15). |

**Priority Level Thresholds:**
- **Critical Priority:** Score $\ge 70$
- **High Priority:** Score $55 \text{ – } 69$
- **Medium Priority:** Score $35 \text{ – } 54$
- **Low Priority:** Score $< 35$

---

## 13. Impact Analysis Explanation (Rule-Based Engine)

Implemented in `backend/src/services/impactService.js`, the **Urban Impact Score (capped at 100)** estimates broader civic disruption:

$$\text{Impact Score} = \min\left(100,\ I_{\text{severity}} + I_{\text{category}} + I_{\text{status}} + I_{\text{density}}\right)$$

1. **Severity Impact ($I_{\text{severity}}$):** `Critical` = **35**, `High` = **26**, `Medium` = **16**, `Low` = **8**
2. **Category Impact ($I_{\text{category}}$):** `Waterlogging` = **25**, `Drainage` = **22**, `Road Damage` = **20**, `Road Safety` = **20**, `Streetlight` = **16**, `Garbage` = **14**, `Other` = **10**
3. **Status Impact ($I_{\text{status}}$):** `Reported` = **20**, `In Progress` = **12**, `Resolved` = **0**
4. **Cluster Density Impact ($I_{\text{density}}$):** $\min(\text{nearbyIssues} \times 7,\ 20)$ within $0.01^\circ$ latitude/longitude.

**Impact Level Classification:**
- **Critical Impact:** Score $\ge 75$
- **High Impact:** Score $55 \text{ – } 74$
- **Moderate Impact:** Score $30 \text{ – } 54$
- **Low Impact:** Score $< 30$

Each assessed issue also generates human-readable `impactFactors` explaining *why* it received its score (e.g., *"Waterlogging can disrupt traffic movement and public access"*, *"2 nearby issue(s) indicate a local infrastructure cluster"*).

---

## 14. Alert Generation & Synchronization Workflow

Implemented in `backend/src/services/alertService.js` and `backend/src/controllers/issueController.js`:

1. **Trigger Rule:** When an issue is created, an alert is generated if and only if:
   - `issue.status !== 'Resolved'`, **AND**
   - `priorityScore >= 55` **OR** `issue.severity === 'High'` **OR** `issue.severity === 'Critical'`.
2. **Duplicate Prevention:** Before inserting, `alertService.js` checks if an `Active` or `Acknowledged` alert already exists for `issue_id`.
3. **Alert Type Classification:**
   - `Critical Infrastructure Alert` if `severity === 'Critical'` or `priorityScore >= 70`
   - `High Priority Civic Alert` otherwise
4. **Automatic Status Synchronization:** When an administrator updates an issue's status via `PUT /api/issues/:id/status`:
   - Setting Issue Status to **`In Progress`** automatically updates any `Active` alert for that issue to **`Acknowledged`**.
   - Setting Issue Status to **`Resolved`** automatically updates any `Active` or `Acknowledged` alert for that issue to **`Resolved`**.

---

## 15. Municipal / Civic Sectors Supported

UrbanPulse distinguishes between **Municipal Civic Sector** (the high-level municipal corporation wing responsible for governance) and **Issue Category** (the specific physical defect type).

| # | Municipal Civic Sector | Assigned Municipal Authority (Alert Routing) | Typical Defect Categories |
| :- | :--- | :--- | :--- |
| 1 | **Roads & Transportation** | Roads & Public Works Department (PWD) | Road Damage, Potholes, Resurfacing |
| 2 | **Traffic & Road Safety** | Traffic Engineering & Road Safety Cell | Road Safety, Signals, Dividers, Signage |
| 3 | **Water Supply & Drainage** | Municipal Water Supply & Sewerage Wing | Waterlogging, Drainage Blockage |
| 4 | **Fire & Emergency Services** | Municipal Fire & Emergency Services Directorate | Critical Hazards, Structural/Fire Risks |
| 5 | **Solid Waste Management** | Solid Waste & Sanitation Department | Garbage Overflow, Illegal Dumping |
| 6 | **Street Lighting** | Electrical & Street Lighting Wing | Streetlight Outages, Exposed Wiring |
| 7 | **Public Infrastructure** | Civic Engineering & Infrastructure Wing | Footpaths, Culverts, Public Facilities |
| 8 | **Environment & Pollution** | Urban Environment & Pollution Control Cell | Air/Water/Noise Anomalies |
| 9 | **Parks & Public Spaces** | Parks, Gardens & Public Spaces Directorate | Park Maintenance, Encroachments |
| 10 | **Public Health & Sanitation** | Municipal Public Health & Hygiene Department | Stagnant Water, Vector Breeding Risks |
| 11 | **Other Civic Services** | Central Municipal Control Room | General Civic Anomalies |

---

## 16. Evidence Upload Support (Photos & Videos)

Citizens and field inspectors can attach visual proof when submitting an issue:

- **Supported Image Formats:** `.jpg`, `.jpeg`, `.png`, `.webp` (`image/jpeg`, `image/png`, `image/webp`)
- **Supported Video Formats:** `.mp4`, `.webm`, `.mov` (`video/mp4`, `video/webm`, `video/quicktime`)
- **Maximum File Size:** `50 MB` per file (enforced on both frontend and backend Multer middleware)
- **Storage Mechanism:** Files are stored locally in `D:\UrbanPulse\backend\uploads\` (ignored by Git except `.gitkeep`) and served statically at `http://localhost:5000/uploads/<filename>`.
- **Database Linking:** File metadata (`file_name`, `file_path`, `file_type`, `file_size`) is stored in `issue_evidence` with `ON DELETE CASCADE` to `issues(id)`.
- **Orphan File Protection:** If an issue submission fails backend field validation (`HTTP 400`), `issueController.js` automatically cleans up the temporary uploaded file from disk.

---

## 17. REST API Endpoint Reference

Base URL: `http://localhost:5000`

| Method | Endpoint | Description | Request Body / Query Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Verifies API liveness and PostgreSQL connectivity | None |
| `GET` | `/api/issues` | Returns all issues with `sector` and `evidence` array | Optional query: `?sector=&category=&severity=&status=` |
| `GET` | `/api/issues/:id` | Returns a single issue by ID with `evidence` array | URL param: `:id` |
| `POST` | `/api/issues` | Creates an issue (JSON or `multipart/form-data` with `evidence`) and triggers alert check | Fields: `sector`, `title`, `category`, `description`, `latitude`, `longitude`, `severity`, optional file `evidence` |
| `PUT` | `/api/issues/:id/status` | Updates issue status and syncs linked alert status | JSON: `{ "status": "Reported" \| "In Progress" \| "Resolved" }` |
| `GET` | `/api/intelligence/priorities` | Returns issues ranked by rule-based `priorityScore` | None |
| `GET` | `/api/intelligence/impact` | Returns issues ranked by rule-based `impactScore` (0–100) | None |
| `GET` | `/api/alerts` | Returns all municipal alerts with joined issue details | None |
| `GET` | `/api/alerts/active` | Returns only `Active` and `Acknowledged` alerts | None |
| `PUT` | `/api/alerts/:id/status` | Updates an alert's lifecycle status | JSON: `{ "status": "Active" \| "Acknowledged" \| "Resolved" }` |

---

## 18. Project Directory Structure

```text
D:\UrbanPulse\
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                     # PostgreSQL connection pool (dotenv + pg)
│   │   │   └── upload.js                 # Multer diskStorage & 50MB image/video filter
│   │   ├── controllers/
│   │   │   ├── alertController.js        # Alert listing & status updates
│   │   │   ├── healthController.js       # Database health check controller
│   │   │   ├── intelligenceController.js # Priority & Impact intelligence controllers
│   │   │   └── issueController.js        # Issue CRUD, evidence aggregation & alert sync
│   │   ├── routes/
│   │   │   ├── alertRoutes.js            # /api/alerts routes
│   │   │   ├── healthRoutes.js           # /api/health route
│   │   │   ├── intelligenceRoutes.js     # /api/intelligence routes
│   │   │   └── issueRoutes.js            # /api/issues routes (+ Multer middleware)
│   │   ├── services/
│   │   │   ├── alertService.js           # Automated alert trigger & sector authority routing
│   │   │   ├── impactService.js          # Rule-based urban impact scoring (0-100)
│   │   │   └── priorityService.js        # Rule-based multi-factor priority scoring
│   │   └── index.js                      # Express server entry point & /uploads static server
│   ├── uploads/
│   │   └── .gitkeep                      # Local storage directory for uploaded evidence
│   ├── .env.example                      # Safe template for environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Badges.jsx                # Severity, Status, Impact, Sector & Evidence badges
│   │   │   ├── Header.jsx                # Top command bar with live status & quick actions
│   │   │   ├── Icons.jsx                 # Inline SVG icon components
│   │   │   ├── ImpactIntelligence.jsx    # Detailed 0-100 impact breakdown panel
│   │   │   ├── MapView.jsx               # Interactive Leaflet map with sector/severity filters
│   │   │   └── Sidebar.jsx               # Left navigation rail with live telemetry counters
│   │   ├── pages/
│   │   │   ├── Alerts.jsx                # Municipal Alert Center & 4-stage dispatch pipeline
│   │   │   ├── Analytics.jsx             # Sector, Category, Severity & Status charts
│   │   │   ├── Dashboard.jsx             # Main Command Center dashboard
│   │   │   ├── Issues.jsx                # Incident table, filters & Evidence Inspection Modal
│   │   │   └── ReportIssue.jsx           # Issue reporting form with media upload & preview
│   │   ├── services/
│   │   │   └── api.js                    # REST API client, sector mappings & media URL helper
│   │   ├── App.css                       # Command Center dark slate stylesheet (1366x768)
│   │   ├── App.jsx                       # Root state & navigation coordinator
│   │   ├── index.css                     # Global CSS resets & typography
│   │   └── main.jsx                      # React DOM entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── database/
│   └── schema.sql                        # Complete PostgreSQL schema (issues, alerts, issue_evidence)
├── .gitignore
└── README.md
```

---

## 19. Prerequisites

Ensure the following software is installed on your machine before running UrbanPulse:

- **Node.js:** v18.0+ or v24.x (with `npm`)
- **PostgreSQL:** v14+ or v18.x running locally on port `5432`
- **Git:** For version control
- **Modern Web Browser:** Google Chrome, Microsoft Edge, or Mozilla Firefox

---

## 20. Installation Steps

1. **Clone or open the repository:**
   ```powershell
   cd D:\UrbanPulse
   ```

2. **Install Backend Dependencies:**
   ```powershell
   cd D:\UrbanPulse\backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```powershell
   cd D:\UrbanPulse\frontend
   npm install
   ```

---

## 21. PostgreSQL Database Setup Steps

1. Open `psql` or **pgAdmin** and create the `urbanpulse` database if it does not already exist:
   ```sql
   CREATE DATABASE urbanpulse;
   ```
2. Run the schema and seed script located at `D:\UrbanPulse\database\schema.sql`:
   ```powershell
   psql -U postgres -d urbanpulse -f D:\UrbanPulse\database\schema.sql
   ```
   *Note: `schema.sql` uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, making it safe to run on both fresh and existing databases.*

---

## 22. Environment Variable Configuration

1. Inside `D:\UrbanPulse\backend`, copy `.env.example` to `.env`:
   ```powershell
   cd D:\UrbanPulse\backend
   copy .env.example .env
   ```
2. Edit `D:\UrbanPulse\backend\.env` with your local PostgreSQL credentials (never commit `.env` to Git):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=urbanpulse
   DB_USER=postgres
   DB_PASSWORD=your_actual_postgres_password
   ```

---

## 23. Backend Startup Command

Open a terminal in `D:\UrbanPulse\backend` and run:

```powershell
cd D:\UrbanPulse\backend
npm start
```

- The Express server will start on **`http://localhost:5000`**.
- Verify database health at: `http://localhost:5000/api/health`

---

## 24. Frontend Startup Command

Open a second terminal in `D:\UrbanPulse\frontend` and run:

```powershell
cd D:\UrbanPulse\frontend
npm run dev
```

- The Vite development server will start on **`http://localhost:5173`**.
- Open `http://localhost:5173` in your browser.

---

## 25. Testing & Live Demonstration Instructions

Follow this 5-minute walkthrough during your college project demonstration:

1. **Dashboard Overview (`Dashboard` tab):**
   - Point out the **5 KPI Cards**, the **Rule-Based Priority Leaderboard** (with `Sev`, `Stat`, `Cat`, `Dens` score breakdown tags), the **Municipal Sector Distribution** card, and the **Active Municipal Alerts** panel.
2. **Report New Issue with Photo/Video Proof (`Report Issue` tab):**
   - Select **Category:** `Waterlogging` → observe that **Municipal Sector** automatically updates to `Water Supply & Drainage` (or choose any of the 11 sectors manually).
   - Click a Kolkata location preset (e.g., *Sector V / Salt Lake*) to populate GPS coordinates.
   - Select **Severity:** `Critical`.
   - Drag and drop a photo (`.png`/`.jpg`) or short video (`.mp4`) into the **Evidence / Proof Upload** dropzone and show the live media preview.
   - Click **Submit Telemetry Report**.
3. **Inspect Evidence & Update Status (`Issues` tab):**
   - Filter the table by **Sector** (`Water Supply & Drainage`) or **Severity** (`Critical`).
   - Click the **Evidence Badge** (`1 Photo` / `1 Video`) or the **View** button on your newly created issue to open the **Issue Detail & Evidence Inspection Modal**.
   - Show the rendered photo or play the video inside the modal, then close it.
   - Change the issue's status dropdown from `Reported` to `In Progress`.
4. **Verify Automated Alert & Authority Routing (`Alerts` tab):**
   - Navigate to **Municipal Alerts** and show that an alert was automatically dispatched to the **Municipal Water Supply & Sewerage Wing** with the calculated priority score, and its status automatically synchronized to `Acknowledged`.
5. **Geospatial Map & Analytics (`Map View` & `Analytics` tabs):**
   - On **Map View**, filter markers by **Sector** or click a marker pin to show its popup containing the Sector Badge, Severity Badge, and Evidence Badge.
   - On **Analytics**, show the **Municipal Civic Sectors** distribution chart and the **0–100 Infrastructure Impact Assessment** breakdown.

---

## 26. Screenshots

> *Placeholders for project report / presentation slides:*

- `docs/screenshots/01-command-center-dashboard.png` — *Main Command Center Dashboard (`1366×768` viewport)*
- `docs/screenshots/02-report-issue-evidence-upload.png` — *Issue Reporting Form with Civic Sector & Photo/Video Preview*
- `docs/screenshots/03-incident-table-evidence-modal.png` — *Incident Repository & Full-Screen Evidence Inspection Modal*
- `docs/screenshots/04-geospatial-map-clustering.png` — *Interactive Leaflet Map with Sector Filtering & Marker Popups*
- `docs/screenshots/05-municipal-alerts-analytics.png` — *Automated Municipal Alert Center & Impact Intelligence Charts*

---

## 27. Current Limitations

To maintain transparency and academic rigor, the following scope boundaries apply to the current version:

1. **Rule-Based Heuristic Scoring (No Trained ML Model):** Priority and impact scores use deterministic mathematical weights rather than a machine-learning model trained on historical city maintenance datasets.
2. **Local Disk Media Storage:** Uploaded photos and videos are stored in `backend/uploads/` on the local server filesystem rather than cloud object storage (such as AWS S3 or Google Cloud Storage).
3. **Open Access Demonstration Mode:** Role-based authentication (Citizen login vs. Municipal Commissioner login) is omitted so evaluators can seamlessly test both issue reporting and administrative status triage from a single interface.
4. **Fixed Coordinate Radius Approximation:** Spatial density clustering uses a $\pm 0.01^\circ$ latitude/longitude bounding box ($\approx 1.1\text{ km}$) rather than PostGIS spherical distance queries.

---

## 28. Future Scope & Enhancements

1. **Computer Vision Verification:** Integrate a lightweight image classification model to automatically verify pothole/waterlogging severity from uploaded citizen photos.
2. **Role-Based Access Control (RBAC):** Add JWT authentication separating public citizen reporting from department-specific municipal engineer dashboards.
3. **Cloud Media Storage & CDN:** Migrate `multer` disk storage to cloud object storage (AWS S3 / Cloudinary) with automatic video compression.
4. **PostGIS Spatial Indexing:** Upgrade coordinate queries to PostgreSQL PostGIS `ST_DWithin` for exact meter-level radius clustering and ward boundary polygon mapping.
5. **SMS / Email Authority Notifications:** Connect `alertService.js` to Twilio or SMTP gateways to notify field engineers immediately when a `Critical Infrastructure Alert` is triggered.

---

## 29. Author & Project Credits

- **Project Title:** UrbanPulse — City Infrastructure Anomaly & Impact Intelligence Platform
- **Project Type:** Final-Year Undergraduate Software Engineering Project
- **Repository Path:** `D:\UrbanPulse`
- **License:** For Academic & Educational Demonstration Use
