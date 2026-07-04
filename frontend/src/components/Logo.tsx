interface LogoProps {
  /** 'dark' = black/red wordmark for light backgrounds. 'light' = white/red wordmark for dark backgrounds (e.g. the navy sidebar). */
  variant?: 'dark' | 'light';
  className?: string;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={`rounded-[9px] bg-[#111318] flex items-end justify-center gap-[3px] px-2 py-2 ${className ?? ''}`}>
      <span className="w-[5px] h-[9px] rounded-[1.5px] bg-[#E31E24]" />
      <span className="w-[5px] h-[14px] rounded-[1.5px] bg-[#E31E24]" />
      <span className="w-[5px] h-[19px] rounded-[1.5px] bg-[#E31E24]" />
    </div>
  );
}

export default function Logo({ variant = 'dark', className }: LogoProps) {
  const wordColor = variant === 'light' ? '#FFFFFF' : '#111318';
  const subColor = variant === 'light' ? '#CFE0F5' : '#111318';
  const red = '#E31E24';

  return (
    <svg viewBox="0 0 300 92" className={className} role="img" aria-label="LARK AI Healthcare">
      <g fontFamily="Manrope, Arial, sans-serif" fontWeight="800">
        <text x="0" y="44" fontSize="46" letterSpacing="-1" fill={wordColor}>
          LARK
        </text>
        <text x="128" y="44" fontSize="46" letterSpacing="-1" fill={red}>
          AI
        </text>
      </g>
      {/* ascending bar-chart mark, echoing the uploaded logo */}
      <g fill={red}>
        <rect x="196" y="16" width="9" height="10" rx="1.5" />
        <rect x="209" y="10" width="9" height="16" rx="1.5" />
        <rect x="222" y="4" width="9" height="22" rx="1.5" />
      </g>
      <text
        x="0"
        y="76"
        fontFamily="Manrope, Arial, sans-serif"
        fontWeight="700"
        fontSize="15"
        letterSpacing="6.5"
        fill={subColor}
      >
        HEALTHCARE
      </text>
    </svg>
  );
}
