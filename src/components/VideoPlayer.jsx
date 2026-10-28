import { useCallback, useEffect, useRef, useState } from 'react';

export const SPEEDS = [1, 1.25, 1.3, 1.5, 1.75, 2];

function fmt(t) {
  if (!Number.isFinite(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* One player, used by every video on the site.

   Two things are deliberate here:

   - `src` is withheld until the clip is first asked to play. With 38 clips on
     one page, letting the browser see 38 <video src> attributes means 38
     network connections and 38 decoders; this way only what's been watched is
     ever fetched.

   - playback is driven by the `active` prop rather than internal state, so the
     page above can guarantee exactly one clip is ever running. */

/* Fixed bar heights — a drawn waveform, not a real analysis of the audio.
   Measuring the actual signal would mean decoding the file up front, which is
   the one thing the whole page is built to avoid. */
const WAVE = [34, 58, 80, 46, 92, 66, 38, 74, 54, 88, 44, 70, 30, 62, 84, 50, 36, 76, 42, 60];

export default function VideoPlayer({
  item,
  active,
  onEnded,
  onRequestActive,
  speed = 1,
  onSpeedChange,
  muted = false,
  onMutedChange,
  autoPlayOnActivate = true,
  className = '',
  accent = 'gold',
  aspect = '16 / 9',
}) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const isAudio = item.kind === 'audio';
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 0);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  /* Parent decides who's live. Arm on first activation, pause when passed over. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (active) {
      if (!armed) setArmed(true);
      if (autoPlayOnActivate) {
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      }
    } else if (!v.paused) {
      v.pause();
    }
  }, [active, armed, autoPlayOnActivate]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, armed]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted, armed]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!armed) {
      setArmed(true);
      onRequestActive?.();
      return;
    }
    if (v.paused) {
      onRequestActive?.();
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      v.pause();
    }
  }, [armed, onRequestActive]);

  const seekBy = (delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  };

  const onScrub = (e) => {
    const v = videoRef.current;
    const pct = Number(e.target.value) / 1000;
    setTime(pct * duration);
    if (v && Number.isFinite(v.duration)) v.currentTime = pct * v.duration;
  };

  const fullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const pct = duration > 0 ? (time / duration) * 1000 : 0;
  const isGold = accent === 'gold';

  return (
    <div
      ref={wrapRef}
      className={`tile-screen group ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {/* A voice note has no picture, so the tile becomes a card: a warm
          burgundy panel with a bar of waveform marks that only move while it
          is actually playing. Everything else — the controls, the speed menu,
          its place in the autoplay chain — behaves exactly as a clip does. */}
      {isAudio ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(145deg,#6E1727_0%,#5C1220_55%,#3D0A15_100%)]">
          <svg viewBox="0 0 28 28" className="mb-4 h-11 w-11 text-gold-warm" fill="currentColor" aria-hidden>
            <rect x="10" y="3" width="8" height="14" rx="4" />
            <path d="M6.5 13a7.5 7.5 0 0 0 15 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M14 20.5V25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>

          <div className="flex h-12 items-center gap-[3px]" aria-hidden>
            {WAVE.map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-gold-warm/80"
                style={{
                  height: `${h}%`,
                  animation: playing ? `wave 1100ms ease-in-out ${i * 55}ms infinite` : 'none',
                }}
              />
            ))}
          </div>

          <p className="script mt-4 text-[21px] text-gold-warm/90">a voice message</p>
        </div>
      ) : (
        item.portrait && item.poster && (
          <div
            aria-hidden
            className="absolute inset-0 scale-125 bg-cover bg-center blur-2xl brightness-[0.5] saturate-[1.15]"
            style={{ backgroundImage: `url(${item.poster})` }}
          />
        )
      )}

      {isAudio ? (
        <audio
          ref={videoRef}
          src={armed ? item.src : undefined}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); onEnded?.(); }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || item.duration || 0)}
          onTimeUpdate={(e) => { if (!scrubbing) setTime(e.currentTarget.currentTime); }}
        />
      ) : (
        <video
          ref={videoRef}
          src={armed ? item.src : undefined}
          poster={item.poster || undefined}
          preload="none"
          playsInline
          className={`absolute inset-0 h-full w-full ${
            item.portrait ? 'object-contain' : 'object-cover'
          }`}
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); onEnded?.(); }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || item.duration || 0)}
          onTimeUpdate={(e) => { if (!scrubbing) setTime(e.currentTarget.currentTime); }}
        />
      )}

      {/* Big centre button before anything has been watched */}
      {!playing && !armed && !isAudio && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition hover:bg-black/15"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream/90 shadow-lg transition group-hover:scale-105">
            <span
              className="ml-1 block h-0 w-0"
              style={{
                borderLeft: '20px solid #5C1220',
                borderTop: '13px solid transparent',
                borderBottom: '13px solid transparent',
              }}
            />
          </span>
        </button>
      )}

      {/* Control bar */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2.5 pb-2 pt-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100"
        style={playing || armed ? undefined : { opacity: undefined }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="shrink-0 px-1 text-cream hover:text-gold-warm"
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2.5" y="1.5" width="4" height="13" rx="1" />
              <rect x="9.5" y="1.5" width="4" height="13" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 1.8v12.4a1 1 0 0 0 1.5.87l10.2-6.2a1 1 0 0 0 0-1.74L4.5.93A1 1 0 0 0 3 1.8z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={() => seekBy(-10)}
          aria-label="Back 10 seconds"
          className="shrink-0 px-1 text-cream hover:text-gold-warm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3V1L4.5 3.5 8 6V4a4 4 0 1 1-4 4H2.5a5.5 5.5 0 1 0 5.5-5z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => seekBy(10)}
          aria-label="Forward 10 seconds"
          className="shrink-0 px-1 text-cream hover:text-gold-warm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3V1l3.5 2.5L8 6V4a4 4 0 1 0 4 4h1.5A5.5 5.5 0 1 1 8 3z" />
          </svg>
        </button>

        <input
          type="range"
          min="0"
          max="1000"
          value={pct}
          onChange={onScrub}
          onPointerDown={() => setScrubbing(true)}
          onPointerUp={() => setScrubbing(false)}
          aria-label="Seek"
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full outline-none"
          style={{
            background: `linear-gradient(to right, ${
              isGold ? '#E8C46A' : '#F7F1E4'
            } ${pct / 10}%, rgba(247,241,228,0.28) ${pct / 10}%)`,
          }}
        />

        <span className="shrink-0 font-mono text-[11px] tabular-nums text-cream/80">
          {fmt(time)} / {fmt(duration)}
        </span>

        {/* Speed */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSpeedOpen((s) => !s)}
            aria-label="Playback speed"
            className="rounded px-1.5 py-0.5 text-[11px] font-bold text-cream hover:text-gold-warm"
          >
            {speed}×
          </button>
          {speedOpen && (
            <div className="absolute bottom-7 right-0 z-20 overflow-hidden rounded-md border border-gold/40 bg-ink/95 shadow-xl">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onSpeedChange?.(s);
                    setSpeedOpen(false);
                  }}
                  className={`block w-full px-3.5 py-1.5 text-left text-[12px] hover:bg-gold/20 ${
                    s === speed ? 'text-gold-warm' : 'text-cream/85'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onMutedChange?.(!muted)}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="shrink-0 px-1 text-cream hover:text-gold-warm"
        >
          {muted ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7 2.5 3.8 5.3H1.5v5.4h2.3L7 13.5zM10.3 6l3.2 4M13.5 6l-3.2 4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              <path d="M7 2.5 3.8 5.3H1.5v5.4h2.3L7 13.5z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7 2.5 3.8 5.3H1.5v5.4h2.3L7 13.5z" />
              <path d="M9.8 5.6a3.2 3.2 0 0 1 0 4.8M11.6 3.6a5.8 5.8 0 0 1 0 8.8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {!isAudio && (
        <button
          type="button"
          onClick={fullscreen}
          aria-label="Fullscreen"
          className="shrink-0 px-1 text-cream hover:text-gold-warm"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M1.8 5.5v-3.7h3.7M10.5 1.8h3.7v3.7M14.2 10.5v3.7h-3.7M5.5 14.2H1.8v-3.7" />
          </svg>
        </button>
        )}
      </div>
    </div>
  );
}
