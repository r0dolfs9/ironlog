# IronLog V4 — Claude Code Handoff (START HERE)

You are continuing IronLog, a **local-first, offline PWA** (single HTML file + tested JS modules + service worker). It grew from a workout tracker into a **four-domain** personal app: Fitness · Nutrition · Sleep · Finance. This package is the plan to ship **V4**: fix the navigation, add a cross-domain insights Home, and make Sleep/Finance polished "Coming Soon."

## Read in this order
1. **`V4-REDESIGN-PLAN.md`** — full strategy: current-state assessment, why V4, product + technical architecture, roadmap, decisions (all resolved).
2. **`V4-PHASE1-SPEC.md`** — the concrete build spec for Phase 1 (do this first). Data model, new modules, UI, 9-step sequence, acceptance criteria.
3. **Prototypes (visual + interaction truth — match these):**
   - `IronLog V4 Prototype.html` — the whole app, navigable (start here).
   - `IronLog V4 Home.html` — the Today insights hub in detail.
   - `IronLog V4 Shell.html` — the two-tier nav in detail.

## The one big idea
The app has **two levels of navigation** (which domain · where inside it) but historically only **one** level of UI — so Fitness's sub-sections got dumped onto Home as ugly gray buttons. **V4 adds the second level:** Tier-1 = domains (bottom bar), Tier-2 = per-domain sub-tabs. Home becomes a cross-domain **Today** hub (recap + smart nudges), not a launcher card.

## Non-negotiable guardrails (from the repo's own release process)
1. Edit **`IronLog v3.html`**, then copy **byte-identical** to `index.html`.
2. Any new runtime JS → add to `ASSETS` in `sw.js` **and** bump `CACHE` (next after `ironlog-v22`).
3. Keep all Node test suites green: `app-core`, `app-storage`, `app-fitness`, `domain-shell-mvp`, `nutrition-stage1–5`. Add tests for new pure logic (`app-nav.test.js`, `app-insights.test.js`).
4. **No destructive localStorage migration.** New `DB` fields are optional + defaulted; v2/v3 data must load unchanged.
5. Preserve `goToSplit()` and all Apex moment hooks. Respect `prefers-reduced-motion`.
6. Local-first only — **no backend / framework / build step** introduced in Phase 1.

## Phase order
- **Phase 1 (now):** two-tier nav + Today hub + Sleep/Finance Coming-Soon. → `V4-PHASE1-SPEC.md`.
- **Phase 2:** flesh out `app-insights.js` suggestion rules (archetypes listed in the plan §3.2.1).
- **Should (later):** custom SVG charts; Google-Drive cloud backup (client-side OAuth → `appDataFolder`).
- **Nice:** `app-ui.js` shared components; Exercise Form Library.

## Resolved product decisions
- Sleep + Finance = **Coming-Soon now**; focus Fitness + Nutrition.
- Entry = **Today insights hub** (wordmark returns to it; bottom bar stays the 4 domains).
- Cloud backup = **in scope (Should), Google-Drive-first**, client-side, no server.
- Custom SVG charts = default yes (Should). File rename = keep `IronLog v3.html` for now.

---

## Paste-ready kickoff prompt for Claude Code
> Continue the IronLog repo. Implement **V4 Phase 1** exactly per `V4-PHASE1-SPEC.md`, matching the look/interaction of `IronLog V4 Prototype.html`. Follow the guardrails in `CLAUDE-CODE-HANDOFF.md` (edit `IronLog v3.html` then sync `index.html`; add new JS to `sw.js` ASSETS and bump CACHE; keep all Node tests green; no destructive localStorage migration). Build in the 9 steps from the spec, starting with domain-accent tokens and `app-nav.js` (+ `app-nav.test.js`). Do not introduce a backend or framework. Show me a diff plan before editing the big HTML file.

---

## File map in this bundle
```
CLAUDE-CODE-HANDOFF.md     ← this file (entry point)
V4-REDESIGN-PLAN.md        ← strategy + full handoff spec
V4-PHASE1-SPEC.md          ← Phase 1 build spec (do first)
IronLog V4 Prototype.html  ← whole app, navigable
IronLog V4 Home.html       ← Today hub detail
IronLog V4 Shell.html      ← two-tier nav detail
```
