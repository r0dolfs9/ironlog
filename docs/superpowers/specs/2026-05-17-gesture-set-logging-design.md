# Gesture-First Set Logging — Design Spec
_IronLog v3 · 2026-05-17_

## Goal

Replace the weight text-input and RPE pill-buttons in `_sc3Card` with gesture-driven controls:
- **Weight wheel** — vertical drag scrubs ±2.5 kg with haptic ticks; tap enters type mode.
- **RPE slider** — horizontal drag strip (6–10) replaces 5 pill buttons; snaps with haptic.

Reps input is **not touched** — `onblur="tryStartRest(…)"` must stay exactly as-is.

---

## Scope

- Modify `_sc3Card` HTML template (in `IronLog v3.html`).
- Add CSS for `.sc3-wheel`, `.sc3-inp-edit`, `.sc3-rpe-slider`, and related elements.
- Add JS functions: `sc3WheelEdit`, `sc3WheelBlur`, `sc3RpeSliderUpdate`, shim for `sc3SetRpe`.
- Add one delegated `pointerdown` listener on `document` at boot.
- Zero changes to: `cacheDraft`, `tryStartRest`, `saveEx`, `chgSets`, `logForm`, `getDraft`, `clearDraft`, `loadDB`, DB schema, localStorage keys.

---

## Architecture

### Hidden-input pattern

Both controls keep the existing DOM input IDs (`w-{exId}-{i}` and `rpe-{exId}-{i}`) intact. `cacheDraft` reads from these IDs — it does not change. Gesture controls update the hidden inputs programmatically, then call `cacheDraft(exId, i)`.

### Event delegation

One `pointerdown` listener registered on `document` during app init (next to the existing global `input` listener for decimal normalisation). It checks:
```
e.target.closest('.sc3-wheel')    → wheel drag or tap
e.target.closest('.sc3-rpe-slider') → RPE drag
```
`pointermove` and `pointerup` listeners are added to `document` inside the `pointerdown` handler and removed after `pointerup`. `setPointerCapture` is called on the element to ensure tracking continues off-element.

---

## Weight Wheel

### HTML (replaces weight `sc3-input-grp`)

```html
<div class="sc3-wheel" id="wh-{exId}-{i}"
     data-exid="{exId}" data-setidx="{i}" style="--pc:{col}">
  <div class="sc3-inp-lbl">Weight</div>
  <div class="sc3-wheel-display" id="wd-{exId}-{i}">
    <span class="sc3-wheel-val" id="wv-{exId}-{i}">{wv||ph_w}</span>
    <span class="sc3-wheel-unit">kg</span>
    <span class="sc3-wheel-hint">↕</span>
  </div>
  <input class="sc3-inp sc3-inp-edit" type="text" inputmode="decimal"
         id="w-{exId}-{i}" value="{wv||''}" placeholder="{ph_w}"
         oninput="cacheDraft('{exId}',{i})"
         onblur="sc3WheelBlur('{exId}',{i})">
</div>
```

### CSS

```css
.sc3-wheel { position:relative; display:flex; flex-direction:column; gap:5px; }
.sc3-wheel-display {
  display:flex; align-items:baseline; justify-content:center; gap:4px;
  background:var(--s2); border:1.5px solid var(--border); border-radius:var(--r-md);
  padding:12px 10px; cursor:ns-resize; user-select:none; touch-action:none;
  transition:border-color .15s;
}
.sc3-wheel-display:active { border-color:var(--pc,var(--acc)); }
.sc3-wheel-val { font-family:'Geist Mono',monospace; font-size:28px; color:var(--text); }
.sc3-wheel-unit { font-size:11px; color:var(--t3); }
.sc3-wheel-hint { font-size:10px; color:var(--t3); margin-left:2px; opacity:0.5; }
.sc3-inp-edit {
  position:absolute; inset:0; opacity:0; pointer-events:none;
  width:100%; height:100%; z-index:2;
}
.sc3-inp-edit.active {
  position:static; opacity:1; pointer-events:auto;
}
```

### Drag behaviour

```
dragThreshold = 28px per 2.5kg tick
direction: drag UP = increase weight (pulling dial upward)
           drag DOWN = decrease weight
min: 0, max: 500
round to nearest 2.5 only while dragging; typed values stay as-is
haptic: navigator.vibrate(6) on each 2.5kg tick
```

On `pointerdown` on `.sc3-wheel`:
- Record `startY`, `startVal` (current numeric value of `#w-{exId}-{i}` or 0).
- Set `dragging = false`.

On `pointermove`:
- Compute `deltaY = startY - clientY` (up = positive = increase).
- `ticks = Math.floor(Math.abs(deltaY) / 28)` with sign.
- If ticks changed from last tick count: update value, fire haptic, update span text, sync hidden input.
- If `Math.abs(totalMovement) > 6`: set `dragging = true`.

On `pointerup`:
- If `!dragging`: call `sc3WheelEdit(exId, i)` (tap → type mode).
- Else: call `cacheDraft(exId, i)`.
- Remove pointermove/pointerup listeners.

### Type-mode functions

```js
function sc3WheelEdit(exId, i) {
  const wd = document.getElementById('wd-' + exId + '-' + i);
  const inp = document.getElementById('w-' + exId + '-' + i);
  if (!wd || !inp) return;
  wd.style.display = 'none';
  inp.classList.add('active');
  inp.focus();
  inp.select();
}

function sc3WheelBlur(exId, i) {
  const wd = document.getElementById('wd-' + exId + '-' + i);
  const inp = document.getElementById('w-' + exId + '-' + i);
  const valSpan = document.getElementById('wv-' + exId + '-' + i);
  if (!wd || !inp || !valSpan) return;
  const v = inp.value.replace(',', '.').trim();
  valSpan.textContent = v || inp.placeholder;
  inp.classList.remove('active');
  wd.style.display = '';
  cacheDraft(exId, i);
}
```

---

## RPE Slider

### HTML (replaces `.sc3-rpe` content after the label)

```html
<div class="sc3-rpe">
  <div class="sc3-rpe-lbl">RPE</div>
  <div class="sc3-rpe-slider" id="rs-{exId}-{i}"
       data-exid="{exId}" data-setidx="{i}" style="--pc:{col}">
    <div class="sc3-rpe-track">
      <div class="sc3-rpe-fill" id="rf-{exId}-{i}"></div>
      <div class="sc3-rpe-thumb" id="rt-{exId}-{i}"></div>
    </div>
    <div class="sc3-rpe-labels">
      <span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
    </div>
  </div>
  <input type="hidden" id="rpe-{exId}-{i}" value="{rpeVal||''}">
</div>
```

### CSS

```css
.sc3-rpe-slider { flex:1; display:flex; flex-direction:column; gap:4px;
  touch-action:none; cursor:pointer; }
.sc3-rpe-track { position:relative; height:6px; background:var(--s3);
  border-radius:3px; }
.sc3-rpe-fill { position:absolute; left:0; top:0; height:100%;
  background:var(--pc,var(--acc)); border-radius:3px; transition:width .1s; }
.sc3-rpe-thumb { position:absolute; top:50%; width:20px; height:20px;
  border-radius:50%; background:var(--pc,var(--acc));
  border:2px solid var(--bg); box-shadow:0 2px 8px rgba(0,0,0,0.4);
  transform:translate(-50%,-50%); transition:left .1s;
  opacity:0; /* hidden until first interaction */ }
.sc3-rpe-thumb.has-val { opacity:1; }
.sc3-rpe-labels { display:flex; justify-content:space-between;
  font-family:'Geist Mono',monospace; font-size:10px; color:var(--t3); }
```

### Snap behaviour

5 snap positions for values 6–10. Position % = `(val - 6) / 4 * 100`.

```js
function sc3RpeSliderUpdate(exId, i, val) {
  const pct = (val - 6) / 4 * 100;
  const fill = document.getElementById('rf-' + exId + '-' + i);
  const thumb = document.getElementById('rt-' + exId + '-' + i);
  const hidden = document.getElementById('rpe-' + exId + '-' + i);
  if (fill) fill.style.width = pct + '%';
  if (thumb) { thumb.style.left = pct + '%'; thumb.classList.add('has-val'); }
  if (hidden) hidden.value = val;
  cacheDraft(exId, i);
  try { navigator.vibrate && navigator.vibrate(8); } catch(_) {}
}
```

On `pointerdown` on `.sc3-rpe-slider`:
- Compute value from clientX relative to track bounds.
- Snap to nearest integer in [6,10].
- Call `sc3RpeSliderUpdate`.

On `pointermove`:
- Same computation + snap + update (only fire haptic when snapped value changes).

On `pointerup`:
- Remove listeners.

### `sc3SetRpe` shim (keeps any legacy callers working)
```js
function sc3SetRpe(exId, i, val, _btn) {
  sc3RpeSliderUpdate(exId, i, val);
}
```

---

## Themes

All colours via CSS custom properties only: `var(--pc)`, `var(--acc)`, `var(--s2)`, `var(--s3)`, `var(--border)`, `var(--text)`, `var(--t3)`, `var(--bg)`. No hardcoded hex values in new code.

---

## What does NOT change

| Thing | Status |
|---|---|
| `cacheDraft(exId, i)` | Unchanged — reads `#w-…` and `#rpe-…` by ID |
| `tryStartRest(exId, i)` | Unchanged — reps input `onblur` stays |
| `saveEx` | Unchanged |
| `chgSets` | Unchanged — rebuilds cards via same `_sc3Card` template |
| `getDraft` / `clearDraft` | Unchanged |
| `_draftCache` shape `{w,r,rpe}` | Unchanged |
| `logForm` | Unchanged |
| localStorage / DB schema | Unchanged |

---

## Release checklist

- [ ] Edit `IronLog v3.html`
- [ ] Copy v3 → `index.html`
- [ ] Bump `CACHE` in `sw.js` (`ironlog-v15` → `ironlog-v16`)
- [ ] Update `progress.md`
- [ ] Commit + push
