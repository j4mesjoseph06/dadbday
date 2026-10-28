# Deploying

The site and its media live in two different places.

```
  Vercel                          Cloudflare R2
  ├─ index.html                   └─ v1/
  ├─ assets/index-*.js               ├─ messages/…   39 clips + 1 voice note
  └─ assets/index-*.css              ├─ cinema/…     Mum's film
     ~1 MB total                     └─ photobooth/… the banner strips
                                        ~225 MB total
```

Vercel serves about a megabyte of app. Every video is fetched straight from R2
by the browser, on demand, only once someone presses play — so the videos never
pass through Vercel and never count against its metered bandwidth.

`src/data/generated/media.json` is the join between the two: it holds the
absolute R2 URL of every file. It is generated, but it **is** committed, because
the app imports it at build time.

---

## One-off setup

### 1. R2 bucket

Already done — bucket created, public access on, serving at:

```
https://pub-cd0cad7c677f443583eb817896febd2f.r2.dev
```

That URL lives in `media.config.json`. If it ever changes, change it there and
re-run `npm run media`; nothing else refers to it.

### 2. Vercel

Import `j4mesjoseph06/dadbday` at vercel.com. It detects Vite on its own:

| setting | value |
|---|---|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

No environment variables needed — the R2 URLs are baked into `media.json` at
build time.

### 3. rclone, for the upload

```bash
rclone config create r2 s3 \
  provider=Cloudflare \
  access_key_id=YOUR_ACCESS_KEY \
  secret_access_key=YOUR_SECRET \
  endpoint=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com \
  region=auto
```

Access keys come from **R2 → Manage R2 API Tokens**; the account ID is in the
R2 sidebar.

---

## Publishing

### Media → R2

```bash
rclone sync public/assets r2:YOUR_BUCKET_NAME/v1 \
  --progress \
  --transfers 8 \
  --header-upload "Cache-Control: public, max-age=31536000, immutable"
```

`sync` makes the bucket match the folder, so anything you removed locally is
removed there too. Use `copy` instead of `sync` if you'd rather never delete.

The long cache header is safe because of the `v1/` prefix: files are treated as
permanent. **If you ever replace a file keeping its name, bump the prefix** —
`v2` in `media.config.json` and in the `rclone` path — rather than fighting a
year-long cache.

### Site → Vercel

```bash
git add -A
git commit -m "..."
git push
```

Vercel builds and deploys on push.

---

## Day-to-day

**Changed or added a video?**

```bash
npm run media     # re-encodes only what changed, rewrites media.json
rclone sync …     # as above
git add -A && git commit -m "new clips" && git push
```

**Working locally without the internet?**

```bash
npm run media:local   # media.json points at /assets/... instead
npm run dev
```

Run `npm run media` again before you push, or you'll deploy a site pointing at
URLs that only exist on your laptop. The script prints which mode it used on
the last line — check it.

---

## Notes

- `public/assets/` is **not** in git. It's 225 MB; the repo holds the app only.
  The folder stays on your disk for local development, and R2 is where the
  deployed site reads it from.
- Vite copies everything under `public/` into `dist/`, so a local `npm run
  build` produces a `dist/` with all the video in it. That's harmless when you
  deploy by pushing to Git — Vercel clones the repo, which doesn't contain
  `public/assets` — and `.vercelignore` covers the case where you run `vercel`
  from this folder directly. Deployed, `dist/` is about 1 MB.
- The photo gallery and slideshow are excluded from this cut. `INCLUDE_GALLERY`
  at the top of `scripts/build-media.mjs` turns them back on.
- Re-running `npm run media` skips anything already encoded, comparing
  modification times. If you ever suspect a stale output — a clip whose length
  doesn't match its source — delete that file from `public/assets` and re-run.
