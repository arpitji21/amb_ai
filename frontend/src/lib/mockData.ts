import type { Ambulance, Hospital, Patient, AmbulanceStatus } from '@/types';

export const COMMAND_CENTER: [number, number] = [12.9716, 77.5946];

export const HOSPITALS: Hospital[] = [
  { name: 'St. Xavier General', lat: 12.9789, lng: 77.6089, load: 'Moderate' },
  { name: 'Lakeview Trauma Center', lat: 12.9611, lng: 77.5900, load: 'High' },
  { name: 'Northgate Medical', lat: 12.9917, lng: 77.5721, load: 'Low' },
];

const DRIVER_NAMES = ['R. Sharma', 'A. Menon', 'K. Iyer', 'T. Fernandes', 'P. Naidu'];
const DRIVER_PHONES = ['+91 98450 11223', '+91 98860 33445', '+91 99000 55667', '+91 97400 77889', '+91 90080 99001'];
const PATIENT_NAMES = ['Arjun Rao', 'Meera Nair', 'Vikram Sethi', 'Fatima Sheikh', 'Rohan Kapoor', 'Nisha Verma'];
const HISTORY = ['Hypertension', 'No prior conditions', 'Type 2 Diabetes', 'Asthma', 'Post-cardiac surgery'];
const ALLERGIES = ['None known', 'Penicillin', 'Sulfa drugs', 'None known'];
const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-'];

export function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function jitter(value: number, amount: number) {
  return Math.round((value + rand(-amount, amount)) * 10) / 10;
}

/** Generates a quadratic-bezier route from a random point near the command
 * center to the given hospital, so markers move along a believable path. */
export function makeRoute(hospital: Hospital): [number, number][] {
  const start: [number, number] = [COMMAND_CENTER[0] + rand(-0.05, 0.05), COMMAND_CENTER[1] + rand(-0.05, 0.05)];
  const end: [number, number] = [hospital.lat, hospital.lng];
  const steps = 40;
  const points: [number, number][] = [];
  const midLat = (start[0] + end[0]) / 2 + rand(-0.01, 0.01);
  const midLng = (start[1] + end[1]) / 2 + rand(-0.01, 0.01);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * midLat + t ** 2 * end[0];
    const lng = (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * midLng + t ** 2 * end[1];
    points.push([lat, lng]);
  }
  return points;
}

function newPatient(): Patient {
  return {
    name: pick(PATIENT_NAMES),
    age: Math.floor(rand(19, 78)),
    gender: pick(['Male', 'Female', 'Other']),
    bloodGroup: pick(BLOOD_GROUPS),
    medicalHistory: pick(HISTORY),
    allergies: pick(ALLERGIES),
  };
}

export function seedAmbulances(): Ambulance[] {
  const ids = ['A101', 'A102', 'A103', 'A104', 'A105'];
  const statuses: AmbulanceStatus[] = ['available', 'responding', 'responding', 'critical', 'arrived'];
  return ids.map((id, i) => {
    const hospital = pick(HOSPITALS);
    const route = makeRoute(hospital);
    const status = statuses[i];
    const routeIndex = status === 'available' ? 0 : Math.floor(rand(0, route.length * 0.4));
    const [lat, lng] = route[routeIndex];
    return {
      id,
      driver: DRIVER_NAMES[i],
      phone: DRIVER_PHONES[i],
      status,
      lat,
      lng,
      speed: Math.floor(rand(28, 64)),
      etaMinutes: status === 'available' ? null : Math.floor(rand(3, 18)),
      hospital: hospital.name,
      patient: status === 'available' ? null : newPatient(),
      vitals: {
        heartRate: Math.floor(rand(70, 125)),
        bpSystolic: Math.floor(rand(100, 150)),
        bpDiastolic: Math.floor(rand(65, 95)),
        spo2: Math.floor(rand(90, 99)),
        temperature: jitter(37.1, 1.2),
        respiratoryRate: Math.floor(rand(14, 24)),
      },
      route,
      routeIndex,
    };
  });
}

export function dispatchAmbulance(a: Ambulance): Ambulance {
  const hospital = pick(HOSPITALS);
  const route = makeRoute(hospital);
  return {
    ...a,
    status: 'responding',
    hospital: hospital.name,
    patient: newPatient(),
    route,
    routeIndex: 0,
  };
}
