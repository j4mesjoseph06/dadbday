#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   npm run media

   Compresses everything in photos/ and videos/ into public/assets/ and writes
   src/data/generated/media.json, which is the only thing the site reads.

   Video goes through ffmpeg/ffprobe on PATH. Photos go through sharp, which
   is a normal npm dependency rather than an external binary — it installs with
   the project and behaves the same on Windows, macOS and Linux.

   (Photos used to shell out to ImageMagick. That breaks on Windows, and badly:
   `identify` simply isn't there, while `convert` silently resolves to the
   Windows disk-conversion tool of the same name in System32, so the wrong
   program runs without error.)

   Safe to re-run: an output newer than its source is left alone. Drop the
   cinema film in as videos/cinema.mp4 and run it again.

   MEDIA_BASE_URL switches where the site looks for media. Unset, media.json
   points at /assets/... and the site serves everything itself — that's local
   development. Set to the R2 bucket URL, it emits absolute URLs and the files
   are served from object storage instead, which is how it's deployed.
   ───────────────────────────────────────────────────────────────────────── */

import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/* sharp is loaded only when a photo actually needs re-encoding. It ships a
   native binary built for one platform, so importing it up front makes the
   whole script — including the video-only path, which never touches it —
   unrunnable anywhere the installed binary doesn't match. */
let _sharp;
async function getSharp() {
  if (!_sharp) _sharp = (await import('sharp')).default;
  return _sharp;
}

/* TIME_BUDGET lets the job run in slices: it stops cleanly when the budget is
   spent and picks up where it left off next time, because anything already
   encoded is skipped. */
const BUDGET_MS = (parseFloat(process.env.TIME_BUDGET) || 0) * 1000;
const STARTED = Date.now();
class OutOfTime extends Error {}
function checkTime() {
  if (BUDGET_MS && Date.now() - STARTED > BUDGET_MS) throw new OutOfTime();
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* Encoding writes thousands of small seeks. On a mounted/synced folder that
   crawls, so OUT_DIR points this at fast local disk and the results are copied
   across in one bulk pass afterwards. */
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'assets');
const DATA = path.join(ROOT, 'src', 'data', 'generated', 'media.json');

/* Where the browser fetches media from.

   Read from media.config.json rather than an environment variable, because
   `MEDIA_BASE_URL=... npm run media` is a Unix-ism that doesn't work in the
   Windows shell. Pass --local to build URLs pointing at this site's own
   /assets instead, which is what you want while developing offline. */
function readBaseUrl() {
  if (process.argv.includes('--local')) return '';
  if (process.env.MEDIA_BASE_URL) return process.env.MEDIA_BASE_URL;
  const cfg = path.join(ROOT, 'media.config.json');
  if (!existsSync(cfg)) return '';
  try {
    return JSON.parse(readFileSync(cfg, 'utf8')).baseUrl || '';
  } catch {
    console.warn('  media.config.json is not valid JSON - falling back to local URLs');
    return '';
  }
}
const MEDIA_BASE_URL = readBaseUrl().replace(/\/+$/, '');
const url = (rel) => (MEDIA_BASE_URL ? `${MEDIA_BASE_URL}/${rel}` : `/assets/${rel}`);

/* ── what goes where ──────────────────────────────────────────────────────── */

// Video-message sections, in the order they appear down the page.
const MESSAGE_SECTIONS = [
  { id: 'elu',     dir: 'videos/elu',     heading: "From Elu's side" },
  { id: 'aniyara', dir: 'videos/aniyara', heading: "From Aniyara's side" },
  { id: 'friends', dir: 'videos/friends', heading: 'From your friends' },
];

// The birthday song — one wide solo tile at the very top, before Elu's side.
const OPENING = 'videos/first.mp4';

/* The photo gallery and its slideshow are out of this cut: the family wanted
   the videos, and most of those pictures appear in Mum's film anyway. Flip
   this to true and re-run to bring the whole gallery back. */
const INCLUDE_GALLERY = false;

// Gallery folders, in page order.
const GALLERY_DIRS = ['baby', 'couple', 'youngDad', 'family', 'recent'];

// Solo shots of Dad for the photobooth strip in the banner. Banner only —
// these same pictures already live inside the gallery folders.
const PHOTOBOOTH_DIR = 'photos/photoboothPics';

// Mum's film. Absent for now; the site renders a placeholder until it lands.
const CINEMA_CANDIDATES = ['videos/cinema.mp4', 'videos/cinema/cinema.mp4'];

// Background music for the gallery slideshow.
const SLIDESHOW_AUDIO = 'videos/jazz.mp3';

const SKIP_FILES = new Set(['Snapchat-295585392.mp4']);

/* `20.1` is a continuation of a clip that belongs BEFORE `20`, so natural
   sorting gets it wrong. Keys are "<section>/<basename>". */
const SORT_OVERRIDES = { 'elu/20.1': 19.5 };

/* ── encoder settings ─────────────────────────────────────────────────────── */

const MSG_MAX_W = 1280, MSG_MAX_H = 720, MSG_CRF = 25;
/* The film is a montage of stills shot at 60fps — half those frames are
   duplicates, so 30 costs nothing visually and halves both the encode and the
   file. */
const CINEMA_MAX_W = 1920, CINEMA_MAX_H = 1080, CINEMA_CRF = 22, CINEMA_FPS = 30;
const PHOTO_WIDTHS = [480, 1000, 1800];
const PHOTO_QUALITY = 74;
const BOOTH_WIDTH = 900;

const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm']);
const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);

/* ── helpers ──────────────────────────────────────────────────────────────── */

const log = (...a) => console.log(...a);
const mb = (n) => `${(n / 1048576).toFixed(1)}MB`;

/* For a filename, extension and all. */
function slug(name) {
  return slugBase(name.replace(/\.[^.]+$/, ''));
}

/* For a name whose extension has already been removed.

   These have to stay separate. A clip called `20.1.mp4` has a base of `20.1`,
   and running that through extension-stripping turns it into `20` — the same
   slug as its neighbour `20.mp4`. One file then silently overwrites the other
   and two tiles play the same clip. */
function slugBase(base) {
  return base.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'item';
}

/* Natural numeric sort: "9" before "10", "4.2" after "4". */
function sortKey(base, overrideKey) {
  if (overrideKey && overrideKey in SORT_OVERRIDES) return SORT_OVERRIDES[overrideKey];
  const n = parseFloat(base.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

async function listDir(rel, extSet) {
  const dir = path.join(ROOT, rel);
  if (!existsSync(dir)) return [];
  const names = await readdir(dir);
  return names
    .filter((n) => extSet.has(path.extname(n).toLowerCase()) && !SKIP_FILES.has(n))
    .map((n) => ({ name: n, base: n.replace(/\.[^.]+$/, ''), abs: path.join(dir, n) }));
}

async function isStale(src, out) {
  if (!existsSync(out)) return true;
  const [a, b] = await Promise.all([stat(src), stat(out)]);
  return a.mtimeMs > b.mtimeMs;
}

async function probe(file) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-show_entries', 'format=duration',
    '-of', 'json', file,
  ]);
  const j = JSON.parse(stdout);
  const s = (j.streams && j.streams[0]) || {};
  return {
    w: s.width || 0,
    h: s.height || 0,
    duration: parseFloat((j.format && j.format.duration) || 0),
  };
}

async function sizeOf(file) {
  try { return (await stat(file)).size; } catch { return 0; }
}

/* ── video ────────────────────────────────────────────────────────────────── */

async function encodeVideo(src, outMp4, outPoster, { maxW, maxH, crf, fps }) {
  if (await isStale(src, outMp4)) {
    await execFileAsync('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', src,
      '-vf',
      `scale=w='min(${maxW},iw)':h='min(${maxH},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2` +
        (fps ? `,fps=${fps}` : ''),
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf),
      '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.0',
      '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
      '-movflags', '+faststart',
      outMp4,
    ], { maxBuffer: 1 << 26 });
  }
  if (await isStale(src, outPoster)) {
    const { duration } = await probe(src);
    const at = duration > 2 ? Math.min(1.5, duration / 3) : 0;
    await execFileAsync('ffmpeg', [
      '-y', '-loglevel', 'error', '-ss', String(at), '-i', src, '-frames:v', '1',
      '-vf', `scale=w='min(${Math.round(maxW / 2)},iw)':h='min(${Math.round(maxH / 2)},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
      '-c:v', 'libwebp', '-quality', '62',
      outPoster,
    ], { maxBuffer: 1 << 26 });
  }
  return probe(outMp4);
}

/* ── photos ───────────────────────────────────────────────────────────────── */

/* A message with no video stream — someone sent a voice note rather than a
   clip. It gets its own tile on the page, so here it just needs the audio
   lifted out into something every browser can decode. */
async function encodeAudio(src, outMp3) {
  if (await isStale(src, outMp3)) {
    await execFileAsync('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', src,
      '-vn', '-map', '0:a:0',
      '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2',
      outMp3,
    ], { maxBuffer: 1 << 26 });
  }
  const { duration } = await probe(src);
  return { duration };
}

/* `.rotate()` with no argument applies the EXIF orientation flag that phone
   cameras set. Without it roughly half of these come out sideways. */
async function encodePhoto(src, outBase, widths) {
  const made = [];
  for (const w of widths) {
    const out = `${outBase}-${w}.webp`;
    if (await isStale(src, out)) {
      const sharp = await getSharp();
      await sharp(src)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: PHOTO_QUALITY })
        .toFile(out);
    }
    made.push(w);
  }
  /* Dimensions come back via ffprobe rather than sharp, so a run where every
     photo is already up to date never needs the native module at all. */
  const { w: pw, h: ph } = await probe(`${outBase}-${widths[0]}.webp`);
  return { aspect: +(pw / ph).toFixed(4), widths: made };
}

/* ── build ────────────────────────────────────────────────────────────────── */

async function run() {
  const t0 = Date.now();
  const out = { messages: [], sections: [], gallery: [], photobooth: [], cinema: null, audio: null };
  let srcBytes = 0, outBytes = 0;

  /* --- the birthday song, one wide solo tile at the top --- */
  const openingSrc = path.join(ROOT, OPENING);
  if (existsSync(openingSrc)) {
    const dest = path.join(OUT, 'messages', 'opening');
    await mkdir(dest, { recursive: true });
    const mp4 = path.join(dest, 'first.mp4');
    const poster = path.join(dest, 'first.webp');
    log('  video  opening/first');
    const meta = await encodeVideo(openingSrc, mp4, poster,
      { maxW: MSG_MAX_W, maxH: MSG_MAX_H, crf: MSG_CRF });
    srcBytes += await sizeOf(openingSrc);
    outBytes += await sizeOf(mp4);
    out.sections.push({ id: 'opening', heading: null, count: 1 });
    out.messages.push({
      id: 'opening/first', section: 'opening', kind: 'video', solo: true,
      src: url('messages/opening/first.mp4'),
      poster: url('messages/opening/first.webp'),
      w: meta.w, h: meta.h, duration: +meta.duration.toFixed(2),
      portrait: meta.h > meta.w,
    });
  }

  /* --- video messages --- */
  for (const section of MESSAGE_SECTIONS) {
    const dest = path.join(OUT, 'messages', section.id);
    await mkdir(dest, { recursive: true });

    /* Probe before sorting: a file with no video stream is a voice note, and
       those go to the end of their section rather than wherever their number
       would have put them. */
    const found = await listDir(section.dir, VIDEO_EXT);
    const files = [];
    for (const f of found) {
      const meta = await probe(f.abs);
      files.push({ ...f, meta, audioOnly: !meta.w || !meta.h });
    }
    files.sort((a, b) => {
      if (a.audioOnly !== b.audioOnly) return a.audioOnly ? 1 : -1;
      return sortKey(a.base, `${section.id}/${a.base}`) - sortKey(b.base, `${section.id}/${b.base}`);
    });

    out.sections.push({ id: section.id, heading: section.heading, count: files.length });

    for (const f of files) {
      checkTime();
      const id = `${section.id}/${f.base}`;
      const name = slugBase(f.base);

      if (f.audioOnly) {
        const mp3 = path.join(dest, `${name}.mp3`);
        log(`  audio  ${id}`);
        const { duration } = await encodeAudio(f.abs, mp3);
        srcBytes += await sizeOf(f.abs);
        outBytes += await sizeOf(mp3);
        out.messages.push({
          id, section: section.id, kind: 'audio', solo: false,
          src: url(`messages/${section.id}/${name}.mp3`),
          duration: +duration.toFixed(2),
        });
        continue;
      }

      const mp4 = path.join(dest, `${name}.mp4`);
      const poster = path.join(dest, `${name}.webp`);
      log(`  video  ${id}`);
      const meta = await encodeVideo(f.abs, mp4, poster, { maxW: MSG_MAX_W, maxH: MSG_MAX_H, crf: MSG_CRF });
      srcBytes += await sizeOf(f.abs);
      outBytes += await sizeOf(mp4);
      out.messages.push({
        id, section: section.id, kind: 'video', solo: false,
        src: url(`messages/${section.id}/${name}.mp4`),
        poster: url(`messages/${section.id}/${name}.webp`),
        w: meta.w, h: meta.h, duration: +meta.duration.toFixed(2),
        portrait: meta.h > meta.w,
      });
    }
  }

  /* --- cinema --- */
  const cinemaSrc = CINEMA_CANDIDATES.map((p) => path.join(ROOT, p)).find((p) => existsSync(p));
  if (cinemaSrc) {
    const dest = path.join(OUT, 'cinema');
    await mkdir(dest, { recursive: true });
    const mp4 = path.join(dest, 'cinema.mp4');
    const poster = path.join(dest, 'cinema.webp');
    log('  video  cinema');
    const meta = await encodeVideo(cinemaSrc, mp4, poster,
      { maxW: CINEMA_MAX_W, maxH: CINEMA_MAX_H, crf: CINEMA_CRF, fps: CINEMA_FPS });
    srcBytes += await sizeOf(cinemaSrc);
    outBytes += await sizeOf(mp4);
    out.cinema = {
      src: url('cinema/cinema.mp4'), poster: url('cinema/cinema.webp'),
      w: meta.w, h: meta.h, duration: +meta.duration.toFixed(2),
    };
  } else {
    log('  cinema film not found yet — placeholder will render');
  }

  /* --- slideshow music ---
     Stripped of its embedded cover art and re-encoded to AAC: the artwork is
     a PNG the browser would download and never show. */
  {
    const src = path.join(ROOT, SLIDESHOW_AUDIO);
    if (INCLUDE_GALLERY && existsSync(src)) {
      const dest = path.join(OUT, 'audio');
      await mkdir(dest, { recursive: true });
      /* MP3 rather than AAC-in-MP4: every browser decodes MP3, including
         builds without the proprietary codecs, and at 128k for a background
         jazz loop there is nothing to gain from the newer codec. */
      const outFile = path.join(dest, 'slideshow.mp3');
      if (await isStale(src, outFile)) {
        log('  audio  slideshow');
        await execFileAsync('ffmpeg', [
          '-y', '-loglevel', 'error', '-i', src,
          '-vn', '-map', '0:a:0',
          '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2',
          outFile,
        ], { maxBuffer: 1 << 26 });
      }
      const { duration } = await probe(src);
      out.audio = { slideshow: url('audio/slideshow.mp3'), duration: +duration.toFixed(2) };
      srcBytes += await sizeOf(src);
      outBytes += await sizeOf(outFile);
    }
  }

  /* --- gallery --- */
  for (const dirName of (INCLUDE_GALLERY ? GALLERY_DIRS : [])) {
    const rel = `photos/${dirName}`;
    const dest = path.join(OUT, 'gallery', dirName);
    await mkdir(dest, { recursive: true });

    const photos = (await listDir(rel, PHOTO_EXT)).sort((a, b) => {
      const d = sortKey(a.base) - sortKey(b.base);
      return d !== 0 ? d : a.base.localeCompare(b.base);
    });
    for (const f of photos) {
      checkTime();
      const base = path.join(dest, slug(f.name));
      const meta = await encodePhoto(f.abs, base, PHOTO_WIDTHS);
      srcBytes += await sizeOf(f.abs);
      outBytes += await sizeOf(`${base}-${PHOTO_WIDTHS[1]}.webp`);
      out.gallery.push({
        type: 'photo', group: dirName, id: `${dirName}/${slug(f.name)}`,
        base: url(`gallery/${dirName}/${slug(f.name)}`),
        widths: meta.widths, aspect: meta.aspect,
      });
    }
    log(`  photos ${dirName}: ${photos.length}`);

    // A stray clip living among the photos (youngDad) — shown inline as a tile.
    const clips = await listDir(rel, VIDEO_EXT);
    for (const f of clips) {
      checkTime();
      const mp4 = path.join(dest, `${slug(f.name)}.mp4`);
      const poster = path.join(dest, `${slug(f.name)}.webp`);
      log(`  video  gallery/${dirName}/${f.base}`);
      const meta = await encodeVideo(f.abs, mp4, poster, { maxW: MSG_MAX_W, maxH: MSG_MAX_H, crf: MSG_CRF });
      srcBytes += await sizeOf(f.abs);
      outBytes += await sizeOf(mp4);
      out.gallery.push({
        type: 'video', group: dirName, id: `${dirName}/${slug(f.name)}`,
        src: url(`gallery/${dirName}/${slug(f.name)}.mp4`),
        poster: url(`gallery/${dirName}/${slug(f.name)}.webp`),
        aspect: +(meta.w / meta.h).toFixed(4),
      });
    }
  }

  /* --- photobooth strip --- */
  {
    const dest = path.join(OUT, 'photobooth');
    await mkdir(dest, { recursive: true });
    const photos = (await listDir(PHOTOBOOTH_DIR, PHOTO_EXT)).sort((a, b) => a.base.localeCompare(b.base));
    for (const f of photos) {
      checkTime();
      const base = path.join(dest, slug(f.name));
      const meta = await encodePhoto(f.abs, base, [BOOTH_WIDTH]);
      out.photobooth.push({
        id: slug(f.name),
        base: url(`photobooth/${slug(f.name)}`),
        widths: meta.widths, aspect: meta.aspect,
      });
    }
    log(`  photobooth: ${photos.length}`);
  }

  await mkdir(path.dirname(DATA), { recursive: true });
  await writeFile(DATA, JSON.stringify(out, null, 2));

  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  log('');
  log(`  media URLs: ${MEDIA_BASE_URL || 'local (/assets/...)'}`);
  log(`  done in ${secs}s`);
  log(`  ${out.messages.length} message clips, ${out.gallery.length} gallery items, ${out.photobooth.length} booth shots`);
  log(`  video+photo source ${mb(srcBytes)} -> ${mb(outBytes)}`);
}

run().catch((e) => {
  if (e instanceof OutOfTime) {
    console.log('  time budget reached - rerun to continue');
    process.exit(3);
  }
  console.error(e);
  process.exit(1);
});
