import { go } from '../utils/useRoute.js';

/* Same control, same corner, on all three content pages. */
export default function BackButton() {
  return (
    <button
      type="button"
      onClick={() => go('hub')}
      className="fixed left-5 top-5 z-50 flex items-center gap-2 rounded-full border border-gold/45 bg-ink/70 px-4 py-2 text-[13px] font-bold tracking-wide text-gold-warm backdrop-blur transition hover:border-gold hover:bg-ink/90"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2 4 8l6 6" />
      </svg>
      Back
    </button>
  );
}
