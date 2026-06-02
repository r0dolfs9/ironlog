# IronLog V4 — Redesign Strategy & Claude Code Handoff

> **Status:** Strategy + implementation handoff. Not yet executed.
> **Author:** Product/architecture pass, 2026-06-02. **Rev 2** — owner decisions folded in (Sleep/Finance = Coming-Soon; Home = cross-domain Insights hub; focus = Fitness + Nutrition).
> **Naming:** The app is already internally "v3-complete" (`IronLog v3.html`, the 25-step v3 plan is ✅, service worker at `ironlog-v22`). To avoid confusion this next evolution is called **V4**. Everywhere below, "V4" = the redesign described here.
> **How to use this doc:** Phases 1–2 are analysis and the go/no-go decision. Phases 3–4 are the design. Phase 5 is the build order. Phase 6 is the literal handoff spec for Claude Code. **Open Decisions** at the end need the owner's answer before Phase 3 work starts.

---

## 0. Source of truth & ground rules (read first)

These are lifted from the repo's existing `PROGRESS.md` / `docs/release-checklist.md` and **must not be violated by V4 work**:

- **Edit order:** `IronLog v3.html` is the dev source; `index.html` is the live GitHub Pages copy. They must stay byte-identical. Any change lands in both.
- **Extracted logic lives in modules:** `app-core.js` (shell/sleep/finance pure logic), `app-storage.js` (persistence, JSON backup, import validation, `il4` migration), `app-fitness.js` (all fitness math). These have Node regression tests (`*.test.js`) that must stay green.
- **PWA contract:** every new runtime file must be added to `ASSETS` in `sw.js` and the `CACHE` constant bumped, or the change won't ship to installed devices.
- **Data is sacred & local-first:** all user data is in `localStorage`. The JSON export/import format and forward-compatibility (v2 data → newer app) must be preserved. No migration may be destructive.
- **Release gate:** run `app-core`, `app-storage`, `app-fitness`, `domain-shell-mvp`, and `nutrition-stage1–5` tests before any push.

**V4 must respect all of the above. It is a restructure, not a rewrite from zero.**

---

## Phase 1 — Current State Assessment

### 1.1 What IronLog is today
A single-file, offline-first **personal-tracking PWA** that began as a workout logger and expanded into **four domains**: Fitness, Nutrition, Sleep, Finance. It runs entirely client-side (localStorage), is installed to the home screen, and is maintained by a solo owner working with AI coding agents.

### 1.2 Pages & feature inventory

| Domain | Surface | Maturity | Notes |
|---|---|---|---|
| **Fitness** | Home dashboard (`page-home`) | Shipped | Suggestion hero, This-week, Streak, Body-weight, Long-lost cards. **Also hosts the "IronLog domains" launcher card + Train/Progress/History buttons** (the collision — see 1.3). |
| Fitness | Train (`page-train`) | Shipped | Split pills → exercise list → `sc3` big-card set logging, RPE, gesture weight wheel, rest-timer sheet. Strong. |
| Fitness | Progress hub (`page-progress-hub`) | Shipped | Comparison header, muscle radar (Chart.js), Records podium, Recap. |
| Fitness | History (`page-history`) | Shipped | 12-week heatmap + session timeline. |
| Fitness | Body weight + Records | Shipped | 72px serif hero, sparkline, goal bar; gold/silver/bronze PR podium + Records Hall (Apex). |
| **Nutrition** | `page-nutrition` | Shipped | Macro dashboard, food search (starter/saved/recipe), cooked-weight recipe builder, 7-day trend, macro coach, AI handoff export. Strong. |
| **Sleep** | `page-sleep` | **MVP / half-baked** | Logs bedtime/wake/quality/notes; 7-day summary card shows **zeros when empty** ("0h 0 avg · 0/7 nights"). Flagged "kinda useless info." |
| **Finance** | `page-finance` | **MVP / half-baked** | Budget + manual expenses + category split. Flagged "very useless… either properly made or show coming soon." |
| Cross | Settings (gear sheet) | Shipped | Rest config, JSON export/import, AI markdown export, theme switching, new-day. |
| Cross | Apex moment system | Shipped (this project) | Forged-chevron motion language: boot splash, PR moment, streak tower, set-logged stamp, rest-ring forge, session seal, pull-to-refresh, shareable session card, Records Hall, empty-state marks, tab indicator. Theme-aware. **This is V4's visual identity — carry it forward.** |

### 1.3 Navigation structure — **the root-cause problem**

There are **two navigation eras fighting inside one bar**:

- **Fitness-era tabs (original):** Home · Train · Progress · History — a fitness app's primary sections.
- **Domain-era tabs (current bottom bar):** Fitness · Nutrition · Sleep · Finance — four domains.

When the domains took over the bottom bar, **Fitness's own sub-sections had nowhere to go**, so they were dumped onto the Home screen as a glass card containing gray `mini` buttons (Train/Progress/History) plus a 2×2 domain grid that **duplicates the bottom bar**. That is precisely what the owner circled as "looks ugly / looks weird."

**Diagnosis:** the app has *two levels of navigation* (which domain am I in? + where am I inside that domain?) but only *one level of nav UI*. Everything else downstream (the ugly home card, the redundant domain grid, the awkward seams) is a symptom of this single missing level.

### 1.4 Technical architecture (today)
- **One ~5,100-line HTML file** (`IronLog v3.html` = `index.html`) holding all markup, CSS, and app glue.
- **Three extracted, tested logic modules** (`app-core/storage/fitness.js`) — a deliberate, healthy de-monolithing already in progress.
- **Chart.js** (CDN) for radar/line charts — flagged in PROGRESS as a "stock app tell."
- **Service worker** cache-first PWA; `manifest.json`; maskable icons; the new Apex `favicon.svg`.
- **State:** a single global `DB` object persisted to `localStorage`; `render*()` functions rebuild `innerHTML` per screen; `switchTab()` is the router via a `pageMap`.

### 1.5 Product architecture (today)
Flat. Every screen is a sibling `page` div toggled by `switchTab`. Domains, fitness sub-sections, and cross-cutting surfaces (Settings) all live at the same level. There is no concept of "I am inside the Fitness domain, and Train/Progress/History are its children."

### 1.6 Debt register

| # | Type | Issue | Severity | Evidence |
|---|---|---|---|---|
| D1 | **IA / Nav** | Two-level nav modeled with one-level UI → ugly home "domains" card, duplicated domain grid, demoted gray buttons | **Critical** | Owner markups "looks ugly / looks weird" |
| D2 | UX | Sleep/Finance show zero-state noise instead of value or an honest "coming soon" | High | Owner markups "useless info" |
| D3 | Technical | 5,100-line monolith HTML; hard to navigate/edit safely | High | File size; ongoing module extraction |
| D4 | UX | Home screen does two jobs (Fitness dashboard **and** app launcher) and neither cleanly | High | 1.3 |
| D5 | Resilience | No cloud backup; one Safari cache wipe = total data loss | High | PROGRESS "what's next" #3 |
| D6 | Visual | Chart.js looks generic vs the bespoke Apex aesthetic | Medium | PROGRESS "custom SVG charts" |
| D7 | Consistency | Domain accent colors exist ad hoc (inline `rgba`s) but aren't a real token system | Medium | `domainShell` inline styles |
| D8 | Discoverability | Records, Recap, Body weight nested 2–3 levels deep under Progress | Medium | `pageMap` |

### 1.7 Assumptions to challenge (per the brief)
- ❌ *"A V4 redesign must rebuild every screen."* — **False.** Train, set-logging, Nutrition, Progress, History, and the Apex layer are good. V4 is mostly **navigation + shell + design-system + finishing Sleep/Finance**, not a teardown.
- ❌ *"More domains ⇒ more top-level tabs."* — The four-domain bottom bar is fine; what's missing is the **second nav level**, not more first-level slots.
- ✅ *"Long-term scalability > preserving current structure"* — Agreed **for the shell/nav**, but the data model and the tested logic modules are assets to preserve, not replace.

---

## Phase 2 — Redesign Evaluation

### Option A — Incremental polish (no architecture change)
Restyle the gray buttons, hide zero-states, tidy spacing.
- **Pros:** hours of work; zero risk.
- **Cons:** leaves D1/D3/D4 intact. The home screen still does two jobs; the next feature re-creates the mess. **Treats symptoms, not the cause.**

### Option B — Targeted architecture redesign (**RECOMMENDED**)
Introduce the **missing second nav level** (domain shell + per-domain nav), redesign the home into a true **domain launcher**, finish Sleep/Finance as polished Coming-Soon, extract a real design-system/token layer, and continue the module split. **Keep** Train, Nutrition, Progress, History, data model, and Apex.
- **Pros:** fixes the root cause (D1, D4), absorbs the owner's markups (D2, D7), advances de-monolithing (D3), preserves everything that works and all data. Shippable in stages.
- **Cons:** more than a weekend; requires disciplined staging + the test gate.

### Option C — Full V4 rewrite (new framework/stack)
Rebuild as a componentized SPA (e.g., a real build step, components, router).
- **Pros:** cleanest long-term ceiling.
- **Cons:** throws away tested logic + a working PWA + data-tested storage; high regression risk; the owner's workflow (single-file, AI-agent edits, GitHub Pages) would change drastically. **Overkill for a local-first solo PWA.**

### Verdict
**Choose Option B.** It solves the actual problem the owner pointed at, banks all prior work, and keeps the local-first PWA simple. Option C's only real win (componentization) is captured incrementally by B's design-system + module-split track without a risky big-bang.

---

## Phase 3 — V4 Product Architecture

> Decision rule for every item below: **Why it's better / What it fixes / What complexity it removes / What growth it enables.**

### 3.1 Core move: a two-tier navigation model
- **Tier 1 — Domain switch (bottom bar):** Fitness · Nutrition · Sleep · Finance. Unchanged slots, refined visuals + domain accent tokens.
- **Tier 2 — In-domain nav (segmented control / sub-tabs under the top bar):** e.g. Fitness = Home · Train · Progress · History. Nutrition = Today · Foods · Trends.
- **Why better:** matches the real mental model ("which area / where in it"). **Fixes** D1/D4. **Removes** the home "domains card" and the duplicated 2×2 grid entirely. **Enables** any domain to grow its own sub-sections without touching the global bar.

### 3.2 Home → a cross-domain **"Today" Insights Hub** (owner-confirmed)
The app **launches into Home**, a dedicated cross-domain overview — *not* a Fitness dashboard and *not* the old gray-button "domains" card (that card is **deleted**). Home is the navigation hub: you read what happened, get nudges, and jump into any domain. The **IronLog wordmark in the top bar always returns Home**; the bottom bar stays the four domains.

Home has three stacked zones:

1. **Greeting + date** (existing style).
2. **Recap strip — "Yesterday" / "Last 7 days" toggle.** One compact stat per domain, each tappable to dive in:
   - Fitness: sessions this week + top lift / "rest day."
   - Nutrition: calories vs target today (e.g. `2,310 / 2,400`).
   - Sleep: last night's duration + vs target bedtime *(reads existing sleep logs even while the Sleep tab is Coming-Soon).*
   - Finance: spend vs budget pace this month.
3. **Smart Suggestions (the heart of Home).** A ranked list of 2–4 actionable, cross-domain nudges from a rules engine (3.2.1). This is what the owner asked for: *"you woke at 1:00 — go to sleep earlier, like 24:00," "train more intense," "spend less money," "eat less."* Each suggestion has an icon (domain-accent), one line of plain-language advice, and an optional CTA that deep-links into the relevant domain.
4. **Domain tiles** (refined, intentional — replaces the ugly grid): four cards with domain accent + the same recap number, as the explicit "jump in" affordance.

- **Why better:** Home now has exactly one clear job — *"what's going on across my life + what should I do next."* **Removes** D1/D4/D7, and turns the most-opened screen into the app's most valuable one. **Enables** any future domain to contribute a recap stat + suggestion rules without UI surgery.

#### 3.2.1 Suggestion engine (`app-insights.js`, pure + tested)
A small, deterministic rules engine. Input: `DB` (+ today's date). Output: a ranked array `{domain, severity, icon, text, cta}`. Starter rules (extend freely):

| Domain | Trigger (from existing data) | Example suggestion |
|---|---|---|
| Sleep | last bedtime later than target, or duration < ~7h | "You went to bed at 1:00 — aim for 24:00 tonight." |
| Sleep | 7-day bedtime spread high | "Your sleep is all over the place — pick a fixed bedtime." |
| Fitness | no session in N days, or a split not trained > 7d | "You haven't trained Legs in 9 days." |
| Fitness | recent volume/intensity below personal trend | "Lighter week than usual — push intensity next session." |
| Nutrition | calories over target today / on the week | "~300 kcal over today — ease off to stay on your cut." |
| Nutrition | protein under target | "Low on protein — add ~40g today." |
| Finance | spend pace > budget pace for the month | "You're 20% over budget pace — spend less this week." |
| (positive) | streak milestone / on-target week | "3 solid days — keep the streak." (reinforcement, low severity) |

Rules are **pure functions** with Node tests (`app-insights.test.js`), sorted by severity, capped at 2–4 shown. No data is invented; if a domain has no data, it simply contributes no suggestion. Tone: short, direct, encouraging — never nagging.

### 3.3 Fitness (preserve, re-parent)
Keep Home dashboard, Train, Progress (with Records + Recap + Body-weight as its children), History, and the Apex moments. Only change: they're reached via Fitness's Tier-2 nav, not via global tabs or a home card. Surface **Records** and **Body weight** one level shallower (they're high-value, currently buried — D8).

### 3.4 Nutrition (preserve, light re-parent)
Today · Foods (search/saved/recipes) · Trends (7-day + coach) · AI export. Already strong; just gets a consistent Tier-2 nav.

### 3.5 Sleep & Finance — **polished "Coming Soon"** (absorbs D2 markups)
Per the owner's own `docs/future-app-structure.md` ("Sleep and Finances can start as polished 'Coming soon' screens until their real workflows are designed") **and** the markups: replace the half-baked MVP forms with a **beautiful, on-brand Coming-Soon screen** per domain — forged Apex chevron in the domain accent, a one-line promise, and 2–3 honest "what's coming" bullets. **Preserve the existing logging code + data behind a flag** so it's fully reversible / promotable later.
- **Why better:** no more zero-state noise; the app reads as intentional everywhere. **Fixes** D2.
- **Decision point:** Coming-Soon now vs. invest in making one of them genuinely great (see Open Decisions).

### 3.6 Settings architecture
Keep the single gear → sheet, but split into clear sections: **Data** (export/import/cloud), **Appearance** (theme — now also drives domain accents), **Training** (rest defaults), **About**. Settings stays cross-domain (not duplicated per domain).

### 3.7 Data organization
No schema breakage. Namespaced as today: `DB.workouts/splits/exercises/bodyWeights/bwGoal/sessionStarts/sessionNotes/settings/nutrition/sleep/finance/app`. V4 adds only: `DB.app.lastDomain` + `DB.app.lastSubtab.<domain>` (restore where the user was), and `DB.settings.domainsEnabled` (to gate Sleep/Finance behind Coming-Soon). All optional, all forward-compatible.

---

## Phase 4 — V4 Technical Architecture (avoid overengineering)

> This is a local-first, single-file PWA maintained via AI agents. V4 keeps that shape. **No backend, no build step, no framework is introduced** unless an Open Decision says so.

### 4.1 Frontend structure — continue the de-monolith
Extend the existing pattern (it's working): keep markup/CSS in the HTML, but move **rendering + behavior per domain** into tested-ish modules mirroring the logic split:
- `app-core.js` (exists) — shell, routing helpers, sleep/finance pure logic.
- `app-storage.js` (exists) — persistence/backup/import.
- `app-fitness.js` (exists) — fitness math.
- **NEW `app-nav.js`** — the Tier-1/Tier-2 router, `lastDomain`/`lastSubtab` restore, the domain accent resolver. *(The single highest-leverage new module — it encodes the fix for D1.)*
- **NEW `app-insights.js`** — the cross-domain Home recap + suggestion rules engine (3.2.1). Pure functions, Node-tested. The brain behind the new Home.
- **NEW `app-ui.js`** (optional, later) — shared render helpers (cards, sheets, empty states, the Apex chevron/mark factory) so Sleep/Finance/coming-soon and future screens reuse one set.

### 4.2 State management
Keep the single `DB` + `saveDB()` model — it's adequate and debuggable. Formalize one rule: **render functions read `DB`, never cache derived state**; all derived numbers come from `app-fitness`/`app-core` helpers (already mostly true). Add a tiny `navState` (current domain/subtab) in `DB.app` so reloads restore position.

### 4.3 Design-system / token layer (fixes D7)
Promote the ad-hoc inline colors into real tokens:
- `--domain-fitness`, `--domain-nutrition`, `--domain-sleep`, `--domain-finance` (accent per domain).
- Tier-2 nav, cards, and Apex marks read the **active domain accent** the same way the Apex layer already reads `--acc` (theme-aware).
- Spacing scale + card/radii/shadow tokens already exist from v3 — document them so screens stop using one-off inline `style=`.

### 4.4 Charts (D6, optional)
Plan to replace Chart.js with inline SVG (thick lines, fading area fill, Instrument-Serif value labels) to match Apex. **Should-have, not Must** — it's polish, not architecture.

### 4.5 Storage & sync (D5)
Stay local-first. **Cloud backup is in scope as a Should-have, Google-Drive-first** (owner-confirmed "yes if doable"):
- **Mechanism:** client-side OAuth via Google Identity Services → write a periodic JSON snapshot to Drive **`appDataFolder`** (a hidden, app-owned folder). Restore reads it back. **No backend/server** — runs from the static GitHub Pages site. One-time setup: a free Google Cloud OAuth client ID added to config.
- **Caveat:** iCloud has no equivalent web API, so Drive is the realistic target. Manual JSON export/import (already shipped) stays as the always-available floor; on desktop, the File System Access API can optionally auto-save to a synced folder.
- **Scope guard:** OAuth is *for backup only* — no accounts, profiles, or always-on sync. Snapshot on app open + after meaningful writes (debounced), plus a manual "Back up now" in Settings › Data.

### 4.6 Folder structure (target)
```
/                      GitHub Pages root
  index.html           live (= IronLog v3.html, byte-identical)
  IronLog v3.html      dev source            ← consider renaming to IronLog.html post-V4
  app-core.js          shell + sleep/finance pure logic
  app-storage.js       persistence / backup / import
  app-fitness.js       fitness math
  app-nav.js           NEW — two-tier router + nav state + domain accents
  app-insights.js      NEW — cross-domain Home recap + suggestion rules engine
  app-ui.js            NEW (later) — shared render/components
  sw.js                service worker (bump CACHE on every ship)
  manifest.json, icons, favicon.svg
  /docs                specs, plans, QA, release checklist
  *.test.js            Node regression suites (keep green)
```

### 4.7 Scalability notes
- The two-tier nav means a 5th domain or a new sub-section is an additive change, not a refactor.
- The module split caps how big any one file gets.
- The token layer means re-theming/new domains is config, not surgery.
- **Explicitly NOT doing:** SPA framework, bundler, server, DB engine. They'd add maintenance the owner's workflow doesn't need.

---

## Phase 5 — Implementation Roadmap

Each phase: **Goal · Deliverables · Dependencies · Risks · Success criteria.** Ship behind the test gate; bump `sw.js` cache each ship.

### Phase 0 — Design-system + nav contract (foundation, no UX change yet)
- **Goal:** land tokens + `app-nav.js` skeleton without changing what users see.
- **Deliverables:** domain accent tokens; `app-nav.js` with `goDomain()`, `goSubtab()`, `restoreNav()`; `DB.app.lastDomain/lastSubtab`.
- **Dependencies:** none.
- **Risks:** router regressions → mitigate with a `domain-shell` test extension.
- **Success:** all screens still reachable; position restores on reload; tests green.

### Phase 1 — Two-tier navigation + kill the ugly home card *(fixes D1/D4)* — **MUST**
- **Goal:** Tier-2 sub-tabs per domain; delete the `domainShell` gray-button card; Home = Fitness dashboard only.
- **Deliverables:** Fitness sub-tabs (Home/Train/Progress/History); Nutrition sub-tabs; removal of the domains card + duplicated grid.
- **Dependencies:** Phase 0.
- **Risks:** deep links from Home suggestion → Train must still work (`goToSplit`).
- **Success:** owner's "ugly/weird" markups resolved; no duplicated nav; one job per screen.

### Phase 2 — Sleep & Finance Coming-Soon *(fixes D2)* — **MUST**
- **Goal:** replace half-baked MVPs with polished Coming-Soon (Apex chevron in domain accent + honest roadmap bullets); preserve code/data behind `domainsEnabled`.
- **Success:** no zero-state noise; screens read intentional; logging restorable via flag.

### Phase 3 — Records/BW surfacing + Settings sections *(D8)* — **SHOULD**
- Shallower access to Records & Body weight; Settings grouped into Data/Appearance/Training/About.

### Phase 4 — Custom SVG charts *(D6)* — **SHOULD**
- Replace Chart.js line/radar with bespoke SVG to match Apex; remove the CDN dependency.

### Phase 5 — Cloud backup *(D5)* — **SHOULD** (owner-confirmed, Google-Drive-first)
- Client-side Google OAuth (GIS) → periodic JSON to Drive `appDataFolder`; "Back up now" + "Restore" in Settings › Data. No server. Manual export stays as floor. iCloud not viable (no web API).

### Phase 6 — `app-ui.js` extraction + Exercise Form Library *(NICE)*
- Shared component module; then the planned Fitness "Form" reference feature (`future-app-structure.md`).

**MoSCoW summary**
- **Must:** Phase 0, 1, 2.
- **Should:** Phase 3, 4, 5.
- **Nice:** Phase 6, theme-matched domain art, haptic taxonomy, 1RM estimates, plate calculator.

---

## Phase 6 — Claude Code Handoff Specification

### 6.1 Architecture overview
Local-first PWA. One HTML shell (`IronLog v3.html` = `index.html`) + logic modules (`app-core/storage/fitness/nav[/ui].js`) + service worker. Single global `DB` in localStorage. Two-tier navigation: **domains** (bottom bar) × **sub-tabs** (per domain). No backend/build step.

### 6.2 Design principles
1. **One screen, one job.** (No screen is both a dashboard and a launcher.)
2. **Two nav levels, always explicit.** Domain (bottom) + sub-tab (segmented).
3. **Forged/Apex visual language** everywhere — steel chevron + molten accent, theme- and domain-aware.
4. **Honest states.** Empty = guidance or "coming soon," never a wall of zeros.
5. **Local-first & non-destructive.** Never break the data model or forward-compat.
6. **Token-driven.** No one-off inline colors/spacing; use tokens + domain accents.

### 6.3 Feature inventory
Preserve: Train + sc3 set logging, RPE, gesture wheel, rest timer; Progress (comparison, radar, Records podium/Hall, Recap); History (heatmap + timeline); Body weight; Nutrition (dashboard, foods, recipes, trends, coach, AI export); Settings; **all Apex moments**.
Change: navigation model; Home (launcher→dashboard-only); Sleep/Finance (→Coming-Soon).
Add: `app-nav.js`; domain tokens; nav-state persistence; (later) SVG charts, cloud backup, `app-ui.js`, Form Library.

### 6.4 Key user flows (must keep working)
- Open app → restore last domain+sub-tab.
- Fitness › Home suggestion → "Start workout" → Train with the right split pill active (`goToSplit`).
- Log set → Apex set-stamp; beat best → PR moment; milestone → streak tower; finish → session seal + shareable card.
- Nutrition: search food → log → 7-day trend → AI export.
- Settings → JSON export/import round-trips through `app-storage.js`.

### 6.5 Technical requirements
- Keep `IronLog v3.html` and `index.html` byte-identical; add new modules to `sw.js ASSETS`; bump `CACHE`.
- New logic goes in modules with Node tests; keep existing suites green.
- No destructive migration; new `DB` fields optional + defaulted.
- Respect `prefers-reduced-motion` (Apex already does).

### 6.6 Component hierarchy (target)
```
AppShell
├─ TopBar (title + gear→Settings sheet)
├─ DomainRouter (Tier 1: Fitness|Nutrition|Sleep|Finance)
│   ├─ Fitness ── SubNav: Home | Train | Progress | History
│   │     ├─ Home (dashboard: suggestion, week, streak, BW, long-lost)
│   │     ├─ Train (split pills → sc3 set logging → rest sheet)
│   │     ├─ Progress (comparison · radar · Records · Recap · Body weight)
│   │     └─ History (heatmap · timeline)
│   ├─ Nutrition ── SubNav: Today | Foods | Trends
│   ├─ Sleep ── ComingSoon(accent=sleep)
│   └─ Finance ── ComingSoon(accent=finance)
├─ BottomBar (Tier 1 domain switch)
└─ ApexLayer (overlays: splash, PR, streak, seal, share, toasts)
```

### 6.7 Development sequence
Phase 0 → 1 → 2 (Must, in order) → 3/4/5 (Should) → 6 (Nice). Each phase is independently shippable and reversible.

### 6.8 Acceptance criteria (per Must phase)
- **P0:** every existing screen reachable; nav position restores on reload; all test suites green; cache bumped.
- **P1:** the "IronLog domains" gray-button card is gone; Train/Progress/History are Fitness sub-tabs; bottom bar = 4 domains only; no duplicated nav; Home shows only the dashboard; Start-workout deep link works.
- **P2:** Sleep and Finance render a polished Coming-Soon (domain-accent chevron + roadmap copy); zero-state noise gone; original logging restorable by flipping `domainsEnabled`; no data loss.

### 6.9 Guardrails / do-not-break
Data model & export format; the three (soon four/five) logic modules + their tests; service-worker asset list + cache bump discipline; theme/accent token contract used by Apex; `goToSplit` deep link; reduced-motion support.

---

## Open Decisions — RESOLVED (owner, 2026-06-02)

1. **Sleep/Finance:** ✅ **Coming-Soon for both now.** Focus this cycle on Fitness + Nutrition. Sleep has a clear path to "great" later (bedtime consistency, sleep-debt, recovery-vs-training) — deferred, not dropped.
2. **App entry:** ✅ **Cross-domain "Today" Insights hub** is the launch + navigation home (3.2). Not a Fitness dashboard, not a four-panel launcher.
3. **Cloud backup:** ✅ **In scope (Should), Google-Drive-first** via client-side OAuth to `appDataFolder` (4.5). iCloud not viable; manual JSON stays as floor.
4. **Custom SVG charts:** ⚪ *Open — default: Should (do in V4).* Confirm or defer.
5. **File rename:** ⚪ *Open — default: keep `IronLog v3.html` for now* to avoid touching the release pipeline. Revisit post-V4.

---

## Appendix A — Design language (carry forward)
- **Palette:** warm near-black `#0a0908`; surfaces `#16140f`/`#1f1c16`; text `#f5f1e8`/`#a8a195`/`#6b6359`; accent coral `#ff6b35` + peach `#ffb38a`; success sage `#7fb069`.
- **Domain accents (V4):** Fitness coral `#ff6b35`, Nutrition green `#34d399`, Sleep blue `#4c8bf5`, Finance amber `#fbbf24`.
- **Type:** Instrument Serif (display/big numbers), Geist (UI), Geist Mono (stats/labels).
- **Material:** glass cards `blur(24px) saturate(1.6)`, 22px radii, warm soft shadows, hairline borders, 1px inner highlight.
- **Apex motion:** forged steel chevron + molten accent; splash, PR, streak tower, set stamp, rest-ring forge, session seal, shareable card, pull-to-refresh, empty-state marks, tab indicator. Theme- and (V4) domain-aware. `prefers-reduced-motion` respected.

## Appendix B — Markups folded into V4 (traceability)
| Owner markup | Screen | Resolved by |
|---|---|---|
| "looks ugly" | Home "IronLog domains" gray buttons | Phase 1 (delete card; Tier-2 sub-tabs) |
| "looks weird" | Home seam / This-week spacing | Phase 0/1 (token spacing; one-job Home) |
| "kinda useless info" | Sleep 0h/0-night card | Phase 2 (Coming-Soon) |
| "useless… coming soon or properly made" | Finance MVP | Phase 2 (Coming-Soon) |
