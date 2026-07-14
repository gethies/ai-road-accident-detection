import os
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./accidentwatch.db"
    MODEL_PATH: str = ""
    PYTHON_DEMO_PATH: str = ""
    DETECTION_CONFIDENCE_THRESHOLD: float = 0.5
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    UPLOAD_DIR: Path = Path(__file__).parent / "uploads"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

# Resolve paths relative to workspace
WORKSPACE = Path(__file__).resolve().parent.parent.parent
if not settings.PYTHON_DEMO_PATH:
    settings.PYTHON_DEMO_PATH = str(
        WORKSPACE / "Accident-Detection-on-Indian-Roads-master" / "Python Demo"
    )
if not settings.MODEL_PATH:
    settings.MODEL_PATH = str(
        Path(settings.PYTHON_DEMO_PATH) / "graph" / "frozen_inference_graph.pb"
    )

settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

os.environ.setdefault("PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION", "python")
