import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, FileText, BellRing, Sparkles, CheckCircle2, Activity } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import VitalsChart from '@/components/VitalsChart';
import LiveVitalsMonitor from '@/components/LiveVitalsMonitor';
import AgentFeed from '@/components/AgentFeed';
import { useAmbulanceSocket } from '@/lib/useAmbulanceSocket';
import { generateAgentEntry, type AgentEntry } from '@/lib/agentFeed';
import api from '@/lib/api';
import type { PatientRegistration } from '@/types';

const AMBULANCE_IDS = ['A101', 'A102', 'A103', 'A104', 'A105'];
const HISTORY_LEN = 30;

export default function AmbulanceStaffDashboard() {
  const { ambulances, connected } = useAmbulanceSocket();
  const [selectedId, setSelectedId] = useState('A101');
  const ambulance = ambulances.find((a) => a.id === selectedId) ?? ambulances[0];

  const [history, setHistory] = useState<{ t: number; hr: number; spo2: number; temp: number; sys: number; dia: number }[]>([]);
  const [agentEntries, setAgentEntries] = useState<AgentEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientRegistration>({ defaultValues: { ambulance_id: selectedId } });

  // Sample vitals into a rolling history buffer once a second for the charts.
  useEffect(() => {
    if (!ambulance) return;
    const id = setInterval(() => {
      setHistory((prev) =>
        [
          ...prev,
          {
            t: Date.now(),
            hr: ambulance.vitals.heartRate,
            spo2: ambulance.vitals.spo2,
            temp: ambulance.vitals.temperature,
            sys: ambulance.vitals.bpSystolic,
            dia: ambulance.vitals.bpDiastolic,
          },
        ].slice(-HISTORY_LEN)
      );
    }, 1000);
    return () => clearInterval(id);
  }, [ambulance]);

  // Simulated multi-agent orchestration feed — a new entry every few seconds.
  useEffect(() => {
    setAgentEntries([]);
    if (!ambulance) return;
    const id = setInterval(() => {
      setAgentEntries((prev) => [generateAgentEntry(ambulance), ...prev].slice(0, 14));
    }, 4000);
    return () => clearInterval(id);
  }, [ambulance?.id]);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  }

  async function onRegister(data: PatientRegistration) {
    try {
      await api.post('/api/patients', { ...data, ambulance_id: selectedId, age: Number(data.age) });
      showToast(`Patient ${data.name} registered — now visible on the Doctor dashboard.`);
      reset({ ambulance_id: selectedId } as PatientRegistration);
    } catch {
      showToast('Could not reach the backend — start the FastAPI server to persist registrations.');
    }
  }

  async function handleSendToHospital() {
    try {
      const { data } = await api.post(`/api/ambulances/${selectedId}/send-to-hospital`);
      showToast(data.ok ? `${selectedId} en route to ${data.hospital}.` : data.error);
    } catch {
      showToast('Backend unreachable.');
    }
  }

  async function handleNotifyHospital() {
    try {
      const { data } = await api.post(`/api/ambulances/${selectedId}/notify-hospital`);
      showToast(data.message ?? 'Hospital notified.');
    } catch {
      showToast('Backend unreachable.');
    }
  }

  async function handleAiSummary() {
    try {
      const { data } = await api.get(`/api/ambulances/${selectedId}/ai-summary`);
      setAiSummary(data.summary);
    } catch {
      setAiSummary('Backend unreachable — start the FastAPI server to generate a live summary.');
    }
  }

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      const res = await api.get(`/api/reports/${selectedId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LEIP-Report-${selectedId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Could not generate report — start the FastAPI server.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F7FA]">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        <TopBar connected={connected} />
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          {/* Left: live trip monitor + agent feed + actions */}
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display font-extrabold text-base">Live Trip</h1>
                <p className="text-[11.5px] text-muted mt-0.5">Real-time vitals and agent activity for the selected unit</p>
              </div>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="text-xs border border-line rounded-[8px] px-2.5 py-2 font-mono bg-white"
              >
                {AMBULANCE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            {ambulance ? (
              <>
                <LiveVitalsMonitor vitals={ambulance.vitals} />
                <AgentFeed entries={agentEntries} />

                <div className="bg-white border border-line rounded-2xl shadow-card p-4">
                  <h2 className="font-display font-extrabold text-sm mb-3 flex items-center gap-2">
                    <Activity size={15} className="text-primary" /> Vitals Trend
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ChartBlock title="Heart Rate" color="#DC2626">
                      <VitalsChart data={history.map((h) => ({ t: h.t, value: h.hr }))} dataKey="value" color="#DC2626" />
                    </ChartBlock>
                    <ChartBlock title="SpO₂" color="#0F5C8C">
                      <VitalsChart data={history.map((h) => ({ t: h.t, value: h.spo2 }))} dataKey="value" color="#0F5C8C" domain={[80, 100]} />
                    </ChartBlock>
                  </div>
                </div>

                {aiSummary && (
                  <div className="bg-white border border-line rounded-2xl shadow-card p-4">
                    <h2 className="font-display font-extrabold text-sm mb-2">AI Summary</h2>
                    <div className="p-3 bg-teal-soft rounded-[10px] text-[12.5px] text-[#0C6B60] leading-snug flex gap-2">
                      <Sparkles size={15} className="shrink-0 mt-0.5" />
                      {aiSummary}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-line rounded-2xl shadow-card p-8 text-center text-muted text-sm">
                No live data yet — waiting for simulation.
              </div>
            )}

            <div className="bg-white border border-line rounded-2xl shadow-card p-4 flex flex-wrap gap-2.5">
              <ActionButton icon={Send} label="Send Patient to Hospital" onClick={handleSendToHospital} primary />
              <ActionButton icon={Sparkles} label="Generate AI Summary" onClick={handleAiSummary} />
              <ActionButton icon={FileText} label={generating ? 'Generating…' : 'Generate Patient Report'} onClick={handleGenerateReport} disabled={generating} />
              <ActionButton icon={BellRing} label="Notify Hospital" onClick={handleNotifyHospital} />
            </div>
          </div>

          {/* Right: patient registration form */}
          <div className="bg-white border border-line rounded-2xl shadow-card p-4 h-fit">
            <h2 className="font-display font-extrabold text-sm mb-3">Patient Registration</h2>
            <form onSubmit={handleSubmit(onRegister)} className="flex flex-col gap-2.5">
              <Field label="Patient Name" error={errors.name}>
                <input {...register('name', { required: true })} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Age" error={errors.age}>
                  <input type="number" {...register('age', { required: true, min: 0 })} className={inputClass} />
                </Field>
                <Field label="Gender">
                  <select {...register('gender', { required: true })} className={inputClass}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Blood Group">
                <select {...register('blood_group', { required: true })} className={inputClass}>
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg}>{bg}</option>
                  ))}
                </select>
              </Field>
              <Field label="Phone Number">
                <input {...register('phone_number')} className={inputClass} />
              </Field>
              <Field label="Emergency Contact">
                <input {...register('emergency_contact')} className={inputClass} />
              </Field>
              <Field label="Medical History">
                <textarea {...register('medical_history')} rows={2} className={inputClass} />
              </Field>
              <Field label="Known Allergies">
                <input {...register('allergies')} className={inputClass} />
              </Field>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 bg-primary text-white text-[13px] font-semibold rounded-[9px] py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={15} /> {isSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-5 right-5 bg-ink text-white text-[12.5px] px-4 py-3 rounded-[10px] shadow-card max-w-xs z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

const inputClass =
  'w-full border border-line rounded-[8px] px-2.5 py-2 text-[12.5px] outline-none focus:border-primary transition-colors';

function Field({ label, error, children }: { label: string; error?: unknown; children: React.ReactNode }) {
  return (
    <label className="text-[11.5px] font-medium text-ink flex flex-col gap-1">
      {label}
      {children}
      {!!error && <span className="text-[10.5px] text-alert-red font-normal">Required</span>}
    </label>
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

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary,
  disabled,
}: {
  icon: typeof Send;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2.5 rounded-[9px] transition-opacity disabled:opacity-60 ${
        primary ? 'bg-primary text-white hover:opacity-90' : 'bg-primary-soft text-primary hover:opacity-80'
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}
