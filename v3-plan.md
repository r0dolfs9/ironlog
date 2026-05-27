# IronLog v3 — Redesign Plan

> Current status note, 2026-05-26: this is now a historical v3 redesign plan, not the active implementation checklist. The active app source is `IronLog v3.html`, the live GitHub Pages file is `index.html`, and old HTML versions have been moved to `archive/`.

## Direction
**"Warm iOS"** — keep the dark base but swap the cold lime/cyberpunk feel for a warmer, more editorial dark mode inspired by Apple Health / iOS native apps + Clock app. Glassmorphism layers, generous whitespace, big SF-style type. Less "gym bro neon," more "I'd put this on my watch."

### Palette
- `--bg`            `#0a0908`   (warm near-black, slight brown shift)
- `--surface-1`     `#16140f`   (raised glass tier 1)
- `--surface-2`     `#1f1c16`   (raised tier 2 — cards)
- `--surface-glass` `rgba(28,25,20,0.62)` with `backdrop-filter: blur(24px) saturate(1.6)`
- `--text`          `#f5f1e8`   (warm bone, not cold white)
- `--text-2`        `#a8a195`   (warm gray)
- `--text-3`        `#6b6359`
- `--accent`        `#ff6b35`   (warm coral-orange — the new lime)
- `--accent-soft`   `#ffb38a`   (peach — for soft highlights, success-ish)
- `--danger`        `#d4332f`   (deep red)
- `--success`       `#7fb069`   (sage, not toxic green)
- `--hairline`      `rgba(245,241,232,0.08)`
- `--hairline-hi`   `rgba(245,241,232,0.16)`

### Type
- Display: **Instrument Serif** for big numbers + section headers — gives editorial feel like Apple Health weekly cards
- UI body: **Geist** (Vercel) or **Inter Display** — sharp, native-feeling
- Mono: **Geist Mono** or **JetBrains Mono** — for stats / numbers
- Sizes: weight numbers in workout cards are HUGE (72–96px serif) like Apple Health's "12,847 steps". Labels small caps tracked.

### Material rules
- Cards float on a fixed warm-noise background gradient (subtle radial of `--surface-1` over `--bg`).
- Every card: `backdrop-filter: blur(24px) saturate(1.6)`, 1px inner highlight (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)`), no harsh borders.
- Corners: `20px` for cards, `12px` for buttons, `999px` for chips/pills.
- Shadows: very soft, warm-tinted (`0 24px 48px -16px rgba(0,0,0,0.6)`).
- No drop borders except on focus.

---

## Information architecture

### Navigation
Switch from sidebar to **bottom tab bar** + a top "context bar":
- **Home** (dashboard) — new
- **Train** (active split / quick log) — replaces sidebar split picker
- **Progress** (stats / records / BW) — merges Progress + Records + BW
- **History** — calendar + list
- Settings becomes a sheet from a top-right gear icon.

Sidebar concept is over — bottom tabs are what iOS users expect and free 240px of horizontal space.

### Hero / Home dashboard (new)
A scrollable dashboard with 4–5 glass cards:

1. **Today's suggestion** (large card, full-bleed accent gradient)
   - "Today: Push" (computed: least-trained split this week)
   - 3 exercise chips with last performance: `Bench 80kg × 4×8`
   - Big "Start workout" button
2. **This week** card
   - Weekly volume number (huge), arrow vs last week, mini bar chart of 7 days
3. **Streak** card
   - Current streak (huge number), best streak, this week's days lit
4. **Body weight** card
   - Current weight + trend arrow + small sparkline (last 30 days)
   - Goal progress bar if goal set
5. **Long lost** card ("you haven't trained these in a while")
   - 3 exercises last done >7d ago with date

### Train screen (replaces split pages)
- Top: tabs of muscle groups (your sections) — horizontal scroll if many
- Each exercise as a **stacked card pile** that you swipe vertically through; current exercise is full-bleed, next/prev peek 12px from top/bottom
- Tap to expand → set logging takes over the screen

### Set logging redesign
**Big-card-per-set** mode (you wanted this):
- One huge card showing: set number ("Set 2 of 4"), target reps (from last session), big weight wheel input
- Below: 3-tap RPE selector (6/7/8/9/10) — "How hard?"
- Swipe up to confirm → rest timer slides in from bottom as a glass sheet
- Swipe left → previous set; swipe right → next set
- Persistent "Done" pill in corner returns to exercise list

### Progress screen
- **Comparison header**: "This week" / "Last week" toggle, big delta numbers with trend arrows
- **Muscle group radar chart** — Apple Activity-style coverage ring per muscle group, this week vs target frequency
- **PR timeline** — vertical timeline of recent PRs with the lift number rendered in big serif
- **Charts**: fullscreen by default, swipe between exercises

### Records page
- Switch from list to **podium cards** for top 5 lifts (gold/silver/bronze tints), then sortable list below
- Each card: exercise name, weight × reps × date, "view chart" → opens full chart sheet

### History
- **Top: GitHub-style heatmap** (12 weeks, color intensity = session count)
- **Below: vertical timeline** grouped by week, each session as a glass card with sets summary
- Calendar month-view toggle in top right

### BW page
- Current weight HUGE in serif (72px), trend arrow, goal delta
- Sparkline chart full-bleed under it
- Goal card if set: progress ring + days remaining
- Entry list collapses to last 3 + "See all"

### Recap (currently weak)
- Becomes "End workout" sheet at session save
- Big stat cards in a grid: volume, sets, PRs, duration
- "Highlights" carousel: 1 card per PR / milestone
- Auto-generated insight line: "Strongest Push day in 3 weeks."

---

## Implementation plan — order of attack

### Phase 1 — Foundation (no behavior change)
1. Pull all color/font into CSS custom properties.
2. Replace palette + load new fonts.
3. Apply new card styles (glass + radii + shadows) globally.
4. Convert sidebar → bottom tab bar.
5. Verify all existing screens still work, just dressed in new clothes.

### Phase 2 — Home dashboard
1. Build the 5 dashboard cards.
2. Implement the data computations:
   - Suggested split: least-trained in last 7 days
   - "Long lost": exercises with `lastDate < today - 7d`, top 3 by gap
   - Weekly volume delta vs prior week
3. Wire "Start workout" to navigate to Train tab with that split pre-loaded.

### Phase 3 — Train tab + set logging
1. Build big-card-per-set component.
2. Wire RPE input.
3. Swipe gestures (use pointer events; reuse the swipe-to-delete pattern).
4. Stacked exercise pile component.
5. Migrate existing set-saving logic to the new UI (keep backend identical).

### Phase 4 — Progress + Records + History + BW
1. Muscle radar chart (Chart.js radar type).
2. Weekly comparison header.
3. PR timeline component.
4. Heatmap component for history.
5. BW page big-serif treatment.

### Phase 5 — Recap + polish
1. End-of-workout sheet redesign.
2. Animation pass (spring transitions between tabs, sheet slide-ups).
3. Haptics audit — confirm vibrate on every meaningful action.
4. Empty states with copy + illustration.

### Data model — what stays, what's added
- Stays: `DB.workouts`, `DB.splits`, `DB.exercises`, `DB.bodyWeights`, `DB.bwGoal`, `DB.sessionStarts`, `DB.sessionNotes`, `DB.settings`.
- Added: per-set `rpe` field (1–10, optional, nullable). Old workouts without it just hide the field.
- Added: `DB.settings.muscleTargets` — map of muscle group → weekly target frequency (for radar).

### Files
- `IronLog v3.html` ← new, built by forking v2 and applying phases incrementally
- `archive/IronLog v2.html` - historical fallback
- Same `manifest.json`, `sw.js`, icons — no change

### What WON'T change
- LocalStorage data — fully forward-compatible. v3 reads v2 data; old workouts just lack `rpe`.
- Service worker + manifest + icons.
- The export/import JSON format.

---

## Mockup
See **`archive/IronLog v3 mockup.html`** for the old clickable preview of the Home dashboard. This file is historical reference only.
