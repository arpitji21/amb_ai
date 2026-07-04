import { useState } from 'react';
import { Heart, Clock, Building2, MapPin } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import AmbulanceMap from '@/components/AmbulanceMap';
import NearbyAmbulances from '@/components/NearbyAmbulances';
import { useAmbulanceSocket } from '@/lib/useAmbulanceSocket';
import { HOSPITALS } from '@/lib/mockData';

const AMBULANCE_IDS = ['A101', 'A102', 'A103', 'A104', 'A105'];

const TIMELINE_STEPS = ['Ambulance dispatched', 'Patient picked up', 'Doctor reviewing', 'Hospital informed'];

export default function FamilyDashboard() {
  const { ambulances, connected } = useAmbulanceSocket();
  const [selectedId, setSelectedId] = useState('A101');
  const ambulance = ambulances.find((a) => a.id === selectedId);

  const condition = !ambulance
    ? '—'
    : ambulance.status === 'critical'
    ? 'Being closely monitored'
    : ambulance.status === 'available'
    ? 'No active transport'
    : 'Stable';

  const timeline = ambulance
    ? [...TIMELINE_STEPS, ambulance.status === 'arrived' ? 'Arrived at hospital' : `Arriving in ${ambulance.etaMinutes ?? '—'} minutes`]
    : TIMELINE_STEPS;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F7FA]">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        <TopBar connected={connected} />
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 max-w-3xl mx-auto w-full">
          <div className="bg-white border border-line rounded-2xl shadow-card p-4 flex items-center justify-between">
            <div>
              <h1 className="font-display font-extrabold text-base">Tracking</h1>
              <p className="text-[11.5px] text-muted mt-0.5">Live updates on your loved one's transport</p>
            </div>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs border border-line rounded-[8px] px-2.5 py-2 font-mono"
            >
              {AMBULANCE_IDS.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <NearbyAmbulances ambulances={ambulances} />

          <div className="bg-white border border-line rounded-2xl shadow-card p-5">
            <div className="text-[11px] text-muted uppercase tracking-wide mb-1">Patient</div>
            <div className="font-display text-lg font-extrabold mb-4">{ambulance?.patient?.name ?? 'No patient linked'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatBlock icon={Heart} label="Condition" value={condition} accent={ambulance?.status === 'critical' ? 'red' : 'green'} />
              <StatBlock icon={Clock} label="ETA" value={ambulance?.etaMinutes != null ? `${ambulance.etaMinutes} min` : '—'} />
              <StatBlock icon={Building2} label="Hospital" value={ambulance?.hospital ?? '—'} />
            </div>
          </div>

          <div className="bg-white border border-line rounded-2xl shadow-card p-4">
            <h2 className="font-display font-extrabold text-sm mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> Live Location
            </h2>
            <div className="h-[320px]">
              {ambulance ? (
                <AmbulanceMap ambulances={[ambulance]} hospitals={HOSPITALS.filter((h) => h.name === ambulance.hospital)} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted text-sm">No active transport to display.</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-line rounded-2xl shadow-card p-4">
            <h2 className="font-display font-extrabold text-sm mb-3">Timeline</h2>
            <div className="flex flex-col gap-2.5">
              {timeline.map((step, i) => (
                <div key={step} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className={`w-2 h-2 rounded-full ${i === timeline.length - 1 ? 'bg-teal' : 'bg-primary'}`} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  accent?: 'red' | 'green';
}) {
  const color = accent === 'red' ? 'text-alert-red' : accent === 'green' ? 'text-alert-green' : 'text-primary';
  return (
    <div className="border border-line rounded-[12px] p-3">
      <div className={`flex items-center gap-1.5 text-[10.5px] text-muted mb-1`}>
        <Icon size={13} /> {label}
      </div>
      <div className={`font-semibold text-[13px] ${color}`}>{value}</div>
    </div>
  );
}
