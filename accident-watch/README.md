# AccidentWatch — Full-Stack Road Safety Platform

AI-powered accident detection and emergency response for Indian roads. Extends the original [Accident Detection on Indian Roads](https://github.com) TensorFlow SSD model into a production web platform.

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui, Leaflet, Recharts |
| Backend | FastAPI, TensorFlow 2.x (compat v1), WebSockets |
| Database | PostgreSQL + SQLAlchemy (Prisma schema included) |
| Deploy | Docker Compose |

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 16 (or use Docker)
- Original model files in `../Accident-Detection-on-Indian-Roads-master/Python Demo/`

### 1. Database

```bash
docker compose up postgres -d
```

Or use any PostgreSQL instance and set `DATABASE_URL` in `backend/.env`.

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

App: http://localhost:3000

### Full Stack (Docker)

```bash
docker compose up --build
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing with live map hero |
| `/detect` | AI Detection Lab — upload images |
| `/map` | Live incident map + WebSocket feed |
| `/report` | Community accident reporting |
| `/dashboard` | Analytics for authorities |
| `/alerts` | Alert inbox for responders |
| `/api-docs` | Embedded Swagger UI |
| `/about` | Model info and limitations |

## API Endpoints

```
POST /api/detect          — Run TF model on uploaded image
GET  /api/incidents       — List incidents (filterable)
POST /api/incidents       — Create incident
GET  /api/incidents/{id}  — Get incident details
PATCH /api/incidents/{id} — Update status
GET  /api/stats           — Dashboard analytics
GET  /api/hotspots        — DBSCAN high-risk zones
WS   /ws/incidents        — Live incident feed
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.local.example`.

## Model Notes

The backend loads `frozen_inference_graph.pb` from the original Python Demo via `PYTHON_DEMO_PATH`. If TensorFlow is unavailable, detection falls back to mock results for UI development.

## License

Built on the open-source Accident Detection on Indian Roads project.
