export type Role = 'ems_command' | 'ambulance_staff' | 'doctor' | 'family';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  hospital?: string | null;
}

export interface PatientRegistration {
  ambulance_id: string;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  phone_number?: string;
  emergency_contact?: string;
  medical_history?: string;
  allergies?: string;
}

export type AmbulanceStatus = 'available' | 'responding' | 'critical' | 'arrived';


export interface Vitals {
  heartRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  spo2: number;
  temperature: number;
  respiratoryRate: number;
}

export interface Ambulance {
  id: string;
  driver: string;
  phone: string;
  status: AmbulanceStatus;
  lat: number;
  lng: number;
  speed: number;
  etaMinutes: number | null;
  hospital: string;
  patient: Patient | null;
  vitals: Vitals;
  route: [number, number][];
  routeIndex: number;
}

export interface Patient {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  medicalHistory: string;
  allergies: string;
}

export interface Hospital {
  name: string;
  lat: number;
  lng: number;
  load: 'Low' | 'Moderate' | 'High';
}

export interface ActivityEvent {
  id: string;
  time: string;
  text: string;
}

export interface DashboardStats {
  totalAmbulances: number;
  available: number;
  busy: number;
  critical: number;
  avgResponseTime: number;
  hospitalsConnected: number;
  doctorsOnline: number;
  casesToday: number;
}
