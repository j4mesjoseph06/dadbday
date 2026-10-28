import { useState } from 'react';
import { motion } from 'framer-motion';
import media from '../data/generated/media.json';
import { banners } from '../data/content.js';
import VideoPlayer from '../components/VideoPlayer.jsx';
import BackButton from '../components/BackButton.jsx';

const BULBS = Array.from({ length: 16 }, (_, i) => i);

/* The curtains start closed across the stage and sweep back on the click,
   ending in the tied-back position they'll hold for the rest of the film.
   One set of drapes doing both jobs — they are the wrapping. */
const SWEEP = { duration: 1.6, ease: [0.33, 0, 0.12, 1] };

function Marquee() {
  return (
    <div className="relative z-40 mx-auto w-fit max-w-full px-3">
      <div className="relative rounded-xl bg-burgundy px-6 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.6)] ring-2 ring-gold/70 sm:px-14 sm:py-6">
        <h1 className="display text-center text-[clamp(34px,4.6vw,60px)] leading-none text-gold-warm">
          {banners.cinema.title}
        </h1>
        {['-top-[7px]', '-bottom-[7px]'].map((pos) => (
          <div key={pos} className={`pointer-events-none absolute inset-x-5 ${pos} flex justify-between`}>
            {BULBS.map((i) => (
              <motion.i
                key={i}
                className="block h-[11px] w-[11px] rounded-full bg-cream"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.7, repeat: Infinity, delay: (i % 4) * 0.42, ease: 'easeInOut' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* One half of the drape. Closed it covers its half of the stage; open it has
   slid most of the way off, leaving a gathered edge with a sash across it. */
function CurtainPanel({ side, open }) {
  const isLeft = side === 'left';
  return (
    <motion.div
      className={`absolute top-0 h-full w-1/2 ${isLeft ? 'left-0' : 'right-0'}`}
      initial={false}
      animate={{ x: open ? (isLeft ? '-62%' : '62%') : '0%' }}
      transition={SWEEP}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(90deg,
            #8E1728 0 16px, #5C1220 16px 31px, #A01B2E 31px 44px,
            #4A0E1A 44px 60px, #6E1727 60px 76px)`,
        }}
      />
      {/* the heavy fold where the two halves meet */}
      <div
        className={`absolute inset-y-0 w-16 ${isLeft ? 'right-0' : 'left-0'}`}
        style={{
          background: isLeft
            ? 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.75) 100%)'
            : 'linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.75) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,215,140,0.10) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0.55) 100%)',
          boxShadow: isLeft ? 'inset -34px 0 56px rgba(0,0,0,0.6)' : 'inset 34px 0 56px rgba(0,0,0,0.6)',
        }}
      />

      {/* the sash only appears once the curtain has been gathered back */}
      <motion.div
        className="absolute"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.5, delay: open ? 0.9 : 0 }}
        style={{
          top: '46%',
          [isLeft ? 'left' : 'right']: '58%',
          width: '34%',
          height: 28,
          transform: `rotate(${isLeft ? -7 : 7}deg)`,
          borderRadius: 999,
          background: 'linear-gradient(to bottom, #F2DA95 0%, #E8C46A 42%, #C9A227 100%)',
          boxShadow: '0 6px 14px rgba(0,0,0,0.55)',
        }}
      />
      <motion.div
        className="absolute rounded-full"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.5, delay: open ? 0.9 : 0 }}
        style={{
          top: 'calc(46% - 7px)',
          [isLeft ? 'left' : 'right']: '86%',
          width: 42,
          height: 42,
          background: 'radial-gradient(circle at 36% 32%, #F7ECC4 0%, #E8C46A 45%, #B8891B 100%)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
        }}
      />
    </motion.div>
  );
}

export default function Cinema() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const film = media.cinema;

  const reveal = () => {
    if (open) return;
    setOpen(true);
  };

  return (
    <div className="page-bg relative flex min-h-dvh flex-col overflow-hidden pb-10 pt-6 sm:pb-16 sm:pt-12">
      <BackButton />

      {/* house lights down once the film rolls */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-20 bg-black"
        animate={{ opacity: playing ? 0.75 : 0 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />

      <Marquee />

      {/* ── the stage ── */}
      <div className="relative mt-6 flex-1 sm:mt-10">
        <div className="relative z-30 mx-auto w-full max-w-5xl px-3 sm:px-6">
          <div className="rounded-xl bg-ink/70 p-2 shadow-[0_26px_60px_rgba(0,0,0,0.6)] ring-1 ring-gold/40 sm:p-3">
            {!film ? (
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gold/45 bg-burgundy/40 text-center"
                style={{ aspectRatio: '16 / 9' }}
              >
                <p className="display text-[26px] text-gold-warm">The film goes here</p>
              </div>
            ) : (
              <VideoPlayer
                item={{ ...film, portrait: false }}
                aspect={`${film.w} / ${film.h}`}
                active={open}
                autoPlayOnActivate
                speed={speed}
                onSpeedChange={setSpeed}
                muted={muted}
                onMutedChange={setMuted}
                onRequestActive={() => setPlaying(true)}
                onEnded={() => setPlaying(false)}
              />
            )}
          </div>

        </div>

        {/* curtains, drawn across everything until clicked */}
        <div className={`absolute inset-0 z-40 ${open ? 'pointer-events-none' : ''}`}>
          <CurtainPanel side="left" open={open} />
          <CurtainPanel side="right" open={open} />

          {!open && film && (
            <motion.button
              type="button"
              onClick={() => { reveal(); setPlaying(true); }}
              className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center outline-none"
              aria-label="Open the curtains"
            >
              <motion.span
                className="script rounded-full border border-gold/60 bg-ink/70 px-6 py-2.5 text-center text-[20px] text-gold-warm backdrop-blur sm:px-9 sm:py-3 sm:text-[27px]"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Open the curtains
              </motion.span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
