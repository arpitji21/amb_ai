import EcgWave from './EcgWave';
import type { Vitals } from '@/types';

function severityColor(value: number, warn: [number, number], critical: [number, number]) {
  if (value < critical[0] || value > critical[1]) return '#FF5A5F';
  if (value < warn[0] || value > warn[1]) return '#FBBF24';
  return '#34D399';
}

export default function LiveVitalsMonitor({ vitals, accuracy = 99.2 }: { vitals: Vitals; accuracy?: number }) {
  const map = Math.round((vitals.bpSystolic + 2 * vitals.bpDiastolic) / 3);

  const readouts = [
    { label: 'HEART RATE', value: vitals.heartRate, unit: 'bpm', color: severityColor(vitals.heartRate, [60, 110], [50, 130]) },
    { label: 'SPO₂', value: vitals.spo2, unit: '%', color: severityColor(vitals.spo2, [94, 100], [90, 100]) },
    {
      label: 'NIBP',
      value: `${vitals.bpSystolic}/${vitals.bpDiastolic}`,
      unit: 'mmHg',
      color: severityColor(vitals.bpSystolic, [90, 140], [80, 160]),
    },
    { label: 'RESP. RATE', value: vitals.respiratoryRate, unit: 'br/min', color: severityColor(vitals.respiratoryRate, [12, 22], [8, 28]) },
    { label: 'TEMP', value: vitals.temperature, unit: '°C', color: severityColor(vitals.temperature, [36, 38], [35, 39.5]) },
    { label: 'MAP', value: map, unit: 'mmHg', color: severityColor(map, [70, 100], [60, 110]) },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-[#232B36]" style={{ background: '#11151C' }}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] live-dot" />
        <span className="text-[11px] font-mono tracking-wider text-[#7C8798]">
          LARK AI VITALS MONITOR — {accuracy.toFixed(2)}% ACCURACY
        </span>
      </div>

      <div className="mx-4 mb-3 rounded-[10px] border border-[#232B36] bg-black/40 px-3 pt-3 pb-1">
        <div className="text-[10px] font-mono text-[#34D399] mb-1">LEAD II</div>
        <EcgWave color="#FF5A5F" height={130} />
      </div>

      <div className="grid grid-cols-3 gap-2.5 px-4 pb-4">
        {readouts.map((r) => (
          <div key={r.label} className="rounded-[10px] border border-[#232B36] px-2.5 py-2.5" style={{ background: '#151B24' }}>
            <div className="text-[9.5px] font-mono tracking-wide text-[#7C8798] mb-1">{r.label}</div>
            <div className="font-mono text-xl font-bold leading-none" style={{ color: r.color }}>
              {r.value}
              <span className="text-[10px] font-normal ml-1 text-[#7C8798]">{r.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
