# IronLog — Feature Spec: Customisable Splits + Recap

## 1. Customisable Splits

### Data model
`DB.splits` replaces the hardcoded `SPLITS` constant. Each split stores:
```js
{
  id:    'split-0',          // stable id
  name:  'Back & Bis',       // editable
  color: '--back',           // CSS var name, editable
  sections: [
    { type: 'muscle',    group: 'back' },           // full muscle group
    { type: 'muscle',    group: 'biceps' },
    { type: 'exercises', group: 'shoulders',        // cherry-picked exercises
      list: ['Lateral Raise', 'Cable Lateral'] },
    { type: 'cardio' }                              // cardio block
  ]
}
```
Exercise log data (`DB.exercises`, `DB.workouts`) is unchanged — only display config changes.
Migration: on first load, `DB.splits` is seeded from the 4 hardcoded defaults.

### Sidebar
Split buttons rendered dynamically from `DB.splits`.
"+" button in Workouts header creates a new split (name + color picker sheet).
Delete split via long-press context (or edit mode).

### Edit mode
Each split page header has an ✏️ Edit button (right of title, left of Finish).
In edit mode:
- Split name becomes an inline `<input>` (auto-saves on blur)
- Color dot cycles through 8 accent colours on tap
- Each section shows a × remove button
- "＋ Add Section" button at bottom → full-group picker (muscle groups + cardio chips)
- "＋ Pick Exercises" button → exercise picker modal (grouped by muscle, checkboxes)
- "Done" button exits edit mode

### Exercise picker modal
Full-screen overlay. Lists all exercises in `DB.exercises` grouped by muscle group.
Checkbox per exercise. Search/filter input at top.
"Add Selected" button adds a `type:'exercises'` section to the split.
If the same group already has a `type:'muscle'` section, warn user (redundant).

### New split
"+" in sidebar Workouts header → sheet: enter name + tap colour → creates split with 0 sections → immediately enters edit mode.

### Delete split
In edit mode, a "Delete this day" button at the bottom (red). Confirms before removing. Workout history is unaffected.

---

## 2. Weekly / Monthly Recap

### Location
Sidebar: Insights → Recap (page id `recap`).
Tab bar at top: WEEK | MONTH.

### Metrics computed

**Achievements (top 3 best things):**
1. **New PRs** — count of exercises where a new best weight was set this period
2. **Most improved exercise** — biggest % weight increase vs same period prior
3. **Volume leader** — muscle group with highest total volume this period
4. **Consistency** — sessions this period vs last period (shown as % change)

Show top 3 of these ranked by impressiveness.

**Focus area (1 thing to improve):**
- Least-trained muscle group (fewest sessions relative to others)
- If body-weight goal is set and trending wrong direction, that surfaces first
- Falls back to: muscle with biggest volume drop vs previous period

**Body weight summary:**
- If ≥2 entries in period: start → end weight + net change
- If goal set: progress toward goal shown as a mini progress bar

### Comparison
Current period vs same-length prior period. Show delta as +/- % or absolute change.

---

## 3. Body Weight Goal

On the Body Weight page, above the log form:
- "Set Goal" card (collapsed by default, expands on tap)
- Fields: Target weight (kg) | Direction (Lose / Gain toggle) | Deadline (optional date)
- Stored in `DB.bwGoal = { target, direction, deadline }`
- When set, shows a progress bar in the BW page header + feeds into recap

---

## Files to edit
| File | Changes |
|------|---------|
| `app.js` | ~400 lines added/changed: DB migration, dynamic sidebar, edit mode, exercise picker, recap logic, BW goal |
| `style.css` | ~200 lines: edit mode, picker modal, recap page, BW goal, new-split button |
| `index.html` | Sidebar splits → dynamic container; add recap page div; add recap sidebar button |
| `ironlog-bundle.html` | Regenerate from above 3 |
