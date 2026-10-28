# UrbanPulse — City Infrastructure Anomaly & Impact Intelligence Platform

> **Final-Year Software Engineering Project**  
> A full-stack civic infrastructure issue reporting, rule-based priority/impact intelligence, evidence handling, and in-app alert workflow.

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

**UrbanPulse** is a full-stack web application designed to help citizens report urban infrastructure issues—such as road damage, traffic hazards, waterlogging, drainage blockages, street lighting failures, and waste accumulation—while giving municipal staff a demonstration interface for **rule-based priority scoring**, **urban impact analysis**, **geospatial issue mapping**, **photo/video evidence handling**, and **in-app alerts routed to authority labels**. The current code does not send external notifications or connect to live city sensors.

Unlike simple complaint boxes that store reports chronologically, UrbanPulse evaluates every incoming report across multiple weighted dimensions (severity, defect category, workflow status, and spatial cluster density) to ensure the most disruptive civic hazards rise to the top of the municipal response queue.

---

## 2. Problem Statement

Modern cities face thousands of daily civic infrastructure failures—potholes on arterial roads, broken traffic signals, overflowing storm drains, and unlit intersections. Traditional municipal grievance portals suffer from four critical limitations:

1. **Lack of Objective Prioritization:** Complaints are processed in First-In-First-Out (FIFO) order rather than by public safety risk or urban disruption impact.
2. **Departmental Fragmentation:** Reports are rarely categorized into structured municipal service sectors, causing delays in routing incidents to the responsible authority wing (e.g., Public Works Department vs. Sewerage & Drainage Wing).
3. **Unverified Field Claims:** Without attached visual proof (photos or videos) and exact GPS coordinates, maintenance teams waste time locating or verifying reported defects.
4. **Disconnected Alert & Resolution Tracking:** When an issue changes status, its linked in-app alert should stay synchronized with the issue lifecycle.

---

## 3. Project Objectives

1. **Structured Multi-Sector Ingestion:** Enable structured reporting of civic issues classified by both **Municipal Civic Sector** (11 service wings) and **Defect Category** (7 categories) with GPS coordinates.
2. **Photo & Video Evidence Verification:** Support optional multipart image and video proof uploads (`JPG`, `PNG`, `WEBP`, `MP4`, `WEBM`, `MOV` up to `50 MB`) with instant preview and full-screen modal inspection.
3. **Deterministic Rule-Based Intelligence:** Implement transparent, explainable mathematical models for **Priority Scoring** and **Urban Impact Assessment (0–100)** without relying on opaque black-box claims.
4. **In-App Alerting & Lifecycle Sync:** Generate an in-app alert for a non-resolved issue when its priority score is at least 55 or its severity is High/Critical, assign an authority label, and synchronize linked alert states when issue statuses change.
5. **Geospatial & Statistical Visualization:** Provide an interactive OpenStreetMap command center with coordinate clustering, sector/category/severity filters, and live operational analytics optimized for `1366×768` presentation screens.

---

## 4. Key Features

- **Command Center Dashboard:** Polling 5-KPI summary, Priority Intelligence Leaderboard, Active in-app Alerts panel, Municipal Sector Distribution overview, Recent Activity feed, and Primary Urban Bottleneck card.
- **11 Municipal Civic Sectors:** High-level departmental classification (e.g., *Roads & Transportation*, *Water Supply & Drainage*, *Traffic & Road Safety*, *Fire & Emergency Services*) distinct from defect categories, with automatic smart sector suggestion.
- **Photo & Video Proof Upload:** Drag-and-drop or file-picker media upload on the Report Issue page, backed by `multer` disk storage and PostgreSQL `issue_evidence` relational metadata.
- **Incident Table & Evidence Inspection Modal:** Searchable, multi-filter incident repository (`Sector`, `Category`, `Severity`, `Status`) with inline status updates and a full-screen modal showing full issue metadata, embedded image/video players, and direct file links.
- **Interactive GIS Map View:** React-Leaflet & OpenStreetMap integration featuring severity-colored custom pins, spatial clustering for co-located issues, auto-fitting bounds, and interactive popups with sector and evidence badges.
- **Rule-Based Priority & Impact Engines:** Multi-factor scoring with per-issue factor breakdown tags (`Severity`, `Category`, `Status`, `Spatial Density`) and human-readable impact explanations.
- **Automated Alert Pipeline:** Rule-triggered alerts with sector-based authority routing. Issue status changes synchronize linked alerts from `Active` to `Acknowledged` or `Resolved`; changing an alert directly does not update its issue.

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
| **Routing** | React Router DOM v7 | Client-side navigation and view synchronization |
| **Map & GIS** | Leaflet 1.9 + React-Leaflet 4 | Interactive OpenStreetMap rendering & custom markers |
| **Styling** | Custom CSS (`App.css`, `index.css`) | Dark Slate Command Center theme optimized for `1366×768` |
| **Backend Runtime** | Node.js (v24.x compatible) | Asynchronous server-side JavaScript runtime |
| **Web Framework** | Express.js 4 | RESTful API routing, middleware, and static file serving (`Port 5000`) |
| **File Uploads** | Multer 2 | Multipart/form-data parsing and disk storage for image/video proof |
| **Database** | PostgreSQL | Relational persistence for issues, alerts, and evidence metadata; the installed server version depends on the local environment |
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
|  Authenticated Evidence: /api/uploads/:fileName -> configured UPLOAD_DIR |
|                                                                         |
|  +---------------------------+    +----------------------------------+  |
|  | Controllers               |    | Rule-Based Intelligence Services |  |
|  | - healthController.js     |    | - priorityService.js             |  |
|  | - issueController.js      |--->| - alertService.js                |  |
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

- **`App.jsx`**: Top-level application shell mapping URL paths to the six pages, polling backend health/issues/active alerts, and refreshing the header/sidebar counters.
- **`services/api.js`**: Centralized REST client exporting civic-sector/category constants, a media URL resolver (`getMediaUrl`), and API methods for issues, priority/impact intelligence, and alerts. It sends JSON for reports without files and `FormData` when evidence is attached.
- **`pages/Dashboard.jsx`**: Operational overview displaying 5 KPI cards, the Rule-Based Priority Intelligence Leaderboard, Recent Infrastructure Activity, Active Municipal Alerts, Municipal Sector Distribution, and Primary Urban Bottleneck card.
- **`pages/Issues.jsx`**: Comprehensive Incident Repository featuring search, 4 filter dropdowns (`Sector`, `Category`, `Severity`, `Status`), inline status mutation dropdowns, evidence badges, and the **Issue Detail & Evidence Inspection Modal** (renders full HTML5 `<img>` and `<video controls>` players).
- **`pages/ReportIssue.jsx`**: Structured ingestion form with Municipal Sector selector, Category-to-Sector auto-suggestion, কলকাতা (Kolkata) coordinate presets, drag-and-drop Photo/Video upload with client-side MIME/extension and 50 MB size validation, live preview, and rule-based triage preview.
- **`components/MapView.jsx`**: Interactive Leaflet map with clickable severity filter pills, Sector/Category/Severity toolbar filters, dynamic pin clustering by coordinate proximity, and rich popups showing sector and evidence badges.
- **`pages/Alerts.jsx`**: Alert lifecycle visualization and filterable alert cards (`All`, `Active`, `Acknowledged`, `Resolved`) showing assigned authority and priority score, with Acknowledge/Resolve controls.
- **`pages/Analytics.jsx` & `components/ImpactIntelligence.jsx`**: Statistical distribution bars for Municipal Civic Sectors, Defect Categories, Severity Breakdown, Workflow Resolution Status, and detailed 0–100 Impact Assessment cards.
- **`components/Badges.jsx` & `components/Icons.jsx`**: Reusable UI primitives (`SeverityBadge`, `StatusBadge`, `ImpactBadge`, `SectorBadge`, `EvidenceBadge`) and clean inline SVG iconography.

---

## 9. Backend Module Description

Located in `D:\UrbanPulse\backend\src`:

- **`index.js`**: Express application entry point. Configures exact-origin CORS, JSON/URL-encoded body parsers, authenticated evidence routes, API routes, 404 fallback, and generic error handling.
- **`config/db.js`**: Initializes and exports the `pg.Pool` instance using environment variables from `backend/.env` without hardcoding any credentials.
- **`config/upload.js`**: Configures `multer.diskStorage` to store evidence in `UPLOAD_DIR` or the default `backend/uploads` directory, with collision-resistant generated filenames, MIME/extension checks, and a `50 MB` per-file size limit. `routes/issueRoutes.js` adds file-signature checks and owns the upload wrapper.
- **`controllers/issueController.js`**: Handles `getAllIssues` (with optional `sector`, `category`, `severity`, `status` query filters and `LEFT JOIN issue_evidence` aggregated via `json_agg`), `getIssueById`, `createIssue` (validates fields, cleans up orphan files on validation errors, inserts issue + evidence records, and triggers alert evaluation), and `updateIssueStatus` (updates issue status and synchronizes linked alerts).
- **`controllers/alertController.js`**: Handles `getAllAlerts`, `getActiveAlerts`, and `updateAlertStatus` (`Active`, `Acknowledged`, `Resolved`), joining with `issues` to include `title`, `sector`, `category`, `severity`, and coordinates.
- **`controllers/intelligenceController.js`**: Exposes ranked priority and impact results from `priorityService.js`.
- **`services/priorityService.js`**: Contains the rule-based priority and impact calculations. **`services/alertService.js`** evaluates the alert rule and routes alerts by sector/category.

---

## 10. Database Design Overview

The PostgreSQL database (`urbanpulse`) consists of **3 relational tables** defined in [`database/schema.sql`](file:///D:/UrbanPulse/database/schema.sql):

### 1. `issues` Table
Stores core civic anomaly reports and their municipal sector classification.
- `id` (`SERIAL PRIMARY KEY`)
- `sector` (`VARCHAR(100) NOT NULL DEFAULT 'Other Civic Services'`)
- `title` (`VARCHAR(255) NOT NULL`)
- `category` (`VARCHAR(100) NOT NULL`)
- `description` (`TEXT NOT NULL`)
- `latitude` and `longitude` (`NUMERIC(10,7) NOT NULL`)
- `severity` (`VARCHAR(20)` with a check for `Low`, `Medium`, `High`, `Critical`)
- `status` (`VARCHAR(20) NOT NULL DEFAULT 'Reported'` with a check for `Reported`, `In Progress`, `Resolved`)
- `created_at` (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`)
- **Indexes:** sector, category, status, severity, coordinates

### 2. `alerts` Table
Stores generated municipal alerts linked to qualifying issues.
- `id` (`SERIAL PRIMARY KEY`)
- `issue_id` (`INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE`)
- `alert_type` (`VARCHAR(50) NOT NULL`)
- `priority_score` (`INTEGER`, nullable)
- `authority` (`VARCHAR(100)`, nullable)
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

The API returns the numeric score and its factor breakdown; it does not assign named priority bands. The alert trigger has its own rule: score at least 55, or High/Critical severity, provided the issue is not resolved.

---

## 13. Impact Analysis Explanation (Rule-Based Engine)

Implemented as `calculateImpactScore` in `backend/src/services/priorityService.js`, the **Urban Impact Score (capped at 100)** estimates broader civic disruption. It is deterministic rule-based analysis, not a trained machine-learning model:

$$\text{Impact Score} = \min\left(100,\ I_{\text{severity}} + I_{\text{category}} + I_{\text{status}} + I_{\text{density}}\right)$$

1. **Severity Impact ($I_{\text{severity}}$):** `Critical` = **45**, `High` = **35**, `Medium` = **25**, `Low` = **10**
2. **Category Impact ($I_{\text{category}}$):** `Road Safety` and `Waterlogging` = **25**; `Road Damage` = **20**; `Streetlight` = **15**; other categories default to **5**.
3. **Status Impact ($I_{\text{status}}$):** `Reported` = **15**, `In Progress` = **8**, `Resolved` = **0**
4. **Cluster Density Impact ($I_{\text{density}}$):** the same proximity bonus as priority: **5 per nearby issue, capped at 15**, using independent latitude and longitude differences of at most `0.01°` (a bounding-box approximation, not a true radius).

**Impact Level Classification:**
- **Critical Impact:** Score $\ge 75$
- **High Impact:** Score $55 \text{ – } 74$
- **Moderate Impact:** Score $30 \text{ – } 54$
- **Low Impact:** Score $< 30$

Each assessed issue includes `impactFactors` such as `High severity`, `High-impact infrastructure category`, `Issue is awaiting action`, and `Nearby infrastructure issues detected` when the corresponding score conditions apply.

---

## 14. Alert Generation & Synchronization Workflow

Implemented in `backend/src/services/alertService.js` and `backend/src/controllers/issueController.js`:

1. **Trigger Rule (implemented):** The issue's score is calculated by `priorityService.js` using the weights in Section 12. An alert is generated only when the issue is not `Resolved` and (`priorityScore >= 55` or severity is `High` or `Critical`). High severity can trigger an alert through its separate severity rule even when its priority score is below 55.
2. **Duplicate Prevention:** Evaluations for the same issue are serialized with a PostgreSQL transaction advisory lock, then an existing alert is returned instead of inserting another. This protects concurrent application requests without deleting or rewriting prior alerts.
3. **Alert Type and Routing:** `alert_type` and `authority` are selected from the issue's sector and category in `alertService.js`. `priority_score` stores the Section 12 score.
4. **Issue-to-alert Status Synchronization:** When an issue's status changes through `PUT /api/issues/:id/status`:
   - Setting Issue Status to **`In Progress`** automatically updates any `Active` alert for that issue to **`Acknowledged`**.
   - Setting Issue Status to **`Resolved`** automatically updates every linked alert not already `Resolved` to **`Resolved`**. Direct alert status updates do not change issue status.

---

## 15. Municipal / Civic Sectors Supported

UrbanPulse stores a municipal sector and an issue category as separate report fields. Alert routing uses the sector first, with category-based fallback when the sector is `Other Civic Services`. These authority names are labels in the application; they do not connect to real departments.

| # | Municipal Civic Sector | Authority label assigned by the current code |
| :- | :--- | :--- |
| 1 | **Roads & Transportation** | Roads Department |
| 2 | **Traffic & Road Safety** | Traffic Authority |
| 3 | **Water Supply & Drainage** | Municipal Corporation / Water & Drainage Authority |
| 4 | **Fire & Emergency Services** | Fire & Emergency Services |
| 5 | **Solid Waste Management** | Waste Management Department |
| 6 | **Street Lighting** | Electrical / Street Lighting Department |
| 7 | **Public Infrastructure** | Public Infrastructure Department |
| 8 | **Environment & Pollution** | Environment Department |
| 9 | **Parks & Public Spaces** | Parks Department |
| 10 | **Public Health & Sanitation** | Public Health / Sanitation Department |
| 11 | **Other Civic Services** | Category-based fallback; defaults to Municipal Corporation |

---

## 16. Evidence Upload Support (Photos & Videos)

Citizens and field inspectors can attach visual proof when submitting an issue:

- **Supported Image Formats:** `.jpg`, `.jpeg`, `.png`, `.webp` (`image/jpeg`, `image/png`, `image/webp`)
- **Supported Video Formats:** `.mp4`, `.webm`, `.mov` (`video/mp4`, `video/webm`, `video/quicktime`)
- **Maximum File Size:** `50 MB` per file (enforced on both frontend and backend Multer middleware)
- **Storage Mechanism:** Files are stored in `backend/uploads/` by default or in the absolute directory configured by backend `UPLOAD_DIR`. The API validates extension, declared MIME type, and file signature before accepting media. Evidence is served through `/api/uploads/:fileName` after ownership or administrator authorization.
- **Persistent hosting:** Configure `UPLOAD_DIR` as a mounted persistent volume shared with the backend instance serving media, and back up that volume alongside the database. Ephemeral container disks lose uploads on restart; when using multiple instances, use shared storage or route media requests to the instance that owns the files. This project does not provision hosted storage.
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
| `GET` | `/api/alerts/active` | Returns only `Active` alerts | None |
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
│   │   │   └── priorityService.js        # Rule-based multi-factor priority scoring
│   │   └── index.js                      # Express server entry point & /uploads static server
│   ├── uploads/                          # Default evidence storage; files are ignored by Git
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
│   │   │   ├── Alerts.jsx                # Municipal Alert Center & 4-step pipeline graphic
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
   *Note: `schema.sql` uses `CREATE TABLE IF NOT EXISTS` and inserts each sample issue only when no row with that title exists. It does not run `ALTER TABLE` migrations. The seed check is suitable for sequential reruns; concurrent schema runs are not protected by a unique title constraint.*

---

## 22. Environment Variable Configuration

PostgreSQL connections to non-loopback hosts always use TLS with certificate and hostname verification enabled. The system trust store is used by default. If the database provider uses a private CA, configure exactly one backend setting: `DB_SSL_CA` with the PEM certificate (literal `\\n` line breaks are accepted), or `DB_SSL_CA_PATH` with the path to a readable PEM file mounted for the backend. `DB_SSL=false` is for local loopback development only; remote connections with TLS disabled and `DATABASE_URL` values that request `sslmode=no-verify` are rejected. Secure `sslmode` URL parameters are normalized to strict verification. Do not put credentials in URLs or logs.

The frontend uses `VITE_API_URL` as its API prefix and defaults to `/api`. Leave it empty both locally and in Vercel when using the existing routing: Vite proxies `/api` to `http://localhost:5000` (or `VITE_DEV_API_ORIGIN`), and `frontend/vercel.json` rewrites `/api/*` to the Render backend. Evidence URLs are converted to the authenticated `/api/uploads/*` route. The rewrite keeps browser requests on the frontend origin. If Vercel is configured to call Render directly instead, set backend `CORS_ORIGINS` to exact allowed frontend origins, including any required preview origin, and retain credentialed CORS; do not use a wildcard. Production session cookies use `SameSite=None; Secure` for cross-site credentialed requests. Some browsers or privacy settings may block third-party cookies, so the same-origin rewrite is preferred. Set backend `UPLOAD_DIR` to a mounted persistent directory on the host.

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
   - Navigate to **Municipal Alerts** and show the in-app alert with its priority score and assigned authority label. Set the issue to `In Progress` to verify its linked `Active` alert changes to `Acknowledged`; no external dispatch is sent.
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
3. **Authentication provisioning:** Citizen accounts and administrator-only status actions are implemented. The additive authentication migration and a trusted database operator's first-admin promotion must be completed before those flows are available in a deployment.
4. **Fixed Coordinate Radius Approximation:** Spatial density clustering uses a $\pm 0.01^\circ$ latitude/longitude bounding box ($\approx 1.1\text{ km}$) rather than PostGIS spherical distance queries.

---

## 28. Future Scope & Enhancements

1. **Computer Vision Verification:** Integrate a lightweight image classification model to automatically verify pothole/waterlogging severity from uploaded citizen photos.
2. **Expanded Role-Based Access Control (RBAC):** Add department-scoped roles and permissions for municipal engineer dashboards.
3. **Cloud Media Storage & CDN:** Migrate `multer` disk storage to cloud object storage (AWS S3 / Cloudinary) with automatic video compression.
4. **PostGIS Spatial Indexing:** Upgrade coordinate queries to PostgreSQL PostGIS `ST_DWithin` for exact meter-level radius clustering and ward boundary polygon mapping.
5. **SMS / Email Authority Notifications:** Connect `alertService.js` to Twilio or SMTP gateways to notify field engineers immediately when a `Critical Infrastructure Alert` is triggered.

---

## 29. Author & Project Credits

- **Project Title:** UrbanPulse — City Infrastructure Anomaly & Impact Intelligence Platform
- **Project Type:** Final-Year Undergraduate Software Engineering Project
- **Repository Path:** `D:\UrbanPulse`
- **License:** For Academic & Educational Demonstration Use
# Authentication setup (additive)

The API stores citizen accounts in `app_users` and opaque session-token hashes in
`auth_sessions`. Passwords are hashed with Node.js scrypt. Session cookies are
HttpOnly and expire after seven days; production cookies use `Secure` and
`SameSite=None` to support direct cross-site credentialed fetches, while local
HTTP development retains `SameSite=Lax` and omits `Secure`. The Vercel rewrite
keeps browser API calls same-origin when `VITE_API_URL` is empty. Unsafe API requests also require a signed CSRF
header. Public registration always creates the `citizen` role. Issue status
and alert status changes require an administrator on the server.
The administrator sign-in page at `/admin/login` calls the dedicated
`POST /api/auth/admin/login` route, which accepts only accounts already assigned
the `admin` role. Both login routes derive the role from the database session;
no role is accepted from the browser.

Before enabling authentication, take a normal database backup and apply
`database/migrations/001_authentication.sql` to the intended UrbanPulse database,
then review and apply `database/migrations/002_issue_report_ownership.sql`.
Migration 002 adds a nullable reporter foreign key and index. Existing reports
remain intact and unowned; only administrators can see those legacy reports.
New citizen reports are associated with the authenticated account. Neither
migration is run automatically by the application.
Do not run the sample-data section of `database/schema.sql` as a production
migration.

Set `AUTH_SECRET` in the backend environment to a newly generated random value
of at least 32 bytes. For example, locally run
`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
and copy the result into the private environment configuration; never commit it.
Set `CORS_ORIGINS` to a comma-separated list of additional exact frontend
origins when a deployment needs origins beyond the trusted UrbanPulse Vercel
domains and previews. The backend always retains those built-in trusted origins;
the setting adds deployment-specific origins. Vercel rewrites
keep the browser URL same-origin, but verify whether the proxy forwards the
browser `Origin` header and allow the exact preview origin if it does. In
production, HTTPS is
required for the secure session cookie. The existing Vercel `/api` rewrite
keeps browser requests on the frontend origin; leave `VITE_API_URL` empty in
Vercel so session cookies remain first-party. Keep the rewrite target aligned
with the Render API hostname.
If intentionally setting `VITE_API_URL` to the Render API, keep Render's
`CORS_ORIGINS` limited to the exact Vercel origin and ensure `NODE_ENV=production`
so the browser receives `SameSite=None; Secure` cookies. Browser third-party
cookie restrictions can still block direct cross-site sessions.

To provision the first administrator, register a normal citizen account, then
have a trusted database operator run the following for that exact address:

```sql
UPDATE app_users SET role = 'admin' WHERE LOWER(email) = LOWER('admin@example.com');
```

No administrator password or account is seeded by the application. A role
submitted by a browser is ignored.

For local development, apply migrations 001 and 002 to the local development database,
set `AUTH_SECRET` in `backend/.env`, run the backend and frontend, then register
at `/register`. For deployment, apply the migration first, configure
`AUTH_SECRET` and `CORS_ORIGINS` on Render, leave `VITE_API_URL` unset on Vercel
to use the same-origin rewrite, build/deploy the frontend, and provision an
administrator only if the deployment requires one. Verify login and cookie
behavior in the deployed browser before announcing the release. Never use the
production database for development seed scripts.

The login and registration limiter allows 10 requests per IP per 15 minutes.
It is in-memory and applies per Node.js process, so restarts clear counters and
multiple backend instances do not share limits. Keep the local limiter for
development; before production exposure, configure a shared-store limiter or
hosting-edge rate limit.

The migration must be applied to the intended PostgreSQL database before
registration or session operations can succeed. This repository does not run
migrations automatically and has no migration-tracking mechanism; operators
must back up the database, apply the additive migration once, and record its
completion in their deployment process. Do not run the seed/sample statements
from `database/schema.sql` against production.

Evidence files are stored on disk. Configure `UPLOAD_DIR` to persistent storage
for deployments, back it up with the database, and use shared storage or
instance-aware routing when running multiple backend instances. Otherwise
evidence may disappear after restarts or be unavailable on another instance.
Evidence is served through the authenticated `/api/uploads/:fileName` route:
citizens can view only evidence for their own reports, while administrators
can review all evidence. The old public `/uploads/*` access path is disabled.

Duplicate registration currently returns HTTP 409 with an account-exists
message to preserve a clear signup experience. This reveals whether an email
is registered; changing only the message would not remove that signal. Fully
reducing enumeration requires a flow such as email verification or account
recovery that gives equivalent responses for existing and new addresses.
