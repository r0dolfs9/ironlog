# IronLog Research Summary - 2026-06-01

Scope: backup/data safety, chart direction, and home/shell direction review. No implementation was done in this research pass.

## Backup And Data Safety

Current state:

- IronLog stores the active database locally, with active key `il4__default`.
- Legacy key `il4` is copied into `il4__default` on first read.
- JSON export downloads current in-memory `DB` as `ironlog-YYYY-MM-DD.json`.
- JSON import parses a selected JSON file, validates only basic shape, then overwrites the active DB key and reloads UI state.
- Markdown export is for AI/training analysis and is not a restorable backup.

Recommended first implementation slice:

- Add a pre-import safety snapshot before overwriting `il4__default`.
- Store current DB under a timestamped key such as `il4__backup_before_import__<timestamp>`.
- Keep the latest 3-5 snapshots.
- Leave the import/export UI mostly unchanged.

Tests to add:

- Snapshot is created before valid import overwrite.
- Invalid JSON does not overwrite active DB.
- Bad object shape does not overwrite active DB.
- Snapshot retention cap works.
- Valid import still reloads the new DB.

Do not build yet:

- Cloud sync.
- Account backup.
- Multi-profile storage.
- Full migration framework.
- Backup encryption/password flows.
- Cross-device restore UX before physical phone QA.

## Chart Direction

Current state:

- Chart.js 4.4.1 is loaded from CDN and cached by the service worker.
- Chart.js powers muscle coverage radar, muscle group volume line chart, and fullscreen exercise PR/weight line chart.
- Lightweight custom visuals already exist for home weekly volume bars and bodyweight sparklines.

Recommendation:

- Keep Chart.js for detailed charts for now.
- Do not redesign charts before real Android/iPhone QA.
- Extract chart data preparation into testable helpers before changing rendering.

Smallest safe first slice:

- Extract data shaping for the fullscreen exercise chart.
- Input: workouts plus exercise id.
- Output: labels, max-weight series, PR metadata.
- Preserve the existing Chart.js renderer.

Tests to add:

- Date ordering.
- Empty data.
- Duplicate same-day sessions.
- Comma decimal weights.
- PR date selection.

## Home/Shell Direction

Current state:

- App has four top-level bottom nav domains: Fitness, Nutrition, Sleep, Finance.
- `home` aliases to `fitness`.
- Fitness home currently mixes dashboard, domain launcher, mini actions, suggested workout, streak/volume/bodyweight cards, and long-lost exercises.
- Sleep and Finance are now real simple workflows, not just placeholder screens.

Recommendation:

- Keep four top-level domains for now.
- Treat current home as the Fitness dashboard, not a separate global Home tab.
- Do not add a fifth/global Home tab until real phone QA proves the four-tab shell works comfortably.

Wait until after real phone QA:

- Bottom-nav changes.
- Separate global Home tab.
- Visible nested navigation redesign for Train/Progress/History.
- Large chart redesign.
- PWA install/update assumptions.
- Touch/haptic/rest-timer behavior changes.
- Import/export UX redesign beyond behind-the-scenes safety snapshots.

## This Week's IronLog Next Actions

1. Run real Android and iPhone QA using `docs/qa/2026-06-01-phone-qa.md`.
2. If QA is clean, implement pre-import safety snapshots with focused storage tests.
3. Keep chart and shell changes as decision notes until device QA is complete.
4. Confirm live PWA icon refresh after deploy/cache cycle.
