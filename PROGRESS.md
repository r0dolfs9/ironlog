# IronLog — Progress Tracker

> Last updated: 2026-04-28
> GitHub: https://github.com/r0dolfs9/ironlog (master, 6 commits)

---

## Project Overview

**App:** IronLog — personal gym workout tracker
**Stack:** Vanilla HTML + CSS + JS, Chart.js, localStorage
**Current delivery format:** `ironlog-bundle.html` opened in an HTML viewer app on iPhone
**End goal:** PWA installed on homescreen → Android Play Store → iOS later

---

## What's Been Built (Working)

| Feature | Status |
|---|---|
| 4 workout splits (Back & Bis, Chest & Tris, Legs, Arms & Shoulders) | Done |
| 8 muscle group pages with collapsible exercise cards | Done |
| Exercise log form — sets, reps, weight, notes | Done |
| Pre-fill — ghost placeholder UX (field blank, last weight shown as placeholder) | Done |
| Rest timer — large prominent overlay countdown, skippable, configurable, optional | Done |
| PR detection toast ("New PR! Xkg") | Done |
| Workout streak counter in sidebar | Done |
| Session summary overlay (Finish button) | Done |
| History page — grouped by session, collapsible, deletable | Done |
| Progress page — charts, stats, exercise leaderboard | Done |
| Body weight page — log, chart, goal | Done |
| Recap page — high-value metrics (PRs, most improved, consistency, body weight trend) | Done |
| Customisable splits (edit mode) — labels, colour swatches, section reordering | Done |
| Micro-interaction CSS transitions (card expand, page switch, modal open) | Done |
| Empty states on all pages | Done |
| Session summary improvements (volume vs last session, muscles worked chips) | Done |
| Cardio block in every split | Done |
| Export / Import JSON | Done |
| Multi-profile support | Built but deprioritised |
| `parseNum()` — comma/period decimal separator fix | Done |
| Done-state (✓) preserved when adjusting set count | Done |
| Escape key closes all modal overlays | Done |

---

## Source Files

| File | Purpose |
|---|---|
| `index.html` | HTML structure |
| `style.css` | All styles |
| `app.js` | All app logic (~74KB) |
| `ironlog-bundle.html` | Single-file build (used on phone) |
| `IRONLOG_PROJECT.md` | Full project spec + roadmap |
| `CHANGES.md` | Feature spec: customisable splits + recap |
| `NOTES.md` | Feature reference + layout notes |

---

## ✅ Phase 1 — COMPLETE (all committed 2026-04-26)

All bugs and UX fixes shipped across 5 commits on master:

| Commit | What was fixed |
|---|---|
| `40044a5` | B1 — Landscape layout: overlay sidebar + compact topbar on rotated phone |
| `ef9caba` | B2 — Comma decimal separator fixed on all numeric inputs |
| `3c3c196` | B3 + B4 + U1 — Broken buttons, mobile tap targets, pre-fill UX |
| `0d1ef4d` | U2 + U3–U5 + P1 + P2 — Rest timer overhaul, edit mode, animations, empty states |
| `f90d923` | U6 + P3 — Recap quality, session summary improvements, rest timer hint |

**Definition of done met:** all priority bugs and UX issues resolved.

---

## → Phase 2 — PWA (Installable, Offline) [CURRENT PHASE]

- [x] Create GitHub repository — https://github.com/r0dolfs9/ironlog ✓
- [ ] Set up GitHub Pages (free HTTPS hosting) — NOT yet enabled
- [ ] Add `manifest.json` (name, icons, theme colour, display: standalone, orientation: portrait)
- [ ] Add service worker for offline caching (cache-first)
- [ ] Create app icons (192px + 512px)
- [ ] Test install on Android Chrome
- [ ] Test install on iPhone Safari

**Definition of done:** IronLog is on your homescreen. Opens offline. HTML viewer app no longer needed.

---

## Phase 3 — Warm-Up Sets [NOT STARTED]

- [ ] Warm-up toggle (off by default)
- [ ] 1–2 warm-up rows before first exercise of each muscle group per session
- [ ] Exclude from stats, PRs, volume calculations
- [ ] Show in history clearly labelled

---

## Phase 4 — Notifications [NOT STARTED, requires Phase 2]

- [ ] "You haven't logged in X days" push notification
- [ ] Rest timer end alert (vibrate + sound)
- [ ] Streak milestone notifications (7 days, 30 days)
- [ ] PR share card (generate shareable image)

---

## Phase 5 — Android Play Store [NOT STARTED, requires Phase 2]

- [ ] Wrap PWA with Bubblewrap / TWA
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Write store listing
- [ ] Test on sister's Android
- [ ] Submit for review

---

## Open Questions (resolve before Phase 2)

- [ ] Final app name: IronLog, or explore alternatives?
- [ ] App icon: barbell or bolt shape, lime on dark background
- [ ] GitHub username (determines GitHub Pages URL)
- [ ] Design files from Claude Design — need to be referenced here once located

---

## Design System (settled)

**Colours:** dark-only, `#0c0c0c` background, `#c9ff47` lime accent, per-muscle-group accent colours
**Fonts:** Syne 700/800 (headings) · DM Sans 300–600 (body) · DM Mono 400/500 (numbers)
**Layout:** sidebar + topbar on desktop, hamburger overlay on mobile

---

## Decisions Already Made (don't revisit)

- Vanilla HTML/CSS/JS — no framework
- Dark only — no light mode
- Android Play Store first via Bubblewrap TWA (free, no rewrite)
- PWA on GitHub Pages as the hosting layer
- Multi-profile deprioritised — everyone uses their own phone
- NOT building: plate calculator, video guidance, social feed, light mode, 12-week programs, subscription

---

## Session Log

### 2026-04-28 — Phase 2 PWA fully shipped

DONE:
- manifest.json — standalone display, portrait lock, #0c0c0c theme, icon refs
- sw.js — cache-first service worker, caches all app assets + Chart.js CDN
- icons/icon-192.png + icon-512.png — generated and pushed
- index.html — manifest link, apple-touch-icon, theme-color meta, SW registration
- GitHub Pages enabled on master/root → app live at r0dolfs9.github.io/ironlog
- "Show JSON (copy)" + "Paste JSON" buttons added to sidebar (clipboard-based transfer)
- data-extractor.html — standalone file to extract localStorage from HTML Viewer app

NEXT STEPS:
1. Transfer data-extractor.html to iPhone via AirDrop/email
2. Open in same HTML Viewer app → tap "Read My Data" → copy JSON
3. Open r0dolfs9.github.io/ironlog → Paste JSON → import
4. Verify all workouts are there
5. Install PWA: Safari → Share → Add to Home Screen
6. Stop using the HTML Viewer app

### 2026-04-28 — Progress file created + GitHub repo audited
- Read IRONLOG_PROJECT.md, CHANGES.md, NOTES.md, STATUS.md.txt
- Checked GitHub: https://github.com/r0dolfs9/ironlog — 6 commits on master, all Phase 1 work is shipped
- Phase 1 is COMPLETE — all bugs (B1–B4) and UX fixes (U1–U6) and polish (P1–P3) committed Apr 26
- Phase 2 is next: GitHub repo exists but GitHub Pages not yet enabled
- Design files created in Claude Design (separate session, need to be referenced here)
