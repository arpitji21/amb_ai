import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

import models_db as models
import simulation as sim
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/reports", tags=["reports"])

PRIMARY = colors.HexColor("#0F5C8C")
TEAL = colors.HexColor("#14B8A6")
MUTED = colors.HexColor("#5B6B7B")


@router.get("/{ambulance_id}/pdf")
def generate_report(
    ambulance_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ambulance = next((a for a in sim_fleet().ambulances if a.id == ambulance_id), None)
    if ambulance is None:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    patient_record = (
        db.query(models.PatientRecord)
        .filter(models.PatientRecord.ambulance_id == ambulance_id)
        .order_by(models.PatientRecord.created_at.desc())
        .first()
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=22 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title2", parent=styles["Title"], textColor=PRIMARY, fontSize=20, spaceAfter=2)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], textColor=MUTED, fontSize=10, spaceAfter=14)
    heading_style = ParagraphStyle("H2", parent=styles["Heading2"], textColor=PRIMARY, fontSize=12.5, spaceBefore=14, spaceAfter=6)
    body_style = ParagraphStyle("Body2", parent=styles["Normal"], fontSize=10, leading=14)

    story = [
        Paragraph("LEIP Emergency Report", title_style),
        Paragraph(f"Ambulance {ambulance.id} · Generated {datetime.now().strftime('%d %b %Y, %H:%M')}", subtitle_style),
    ]

    # Patient details
    story.append(Paragraph("Patient Details", heading_style))
    if patient_record:
        patient_rows = [
            ["Name", patient_record.name, "Age", str(patient_record.age)],
            ["Gender", patient_record.gender, "Blood Group", patient_record.blood_group],
            ["Phone", patient_record.phone_number or "—", "Emergency Contact", patient_record.emergency_contact or "—"],
            ["Medical History", patient_record.medical_history or "—", "Allergies", patient_record.allergies or "—"],
        ]
    elif ambulance.patient:
        p = ambulance.patient
        patient_rows = [
            ["Name", p.name, "Age", str(p.age)],
            ["Gender", p.gender, "Blood Group", p.blood_group],
            ["Medical History", p.medical_history, "Allergies", p.allergies],
        ]
    else:
        patient_rows = [["No patient currently registered for this unit.", "", "", ""]]

    story.append(_table(patient_rows))

    # Vital signs
    story.append(Paragraph("Vital Signs (most recent reading)", heading_style))
    v = ambulance.vitals
    vitals_rows = [
        ["Heart Rate", f"{v.heart_rate} bpm", "SpO₂", f"{v.spo2}%"],
        ["Blood Pressure", f"{v.bp_systolic}/{v.bp_diastolic}", "Temperature", f"{v.temperature}°C"],
        ["Respiratory Rate", f"{v.respiratory_rate}/min", "Status", ambulance.status.title()],
    ]
    story.append(_table(vitals_rows))

    # Journey timeline
    story.append(Paragraph("Journey Timeline", heading_style))
    timeline = [
        "Emergency call received",
        f"Ambulance {ambulance.id} dispatched",
        "Patient pickup completed",
        "Vitals monitoring started",
        "Doctor connected remotely",
        f"Hospital notified — {ambulance.hospital}",
        "Patient arrival" if ambulance.status == "arrived" else f"En route — ETA {ambulance.eta_minutes or '—'} min",
    ]
    for step in timeline:
        story.append(Paragraph(f"→ {step}", body_style))

    # AI summary
    story.append(Paragraph("AI-Generated Summary", heading_style))
    story.append(Paragraph(sim.ai_summary(ambulance), body_style))

    # Hospital / doctor / arrival
    story.append(Paragraph("Hospital & Care Team", heading_style))
    doctor = next((d for d in sim.DOCTORS if d["hospital"] == ambulance.hospital), None)
    care_rows = [
        ["Destination Hospital", ambulance.hospital],
        ["Attending Doctor", doctor["name"] if doctor else "Unassigned"],
        ["ETA", f"{ambulance.eta_minutes} min" if ambulance.eta_minutes is not None else "—"],
    ]
    story.append(_table(care_rows, two_col=True))

    # Emergency notes / prep checklist
    story.append(Paragraph("Hospital Preparation Checklist", heading_style))
    checklist = ["Prepare Oxygen", "Prepare ICU Bed", "Prepare Trauma Team", "Prepare ECG", "Prepare Emergency Room"]
    relevant = checklist if ambulance.status == "critical" else checklist[:2]
    for item in relevant:
        story.append(Paragraph(f"☐ {item}", body_style))

    doc.build(story)
    buffer.seek(0)
    filename = f"LEIP-Report-{ambulance.id}-{datetime.now().strftime('%Y%m%d-%H%M')}.pdf"

    db.add(models.ReportRecord(
        ambulance_id=ambulance.id,
        patient_name=(patient_record.name if patient_record else (ambulance.patient.name if ambulance.patient else "Unknown")),
        hospital=ambulance.hospital,
        generated_by=current_user.id,
    ))
    db.commit()

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _table(rows: list[list[str]], two_col: bool = False) -> Table:
    col_widths = [110 * mm, 60 * mm] if two_col else [42 * mm, 55 * mm, 42 * mm, 33 * mm]
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#E3E9EF")),
    ]))
    return t


def sim_fleet():
    """Import indirection to avoid a circular import with main.py's module-level fleet instance."""
    import main
    return main.fleet
