"""AccidentWatch FastAPI backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import init_db
from routers import alerts, detect, incidents, stats
from ws import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="AccidentWatch API",
    description="AI-powered road accident detection and emergency response for Indian roads",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

app.include_router(detect.router, prefix="/api", tags=["Detection"])
app.include_router(incidents.router, prefix="/api", tags=["Incidents"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(ws_router, tags=["WebSocket"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "accident-watch"}
