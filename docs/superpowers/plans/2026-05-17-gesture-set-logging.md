# Gesture-First Set Logging — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the weight text-input and RPE pill-buttons in each set card with gesture-driven controls — vertical drag for weight (±2.5 kg per tick), horizontal slider for RPE (6–10).

**Architecture:** Hidden-input pattern — the existing DOM input IDs (`w-{exId}-{i}` and `rpe-{exId}-{i}`) stay in place so `cacheDraft`, `tryStartRest`, and `saveEx` need zero changes. Gesture controls update those hidden inputs and call `cacheDraft` themselves. One delegated `pointerdown` listener on `document` handles all cards. Reps input is completely untouched.

**Tech Stack:** Vanilla JS, vanilla CSS, single HTML file (`IronLog v3.html`). No build step.

---

## Files

| File | What changes |
|---|---|
| `IronLog v3.html` | CSS block (~line 457), `_sc3Card` function (~line 1924), `sc3SetRpe` function (~line 1950), new helper functions + gesture listener (~line 1830) |
| `index.html` | Verbatim copy of `IronLog v3.html` after all changes |
| `sw.js` | Bump `CACHE` constant (line 2) |

---

## Task 1: Add CSS for wheel and RPE slider

**File:** `IronLog v3.html`  
**Location:** After `.sc3-rpe-pill.sel{...}` block, around line 457.

- [ ] **Step 1: Open the file and find the insertion point**

  The CSS section ends with these two lines around line 456–457:
  ```
  .sc3-rpe-pill.sel{background:var(--acc-dim);border-color:var(--pc,var(--acc));
    color:var(--pc,var(--acc))}
  ```
  Insert the new CSS block immediately after.

- [ ] **Step 2: Insert the new CSS**

  Add this block right after `.sc3-rpe-pill.sel{...}`:

  ```css
  /* ── Gesture controls (weight wheel + RPE slider) ─────────────── */
  .sc3-wheel{position:relative;display:flex;flex-direction:column;gap:5px}
  .sc3-wheel-display{display:flex;align-items:baseline;justify-content:center;gap:4px;
    background:var(--s2);border:1.5px solid var(--border);border-radius:var(--r-md);
    padding:12px 10px;cursor:ns-resize;user-select:none;touch-action:none;
    transition:border-color .15s;min-height:60px}
  .sc3-wheel-display:active{border-color:var(--pc,var(--acc))}
  .sc3-wheel-val{font-family:'Geist Mono',monospace;font-size:28px;color:var(--text)}
  .sc3-wheel-unit{font-size:11px;color:var(--t3)}
  .sc3-wheel-hint{font-size:13px;color:var(--t3);margin-left:2px;opacity:0.4}
  .sc3-inp-edit{position:absolute;inset:0;opacity:0;pointer-events:none;
    background:var(--s2);border:1.5px solid var(--pc,var(--acc));border-radius:var(--r-md);
    font-family:'Geist Mono',monospace;font-size:28px;color:var(--text);
    text-align:center;padding:12px 10px;box-sizing:border-box;z-index:2;outline:none}
  .sc3-inp-edit.active{opacity:1;pointer-events:auto}
  .sc3-rpe-slider{flex:1;display:flex;flex-direction:column;gap:6px;
    touch-action:none;cursor:pointer;padding:2px 0}
  .sc3-rpe-track{position:relative;height:6px;background:var(--s3);border-radius:3px}
  .sc3-rpe-fill{position:absolute;left:0;top:0;height:100%;
    background:var(--pc,var(--acc));border-radius:3px;transition:width .08s}
  .sc3-rpe-thumb{position:absolute;top:50%;width:20px;height:20px;border-radius:50%;
    background:var(--pc,var(--acc));border:2px solid var(--bg);
    box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:translate(-50%,-50%);
    transition:left .08s;opacity:0}
  .sc3-rpe-thumb.has-val{opacity:1}
  .sc3-rpe-labels{display:flex;justify-content:space-between;
    font-family:'Geist Mono',monospace;font-size:10px;color:var(--t3);padding:0 2px}
  ```

- [ ] **Step 3: Verify no visual breakage**

  Open `IronLog v3.html` in a browser. The existing set cards should look identical — new CSS classes aren't used yet.

- [ ] **Step 4: Commit**

  ```bash
  git add "IronLog v3.html"
  git commit -m "style: add weight wheel and RPE slider CSS"
  ```

---

## Task 2: Replace weight input with wheel in `_sc3Card`

**File:** `IronLog v3.html`  
**Location:** Inside `_sc3Card` function, ~line 1932–1936. Replace only the weight `sc3-input-grp` div. The reps group stays exactly as-is.

- [ ] **Step 1: Find the weight input-grp to replace**

  The exact string to find (weight group only, inside `.sc3-inputs`):
  ```
      <div class="sc3-input-grp">
        <div class="sc3-inp-lbl">Weight</div>
        <input class="sc3-inp" type="text" inputmode="decimal" placeholder="${ph_w}" value="${wv||''}" id="w-${exId}-${i}" style="--pc:${col}" oninput="cacheDraft('${exId}',${i})">
        <div class="sc3-inp-unit">kg</div>
      </div>
  ```

- [ ] **Step 2: Replace with wheel HTML**

  Replace the above with:
  ```
      <div class="sc3-wheel" id="wh-${exId}-${i}" data-exid="${exId}" data-setidx="${i}" style="--pc:${col}">
        <div class="sc3-inp-lbl">Weight</div>
        <div class="sc3-wheel-display" id="wd-${exId}-${i}">
          <span class="sc3-wheel-val" id="wv-${exId}-${i}">${wv||ph_w}</span>
          <span class="sc3-wheel-unit">kg</span>
          <span class="sc3-wheel-hint">↕</span>
        </div>
        <input class="sc3-inp-edit" type="text" inputmode="decimal" id="w-${exId}-${i}" value="${wv||''}" placeholder="${ph_w}" oninput="cacheDraft('${exId}',${i})" onblur="sc3WheelBlur('${exId}',${i})">
      </div>
  ```

- [ ] **Step 3: Verify in browser**

  Open the file. Open an exercise card in Train. The weight side should now show the big number with a ↕ hint. Reps input should be completely unchanged. Tapping the weight area does nothing yet (gestures not wired up until Task 5).

- [ ] **Step 4: Commit**

  ```bash
  git add "IronLog v3.html"
  git commit -m "feat: replace weight input with wheel display in sc3Card"
  ```

---

## Task 3: Replace RPE pills with slider in `_sc3Card`

**File:** `IronLog v3.html`  
**Location:** Two spots inside `_sc3Card`, ~lines 1927 and 1943–1945.

- [ ] **Step 1: Find and replace the `rpeHtml` line**

  Find this line (~line 1927):
  ```
    const rpeHtml=[6,7,8,9,10].map(v=>`<button class="sc3-rpe-pill${rpeVal==v?' sel':''}" onclick="sc3SetRpe('${exId}',${i},${v},this)" style="--pc:${col}">${v}</button>`).join('');
  ```

  Replace with:
  ```
    const rpeThumbPct=rpeVal?((rpeVal-6)/4*100):null;
    const rpeHtml=`<div class="sc3-rpe-slider" id="rs-${exId}-${i}" data-exid="${exId}" data-setidx="${i}" style="--pc:${col}">
      <div class="sc3-rpe-track">
        <div class="sc3-rpe-fill" id="rf-${exId}-${i}" style="width:${rpeThumbPct!==null?rpeThumbPct+'%':'0%'}"></div>
        <div class="sc3-rpe-thumb${rpeThumbPct!==null?' has-val':''}" id="rt-${exId}-${i}" style="left:${rpeThumbPct!==null?rpeThumbPct+'%':'0%'}"></div>
      </div>
      <div class="sc3-rpe-labels"><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span></div>
    </div>`;
  ```

- [ ] **Step 2: Find and update the RPE row in the card template**

  Find this inside the return template (~line 1943–1945):
  ```
      <div class="sc3-rpe">
        <div class="sc3-rpe-lbl">RPE</div>
        ${rpeHtml}
      </div>
  ```

  Replace with (adds `align-items:flex-start` so label and slider align nicely, and a small `padding-top` for the label):
  ```
      <div class="sc3-rpe" style="align-items:flex-start">
        <div class="sc3-rpe-lbl" style="padding-top:4px">RPE</div>
        ${rpeHtml}
      </div>
  ```

- [ ] **Step 3: Verify in browser**

  Open Train, open an exercise card. The RPE section should now show a horizontal track with labels 6 7 8 9 10. If a draft had an RPE value, the thumb and fill should already appear. Dragging does nothing yet.

- [ ] **Step 4: Commit**

  ```bash
  git add "IronLog v3.html"
  git commit -m "feat: replace RPE pills with slider track in sc3Card"
  ```

---

## Task 4: Replace `sc3SetRpe` and add helper functions

**File:** `IronLog v3.html`  
**Location:** `sc3SetRpe` function (~line 1950). New helpers go immediately after it.

- [ ] **Step 1: Find and replace `sc3SetRpe`**

  Find the full current function:
  ```
  function sc3SetRpe(exId,i,val,btn){
    const card=document.getElementById('sc3-'+exId+'-'+i);
    if(!card)return;
    card.querySelectorAll('.sc3-rpe-pill').forEach(b=>b.classList.remove('sel'));
    btn.classList.add('sel');
    const hiddenEl=document.getElementById('rpe-'+exId+'-'+i);
    if(hiddenEl)hiddenEl.value=val;
    cacheDraft(exId,i);
    try{navigator.vibrate&&navigator.vibrate(8)}catch(_){}
  }
  ```

  Replace with the shim + three new helper functions:
  ```
  function sc3SetRpe(exId,i,val,_btn){sc3RpeSliderUpdate(exId,i,val);}
  function sc3RpeSliderUpdate(exId,i,val,skipHaptic){
    const pct=(val-6)/4*100;
    const fill=document.getElementById('rf-'+exId+'-'+i);
    const thumb=document.getElementById('rt-'+exId+'-'+i);
    const hidden=document.getElementById('rpe-'+exId+'-'+i);
    if(fill)fill.style.width=pct+'%';
    if(thumb){thumb.style.left=pct+'%';thumb.classList.add('has-val')}
    if(hidden)hidden.value=val;
    cacheDraft(exId,i);
    if(!skipHaptic)try{navigator.vibrate&&navigator.vibrate(8)}catch(_){}
  }
  function sc3WheelEdit(exId,i){
    const wd=document.getElementById('wd-'+exId+'-'+i);
    const inp=document.getElementById('w-'+exId+'-'+i);
    if(!wd||!inp)return;
    wd.style.display='none';
    inp.classList.add('active');
    inp.focus();inp.select();
  }
  function sc3WheelBlur(exId,i){
    const wd=document.getElementById('wd-'+exId+'-'+i);
    const inp=document.getElementById('w-'+exId+'-'+i);
    const valSpan=document.getElementById('wv-'+exId+'-'+i);
    if(!wd||!inp||!valSpan)return;
    const v=inp.value.replace(',','.').trim();
    valSpan.textContent=v||inp.placeholder;
    inp.classList.remove('active');
    wd.style.display='';
    cacheDraft(exId,i);
  }
  ```

- [ ] **Step 2: Verify in browser**

  Open the file. Open a set card. The RPE slider should be interactive now — tapping anywhere on the track should snap the thumb. (Drag not wired yet — that's Task 5. Tap still works because `pointerdown` + immediate `pointerup` = click.)

  Actually at this point nothing is wired yet — the functions exist but the listener isn't added until Task 5.

- [ ] **Step 3: Commit**

  ```bash
  git add "IronLog v3.html"
  git commit -m "feat: add sc3WheelEdit/Blur, sc3RpeSliderUpdate, sc3SetRpe shim"
  ```

---

## Task 5: Wire up gesture event delegation

**File:** `IronLog v3.html`  
**Location:** After the existing `document.addEventListener('input', ...)` block at ~line 1830.

This is the main gesture logic. One `pointerdown` listener on `document` handles everything.

- [ ] **Step 1: Find the insertion point**

  Find this block (~line 1824–1830):
  ```
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.inputMode==='decimal'||el.inputMode==='numeric'){
      const pos=el.selectionStart;const replaced=el.value.replace(/,/g,'.');
      if(replaced!==el.value){el.value=replaced;try{el.setSelectionRange(pos,pos)}catch(_){}}
    }
  });
  ```

- [ ] **Step 2: Add gesture listener block immediately after**

  Insert this block after the closing `});` of the input listener:

  ```js
  // ── Gesture controls ──────────────────────────────────────────────────────────
  (function(){
    let _gs=null; // active gesture state
    document.addEventListener('pointerdown',function(e){
      const wheel=e.target.closest('.sc3-wheel');
      const slider=e.target.closest('.sc3-rpe-slider');
      if(!wheel&&!slider)return;
      // Don't start gesture if tapping the edit input itself
      if(e.target.classList.contains('sc3-inp-edit'))return;
      e.preventDefault();
      if(wheel){
        const exId=wheel.dataset.exid;const si=+wheel.dataset.setidx;
        const inp=document.getElementById('w-'+exId+'-'+si);
        const startVal=parseNum(inp?.value)||0;
        _gs={type:'wheel',exId,si,startY:e.clientY,startVal,lastTicks:0,moved:false};
        try{wheel.setPointerCapture(e.pointerId)}catch(_){}
      } else {
        const exId=slider.dataset.exid;const si=+slider.dataset.setidx;
        const track=slider.querySelector('.sc3-rpe-track');
        const rect=track.getBoundingClientRect();
        const pct=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
        const val=Math.round(pct*4+6);
        _gs={type:'rpe',exId,si,lastVal:val};
        sc3RpeSliderUpdate(exId,si,val);
        try{slider.setPointerCapture(e.pointerId)}catch(_){}
      }
    });
    document.addEventListener('pointermove',function(e){
      if(!_gs)return;
      if(_gs.type==='wheel'){
        const dy=_gs.startY-e.clientY; // up = positive = increase
        const ticks=Math.floor(Math.abs(dy)/28)*(dy<0?-1:1);
        if(ticks!==_gs.lastTicks){
          const diff=ticks-_gs.lastTicks;_gs.lastTicks=ticks;
          const inp=document.getElementById('w-'+_gs.exId+'-'+_gs.si);
          const valSpan=document.getElementById('wv-'+_gs.exId+'-'+_gs.si);
          if(!inp)return;
          let cur=parseNum(inp.value);
          if(isNaN(cur)||cur<0)cur=_gs.startVal;
          const next=Math.max(0,Math.min(500,Math.round((cur+diff*2.5)*10)/10));
          inp.value=next;
          if(valSpan)valSpan.textContent=next;
          try{navigator.vibrate&&navigator.vibrate(6)}catch(_){}
        }
        if(Math.abs(_gs.startY-e.clientY)>6)_gs.moved=true;
      } else {
        const slider=document.getElementById('rs-'+_gs.exId+'-'+_gs.si);
        if(!slider)return;
        const track=slider.querySelector('.sc3-rpe-track');
        const rect=track.getBoundingClientRect();
        const pct=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
        const val=Math.round(pct*4+6);
        if(val!==_gs.lastVal){
          _gs.lastVal=val;
          sc3RpeSliderUpdate(_gs.exId,_gs.si,val,true); // skipHaptic=true, fire manually
          try{navigator.vibrate&&navigator.vibrate(8)}catch(_){}
        }
      }
    });
    document.addEventListener('pointerup',function(e){
      if(!_gs)return;
      if(_gs.type==='wheel'){
        if(!_gs.moved){
          // Tap — enter type mode
          sc3WheelEdit(_gs.exId,_gs.si);
        } else {
          cacheDraft(_gs.exId,_gs.si);
        }
      }
      _gs=null;
    });
  })();
  ```

- [ ] **Step 3: Verify weight wheel drag in browser**

  Open `IronLog v3.html`. Open an exercise card in Train. Try dragging up and down on the weight area — the number should increment/decrement by 2.5 each ~28px. On mobile or with DevTools touch simulation, haptic should fire (check `navigator.vibrate` is called in DevTools console with `navigator.vibrate = (n) => console.log('vibrate', n)`).

- [ ] **Step 4: Verify weight wheel tap**

  Tap the weight area without dragging. The display should hide and a text input should appear, focused. Type a value. Tap elsewhere — the display should reappear showing the typed value.

- [ ] **Step 5: Verify RPE slider drag**

  Drag across the RPE track. The thumb should snap to 6, 7, 8, 9, 10 positions. Thumb should appear on first touch. Haptic fires on each snap.

- [ ] **Step 6: Verify `cacheDraft` still works**

  Drag weight to 80kg. Collapse the exercise card. Re-expand it. The wheel should show 80 (value preserved in `_draftCache` via `cacheDraft`).

- [ ] **Step 7: Verify rest timer still fires**

  Enter a reps value in the reps input. Tap outside (blur). The rest timer should fire exactly as before. This confirms the reps input is untouched.

- [ ] **Step 8: Verify Save still works**

  Fill weight (via drag), reps (type), RPE (drag slider). Tap Save. The set should appear in History. Open the DB in DevTools console: `JSON.parse(localStorage.getItem('il4__default')).workouts` — the last entry's sets array should have the correct weight, reps, and rpe values.

- [ ] **Step 9: Commit**

  ```bash
  git add "IronLog v3.html"
  git commit -m "feat: wire gesture pointerdown delegation for weight wheel and RPE slider"
  ```

---

## Task 6: Release — sync index.html + bump sw.js + update progress

**Files:** `index.html`, `sw.js`, `progress.md`

- [ ] **Step 1: Copy v3 to index.html**

  On Windows PowerShell:
  ```powershell
  Copy-Item "IronLog v3.html" "index.html" -Force
  ```

- [ ] **Step 2: Bump service worker cache**

  Open `sw.js`. Line 2 reads:
  ```
  const CACHE='ironlog-v9';
  ```
  Change to:
  ```
  const CACHE='ironlog-v10';
  ```

- [ ] **Step 3: Update progress.md**

  Append to `progress.md`:
  ```markdown
  ### 2026-05-17 — Gesture-first set logging (v16)

  **Weight wheel**
  - Vertical drag on weight area scrubs ±2.5 kg per 28 px of movement
  - Haptic tick (6 ms vibration) on each increment
  - Drag up = increase, drag down = decrease. Clamps 0–500.
  - Tap (< 6 px movement) enters type mode: display hides, text input appears focused
  - Blur restores display with new value; `cacheDraft` called on both drag and type

  **RPE slider**
  - Horizontal track with thumb snapping to positions 6, 7, 8, 9, 10
  - Labels below the track. Thumb hidden until first interaction.
  - Haptic (8 ms) on each snap. `sc3SetRpe` kept as shim for backward compat.
  - Hidden `#rpe-{exId}-{i}` input unchanged — `cacheDraft` reads it exactly as before

  **Nothing broken**
  - Reps input, `tryStartRest` (rest timer), `saveEx`, `cacheDraft`, `getDraft`, `clearDraft`, `logForm`, `chgSets`, localStorage shape — all unchanged

  - SW cache bumped to ironlog-v10
  ```

- [ ] **Step 4: Commit and push**

  ```bash
  git add index.html sw.js progress.md
  git commit -m "release: gesture set logging v16 — weight wheel + RPE slider"
  git push
  ```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Weight wheel — vertical drag ±2.5 kg | Task 2 (HTML) + Task 5 (gesture) |
| Weight wheel — tap enters type mode | Task 4 (`sc3WheelEdit`) + Task 5 (pointerup tap branch) |
| Weight wheel — blur restores display | Task 4 (`sc3WheelBlur`) |
| RPE slider — horizontal drag 6–10 | Task 3 (HTML) + Task 5 (gesture) |
| RPE slider — snaps with haptic | Task 4 (`sc3RpeSliderUpdate`) + Task 5 |
| Hidden input IDs preserved | Task 2 (`id="w-…"`), Task 3 (`id="rpe-…"`) |
| `cacheDraft` unchanged | Not touched in any task ✓ |
| `tryStartRest` on reps blur unchanged | Not touched ✓ |
| `sc3SetRpe` shim | Task 4 |
| One delegated listener at boot | Task 5 |
| All themes via CSS vars only | CSS in Task 1 uses only `var(--*)` ✓ |
| Copy v3 → index.html, bump sw.js | Task 6 |

**Placeholder scan:** None found.

**Type/name consistency:**
- `sc3WheelEdit(exId, i)` — defined Task 4, called Task 5 ✓
- `sc3WheelBlur(exId, i)` — defined Task 4, used in HTML `onblur` Task 2 ✓
- `sc3RpeSliderUpdate(exId, i, val, skipHaptic)` — defined Task 4, called Task 4 shim + Task 5 ✓
- `_gs.moved` flag — set in pointermove, read in pointerup ✓
- DOM IDs: `wh-`, `wd-`, `wv-`, `w-`, `rs-`, `rf-`, `rt-`, `rpe-` — all consistent across Tasks 2, 3, 4, 5 ✓
