# IronLog: Project Spec & Build Plan

> **What this document is for:** Personal reference for building IronLog over the coming weeks. When you feel the urge to jump to a new idea, open this first. When you forget where you left off, open this first. The phases are ordered. Finish each one before starting the next.

---

## A Note on Finishing This

You start things well. The risk with a project like this is not running out of ideas, it is drifting between them and never shipping. This document exists to prevent that. The phases are short and each one ends with something you can actually use at the gym. If you finish Phase 1 and 2, you will have an app installed on your homescreen that works offline. That alone is worth doing. Everything after that is a bonus.

**Rule:** If you catch yourself building something not in the current phase, write it down in the open questions section and come back to it. Do not start it.

---

## 1. What Is IronLog

IronLog is a personal gym workout tracking app. It lets you log sets, reps, and weight per exercise, tracks body weight over time, shows progress charts, and gives you a weekly/monthly recap of how your training is going.

It is built as a single-page web app (HTML + CSS + JS, no frameworks) and currently runs by loading a bundled HTML file in an HTML viewer app on mobile. The end goal is to publish it on the **Google Play Store** as an Android app, with iOS as a later follow-on.

**This is a solo project** built on weekends using Claude Code as the primary coding assistant.

---

## 2. Who It Is For

| User | Description |
|---|---|
| **Primary** | You, intermediate lifter, iPhone 15 Pro Max |
| **Secondary** | Your sister, Android user, beginner-to-intermediate |

**User profile:** Someone who goes to the gym consistently and wants to:
- See their progress over time (weight lifted, volume, PRs)
- Be reminded and motivated to keep going
- Log workouts quickly without friction during a session
- Look back at what they did last time before starting a set

There is no target for a large public audience. The app is published so it can be downloaded cleanly on a phone, not to build a product business.

---

## 3. Current State

### What Exists and Works

| Feature | Status | Notes |
|---|---|---|
| 4 workout splits (Back & Bis, Chest & Tris, Legs, Arms & Shoulders) | Working | Customisable via edit mode |
| 8 muscle group pages with collapsible exercise cards | Working | |
| Exercise log form (sets, reps, weight, notes) | Working | Pre-fill UX needs fix (see section 6) |
| Rest timer (90s floating pill) | Working | Needs UX overhaul (see section 6) |
| PR detection toast (New PR!) | Working | |
| Workout streak (N day streak) | Working | |
| Session summary overlay (Finish button) | Working | |
| History page (grouped by session, collapsible) | Working | |
| Progress page (charts, stats, leaderboard) | Working | |
| Body weight page (log + chart + goal) | Working | |
| Recap page (week/month summary) | Partial | Needs improvement, some metrics feel pointless |
| Multi-profile support | Built | Not a priority, deprioritised |
| Export / Import JSON | Working | Current backup method |
| Customisable splits (edit mode) | Partial | Clunky, inconsistent, needs redesign |
| Cardio block in every split | Working | |

### How It's Being Used Right Now

The app runs as `ironlog-bundle.html`, a single self-contained HTML file. You download it to your iPhone and open it inside an HTML viewer app from the App Store. This is a temporary workaround. It is not an installed app, does not have a homescreen icon, and cannot send push notifications.

Data is stored in `localStorage` under the key `il4_[profileName]`. This means:
- Data is tied to the HTML viewer app's browser storage
- Clearing the app or switching viewer apps loses all data
- There is no automatic backup

### Data Files in the Folder

| File | Purpose |
|---|---|
| `index.html` | HTML structure |
| `style.css` | All styles |
| `app.js` | All app logic |
| `ironlog-bundle.html` | Single-file build combining the above, used on phone |
| `NOTES.md` | Feature reference and layout plan |
| `CHANGES.md` | Feature spec for customisable splits + recap |
| `STATUS.md.txt` | Old bug list (mostly fixed) |
| `Gym_Workout_Progress_Tracker.xlsx` | Unknown origin, likely pre-IronLog data, not in active use |
| `Updated_Gym_Workout_Progress_Tracker.xlsx` | Same as above |

---

## 4. Design System

### Philosophy

Dark-only. Clean and minimal but with character, not sterile. Smooth, fast, satisfying to use. Every interaction should feel intentional. No jank, no broken pauses, no dead moments. If something is loading or transitioning, something should be happening visually.

### Colour Palette

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#0c0c0c` | Page background |
| `--s1` | `#151515` | Cards, sidebar |
| `--s2` | `#1d1d1d` | Inputs, sub-surfaces |
| `--s3` | `#252525` | Hover / active states |
| `--acc` | `#c9ff47` | Global accent (lime green) |
| `--chest` | `#ff5c38` | Chest (orange-red) |
| `--triceps` | `#ff9f38` | Triceps (amber) |
| `--back` | `#a855f7` | Back (purple) |
| `--biceps` | `#c9ff47` | Biceps (lime) |
| `--legs` | `#47b8ff` | Legs (sky blue) |
| `--shoulders` | `#ffd147` | Shoulders (yellow) |
| `--abs` | `#38ffd4` | Abs (teal) |
| `--forearms` | `#ff7eb3` | Forearms (pink) |
| `--cardio` | `#ff38a0` | Cardio (hot pink) |

### Typography

| Role | Font | Weight |
|---|---|---|
| Headings | Syne | 700 / 800 |
| Body / UI | DM Sans | 300 to 600 |
| Numbers / data | DM Mono | 400 / 500 |

### Layout

```
Desktop (>600px)
┌──────────────┬──────────────────────────────┐
│  Sidebar     │  Topbar                      │
│  WORKOUTS    │  [☰]  Page Title     [⚖ BW] │
│  - splits    │──────────────────────────────│
│  MUSCLES     │                              │
│  - groups    │  Active Page (scrollable)    │
│  INSIGHTS    │                              │
│  - history   │                              │
│  - progress  │  Rest Timer (floats)         │
│  - body wt   │                              │
│  - recap     │                              │
│  ──────────  │                              │
│  [Export]    │                              │
│  [Import]    │                              │
│  Streak      │                              │
└──────────────┴──────────────────────────────┘

Mobile (<=600px)
┌──────────────────────────────┐
│  [☰] Page Title     [⚖ BW] │
│──────────────────────────────│
│                              │
│  Active Page (scrollable)    │
│                              │
│  REST 87s  [x]  (float)     │
└──────────────────────────────┘
Sidebar slides in from left as an overlay.
Landscape mode must not break layout.
```

---

## 5. Architecture & Tech Stack

### Current Stack

| Layer | Technology | Notes |
|---|---|---|
| UI structure | HTML5 | Vanilla, no framework |
| Styling | CSS3 (custom properties) | No preprocessor |
| Logic | Vanilla JavaScript (ES6+) | No framework, no TypeScript |
| Charts | Chart.js 4.4.1 (CDN) | |
| Storage | `localStorage` | Per-profile keys |
| Build | Manual bundle into single HTML | No build pipeline |
| Deployment | File downloaded to phone, opened in HTML viewer | Temporary |

### What This Means Going Forward

The vanilla HTML/CSS/JS approach is correct and should be kept. It is simple, it works, and you can build it solo with no prior framework knowledge. No migration is planned. The goal is to package it as a **Progressive Web App (PWA)**, which can then be wrapped into an Android app for the Play Store.

### Data Model (localStorage)

```
DB = {
  exercises: {
    chest:     [{ id, name }, ...],
    triceps:   [...],
    back:      [...],
    biceps:    [...],
    legs:      [...],
    shoulders: [...],
    abs:       [...],
    forearms:  [...]
  },
  workouts: [
    {
      id, date, splitId, splitName,
      entries: [
        { exerciseId, muscle, sets: [{ reps, weight, done }], notes }
      ]
    }
  ],
  bodyWeights: [{ id, date, kg }],
  splits: [
    {
      id, name, color,
      sections: [
        { type: 'muscle', group: 'back' },
        { type: 'exercises', group: 'shoulders', list: ['Lateral Raise'] },
        { type: 'cardio' }
      ]
    }
  ],
  bwGoal: { target, direction, deadline } | null
}
```

Storage key format: `il4_[profileName]` (default: `il4__default`)

---

## 6. Known Issues & UX Problems to Fix

These are ordered by priority. Fix these before building new features.

### Priority 1: Bugs (breaks core usage)

| # | Issue | Fix |
|---|---|---|
| B1 | **Landscape mode breaks layout** | Add `@media (orientation: landscape) and (max-height: 500px)` rules to handle rotated phone. Lock to portrait in PWA manifest. |
| B2 | **Comma decimal separator still broken on some pages** | Audit all number inputs, ensure `parseNum()` is used everywhere consistently. |
| B3 | **Some buttons non-functional in certain states** | Audit click handlers for null reference errors. Add defensive checks. |
| B4 | **Layout feels clustered on mobile** | Increase spacing on mobile, reduce density, larger tap targets (minimum 44px). |

### Priority 2: UX Problems (frustrating to use)

| # | Issue | Fix |
|---|---|---|
| U1 | **Pre-fill is misleading on set entry** | When you open a log form, it shows last session's reps and weight as actual input values. You have to delete them to type new ones. Fix: show a ghost placeholder that says what you did last time (e.g. `placeholder="80kg last time"`) and leave the field blank so you type straight in. |
| U2 | **Rest timer is too subtle** | After saving a set (ticking done), the rest timer should show as a large prominent overlay, not just a small floating pill. It should count down visibly. The "Add next set" area should be visually greyed out or disabled during the timer. Timer should be skippable at any time. |
| U3 | **Edit mode is confusing** | When editing a split, it is not clear what is being edited. Add: a visible "EDITING" state banner, clearer labels on each section, drag handles to reorder sections, and colour choices that show actual colour swatches rather than names. |
| U4 | **Not enough colour options in split editor** | Currently 8 hardcoded colours. Should show all 9 accent colours as tappable swatches. |
| U5 | **Sections can't be reordered in edit mode** | Add drag-to-reorder or up/down arrow buttons for sections within a split. |
| U6 | **Recap metrics feel arbitrary** | Some recap stats don't feel meaningful. Prioritise: PRs this week, most improved exercise, most consistent muscle group, body weight trend. Remove or deprioritise metrics that need a lot of data to be useful. |

### Priority 3: Polish

| # | Issue | Fix |
|---|---|---|
| P1 | **Micro-interactions feel abrupt** | Add CSS transitions to card expand/collapse, page switches, modal opens. Nothing should snap instantly. |
| P2 | **No empty states** | When a page has no data, show a helpful message with a clear call to action, not a blank space. |
| P3 | **Session summary overlay could show more** | Should show: total session volume vs last same split, muscles worked with colour chips. |

---

## 7. Feature Roadmap

Features are grouped by phase. **Do not start Phase 2 until Phase 1 is complete.** This is a rule, not a suggestion.

### Phase 1: Stable, Usable on Mobile (start here)

Goal: Make the existing app feel solid and polished on a real phone. Fix all priority 1 and 2 issues above. Use it during actual gym sessions to verify it works.

- [ ] Fix landscape layout break (B1)
- [ ] Fix remaining comma/decimal input bugs (B2)
- [ ] Fix non-functional buttons (B3)
- [ ] Improve mobile spacing and tap target sizes (B4)
- [ ] Fix pre-fill UX on log form (U1)
- [ ] Overhaul rest timer, prominent countdown display (U2)
- [ ] Make rest timer duration configurable (default 90s, adjustable per user)
- [ ] Make rest timer optional (can be turned off entirely)
- [ ] Fix edit mode clarity: labels, colour swatches, section reordering (U3, U4, U5)
- [ ] Improve recap to show only high-value metrics (U6)
- [ ] Add micro-interaction transitions (P1)
- [ ] Add empty states to all pages (P2)

**Definition of done:** You used it through a full gym session with no frustration. Not "it looks right on screen." Actually used it.

### Phase 2: PWA (Installable, Offline)

Goal: Install IronLog directly on your homescreen. No more HTML viewer app. This is the most impactful thing you can do for the day-to-day experience, and it unlocks everything after it.

Before starting Phase 2, set up a GitHub repository. You need it for version history and for GitHub Pages hosting (free HTTPS), which the PWA and Play Store submission both require.

- [ ] Create GitHub repository and push current code
- [ ] Set up GitHub Pages (free, HTTPS, no domain needed)
- [ ] Add `manifest.json` (name, icons, theme colour, display: standalone, orientation: portrait)
- [ ] Add a service worker for offline caching (cache-first, app works with no internet)
- [ ] Create app icons (192px and 512px minimum)
- [ ] Test install flow on Android Chrome ("Add to homescreen")
- [ ] Test install flow on iPhone Safari ("Add to homescreen")

**Definition of done:** IronLog is on your homescreen. Opens without internet. The HTML viewer app is no longer needed.

### Phase 3: Warm-Up Sets

Goal: Add optional warm-up sets before the first working set of each muscle group trained that session.

Design rules, do not deviate from these:
- Warm-up sets are **off by default**, enabled per session or per muscle group
- Maximum 2 warm-up set rows per muscle group, and only before the **first exercise** of that group in that session (not per exercise, that would be too much)
- Warm-up sets are stored in history for reference but do NOT count toward volume, PRs, or progress charts
- They must not visually clutter the log form

- [ ] Add warm-up toggle (off by default)
- [ ] Show 1 to 2 warm-up set rows before first exercise of a muscle group
- [ ] Exclude warm-up sets from all stats calculations
- [ ] Show warm-up sets in history, clearly labelled

**Definition of done:** You can do 2 warm-up sets before your first bench press and your progress stats are unchanged.

### Phase 4: Notifications & Engagement

Goal: The app reminds you to train and acknowledges your progress passively. This matters because maintaining a consistent gym schedule without external reminders is genuinely hard. A streak that can die, a notification that fires when you've been away too long, and a milestone badge when you hit 30 days are all small things that add up to actually going.

- [ ] Push notification: "You haven't logged a workout in X days" (configurable threshold, default 2 days)
- [ ] Push notification: rest timer end alert (vibrate + sound)
- [ ] Streak milestone notification (7 days, 30 days, etc.)
- [ ] PR share card: generate a shareable image of a PR for sending to someone (not a built-in social feed)

**Note:** Push notifications require a PWA or native app. Phase 2 must be complete first.

### Phase 5: Android App Store

Goal: IronLog is on Google Play and your sister can download it.

- [ ] Evaluate wrapping options:
  - **Bubblewrap / TWA (Trusted Web Activity):** Google's official tool to wrap a PWA as an Android APK. Free. Requires HTTPS hosting. Recommended.
  - **Capacitor:** More control, slightly more complex. Use only if TWA causes problems.
- [ ] Choose wrapping tool and set up build
- [ ] Create Google Play Developer account ($25 one-time fee)
- [ ] Write store listing (name, description, screenshots, category: Health & Fitness)
- [ ] Generate signed APK / AAB
- [ ] Test on sister's Android before submission
- [ ] Submit for review

**Why TWA:** It wraps the GitHub Pages PWA directly. No code rewrite. GitHub Pages URL goes in, signed APK comes out.

### Phase 6: iOS App Store (Later)

Goal: IronLog on the Apple App Store. Lower priority because you can already install the PWA on your iPhone via Safari without paying Apple.

**Important note:** After Phase 2, you can go to the GitHub Pages URL on your iPhone, tap Share, and tap "Add to Home Screen." That installs it as a proper homescreen app. No App Store needed, no $99/year needed. This may be sufficient for you indefinitely. Evaluate whether the App Store is actually necessary before committing to the fee.

- [ ] Apple Developer Program ($99/year): evaluate before paying
- [ ] Test PWA install on iPhone Safari
- [ ] Evaluate Capacitor for iOS build if needed
- [ ] App Store submission

### Phase 7: Cloud Sync (Optional, Future)

Goal: Data that survives across devices, app reinstalls, and clearing browser storage.

**Why this is Phase 7 and not earlier:** Cloud sync requires a stable data model, a hosted app, and a login system. None of those exist yet. Adding it too early means rewriting everything twice.

- [ ] Evaluate Firebase Firestore (free tier: 1GB storage, 50k reads/day, sufficient for personal use at zero cost)
- [ ] Add sign-in via Google or Apple (Firebase Auth, free)
- [ ] Sync DB object to Firestore on every save, pull on app load
- [ ] Keep localStorage as local cache (offline-first: write local, sync to cloud when online)
- [ ] JSON export/import remains as manual fallback

---

## 8. RPE / RIR Tracking (Optional Feature)

Rate of Perceived Exertion (RPE, scale 1 to 10) or Reps in Reserve (RIR, how many reps you had left) can be logged per set to track training intensity.

- Off by default (a toggle in settings)
- When enabled: a small RPE or RIR field appears next to each set's reps and weight
- Stored in history but does not affect charts or stats unless explicitly viewed
- Not a Phase 1 or 2 feature. Add after the app is stable and you have used it for a while.

---

## 9. What We Are NOT Building

If you feel tempted to build any of these, re-read this section.

| Not building | Why |
|---|---|
| Plate calculator | Not needed |
| Video / GIF exercise guidance | Adds complexity, doesn't fit the app's purpose |
| Social feed / public profiles | Out of scope. A PR share card is enough. |
| Light mode | Dark only, this is decided |
| Workout program templates (12-week plans etc.) | Too complex. Future consideration only. |
| Custom exercise library | Possible later, not now |
| Full multi-profile system | Everyone logs on their own phone |
| Paid features / subscription | Free app |
| Desktop-first web dashboard | Mobile-first only |
| Mini-game during rest (e.g. Flappy Bird) | Pulls focus away from training. Rest time is mental prep. A motivational one-liner on the rest overlay ("Last set was 100kg, beat it") achieves the same feel without the distraction. |

---

## 10. Platform & Hosting Strategy

### Right Now (Phase 1)

Continue using `ironlog-bundle.html` with the HTML viewer app. Rebuild the bundle whenever you make changes by combining the three source files. This is fine for Phase 1.

### Phase 2: Getting It Properly Installed

1. Host the app on **GitHub Pages** (free, HTTPS, no domain needed)
   - URL format: `yourusername.github.io/ironlog`
   - Use this URL to test on any device during development
2. Add `manifest.json` and a service worker
3. On Android: open URL in Chrome, tap "Add to Home Screen"
4. On iPhone: open URL in Safari, tap Share, tap "Add to Home Screen"

This replaces the HTML viewer app and is how you use IronLog day-to-day from Phase 2 onward.

### Phase 5: Getting It on Google Play

Use **Bubblewrap (TWA):**
1. Install Bubblewrap CLI
2. Point it at your GitHub Pages URL
3. It generates a signed APK / AAB
4. Upload to Google Play ($25 one-time fee)

Zero code rewrite. The PWA you already have becomes the Android app.

### Testing During Development

You do not need a build pipeline. The workflow is:
- Edit `index.html`, `style.css`, `app.js` on your computer
- Rebuild the bundle (manually or with a small script)
- Push to GitHub (Pages updates automatically within ~60 seconds)
- Open the URL on your phone and test

---

## 11. Build Schedule (Rough Weekend Estimates)

Assumes around 4 to 6 hours of focused work per weekend session.

| Phase | Estimated weekends | Notes |
|---|---|---|
| Phase 1: Stable & Polished | 3 to 4 weekends | Bugs plus UX fixes |
| Phase 2: PWA | 1 to 2 weekends | manifest, service worker, GitHub Pages |
| Phase 3: Warm-Up Sets | 1 weekend | Contained, well-defined feature |
| Phase 4: Notifications | 1 to 2 weekends | Needs PWA first |
| Phase 5: Android Store | 1 weekend | Mostly setup and submission |

**Rough total:** 7 to 10 weekends. At one weekend per week, a summer release is realistic.

The risk is not the work itself. The risk is starting Phase 3 halfway through Phase 1, spending a weekend on something in the "not building" list, or stopping when Phase 2 is 80% done because it feels mostly finished. Each phase has a clear definition of done. Use it.

---

## 12. Decisions Already Made

These are settled. Don't revisit them unless something fundamentally breaks.

| Decision | Choice | Reason |
|---|---|---|
| Framework | Stay vanilla HTML/CSS/JS | Solo project, first time building something, no need to add complexity |
| TypeScript | No | Adds complexity without clear benefit at this scale |
| Dark mode | Dark only | Personal preference, better for gym use |
| Light mode | No | Not needed |
| Multi-profile | Deprioritised | Everyone uses their own phone |
| Plate calculator | Not building | Out of scope |
| Backend timing | After PWA is stable | Need a stable data model first |
| Store priority | Android first | Cheaper ($25 vs $99/year), sister uses Android |
| PWA approach | GitHub Pages + Bubblewrap TWA | Free, least code to write |
| App name | IronLog (provisional) | Can be changed before store submission |

---

## 13. Open Questions (Answer Before Phase 2)

These don't need answers today but must be resolved before Phase 2 starts.

- [ ] **Final app name:** Is IronLog the name going into the store, or do you want to explore others?
- [ ] **App icon / logo:** Needed for PWA manifest and store listing. A simple icon (barbell or bolt shape in lime on dark) can be made free in Figma or generated with an AI image tool.
- [ ] **GitHub username:** Determines your GitHub Pages URL (`username.github.io/ironlog`).
- [ ] **Google Play account:** $25 one-time fee. Set it up when Phase 5 starts, not before.

---

## 14. Success Criteria

The project is done when:

1. The app runs as an installed homescreen app on your iPhone (no HTML viewer)
2. The app runs as an installed homescreen app on your sister's Android
3. You can use it through a full gym session with no friction or bugs
4. Data persists reliably across sessions
5. It is available on the Google Play Store for download

Everything else (cloud sync, iOS App Store, social sharing, RPE tracking) is bonus.

---

*Last updated: 2026-04-26*
*Built with Claude Code*
