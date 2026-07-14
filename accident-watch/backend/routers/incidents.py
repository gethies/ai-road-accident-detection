"""Incidents CRUD router."""

import uuid
from datetime import datetime
from typing import Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import AlertActionModel, IncidentModel, get_db, incident_to_dict
from services.notifications import send_severe_sms
from ws import manager

router = APIRouter()


class IncidentCreate(BaseModel):
    lat: float
    lng: float
    severity: str
    vehicleTypes: list[str] = []
    notes: Optional[str] = None
    photoUrl: Optional[str] = None
    anonymous: bool = False
    emergencyOnScene: Optional[str] = None
    occurredAt: Optional[str] = None


class IncidentUpdate(BaseModel):
    status: str
    userId: str = "system"


def reverse_geocode(lat: float, lng: float) -> Optional[str]:
    try:
        headers = {"User-Agent": "AccidentWatch/1.0"}
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}"
        res = requests.get(url, headers=headers, timeout=4)
        if res.status_code == 200:
            return res.json().get("display_name")
    except Exception:
        pass
    return None


@router.get("/incidents")
def list_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(IncidentModel).order_by(IncidentModel.createdAt.desc())
    if severity:
        q = q.filter(IncidentModel.severity == severity.upper())
    if status:
        q = q.filter(IncidentModel.status == status.upper())
    if state:
        q = q.filter(IncidentModel.address.ilike(f"%{state}%"))
    incidents = q.limit(limit).all()
    return [incident_to_dict(i) for i in incidents]


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not inc:
        raise HTTPException(404, "Incident not found")
    return incident_to_dict(inc)


@router.post("/incidents")
async def create_incident(body: IncidentCreate, db: Session = Depends(get_db)):
    address = reverse_geocode(body.lat, body.lng)
    incident = IncidentModel(
        id=f"inc_{uuid.uuid4().hex[:12]}",
        lat=body.lat,
        lng=body.lng,
        severity=body.severity.upper(),
        status="NEW",
        photoUrl=body.photoUrl,
        detectedBy="HUMAN",
        vehicleTypes=body.vehicleTypes,
        notes=body.notes,
        address=address,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    payload = incident_to_dict(incident)
    await manager.broadcast({"type": "incident", "incident": payload})

    if body.severity.upper() in ("SEVERE", "FATAL"):
        send_severe_sms(payload)

    nearest = _nearest_facilities(body.lat, body.lng)
    return {**payload, "nearest": nearest}


@router.patch("/incidents/{incident_id}")
async def update_incident(
    incident_id: str, body: IncidentUpdate, db: Session = Depends(get_db)
):
    inc = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not inc:
        raise HTTPException(404, "Incident not found")

    status_map = {
        "ACK": "ACKNOWLEDGED",
        "ACKNOWLEDGED": "ACKNOWLEDGED",
        "DISPATCHED": "DISPATCHED",
        "ESCALATED": "ESCALATED",
        "RESOLVED": "RESOLVED",
    }
    new_status = status_map.get(body.status.upper(), body.status.upper())
    inc.status = new_status
    if new_status == "RESOLVED":
        inc.resolvedAt = datetime.utcnow()

    action = AlertActionModel(
        id=f"act_{uuid.uuid4().hex[:12]}",
        incidentId=incident_id,
        action=new_status,
        userId=body.userId,
    )
    db.add(action)
    db.commit()
    db.refresh(inc)

    payload = incident_to_dict(inc)
    await manager.broadcast({"type": "incident", "incident": payload})
    return payload


def _nearest_facilities(lat: float, lng: float) -> dict:
    return {
        "hospital": {
            "name": "Nearest Government Hospital",
            "distance_km": 2.4,
            "phone": "108",
        },
        "police": {
            "name": "Local Police Station",
            "distance_km": 1.1,
            "phone": "100",
        },
    }
