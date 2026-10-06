# UrbanPulse — City Infrastructure Anomaly & Impact Intelligence Platform

## Project Overview
UrbanPulse is a full-stack civic intelligence platform designed to track, analyze, and visualize urban infrastructure anomalies—such as potholes, road damage, non-functional streetlights, waterlogging, and illegal garbage dumps. The platform allows citizens to submit incident reports and equips municipal authorities with actionable analytics, priority scoring, and geographic visualization to streamline maintenance operations.

---

## Key Features & Capabilities
1. **Incident Ingestion**: Structured reporting of infrastructure issues with geo-coordinates, imagery, and severity tags.
2. **Interactive Map Visualization**: Geographic plotting of anomalies across city zones to spot issue clusters.
3. **Automated Impact Scoring**: Heuristic and rule-based priority assessment based on issue severity and urban impact.
4. **Administrative Analytics**: Real-time breakdown of incident volume, resolution status, and municipal response metrics.
5. **Extensible AI Architecture**: Modular service boundaries ready for computer-vision and anomaly-detection extensions.

---

## System Architecture & Tech Stack

- **Frontend**: React 18, Vite, React-Leaflet, OpenStreetMap, Modular Command Center CSS
- **Backend**: Node.js, Express REST API, pg (node-postgres connection pool)
- **Database**: PostgreSQL 18.4
- **Version Control**: Git

---

## Project Structure
```text
UrbanPulse/
├── backend/          # Node.js & Express REST API (Port 5000)
│   ├── src/
│   │   ├── config/   # PostgreSQL connection pool configuration
│   │   ├── controllers/ # Controllers for Issues, Alerts, Intelligence, Health
│   │   ├── routes/   # Modular Express route handlers
│   │   ├── services/ # Priority scoring, impact calculation & alert dispatch
│   │   └── index.js  # Main Express application entry point
│   ├── .env.example  # Environment variable template
│   └── package.json
├── frontend/         # React + Vite Command Center SPA (Port 5173)
│   ├── src/
│   │   ├── components/ # Leaflet MapView, Sidebar, Header, Badges, Icons
│   │   ├── pages/    # Command Center Dashboard, Incident Center, Ingest, Alerts, Analytics
│   │   ├── services/ # REST API client service layer
│   │   ├── App.jsx   # Top-level shell and responsive navigation
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── database/         # PostgreSQL schema definition and sample seeds
│   └── schema.sql
├── README.md         # Comprehensive project documentation
└── .gitignore        # Git ignore specifications
```

---

## REST API Reference
- `GET  /api/health` — Service liveness and PostgreSQL connectivity status
- `GET  /api/issues` — Retrieve all infrastructure incidents
- `POST /api/issues` — File a new incident report & trigger automatic alert generation
- `PUT  /api/issues/:id/status` — Update incident status (`Reported`, `In Progress`, `Resolved`) with alert sync
- `GET  /api/alerts` — Fetch all municipal dispatch alerts
- `GET  /api/alerts/active` — Fetch all unresolved active alerts
- `PUT  /api/alerts/:id/status` — Update alert status (`Active`, `Acknowledged`, `Resolved`)
- `GET  /api/intelligence/priorities` — Multi-factor priority rankings (Severity, Category, Status, Density)
- `GET  /api/intelligence/impact` — Urban impact intelligence and bottleneck factor analysis

---

## Quick-Start Run Instructions

### 1. Start the Backend API (Terminal 1)
```powershell
cd D:\UrbanPulse\backend
npm start
```
*Backend runs on `http://localhost:5000`*

### 2. Start the Frontend Client (Terminal 2)
```powershell
cd D:\UrbanPulse\frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## Development Roadmap
- [x] **Stage 1**: Workspace & project structure initialization
- [x] **Stage 2**: PostgreSQL schema creation & database connection setup
- [x] **Stage 3**: Node.js REST API foundational routes (Health, Ingestion, Fetch)
- [x] **Stage 4**: React frontend interface & reporting forms
- [x] **Stage 5**: Map visualization, impact intelligence, and analytics dashboard
- [x] **Stage 6**: Final QA, E2E validation, and alert lifecycle synchronization

