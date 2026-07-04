import { useEffect, useState } from 'react';
import { Search, Bell } from 'lucide-react';

export default function TopBar({ connected }: { connected: boolean }) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-[62px] border-b border-line bg-white flex items-center justify-between px-5 shrink-0">
      <div>
        <h1 className="font-display text-[16.5px] font-extrabold m-0">EMS Command Center</h1>
        <div className="text-[11.5px] text-muted mt-0.5">Metro Command Zone · {clock}</div>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="hidden md:flex items-center gap-1.5 bg-primary-soft border border-line rounded-[9px] px-2.5 py-1.5 text-[12.5px] text-muted w-[200px]">
          <Search size={14} className="shrink-0" />
          <input
            placeholder="Search ambulance, patient, hospital…"
            className="border-none bg-transparent outline-none text-[12.5px] w-full"
          />
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold ${
            connected ? 'bg-alert-green-soft text-alert-green' : 'bg-alert-amber-soft text-alert-amber'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current live-dot" />
          {connected ? 'LIVE SIMULATION' : 'RECONNECTING…'}
        </div>
        <button className="w-[34px] h-[34px] rounded-[9px] border border-line bg-white flex items-center justify-center relative hover:bg-primary-soft transition-colors">
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-alert-red border-[1.5px] border-white" />
          <Bell size={16} className="text-muted" />
        </button>
      </div>
    </div>
  );
}
