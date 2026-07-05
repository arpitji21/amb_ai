import AgentFeed from "@/components/AgentFeed";
import { generateAgentEntry, type AgentEntry } from "@/lib/agentFeed";
import { useEffect, useState } from 'react';
import { Stethoscope, Clock, Building2, Sparkles, ClipboardCheck } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import VitalsChart from '@/components/VitalsChart';
import LiveVitalsMonitor from '@/components/LiveVitalsMonitor';
import { useAmbulanceSocket } from '@/lib/useAmbulanceSocket';
import { evaluateVitals, ALERT_STYLES } from '@/lib/vitalsAlerts';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import type { PatientRegistration } from '@/types';

const CHECKLIST_ITEMS = ['Prepare Oxygen', 'Prepare ICU Bed', 'Prepare Trauma Team', 'Prepare ECG', 'Prepare Emergency Room'];

export default function DoctorDashboard() {
  const { ambulances, connected } = useAmbulanceSocket();
  const { user } = useAuth();
  const incoming = ambulances.filter((a) => a.status !== 'available');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<{ t: number; hr: number; spo2: number }[]>([]);
  const [registeredPatient, setRegisteredPatient] = useState<PatientRegistration | null>(null);
  const [agentEntries, setAgentEntries] = useState<AgentEntry[]>([]);

  useEffect(() => {
    if (!selectedId && incoming.length) setSelectedId(incoming[0].id);
  }, [incoming, selectedId]);

  const ambulance = ambulances.find((a) => a.id === selectedId);

  useEffect(() => {
    if (!ambulance) return;
    const id = setInterval(() => {
      setHistory((prev) =>
        [...prev, { t: Date.now(), hr: ambulance.vitals.heartRate, spo2: ambulance.vitals.spo2 }].slice(-30)
      );
    }, 1000);
    return () => clearInterval(id);
  }, [ambulance]);

  useEffect(() => {
    if (!ambulance) return;
  
    const id = setInterval(() => {
      const entry = generateAgentEntry(ambulance);
  
      setAgentEntries((prev) => [entry, ...prev].slice(0, 20));
    }, 4000);
  
    return () => clearInterval(id);
  }, [ambulance]);

  useEffect(() => {
    setHistory([]);
    setChecklist({});
    setRegisteredPatient(null);
    setAgentEntries([]);
    if (!selectedId) return;
    api
      .get(`/api/patients/by-ambulance/${selectedId}`)
      .then((res) => setRegisteredPatient(res.data ?? null))
      .catch(() => setRegisteredPatient(null));
  }, [selectedId]);

  const alerts = ambulance ? evaluateVitals(ambulance.vitals) : [];
  const aiSummary = ambulance
    ? ambulance.status === 'critical'
      ? 'Patient flagged critical; hospital pre-alerted. Continue monitoring during transport.'
      : `Patient is currently ${ambulance.status === 'arrived' ? 'stable and arriving' : 'stable in transit'}. Heart rate and oxygen saturation within reasonable range. Recommend continued observation on arrival.`
    : '';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F7FA]">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        <TopBar connected={connected} />
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Incoming patients list */}
          <div className="bg-white border border-line rounded-2xl shadow-card p-4 h-fit">
            <h2 className="font-display font-extrabold text-sm mb-1 flex items-center gap-2">
              <Stethoscope size={16} className="text-primary" /> Incoming Patients
            </h2>
            <p className="text-[11px] text-muted mb-3">{user?.hospital ?? 'All hospitals'}</p>
            <div className="flex flex-col gap-1.5">
              {incoming.length === 0 && <p className="text-[12px] text-muted">No active transports right now.</p>}
              {incoming.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`text-left px-3 py-2.5 rounded-[10px] border transition-colors ${
                    selectedId === a.id ? 'border-primary bg-primary-soft' : 'border-line hover:bg-primary-soft/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[12.5px]">{a.id}</span>
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                        a.status === 'critical' ? 'bg-alert-red-soft text-alert-red' : 'bg-alert-amber-soft text-alert-amber'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-muted mt-0.5">{a.patient?.name ?? '—'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {ambulance ? (
            <div className="flex flex-col gap-4 min-w-0">
              <div className="bg-white border border-line rounded-2xl shadow-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="font-display font-extrabold text-sm">Patient Information</h2>
                  <div className="flex items-center gap-3 text-[11.5px] text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> ETA {ambulance.etaMinutes ?? '—'} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 size={13} /> {ambulance.hospital}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                  <Info label="Name" value={registeredPatient?.name ?? ambulance.patient?.name ?? '—'} />
                  <Info label="Age" value={String(registeredPatient?.age ?? ambulance.patient?.age ?? '—')} />
                  <Info label="Gender" value={registeredPatient?.gender ?? ambulance.patient?.gender ?? '—'} />
                  <Info label="Blood Group" value={registeredPatient?.blood_group ?? ambulance.patient?.bloodGroup ?? '—'} />
                  <Info label="History" value={registeredPatient?.medical_history ?? ambulance.patient?.medicalHistory ?? '—'} span2 />
                  <Info label="Allergies" value={registeredPatient?.allergies ?? ambulance.patient?.allergies ?? '—'} span2 />
                </div>
              </div>

              <LiveVitalsMonitor vitals={ambulance.vitals} />
              <AgentFeed entries={agentEntries} />

              <div className="bg-white border border-line rounded-2xl shadow-card p-4">
                <h2 className="font-display font-extrabold text-sm mb-3">Vitals Trend</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ChartBlock title="Heart Rate" color="#DC2626">
                    <VitalsChart data={history.map((h) => ({ t: h.t, value: h.hr }))} dataKey="value" color="#DC2626" />
                  </ChartBlock>
                  <ChartBlock title="SpO₂" color="#0F5C8C">
                    <VitalsChart data={history.map((h) => ({ t: h.t, value: h.spo2 }))} dataKey="value" color="#0F5C8C" domain={[80, 100]} />
                  </ChartBlock>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-line rounded-2xl shadow-card p-4">
                  <h2 className="font-display font-extrabold text-sm mb-3">Emergency Alerts</h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {alerts.map((a) => (
                      <span key={a.label} className={`text-xs font-bold px-3 py-1.5 rounded-full ${ALERT_STYLES[a.level]}`}>
                        {a.label}
                      </span>
                    ))}
                  </div>
                  <div className="p-3 bg-teal-soft rounded-[10px] text-[12.5px] text-[#0C6B60] leading-snug flex gap-2">
                    <Sparkles size={15} className="shrink-0 mt-0.5" /> {aiSummary}
                  </div>
                </div>

                <div className="bg-white border border-line rounded-2xl shadow-card p-4">
                  <h2 className="font-display font-extrabold text-sm mb-3 flex items-center gap-2">
                    <ClipboardCheck size={16} className="text-primary" /> Preparation Checklist
                  </h2>
                  <div className="flex flex-col gap-2">
                    {CHECKLIST_ITEMS.map((item) => (
                      <label key={item} className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!checklist[item]}
                          onChange={(e) => setChecklist((prev) => ({ ...prev, [item]: e.target.checked }))}
                          className="accent-primary w-3.5 h-3.5"
                        />
                        <span className={checklist[item] ? 'line-through text-muted' : ''}>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-line rounded-2xl shadow-card p-4">
                <h2 className="font-display font-extrabold text-sm mb-3">Journey Timeline</h2>
                <div className="flex flex-wrap gap-2 text-[11.5px]">
                  {['Emergency Call', 'Ambulance Dispatched', 'Patient Pickup', 'Vitals Started', 'Doctor Connected', 'Hospital Notified', 'Patient Arrived'].map(
                    (step, i, arr) => (
                      <div key={step} className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full font-medium ${
                            i <= 4 || ambulance.status === 'arrived' ? 'bg-primary-soft text-primary' : 'bg-[#F0F3F6] text-muted'
                          }`}
                        >
                          {step}
                        </span>
                        {i < arr.length - 1 && <span className="text-muted">→</span>}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-line rounded-2xl shadow-card p-8 text-center text-muted text-sm">
              Select an incoming patient to view details.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Info({ label, value, span2 }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <div className="text-[10px] text-muted uppercase tracking-wide">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ChartBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="border border-line rounded-[12px] p-2.5">
      <div className="text-[10.5px] font-semibold mb-1" style={{ color }}>
        {title}
      </div>
      {children}
    </div>
  );
}
