import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


def _uid() -> str:
    return uuid.uuid4().hex[:12]


class User(Base):
    """One of the 4 platform roles: ems_command, ambulance_staff, doctor, family."""

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # ems_command | ambulance_staff | doctor | family
    hospital = Column(String, nullable=True)  # relevant for doctor role
    created_at = Column(DateTime, default=datetime.utcnow)


class PatientRecord(Base):
    """A patient registered from the Ambulance Staff dashboard.

    This is what makes registered patients visible on the Doctor dashboard —
    the ambulance staff submits this, and the doctor dashboard reads it back
    by ambulance_id.
    """

    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=_uid)
    ambulance_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    blood_group = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    registered_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    registrar = relationship("User")


class ReportRecord(Base):
    """Metadata for a generated PDF report, so reports can be listed/re-downloaded."""

    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=_uid)
    ambulance_id = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=False)
    hospital = Column(String, nullable=True)
    generated_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AmbulanceRecord(Base):
    """Persisted snapshot of each ambulance's live state.

    The simulation runs in memory for smooth per-tick movement, but every
    tick writes its result back here, so `GET /api/ambulances` reflects the
    database and the fleet survives a backend restart instead of resetting.
    """

    __tablename__ = "ambulances"

    id = Column(String, primary_key=True)  # e.g. A101
    driver = Column(String, nullable=False)
    driver_phone = Column(String, nullable=True)
    status = Column(String, nullable=False, default="available")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed = Column(Integer, default=0)
    eta_minutes = Column(Integer, nullable=True)
    hospital = Column(String, nullable=True)
    patient_name = Column(String, nullable=True)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String, nullable=True)
    patient_blood_group = Column(String, nullable=True)
    patient_history = Column(Text, nullable=True)
    patient_allergies = Column(Text, nullable=True)
    heart_rate = Column(Integer, default=80)
    bp_systolic = Column(Integer, default=120)
    bp_diastolic = Column(Integer, default=80)
    spo2 = Column(Integer, default=98)
    temperature = Column(Float, default=37.0)
    respiratory_rate = Column(Integer, default=16)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class HospitalRecord(Base):
    __tablename__ = "hospitals"

    name = Column(String, primary_key=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    load = Column(String, default="Low")


class DoctorRecord(Base):
    __tablename__ = "doctors_directory"

    id = Column(String, primary_key=True, default=_uid)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=True)
    hospital = Column(String, nullable=True)


class EventRecord(Base):
    """Activity-timeline log — every dispatch, arrival, and alert is persisted
    here so the timeline survives a page refresh or backend restart."""

    __tablename__ = "events"

    id = Column(String, primary_key=True, default=_uid)
    ambulance_id = Column(String, nullable=True, index=True)
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class NotificationRecord(Base):
    """Log of 'Notify Hospital' actions sent from the Ambulance Staff dashboard."""

    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=_uid)
    ambulance_id = Column(String, nullable=False)
    hospital = Column(String, nullable=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
