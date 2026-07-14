"""Detection router."""

import time
import uuid
from typing import Optional

import requests
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from classifier import run_detection
from config import settings
from database import IncidentModel, SessionLocal, get_db, incident_to_dict
from services.notifications import broadcast_incident, send_severe_sms
from ws import manager

router = APIRouter()


def reverse_geocode(lat: float, lng: float) -> Optional[str]:
    try:
        headers = {"User-Agent": "AccidentWatch/1.0"}
        url = (
            f"https://nominatim.openstreetmap.org/reverse"
            f"?format=json&lat={lat}&lon={lng}&zoom=16"
        )
        res = requests.get(url, headers=headers, timeout=4)
        if res.status_code == 200:
            return res.json().get("display_name")
    except Exception:
        pass
    return None


@router.post("/detect")
async def detect(
    image: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    db: Session = Depends(get_db),
):
    if not image.content_type or not (
        image.content_type.startswith("image/") or image.content_type == "application/octet-stream"
    ):
        raise HTTPException(400, "Upload a JPG or PNG image")

    ts = int(time.time() * 1000)
    ext = ".jpg"
    if image.filename and "." in image.filename:
        ext = "." + image.filename.rsplit(".", 1)[-1].lower()

    input_name = f"input_{ts}{ext}"
    output_name = f"output_{ts}{ext}"
    input_path = settings.UPLOAD_DIR / input_name
    output_path = settings.UPLOAD_DIR / output_name

    content = await image.read()
    input_path.write_bytes(content)

    result = run_detection(str(input_path), str(output_path))

    lat = lat or 20.5937
    lng = lng or 78.9629
    address = reverse_geocode(lat, lng)

    incident = IncidentModel(
        id=f"inc_{uuid.uuid4().hex[:12]}",
        lat=lat,
        lng=lng,
        severity=result["severity"],
        status="NEW",
        photoUrl=f"/uploads/{output_name}",
        confidence=result["confidence"],
        detectedBy="AI",
        vehicleTypes=["Unknown"],
        address=address,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    payload = incident_to_dict(incident)
    await manager.broadcast({"type": "incident", "incident": payload})

    if result["severity"] in ("SEVERE", "FATAL"):
        send_severe_sms(payload)

    return {
        **result,
        "annotated_image_url": f"/uploads/{output_name}",
        "incident_id": incident.id,
    }
