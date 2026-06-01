# IronLog Weekly Stretch Tasks

Week of 2026-06-01

This is a deliberately ambitious list. Finishing everything in one week would be difficult; the point is to create a strong queue and force prioritization.

## 1. Manual Phone QA Pass On Real Devices
- Test the current four-domain build on Android Chrome PWA and iPhone Safari/Home Screen.
- Verify Fitness, Nutrition, Sleep, and Finance flows end to end.
- Check install/update behavior after the `ironlog-v20` service worker change.
- Record concrete bugs, screenshots, and repro steps in one short QA note.

## 2. Fix Documentation Drift
- Update `PROGRESS.md` so it matches the real current state: four-domain shell, `app-core.js`, and `ironlog-v20`.
- Clean up stale deployment notes that still describe older v3-only behavior.
- Make the release/checklist section trustworthy enough to use without second-guessing.

## 3. Continue Modular Split Safely
- Extract storage/import/export helpers into a separate tested module.
- Keep the current app behavior unchanged while reducing logic still trapped in `IronLog v3.html`.
- Add focused tests for the extracted helpers before moving on to more UI-sensitive logic.

## 4. Extract Fitness Calculation Helpers
- Move pure Fitness logic out of the main HTML file into a reusable module.
- Start with the safest logic first: derived stats, summaries, and non-DOM calculations.
- Avoid touching the interaction-heavy logging UI until the helper boundaries are stable.

## 5. Run A Motion And Interaction Polish Pass
- Improve tab transitions so they feel more intentional on phone.
- Add a satisfying save animation for set logging.
- Review rest timer presentation, haptics, and small interaction feedback for consistency.
- Keep this pass subtle; the goal is “clean and premium,” not noisy.

## 6. Nutrition UX Upgrade Batch
- Tighten search and selection flow for foods, saved foods, and recipes.
- Reduce friction for logging repeated meals.
- Identify the next high-value nutrition gap: branded foods, barcode path, recipe duplication, or better trend visuals.
- Ship at least one meaningful nutrition usability improvement, not just cleanup.

## 7. Sleep And Finance MVP Reality Check
- Use the new Sleep and Finance tabs enough to find weak assumptions in the current MVP.
- Verify empty states, editing/deletion flows, summary math, and edge cases.
- Decide which missing pieces are “must fix before trust” versus “fine for later.”

## 8. Prepare A Safer Release Workflow
- Create a small repeatable release checklist for sync, cache bump, tests, and smoke test.
- Make it obvious which file is the true source of truth before deploy.
- Reduce the chance of shipping a stale `index.html` or stale cache version again.

## 9. Chart Direction Upgrade
- Decide whether to keep Chart.js where it still exists or replace key views with custom SVG.
- Prototype one stronger chart treatment that fits the app’s visual language better.
- Only continue if the custom direction is clearly better, not just different.

## 10. Backup / Data Safety Spike
- Define the simplest realistic backup direction for local-first user data.
- Compare export-only, cloud sync later, and account-based backup as options.
- Write down the recommendation and the first implementation slice, even if backup itself is not built this week.

## 11. Regression Coverage Expansion
- Add at least one more test file aimed at current four-domain behavior or extracted helper logic.
- Prioritize tests for logic that is easy to break during modularization.
- Use test additions to support upcoming refactors, not just to increase count.

## 12. Home / Shell Product Direction Review
- Re-evaluate whether the current domain launcher and home flow feel right now that Sleep and Finance exist.
- Decide what the next “identity” step is for the app: stronger home orchestration, better domain summaries, or simpler first-run guidance.
- Write down the decision so future work does not drift.

## Recommended Weekly Focus
If time gets tight, focus in this order:

1. Manual Phone QA Pass On Real Devices
2. Fix Documentation Drift
3. Continue Modular Split Safely
4. Extract Fitness Calculation Helpers
5. Sleep And Finance MVP Reality Check

## Definition Of A Good Week
- Real devices were tested.
- Documentation stopped lying about the current shipped state.
- The modular split moved forward without breaking behavior.
- At least one user-facing quality improvement shipped.
- The next week became clearer, not messier.
