# Production Readiness Review

**Date:** 2026-06-12
**Version reviewed:** 1.22.8 (branch `main`, commit `b33a8a9`)
**Scope:** Full review of offline/PWA capability, slicing/G-code pipeline, error handling, security, and build/test health.

## Resolution Notes (2026-06-12, commit `1fca44b`)

| # | Status | Notes |
|---|--------|-------|
| 1 | Fixed | Added `<link rel="manifest">` to `index.html` and `help.html` |
| 2 | Won't fix | Chrome prompts for permission on HTTP local-network requests; no change needed |
| 3 | Fixed | `.map` files filtered from precache in `vite-sw-plugin.ts`; extra STLs removed from `vite.config.ts` (only `test_stl_file.stl` kept) |
| 4 | Won't fix | `skipWaiting` kept intentionally for less user interruption |
| 5 | Fixed | Entire DONE branch in `src/renderer.ts` wrapped in try/finally; progress bar and worker always reset on error |
| 6 | Fixed | Empty slice result now throws a user-visible error before G-code generation |
| 7 | Fixed | `store.ts` top-level `initData()` caught with alert instead of silently killing the page; `PrintObject.#showError` now calls `alert()` |
| 8 | Fixed | SW fetch handler now skips non-same-origin requests (`url.origin !== self.location.origin`) |
| 9 | Deferred | Firmware flow intentionally unfinished; comes later |

---

## Verdict

Not production-ready yet. The code quality, testing, and CI are in good shape (build, type checks, and all 305 tests pass cleanly), but there are genuine production blockers — mostly around the PWA/offline story and the HTTPS-vs-printer architecture: the PWA is currently not installable, the service worker ships ~5 MB of sourcemaps to every client, the update flow can break a running session, and there is an unresolved architectural conflict between HTTPS (required for offline) and HTTP printer communication.

## Critical

### 1. The PWA is not installable — no `<link rel="manifest">` anywhere

`public/manifest.webmanifest` exists and is even precached by the service worker, but none of the three HTML files reference it. Browsers will never see it, so there's no install prompt, no standalone mode, no home-screen icon. Add `<link rel="manifest" href="/manifest.webmanifest">` to `index.html` (and ideally `help.html`).

Related: `index.html:11-12` references `/apple-touch-icon.png` and `/mask-icon.svg`, neither of which exists in `public/` — both 404.

### 2. Printer communication will likely be blocked when the app is served over HTTPS

Offline/PWA support requires HTTPS, but `src/3d/printerApi.ts` fetches `http://<printer-ip>/rr_*`. An `http:` fetch from an `https:` page is active mixed content and is blocked by Chrome, Firefox, and Safari before the request even leaves the page — the "skip printer IPs" logic in `public/sw-template.js:85-101` never gets a chance to matter. Chrome's Private Network Access rules add a second layer of blocking for public→local requests.

This means the deployed (Vercel/HTTPS) app can render and slice but **cannot send to the printer** — the core function. Options:

- Serve the app from the printer's LAN over plain HTTP (sacrificing the service worker, which only registers on HTTPS/localhost)
- Put a TLS proxy in front of the Duet
- Package the app (Electron/Tauri) where mixed-content rules don't apply

Verify this on real hardware before anything else, because it determines the whole deployment story.

### 3. The service worker precaches all sourcemaps — ~5.3 MB wasted per client, per update

`vite-sw-plugin.ts:18` takes every bundle key, including `.map` files. The generated `dist/sw.js` confirms it: `main.js.map` (1.7 MB), `three.js.map` (3 MB), `sliceWorker.js.map`, etc. Combined with 5.4 MB of sample STLs and the cache version containing `Date.now()` (so **every** build invalidates everything), each release re-downloads ~20 MB.

Filter `.map` files out of the asset list, and consider whether all four demo STLs belong in the precache.

### 4. The update flow can break an actively running session

`public/sw-template.js` uses `skipWaiting()` + `clients.claim()` + immediate deletion of old caches on activate. When an update lands mid-session, the old page is still running, but its hashed lazy assets (the `Settings` chunk, the slice worker module, fonts) are deleted from cache. If the user is offline or the server has dropped the old hashes, lazy loads fail until reload. The update banner mitigates this, but it auto-dismisses after 30 seconds (`src/web-components/UpdateNotification.ts:40-45`).

Either drop `skipWaiting` so the new SW activates on next navigation, or reload automatically on `controllerchange`, and make the banner persistent.

## High

### 5. Slicing errors leave the UI stuck

In `src/renderer.ts:204-253`, only G-code *delivery* is wrapped in try/catch. If `blendHardEdges`, `calculateFeedratePerLevel`, or `generateGCode` throws inside the async `onmessage` handler, the progress bar stays up forever, the worker is never terminated, and the user gets nothing — the try/catch around `slicingAction()` at the button level can't catch errors from that callback. Wrap the whole DONE branch and `reset()`/`terminate()` in a `finally`.

### 6. An empty slice result still produces and sends G-code

`vaseMode` in `src/3d/sliceWorker.ts:107-109` bails out of a layer (or returns `[]` entirely) when ray casts miss. The main thread doesn't check for an empty/short result — it will happily generate a header + transition layer + end sequence and upload it to the printer. For a device that extrudes hot plastic onto a prosthetic cup, guard `data.length === 0` (and arguably a minimum layer count) with a user-facing error.

### 7. No user-visible error surface for initialization/database failures

`src/db/store.ts:70` does a top-level `await initData()`; if IndexedDB is unavailable (Firefox private browsing, storage pressure, corrupted DB), the module rejection kills the entire `renderer.ts` import chain and the user gets a dead page with the loading spinner state. Similarly, `PrintObject.#showError` (`src/classes/PrintObject.ts:147-149`) only writes to `console.error`, so "Failed to save file to database" and friends are invisible. The log interceptor is a nice foundation — pair it with a simple visible error banner.

### 8. Cross-origin responses are cached forever by the cache-first strategy

The service worker fetch handler caches *any* successful GET — including `https://api.github.com/.../releases/latest` used by the firmware-update check. Cache-first means the "latest firmware" answer is frozen at whatever was first cached until the next app release rotates the cache. Limit SW caching to `location.origin`, or use network-first for non-origin requests.

### 9. The firmware flow looks unfinished

`public/firmware/release.json` contains placeholder data (`"test"`, version `0.0.0`, empty URL). If the Settings firmware-update path reads this in production, it should be populated or the feature gated before release. Also note `getLatestFirmwareRelease` is unauthenticated GitHub API (60 req/hr/IP rate limit) and online-only.

## Medium

- **Offline gaps in precache**: the Inter fonts (`/Inter/*.ttf`, referenced from `src/global-style.css`) and `/styles/update-notification.css` (loaded inside the UpdateNotification shadow DOM) aren't in the `staticAssets` list. They get runtime-cached only after first use, and a cache-version bump evicts them — a user who updates online and then goes offline loses fonts and banner styling.
- **Duplicate element**: `index.html` has `<app-info>` twice (lines 151 and 155). If its shadow-DOM-external behavior involves IDs or singleton assumptions, this is a latent bug; at minimum it's dead weight.
- **Printer reconnect gives up permanently**: after 10 failed retries (`src/utils/handlePrinterConnection.ts:65-77`), polling stops until the user edits the IP field. Consider resuming on `window` `online` events or a slow background interval, since "printer powered on after the app" is a normal sequence in a clinic.
- **No security headers**: `vercel.json` only sets `installCommand`. Adding `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, and an explicit `Cache-Control: no-cache` on `/sw.js` would harden the deployment cheaply.
- **`navigator.onLine` is unreliable** as the sole signal for the OfflineIndicator (it reports "online" when connected to a router with no internet — exactly the clinic LAN scenario). A periodic fetch probe of a tiny same-origin resource is more truthful.

## Low / nits

- `index.html:8` — `<meta description="...">` is invalid; should be `<meta name="description" content="...">`.
- `manifest.webmanifest` — `short_name: "PP"` is what appears under the installed icon; icons lack `"purpose": "maskable"`; no `id` field.
- `help.html` SW comment says "both HTTPS and localhost" but the code registers only on HTTPS.
- Dead `sync`/`push` listeners in `public/sw-template.js:169-178`.
- `hotkeys("ctrl+shift+r")` re-implements a native browser shortcut — unnecessary and can mask hard-refresh.
- `src/utils/logInterceptor.ts` log array grows unbounded for the session; cap it (e.g., ring buffer of 5k entries).
- `generateGCodeButton` is cast to `HTMLInputElement` but is a `<button>` — harmless but misleading.

## What's already in good shape

- Tests: 305 passing across 23 files, with real coverage of geometry and G-code math
- Clean `tsc` + Biome checks
- Fast, reproducible production build
- Tag-vs-version validation in the release workflow
- BVH-accelerated slicing offloaded to a Web Worker
- Consistent geometry/material disposal
- IndexedDB persistence with a versioned schema and a documented migration
- Genuine accessibility effort (aria attributes, reduced-motion handling, focus management)

## Suggested priority order

1. Fix the manifest link (#1 — five minutes)
2. Strip sourcemaps from the precache (#3 — one line in `vite-sw-plugin.ts`)
3. Resolve the HTTPS/printer question (#2) on real hardware — its answer may change how much the rest of the PWA work matters
