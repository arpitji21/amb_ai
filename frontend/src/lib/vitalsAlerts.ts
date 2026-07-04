import type { Vitals } from '@/types';

export interface VitalAlert {
  level: 'stable' | 'warning' | 'critical';
  label: string;
}

/** Simulated AI Monitoring Agent: threshold-based, no external model. */
export function evaluateVitals(v: Vitals): VitalAlert[] {
  const alerts: VitalAlert[] = [];
  if (v.heartRate > 120) alerts.push({ level: 'critical', label: 'High Heart Rate' });
  else if (v.heartRate < 55) alerts.push({ level: 'warning', label: 'Low Heart Rate' });
  if (v.spo2 < 90) alerts.push({ level: 'critical', label: 'Critical Oxygen Alert' });
  else if (v.spo2 < 94) alerts.push({ level: 'warning', label: 'Low Oxygen' });
  if (v.bpSystolic < 90) alerts.push({ level: 'warning', label: 'Low Blood Pressure' });
  if (v.temperature > 39) alerts.push({ level: 'critical', label: 'High Fever Alert' });
  if (!alerts.length) alerts.push({ level: 'stable', label: 'Stable' });
  return alerts;
}

export const ALERT_STYLES: Record<VitalAlert['level'], string> = {
  stable: 'bg-alert-green-soft text-alert-green',
  warning: 'bg-alert-amber-soft text-alert-amber',
  critical: 'bg-alert-red-soft text-alert-red',
};
