# LEIP — Emergency Intelligence Platform (MVP)

A demo AI-powered EMS ambulance management platform. **No real medical devices
are connected** — all vitals, GPS movement, and AI summaries are simulated.

All four dashboards from the brief are implemented, backed by a FastAPI
service with JWT auth, a database-backed patient registry, a live
WebSocket ambulance feed, and PDF report generation.

## What's included

**Frontend** (`frontend/`) — React + Vite + TypeScript + Tailwind + Leaflet + Recharts
- `/login` — role-based sign-in (EMS Command, Ambulance Staff, Doctor, Family)
- `/ems` — **EMS Command Center**: live map, fleet stats, activity timeline
- `/ambulance` — **Ambulance Staff**: patient registration form, live vitals +
  charts, AI alerts, dispatch/report/notify actions
- `/doctor` — **Doctor**: incoming patient list, live vitals + charts,
  emergency alerts, AI summary, preparation checklist, journey timeline
- `/family` — **Family**: patient condition, ETA, hospital, live location,
  timeline, and a **nearest available ambulance finder** — uses the
  browser's location to show the closest idle units with distance, ETA,
  and a tap-to-call driver phone number
- `frontend/preview.html` — a **single, dependency-free HTML file** with the
  EMS Command Center only, for an instant no-install look at the design.

**Backend** (`backend/`) — FastAPI
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` — JWT auth
- `POST /api/patients`, `GET /api/patients`, `GET /api/patients/by-ambulance/{id}` —
  patient registration (SQLAlchemy-backed; SQLite by default, Postgres via `DATABASE_URL`)
- `GET /api/reports/{ambulance_id}/pdf` — downloadable PDF report (patient
  details, vitals, timeline, AI summary, hospital, doctor, checklist)
- `GET /api/ambulances`, `/api/ambulances/{id}`, `/api/ambulances/nearby`,
  `/api/stats`, `/api/hospitals`, `/api/doctors`, `/api/family/{id}` — live + persisted data
- `GET /api/events`, `GET /api/notifications` — persisted activity/notification log
- `POST /api/ambulances/{id}/notify-hospital`, `/send-to-hospital` — staff actions (persisted)
- `WS /ws/ambulances` — broadcasts the full fleet (GPS + vitals) every 2 seconds

**Everything is database-backed**: users, patient registrations, report
metadata, hospitals, doctors, the live ambulance fleet (position + vitals),
the activity timeline, and hospital notifications all persist to the
database — a backend restart resumes the fleet from where it left off
instead of resetting.

## Demo logins

On first run the backend seeds one account per role, password `demo1234` for all:

| Role            | Email             |
|-----------------|-------------------|
| EMS Command     | ems@leip.demo     |
| Ambulance Staff | staff@leip.demo   |
| Doctor          | doctor@leip.demo  |
| Family          | family@leip.demo  |

The login page also has one-click buttons for these.

## Quick preview (no install required)

Open `frontend/preview.html` directly in any browser — it pulls Leaflet and
fonts from a CDN and runs the EMS Command Center simulation client-side.

## Running the real project

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn main:app --reload
```

API: `http://localhost:8000` · WebSocket: `ws://localhost:8000/ws/ambulances`
· Interactive docs: `http://localhost:8000/docs`

Uses a local `leip.db` SQLite file by default — no setup needed. Set
`DATABASE_URL` (see `.env.example`) to point at Postgres in production.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env      # point VITE_API_URL / VITE_WS_URL at the backend
npm run dev
```

Dashboard: `http://localhost:5173`

- If `VITE_WS_URL` is unset, the EMS map runs its own in-browser simulation —
  it always has live data to show, even with no backend running. The other
  three dashboards call the REST API directly, so the backend should be
  running for patient registration, reports, and login to work.
- If `VITE_WS_URL` points at the FastAPI backend, the EMS map renders
  server-driven data instead, matching the intended production architecture.

## Deployment

- `frontend/vercel.json` — deploy the frontend to Vercel (`vercel --prod` from
  `frontend/`, or connect the repo with root directory `frontend`)
- `render.yaml` — deploy the backend + a managed Postgres instance to Render
  (Render → New → Blueprint → point at this repo)

Set the frontend's `VITE_API_URL`/`VITE_WS_URL` env vars on Vercel to your
Render backend URL after deploying.

## Design system

White / blue / teal base with green / amber / red status colors, rounded
cards, soft shadows, and glassmorphism accents. Display type is Manrope, body
text is Inter, and all live numeric readouts (vitals, ETAs, IDs) use
JetBrains Mono — a deliberate nod to real patient-monitor displays.

The live vitals sections (Ambulance Staff and Doctor dashboards) use a
dedicated dark ICU-monitor treatment — glowing animated ECG trace, severity-
colored readouts (heart rate, SpO₂, NIBP, respiratory rate, temperature,
MAP), and a simulated "Agent Orchestration Feed" showing the platform's
three AI agents (Vitals Monitoring, Triage & Severity, Doctor Summary)
reasoning over the live data in real time.

## Known simplifications (MVP scope)

- AI summaries and the agent feed are template-based, not calls to an LLM —
  matching the brief's "simulated data, no real AI model required."
- Family/Doctor/Ambulance-Staff dashboards let you pick which ambulance to
  view via a dropdown, rather than a real assignment system — reasonable for
  a demo where any family member/doctor could plausibly be tracking any unit.
