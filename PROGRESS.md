# IronLog — Redesign Progress

## Current files
- **`IronLog v2.html`** — working source file (edit this one)
- **`index.html`** — copy of v2 for GitHub Pages
- **`sw.js`** — service worker (offline cache, bump `CACHE` const to force PWA reload)
- **`manifest.json`** — PWA manifest (TODO — currently inline data: URL inside HTML)
- **`icon-192.png` / `icon-512.png`** — standard PWA icons (lime IL on dark)
- **`icon-maskable-192.png` / `icon-maskable-512.png`** — maskable variants (full-bleed, 80% safe zone)
- **`IronLog.html`** — v1 reference, do not edit
- `uploads/` — original app + screenshots

## How to publish to GitHub Pages
- Account: **`r0dolfs9`**
- Repo: `r0dolfs9.github.io/<reponame>` (whatever you named it)
- Files that must be uploaded together to the repo root:
  - `index.html`
  - `sw.js`
  - `manifest.json`
  - `icon-192.png`
  - `icon-512.png`
  - `icon-maskable-192.png`
  - `icon-maskable-512.png`
- Workflow: download those files from this project, drop them into the repo (replacing existing), wait ~30s, hard-refresh the live URL.
- After a deploy, on the phone: long-press the PWA → uninstall → reopen URL in Chrome → "Install app" should appear (now that manifest + icons are real files, not data: URLs).

---

## Shipped ✅

### v2 core (14)
1. ✅ `color-scheme: dark` meta
2. ✅ Bounce + glow + 20ms vibrate on ✓ tap
3. ✅ Rest timer tap-outside dismiss + 5-pulse end vibrate
4. ✅ Trend dot on exercise cards
5. ✅ BW chart above log form
6. ✅ Empty sidebar state w/ CTA
7. ✅ 7-day history strip (timezone-safe)
8. ✅ Session duration tracking
9. ✅ Personal Records page
10. ✅ Finish summary redesign
11. ✅ Fullscreen chart on Progress tap
12. ✅ Chart skeleton shimmer
13. ✅ Swipe-left-to-delete history
14. ✅ Drag-to-reorder sections

### Polish + Features (P1-P4, F1-F4)
- P1 Records rows tappable → fullscreen chart
- P2 Skeleton on BW + fullscreen chart
- P3 Pointer-event drag fallback (iOS)
- P4 `.page.active` opacity-stuck fix
- F1 JSON export/import (sidebar footer)
- F2 Rest timer presets (60/90/120/180s)
- F3 Per-session note in summary modal
- F4 PWA: inline manifest + iOS meta + sw.js

### Round 2 (N1, N3, N4, N5, B5, B6, B4-part1)
- ✅ N1 Auto-rest on weight `onchange` — types weight → set marked ✓ + timer starts + buzz
- ✅ N3 BW diff color hardened — case-insensitive, accepts `gain`/`up` and `lose`/`down`
- ✅ N4 Same exercise + same date + same split → appends sets to existing entry (notes joined)
- ✅ N5 BW exercise autofill — name match: pull-up / chin-up / push-up / dip / muscle-up / "bw" / "bodyweight" → pre-fills weight value+placeholder with latest `DB.bodyWeights`
- ✅ B5 Removed misleading "Volume kg" stat from Recap
- ✅ B6 BW +/- color flips with goal direction
- ✅ B4-part1 Time-based rest timer (`restEndsAt`) survives iOS backgrounding
- ✅ N6 Yellow trend dot for ±2% (maintained)
- ✅ Icons generated: `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`

---

## In flight 🔧

### Install + background reliability (shipped this batch ✅)
- ✅ Real `manifest.json` (icons + standalone + theme color) — Android Chrome's "Install app" prompt now fires.
- ✅ Inline `data:` manifest removed from HTML head (was preventing installability).
- ✅ `<link rel="apple-touch-icon" sizes="192/512">` for iOS home-screen icon.
- ✅ Real PNG icons (192/512 + maskable variants) — home-screen icon now renders, no more blank/letter fallback.
- ✅ Rest timer alarm via dedicated `setTimeout` (separate from the 250ms tick) — fires even after long background suspension.
- ✅ Service worker `showNotification('Rest over — go! 💪', …)` when page is hidden + Web Notification when foregrounded.
- ✅ `notificationclick` SW handler — tap notification focuses/opens the PWA.
- ✅ One-time `Notification.requestPermission()` prompt on first rest start.
- ✅ Wake Lock API during active rest — keeps screen on so the ring is visible.
- ✅ `visibilitychange` listener re-syncs UI + reacquires wake lock when returning from background.
- ✅ `sw.js` cache bumped to `ironlog-v8` (covers manifest + new icons).

### Still pending (round 2 leftover)
- [ ] N2 — Notification on rest end (covered by the batch above)
- [ ] N7 — Markdown export for AI analysis (compile workouts + bw + notes → single .md)

---

## Suggested next order
1. Finish install + notification batch (this turn)
2. Verify on a real Android home-screen install
3. N7 (AI markdown export) — useful, isolated change
