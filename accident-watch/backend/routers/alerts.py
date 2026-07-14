"""Alert dispatch router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import IncidentModel, get_db, incident_to_dict
from services.notifications import send_severe_sms

router = APIRouter()


@router.post("/alerts/{incident_id}/dispatch")
def dispatch_alert(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not inc:
        raise HTTPException(404, "Incident not found")

    inc.status = "DISPATCHED"
    db.commit()
    db.refresh(inc)

    payload = incident_to_dict(inc)
    send_severe_sms(payload)
    return {"success": True, "incident": payload}
