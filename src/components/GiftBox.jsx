import { useState } from 'react';
import { motion } from 'framer-motion';
import Balloons from './Balloons.jsx';

const CLICKS_TO_OPEN = 3;
const HINTS = ['Click the gift', 'Again…', 'One more!'];

/* The front door. Three clicks, the box wobbling harder each time, then the
   lid lifts away and the balloons come out. The float-up to the hub is handled
   one level up in App, so the two screens move as a single piece. */
export default function GiftBox({ onOpen }) {
  const [clicks, setClicks] = useState(0);
  const opened = clicks >= CLICKS_TO_OPEN;

  const handleClick = () => {
    if (opened) return;
    const next = clicks + 1;
    setClicks(next);
    if (next >= CLICKS_TO_OPEN) setTimeout(() => onOpen?.(), 1900);
  };

  return (
    <div className="page-bg relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* faint gold confetti resting in the background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 25%, #E8C46A 0 2px, transparent 2.5px),' +
            'radial-gradient(circle at 72% 14%, #C9A227 0 2px, transparent 2.5px),' +
            'radial-gradient(circle at 38% 72%, #E8C46A 0 1.5px, transparent 2px),' +
            'radial-gradient(circle at 88% 62%, #C9A227 0 2px, transparent 2.5px),' +
            'radial-gradient(circle at 56% 92%, #E8C46A 0 1.5px, transparent 2px)',
          backgroundSize: '220px 220px',
        }}
      />

      <div className="relative flex flex-col items-center">
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label="Open the gift"
          className="relative cursor-pointer border-0 bg-transparent p-0 outline-none focus:outline-none focus-visible:outline-none"
          style={{ width: 390, height: 360 }}
          animate={
            opened
              ? { scale: 1, rotate: 0 }
              : {
                  scale: [1, 1 - clicks * 0.045, 1],
                  rotate: [0, clicks % 2 ? -3.5 - clicks : 3.5 + clicks, 0],
                }
          }
          transition={{ duration: 0.42, ease: 'easeOut' }}
          whileHover={opened ? undefined : { scale: 1.03 }}
        >
          {/* lid — floats off and fades on the final click */}
          <motion.div
            className="absolute left-1/2 z-10"
            style={{ width: 336, height: 76, x: '-50%', top: 66 }}
            animate={
              opened
                ? { y: -300, rotate: -16, opacity: 0, scale: 1.08 }
                : { y: -clicks * 5, rotate: 0, opacity: 1 }
            }
            transition={
              opened
                ? { duration: 1.15, ease: [0.3, 0, 0.2, 1] }
                : { duration: 0.4, ease: 'easeOut' }
            }
          >
            <div className="wrap-full relative h-full w-full rounded-md shadow-[0_10px_22px_rgba(0,0,0,0.45)]">
              <i className="absolute inset-y-0 left-1/2 w-[42px] -translate-x-1/2 bg-gold shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" />
              {/* bow */}
              <svg
                viewBox="0 0 120 60"
                className="absolute left-1/2 w-[286px] -translate-x-1/2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]"
                style={{ bottom: '58%' }}
              >
                <path d="M60 46c-14 0-30-10-30-22S44 8 60 30c16-22 30-18 30-6S74 46 60 46z" fill="#E8C46A" />
                <path d="M60 46c-10 0-22-8-22-17S48 14 60 30c12-16 22-10 22-1S70 46 60 46z" fill="#C9A227" />
                <circle cx="60" cy="36" r="8" fill="#F2DA95" />
              </svg>
            </div>
          </motion.div>

          {/* body */}
          <div
            className="wrap-full absolute left-1/2 rounded-lg shadow-[0_18px_40px_rgba(0,0,0,0.5)]"
            style={{ width: 296, height: 228, transform: 'translateX(-50%)', top: 140 }}
          >
            <i className="absolute inset-y-0 left-1/2 w-[38px] -translate-x-1/2 bg-gold shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" />
            {/* the dark inside, revealed as the lid leaves */}
            <motion.i
              className="absolute inset-x-2 top-0 h-3 rounded-t bg-[#1a1013]"
              animate={{ opacity: opened ? 1 : 0 }}
              transition={{ duration: 0.45, delay: opened ? 0.12 : 0 }}
            />
          </div>
        </motion.button>

        {/* balloons pour out of the box's mouth */}
        {opened && (
          <div className="pointer-events-none absolute left-1/2 top-[185px] h-1 w-1 -translate-x-1/2">
            <Balloons count={26} spread={700} />
          </div>
        )}

        <motion.p
          className="script mt-6 text-[28px] text-gold-warm"
          animate={{ opacity: opened ? 0 : [0.65, 1, 0.65] }}
          transition={
            opened ? { duration: 0.3 } : { duration: 2.1, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {HINTS[Math.min(clicks, HINTS.length - 1)]}
        </motion.p>
      </div>
    </div>
  );
}
