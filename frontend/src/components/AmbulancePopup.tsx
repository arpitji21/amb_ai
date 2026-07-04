import type { Ambulance, AmbulanceStatus } from '@/types';

const STATUS_LABEL: Record<AmbulanceStatus, string> = {
  available: 'Available',
  responding: 'Responding',
  critical: 'Critical Patient',
  arrived: 'At Hospital',
};
const STATUS_COLOR: Record<AmbulanceStatus, string> = {
  available: '#16A34A',
  responding: '#D97706',
  critical: '#DC2626',
  arrived: '#0F5C8C',
};

/** Simple template-based stand-in for the AI Doctor Summary Agent. */
function aiSummary(a: Ambulance): string {
  if (a.status === 'available') return 'Unit idle and ready for dispatch.';
  const hrNote = a.vitals.heartRate > 110 ? 'Heart rate elevated.' : 'Heart rate within acceptable range.';
  const spo2Note = a.vitals.spo2 < 92 ? 'Oxygen saturation low — monitor closely.' : 'Oxygen saturation stable.';
  const crit = a.status === 'critical' ? 'Patient flagged critical; hospital pre-alerted.' : 'Patient condition stable during transport.';
  return `${crit} ${hrNote} ${spo2Note}`;
}

export default function AmbulancePopup({ ambulance: a }: { ambulance: Ambulance }) {
  const color = STATUS_COLOR[a.status];
  return (
    <div className="font-body min-w-[210px]">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono font-bold text-[13px] text-primary">{a.id}</span>
        <span
          className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}
        >
          {STATUS_LABEL[a.status]}
        </span>
      </div>
      <Row label="Driver" value={a.driver} />
      <Row label="Patient" value={a.patient?.name ?? '—'} />
      {a.patient && (
        <>
          <Row label="Age" value={String(a.patient.age)} />
          <Row label="Heart Rate" value={`${a.vitals.heartRate} bpm`} />
          <Row label="Blood Pressure" value={`${a.vitals.bpSystolic}/${a.vitals.bpDiastolic}`} />
          <Row label="SpO₂" value={`${a.vitals.spo2}%`} />
          <Row label="Temperature" value={`${a.vitals.temperature}°C`} />
        </>
      )}
      <Row label="ETA" value={a.etaMinutes != null ? `${a.etaMinutes} min` : '—'} />
      <Row label="Hospital" value={a.hospital} />
      <div className="mt-2 p-2 bg-teal-soft rounded-[9px] text-[11px] text-[#0C6B60] leading-snug">
        🧠 <b>AI Summary:</b> {aiSummary(a)}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11.5px] py-0.5 text-muted">
      <span>{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}
