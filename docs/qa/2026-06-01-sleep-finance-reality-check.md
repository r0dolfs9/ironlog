# Sleep and Finance MVP Reality Check - 2026-06-01

## Scope
- Build under review: local `ironlog-v22` after storage and Fitness helper extraction.
- Areas reviewed: Sleep MVP data flow, Finance MVP data flow, summaries, delete flows, and obvious trust gaps visible from code/tests.
- Not covered here: physical phone PWA behavior, keyboard ergonomics, viewport safe areas, haptics, or browser console checks on real devices.

## What Looks Trustworthy Enough For MVP
- Sleep supports manual date, bedtime, wake time, quality, notes, recent logs, delete, and a 7-day average summary.
- Sleep duration handles overnight sleep by rolling wake time to the next day when wake is earlier than bedtime.
- Sleep quality is clamped to 1-5.
- Finance supports monthly budget, manual expenses, default categories, category summary, recent expenses, and delete.
- Finance month summaries correctly isolate expenses by month and calculate total, remaining budget, and per-category totals.

## Fixed During This Pass
- Finance no longer saves blank or zero-value expenses.
- `app-core.test.js` now covers blank and zero expense rejection.
- The Finance UI now shows `Enter an expense amount` and does not save when the amount is missing or zero.

## Must Fix Before Trust
- Real-device QA is still required for Sleep and Finance forms on Android Chrome PWA and iPhone Home Screen.
- Confirm date/time/month inputs are ergonomic on phone keyboards and do not cause awkward viewport jumps.
- Confirm delete buttons are not too easy to tap accidentally on phone.
- Confirm Finance empty budget state is understandable when `remaining` shows a negative number or zero-budget spend.

## Fine For Later
- Sleep editing after save; current MVP can delete and re-add.
- Finance editing after save; current MVP can delete and re-add.
- Custom categories UI; categories are currently added implicitly when imported/saved data contains new categories.
- Recurring expenses, income, accounts, net worth, and trend charts.
- Sleep trends beyond the simple 7-day average and consistency spread.

## Next QA Checklist
- Add one overnight sleep entry and confirm duration.
- Add one same-day sleep entry and confirm duration.
- Delete a sleep entry.
- Try saving a Finance expense with blank amount; it should not save and should show an error toast.
- Add a valid Finance expense and confirm total, remaining, category split, and recent list update.
- Delete a Finance expense.
