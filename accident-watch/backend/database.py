import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column, DateTime, Float, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import settings


class Base(DeclarativeBase):
    pass


class IncidentModel(Base):
    __tablename__ = "Incident"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:25])
    createdAt = Column(DateTime, default=datetime.utcnow)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    status = Column(String, default="NEW")
    photoUrl = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    detectedBy = Column(String, nullable=False)
    vehicleTypes = Column(JSON, default=list)
    reporterId = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    resolvedAt = Column(DateTime, nullable=True)


class AlertActionModel(Base):
    __tablename__ = "AlertAction"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:25])
    incidentId = Column(String, nullable=False)
    action = Column(String, nullable=False)
    userId = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


class UserModel(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:25])
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, default="PUBLIC")
    district = Column(String, nullable=True)


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)
    _seed_sample_data()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def incident_to_dict(inc: IncidentModel) -> dict:
    return {
        "id": inc.id,
        "createdAt": inc.createdAt.isoformat() + "Z" if inc.createdAt else None,
        "lat": inc.lat,
        "lng": inc.lng,
        "severity": inc.severity,
        "status": inc.status,
        "photoUrl": inc.photoUrl,
        "confidence": inc.confidence,
        "detectedBy": inc.detectedBy,
        "vehicleTypes": inc.vehicleTypes or [],
        "reporterId": inc.reporterId,
        "notes": inc.notes,
        "address": inc.address,
        "resolvedAt": inc.resolvedAt.isoformat() + "Z" if inc.resolvedAt else None,
    }


def _seed_sample_data():
    db: Session = SessionLocal()
    try:
        if db.query(IncidentModel).count() > 0:
            return
        samples = [
            IncidentModel(
                id="inc_sample_001",
                lat=13.0827,
                lng=80.2707,
                severity="SEVERE",
                status="NEW",
                confidence=0.89,
                detectedBy="AI",
                vehicleTypes=["Car", "Two-wheeler"],
                address="Mount Road, Chennai, Tamil Nadu",
            ),
            IncidentModel(
                id="inc_sample_002",
                lat=19.076,
                lng=72.8777,
                severity="MODERATE",
                status="ACK",
                confidence=0.72,
                detectedBy="HUMAN",
                vehicleTypes=["Truck"],
                address="Western Express Highway, Mumbai",
            ),
            IncidentModel(
                id="inc_sample_003",
                lat=28.6139,
                lng=77.209,
                severity="MINOR",
                status="RESOLVED",
                confidence=0.61,
                detectedBy="BOTH",
                vehicleTypes=["Auto"],
                address="Ring Road, New Delhi",
            ),
            IncidentModel(
                id="inc_sample_004",
                lat=12.9716,
                lng=77.5946,
                severity="SEVERE",
                status="DISPATCHED",
                confidence=0.91,
                detectedBy="AI",
                vehicleTypes=["Bus", "Car"],
                address="Outer Ring Road, Bengaluru",
            ),
            IncidentModel(
                id="inc_sample_005",
                lat=17.385,
                lng=78.4867,
                severity="MODERATE",
                status="NEW",
                confidence=0.68,
                detectedBy="AI",
                vehicleTypes=["Two-wheeler"],
                address="NH-44, Hyderabad",
            ),
        ]
        db.add_all(samples)
        db.commit()
    finally:
        db.close()
