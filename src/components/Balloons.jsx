import { motion } from 'framer-motion';

const COLOURS = ['#C9A227', '#E8C46A', '#F7F1E4', '#8E1A2C', '#F2DA95', '#6E1727'];

/* Deterministic pseudo-random, so a balloon burst looks scattered but renders
   identically every time — no hydration surprises, no re-render jitter. */
function rand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Balloon({ i, spread }) {
  const drift = (rand(i) - 0.5) * spread;
  const size = 34 + rand(i + 7) * 26;
  const delay = rand(i + 13) * 0.45;
  const duration = 2.6 + rand(i + 21) * 1.6;
  const colour = COLOURS[i % COLOURS.length];
  const sway = (rand(i + 31) - 0.5) * 70;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
      animate={{
        x: [0, drift * 0.5, drift + sway],
        y: [0, -220, -window.innerHeight * 0.95],
        opacity: [0, 1, 1, 0],
        scale: [0.4, 1, 1],
      }}
      transition={{ duration, delay, ease: 'easeOut', times: [0, 0.25, 1] }}
      style={{ width: size, height: size * 1.22 }}
    >
      <svg viewBox="0 0 40 52" width="100%" height="100%">
        <ellipse cx="20" cy="19" rx="16" ry="19" fill={colour} />
        <ellipse cx="14" cy="13" rx="4.5" ry="6" fill="#fff" opacity="0.32" />
        <path d="M20 38 l-3.2 4 h6.4 z" fill={colour} />
        <path
          d="M20 42 q5 5 0 10"
          stroke={colour}
          strokeWidth="1.3"
          fill="none"
          opacity="0.75"
        />
      </svg>
    </motion.div>
  );
}

export default function Balloons({ count = 16, spread = 520, confetti = true }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, i) => (
        <Balloon key={i} i={i} spread={spread} />
      ))}

      {confetti &&
        Array.from({ length: 34 }, (_, i) => {
          const j = i + 100;
          const drift = (rand(j) - 0.5) * spread * 1.5;
          const size = 5 + rand(j + 3) * 7;
          return (
            <motion.i
              key={`c${i}`}
              className="absolute left-1/2 top-1/2 block"
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={{
                x: [0, drift * 0.6, drift],
                y: [0, -180 - rand(j + 5) * 160, 180 + rand(j + 9) * 260],
                opacity: [0, 1, 1, 0],
                rotate: rand(j + 11) * 720 - 360,
              }}
              transition={{
                duration: 2.2 + rand(j + 17) * 1.8,
                delay: rand(j + 19) * 0.5,
                ease: 'easeOut',
                times: [0, 0.3, 1],
              }}
              style={{
                width: size,
                height: size * 0.5,
                background: COLOURS[(i + 2) % COLOURS.length],
                borderRadius: 1,
              }}
            />
          );
        })}
    </div>
  );
}
