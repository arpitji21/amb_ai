import { useEffect, useRef, useState, useCallback } from 'react';
import type { Ambulance, ActivityEvent, DashboardStats } from '@/types';
import { seedAmbulances, dispatchAmbulance, jitter, pick, HOSPITALS } from './mockData';
import api from './api';

const WS_URL = import.meta.env.VITE_WS_URL as string | undefined;

/** The FastAPI backend serializes dataclasses as snake_case with a nested
 * `route` of [lat, lng] tuples and separate `vitals`/`patient` objects.
 * This normalizes that into the frontend's Ambulance shape. */
function fromBackend(raw: any): Ambulance {
  return {
    id: raw.id,
    driver: raw.driver,
    phone: raw.phone,
    status: raw.status,
    lat: raw.lat,
    lng: raw.lng,
    speed: raw.speed,
    etaMinutes: raw.eta_minutes,
    hospital: raw.hospital,
    patient: raw.patient
      ? {
          name: raw.patient.name,
          age: raw.patient.age,
          gender: raw.patient.gender,
          bloodGroup: raw.patient.blood_group,
          medicalHistory: raw.patient.medical_history,
          allergies: raw.patient.allergies,
        }
      : null,
    vitals: {
      heartRate: raw.vitals.heart_rate,
      bpSystolic: raw.vitals.bp_systolic,
      bpDiastolic: raw.vitals.bp_diastolic,
      spo2: raw.vitals.spo2,
      temperature: raw.vitals.temperature,
      respiratoryRate: raw.vitals.respiratory_rate,
    },
    route: raw.route,
    routeIndex: raw.route_index,
  };
}

function nowStamp() {
  return new Date().toLocaleTimeString('en-GB');
}

function computeStats(ambulances: Ambulance[]): DashboardStats {
  const available = ambulances.filter((a) => a.status === 'available').length;
  const critical = ambulances.filter((a) => a.status === 'critical').length;
  const busy = ambulances.length - available;
  const etas = ambulances.map((a) => a.etaMinutes).filter((v): v is number => v != null);
  const avgResponseTime = etas.length ? Math.round(etas.reduce((s, v) => s + v, 0) / etas.length) : 0;
  return {
    totalAmbulances: ambulances.length,
    available,
    busy,
    critical,
    avgResponseTime,
    hospitalsConnected: HOSPITALS.length,
    doctorsOnline: 3,
    casesToday: 14,
  };
}

/**
 * Live ambulance feed for the EMS Command Center.
 *
 * If `VITE_WS_URL` points at the FastAPI backend's `/ws/ambulances` endpoint
 * and the socket connects, live updates come from the server (real GPS/vitals
 * simulation). Otherwise this hook runs the same simulation logic locally in
 * the browser, so the dashboard is always populated with live-feeling data.
 */
export function useAmbulanceSocket() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>(() => seedAmbulances());
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const logEvent = useCallback((text: string) => {
    setEvents((prev) => [{ id: crypto.randomUUID(), time: nowStamp(), text }, ...prev].slice(0, 20));
  }, []);

  // --- Local simulation fallback -------------------------------------
  useEffect(() => {
    if (WS_URL) return; // real backend will drive state instead

    logEvent('Command center initialized (local simulation)');
    logEvent('5 units online, fleet nominal');

    const tick = setInterval(() => {
      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.status === 'available' || a.status === 'arrived') return a;
          const routeIndex = Math.min(a.routeIndex + 1, a.route.length - 1);
          const [lat, lng] = a.route[routeIndex];
          const heartRate = Math.max(58, Math.min(160, Math.round(jitter(a.vitals.heartRate, 4))));
          const next: Ambulance = {
            ...a,
            routeIndex,
            lat,
            lng,
            speed: Math.max(15, Math.round(jitter(a.speed, 4))),
            etaMinutes: Math.max(0, Math.round((a.route.length - 1 - routeIndex) * 0.35)),
            vitals: {
              ...a.vitals,
              heartRate,
              spo2: Math.max(85, Math.min(99, Math.round(jitter(a.vitals.spo2, 1)))),
              temperature: jitter(a.vitals.temperature, 0.15),
              bpSystolic: Math.max(85, Math.min(170, Math.round(jitter(a.vitals.bpSystolic, 3)))),
              bpDiastolic: Math.max(55, Math.min(105, Math.round(jitter(a.vitals.bpDiastolic, 2)))),
            },
            status: heartRate > 130 ? 'critical' : a.status,
          };
          if (heartRate > 130 && a.status !== 'critical') {
            logEvent(`${a.id} flagged CRITICAL — heart rate spike`);
          }
          if (routeIndex >= a.route.length - 1 && a.status !== 'arrived') {
            next.status = 'arrived';
            logEvent(`${a.id} arrived at ${a.hospital}`);
          }
          return next;
        })
      );
    }, 2000);

    const dispatchTimer = setInterval(() => {
      setAmbulances((prev) => {
        const idle = prev.filter((a) => a.status === 'available');
        if (!idle.length || Math.random() > 0.5) return prev;
        const target = pick(idle);
        logEvent(`${target.id} dispatched for pickup`);
        return prev.map((a) => (a.id === target.id ? dispatchAmbulance(a) : a));
      });
    }, 6000);

    const recycleTimer = setInterval(() => {
      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.status === 'arrived' && Math.random() < 0.15) {
            logEvent(`${a.id} returned to service`);
            return { ...a, status: 'available', patient: null, etaMinutes: null };
          }
          return a;
        })
      );
    }, 9000);

    return () => {
      clearInterval(tick);
      clearInterval(dispatchTimer);
      clearInterval(recycleTimer);
    };
  }, [logEvent]);

  // --- Real WebSocket connection ---------------------------------------
  useEffect(() => {
    if (!WS_URL) return;

    // Seed the timeline with persisted history so a refresh doesn't lose it.
    api
      .get('/api/events')
      .then((res) => {
        const rows = res.data as { id: string; text: string; time: string }[];
        setEvents(rows.map((r) => ({ id: r.id, time: r.time, text: r.text })));
      })
      .catch(() => {});

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      logEvent('Connected to LEIP backend — live feed active');
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data);
        if (payload.type === 'ambulances' && Array.isArray(payload.data)) {
          setAmbulances(payload.data.map(fromBackend));
        } else if (payload.type === 'event' && payload.text) {
          logEvent(payload.text);
        }
      } catch {
        // ignore malformed frames
      }
    };

    return () => ws.close();
  }, [logEvent]);

  return { ambulances, events, stats: computeStats(ambulances), connected: WS_URL ? connected : true };
}
