# achaBday

A one-night birthday site for Acha's 50th. Works on laptop and phone.

## Running it

```bash
npm install     # first time only
npm run dev     # then open the URL it prints
```

For the night itself, build it once and serve the built copy — it's faster
and nothing can recompile mid-evening:

```bash
npm run build
npm run preview
```

## The shape of it

| Screen | Route | What it is |
|---|---|---|
| Gift box | `#/` | Three taps, the lid floats off, balloons, the page lifts into the hub |
| Hub | `#/hub` | Three icons: messages, the film, the gallery |
| Video messages | `#/messages` | 38 clips in sections — Elu, Aniyara, friends, then the closing one |
| Cinema | `#/cinema` | Mum's film, gift-wrapped, one click to open |
| Gallery | `#/gallery` | 152 photographs, plus slideshow mode |

Routes are hash-based, so you can jump straight to any screen while working,
and a refresh keeps you where you were.

## Things you'll want to edit

**`src/data/content.js`** — the things you set by hand: which five of Dad's
solo shots appear in the photobooth strips (the file lists every available
name), the banner wording for each page, and the sign-off at the foot of the
video messages page.

**`src/index.css`** — all the colour, the wrapping paper and the letter paper.
`.wrap-full` is the full-strength diagonal stripe used on the gift box and the
banner edges; `.wrap-calm` is the same design with thinner gold, used on the 38
video frames so the page doesn't shout. `.banner-paper` and `.letter-paper` are
the aged cream sheets.

The page backdrop is deliberately a flat colour with a polka pattern pinned to
the viewport (`background-attachment: fixed`) rather than a gradient. Two
full-screen panels slide past each other during the gift-box transition, and
anything that moves with the panels makes the seam between them obvious.

## Music

The gallery slideshow plays `videos/jazz.mp3`, re-encoded to MP3 and stripped of
its embedded cover art. It's MP3 rather than AAC on purpose: every browser
decodes MP3, and at 128k for a background loop there's nothing to gain from the
newer codec. There's a music toggle next to "Esc to exit".

## Adding Mum's film

Drop it in as `videos/cinema.mp4`, then:

```bash
npm run media
```

It gets encoded at 1080p with the index moved to the front of the file, so it
starts instantly rather than buffering. The cinema page picks it up on its own —
until then that page shows a placeholder.

## The media pipeline

`npm run media` reads `photos/` and `videos/`, compresses everything into
`public/assets/`, and writes `src/data/generated/media.json`, which is the only
thing the site actually reads. It needs `ffmpeg` and ImageMagick on PATH.

It's safe to re-run: anything already encoded and newer than its source is
skipped, so adding one clip only encodes that clip.

Source media is excluded from git — the compressed copies in `public/assets`
are what the site serves. Current run: **1.1 GB in, 117 MB out.**

Two things worth knowing if you ever change it:

- It never upscales. Most of these clips are small to begin with, and blowing
  them up to 720p spent bitrate on invented pixels — fixing that alone cut the
  output by about three quarters.
- Photos go through ImageMagick rather than ffmpeg, because ffmpeg ignores the
  EXIF rotation flag that phone cameras set. Without `-auto-orient` roughly half
  of these came out sideways.

## Order

Videos and photos sort naturally by number. One exception is hard-coded in
`scripts/build-media.mjs`: `elu/20.1` plays *before* `elu/20`. If you add more
numbered-with-a-decimal files, check `SORT_OVERRIDES`.

## On phones

The site is responsive rather than desktop-only. Three things behave
differently on a narrow screen, and they're worth knowing about if you change
the layout later:

- **One clip per row** instead of two. That's decided in JavaScript, not CSS,
  because the row structure is also what the autoplay scrolling steps through —
  a CSS-only change would leave the scrolling stepping two tiles at a time.
- **The control bar is always visible.** On desktop it fades in on hover; a
  finger produces no hover, so under `@media (hover: none)` it stays up. Without
  that the controls would simply never appear on a phone.
- **Autoplay can be refused.** iOS blocks a `play()` that isn't closely tied to
  a tap, which would otherwise stall the chain on a tile that looks like it
  should be playing. When that happens the play button comes back so one tap
  resumes it.
