import type { ActivityEvent } from '@/types';

export default function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="bg-white border border-line rounded-2xl shadow-card px-4.5 py-4 shrink-0">
      <h3 className="font-display text-[13.5px] font-extrabold m-0 mb-3">Recent Activity</h3>
      <div className="flex gap-4 overflow-x-auto pb-0.5">
        {events.map((e, i) => (
          <div
            key={e.id}
            className={`flex flex-col gap-1 min-w-[130px] text-[11.5px] shrink-0 pl-3.5 border-l-2 ${
              i === 0 ? 'border-teal' : 'border-line'
            }`}
          >
            <div className="font-mono text-[10.5px] font-semibold text-muted">{e.time}</div>
            <div className="font-medium leading-tight">{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
