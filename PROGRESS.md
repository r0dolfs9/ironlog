# IronLog — Redesign Progress

## Current files
- **`IronLog v2.html`** — working source file (edit this one)
- **`index.html`** — copy of v2 for GitHub Pages
- **`sw.js`** — service worker (offline cache, bump `CACHE` const to force PWA reload)
- **`manifest.json`** — PWA manifest (real file, not inline data: URL)
- **`icon-192.png` / `icon-512.png`** — standard PWA icons (lime IL on dark)
- **`icon-maskable-192.png` / `icon-maskable-512.png`** — maskable variants (full-bleed, 80% safe zone)
- **`IronLog.html`** — v1 reference, do not edit
- **`IronLog v3 mockup.html`** — v3 redesign mockup (reference only)
- **`v3-plan.md`** — v3 redesign spec

## How to publish to GitHub Pages
- Repo: **`github.com/r0dolfs9/ironlog`** → live at **`r0dolfs9.github.io/ironlog`**
- Edit workflow: edit `IronLog v2.html` → copy to `index.html` → bump `CACHE` in `sw.js` → commit + push
- After a deploy, on the phone: hard-refresh or reinstall PWA.

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

### Still pending
- [ ] N7 — Markdown export for AI analysis (compile workouts + bw + notes → single .md)

---

## Next up
1. N7 — Markdown export (isolated change, high value)
2. Verify PWA install on real Android device after latest push
3. v3 redesign — start Phase 1 (palette + fonts + bottom tabs) when ready

## Session log

### 2026-05-12 — Repo synced, old files cleaned
- Cloned repo to `C:\Users\User\ironlog`
- Synced all latest files from zip (IronLog v2.html, icons, manifest, sw.js v8, v3 mockup + plan)
- Removed outdated files: `icons/` folder (old small icons), `CHANGES.md`, `IRONLOG_PROJECT.md`, `NOTES.md`, `STATUS.md.txt`
- Committed + pushed — GitHub Pages now live with full v2 build
