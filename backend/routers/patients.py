from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models_db as models
import schemas
from auth import get_current_user, require_role
from database import get_db

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("", response_model=schemas.PatientOut)
def register_patient(
    payload: schemas.PatientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("ambulance_staff", "ems_command")),
):
    patient = models.PatientRecord(**payload.model_dump(), registered_by=current_user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=list[schemas.PatientOut])
def list_patients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Doctor dashboard polls this (optionally filtered by ambulance_id) to see incoming patients."""
    return db.query(models.PatientRecord).order_by(models.PatientRecord.created_at.desc()).limit(50).all()


@router.get("/by-ambulance/{ambulance_id}", response_model=schemas.PatientOut | None)
def get_patient_for_ambulance(
    ambulance_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return (
        db.query(models.PatientRecord)
        .filter(models.PatientRecord.ambulance_id == ambulance_id)
        .order_by(models.PatientRecord.created_at.desc())
        .first()
    )
