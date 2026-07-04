import type { Ambulance } from '@/types';
import { evaluateVitals } from './vitalsAlerts';

export interface AgentEntry {
  id: string;
  agent: string;
  badge: 'ASSESSING' | 'MONITORING' | 'ALERT' | 'STABLE';
  text: string;
  time: string;
}

function stamp() {
  return new Date().toLocaleTimeString('en-GB');
}

const IMPRESSIONS = [
  'possible ACS',
  'probable STEMI',
  'stable presentation',
  'suspected hypovolemia',
  'respiratory distress pattern',
];

/** Randomly picks which of the three simulated agents reports next, and
 * builds a message consistent with the ambulance's current vitals. */
export function generateAgentEntry(a: Ambulance): AgentEntry {
  const alerts = evaluateVitals(a.vitals);
  const worst = alerts.find((x) => x.level === 'critical') ?? alerts.find((x) => x.level === 'warning') ?? alerts[0];
  const roll = Math.random();

  if (roll < 0.4) {
    return {
      id: crypto.randomUUID(),
      agent: 'Vitals Monitoring Agent',
      badge: worst.level === 'critical' ? 'ALERT' : worst.level === 'warning' ? 'MONITORING' : 'STABLE',
      text:
        worst.level === 'stable'
          ? `HR ${a.vitals.heartRate} bpm, SpO₂ ${a.vitals.spo2}% — within normal limits.`
          : `${worst.label} detected — HR ${a.vitals.heartRate} bpm, SpO₂ ${a.vitals.spo2}%.`,
      time: stamp(),
    };
  }

  if (roll < 0.75) {
    const confidence = Math.round(72 + Math.random() * 24);
    const impression = a.status === 'critical' ? IMPRESSIONS[1] : IMPRESSIONS[Math.floor(Math.random() * IMPRESSIONS.length)];
    return {
      id: crypto.randomUUID(),
      agent: 'Triage & Severity Agent',
      badge: 'ASSESSING',
      text: `Reclassifying working impression: ${impression} — confidence ${confidence}%.`,
      time: stamp(),
    };
  }

  return {
    id: crypto.randomUUID(),
    agent: 'AI Doctor Summary Agent',
    badge: a.status === 'critical' ? 'ALERT' : 'STABLE',
    text:
      a.status === 'critical'
        ? 'Drafting handoff summary — flagging critical status for receiving physician.'
        : 'Patient summary updated for hospital handoff — condition stable.',
    time: stamp(),
  };
}
