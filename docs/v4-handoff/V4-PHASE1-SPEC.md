# IronLog V4 · Phase 1 — Two-Tier Navigation + Insights Home

> **Audience:** Claude Code (implementer). **Companion docs:** `V4-REDESIGN-PLAN.md` (full strategy), prototypes `IronLog V4 Prototype.html` / `IronLog V4 Home.html` / `IronLog V4 Shell.html` (visual + interaction reference — match these).
> **Scope of this phase:** introduce the missing second navigation level, replace the ugly Home "domains" card with the cross-domain **Today** Insights hub, and make Sleep/Finance polished **Coming-Soon**. **No data-model breakage. No framework. Ships behind the test gate.**
> **Out of scope (later phases):** custom SVG charts, cloud backup, `app-ui.js` extraction, Exercise Form Library.

---

## 0. Guardrails (do not violate)
1. Edit `IronLog v3.html`, then copy byte-identical to `index.html`.
2. New runtime JS files → add to `ASSETS` in `sw.js` **and** bump `CACHE` (next after `ironlog-v22`).
3. Keep all existing Node test suites green (`app-core/storage/fitness`, `domain-shell-mvp`, `nutrition-stage1–5`). Add new tests for new pure logic.
4. No destructive `localStorage` migration. New `DB` fields are optional + defaulted; old data must load unchanged.
5. Respect `prefers-reduced-motion` (the Apex layer already does).
6. Preserve the deep link `goToSplit(spId)` and all Apex moment hooks.

---

## 1. What changes (delta from current build)

| Area | Today | After Phase 1 |
|---|---|---|
| Entry screen | `page-home` = Fitness dashboard **+** "IronLog domains" card with gray `mini` buttons | `page-home` = **Today Insights hub** (cross-domain recap + suggestions + tiles). The domains card is **deleted**. |
| Fitness sub-sections | Train/Progress/History reached via global tabs + the gray home buttons | **Tier-2 sub-tabs** inside the Fitness domain (segmented control) |
| `switchTab()` | one-level router via `pageMap` | wrapped by a **two-tier router** (domain × sub-tab) in `app-nav.js` |
| Sleep / Finance | half-baked MVP forms (zero-state noise) | polished **Coming-Soon** screens, gated by `DB.settings.domainsEnabled`; existing logging code/data preserved |
| Domain accents | ad-hoc inline `rgba()` | CSS tokens `--domain-*`; active domain drives `--acc` |

---

## 2. Data model additions (all optional, defaulted)
```js
DB.app = DB.app || {};
DB.app.lastView   = DB.app.lastView   || 'home';      // 'home' | 'fitness' | 'nutrition' | 'sleep' | 'finance'
DB.app.lastSub    = DB.app.lastSub    || {};          // { fitness:'Home', nutrition:'Today' }
DB.settings = DB.settings || {};
DB.settings.domainsEnabled = DB.settings.domainsEnabled || { fitness:true, nutrition:true, sleep:false, finance:false };
```
- Migration = pure defaulting on load (in `app-storage.js`'s normalize step). No data rewrite.
- `domainsEnabled.sleep/finance = false` ⇒ those tabs render Coming-Soon. Flipping to `true` restores the existing MVP logging UI **unchanged** (keep the current `renderSleep`/`renderFinance` functions; just branch at the top).

---

## 3. New module: `app-nav.js` (the core of this phase)
Pure-ish navigation controller. No DOM-heavy logic that can't be unit-tested for the state parts.

```
// State
navState = { view: 'home', sub: { fitness:'Home', nutrition:'Today' } }

// Pure helpers (unit-tested in app-nav.test.js)
SUBS = { fitness:['Home','Train','Progress','History'], nutrition:['Today','Foods','Trends'], sleep:[], finance:[] }
resolveScreen(view, sub) -> 'home' | 'fitness:Home' | 'nutrition:Foods' | 'sleep:' | ...
domainAccentVar(view)    -> 'var(--fitness)' | ... | 'var(--fitness)' for home
isComingSoon(view, settings) -> bool   // sleep/finance when domainsEnabled[view]===false

// Side-effecting (thin)
goHome()            // view='home'; persist; render
enterDomain(d)      // view=d; render
setSub(d, s)        // sub[d]=s; persist; render
restore(DB)         // read DB.app.lastView/lastSub on boot
```
- On every nav change: set `--acc` to the active domain accent (home → Fitness coral), persist `DB.app.lastView/lastSub`, call the right `render*()`.
- Register in `sw.js ASSETS`; load before the app glue script.

---

## 4. UI structure

### 4.1 Top bar
- Left: **IronLog wordmark** (forged chevron mark + serif text). Tapping it = `goHome()`. On Home it shows a coral underline dot (`.is-home`); inside a domain it shows the **domain name** instead of "IronLog".
- Right: gear → existing Settings sheet (unchanged).

### 4.2 Tier-1 — bottom bar (existing 4 tabs, refined)
- Fitness · Nutrition · Sleep · Finance. Active tab uses the **domain accent**. Tapping = `enterDomain(d)`.
- **Home is NOT a bottom-bar slot** — it's reached via the wordmark and is the launch screen.

### 4.3 Tier-2 — segmented sub-nav (NEW)
- A horizontally-scrollable pill row directly under the top bar, shown only for domains that have sub-tabs (`SUBS[view].length`).
- Fitness: Home · Train · Progress · History. Nutrition: Today · Foods · Trends.
- Active pill = `background: color-mix(in srgb, var(--acc) 14%, transparent); color: var(--acc)`.
- Hidden entirely for Sleep/Finance (Coming-Soon).

### 4.4 Home = Today Insights hub (replaces the domains card)
Match `IronLog V4 Home.html`. Three zones:
1. Greeting + date.
2. **Recap** — `Yesterday | Last 7 days` segmented toggle; 2×2 domain cards (accent left-edge), each tappable → `enterDomain(d)`. Numbers come from existing helpers: `IronLogFitness.weeklyVolumeSummary`, `sessionSummary`, nutrition totals, `sleepWeeklySummary`, `financeMonthSummary`.
3. **Today's focus** — 2–4 suggestion cards from `app-insights.js` (§5). Each: domain-accent icon, one line, optional CTA deep-link (e.g. "Start Legs" → `enterDomain('fitness'); setSub('fitness','Train')`). Dismissible (session-only is fine for Phase 1).
4. **Jump-in tiles** — 4 domain cards (accent), tappable → `enterDomain(d)`.

### 4.5 Coming-Soon (Sleep/Finance)
Match the prototype: domain-accent forged chevron, kicker, "Coming soon" (one line — `white-space:nowrap`), one promise line, 2–3 roadmap bullets, "In the workshop" footer. Rendered when `isComingSoon(view, DB.settings)`.

---

## 5. New module: `app-insights.js` (suggestion engine)
Pure functions, fully unit-tested (`app-insights.test.js`). Input `DB` + `todayStr`; output ranked array.

```js
// returns [{ domain, severity, icon, text, cta? }] sorted by severity desc, capped at 4
function homeSuggestions(DB, todayStr) { ... }
```
Starter rules (each guarded — emit nothing if the data isn't there):
- **Sleep:** last bedtime later than target OR duration < ~7h → "You went to bed at {t} — aim for {target} tonight." (reads `DB.sleep.logs` even while Sleep tab is Coming-Soon.)
- **Sleep:** 7-day bedtime spread high → "Your sleep is inconsistent — pick a fixed bedtime."
- **Fitness:** a split not trained > 7d (reuse `leastRecentSplitSuggestion`) → "You haven't trained {split} in {n} days." CTA → Fitness/Train.
- **Fitness:** recent volume below trend → "Lighter week than usual — push intensity."
- **Nutrition:** calories over target (today/week) → "~{n} kcal over — ease off to stay on your cut."
- **Nutrition:** protein under target → "Low on protein — add ~{n}g today."
- **Finance:** spend pace > budget pace → "You're {n}% over budget pace — spend less this week."
- **Positive:** streak milestone / on-target week → low-severity reinforcement.
Tone: short, direct, encouraging. Never nag. Register in `sw.js ASSETS`.

---

## 6. Component hierarchy (target)
```
AppShell
├─ TopBar (wordmark→Home | domainName · gear→Settings)
├─ SubNav (Tier-2, per-domain; hidden on Home & Coming-Soon)
├─ Body
│   ├─ Home (Today hub: recap · suggestions · tiles)
│   ├─ Fitness: Home | Train | Progress | History
│   ├─ Nutrition: Today | Foods | Trends
│   ├─ Sleep: ComingSoon
│   └─ Finance: ComingSoon
├─ BottomBar (Tier-1 domains)
└─ ApexLayer (splash/PR/streak/seal/share/toasts — unchanged)
```

## 7. Build sequence (for the implementer)
1. **Tokens:** add `--domain-fitness/nutrition/sleep/finance`; make `--acc` settable per domain.
2. **`app-nav.js`** + `app-nav.test.js` (state/resolve/restore pure parts). Wire `switchTab` to delegate.
3. **Sub-nav UI** for Fitness + Nutrition (segmented control); route to existing `render*` per sub-tab. **No content rewrite** — Train/Progress/History already render; just re-parent them under the sub-nav.
4. **Delete** the `domainShell` domains card from `renderHome`.
5. **Today hub:** rebuild `renderHome()` to the three-zone layout; wire recap numbers to existing helpers.
6. **`app-insights.js`** + tests; render Today's-focus from it.
7. **Coming-Soon:** branch `renderSleep`/`renderFinance` on `isComingSoon`; keep MVP code intact below the branch.
8. **Persist/restore** `DB.app.lastView/lastSub`.
9. Add new files to `sw.js ASSETS`, bump `CACHE`, run all tests, sync `index.html`.

## 8. Acceptance criteria (Phase 1 "done")
- [ ] App launches into the **Today hub**; the old gray-button "domains" card is gone.
- [ ] Bottom bar = 4 domains; tapping changes domain **and** accent color.
- [ ] Fitness shows Tier-2 sub-tabs (Home/Train/Progress/History); Nutrition shows Today/Foods/Trends; switching sub-tabs swaps content with no full reload jank.
- [ ] Wordmark always returns to the Today hub; nav position (`lastView`/`lastSub`) restores on reload.
- [ ] Home recap toggles Yesterday/Last-7-days with real numbers; suggestions render from `app-insights` (2–4, ranked); a suggestion CTA deep-links correctly; tiles enter their domain.
- [ ] Sleep & Finance render polished Coming-Soon (one-line headline, accent chevron, bullets); flipping `domainsEnabled.sleep/finance=true` restores the original logging UI intact.
- [ ] No console errors; all Node test suites green; `index.html` byte-identical to `IronLog v3.html`; `sw.js` cache bumped.
- [ ] No `localStorage` data loss; v2/v3 data loads unchanged.

## 9. Risks & mitigations
- **Router regressions** → unit-test `resolveScreen`/`restore`; keep `switchTab` name as a thin delegate so existing callers (e.g. empty-state buttons, `goToSplit`) keep working.
- **Re-parenting Train/Progress/History** → they already exist as `page-*`; move them under the sub-nav container rather than rewriting their renderers.
- **Coming-Soon hiding real data** → gate, don't delete; data + functions stay; reversible via one flag.
- **Accent token churn** → introduce tokens first (step 1) so later steps just reference them.
