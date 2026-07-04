import { Sparkles } from 'lucide-react';
import type { AgentEntry } from '@/lib/agentFeed';

const BADGE_COLOR: Record<AgentEntry['badge'], string> = {
  ASSESSING: 'bg-[#233047] text-[#7CB3F0]',
  MONITORING: 'bg-[#3A2E12] text-[#FBBF24]',
  ALERT: 'bg-[#3A1616] text-[#FF5A5F]',
  STABLE: 'bg-[#12332A] text-[#34D399]',
};

export default function AgentFeed({ entries }: { entries: AgentEntry[] }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#232B36]" style={{ background: '#11151C' }}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5B8DEF]" />
        <span className="text-[11px] font-mono tracking-wider text-[#7C8798]">AGENT ORCHESTRATION FEED</span>
      </div>
      <div className="max-h-[280px] overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {entries.length === 0 && (
          <p className="text-[12px] text-[#5B6472] flex items-center gap-1.5 py-2">
            <Sparkles size={13} /> Waiting for agent activity…
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="border-b border-[#1E252F] pb-3 last:border-none last:pb-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-[7px] bg-[#1B2230] flex items-center justify-center shrink-0">
                <Sparkles size={12} className="text-[#7C8798]" />
              </div>
              <span className="text-[12px] font-semibold text-[#E4E7EC]">{e.agent}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${BADGE_COLOR[e.badge]}`}>{e.badge}</span>
            </div>
            <p className="text-[12.5px] text-[#B7BFCB] leading-snug pl-8">{e.text}</p>
            <p className="text-[10px] font-mono text-[#5B6472] pl-8 mt-1">{e.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
