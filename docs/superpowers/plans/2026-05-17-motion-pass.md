# Motion Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four animation improvements to IronLog v3 — spring snap on set save, rest timer as a bottom sheet, number tickers on recap, and stronger tab transitions.

**Architecture:** All changes land in `IronLog v3.html`. Tab transitions and rest sheet are pure CSS edits (change a few values). Number tickers add one new JS function + one call. Spring snap modifies `saveEx()` to delay the screen redraw until a WAAPI animation completes. After verifying in browser, sync to `index.html` and bump the service worker cache version.

**Tech Stack:** Vanilla JS, CSS animations, Web Animations API (built into all modern browsers — no imports needed), single HTML file.

---

## Files

- Modify: `IronLog v3.html` — all four animation changes
- Modify: `index.html` — synced copy (cp at the end)
- Modify: `sw.js` — cache version bump

---

## Task 1: Tab transitions — stronger slide

Tab transitions currently feel fade-dominated. Increase the travel distance and spring duration so the directional slide is obvious.

**Files:**
- Modify: `IronLog v3.html` lines 309–312 (class rules) and 1214–1217 (keyframe rules)

- [ ] **Step 1: Find the four class rules (lines ~309–312)**

Open `IronLog v3.html`. Search for `tab-enter-right`. You'll find four lines that look like this:

```css
.page.tab-enter-right{animation:tabSlideInRight .3s cubic-bezier(0.34,1.56,0.64,1) forwards}
.page.tab-enter-left{animation:tabSlideInLeft .3s cubic-bezier(0.34,1.56,0.64,1) forwards}
.page.tab-exit-right{animation:tabSlideOutRight .22s cubic-bezier(0.4,0,1,1) forwards}
.page.tab-exit-left{animation:tabSlideOutLeft .22s cubic-bezier(0.4,0,1,1) forwards}
```

Replace them with:

```css
.page.tab-enter-right{animation:tabSlideInRight .36s cubic-bezier(0.34,1.56,0.64,1) forwards}
.page.tab-enter-left{animation:tabSlideInLeft .36s cubic-bezier(0.34,1.56,0.64,1) forwards}
.page.tab-exit-right{animation:tabSlideOutRight .2s cubic-bezier(0.4,0,1,1) forwards}
.page.tab-exit-left{animation:tabSlideOutLeft .2s cubic-bezier(0.4,0,1,1) forwards}
```

Changes: `.3s` → `.36s` on enter, `.22s` → `.2s` on exit.

- [ ] **Step 2: Find the four keyframe rules (lines ~1214–1217)**

Search for `@keyframes tabSlideInRight`. You'll find four keyframe blocks on consecutive lines:

```css
@keyframes tabSlideInRight{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
@keyframes tabSlideInLeft{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:translateX(0)}}
@keyframes tabSlideOutRight{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-20px)}}
@keyframes tabSlideOutLeft{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(20px)}}
```

Replace with:

```css
@keyframes tabSlideInRight{from{opacity:0;transform:translateX(48px)}to{opacity:1;transform:translateX(0)}}
@keyframes tabSlideInLeft{from{opacity:0;transform:translateX(-48px)}to{opacity:1;transform:translateX(0)}}
@keyframes tabSlideOutRight{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}
@keyframes tabSlideOutLeft{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}
```

Changes: `32px` → `48px` enter, `20px` → `30px` exit.

- [ ] **Step 3: Verify in browser**

Open `IronLog v3.html` in a browser. Tap between Home / Train / Progress / History. The slide should now feel like flipping pages — the incoming screen travels noticeably before snapping, and the outgoing screen exits with more authority. If it still feels mostly like a fade, the wrong lines were edited.

- [ ] **Step 4: Commit**

```bash
git add "IronLog v3.html"
git commit -m "feat: stronger tab transitions — 48px offset, 0.36s spring"
```

---

## Task 2: Rest timer — bottom sheet (set card stays visible)

Remove the heavy backdrop from the rest timer overlay so the set card you just saved stays visible behind the timer tray.

**Files:**
- Modify: `IronLog v3.html` lines ~848–853 (`.rest-ov` CSS rule)

- [ ] **Step 1: Find the `.rest-ov` rule (lines ~848–853)**

Search for `.rest-ov{`. The current rule looks like:

```css
.rest-ov{
  position:fixed;inset:0;
  background:rgba(10,9,8,.55);
  backdrop-filter:blur(12px) saturate(1.2);-webkit-backdrop-filter:blur(12px) saturate(1.2);
  z-index:700;display:none;align-items:flex-end;justify-content:center
}
```

Replace with:

```css
.rest-ov{
  position:fixed;inset:0;
  background:rgba(10,9,8,.15);
  backdrop-filter:none;-webkit-backdrop-filter:none;
  z-index:700;display:none;align-items:flex-end;justify-content:center
}
```

Changes: `.55` → `.15` opacity, `blur(12px) saturate(1.2)` → `none` on both backdrop-filter lines.

- [ ] **Step 2: Verify in browser**

Open `IronLog v3.html`. Log a set on any exercise. The rest timer should slide up from the bottom as a tray — you should be able to see the exercise card above it through the semi-transparent background. The timer tray itself still has its own glass/blur effect (that's on `.rest-ov-box`, which is unchanged). Tapping outside the tray should still dismiss it.

- [ ] **Step 3: Commit**

```bash
git add "IronLog v3.html"
git commit -m "feat: rest timer as bottom sheet — set card stays visible behind"
```

---

## Task 3: Number tickers on Recap

Recap stats (Workouts, Volume, Sets, PRs) count up from zero when the page renders.

**Files:**
- Modify: `IronLog v3.html` — add `animateCounters()` before `renderRecap()`, call it at end of `renderRecapContent()`

- [ ] **Step 1: Add the `animateCounters` function**

Search for `function renderRecap(){` (around line 3301). Insert the following function **immediately before** that line:

```js
function animateCounters(container){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  container.querySelectorAll('.rc3-stat-num').forEach(el=>{
    const raw=el.textContent.trim();
    const m=raw.match(/^[\d.]+/);if(!m)return;
    const target=parseFloat(m[0]);const suffix=raw.slice(m[0].length);
    const dur=700;const t0=performance.now();
    function step(now){
      const p=Math.min((now-t0)/dur,1);
      const ease=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*ease)+suffix;
      if(p<1)requestAnimationFrame(step);else el.textContent=raw;
    }
    el.textContent='0'+suffix;
    requestAnimationFrame(step);
  });
}
```

How it works: reads the final text value from each `.rc3-stat-num` element, resets it to `0`, then uses `requestAnimationFrame` to count up with an ease-out curve over 700ms. The `suffix` handles values like `142kg` or `1.4t` — only the number part animates, the unit stays. If the user has Reduce Motion on, the function exits immediately and numbers appear at their final value.

- [ ] **Step 2: Call `animateCounters` at the end of `renderRecapContent`**

Search for `function renderRecapContent(period){` (around line 3307). Inside this function, find where `el.innerHTML` is set — it's a large template literal that ends around line 3399 with:

```js
  ${bwHTML}
  </div>`;
}
```

That closing `}` ends the function. The line just before it sets `el.innerHTML`. Add the call on the very next line after `el.innerHTML = ...` closes:

```js
  el.innerHTML=`<div class="rc3-wrap">
    ...
    ${bwHTML}
  </div>`;
  animateCounters(el);  // ← add this line
}
```

- [ ] **Step 3: Verify in browser**

Open `IronLog v3.html`. Navigate to Progress → Recap. The four numbers (Workouts, Volume, Sets, PRs) should count up from 0 over ~0.7 seconds when the tab renders. Switch to Month and back — numbers should animate again on each render.

Edge cases to check:
- If you have zero workouts logged, the `0` stat elements should just stay at `0` with no animation (the `if(!m)return` guard handles this — `0` matches the regex, target is `0`, so `Math.round(0 * ease)` stays `0` throughout).
- Volume with `kg` or `t` suffix should animate the number only, suffix stays in place.

- [ ] **Step 4: Commit**

```bash
git add "IronLog v3.html"
git commit -m "feat: number tickers on recap stats"
```

---

## Task 4: Spring snap on set save

When the user taps Save, the set card bounces (compress → expand → settle) before the exercise list redraws.

**Files:**
- Modify: `IronLog v3.html` — modify `saveEx()` around line 2233–2235

- [ ] **Step 1: Find the render calls inside `saveEx` (lines ~2233–2235)**

Search for `function saveEx(exId,cat){` (around line 2211). Near the end of the function body, find these three lines:

```js
saveDB();openCards[exId]=false;delete setCounts[exId];clearDraft(exId);_sessionDone.add(exId);cancelRest();
if(curSplit)renderSplit(curSplit,cc(cat));else renderMuscle(cat,cc(cat));
updateStreak();
```

Replace with:

```js
saveDB();openCards[exId]=false;delete setCounts[exId];clearDraft(exId);_sessionDone.add(exId);cancelRest();
updateStreak();
const _sc3el=document.getElementById(`sc3-${exId}-0`);
const _doRender=()=>{if(curSplit)renderSplit(curSplit,cc(cat));else renderMuscle(cat,cc(cat));};
if(_sc3el){_sc3el.animate([{transform:'scale(1)'},{transform:'scale(0.96)'},{transform:'scale(1.02)'},{transform:'scale(1)'}],{duration:240,easing:'cubic-bezier(0.34,1.56,0.64,1)'}).finished.then(_doRender);}else{_doRender();}
```

What changed:
- `updateStreak()` moved before the render block (runs immediately, no visual dependency).
- The two `renderSplit`/`renderMuscle` lines are replaced with an animation that plays first, then calls the same render logic in `.finished.then()`.
- If `sc3-${exId}-0` doesn't exist for any reason, `_doRender()` is called immediately — no silent failure.
- The spring curve `cubic-bezier(0.34,1.56,0.64,1)` is the same one already used for tab transitions — consistent feel.

- [ ] **Step 2: Verify in browser**

Open `IronLog v3.html`. Go to Train, open an exercise, fill in weight and reps, tap Save. The card should do a quick bounce (squish → pop → settle) before the exercise list collapses. The whole animation takes ~240ms.

Check these don't regress:
- PR detection still fires (🏆 toast + vibration) — it runs before the animation block, unaffected.
- Rest timer still starts after reps blur (`tryStartRest`) — unchanged.
- Saving a second set on the same exercise (append path) works — `_sc3el` may be `sc3-${exId}-0` from the previous set stack; if not found, fallback renders immediately.
- Draft caching works — `clearDraft` still called immediately.

- [ ] **Step 3: Commit**

```bash
git add "IronLog v3.html"
git commit -m "feat: spring snap animation on set save"
```

---

## Task 5: Sync, cache bump, final verification

**Files:**
- Modify: `index.html` — sync copy of v3
- Modify: `sw.js` — bump cache version

- [ ] **Step 1: Sync index.html**

```bash
cp "IronLog v3.html" index.html
```

- [ ] **Step 2: Bump the service worker cache version**

Open `sw.js`. Find the line:

```js
const CACHE = 'ironlog-v10';
```

Change to:

```js
const CACHE = 'ironlog-v11';
```

- [ ] **Step 3: Full browser verification checklist**

Open `index.html` in a browser and run through all four items:

| Check | Expected |
|---|---|
| Tap between tabs | Slide travels ~48px with spring overshoot — feels like flipping pages |
| Log a set → tap Save | Card bounces (compress → expand → settle) before exercise collapses |
| Rest timer starts | Tray slides up from bottom, exercise card visible above it |
| Open Recap tab | Stats count up from 0 over ~0.7s |
| Save a set → PR | 🏆 toast fires, triple haptic fires — unaffected by animation change |
| Switch Recap Week ↔ Month | Stats count up again on each switch |
| Reduce Motion (emulate in DevTools: Rendering → Emulate CSS media → prefers-reduced-motion: reduce) | Recap stats appear instantly, no animation |
| No console errors | Zero errors across all tabs |

- [ ] **Step 4: Commit**

```bash
git add index.html sw.js
git commit -m "release: motion pass v11 — spring save, rest sheet, tickers, tab transitions"
```
