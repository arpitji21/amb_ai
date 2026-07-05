from datetime import datetime
from typing import Optional, List, Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ============================================================
# Roles
# ============================================================

Role = Literal[
    "ems_command",
    "ambulance_staff",
    "doctor",
    "family",
]

# ============================================================
# Authentication
# ============================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

    role: Role

    hospital: Optional[str] = None

    ambulance_id: Optional[str] = None

    doctor_id: Optional[str] = None

    family_patient_id: Optional[str] = None


from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    hospital: Optional[str] = None
    created_at: Optional[datetime] = None

    ambulance_id: Optional[int] = None
    doctor_id: Optional[int] = None
    family_patient_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ============================================================
# Ambulance
# ============================================================

class AmbulanceCreate(BaseModel):

    id: str

    driver: str

    driver_phone: Optional[str] = None

    lat: float

    lng: float


class AmbulanceOut(BaseModel):

    id: str

    driver: str

    driver_phone: Optional[str]

    status: str

    lat: float

    lng: float

    speed: int

    eta_minutes: Optional[int]

    hospital: Optional[str]

    current_patient_id: Optional[str]

    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Doctor
# ============================================================

class DoctorCreate(BaseModel):

    name: str

    specialty: str

    hospital: str


class DoctorOut(BaseModel):

    id: str

    name: str

    specialty: str

    hospital: str

    status: str

    current_patient_id: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Hospital
# ============================================================

class HospitalOut(BaseModel):

    id: str

    name: str

    lat: float

    lng: float

    available_beds: int

    available_icu_beds: int

    emergency_capacity: int

    load: str

    specialties: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Patient
# ============================================================

class PatientCreate(BaseModel):

    name: str

    age: int

    gender: str

    blood_group: str

    phone_number: Optional[str] = None

    emergency_contact: Optional[str] = None

    medical_history: Optional[str] = None

    allergies: Optional[str] = None

    symptoms: Optional[str] = None

    pickup_location: Optional[str] = None

    destination: Optional[str] = None


class PatientUpdate(BaseModel):

    name: Optional[str] = None

    age: Optional[int] = None

    gender: Optional[str] = None

    phone_number: Optional[str] = None

    medical_history: Optional[str] = None

    allergies: Optional[str] = None

    symptoms: Optional[str] = None

    severity: Optional[str] = None

    status: Optional[str] = None

    destination: Optional[str] = None


class PatientOut(BaseModel):

    id: str

    name: str

    age: int

    gender: str

    blood_group: str

    phone_number: Optional[str]

    emergency_contact: Optional[str]

    medical_history: Optional[str]

    allergies: Optional[str]

    symptoms: Optional[str]

    severity: str

    priority: int

    status: str

    pickup_location: Optional[str]

    destination: Optional[str]

    assigned_ambulance_id: Optional[str]

    assigned_doctor_id: Optional[str]

    assigned_hospital_id: Optional[str]

    eta_minutes: Optional[int]

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Vitals
# ============================================================

class VitalsCreate(BaseModel):

    patient_id: str

    heart_rate: int

    spo2: int

    bp_systolic: int

    bp_diastolic: int

    respiratory_rate: int

    temperature: float


class VitalsOut(VitalsCreate):

    id: str

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Reports
# ============================================================

class ReportOut(BaseModel):

    id: str

    patient_id: str

    generated_by: str

    hospital: Optional[str]

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# Notifications
# ============================================================

class NotificationCreate(BaseModel):

    receiver_id: str

    receiver_role: str

    message: str

    priority: str = "normal"


class NotificationOut(NotificationCreate):

    id: str

    is_read: bool

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# AI
# ============================================================

class AIRequest(BaseModel):

    patient_id: str


class AIResponse(BaseModel):

    severity: str

    risk_score: float

    recommendation: str

    summary: str


# ============================================================
# Dashboard
# ============================================================

class DashboardStats(BaseModel):

    total_patients: int

    active_cases: int

    available_ambulances: int

    busy_ambulances: int

    available_doctors: int

    busy_doctors: int

    available_hospitals: int


# ============================================================
# WebSocket
# ============================================================

class LiveVitals(BaseModel):

    patient_id: str

    heart_rate: int

    spo2: int

    bp_systolic: int

    bp_diastolic: int

    respiratory_rate: int

    temperature: float

    timestamp: datetime


class AmbulanceLocation(BaseModel):

    ambulance_id: str

    lat: float

    lng: float

    speed: int

    eta_minutes: int

    timestamp: datetime


# ============================================================
# Generic API Response
# ============================================================

class MessageResponse(BaseModel):

    success: bool = True

    message: str