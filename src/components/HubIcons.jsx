/* The three hub icons. */

/* ── bouquet ──────────────────────────────────────────────────────────────
   Drawn from Milan's reference: roses in a cream paper cone, outlined in the
   same dark ink as the rest of the hand-drawn marks, with a ribbon bow at the
   base and a little heart on the wrap. */

const INK = '#2E1A14';

export function Bouquet() {
  const roses = [
    [34, 30, 11], [52, 22, 11], [68, 34, 10.5],
    [41, 48, 11], [60, 50, 10.5], [50, 38, 11],
  ];
  return (
    <svg viewBox="0 0 100 110" className="h-full w-full">
      <g stroke={INK} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round">
        {/* leaves behind the blooms */}
        <path d="M24 48c-8-6-10-16-6-20s12 0 15 9" fill="#3F7A3A" />
        <path d="M78 46c8-6 10-16 6-20s-12 0-15 9" fill="#3F7A3A" />
        <path d="M30 62c-7-3-11-10-9-14s9-2 12 4" fill="#4A8C44" />
        <path d="M72 60c7-3 11-10 9-14s-9-2-12 4" fill="#4A8C44" />

        {/* the paper cone */}
        <path d="M22 44 50 96 80 44 68 40 50 46 32 40z" fill="#F0E6CB" />
        <path d="M50 46v50" fill="none" />
        <path d="M33 54 50 96M68 54 50 96" fill="none" strokeWidth="1.5" opacity="0.55" />

        {/* roses */}
        {roses.map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={i % 2 ? '#D8415A' : '#C62B47'} />
            <path
              d={`M${cx} ${cy - r * 0.52}a${r * 0.52} ${r * 0.52} 0 1 1-${r * 0.5} ${r * 0.52}a${r * 0.3} ${r * 0.3} 0 1 0 ${r * 0.42}-${r * 0.2}`}
              fill="none"
              strokeWidth="1.7"
            />
          </g>
        ))}

        {/* heart on the wrap */}
        <path
          d="M50 64c-2.6-3.4-7.6-2.4-7.6 1.6 0 3.3 4.4 6 7.6 8.6 3.2-2.6 7.6-5.3 7.6-8.6 0-4-5-5-7.6-1.6z"
          fill="#E8637A"
          strokeWidth="1.8"
        />

        {/* ribbon bow at the base */}
        <path d="M50 92c-6-6-15-6-16-1s7 7 16 5z" fill="#D8415A" />
        <path d="M50 92c6-6 15-6 16-1s-7 7-16 5z" fill="#D8415A" />
        <path d="M46 96c-4 5-5 10-3 12M54 96c4 5 5 10 3 12" fill="none" />
        <circle cx="50" cy="94" r="4" fill="#E8637A" />
      </g>
    </svg>
  );
}

/* ── the other two ────────────────────────────────────────────────────────── */

export function Marquee() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect x="12" y="22" width="76" height="52" rx="5" fill="#8E1A2C" />
      <rect x="18" y="30" width="64" height="32" rx="3" fill="#2B1016" />
      <path d="M44 38v16l14-8z" fill="#F7F1E4" />
      <rect x="12" y="22" width="76" height="9" rx="4" fill="#C9A227" />
      <rect x="12" y="68" width="76" height="8" rx="4" fill="#C9A227" />
      {[18, 30, 42, 54, 66, 78].map((x) => <circle key={x} cx={x} cy="26.5" r="2.6" fill="#F7F1E4" />)}
      {[18, 30, 42, 54, 66, 78].map((x) => <circle key={`b${x}`} cx={x} cy="72" r="2.6" fill="#F7F1E4" />)}
      <path d="M12 22 24 10h52L88 22z" fill="#A81F34" />
      <path d="M24 10h52l4 5H20z" fill="#C9A227" />
    </svg>
  );
}

export function PhotoStack() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <g transform="rotate(-9 50 52)">
        <rect x="18" y="26" width="64" height="54" rx="3" fill="#F7F1E4" />
        <rect x="22" y="30" width="56" height="38" fill="#8E1A2C" />
      </g>
      <g transform="rotate(5 50 52)">
        <rect x="20" y="24" width="64" height="54" rx="3" fill="#F7F1E4" />
        <rect x="24" y="28" width="56" height="38" fill="#C9A227" />
        <circle cx="38" cy="40" r="5" fill="#F2DA95" />
        <path d="M24 66l16-16 11 11 9-8 20 13H24z" fill="#5C1220" opacity="0.7" />
      </g>
    </svg>
  );
}

/* Which bouquet the hub uses. Swap for PosyBouquet or WrappedBouquet. */
export const BOUQUET = Bouquet;
