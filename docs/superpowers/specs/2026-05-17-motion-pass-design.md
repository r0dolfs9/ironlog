# IronLog — Motion Pass Design

_2026-05-17 · Approved by Rudolfs_

---

## What this is

A focused animation pass on four parts of IronLog that currently feel static or fade-heavy. No new features — just making the interactions that already exist feel more alive and premium.

Scored 50/100 on motion in the honest review. Goal: bring it meaningfully closer to 70+.

---

## Scope — 4 items

1. Spring snap when a set is saved
2. Rest timer as a bottom sheet (set card stays visible behind it)
3. Number tickers on the Recap screen
4. Stronger directional tab transitions

---

## How animations are built

Two approaches, each used where it fits best:

- **CSS class toggling** — for the rest sheet, tab transitions, and tickers. A class gets added or removed, CSS handles the motion. This is how IronLog already does tab transitions and the rest timer slide-up. No new patterns.
- **Web Animations API (WAAPI)** — for the save spring only. Two lines of JavaScript that play the animation on the card element, then trigger the screen redraw when it finishes. Needed here because the card has to animate *before* the screen redraws.

---

## Item 1 — Spring snap on set save

### What the user sees

Tap Save. The set card squishes slightly, bounces out a little bigger than normal, then settles — all in about a quarter of a second. Feels like a satisfying physical click. Then the exercise collapses into the logged state as normal.

### How it works

- The save logic (writing data, clearing the draft, cancelling any rest timer, showing the toast) all happens immediately — no delay.
- Only the visual redraw of the exercise list is held for ~240ms while the animation plays.
- The bounce curve is: compress to 96% → expand to 102% → settle at 100%. Spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`), 240ms total.
- If the card element can't be found (edge case), the redraw happens immediately with no animation — nothing breaks.

### What changes in the code

One block added near the end of `saveEx()`. The two existing `renderSplit` / `renderMuscle` calls move into the animation's completion callback instead of running inline.

---

## Item 2 — Rest timer as a bottom sheet

### What the user sees

After saving a set, the rest timer slides up from the bottom as a tray. The set card you just logged stays **visible above it** — the background dims very slightly but doesn't go dark or blurry. You can see where you are. Tapping anywhere outside the tray dismisses it, same as now.

### How it works

The rest timer overlay (`#restOv`) currently covers the whole screen with a heavy dark-blurred backdrop. Two CSS property changes fix this:

- Remove the backdrop blur from the overlay itself (the timer box already has its own glass effect — it doesn't need the overlay to be blurry too).
- Reduce the overlay background from 55% opacity black to 15% — enough to frame the sheet, light enough to see through.

The overlay element stays the same size (full screen) so the existing tap-to-dismiss behaviour works without any JavaScript changes.

### What changes in the code

Two values in the `.rest-ov` CSS rule. Nothing else.

---

## Item 3 — Number tickers on Recap

### What the user sees

Open the Recap tab. The four stats — Workouts, Volume, Sets, PRs — count up from zero to their real values over about 0.7 seconds. Like watching a scoreboard tick over. Makes the numbers feel meaningful rather than just appearing.

If the user has "Reduce Motion" turned on in their phone settings, the numbers appear instantly with no animation.

### How it works

A new helper function — `animateCounters(container)` — runs after the recap HTML is written to the page. It:

1. Finds all four stat number elements.
2. Reads their final value.
3. Sets them to zero.
4. Counts them up using the browser's animation frame loop, with an ease-out curve (fast at first, slows as it reaches the target).
5. Snaps to the exact final value when done.

Volume values that have a "kg" or "t" suffix are handled — the suffix stays, only the number animates.

One line added at the end of `renderRecapContent()`.

---

## Item 4 — Stronger tab transitions

### What the user sees

Switching tabs feels like flipping between pages rather than dissolving. The incoming screen slides in from the side with a clear spring — it travels further, overshoots slightly, snaps back. The outgoing screen exits with more authority. The direction is always correct: tapping a tab to the right slides right, tapping left slides left.

### How it works

The existing tab transition system (four CSS keyframe animations + four CSS classes) already has the right spring curve. Two small number changes make the motion more dominant over the cross-fade:

- Enter offset: 32px → 48px (more travel = slide beats fade)
- Exit offset: 20px → 30px (exit feels more decisive)
- Enter duration: 0.3s → 0.36s (gives the spring overshoot more time to be visible)
- Exit duration: 0.22s → 0.2s (snappier exit, same feel)

Four keyframe rules and four class rules updated. No JavaScript changes.

---

## What is NOT in this pass

- Long-press scale feedback on buttons — deferred, lower impact than the four items above.
- Streak pulse animation on Home — deferred.
- Sound design — out of scope.
- Any new features or data changes — this is animation-only.

---

## Files changed

- `IronLog v3.html` — all changes land here (CSS edits + one new JS function + one modification to `saveEx`)
- `index.html` — synced copy of v3 after changes are verified
- `sw.js` — cache version bumped (required for every release)

---

## Definition of done

- Save a set → card bounces before the list redraws
- Save a set → rest timer tray slides up, set card visible behind it
- Open Recap → stats count up from zero
- Switch tabs → slide feels clearly directional, not fade-dominant
- No console errors
- No regressions on: reps input, weight wheel/RPE slider (gesture controls), rest timer dismiss, PR detection, draft caching
