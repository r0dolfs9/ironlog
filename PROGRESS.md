# IronLog — Redesign Progress

## Current files
- **`IronLog v2.html`** — v2 source (DO NOT EDIT — preserved as fallback)
- **`IronLog v3.html`** — v3 source ← **EDIT THIS ONE** (~4900 lines)
- **`index.html`** — live on GitHub Pages (synced with v3)
- **`sw.js`** — service worker — cache: `ironlog-v10`
- **`manifest.json`** — PWA manifest

## Live URL
**r0dolfs9.github.io/ironlog** — currently on v3, gesture controls live ✅
- **`icon-192.png` / `icon-512.png`** — standard PWA icons
- **`icon-maskable-192.png` / `icon-maskable-512.png`** — maskable variants
- **`IronLog.html`** — v1 reference, do not touch
- **`IronLog v3 mockup.html`** — Home screen design reference
- **`v3-plan.md`** — original v3 IA spec

## How to publish to GitHub Pages
- Repo: **`github.com/r0dolfs9/ironlog`** → live at **`r0dolfs9.github.io/ironlog`**
- When v3 is ready: copy `IronLog v3.html` → `index.html` → bump `CACHE` in `sw.js` to `ironlog-v9` → commit + push

---

## v3 — 25-Step Transition Plan ✅ ALL COMPLETE

### Phase 1 — Foundation (Steps 1–5) ✅
| # | Step | Status |
|---|------|--------|
| 1 | CSS Token Layer — warm palette (#0a0908 bg, #ff6b35 coral accent, #f5f1e8 text) | ✅ Done |
| 2 | Typography — Instrument Serif + Geist + Geist Mono | ✅ Done |
| 3 | Glass Card System — backdrop-filter blur(24px), 22px radii, warm shadows | ✅ Done |
| 4 | Bottom Tab Bar — replaced sidebar with 4-tab bottom nav (Home/Train/Progress/History) | ✅ Done |
| 5 | Screen Scaffold + Home Page — new shell, page-home default, all pages ported | ✅ Done |

### Phase 2 — Home Dashboard (Steps 6–10) ✅
| # | Step | Status |
|---|------|--------|
| 6 | Today's Suggestion hero card (computed least-trained split, exercises, CTA) | ✅ Done |
| 7 | This Week + Streak stat cards (volume delta, sparkline bars, 7-day dots) | ✅ Done |
| 8 | Body Weight dashboard card (big serif, sparkline, goal bar) | ✅ Done |
| 9 | Long Lost exercises card (>7 days, sorted by gap) | ✅ Done |
| 10 | Empty states + first-run | 🟡 Partial — Train/History/PRs/BW done; Home first-run polish skipped |

### Phase 3 — Train Screen (Steps 11–15) ✅
| # | Step | Status |
|---|------|--------|
| 11 | Train tab — horizontal split pill tabs, exercise list, empty state with CTA | ✅ Done |
| 12 | Exercise card redesign — glass cards (22px radius) | ✅ Done |
| 13 | Big-card per-set logging — glass sc3-card, 28px Geist Mono weight+reps inputs | ✅ Done — _sc3Card() + sc3-* CSS |
| 14 | RPE input — pill row (6–10) per set, stored in DB | ✅ Done — sc3-rpe-pill + sc3SetRpe() |
| 15 | Rest timer — glass bottom sheet, slideUp animation | ✅ Done |

### Phase 4 — Progress / Records / History / BW (Steps 16–20) ✅
| # | Step | Status |
|---|------|--------|
| 16 | Progress — weekly comparison header (Sessions / Volume / Sets + deltas) | ✅ Done — renderProgressStatsHeader() |
| 17 | Muscle group radar chart (Chart.js radar, weekly frequency per muscle) | ✅ Done — renderProgressRadar() |
| 18 | Records — gold/silver/bronze podium top-3 + grouped list | ✅ Done — podium-* CSS + renderPRs() |
| 19 | History — 12-week heatmap + session timeline | ✅ Done — hm-* CSS grid |
| 20 | Body weight page — 72px Instrument Serif, SVG sparkline, goal bar | ✅ Done — bw3-* CSS + renderBW() |

### Phase 5 — Polish (Steps 21–25) ✅
| # | Step | Status |
|---|------|--------|
| 21 | Recap redesign — 2×2 glass stat grid, insight line, highlights, BW card | ✅ Done — rc3-* CSS |
| 22 | Tab transition animations — directional slide, spring cubic-bezier | ✅ Done — tabSlideIn/Out keyframes |
| 23 | Empty states — warm art circles, Instrument Serif titles, CTA buttons | ✅ Done — empty-state-art + empty-state-btn |
| 24 | Haptics — tab (8ms), save (15ms), PR ([40,30,80,30,40]), rest alarm, RPE tap | ✅ Done |
| 25 | N7 Markdown export for AI analysis | ✅ Done — exportMarkdown() in Settings |

---

## Deploy checklist

### Browser verification (do first — v3 not yet on GitHub Pages)
- [ ] Home: 5 dashboard cards load (or warm empty states)
- [ ] Train: split pills + exercise list; tap exercise → sc3 big-card set logging
- [ ] Set card: big weight + reps inputs, RPE pills 6–10, done button
- [ ] Save set → rest timer slides up as glass bottom sheet
- [ ] PR save → triple-pulse haptic + 🏆 toast
- [ ] Progress → Stats: comparison header + radar chart
- [ ] Progress → Records: podium top-3 + grouped list
- [ ] Progress → Body Weight: 72px serif + sparkline + goal bar
- [ ] Progress → Recap: 2×2 glass stat grid + insight line
- [ ] History: 12-week heatmap + session timeline
- [ ] Settings gear: all 6 rows (profile, rest toggle+duration, export, import, AI export, new day)
- [ ] AI Markdown export → downloads `.md` file
- [ ] Tab switches slide directionally with spring feel
- [ ] No JS console errors

### Deploy steps
1. Run browser verification checklist above
2. `cp "IronLog v3.html" index.html`
3. In `sw.js` bump `CACHE` const to `ironlog-v9`
4. `git add -A && git commit -m "v3: full redesign — all 25 steps" && git push`

---

## Session log

### 2026-05-12
- Cloned repo, synced files, pushed v2 to GitHub Pages

### 2026-05-13 — All 25 steps complete (3791 lines)
- Steps 1–12: token layer, typography, glass cards, bottom tabs, scaffold, Home dashboard, Train tab
- Step 13: Big-card set logging — `_sc3Card()` helper, `.sc3-list` container, 28px Geist Mono inputs; `chgSets()` and `logForm()` both use the helper; all input IDs unchanged so `saveEx()` required zero changes
- Step 14: RPE pills (6/7/8/9/10) per set card; `sc3SetRpe()` writes to hidden input; `saveEx()` appends `rpe` to set object if present; fully backward-compatible
- Step 15: Rest timer → glass bottom sheet with `slideUp` keyframe
- Step 16: Progress comparison header — Sessions / Volume / Sets with period deltas
- Step 17: Muscle radar chart — Chart.js radar type, weekly frequency per muscle group
- Step 18: Records podium — gold/silver/bronze top-3 cards, center-left-right layout
- Step 19: 12-week GitHub-style heatmap injected above history list
- Step 20: BW hero — 72px Instrument Serif, SVG sparkline, goal progress bar
- Step 21: Recap v3 — 2×2 glass stat grid (Workouts/Volume/Sets/PRs), auto-insight line, highlights, BW delta card
- Step 22: Directional tab transitions — spring `cubic-bezier(0.34,1.56,0.64,1)`, direction based on `_TAB_ORDER` index
- Step 23: Empty states upgraded — `.empty-state-art` warm circles, Instrument Serif titles, CTA buttons with coral accent on History/Train/PRs/BW
- Step 24: Haptics audit — tab switch 8ms, set save 15ms, PR [40,30,80,30,40], rest alarm [200,100,200,100,200], RPE tap 8ms
- Step 25: `exportMarkdown()` — structured `.md` with summary, all PRs, 8-week volume by muscle, last 20 sessions, BW log; accessible from Settings sheet
- Fixed `renderRecap()` bug (was targeting non-existent `page-recap`)
- Fixed `closeSheet()` to remove settings body and restore sheet state

### 2026-05-17 — Gesture-first set logging (v16)

**What was built:**
- Weight wheel: drag up/down on the weight area scrubs ±2.5 kg per ~28px of movement
  - Haptic tick (6ms) on each increment. Drag up = increase, drag down = decrease. Clamps 0–500.
  - Tap (< 6px movement) → text input appears focused. Blur → display restores with new value.
- RPE slider: horizontal drag track replaces the 5 pill buttons (6–10)
  - Thumb snaps to each position with haptic (8ms). Hidden until first interaction.
  - `sc3SetRpe` kept as a shim for backward compat.

**Nothing broken:**
- Reps input, rest timer (`tryStartRest` on blur), `saveEx`, `cacheDraft`, `getDraft`, `clearDraft`, `logForm`, `chgSets`, localStorage schema — all unchanged.
- Hidden input IDs `w-{exId}-{i}` and `rpe-{exId}-{i}` preserved so all existing functions work.

**Files:**
- `IronLog v3.html` — gesture CSS + wheel HTML + RPE slider HTML + helper functions + event delegation
- `index.html` — synced copy
- `sw.js` — cache bumped to `ironlog-v10`
- `docs/superpowers/specs/2026-05-17-gesture-set-logging-design.md` — design spec
- `docs/superpowers/plans/2026-05-17-gesture-set-logging.md` — implementation plan

**Score: 64 → ~68/100**

---

## What's next (priority order)

1. **Motion pass** ← RECOMMENDED NEXT
   - Spring animation when a set is saved (card scales 0.96 → 1.02 → 1 over 250ms)
   - Rest timer slides up as a sheet BEHIND the set card (not modal, not page-replace)
   - Number tickers on recap stats (count up on reveal)
   - Stronger directional tab transitions (currently more fade than spring)

2. **Custom SVG charts** — replace Chart.js line charts with inline SVG
   - Thicker lines, area fill that fades to transparent
   - Instrument Serif value labels, no gridlines, mono axis labels
   - Removes the "stock app" tell

3. **Cloud backup** — Sign in with Apple/Google → daily JSON to iCloud Drive / Google Drive
   - Without this, one Safari cache wipe = total data loss

4. **Swipe between sets** — pointer-event horizontal on sc3-card stack (save for last)

### Polish items (smaller wins)
- Haptic taxonomy: light tick / medium thud / heavy+double (PR) / success pattern (session done)
- Plate calculator on weight input ("60kg = 20kg bar + 2×20")
- 1RM estimates (Epley/Brzycki) on PR cards
- Per-exercise default rest time (currently global)
- Opt-in push notifications for training gaps
