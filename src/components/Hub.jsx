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
    <div className="page-bg flex h-full w-full flex-col items-center justify-center overflow-y-auto px-8 py-14">
      <p className="script text-[38px] leading-none text-gold-warm">For you</p>
      <div className="gold-rule mb-16 mt-2 w-52" />

      <div className="flex w-full max-w-3xl items-start justify-center gap-10">
        {ITEMS.map(({ route, label, note, Icon }) => (
          <button
            key={route}
            type="button"
            onClick={() => go(route)}
            className="group flex flex-1 flex-col items-center rounded-2xl px-6 py-8 outline-none transition-transform duration-200 hover:-translate-y-2 focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <span className="block h-[132px] w-[132px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105">
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
