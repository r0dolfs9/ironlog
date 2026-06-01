# IronLog — Redesign Progress

## Current source of truth
- **`IronLog v3.html`** - active development source. Edit this first.
- **`index.html`** - live GitHub Pages entry point. Keep synced with `IronLog v3.html`.
- **`app-core.js`** - shared tested core for shell, Sleep, and Finance pure logic.
- **`app-storage.js`** - shared tested storage, JSON backup, and import validation helpers.
- **`app-fitness.js`** - shared tested Fitness calculation helpers for parsing, set volume, max weight, period stats, PR counts, and muscle frequency.
- **`sw.js`** - service worker cache. Current local release cache is `ironlog-v22`.
- **`manifest.json`** - PWA manifest.
- **`nutrition-stage1.test.js` through `nutrition-stage5.test.js`** - nutrition regression tests.
- **`app-core.test.js`, `app-storage.test.js`, `app-fitness.test.js`, and `domain-shell-mvp.test.js`** - four-domain shell, core logic, and extracted helper regression tests.

## Live URL
**r0dolfs9.github.io/ironlog** - currently a four-domain shell: Fitness, Nutrition, Sleep, and Finance. Fitness contains the existing v3 training flow; Nutrition contains macro tracking, saved foods, recipes, weekly trends, and coach handoff; Sleep and Finance are MVP tabs for manual logging and summaries.
- **`icon-192.png` / `icon-512.png`** - standard PWA icons.
- **`icon-maskable-192.png` / `icon-maskable-512.png`** - maskable variants.
- **`archive/IronLog.html`** - v1 historical reference.
- **`archive/IronLog v2.html`** - v2 historical fallback.
- **`archive/IronLog v3 mockup.html`** - old Home-screen design reference.
- **`v3-plan.md`** - original v3 IA spec, now historical.

## How to publish to GitHub Pages
- Repo: **`github.com/r0dolfs9/ironlog`** -> live at **`r0dolfs9.github.io/ironlog`**.
- For app changes: update `IronLog v3.html`, copy it to `index.html`, add any new runtime modules to `sw.js`, bump `CACHE`, run all relevant Node regression tests, commit, and push.
- Do not edit files in `archive/` unless intentionally reviewing old versions.

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

### Browser verification before next release
- [ ] Home/domain shell: Fitness, Nutrition, Sleep, and Finance tabs render without console errors.
- [ ] Fitness: split pills + exercise list; tap exercise -> sc3 big-card set logging
- [ ] Set card: big weight + reps inputs, RPE pills 6–10, done button
- [ ] Save set -> rest timer slides up as glass bottom sheet
- [ ] Nutrition: search starter/saved/recipe foods, log food, edit recipe, review 7-day trend.
- [ ] Sleep: log overnight sleep, confirm duration/weekly summary/recent list/delete.
- [ ] Finance: set monthly budget, add expense, confirm remaining/category summary/delete.
- [ ] Progress -> Stats: comparison header + radar chart
- [ ] Progress -> Records: podium top-3 + grouped list
- [ ] Progress -> Body Weight: 72px serif + sparkline + goal bar
- [ ] Progress -> Recap: stat grid + insight line
- [ ] History: 12-week heatmap + session timeline
- [ ] Settings gear: rest toggle+duration, export, import, AI export, new day
- [ ] JSON export/import round trip works through `app-storage.js`.
- [ ] AI Markdown export -> downloads `.md` file
- [ ] Tab switches slide directionally with spring feel
- [ ] No JS console errors

### Deploy steps
1. Run browser verification checklist above
2. Copy `IronLog v3.html` to `index.html`
3. Add any new runtime files to `ASSETS` in `sw.js`
4. In `sw.js`, bump `CACHE` to the next version after the current released cache
5. Run `app-core.test.js`, `app-storage.test.js`, `app-fitness.test.js`, `domain-shell-mvp.test.js`, and `nutrition-stage1.test.js` through `nutrition-stage5.test.js`
6. Commit and push the release

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

---

### 2026-05-26 - Nutrition, themes, recipes, and repo cleanup

**Done:**
- Nutrition macro tracking is implemented in the active v3 app: nutrition data model, Nutrition tab, macro dashboard, manual food logging, saved foods, target editing, coach card, and AI handoff markdown export.
- Starter food database is included as generic USDA FoodData Central-style per-100g foods. Branded/package foods should still use label values as the source of truth.
- Theme switching is implemented in Settings with persistent app themes.
- Cooked-weight recipe builder is implemented: create recipes, add ingredient macros, enter cooked weight, save, and log recipe portions by grams.
- `IronLog v3.html` and `index.html` are synced; latest known `sw.js` cache is `ironlog-v18`.
- Old tracked HTML references were moved out of the repo root into `archive/` so the root shows only active app files, docs, tests, and assets.

**Current active files:**
- `IronLog v3.html` - edit this first.
- `index.html` - live GitHub Pages entry point, synced from v3.
- `sw.js` - service worker cache.
- `nutrition-stage1.test.js` through `nutrition-stage5.test.js` - nutrition regression tests.

**Next:**
- User phone smoke test: install/open fresh app, confirm Nutrition, Add Food, saved foods, recipe builder, theme switching, and AI handoff export behave correctly.
- Next feature candidates: improve food search/database depth, recipe editing after save, barcode/photo/import paths, weekly nutrition trend screens, and smarter macro adjustment recommendations once enough real logged data exists.

---

### 2026-05-27 - Nutrition upgrade batch

**Done:**
- Added editable saved recipes. Future logs use the updated recipe math, while already logged recipe portions stay unchanged as macro snapshots.
- Replaced the old food chip list with searchable starter/saved/recipe results and clearer per-100g labels.
- Expanded the starter food database with common cutting staples from generic USDA FoodData Central-style per-100g entries and added category labels.
- Added a 7-day nutrition trend card with logged days, complete days, average calories/macros, target delta, and scale trend when weigh-ins exist.
- Strengthened macro coach logic so it refuses target changes when logs/weigh-ins are incomplete and only suggests small target moves from complete weekly trends.
- Added `nutrition-stage5.test.js` for recipe editing, search, weekly trends, and macro recommendation gating.
- Bumped `sw.js` cache to `ironlog-v17`.

**Next:**
- User phone smoke test for searchable food logging, recipe edit/update, weekly trends, coach text, theme switching, and PWA refresh behavior.
- Later upgrades: barcode/photo/import food entry, richer branded food source strategy, recipe duplication, and visual nutrition charts.

---

### 2026-05-28 - Future app structure and logo polish

**Done:**
- Captured the future four-domain app direction in `docs/future-app-structure.md`: Fitness, Nutrition, Sleep, and Finances.
- Documented the future home/domain launcher idea and the later exercise form library idea.
- Removed the duplicate profile/avatar topbar button because it opened the same Settings sheet as the gear.
- Replaced the app icon direction with a cleaner IronLog mark and added `favicon.svg`.
- Bumped `sw.js` cache to `ironlog-v18`.

**Next:**
- Do not restructure the whole app shell until the current Fitness/Nutrition flows are smoke-tested.
- Later: make the four-domain home screen, move current training into Fitness, move macro tracker into Nutrition, and add Coming Soon screens for Sleep and Finances.

---

### 2026-05-28 - Four-domain shell MVP slice

**Done:**
- Created isolated branch/worktree `four-domain-rebuild` for the shell rebuild.
- Added DB migrations/defaults for `app`, `sleep`, and `finance` while preserving existing Fitness/Nutrition data.
- Replaced the bottom navigation with four domains: Fitness, Nutrition, Sleep, and Finance.
- Added Sleep MVP: bedtime, wake time, quality, notes, duration calculation, 7-day summary, recent log list, and delete.
- Added Finance MVP: monthly budget, manual expenses, categories, monthly total, remaining budget, category split, and delete.
- Added `domain-shell-mvp.test.js` covering shell defaults, overnight sleep duration, weekly sleep summary, budget totals, category totals, and deletion.
- Synced `IronLog v3.html` to `index.html` and bumped service worker cache to `ironlog-v19`.

**Next:**
- Manual Android and iPhone PWA smoke test of the new four-domain nav, Sleep logging, Finance logging, and old Fitness/Nutrition flows.
- Continue modular split after the shell MVP is visually verified on phone.

---

### 2026-05-29 - Modular foundation slice 1

**Done:**
- Verified the live GitHub Pages app is serving the four-domain shell and `ironlog-v19`.
- Fixed the domain bottom nav grid from five columns to four columns and added regression coverage for it.
- Started the careful modular split with `app-core.js`, a shared UMD/CommonJS core for shell, Sleep, and Finance pure logic.
- Added `app-core.test.js` covering shell defaults, sleep duration/weekly summaries, finance budgets/expenses, deletion, and money rounding.
- Loaded `app-core.js` from the app shell, added it to the service worker asset list, synced `index.html`, and bumped cache to `ironlog-v20`.

**Next:**
- Merge/push the modular foundation slice after review.
- Continue extracting storage/import/export helpers into a tested module.
- Then extract Fitness calculation helpers before changing more UI.

---

### 2026-06-01 - Storage helper extraction and QA/doc refresh

**Done:**
- Added `docs/qa/2026-06-01-phone-qa.md` with the real-device Android Chrome PWA and iPhone Home Screen QA checklist.
- Refreshed the source-of-truth and release checklist sections for the current four-domain shell, `app-core.js`, `app-storage.js`, and `ironlog-v20`.
- Extracted storage, JSON backup serialization, import validation, legacy `il4` migration, and backup filename helpers into `app-storage.js`.
- Added `app-storage.test.js` and updated `domain-shell-mvp.test.js` so the test harness loads the extracted storage module.
- Synced `IronLog v3.html` to `index.html`, added `app-storage.js` to the service worker asset list, and bumped cache to `ironlog-v21`.

**Next:**
- Run the physical Android/iPhone QA pass and record findings in `docs/qa/2026-06-01-phone-qa.md`.
- Continue with Fitness calculation helper extraction after the storage split is verified in the browser/PWA.

---

### 2026-06-01 - Fitness helper extraction slice 1

**Done:**
- Added `app-fitness.js` for pure Fitness calculations: training number parsing, set volume, max set weight, date-window stats, personal record count, and muscle frequency.
- Added `app-fitness.test.js` and verified the test failed before the module existed, then passed after implementation.
- Wired `IronLog v3.html` to load `app-fitness.js` and delegated existing `parseNum`, `vol`, and `maxWt` wrappers to the extracted helpers.
- Replaced duplicated Progress and Recap summary math with `IronLogFitness.trainingStats`, `personalRecordCount`, and `muscleFrequency`.
- Synced `IronLog v3.html` to `index.html`, added `app-fitness.js` to the service worker asset list, and bumped cache to `ironlog-v22`.
- Updated VM-based test harnesses so they load `app-fitness.js` before executing the app script.

**Next:**
- Continue extracting additional Fitness pure logic carefully: home weekly volume/suggestion helpers, session summary helpers, and AI export PR/volume aggregation.
- Run the physical Android/iPhone QA pass before any larger UI-sensitive refactor.

---

### 2026-06-01 - Fitness helper extraction slice 2

**Done:**
- Extended `app-fitness.js` with pure Home dashboard helpers: `weeklyVolumeSummary`, `leastRecentSplitSuggestion`, `bodyWeightSnapshot`, and `longLostExercises`.
- Added tests for weekly volume/current-vs-previous data, least-recent split suggestion, body-weight 30-day comparison, and long-lost exercises.
- Replaced inline `renderHome()` calculations with the tested helper calls while leaving the rendering markup unchanged.
- Synced `IronLog v3.html` to `index.html`.
- Verified `app-fitness`, `app-storage`, `app-core`, `domain-shell-mvp`, and nutrition stage 1-5 tests all pass.

**Next:**
- Continue with session summary helpers and AI export PR/volume aggregation.
- Do the real Android/iPhone QA pass before changing UI-sensitive logging behavior.

---

### 2026-06-01 - Fitness helper extraction slice 3

**Done:**
- Extended `app-fitness.js` with pure session/export helpers: `sessionSummary`, `personalRecords`, `volumeByCategorySince`, `recentSessions`, and `markdownExportData`.
- Added tests for today session summary totals, duration, PR detection, previous-session volume comparison, AI export totals, PR ordering, 8-week category volume, and recent session grouping.
- Replaced `renderPRs()`, `openSummary()`, and `exportMarkdown()` aggregation logic with tested `IronLogFitness` helpers while preserving UI/export formatting.
- Synced `IronLog v3.html` to `index.html`.
- Verified `app-fitness`, `app-storage`, `app-core`, `domain-shell-mvp`, and nutrition stage 1-5 tests all pass.

**Next:**
- Stop further Fitness modular extraction until a real Android/iPhone QA pass validates the current v22 build.
- After phone QA, decide whether the next IronLog task should be motion polish or Sleep/Finance MVP reality check.
