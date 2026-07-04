"""
Simulated EMS data for the LEIP MVP.

No real medical devices or GPS hardware are involved — this module generates
believable, continuously-updating ambulance, vitals, and dispatch data so the
frontend has a live feed to render against.
"""
from __future__ import annotations

import random
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Literal, Optional

AmbulanceStatus = Literal["available", "responding", "critical", "arrived"]

COMMAND_CENTER = (12.9716, 77.5946)

HOSPITALS = [
    {"name": "St. Xavier General", "lat": 12.9789, "lng": 77.6089, "load": "Moderate"},
    {"name": "Lakeview Trauma Center", "lat": 12.9611, "lng": 77.5900, "load": "High"},
    {"name": "Northgate Medical", "lat": 12.9917, "lng": 77.5721, "load": "Low"},
]

DOCTORS = [
    {"name": "Dr. N. Iyengar", "specialty": "Emergency Medicine", "hospital": "St. Xavier General"},
    {"name": "Dr. A. Bhatt", "specialty": "Trauma Surgery", "hospital": "Lakeview Trauma Center"},
    {"name": "Dr. R. Chandran", "specialty": "Cardiology", "hospital": "Northgate Medical"},
]

DRIVER_NAMES = ["R. Sharma", "A. Menon", "K. Iyer", "T. Fernandes", "P. Naidu"]
DRIVER_PHONES = ["+91 98450 11223", "+91 98860 33445", "+91 99000 55667", "+91 97400 77889", "+91 90080 99001"]
PATIENT_NAMES = ["Arjun Rao", "Meera Nair", "Vikram Sethi", "Fatima Sheikh", "Rohan Kapoor", "Nisha Verma"]
HISTORY = ["Hypertension", "No prior conditions", "Type 2 Diabetes", "Asthma", "Post-cardiac surgery"]
ALLERGIES = ["None known", "Penicillin", "Sulfa drugs", "None known"]
BLOOD_GROUPS = ["O+", "A+", "B+", "AB+", "O-"]


def phone_for_driver(driver: str) -> str:
    """Looks up the fake dispatch phone number for a known driver, or derives
    a stable-looking one for unrecognized names (e.g. after DB hydration)."""
    if driver in DRIVER_NAMES:
        return DRIVER_PHONES[DRIVER_NAMES.index(driver)]
    return "+91 90000 00000"


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometers between two lat/lng points."""
    from math import radians, sin, cos, asin, sqrt

    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * r * asin(sqrt(a))


def _jitter(value: float, amount: float) -> float:
    return round(value + random.uniform(-amount, amount), 1)


def _make_route(hospital: dict) -> list[tuple[float, float]]:
    start = (COMMAND_CENTER[0] + random.uniform(-0.05, 0.05), COMMAND_CENTER[1] + random.uniform(-0.05, 0.05))
    end = (hospital["lat"], hospital["lng"])
    mid = ((start[0] + end[0]) / 2 + random.uniform(-0.01, 0.01), (start[1] + end[1]) / 2 + random.uniform(-0.01, 0.01))
    steps = 40
    points = []
    for i in range(steps + 1):
        t = i / steps
        lat = (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * mid[0] + t**2 * end[0]
        lng = (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * mid[1] + t**2 * end[1]
        points.append((lat, lng))
    return points


@dataclass
class Patient:
    name: str
    age: int
    gender: str
    blood_group: str
    medical_history: str
    allergies: str


@dataclass
class Vitals:
    heart_rate: int
    bp_systolic: int
    bp_diastolic: int
    spo2: int
    temperature: float
    respiratory_rate: int


@dataclass
class Ambulance:
    id: str
    driver: str
    status: AmbulanceStatus
    hospital: str
    route: list[tuple[float, float]]
    route_index: int
    speed: int
    vitals: Vitals
    phone: str = ""
    patient: Optional[Patient] = None
    eta_minutes: Optional[int] = None
    lat: float = field(init=False)
    lng: float = field(init=False)

    def __post_init__(self):
        self.lat, self.lng = self.route[self.route_index]
        if not self.phone:
            self.phone = phone_for_driver(self.driver)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["lat"] = self.lat
        d["lng"] = self.lng
        return d


def _new_patient() -> Patient:
    return Patient(
        name=random.choice(PATIENT_NAMES),
        age=random.randint(19, 78),
        gender=random.choice(["Male", "Female", "Other"]),
        blood_group=random.choice(BLOOD_GROUPS),
        medical_history=random.choice(HISTORY),
        allergies=random.choice(ALLERGIES),
    )


def _new_vitals() -> Vitals:
    return Vitals(
        heart_rate=random.randint(70, 125),
        bp_systolic=random.randint(100, 150),
        bp_diastolic=random.randint(65, 95),
        spo2=random.randint(90, 99),
        temperature=_jitter(37.1, 1.2),
        respiratory_rate=random.randint(14, 24),
    )


class Fleet:
    """Holds simulation state for all ambulances and advances it over time."""

    def __init__(self, seed_rows: Optional[list[dict]] = None):
        """If `seed_rows` is given (persisted ambulance rows from the database),
        the fleet resumes from that saved state instead of randomizing fresh
        units — so a backend restart doesn't lose fleet progress. Each unit
        gets a freshly generated route from its saved position onward, since
        routes themselves aren't persisted (only current state is)."""
        self.ambulances: list[Ambulance] = []

        if seed_rows:
            for row in seed_rows:
                hospital = next((h for h in HOSPITALS if h["name"] == row["hospital"]), random.choice(HOSPITALS))
                route = _make_route(hospital)
                # Splice the saved position in as the route's starting point so
                # movement continues from where it left off, not from a random spot.
                route[0] = (row["lat"], row["lng"])
                patient = None
                if row.get("patient_name"):
                    patient = Patient(
                        name=row["patient_name"],
                        age=row.get("patient_age") or 30,
                        gender=row.get("patient_gender") or "Other",
                        blood_group=row.get("patient_blood_group") or "O+",
                        medical_history=row.get("patient_history") or "No prior conditions",
                        allergies=row.get("patient_allergies") or "None known",
                    )
                self.ambulances.append(
                    Ambulance(
                        id=row["id"],
                        driver=row["driver"],
                        status=row["status"],
                        hospital=hospital["name"],
                        route=route,
                        route_index=0,
                        speed=row.get("speed") or 40,
                        phone=row.get("driver_phone") or "",
                        vitals=Vitals(
                            heart_rate=row.get("heart_rate") or 80,
                            bp_systolic=row.get("bp_systolic") or 120,
                            bp_diastolic=row.get("bp_diastolic") or 80,
                            spo2=row.get("spo2") or 98,
                            temperature=row.get("temperature") or 37.0,
                            respiratory_rate=row.get("respiratory_rate") or 16,
                        ),
                        patient=patient,
                        eta_minutes=row.get("eta_minutes"),
                    )
                )
            return

        statuses: list[AmbulanceStatus] = ["available", "responding", "responding", "critical", "arrived"]
        for i, aid in enumerate(["A101", "A102", "A103", "A104", "A105"]):
            hospital = random.choice(HOSPITALS)
            route = _make_route(hospital)
            status = statuses[i]
            route_index = 0 if status == "available" else random.randint(0, int(len(route) * 0.4))
            self.ambulances.append(
                Ambulance(
                    id=aid,
                    driver=DRIVER_NAMES[i],
                    status=status,
                    hospital=hospital["name"],
                    route=route,
                    route_index=route_index,
                    speed=random.randint(28, 64),
                    vitals=_new_vitals(),
                    patient=None if status == "available" else _new_patient(),
                    eta_minutes=None if status == "available" else random.randint(3, 18),
                )
            )

    def tick(self) -> list[str]:
        """Advance the simulation by one step. Returns human-readable event strings."""
        events: list[str] = []
        for a in self.ambulances:
            if a.status in ("available", "arrived"):
                continue
            a.route_index = min(a.route_index + 1, len(a.route) - 1)
            a.lat, a.lng = a.route[a.route_index]
            a.speed = max(15, int(_jitter(a.speed, 4)))
            a.eta_minutes = max(0, round((len(a.route) - 1 - a.route_index) * 0.35))
            v = a.vitals
            v.heart_rate = max(58, min(160, int(_jitter(v.heart_rate, 4))))
            v.spo2 = max(85, min(99, int(_jitter(v.spo2, 1))))
            v.temperature = _jitter(v.temperature, 0.15)
            v.bp_systolic = max(85, min(170, int(_jitter(v.bp_systolic, 3))))
            v.bp_diastolic = max(55, min(105, int(_jitter(v.bp_diastolic, 2))))

            if v.heart_rate > 130 and a.status != "critical":
                a.status = "critical"
                events.append(f"{a.id} flagged CRITICAL — heart rate spike")

            if a.route_index >= len(a.route) - 1 and a.status != "arrived":
                a.status = "arrived"
                events.append(f"{a.id} arrived at {a.hospital}")

        # occasionally dispatch an idle unit
        idle = [a for a in self.ambulances if a.status == "available"]
        if idle and random.random() < 0.25:
            a = random.choice(idle)
            hospital = random.choice(HOSPITALS)
            a.route = _make_route(hospital)
            a.route_index = 0
            a.lat, a.lng = a.route[0]
            a.hospital = hospital["name"]
            a.patient = _new_patient()
            a.status = "responding"
            events.append(f"{a.id} dispatched — patient pickup: {a.patient.name}")

        # occasionally recycle an arrived unit back to service
        for a in self.ambulances:
            if a.status == "arrived" and random.random() < 0.08:
                a.status = "available"
                a.patient = None
                a.eta_minutes = None
                events.append(f"{a.id} returned to service")

        return events

    def stats(self) -> dict:
        total = len(self.ambulances)
        available = sum(1 for a in self.ambulances if a.status == "available")
        critical = sum(1 for a in self.ambulances if a.status == "critical")
        etas = [a.eta_minutes for a in self.ambulances if a.eta_minutes is not None]
        avg_response = round(sum(etas) / len(etas)) if etas else 0
        return {
            "total_ambulances": total,
            "available": available,
            "busy": total - available,
            "critical": critical,
            "avg_response_time": avg_response,
            "hospitals_connected": len(HOSPITALS),
            "doctors_online": len(DOCTORS),
            "cases_today": 14,
        }

    def nearest_available(self, lat: float, lng: float, limit: int = 5) -> list[dict]:
        """Available (idle) ambulances sorted by distance from the given
        point, each with the driver's contact number — for the Family
        dashboard's 'nearest available ambulance' finder."""
        idle = [a for a in self.ambulances if a.status == "available"]
        with_distance = [
            {
                "id": a.id,
                "driver": a.driver,
                "phone": a.phone,
                "lat": a.lat,
                "lng": a.lng,
                "distance_km": round(haversine_km(lat, lng, a.lat, a.lng), 1),
            }
            for a in idle
        ]
        with_distance.sort(key=lambda x: x["distance_km"])
        return with_distance[:limit]

    def to_dict(self) -> list[dict]:
        return [a.to_dict() for a in self.ambulances]

    def snapshot_rows(self) -> list[dict]:
        """Flat, DB-column-shaped view of each ambulance's current state, for
        upserting into AmbulanceRecord after every tick."""
        rows = []
        for a in self.ambulances:
            rows.append({
                "id": a.id,
                "driver": a.driver,
                "driver_phone": a.phone,
                "status": a.status,
                "lat": a.lat,
                "lng": a.lng,
                "speed": a.speed,
                "eta_minutes": a.eta_minutes,
                "hospital": a.hospital,
                "patient_name": a.patient.name if a.patient else None,
                "patient_age": a.patient.age if a.patient else None,
                "patient_gender": a.patient.gender if a.patient else None,
                "patient_blood_group": a.patient.blood_group if a.patient else None,
                "patient_history": a.patient.medical_history if a.patient else None,
                "patient_allergies": a.patient.allergies if a.patient else None,
                "heart_rate": a.vitals.heart_rate,
                "bp_systolic": a.vitals.bp_systolic,
                "bp_diastolic": a.vitals.bp_diastolic,
                "spo2": a.vitals.spo2,
                "temperature": a.vitals.temperature,
                "respiratory_rate": a.vitals.respiratory_rate,
            })
        return rows


def ai_summary(a: Ambulance) -> str:
    """Stand-in for the AI Doctor Summary Agent — template-based, no external model."""
    if a.status == "available":
        return "Unit idle and ready for dispatch."
    hr_note = "Heart rate elevated." if a.vitals.heart_rate > 110 else "Heart rate within acceptable range."
    spo2_note = "Oxygen saturation low — monitor closely." if a.vitals.spo2 < 92 else "Oxygen saturation stable."
    crit = "Patient flagged critical; hospital pre-alerted." if a.status == "critical" else "Patient condition stable during transport."
    return f"{crit} {hr_note} {spo2_note}"


def family_message(a: Ambulance) -> str:
    """Stand-in for the AI Family Communication Agent."""
    if a.status == "available" or a.eta_minutes is None:
        return "No active transport at this time."
    condition = "being closely monitored" if a.status == "critical" else "stable"
    return f"Patient is {condition}. The ambulance is expected to reach {a.hospital} in {a.eta_minutes} minutes. Doctors have been informed."


def new_event_id() -> str:
    return uuid.uuid4().hex[:8]


def timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S")
