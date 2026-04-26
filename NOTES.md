# IronLog — Project Notes

## What's Built

### Workout Splits (4)
- Back & Bis, Chest & Tris, Legs, Arms & Shoulders
- Each split lists exercises by muscle group category
- "Finish" button opens a workout summary overlay

### Muscle Group Pages (8)
- Chest, Triceps, Back, Biceps, Legs, Shoulders, Abs, Forearms
- Collapsible exercise cards with log forms
- Last-session reference shown above the form

### Exercise Log Form
- Date picker (defaults to today)
- Adjustable set count 1–10 via +/- buttons or "+ Add Set"
- Reps + weight per set; done-checkmark per set
- Notes textarea
- Pre-fills reps & weight from last session
- Done-state preserved when changing set count

### Cardio
- Duration (min) + Calories fields
- Appears in every split

### History Page
- Entries grouped by session (date + split)
- Collapsible rows, delete individual entries

### Progress Page
- Dropdown: pick a muscle group or Cardio
- Stats cards: best weight, total volume, sessions, sets logged
- Line chart (Chart.js) — volume over time
- Exercise leaderboard sorted by best weight

### Body Weight Page
- Log date + weight (kg)
- ± diff badges per entry
- Line chart over time (shown when ≥ 2 entries)

### Data & Sync
- localStorage key: `il4`
- Export JSON / Import JSON (merge — no duplicates)

---

## Layout Plan

```
Desktop (>600px)
┌──────────────┬──────────────────────────────┐
│  Sidebar     │  Topbar                      │
│  WORKOUTS    │  [☰]  Page Title     [⚖ BW] │
│  ─ splits    │──────────────────────────────│
│  MUSCLES     │                              │
│  ─ groups    │  Active Page  (scrollable)   │
│  INSIGHTS    │                              │
│  ─ history   │                              │
│  ─ progress  │                              │
│  ─ body wt   │                              │
│  ──────────  │  🔥 Rest pill  (floats)      │
│  [Export]    │                              │
│  [Import]    │                              │
│  🔥 Streak   │                              │
└──────────────┴──────────────────────────────┘

Mobile (≤600px)
┌──────────────────────────────┐
│  [☰] Page Title     [⚖ BW] │
│──────────────────────────────│
│                              │
│  Active Page  (scrollable)   │
│                              │
│  🔥 REST 87s  [✕]  (float)  │
└──────────────────────────────┘
Sidebar slides in from left as an overlay
```

---

## Files
| File | Purpose |
|------|---------|
| `index.html` | All HTML structure |
| `style.css` | All styles |
| `app.js` | App logic |

---

## Colour Palette
| Token | Value | Used for |
|-------|-------|----------|
| `--bg` | `#0c0c0c` | Page background |
| `--s1` | `#151515` | Cards, sidebar |
| `--s2` | `#1d1d1d` | Inputs, sub-surfaces |
| `--s3` | `#252525` | Hover states |
| `--acc` | `#c9ff47` | Global accent (lime) |
| `--chest` | `#ff5c38` | Orange-red |
| `--triceps` | `#ff9f38` | Amber |
| `--back` | `#a855f7` | Purple |
| `--biceps` | `#c9ff47` | Lime |
| `--legs` | `#47b8ff` | Sky blue |
| `--shoulders` | `#ffd147` | Yellow |
| `--abs` | `#38ffd4` | Teal |
| `--forearms` | `#ff7eb3` | Pink |
| `--cardio` | `#ff38a0` | Hot pink |

**Fonts:** Syne 700/800 (headings) · DM Sans 300–600 (body) · DM Mono 400/500 (numbers)

---

## Fixes Applied
- Comma as decimal separator now works in all number inputs
- Done-state (✓) no longer lost when adjusting set count
- Active sidebar button highlight uses `data-pid` (was fragile string match)
- Escape key closes all modal overlays
- `parseNum()` handles comma/period interchangeably throughout

## New Features Added
| Feature | How it works |
|---------|-------------|
| **Rest Timer** | Ticking a set ✓ starts a 90 s floating countdown pill; cancel anytime |
| **PR Detection** | Saving a new best weight shows `🏆 New PR! Xkg` toast |
| **Workout Streak** | Sidebar footer shows `🔥 N day streak` (consecutive days) |
| **Pre-fill values** | Log form opens with last session's reps + weight already filled in |
