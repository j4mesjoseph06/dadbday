import { useEffect, useState } from 'react';

const MIN_WIDTH = 900;

/* Phones get a friendly card rather than a broken forty-minute video page.
   Mobile is a later job; this keeps the door politely shut until then. */
export default function DesktopGate({ children }) {
  const [tooNarrow, setTooNarrow] = useState(() => window.innerWidth < MIN_WIDTH);

  useEffect(() => {
    const onResize = () => setTooNarrow(window.innerWidth < MIN_WIDTH);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!tooNarrow) return children;

  return (
    <div className="page-bg flex min-h-full items-center justify-center p-6">
      <div className="wrap-full max-w-sm rounded-xl p-3 shadow-2xl">
        <div className="rounded-lg bg-[#1a1013]/90 px-7 py-9 text-center">
          <div className="mb-4 text-5xl">💻</div>
          <h1 className="display mb-3 text-3xl text-gold-warm">One moment!</h1>
          <p className="text-[15px] leading-relaxed text-cream/85">
            This one's made for a big screen. Open it on a laptop and it'll all
            be waiting for you.
          </p>
        </div>
      </div>
    </div>
  );
}
