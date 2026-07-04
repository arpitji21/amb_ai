/** One heartbeat's worth of a Lead-II-style trace, drawn as SVG path
 * commands relative to a 100-unit-wide, 60-unit-tall cell (baseline at y=30). */
const BEAT = 'l6,0 l4,-3 l3,7 l3,-26 l4,32 l3,-10 l7,0 l10,0';
const BEAT_WIDTH = 100;
const BEATS = 8;

function buildPath() {
  let d = `M0,30 ${BEAT}`;
  for (let i = 1; i < BEATS; i++) d += ` ${BEAT}`;
  return d;
}

export default function EcgWave({ color = '#FF5A5F', height = 140 }: { color?: string; height?: number }) {
  const path = buildPath();
  const totalWidth = BEAT_WIDTH * BEATS;

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg
        viewBox={`0 0 ${totalWidth} 60`}
        preserveAspectRatio="none"
        className="absolute top-0 left-0 h-full"
        style={{ width: '200%', animation: 'ecg-scroll 6s linear infinite' }}
      >
        <path
          d={`${path} ${path.replace('M0,30', 'M' + totalWidth + ',30')}`}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />
      </svg>
      <style>{`
        @keyframes ecg-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
