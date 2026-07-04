import type { Ambulance, DashboardStats, Hospital, AmbulanceStatus } from '@/types';

const STATUS_LABEL: Record<AmbulanceStatus, string> = {
  available: 'Available',
  responding: 'Responding',
  critical: 'Critical Patient',
  arrived: 'At Hospital',
};
const STATUS_BADGE: Record<AmbulanceStatus, string> = {
  available: 'bg-alert-green-soft text-alert-green',
  responding: 'bg-alert-amber-soft text-alert-amber',
  critical: 'bg-alert-red-soft text-alert-red',
  arrived: 'bg-primary-soft text-primary',
};

function StatCard({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div
      className={`rounded-[13px] border border-line p-3 bg-gradient-to-br ${
        alert ? 'from-alert-red-soft to-white' : 'from-primary-soft to-white'
      }`}
    >
      <div className={`font-mono text-xl font-bold ${alert ? 'text-alert-red' : 'text-primary'}`}>{value}</div>
      <div className="text-[10.5px] text-muted mt-0.5 font-medium">{label}</div>
    </div>
  );
}

export default function StatsPanel({
  stats,
  ambulances,
  hospitals,
  onFocus,
}: {
  stats: DashboardStats;
  ambulances: Ambulance[];
  hospitals: Hospital[];
  onFocus: (id: string) => void;
}) {
  return (
    <aside className="w-full md:w-[300px] lg:w-[336px] shrink-0 border-l border-line bg-white p-4 overflow-y-auto flex flex-col gap-3.5">
      <h2 className="font-display text-[13px] font-extrabold m-0">Live Statistics</h2>
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard label="Total Ambulances" value={stats.totalAmbulances} />
        <StatCard label="Available" value={stats.available} />
        <StatCard label="Busy" value={stats.busy} />
        <StatCard label="Critical Patients" value={stats.critical} alert={stats.critical > 0} />
        <StatCard label="Avg Response Time" value={`${stats.avgResponseTime}m`} />
        <StatCard label="Hospitals Connected" value={stats.hospitalsConnected} />
        <StatCard label="Doctors Online" value={stats.doctorsOnline} />
        <StatCard label="Cases Today" value={stats.casesToday} />
      </div>

      <div className="border border-line rounded-[14px] p-3.5 bg-white">
        <h3 className="font-display text-xs font-extrabold m-0 mb-2.5 flex items-center justify-between">
          Fleet Status
          <span className="font-normal text-muted text-[10.5px]">{ambulances.length} units</span>
        </h3>
        <div>
          {ambulances.map((a) => (
            <div
              key={a.id}
              onClick={() => onFocus(a.id)}
              className="flex items-center justify-between py-1.5 border-b border-[#F0F3F6] last:border-none text-xs cursor-pointer"
            >
              <span className="font-mono font-bold text-[11.5px]">{a.id}</span>
              <span className="text-muted">{a.status === 'available' ? 'Standby' : a.hospital.split(' ')[0]}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[a.status]}`}>
                {STATUS_LABEL[a.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-line rounded-[14px] p-3.5 bg-white">
        <h3 className="font-display text-xs font-extrabold m-0 mb-2.5">Hospitals Connected</h3>
        <div>
          {hospitals.map((h) => (
            <div key={h.name} className="flex items-center justify-between py-1.5 text-xs">
              <span className="font-semibold text-[11.5px]">{h.name}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  h.load === 'High'
                    ? 'bg-alert-red-soft text-alert-red'
                    : h.load === 'Moderate'
                    ? 'bg-alert-amber-soft text-alert-amber'
                    : 'bg-alert-green-soft text-alert-green'
                }`}
              >
                {h.load}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
