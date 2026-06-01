# IronLog Release Checklist

Use this before publishing any change to GitHub Pages.

## Source Of Truth
- Edit `IronLog v3.html` first.
- Sync `index.html` from `IronLog v3.html` before commit.
- Update `sw.js` whenever runtime files change.
- Keep `PROGRESS.md` and `C:\Users\User\progress.md` aligned with the actual state.

## Preflight
- Check `git status --short` and make sure only intended files are changing.
- Check whether new runtime files were added or removed.
- Check whether the change touches `app-core.js`, `app-storage.js`, `app-fitness.js`, or any other shared runtime file.

## Required Verification
- Run the smallest relevant test first for the changed area.
- Run the broader regression set before commit.
- Verify `IronLog v3.html` and `index.html` hashes match.
- Verify `sw.js` lists every runtime file needed by the app.
- If the change affects browser-visible behavior, run the browser or phone QA checklist that matches the feature.

## Publish Steps
1. Update `IronLog v3.html`.
2. Copy `IronLog v3.html` to `index.html`.
3. Update `sw.js` asset list if runtime files changed.
4. Bump `CACHE` in `sw.js` after any shipped frontend change.
5. Run the relevant Node tests.
6. Re-run the full regression set if the change touched shared logic or app startup.
7. Confirm hashes match for `IronLog v3.html` and `index.html`.
8. Commit with a message that reflects the actual change.
9. Push `master` to `origin/master`.
10. Update `PROGRESS.md` and `C:\Users\User\progress.md`.

## Do Not Ship If
- A test fails.
- `index.html` is stale.
- `sw.js` does not list a new runtime file.
- A feature was changed but not covered by at least the relevant test or QA note.
- The worktree contains unrelated changes you have not reviewed.

## Notes
- Phone QA is still required for real PWA install/update behavior.
- Hash matching is a quick sanity check, not a substitute for real browser testing.
