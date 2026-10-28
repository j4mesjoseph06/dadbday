import { go } from '../utils/useRoute.js';
import { BOUQUET, Marquee } from './HubIcons.jsx';

/* Three choices across, not down — a row reads as a menu, a column reads as a
   list you're meant to work through in order. Deliberately static: no entrance
   animation beyond a fade, no images, so it's on screen the instant it's asked
   for. */

const ITEMS = [
  { route: 'messages', label: 'Video Messages', note: 'from everyone who loves you', Icon: BOUQUET },
  { route: 'cinema', label: "Mum's Film", note: 'the main event', Icon: Marquee },
];

export default function Hub() {
  return (
    <div className="page-bg flex min-h-dvh w-full flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-8 sm:py-14">
      <p className="script text-[32px] leading-none text-gold-warm sm:text-[38px]">For you</p>
      <div className="gold-rule mb-10 mt-2 w-44 sm:mb-16 sm:w-52" />

      <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-10 sm:flex-row sm:items-start">
        {ITEMS.map(({ route, label, note, Icon }) => (
          <button
            key={route}
            type="button"
            onClick={() => go(route)}
            className="group flex w-full flex-col items-center rounded-2xl px-6 py-4 outline-none transition-transform duration-200 hover:-translate-y-2 focus-visible:ring-2 focus-visible:ring-gold/60 sm:flex-1 sm:py-8"
          >
            <span className="block h-[104px] w-[104px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105 sm:h-[132px] sm:w-[132px]">
              <Icon />
            </span>
            <span className="display mt-6 text-center text-[27px] leading-tight text-cream transition-colors group-hover:text-gold-warm">
              {label}
            </span>
            <span className="script mt-0.5 text-center text-[19px] text-gold/85">{note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
