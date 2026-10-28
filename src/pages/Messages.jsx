import { Fragment, useMemo, useRef, useState } from 'react';
import { useNarrow } from '../utils/useNarrow.js';
import media from '../data/generated/media.json';
import { banners, loveNote, photoboothPicks } from '../data/content.js';
import VideoPlayer from '../components/VideoPlayer.jsx';
import BackButton from '../components/BackButton.jsx';
import PageBanner from '../components/PageBanner.jsx';

/* ── layout ───────────────────────────────────────────────────────────────
   The birthday song opens the page on its own wide tile, then two clips a
   row running straight through Elu's side, Aniyara's and the friends. The
   split alternates 55/45 and 45/55 and the tiles lean opposite ways, which
   keeps the wall irregular while leaving the autoscroll a single stop per
   row.

   No headings between the groups — Mum didn't want them — just a quiet rule,
   so the change of side registers without being announced. */

function SectionRule() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-4 py-3">
      <span className="h-px w-32 bg-gradient-to-r from-transparent to-gold/55" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
      <span className="h-px w-32 bg-gradient-to-l from-transparent to-gold/55" />
    </div>
  );
}

const SPLITS = [[55, 45], [45, 55]];
const TILTS = [[-1.0, 0.8], [0.9, -0.7]];

function buildRows(items, perRow) {
  const rows = [];
  let i = 0;
  while (i < items.length) {
    if (perRow === 1 || items[i].solo || !items[i + 1] || items[i + 1].solo) {
      rows.push([items[i]]);
      i += 1;
    } else {
      rows.push([items[i], items[i + 1]]);
      i += 2;
    }
  }
  return rows;
}

/* Cream-and-white strips, the way a real photobooth prints them. Two of them
   at opposing angles rather than one tall column, so the banner stays a
   banner instead of becoming a wall. Which pictures appear is set in
   src/data/content.js. */
function PhotoboothStrips({ narrow }) {
  const picked = photoboothPicks
    .map((id) => media.photobooth.find((p) => p.id === id))
    .filter(Boolean);

  /* Say so loudly when a name in content.js matches nothing. Falling back
     silently just shows the old pictures, which looks like the change didn't
     take — almost always it means photos/photoboothPics/ was renamed without
     re-running `npm run media`. */
  if (import.meta.env.DEV && picked.length < photoboothPicks.length) {
    const missing = photoboothPicks.filter(
      (id) => !media.photobooth.some((p) => p.id === id),
    );
    console.warn(
      `[photobooth] ${missing.length} name(s) in src/data/content.js match no picture: ` +
        `${missing.join(', ')}.\nRun \`npm run media\` after renaming anything in ` +
        `photos/photoboothPics/. Available: ${media.photobooth.map((p) => p.id).join(', ')}`,
    );
  }

  const shots = (picked.length ? picked : media.photobooth).slice(0, 5);
  if (!shots.length) return null;

  const frame = narrow ? 92 : 148;

  const Strip = ({ items, tilt, className }) => (
    <div className={`relative ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
      <div className={`rounded-sm bg-gradient-to-b from-white to-cream shadow-[0_16px_38px_rgba(0,0,0,0.5)] ${narrow ? 'p-1.5 pb-4' : 'p-2.5 pb-7'}`}>
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <div key={s.id} className="overflow-hidden bg-ink" style={{ width: frame, aspectRatio: '1 / 1' }}>
              <img src={`${s.base}-900.webp`} alt="" loading="eager" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
      <i className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-6 bg-gold-warm/85 shadow-md" />
    </div>
  );

  return (
    <div className="relative flex shrink-0 items-start">
      <Strip items={shots.slice(0, 3)} tilt={-3.5} className="z-10" />
      <Strip items={shots.slice(3, 5)} tilt={4.5} className="-ml-5 mt-14" />
    </div>
  );
}

export default function Messages() {
  const [activeId, setActiveId] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const rowRefs = useRef({});
  const narrow = useNarrow();

  const { order, rows, rowOf } = useMemo(() => {
    const items = media.messages;               // already in page order
    const order = items.map((m) => m.id);
    const rows = buildRows(items, narrow ? 1 : 2);
    const rowOf = {};
    rows.forEach((row, ri) => row.forEach((it) => { rowOf[it.id] = ri; }));
    return { order, rows, rowOf };
  }, [narrow]);

  const advance = (fromId) => {
    const nextId = order[order.indexOf(fromId) + 1];
    if (!nextId) {
      setActiveId(null);
      return;
    }
    setActiveId(nextId);
    if (rowOf[nextId] !== rowOf[fromId]) {
      rowRefs.current[rowOf[nextId]]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const renderTile = (item, idxInRow, rowIndex, width) => (
    <div
      key={item.id}
      style={{
        flexBasis: narrow ? '100%' : `${width}%`,
        transform: narrow ? 'none' : `rotate(${TILTS[rowIndex % 2][idxInRow] ?? 0}deg)`,
      }}
      className="min-w-0"
    >
      <div className="wrap-calm tile-frame">
        <VideoPlayer
          item={item}
          active={activeId === item.id}
          onRequestActive={() => setActiveId(item.id)}
          onEnded={() => advance(item.id)}
          speed={speed}
          onSpeedChange={setSpeed}
          muted={muted}
          onMutedChange={setMuted}
        />
      </div>
    </div>
  );

  return (
    <div className="page-bg min-h-full pb-32">
      <BackButton />

      <PageBanner {...banners.messages}>
        <PhotoboothStrips narrow={narrow} />
      </PageBanner>

      <div className="mx-auto mt-10 flex max-w-[1500px] flex-col gap-7 px-4 sm:mt-16 sm:gap-12 sm:px-10">
        {rows.map((row, ri) => {
          const split = SPLITS[ri % SPLITS.length];
          const solo = row.length === 1;
          const section = row[0].section;
          const newSection = ri > 0 && rows[ri - 1][0].section !== section;
          return (
            <Fragment key={ri}>
              {newSection && <SectionRule />}
              <div
                ref={(el) => { rowRefs.current[ri] = el; }}
                className={`flex gap-4 sm:gap-8 ${solo ? 'justify-center' : ''}`}
              >
                {solo
                  ? renderTile(row[0], 0, ri, narrow ? 100 : 66)
                  : row.map((item, ii) => renderTile(item, ii, ri, split[ii]))}
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* ── sign-off, as a letter ── */}
      <div className="mx-auto mt-20 w-full max-w-xl px-4 sm:mt-32 sm:px-10">
        <div className="letter-paper rounded-[3px] px-7 py-12 sm:px-14 sm:py-16" style={{ transform: 'rotate(-1.2deg)' }}>
          <p className="script relative z-10 text-center text-[30px] leading-snug text-[#3b2516]">
            {loveNote[0]}
          </p>
          <p className="display relative z-10 mt-4 text-center text-[42px] leading-snug text-[#7a1225]">
            {loveNote[1]}
          </p>
        </div>
      </div>
    </div>
  );
}
