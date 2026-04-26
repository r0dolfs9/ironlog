// ── Config ────────────────────────────────────────────────────────────────────
const CAT_VAR = {
  chest:'--chest', triceps:'--triceps', back:'--back', biceps:'--biceps',
  legs:'--legs', shoulders:'--shoulders', abs:'--abs', forearms:'--forearms', cardio:'--cardio'
};
const CAT_LBL = {
  chest:'Chest', triceps:'Triceps', back:'Back', biceps:'Biceps',
  legs:'Legs', shoulders:'Shoulders', abs:'Abs', forearms:'Forearms', cardio:'Cardio'
};
const DEFAULT_SPLITS = [
  {id:'split-0', name:'Back & Bis',       color:'--back',    sections:[
    {type:'muscle',group:'back'},{type:'muscle',group:'biceps'},{type:'muscle',group:'forearms'},{type:'muscle',group:'abs'},{type:'cardio'}]},
  {id:'split-1', name:'Chest & Tris',     color:'--chest',   sections:[
    {type:'muscle',group:'chest'},{type:'muscle',group:'triceps'},{type:'muscle',group:'abs'},{type:'cardio'}]},
  {id:'split-2', name:'Legs',             color:'--legs',    sections:[
    {type:'muscle',group:'legs'},{type:'muscle',group:'abs'},{type:'cardio'}]},
  {id:'split-3', name:'Arms & Shoulders', color:'--biceps',  sections:[
    {type:'muscle',group:'biceps'},{type:'muscle',group:'triceps'},{type:'muscle',group:'forearms'},{type:'muscle',group:'shoulders'},{type:'muscle',group:'abs'},{type:'cardio'}]},
];
const SPLIT_COLORS = ['--back','--chest','--legs','--biceps','--shoulders','--triceps','--abs','--forearms','--cardio'];
const MUSCLES = ['chest','triceps','back','biceps','legs','shoulders','abs','forearms'];
const DEF = {
  chest:     ['Barbell Bench Press','Incline Dumbbell Press','Cable Fly'],
  triceps:   ['Tricep Pushdown','Skull Crusher','Overhead Tricep Extension'],
  back:      ['Deadlift','Barbell Row','Lat Pulldown'],
  biceps:    ['Barbell Bicep Curl','Hammer Curl','Preacher Curl'],
  legs:      ['Barbell Squat','Romanian Deadlift','Leg Press'],
  shoulders: ['Overhead Press','Lateral Raise','Arnold Press'],
  abs:       ['Cable Crunch','Hanging Leg Raise','Ab Wheel Rollout'],
  forearms:  ['Wrist Curl','Reverse Wrist Curl','Farmer Walk'],
};

// ── Profile Management ────────────────────────────────────────────────────────
const PROF_KEY    = 'il4_profiles';
const ACTIVE_KEY  = 'il4_active';
const PROF_COLORS = ['#c9ff47','#47b8ff','#ff5c38','#a855f7','#ffd147','#38ffd4','#ff7eb3','#ff38a0'];

function getProfiles()      { return JSON.parse(localStorage.getItem(PROF_KEY) || '[]'); }
function saveProfiles(arr)  { localStorage.setItem(PROF_KEY, JSON.stringify(arr)); }
function getActiveProfile() { return localStorage.getItem(ACTIVE_KEY) || null; }
function dbKey()            { return 'il4_' + (getActiveProfile() || '_default'); }

function profColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  return PROF_COLORS[Math.abs(h) % PROF_COLORS.length];
}
function profInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Database ──────────────────────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function loadDB() {
  let d = JSON.parse(localStorage.getItem(dbKey()) || 'null');
  if (!d) {
    const old = localStorage.getItem('il4');
    if (old) { d = JSON.parse(old); localStorage.setItem(dbKey(), old); }
  }
  if (d) {
    if (!d.exercises.forearms) d.exercises.forearms = DEF.forearms.map(n => ({id:uid(),name:n}));
    if (!d.bodyWeights) d.bodyWeights = [];
    if (!d.splits) d.splits = DEFAULT_SPLITS.map(s => JSON.parse(JSON.stringify(s)));
    if (!d.bwGoal) d.bwGoal = null;
    if (!d.settings) d.settings = { restEnabled: true, restSecs: 90 };
    return d;
  }
  const ex = {};
  MUSCLES.forEach(m => { ex[m] = DEF[m].map(n => ({id:uid(),name:n})); });
  return {exercises:ex, workouts:[], bodyWeights:[], splits:DEFAULT_SPLITS.map(s => JSON.parse(JSON.stringify(s))), bwGoal:null, settings:{ restEnabled:true, restSecs:90 }};
}
function saveDB() { localStorage.setItem(dbKey(), JSON.stringify(DB)); }

let DB;
let openCards = {}, setCounts = {}, addSheetCat = null, curSplit = null, cardioOpen = false, chartInst = {};

// ── Helpers ───────────────────────────────────────────────────────────────────
function cv(name)    { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function cc(cat)     { return cv(CAT_VAR[cat] || '--acc'); }
function today()     { return new Date().toISOString().slice(0,10); }
function fd(d)       { if (!d) return ''; const [y,m,day] = d.split('-'); return `${day}/${m}/${y}`; }
function parseNum(v) { return parseFloat(String(v||'').replace(',','.').trim()) || 0; }
function vol(sets)   { return sets.reduce((a,s) => a + parseNum(s.reps) * parseNum(s.weight), 0); }
function maxWt(sets) { return Math.max(0, ...sets.map(s => parseNum(s.weight))); }

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2400);
}

let _cr = null;
function confirm2(msg, yl='Delete') {
  return new Promise(r => {
    _cr = r;
    document.getElementById('confMsg').textContent = msg;
    document.getElementById('cYes').textContent = yl;
    document.getElementById('confOv').classList.add('open');
  });
}
function resolveConf(v) {
  document.getElementById('confOv').classList.remove('open');
  if (_cr) { _cr(v); _cr = null; }
}

// ── Rest Timer ────────────────────────────────────────────────────────────────
let restInt = null;
let restTotal = 90;
let restRemaining = 90;

function startRest(hint = '') {
  if (!DB.settings.restEnabled) return;
  cancelRest();
  restTotal     = DB.settings.restSecs || 90;
  restRemaining = restTotal;
  const ov     = document.getElementById('restOv');
  const numEl  = document.getElementById('restNum');
  const barEl  = document.getElementById('restBar');
  const hintEl = document.getElementById('restHint');
  if (!ov) return;
  numEl.textContent  = restRemaining;
  barEl.style.width  = '100%';
  if (hintEl) hintEl.textContent = hint;
  ov.classList.add('show');
  restInt = setInterval(() => {
    restRemaining--;
    numEl.textContent = restRemaining;
    barEl.style.width = Math.max(0, restRemaining / restTotal * 100) + '%';
    if (restRemaining <= 0) { cancelRest(); toast('Rest over, go! 💪'); }
  }, 1000);
}

function cancelRest() {
  if (restInt) { clearInterval(restInt); restInt = null; }
  document.getElementById('restOv')?.classList.remove('show');
}

function adjustRestTime(delta) {
  restRemaining = Math.max(5, restRemaining + delta);
  restTotal     = Math.max(5, restTotal + delta);
  DB.settings.restSecs = restTotal;
  saveDB();
  const numEl = document.getElementById('restNum');
  const barEl = document.getElementById('restBar');
  if (numEl) numEl.textContent = restRemaining;
  if (barEl) barEl.style.width = Math.max(0, restRemaining / restTotal * 100) + '%';
}

function disableRest() {
  DB.settings.restEnabled = false;
  saveDB();
  cancelRest();
  updateRestToggleBtn();
  toast('Rest timer off. Re-enable in the sidebar.');
}

function toggleRestTimer() {
  DB.settings.restEnabled = !DB.settings.restEnabled;
  saveDB();
  updateRestToggleBtn();
  toast(DB.settings.restEnabled ? 'Rest timer on' : 'Rest timer off');
}

function updateRestToggleBtn() {
  const btn = document.getElementById('restToggleBtn');
  if (!btn) return;
  const on = DB.settings.restEnabled;
  btn.textContent = `⏱ Rest Timer: ${on ? 'ON' : 'OFF'}`;
  btn.style.color = on ? 'var(--acc)' : 'var(--t3)';
}

// ── Streak ────────────────────────────────────────────────────────────────────
function calcStreak() {
  const dates = [...new Set(DB.workouts.map(w => w.date))].sort().reverse();
  if (!dates.length) return 0;
  const todayStr = today();
  let streak = 0, prev = null;
  for (const d of dates) {
    if (prev === null) {
      const gap = Math.round((new Date(todayStr) - new Date(d)) / 86400000);
      if (gap > 1) break;
      streak = 1; prev = d;
    } else {
      const gap = Math.round((new Date(prev) - new Date(d)) / 86400000);
      if (gap !== 1) break;
      streak++; prev = d;
    }
  }
  return streak;
}

function updateStreak() {
  const s  = calcStreak();
  const el = document.getElementById('streakBadge');
  if (el) el.textContent = s > 0 ? `🔥 ${s} day streak` : 'No streak yet';
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeSheet();
    closeSummary();
    cancelRest();
    if (_cr) resolveConf(false);
  }
});

// Comma → period in all decimal inputs (fixes locale decimal separator)
document.addEventListener('input', e => {
  const el = e.target;
  if (el.inputMode === 'decimal' || el.inputMode === 'numeric') {
    const pos = el.selectionStart;
    const replaced = el.value.replace(/,/g, '.');
    if (replaced !== el.value) {
      el.value = replaced;
      try { el.setSelectionRange(pos, pos); } catch(_) {}
    }
  }
});

// ── Sidebar ───────────────────────────────────────────────────────────────────
function toggleSB() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sbOv').classList.toggle('open');
}
function closeSB() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOv').classList.remove('open');
}

function renderSidebar() {
  const el = document.getElementById('sbSplits');
  if (!el) return;
  el.innerHTML = DB.splits.map(sp => {
    const col = `var(${sp.color})`;
    const safeName = sp.name.replace(/&/g,'&amp;').replace(/'/g,'&#39;');
    return `<button class="sb-btn" data-pid="${sp.id}" style="--cc:${col}" onclick="navTo('${sp.id}','${safeName}','${sp.color}')"><span class="sb-dot" style="--cc:${col}"></span>${safeName}</button>`;
  }).join('');
}

function navTo(pid, title, colVar) {
  closeSB();
  document.querySelectorAll('.sb-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.pid === pid);
  });
  const col = colVar ? cv(colVar) : '';
  document.getElementById('tbTitle').innerHTML = `<span style="color:${col}">${title}</span>`;
  if (!document.getElementById('page-'+pid)) {
    const d = document.createElement('div');
    d.className = 'page';
    d.id = 'page-' + pid;
    document.getElementById('pages').appendChild(d);
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+pid).classList.add('active');
  if      (pid === 'history')    renderHistory();
  else if (pid === 'progress')   renderProgressSel();
  else if (pid === 'bodyweight') renderBW();
  else if (pid === 'recap')      renderRecap();
  else if (pid.startsWith('split-'))  { curSplit = pid; renderSplit(pid, col); }
  else if (pid.startsWith('muscle-')) { curSplit = null; renderMuscle(pid.replace('muscle-',''), col); }
}

// ── Muscle Page ───────────────────────────────────────────────────────────────
function renderMuscle(cat, col) {
  const pg  = document.getElementById('page-muscle-'+cat);
  if (!pg) return;
  const exs = DB.exercises[cat] || [];
  pg.innerHTML = `<div class="pg-hdr" style="--pc:${col}">
    <div class="pg-title" style="color:${col}">${CAT_LBL[cat]}</div>
    <button class="add-btn" onclick="openSheet('${cat}')">+ Add</button>
  </div>
  <div class="ex-list">${exs.map(ex => exCard(ex, cat, col, false)).join('')}</div>`;
}

function exCard(ex, cat, col, inSplit) {
  const logs = DB.workouts.filter(w => w.exId===ex.id).sort((a,b) => b.date.localeCompare(a.date));
  const last = logs[0];
  let sub = 'No sessions yet';
  if (last && last.sets.length) {
    const ls = last.sets[last.sets.length-1];
    sub = `Last: ${ls.reps||'?'}×${ls.weight||'0'}kg (final set) · ${fd(last.date)}`;
  }
  const isOpen = !!openCards[ex.id];
  return `<div class="ex-card" id="xc-${ex.id}" style="--pc:${col}">
    <div class="ex-head" onclick="toggleCard('${ex.id}','${cat}','${col}',${inSplit})">
      <div class="ex-bar" style="background:${col}"></div>
      <div class="ex-inf">
        <div class="ex-nm">${ex.name}</div>
        <div class="ex-sb">${sub}</div>
      </div>
      <button class="ex-del" onclick="event.stopPropagation();delEx('${ex.id}','${cat}')">&#10005;</button>
      <div class="ex-arr ${isOpen?'open':''}" id="xa-${ex.id}">&#8250;</div>
    </div>
    ${isOpen ? logForm(ex.id, cat, col, last) : ''}
  </div>`;
}

function logForm(exId, cat, col, last) {
  const n = setCounts[exId] || 2;
  let lb = '';
  if (last && last.sets.length) {
    const ls  = last.sets[last.sets.length-1];
    const top = maxWt(last.sets);
    lb = `<div class="last-ref">
      <div class="lr-left">
        <div class="lr-ttl">Last session · ${fd(last.date)}</div>
        <div class="lr-val">${ls.reps||'?'} reps × ${ls.weight||'0'} kg</div>
        <div class="lr-sub">Top: ${top}kg · ${last.sets.length} sets total</div>
      </div>
    </div>`;
  }
  let rows = '';
  for (let i = 0; i < n; i++) {
    const p = last && last.sets[i];
    rows += `<tr>
      <td><div class="sn">${i+1}</div></td>
      <td><input class="sf" type="text" inputmode="decimal" placeholder="${p?p.reps:'10'}" value="" id="r-${exId}-${i}"></td>
      <td><input class="sf" type="text" inputmode="decimal" placeholder="${p?p.weight:'0'}"  value="" id="w-${exId}-${i}"></td>
      <td><div class="dk" id="dk-${exId}-${i}" onclick="tDone('${exId}',${i})">&#10003;</div></td>
    </tr>`;
  }
  return `<div class="lf open" id="lf-${exId}">
    ${lb}
    <div class="lf-in">
      <input type="date" class="lf-date" id="ld-${exId}" value="${today()}">
      <div class="sets-hdr">
        <div class="sets-lbl">SETS</div>
        <div class="sets-ctl">
          <div class="sc-b" onclick="chgSets('${exId}','${cat}','${col}',-1)">&#8722;</div>
          <div class="sc-n" id="scn-${exId}">${n}</div>
          <div class="sc-b" onclick="chgSets('${exId}','${cat}','${col}',1)">+</div>
        </div>
      </div>
      <table class="st">
        <thead><tr><th>#</th><th>Reps</th><th>kg</th><th>&#10003;</th></tr></thead>
        <tbody id="stb-${exId}">${rows}</tbody>
      </table>
      <div class="add-set-row">
        <button class="add-set-btn" onclick="chgSets('${exId}','${cat}','${col}',1)">+ Add Set</button>
      </div>
      <textarea class="lf-nt" id="ln-${exId}" placeholder="Notes..." rows="2"></textarea>
      <button class="sav-btn" style="background:${col}" onclick="saveEx('${exId}','${cat}')">Save</button>
    </div>
  </div>`;
}

function toggleCard(exId, cat, col, inSplit) {
  openCards[exId] = !openCards[exId];
  if (openCards[exId]) Object.keys(openCards).forEach(k => { if (k !== exId) openCards[k] = false; });
  if (inSplit) renderSplit(curSplit, col); else renderMuscle(cat, col);
  setTimeout(() => document.getElementById('xc-'+exId)?.scrollIntoView({behavior:'smooth',block:'nearest'}), 60);
}

function chgSets(exId, cat, col, d) {
  const scnEl = document.getElementById('scn-'+exId);
  const stbEl = document.getElementById('stb-'+exId);
  if (!scnEl || !stbEl) return;
  const old = setCounts[exId] || 2;
  const n   = Math.max(1, Math.min(10, old + d));
  setCounts[exId] = n;
  scnEl.textContent = n;
  // preserve entered values and done-states before rebuild
  const saved = {};
  for (let i = 0; i <= old; i++) {
    saved[i] = {
      r:    document.getElementById(`r-${exId}-${i}`)?.value  || '',
      w:    document.getElementById(`w-${exId}-${i}`)?.value  || '',
      done: !!document.getElementById(`dk-${exId}-${i}`)?.classList.contains('on'),
    };
  }
  const last = DB.workouts.filter(w => w.exId===exId).sort((a,b) => b.date.localeCompare(a.date))[0];
  let rows = '';
  for (let i = 0; i < n; i++) {
    const p      = last && last.sets[i];
    const rv     = saved[i] !== undefined ? saved[i].r : '';
    const wv     = saved[i] !== undefined ? saved[i].w : '';
    const isDone = saved[i]?.done || false;
    rows += `<tr>
      <td><div class="sn">${i+1}</div></td>
      <td><input class="sf" type="text" inputmode="decimal" placeholder="${p?p.reps:'10'}" value="${rv}" id="r-${exId}-${i}"></td>
      <td><input class="sf" type="text" inputmode="decimal" placeholder="${p?p.weight:'0'}"  value="${wv}" id="w-${exId}-${i}"></td>
      <td><div class="dk${isDone?' on':''}" id="dk-${exId}-${i}" onclick="tDone('${exId}',${i})">&#10003;</div></td>
    </tr>`;
  }
  stbEl.innerHTML = rows;
}

function tDone(exId, i) {
  const el = document.getElementById(`dk-${exId}-${i}`);
  if (!el) return;
  el.classList.toggle('on');
  if (el.classList.contains('on')) {
    const wVal = parseNum(document.getElementById(`w-${exId}-${i}`)?.value);
    const rVal = parseNum(document.getElementById(`r-${exId}-${i}`)?.value);
    startRest(wVal > 0 ? `${rVal > 0 ? rVal + ' reps @ ' : ''}${wVal}kg — beat it next set` : '');
  } else {
    cancelRest();
  }
}

function saveEx(exId, cat) {
  const date = document.getElementById('ld-'+exId)?.value;
  if (!date) { toast('Pick a date'); return; }
  const n    = setCounts[exId] || 2;
  const sets = [];
  for (let i = 0; i < n; i++) {
    sets.push({
      reps:   document.getElementById(`r-${exId}-${i}`)?.value || '',
      weight: document.getElementById(`w-${exId}-${i}`)?.value || '',
      done:   !!document.getElementById(`dk-${exId}-${i}`)?.classList.contains('on'),
    });
  }
  const notes    = document.getElementById('ln-'+exId)?.value || '';
  const ex       = Object.values(DB.exercises).flat().find(e => e.id===exId);
  const prevBest = Math.max(0, ...DB.workouts.filter(w => w.exId===exId).map(w => maxWt(w.sets)));
  const newBest  = maxWt(sets);
  DB.workouts.push({id:uid(), exId, cat, name:ex?.name||'?', date, sets, notes, splitId:curSplit||null});
  saveDB();
  openCards[exId] = false;
  delete setCounts[exId];
  cancelRest();
  if (curSplit) renderSplit(curSplit, cc(cat)); else renderMuscle(cat, cc(cat));
  updateStreak();
  toast(newBest > prevBest && newBest > 0 ? `🏆 New PR! ${newBest}kg` : 'Saved!');
}

async function delEx(exId, cat) {
  const ok = await confirm2('Remove this exercise? History is kept.');
  if (!ok) return;
  DB.exercises[cat] = (DB.exercises[cat]||[]).filter(e => e.id!==exId);
  saveDB();
  openCards[exId] = false;
  if (curSplit) renderSplit(curSplit, cc(cat)); else renderMuscle(cat, cc(cat));
  toast('Removed');
}

// ── Split Page ────────────────────────────────────────────────────────────────
let splitEditing = null; // id of split currently in edit mode

function renderSplit(spId, col) {
  const sp = DB.splits.find(s => s.id===spId);
  const pg = document.getElementById('page-'+spId);
  if (!pg || !sp) return;
  const editing = splitEditing === spId;
  const spCol = cv(sp.color) || col;

  let hdr;
  if (editing) {
    hdr = `<div class="edit-banner">EDITING — tap Done when finished</div>
    <div class="sp-hdr sp-hdr-edit">
      <input class="sp-name-inp" id="spNameInp-${spId}" value="${sp.name.replace(/"/g,'&quot;')}" onblur="renameSplit('${spId}',this.value)" placeholder="Workout name">
      <button class="sp-done-btn" onclick="exitEditMode('${spId}')">Done</button>
    </div>
    <div class="sp-edit-colors-row">${SPLIT_COLORS.map(c=>`<div class="sp-color-dot${sp.color===c?' sel':''}" style="background:${cv(c)}" title="${c.replace('--','')}" onclick="recolorSplit('${spId}','${c}')"></div>`).join('')}</div>`;
  } else {
    hdr = `<div class="sp-hdr">
      <div class="sp-title">${sp.name}</div>
      <button class="sp-edit-btn" onclick="enterEditMode('${spId}')">✏️ Edit</button>
      <button class="fin-btn" onclick="openSummary('${spId}')">Finish 🏁</button>
    </div>`;
  }

  let sectionsHtml = '';
  sp.sections.forEach((sec, idx) => {
    const total = sp.sections.length;
    const reorderBtns = editing ? `<div class="sec-reorder">
      <button class="sec-move-btn${idx===0?' disabled':''}" onclick="moveSection('${spId}',${idx},-1)" ${idx===0?'disabled':''}>↑</button>
      <button class="sec-move-btn${idx===total-1?' disabled':''}" onclick="moveSection('${spId}',${idx},1)" ${idx===total-1?'disabled':''}>↓</button>
    </div>` : '';
    const removeBtn = editing ? `<button class="sec-remove" onclick="removeSection('${spId}',${idx})">&#10005;</button>` : '';
    if (sec.type === 'cardio') {
      sectionsHtml += `<div class="sp-cat sp-cat-edit-wrap">${reorderBtns}<div class="sp-cat-edit-inner" style="position:relative">${removeBtn}${cardioHTML()}</div></div>`;
      return;
    }
    const group = sec.group;
    const c = cc(group);
    let exs;
    if (sec.type === 'muscle') {
      exs = DB.exercises[group] || [];
    } else {
      const all = DB.exercises[group] || [];
      exs = all.filter(e => sec.list.includes(e.name));
      sec.list.forEach(nm => {
        if (!exs.find(e => e.name === nm)) {
          if (!DB.exercises[group]) DB.exercises[group] = [];
          const newEx = {id:uid(), name:nm};
          DB.exercises[group].push(newEx);
          saveDB();
          exs.push(newEx);
        }
      });
    }
    const lbl = sec.type === 'exercises'
      ? `${CAT_LBL[group] || group} <span style="font-size:8px;color:var(--t3)">(selected only)</span>`
      : CAT_LBL[group] || group;
    sectionsHtml += `<div class="sp-cat sp-cat-edit-wrap">${reorderBtns}<div class="sp-cat-edit-inner" style="position:relative">
      ${removeBtn}
      <div class="sp-cat-lbl" style="color:${c}">${lbl}</div>
      <div class="sp-ex-list">
        ${exs.map(ex => exCard(ex, group, c, true)).join('')}
        ${!editing ? `<button class="add-cat-btn" style="border-color:${c}44;color:${c}" onclick="openSheet('${group}')">+ Add ${CAT_LBL[group]} exercise</button>` : ''}
      </div>
    </div></div>`;
  });

  let editTools = '';
  if (editing) {
    editTools = `<div class="sp-edit-tools">
      <button class="sp-add-sec-btn" onclick="openAddSection('${spId}')">＋ Add Section</button>
      <button class="sp-add-sec-btn" onclick="openExercisePicker('${spId}')">＋ Pick Exercises</button>
      <button class="sp-del-split-btn" onclick="deleteSplit('${spId}')">Delete this day</button>
    </div>`;
  }

  pg.innerHTML = hdr + sectionsHtml + editTools;
  if (editing) setTimeout(() => document.getElementById(`spNameInp-${spId}`)?.focus(), 50);
}

function enterEditMode(spId) { splitEditing = spId; renderSplit(spId, ''); }
function exitEditMode(spId)  { splitEditing = null; const sp = DB.splits.find(s=>s.id===spId); renderSplit(spId, sp ? cv(sp.color) : ''); }

function renameSplit(spId, val) {
  const sp = DB.splits.find(s => s.id===spId);
  if (!sp || !val.trim()) return;
  sp.name = val.trim();
  saveDB();
  renderSidebar();
  document.getElementById('tbTitle').innerHTML = `<span style="color:${cv(sp.color)}">${sp.name}</span>`;
}

function recolorSplit(spId, colorVar) {
  const sp = DB.splits.find(s => s.id===spId);
  if (!sp) return;
  sp.color = colorVar;
  saveDB();
  renderSidebar();
  renderSplit(spId, cv(colorVar));
}

function removeSection(spId, idx) {
  const sp = DB.splits.find(s => s.id===spId);
  if (!sp) return;
  sp.sections.splice(idx, 1);
  saveDB();
  renderSplit(spId, cv(sp.color));
}

function moveSection(spId, idx, dir) {
  const sp = DB.splits.find(s => s.id===spId);
  if (!sp) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= sp.sections.length) return;
  const tmp = sp.sections[idx];
  sp.sections[idx] = sp.sections[newIdx];
  sp.sections[newIdx] = tmp;
  saveDB();
  renderSplit(spId, cv(sp.color));
}

async function deleteSplit(spId) {
  const ok = await confirm2('Delete this workout day? Exercise history is kept.', 'Delete');
  if (!ok) return;
  DB.splits = DB.splits.filter(s => s.id !== spId);
  saveDB();
  splitEditing = null;
  renderSidebar();
  // navigate to first split or history
  const first = DB.splits[0];
  if (first) navTo(first.id, first.name, first.color);
  else navTo('history', 'History', '--acc');
  toast('Workout day deleted');
}

// ── Add Section picker ────────────────────────────────────────────────────────
let addSecTargetSplit = null;

function openAddSection(spId) {
  addSecTargetSplit = spId;
  const sp = DB.splits.find(s => s.id===spId);
  const existing = sp ? sp.sections.map(s => s.type==='muscle'?s.group:s.type) : [];
  let html = '<div class="addsec-list">';
  MUSCLES.forEach(m => {
    const used = existing.includes(m);
    html += `<button class="addsec-item${used?' used':''}" onclick="addMuscleSection('${m}')"
      style="border-color:${cc(m)}44;color:${used?'var(--t3)':cc(m)}">
      <span class="addsec-dot" style="background:${cc(m)}"></span>${CAT_LBL[m]}${used?' ✓':''}
    </button>`;
  });
  const hasCardio = existing.includes('cardio');
  html += `<button class="addsec-item${hasCardio?' used':''}" onclick="addCardioSection()"
    style="border-color:${cv('--cardio')}44;color:${hasCardio?'var(--t3)':cv('--cardio')}">
    <span class="addsec-dot" style="background:${cv('--cardio')}"></span>Cardio${hasCardio?' ✓':''}
  </button>`;
  html += '</div>';
  document.getElementById('shTitle').textContent = 'Add Section';
  document.getElementById('shInp').style.display = 'none';
  const acts = document.querySelector('#addSheet .sh-acts');
  acts.innerHTML = `<button class="sh-cancel" onclick="closeSheet()">Cancel</button>`;
  document.getElementById('addSheet').insertAdjacentHTML('beforeend', html.replace('</div>','') + '</div>');
  document.getElementById('addSheet').classList.add('open');
  document.getElementById('shBg').classList.add('open');
}

function addMuscleSection(group) {
  const sp = DB.splits.find(s => s.id===addSecTargetSplit);
  if (!sp) return;
  if (!sp.sections.find(s => s.type==='muscle' && s.group===group)) {
    sp.sections.push({type:'muscle', group});
    saveDB();
  }
  closeSheet();
  renderSplit(addSecTargetSplit, cv(sp.color));
}

function addCardioSection() {
  const sp = DB.splits.find(s => s.id===addSecTargetSplit);
  if (!sp) return;
  if (!sp.sections.find(s => s.type==='cardio')) {
    sp.sections.push({type:'cardio'});
    saveDB();
  }
  closeSheet();
  renderSplit(addSecTargetSplit, cv(sp.color));
}

// ── Add Split ─────────────────────────────────────────────────────────────────
let newSplitColorIdx = 0;

function addSplit() {
  newSplitColorIdx = 0;
  document.getElementById('shTitle').textContent = 'New Workout Day';
  document.getElementById('shInp').style.display = '';
  document.getElementById('shInp').value = '';
  document.getElementById('shInp').placeholder = 'e.g. Push Day';
  const acts = document.querySelector('#addSheet .sh-acts');
  acts.innerHTML = `<button class="sh-cancel" onclick="closeSheet()">Cancel</button>
    <button class="sh-ok" onclick="doCreateSplit()">Create</button>`;
  // remove any leftover addsec-list
  document.querySelectorAll('#addSheet .addsec-list').forEach(el => el.remove());
  document.getElementById('addSheet').classList.add('open');
  document.getElementById('shBg').classList.add('open');
  setTimeout(() => document.getElementById('shInp').focus(), 300);
}

function doCreateSplit() {
  const name = document.getElementById('shInp').value.trim();
  if (!name) { toast('Enter a name'); return; }
  const color = SPLIT_COLORS[newSplitColorIdx % SPLIT_COLORS.length];
  const id = 'split-' + uid();
  DB.splits.push({id, name, color, sections:[]});
  saveDB();
  closeSheet();
  renderSidebar();
  splitEditing = id;
  navTo(id, name, color);
  toast('Day created — add sections below');
}

// ── Cardio ────────────────────────────────────────────────────────────────────
function cardioHTML() {
  const last    = DB.workouts.filter(w => w.cat==='cardio').sort((a,b) => b.date.localeCompare(a.date))[0];
  const sub     = last ? `${last.duration||'?'} min · ${last.calories||'?'} kcal · ${fd(last.date)}` : 'No sessions yet';
  const cardCol = cv('--cardio');
  return `<div class="sp-cat-lbl" style="color:${cardCol}">Cardio</div>
    <div class="cc-wrap"><div class="cc">
      <div class="cc-hd" onclick="tCardio()">
        <span style="font-size:18px">🏃</span>
        <div class="ex-inf">
          <div class="ex-nm">Cardio Session</div>
          <div class="ex-sb">${sub}</div>
        </div>
        <div class="ex-arr ${cardioOpen?'open':''}" id="cArr">&#8250;</div>
      </div>
      <div class="cc-form ${cardioOpen?'open':''}" id="ccForm">
        <input type="date" class="lf-date" id="cDate" value="${today()}">
        <div class="cc-fields">
          <div class="ccfw"><div class="cfl">Duration (min)</div><input class="cff" type="text" inputmode="numeric" id="cDur" placeholder="30"></div>
          <div class="ccfw"><div class="cfl">Calories</div><input class="cff" type="text" inputmode="numeric" id="cCal" placeholder="250"></div>
        </div>
        <button class="sav-btn" style="background:${cardCol}" onclick="saveCardio()">Save Cardio</button>
      </div>
    </div></div>`;
}

function tCardio() {
  cardioOpen = !cardioOpen;
  document.getElementById('ccForm')?.classList.toggle('open', cardioOpen);
  document.getElementById('cArr')?.classList.toggle('open', cardioOpen);
}

function saveCardio() {
  const date     = document.getElementById('cDate')?.value;
  const duration = document.getElementById('cDur')?.value;
  const calories = document.getElementById('cCal')?.value;
  if (!date) { toast('Pick a date'); return; }
  DB.workouts.push({id:uid(), cat:'cardio', name:'Cardio', date, duration, calories, sets:[], splitId:curSplit||null});
  saveDB();
  cardioOpen = false;
  if (curSplit) {
    const sp = DB.splits.find(s => s.id===curSplit);
    const firstGroup = sp?.sections.find(s => s.type==='muscle')?.group || 'chest';
    renderSplit(curSplit, cc(firstGroup));
  }
  updateStreak();
  toast('Cardio saved!');
}

// ── Sheet ─────────────────────────────────────────────────────────────────────
function openSheet(cat) {
  addSheetCat = cat;
  document.getElementById('shTitle').textContent = `Add ${CAT_LBL[cat]||cat} Exercise`;
  document.getElementById('shInp').value = '';
  document.getElementById('addSheet').classList.add('open');
  document.getElementById('shBg').classList.add('open');
  setTimeout(() => document.getElementById('shInp').focus(), 300);
}
function closeSheet() {
  document.getElementById('addSheet').classList.remove('open');
  document.getElementById('shBg').classList.remove('open');
  // restore sheet to default state
  document.getElementById('shInp').style.display = '';
  document.querySelectorAll('#addSheet .addsec-list').forEach(el => el.remove());
  const acts = document.querySelector('#addSheet .sh-acts');
  acts.innerHTML = `<button class="sh-cancel" onclick="closeSheet()">Cancel</button><button class="sh-ok" onclick="doAdd()">Add</button>`;
  addSheetCat = null;
}
function doAdd() {
  const name = document.getElementById('shInp').value.trim();
  if (!name) { toast('Enter a name'); return; }
  if (!DB.exercises[addSheetCat]) DB.exercises[addSheetCat] = [];
  DB.exercises[addSheetCat].push({id:uid(), name});
  saveDB();
  closeSheet();
  if (curSplit) renderSplit(curSplit, cc(addSheetCat)); else renderMuscle(addSheetCat, cc(addSheetCat));
  toast(`"${name}" added`);
}

// ── Exercise Picker ───────────────────────────────────────────────────────────
let pickerTargetSplit = null;
let pickerSelected = new Set();

function openExercisePicker(spId) {
  pickerTargetSplit = spId;
  pickerSelected = new Set();
  renderPickerList('');
  document.getElementById('pickerSearch').value = '';
  document.getElementById('pickerOv').classList.add('open');
}

function closePicker() {
  document.getElementById('pickerOv').classList.remove('open');
  pickerTargetSplit = null;
  pickerSelected = new Set();
}

function filterPicker() {
  renderPickerList(document.getElementById('pickerSearch').value.trim().toLowerCase());
}

function renderPickerList(query) {
  const sp = pickerTargetSplit ? DB.splits.find(s => s.id===pickerTargetSplit) : null;
  const alreadyFull = sp ? sp.sections.filter(s => s.type==='muscle').map(s => s.group) : [];
  let html = '';
  MUSCLES.forEach(group => {
    const exs = (DB.exercises[group] || []).filter(e => !query || e.name.toLowerCase().includes(query));
    if (!exs.length) return;
    const c = cc(group);
    html += `<div class="picker-group">
      <div class="picker-group-lbl" style="color:${c}">${CAT_LBL[group]}</div>`;
    exs.forEach(ex => {
      const checked = pickerSelected.has(ex.id);
      html += `<label class="picker-row${checked?' checked':''}">
        <input type="checkbox" style="display:none" ${checked?'checked':''} onchange="togglePick('${ex.id}','${group}',this)">
        <div class="picker-check${checked?' on':''}">${checked?'✓':''}</div>
        <div class="picker-nm">${ex.name}</div>
        <div class="picker-cat" style="color:${c}">${CAT_LBL[group]}</div>
      </label>`;
    });
    html += `</div>`;
  });
  if (!html) html = `<div class="no-data">No exercises found</div>`;
  document.getElementById('pickerList').innerHTML = html;
}

function togglePick(exId, group, checkbox) {
  if (checkbox.checked) pickerSelected.add(exId + '|' + group);
  else pickerSelected.delete(exId + '|' + group);
  // re-render to update checked styles without losing scroll position
  const list = document.getElementById('pickerList');
  list.querySelectorAll('.picker-row').forEach(row => {
    const cb = row.querySelector('input[type=checkbox]');
    const check = row.querySelector('.picker-check');
    if (!cb) return;
    const key = cb.closest('label')?.querySelector('.picker-nm')?.textContent;
    const isChecked = cb.checked;
    row.classList.toggle('checked', isChecked);
    check.classList.toggle('on', isChecked);
    check.textContent = isChecked ? '✓' : '';
  });
}

function confirmPicker() {
  if (!pickerSelected.size) { toast('Select at least one exercise'); return; }
  const sp = DB.splits.find(s => s.id===pickerTargetSplit);
  if (!sp) return;
  // group selected by muscle group
  const byGroup = {};
  pickerSelected.forEach(key => {
    const [exId, group] = key.split('|');
    if (!byGroup[group]) byGroup[group] = [];
    const ex = (DB.exercises[group]||[]).find(e => e.id===exId);
    if (ex) byGroup[group].push(ex.name);
  });
  Object.entries(byGroup).forEach(([group, names]) => {
    // If a full muscle section already exists for this group, skip (exercises already shown)
    if (sp.sections.find(s => s.type==='muscle' && s.group===group)) {
      toast(`${CAT_LBL[group]} already added as full section`);
      return;
    }
    // Check if there's already an 'exercises' section for this group — merge into it
    const existing = sp.sections.find(s => s.type==='exercises' && s.group===group);
    if (existing) {
      names.forEach(n => { if (!existing.list.includes(n)) existing.list.push(n); });
    } else {
      sp.sections.push({type:'exercises', group, list:names});
    }
  });
  saveDB();
  closePicker();
  renderSplit(pickerTargetSplit, cv(sp.color));
  toast(`${pickerSelected.size} exercise${pickerSelected.size!==1?'s':''} added`);
}

// ── History ───────────────────────────────────────────────────────────────────
function renderHistory() {
  const c = document.getElementById('histList');
  if (!DB.workouts.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-msg">No workouts logged yet</div><div class="empty-state-sub">Start a split from the sidebar,<br>log your first session, and it will appear here.</div></div>`;
    return;
  }
  const sessMap = new Map();
  [...DB.workouts].sort((a,b) => b.date.localeCompare(a.date)).forEach(w => {
    const key = w.splitId ? `${w.date}|${w.splitId}` : `${w.date}|solo|${w.cat}|${w.exId}`;
    if (!sessMap.has(key)) sessMap.set(key, {date:w.date, splitId:w.splitId, entries:[]});
    sessMap.get(key).entries.push(w);
  });
  c.innerHTML = [...sessMap.values()].map((sess, i) => {
    let sessName;
    if (sess.splitId) sessName = DB.splits.find(s => s.id===sess.splitId)?.name || 'Workout';
    else {
      const cats = [...new Set(sess.entries.map(e => e.cat))];
      sessName = cats.map(ct => CAT_LBL[ct]||ct).join(' & ');
    }
    const firstCat = sess.entries.find(e => e.cat!=='cardio')?.cat || 'cardio';
    const count    = sess.entries.length;
    return `<div class="hsess">
      <button class="hsess-hd" onclick="tSess('hb${i}','ha${i}')">
        <div class="hsess-dot" style="background:${cc(firstCat)}"></div>
        <div class="hsess-info">
          <div class="hsess-name">${sessName}</div>
          <div class="hsess-meta">${fd(sess.date)} · ${count} exercise${count!==1?'s':''}</div>
        </div>
        <span class="hsess-arr" id="ha${i}">&#8250;</span>
      </button>
      <div class="hsess-body" id="hb${i}">${sess.entries.map(w => histEntry(w)).join('')}</div>
    </div>`;
  }).join('');
}

function histEntry(w) {
  const c = cc(w.cat);
  if (w.cat === 'cardio') {
    return `<div class="hentry"><div class="hel"><div class="henm">🏃 Cardio</div><div class="hechips"><div class="chip">${w.duration||'?'} min</div><div class="chip">${w.calories||'?'} kcal</div></div></div><button class="hedel" onclick="delW('${w.id}')">&#10005;</button></div>`;
  }
  return `<div class="hentry"><div class="hel"><div class="henm">${w.name}</div><div class="hecat" style="color:${c}">${CAT_LBL[w.cat]||w.cat}</div><div class="hechips">${w.sets.map((s,i)=>`<div class="chip">S${i+1} ${s.reps||'?'}×${s.weight||'0'}kg</div>`).join('')}</div>${w.notes?`<div class="henotes">${w.notes}</div>`:''}</div><button class="hedel" onclick="delW('${w.id}')">&#10005;</button></div>`;
}

function tSess(bodyId, arrId) {
  document.getElementById(bodyId)?.classList.toggle('open');
  document.getElementById(arrId)?.classList.toggle('open');
}
async function delW(id) {
  const ok = await confirm2('Delete this entry?');
  if (!ok) return;
  DB.workouts = DB.workouts.filter(w => w.id!==id);
  saveDB();
  renderHistory();
  toast('Deleted');
}

// ── Progress ──────────────────────────────────────────────────────────────────
function renderProgressSel() {
  const sel = document.getElementById('pSel'), prev = sel.value;
  sel.innerHTML = '<option value="">— Pick a muscle group —</option>';
  MUSCLES.forEach(m => {
    if (!DB.workouts.find(w => w.cat===m)) return;
    const o = document.createElement('option');
    o.value = m; o.textContent = CAT_LBL[m];
    if (o.value === prev) o.selected = true;
    sel.appendChild(o);
  });
  if (DB.workouts.find(w => w.cat==='cardio')) {
    const o = document.createElement('option');
    o.value = 'cardio'; o.textContent = 'Cardio';
    if (o.value === prev) o.selected = true;
    sel.appendChild(o);
  }
  renderProgress();
}

function renderProgress() {
  const val = document.getElementById('pSel').value;
  const pc  = document.getElementById('progContent');
  if (!val) { pc.innerHTML = `<div class="no-data">Select a muscle group above</div>`; return; }
  const col = cc(val);
  if (val === 'cardio') {
    const logs = DB.workouts.filter(w => w.cat==='cardio').sort((a,b) => a.date.localeCompare(b.date));
    const bd   = Math.max(...logs.map(l => parseNum(l.duration)));
    const bc   = Math.max(...logs.map(l => parseNum(l.calories)));
    pc.innerHTML = `<div class="pr-cards">
      <div class="pr-card"><div class="pr-val" style="color:${col}">${bd}<span class="pr-unit"> min</span></div><div class="pr-lbl">Best Duration</div></div>
      <div class="pr-card"><div class="pr-val" style="color:${col}">${bc}<span class="pr-unit"> kcal</span></div><div class="pr-lbl">Best Calories</div></div>
      <div class="pr-card"><div class="pr-val" style="color:${col}">${logs.length}</div><div class="pr-lbl">Sessions</div></div>
    </div>
    <div class="chart-box"><div class="cbt">Duration (min)</div><div class="cw"><canvas id="chA"></canvas></div></div>`;
    mkChart('chA', logs.map(l => fd(l.date)), logs.map(l => parseNum(l.duration)), col);
    return;
  }
  const logs = DB.workouts.filter(w => w.cat===val && w.exId).sort((a,b) => a.date.localeCompare(b.date));
  if (!logs.length) { pc.innerHTML = `<div class="no-data">No data yet for ${CAT_LBL[val]}</div>`; return; }
  const byDate    = {};
  logs.forEach(w => { (byDate[w.date] = byDate[w.date]||[]).push(w); });
  const dates     = Object.keys(byDate).sort();
  const volByDate = dates.map(d => byDate[d].reduce((a,w) => a+vol(w.sets), 0));
  const bestWt    = Math.max(...logs.map(w => maxWt(w.sets)));
  const totalVol  = logs.reduce((a,w) => a+vol(w.sets), 0);
  const exBests   = (DB.exercises[val]||[]).map(ex => {
    const el = logs.filter(w => w.exId===ex.id);
    if (!el.length) return null;
    return {name:ex.name, best:Math.max(...el.map(w => maxWt(w.sets))), sessions:el.length, lastDate:el[el.length-1].date};
  }).filter(Boolean).sort((a,b) => b.best-a.best);
  pc.innerHTML = `<div class="pr-cards">
    <div class="pr-card"><div class="pr-val" style="color:${col}">${bestWt}<span class="pr-unit">kg</span></div><div class="pr-lbl">Best Weight</div></div>
    <div class="pr-card"><div class="pr-val" style="color:${col}">${Math.round(totalVol)}<span class="pr-unit">kg</span></div><div class="pr-lbl">Total Volume</div></div>
    <div class="pr-card"><div class="pr-val" style="color:${col}">${dates.length}</div><div class="pr-lbl">Sessions</div></div>
    <div class="pr-card"><div class="pr-val" style="color:${col}">${logs.length}</div><div class="pr-lbl">Sets Logged</div></div>
  </div>
  <div class="chart-box"><div class="cbt">Volume per Session (kg)</div><div class="cw"><canvas id="chA"></canvas></div></div>
  <div class="pr-ex-list">${exBests.map(e => `<div class="pr-ex-row"><div class="pre-nm">${e.name}</div><div class="pre-val">${e.best}kg · ${e.sessions} sess<br>${fd(e.lastDate)}</div></div>`).join('')}</div>`;
  mkChart('chA', dates.map(d => fd(d)), volByDate, col);
}

function mkChart(id, labels, data, color) {
  if (chartInst[id]) { try { chartInst[id].destroy(); } catch(_) {} }
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return;
  chartInst[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data, borderColor:color, backgroundColor:color+'22',
        borderWidth:2, pointRadius:3, pointBackgroundColor:color,
        tension:.35, fill:true
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: {legend:{display:false}},
      scales: {
        x: {ticks:{color:'#555',font:{family:'DM Mono',size:9}}, grid:{color:'#1d1d1d'}},
        y: {ticks:{color:'#555',font:{family:'DM Mono',size:9}}, grid:{color:'#1d1d1d'}}
      }
    }
  });
}

// ── Body Weight ───────────────────────────────────────────────────────────────
function renderBW() {
  document.getElementById('bwDate').value = today();
  renderBWGoalCard();
  const entries = [...(DB.bodyWeights||[])].sort((a,b) => b.date.localeCompare(a.date));
  const listEl  = document.getElementById('bwList');
  if (!entries.length) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚖️</div><div class="empty-state-msg">No weight logged yet</div><div class="empty-state-sub">Enter your weight above and tap Add.<br>Once you have 2 entries, a chart appears.</div></div>`;
    return;
  }
  const sorted  = [...entries].sort((a,b) => a.date.localeCompare(b.date));
  const diffMap = {};
  for (let i = 1; i < sorted.length; i++) {
    diffMap[sorted[i].id] = (parseNum(sorted[i].weight) - parseNum(sorted[i-1].weight)).toFixed(1);
  }
  let chartHTML = '';
  if (entries.length >= 2) {
    chartHTML = `<div class="chart-box" style="margin:0 0 14px"><div class="cbt">Weight Over Time (kg)</div><div class="cw"><canvas id="bwChart"></canvas></div></div>`;
  }
  listEl.innerHTML = `<div class="bw-list-hdr">HISTORY</div>${chartHTML}${entries.map(e => {
    const d    = diffMap[e.id];
    const sign = d > 0 ? '+' : '';
    const col  = d > 0 ? '#ef4444' : d < 0 ? '#22c55e' : 'var(--t2)';
    const badge = d !== undefined ? `<div class="bw-diff" style="color:${col}">${sign}${d}</div>` : '';
    return `<div class="bw-entry"><div class="bw-date">${fd(e.date)}</div><div class="bw-kg">${e.weight} kg</div>${badge}<button class="bw-del" onclick="delBW('${e.id}')">&#10005;</button></div>`;
  }).join('')}`;
  if (entries.length >= 2) {
    setTimeout(() => mkChart('bwChart', sorted.map(e => fd(e.date)), sorted.map(e => parseNum(e.weight)), cv('--acc')), 0);
  }
}

function renderBWGoalCard() {
  const g = DB.bwGoal;
  const entries = [...(DB.bodyWeights||[])].sort((a,b) => a.date.localeCompare(b.date));
  const current = entries.length ? parseNum(entries[entries.length-1].weight) : null;
  let goalHTML = '';
  if (g) {
    const target = parseNum(g.target);
    const dir    = g.direction === 'gain' ? 'Gain to' : 'Lose to';
    let progBar  = '';
    if (current !== null && entries.length > 1) {
      const start   = parseNum(entries[0].weight);
      const total   = Math.abs(target - start);
      const done    = Math.abs(current - start);
      const pct     = total > 0 ? Math.min(100, Math.round(done / total * 100)) : 100;
      const onTrack = g.direction === 'lose' ? current <= start : current >= start;
      const barCol  = onTrack ? '#22c55e' : '#ef4444';
      progBar = `<div class="bw-goal-prog">
        <div class="bw-goal-prog-bar"><div style="width:${pct}%;background:${barCol};height:100%;border-radius:4px;transition:width .4s"></div></div>
        <div class="bw-goal-prog-lbl">${pct}% · ${current}kg → ${target}kg</div>
      </div>`;
    }
    goalHTML = `<div class="bw-goal-card">
      <div class="bw-goal-hdr">
        <div class="bw-goal-lbl">Goal: ${dir} ${target}kg${g.deadline ? ` by ${fd(g.deadline)}` : ''}</div>
        <button class="bw-goal-edit" onclick="toggleBWGoalForm(true)">Edit</button>
        <button class="bw-goal-clear" onclick="clearBWGoal()">&#10005;</button>
      </div>
      ${progBar}
    </div>`;
  } else {
    goalHTML = `<div class="bw-goal-card bw-goal-collapsed" id="bwGoalCard">
      <button class="bw-goal-open-btn" onclick="toggleBWGoalForm(true)">+ Set Weight Goal</button>
    </div>`;
  }
  goalHTML += `<div class="bw-goal-form" id="bwGoalForm" style="display:none">
    <div class="bw-goal-form-row">
      <div class="bw-field"><div class="bw-lbl">Target (kg)</div><input type="text" inputmode="decimal" class="bw-inp" id="bwGTarget" placeholder="70.0" value="${g?g.target:''}"></div>
      <div class="bw-goal-dir-wrap">
        <div class="bw-lbl">Direction</div>
        <div class="bw-goal-dir">
          <button class="bw-dir-btn${!g||g.direction==='lose'?' sel':''}" onclick="setBWDir('lose')">Lose</button>
          <button class="bw-dir-btn${g&&g.direction==='gain'?' sel':''}" onclick="setBWDir('gain')">Gain</button>
        </div>
      </div>
      <div class="bw-field"><div class="bw-lbl">Deadline (opt)</div><input type="date" class="bw-inp" id="bwGDeadline" style="font-size:13px;padding:10px 6px" value="${g&&g.deadline?g.deadline:''}"></div>
    </div>
    <div class="sh-acts" style="margin-top:10px">
      <button class="sh-cancel" onclick="toggleBWGoalForm(false)">Cancel</button>
      <button class="sh-ok" onclick="saveBWGoal()">Save Goal</button>
    </div>
  </div>`;

  // inject before the log card
  let goalEl = document.getElementById('bwGoalSection');
  if (!goalEl) {
    goalEl = document.createElement('div');
    goalEl.id = 'bwGoalSection';
    goalEl.style.cssText = 'padding:0 14px';
    const bwCard = document.querySelector('.bw-card');
    if (bwCard) bwCard.parentNode.insertBefore(goalEl, bwCard);
  }
  goalEl.innerHTML = goalHTML;
}

let bwGoalDir = 'lose';
function toggleBWGoalForm(show) {
  document.getElementById('bwGoalForm').style.display = show ? 'block' : 'none';
  const card = document.getElementById('bwGoalCard');
  if (card) card.style.display = show ? 'none' : '';
  bwGoalDir = DB.bwGoal?.direction || 'lose';
}
function setBWDir(dir) {
  bwGoalDir = dir;
  document.querySelectorAll('.bw-dir-btn').forEach(b => b.classList.toggle('sel', b.textContent.toLowerCase() === dir));
}
function saveBWGoal() {
  const target   = parseNum(document.getElementById('bwGTarget').value);
  const deadline = document.getElementById('bwGDeadline').value || null;
  if (!target) { toast('Enter a target weight'); return; }
  DB.bwGoal = {target: target.toFixed(1), direction: bwGoalDir, deadline};
  saveDB();
  renderBW();
  toast('Goal saved!');
}
function clearBWGoal() {
  DB.bwGoal = null;
  saveDB();
  renderBW();
  toast('Goal cleared');
}

function saveBW() {
  const date   = document.getElementById('bwDate').value;
  const weight = parseNum(document.getElementById('bwKg').value);
  if (!date || !weight) { toast('Enter date and weight'); return; }
  if (!DB.bodyWeights) DB.bodyWeights = [];
  DB.bodyWeights.push({id:uid(), date, weight:weight.toFixed(1)});
  saveDB();
  document.getElementById('bwKg').value = '';
  renderBW();
  toast('Weight logged!');
}
async function delBW(id) {
  const ok = await confirm2('Delete this entry?');
  if (!ok) return;
  DB.bodyWeights = DB.bodyWeights.filter(e => e.id!==id);
  saveDB();
  renderBW();
  toast('Deleted');
}

// ── Summary ───────────────────────────────────────────────────────────────────
function openSummary(spId) {
  const sp  = DB.splits.find(s => s.id===spId);
  const td  = today();
  const todayAll = DB.workouts.filter(w => w.date===td && (w.splitId===spId || w.splitId===null));
  if (!todayAll.length) {
    document.getElementById('sumBox').innerHTML = `<div class="sum-hd"><div class="sum-title">Summary</div><button class="sum-close" onclick="closeSummary()">&#10005;</button></div><div style="text-align:center;padding:50px 0;color:var(--t3)">No exercises logged today yet.</div>`;
    document.getElementById('sumOv').classList.add('open');
    return;
  }
  const nonCardio = todayAll.filter(w => w.cat!=='cardio');
  const totalSets = nonCardio.reduce((a,w) => a+w.sets.length, 0);
  const totalVol  = nonCardio.reduce((a,w) => a+vol(w.sets), 0);
  const musclesWorked = [...new Set(nonCardio.map(w => w.cat))];

  // Volume vs last time this split was done
  const prevSplitDay = DB.workouts
    .filter(w => w.splitId===spId && w.date!==td && w.cat!=='cardio')
    .sort((a,b) => b.date.localeCompare(a.date));
  const prevSplitVol = prevSplitDay.reduce((a,w) => a+vol(w.sets), 0);
  const volDiff = prevSplitVol > 0 ? Math.round(totalVol - prevSplitVol) : null;
  const volDiffStr = volDiff !== null ? (volDiff >= 0 ? `+${volDiff}kg` : `${volDiff}kg`) : '';
  const volDiffCol = volDiff !== null ? (volDiff >= 0 ? '#22c55e' : '#ef4444') : '';

  // PRs set today
  const todayPRs = new Set();
  nonCardio.forEach(w => {
    const prevBest = DB.workouts.filter(x => x.exId===w.exId && x.date!==td).reduce((a,x)=>Math.max(a,maxWt(x.sets)),0);
    if (maxWt(w.sets) > prevBest && maxWt(w.sets) > 0) todayPRs.add(w.exId);
  });

  let html = `<div class="sum-hd"><div class="sum-title">Workout Done</div><button class="sum-close" onclick="closeSummary()">&#10005;</button></div>
  <div class="sum-date">${sp.name} · ${fd(td)}</div>
  <div class="sum-stats">
    <div class="sum-stat"><div class="sum-stat-val">${nonCardio.length}</div><div class="sum-stat-lbl">Exercises</div></div>
    <div class="sum-stat"><div class="sum-stat-val">${totalSets}</div><div class="sum-stat-lbl">Sets</div></div>
    <div class="sum-stat"><div class="sum-stat-val">${Math.round(totalVol)}<span style="font-size:11px;font-weight:400">kg</span></div><div class="sum-stat-lbl">Volume${volDiffStr ? `<br><span style="font-size:10px;color:${volDiffCol};font-weight:700">${volDiffStr} vs last</span>` : ''}</div></div>
  </div>`;
  if (musclesWorked.length) {
    html += `<div class="sum-mg"><div class="sum-mg-lbl">Muscles Worked</div><div class="sum-mg-chips">${musclesWorked.map(cat => {
      const c = cc(cat);
      return `<div class="sum-mg-chip" style="color:${c};border-color:${c}44;background:${c}12">${CAT_LBL[cat]}</div>`;
    }).join('')}</div></div>`;
  }
  const byCat = {};
  todayAll.forEach(w => { (byCat[w.cat] = byCat[w.cat]||[]).push(w); });
  Object.entries(byCat).forEach(([cat, entries]) => {
    const c = cc(cat);
    html += `<div class="sum-sec"><div class="sum-sec-lbl" style="color:${c}">${CAT_LBL[cat]||cat}</div>`;
    entries.forEach(entry => {
      if (entry.cat === 'cardio') {
        html += `<div class="sum-ex"><div class="sum-ex-nm">🏃 Cardio</div><div class="sum-chips"><div class="sum-chip">${entry.duration||'?'} min</div><div class="sum-chip">${entry.calories||'?'} kcal</div></div></div>`;
        return;
      }
      const lastS = DB.workouts.filter(w => w.exId===entry.exId && w.date!==td).sort((a,b) => b.date.localeCompare(a.date))[0];
      let progHTML = '';
      if (lastS && lastS.sets.length) {
        const p = calcProgress(entry.sets, lastS.sets);
        progHTML = `<div class="sum-prog"><div class="sum-prog-pill ${p.cls}">${p.label}</div><div class="sum-prog-vs">vs ${fd(lastS.date)}</div></div>`;
      }
      const prBadge = todayPRs.has(entry.exId) ? `<span class="sum-pr-badge">PR</span>` : '';
      html += `<div class="sum-ex"><div class="sum-ex-nm">${entry.name}${prBadge}</div><div class="sum-chips">${entry.sets.map((s,i) => `<div class="sum-chip">S${i+1}: ${s.reps||'?'}×${s.weight||'0'}kg</div>`).join('')}</div>${progHTML}${entry.notes?`<div style="font-size:10px;color:var(--t3);margin-top:4px;font-style:italic">${entry.notes}</div>`:''}</div>`;
    });
    html += `</div>`;
  });
  html += `<button class="ss-btn" onclick="toast('Use your screenshot button now!')">📸 Screenshot Summary</button>`;
  document.getElementById('sumBox').innerHTML = html;
  document.getElementById('sumOv').classList.add('open');
}

function calcProgress(curSets, prevSets) {
  const curWt = maxWt(curSets), prevWt = maxWt(prevSets);
  const curVol= vol(curSets),  prevVol= vol(prevSets);
  if (curWt > prevWt) {
    const pct = prevWt > 0 ? ((curWt-prevWt)/prevWt*100).toFixed(1) : '—';
    return {cls:'up', label:`Weight +${pct}%`};
  }
  if (curWt < prevWt && curVol < prevVol) {
    const pct = prevVol > 0 ? ((curVol-prevVol)/prevVol*100).toFixed(1) : '—';
    return {cls:'dn', label:`Vol ${pct}%`};
  }
  if (curVol > prevVol) {
    const pct = prevVol > 0 ? ((curVol-prevVol)/prevVol*100).toFixed(1) : '—';
    return {cls:'up', label:`Vol +${pct}%`};
  }
  if (curVol < prevVol) return {cls:'eq', label:'Reps down'};
  return {cls:'eq', label:'='};
}
function closeSummary() { document.getElementById('sumOv').classList.remove('open'); }

// ── Recap ─────────────────────────────────────────────────────────────────────
let recapMode = 'week'; // 'week' | 'month'

function renderRecap() {
  const el = document.getElementById('recapContent');
  if (!el) return;
  el.innerHTML = `<div class="recap-tabs">
    <button class="recap-tab${recapMode==='week'?' active':''}" onclick="setRecapMode('week')">WEEK</button>
    <button class="recap-tab${recapMode==='month'?' active':''}" onclick="setRecapMode('month')">MONTH</button>
  </div>
  <div id="recapBody">${buildRecap(recapMode)}</div>`;
}

function setRecapMode(mode) {
  recapMode = mode;
  document.querySelectorAll('.recap-tab').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === mode));
  document.getElementById('recapBody').innerHTML = buildRecap(mode);
}

function periodBounds(mode) {
  const now = new Date();
  let curStart, curEnd, prevStart, prevEnd;
  if (mode === 'week') {
    const dow = now.getDay() || 7; // Mon=1
    curStart  = new Date(now); curStart.setDate(now.getDate() - dow + 1); curStart.setHours(0,0,0,0);
    curEnd    = new Date(curStart); curEnd.setDate(curStart.getDate() + 6);
    prevStart = new Date(curStart); prevStart.setDate(curStart.getDate() - 7);
    prevEnd   = new Date(curStart); prevEnd.setDate(curStart.getDate() - 1);
  } else {
    curStart  = new Date(now.getFullYear(), now.getMonth(), 1);
    curEnd    = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
  }
  const fmt = d => d.toISOString().slice(0,10);
  return {cur:[fmt(curStart), fmt(curEnd)], prev:[fmt(prevStart), fmt(prevEnd)]};
}

function workoutsInRange(start, end) {
  return DB.workouts.filter(w => w.date >= start && w.date <= end);
}

function buildRecap(mode) {
  const {cur, prev} = periodBounds(mode);
  const curW  = workoutsInRange(cur[0], cur[1]);
  const prevW = workoutsInRange(prev[0], prev[1]);

  if (!curW.length && !prevW.length) {
    return `<div class="empty-state"><div class="empty-state-icon">🏅</div><div class="empty-state-msg">No data for this period</div><div class="empty-state-sub">Log workouts this ${mode} and your recap<br>will show up here automatically.</div></div>`;
  }

  const label = mode === 'week'
    ? `${fd(cur[0])} – ${fd(cur[1])}`
    : new Date(cur[0]).toLocaleString('default', {month:'long', year:'numeric'});

  // ── Sessions & volume ──────────────────────────────────────────────────────
  const curDays  = new Set(curW.map(w => w.date)).size;
  const prevDays = new Set(prevW.map(w => w.date)).size;
  const curVol   = curW.filter(w=>w.cat!=='cardio').reduce((a,w)=>a+vol(w.sets),0);
  const prevVol  = prevW.filter(w=>w.cat!=='cardio').reduce((a,w)=>a+vol(w.sets),0);
  const volDelta = prevVol > 0 ? ((curVol-prevVol)/prevVol*100).toFixed(0) : null;
  const sessDelta = prevDays > 0 ? curDays - prevDays : null;

  // ── PRs this period ────────────────────────────────────────────────────────
  const prList = [];
  const curNonCardio = curW.filter(w => w.exId);
  curNonCardio.forEach(w => {
    const prevBest = DB.workouts.filter(x => x.exId===w.exId && x.date < cur[0]).reduce((a,x)=>Math.max(a,maxWt(x.sets)),0);
    const curBest  = maxWt(w.sets);
    if (curBest > prevBest && curBest > 0) {
      if (!prList.find(p => p.exId===w.exId && p.best >= curBest))
        prList.push({name:w.name, exId:w.exId, best:curBest, prev:prevBest});
    }
  });
  prList.sort((a,b) => (b.best-b.prev)-(a.best-a.prev));

  // ── Most improved exercise ─────────────────────────────────────────────────
  let improved = null;
  const prevExBest = {};
  prevW.filter(w=>w.exId).forEach(w => {
    prevExBest[w.exId] = Math.max(prevExBest[w.exId]||0, maxWt(w.sets));
  });
  curNonCardio.forEach(w => {
    const pb = prevExBest[w.exId];
    if (!pb) return;
    const cb = maxWt(w.sets);
    const pct = ((cb-pb)/pb*100);
    if (pct > 0 && (!improved || pct > improved.pct))
      improved = {name:w.name, pct:pct.toFixed(1), from:pb, to:cb};
  });

  // ── Volume leader (muscle group) ───────────────────────────────────────────
  const volByMuscle = {};
  curNonCardio.forEach(w => {
    volByMuscle[w.cat] = (volByMuscle[w.cat]||0) + vol(w.sets);
  });
  const topMuscle = Object.entries(volByMuscle).sort((a,b)=>b[1]-a[1])[0];

  // ── Build achievements top 3 ───────────────────────────────────────────────
  const achievements = [];
  if (prList.length) achievements.push({icon:'🏆', title:`${prList.length} new PR${prList.length>1?'s':''}`, sub: prList.slice(0,2).map(p=>`${p.name}: ${p.best}kg`).join(', ')});
  if (improved) achievements.push({icon:'📈', title:`Best improvement: ${improved.name}`, sub:`${improved.from}kg to ${improved.to}kg (+${improved.pct}%)`});
  if (topMuscle && curDays >= 2) achievements.push({icon:'💪', title:`Volume leader: ${CAT_LBL[topMuscle[0]]||topMuscle[0]}`, sub:`${Math.round(topMuscle[1])}kg total volume`});
  if (curDays > 0 && sessDelta !== null && sessDelta > 0) achievements.push({icon:'🔥', title:`${curDays} session${curDays>1?'s':''} this ${mode}`, sub:`+${sessDelta} more than last ${mode}`});
  else if (curDays > 0 && prevDays > 0) achievements.push({icon:'📅', title:`${curDays} session${curDays>1?'s':''} this ${mode}`, sub:`${prevDays} last ${mode}`});

  // ── Focus area (1 thing to improve) ───────────────────────────────────────
  let focus = null;
  // BW goal off-track takes priority
  const bwEntries = [...(DB.bodyWeights||[])].sort((a,b)=>a.date.localeCompare(b.date));
  if (DB.bwGoal && bwEntries.length >= 2) {
    const latest = parseNum(bwEntries[bwEntries.length-1].weight);
    const prev2  = parseNum(bwEntries[bwEntries.length-2].weight);
    const target = parseNum(DB.bwGoal.target);
    const movingWrong = DB.bwGoal.direction === 'lose' ? latest > prev2 : latest < prev2;
    const notReached  = DB.bwGoal.direction === 'lose' ? latest > target : latest < target;
    if (movingWrong && notReached) focus = {icon:'⚖️', title:'Weight not on track', sub:`Currently ${latest}kg, goal is ${DB.bwGoal.direction} to ${target}kg`};
  }
  // Least trained muscle vs previous period
  if (!focus) {
    const prevVolByMuscle = {};
    prevW.filter(w=>w.cat!=='cardio').forEach(w => { prevVolByMuscle[w.cat]=(prevVolByMuscle[w.cat]||0)+vol(w.sets); });
    let biggestDrop = null;
    Object.entries(prevVolByMuscle).forEach(([m, pv]) => {
      const cv2 = volByMuscle[m] || 0;
      const drop = pv > 0 ? ((pv - cv2) / pv * 100) : 0;
      if (drop > 20 && (!biggestDrop || drop > biggestDrop.drop))
        biggestDrop = {muscle:m, drop:drop.toFixed(0), prevVol:Math.round(pv), curVol:Math.round(cv2)};
    });
    if (biggestDrop) focus = {icon:'📉', title:`${CAT_LBL[biggestDrop.muscle]} volume down ${biggestDrop.drop}%`, sub:`${biggestDrop.prevVol}kg last ${mode} → ${biggestDrop.curVol}kg this ${mode}`};
  }
  // Missed sessions
  if (!focus && prevDays > curDays && prevDays > 1) {
    focus = {icon:'📆', title:`Fewer sessions than last ${mode}`, sub:`${curDays} this ${mode} vs ${prevDays} last ${mode}. Push for consistency!`};
  }
  // (no fallback needed — empty state covers zero-data case)

  // ── Body weight summary ────────────────────────────────────────────────────
  const bwInPeriod = bwEntries.filter(e => e.date >= cur[0] && e.date <= cur[1]);
  let bwHTML = '';
  if (bwInPeriod.length >= 2) {
    const startW = parseNum(bwInPeriod[0].weight);
    const endW   = parseNum(bwInPeriod[bwInPeriod.length-1].weight);
    const diff   = (endW - startW).toFixed(1);
    const sign   = diff > 0 ? '+' : '';
    const col    = diff > 0 ? '#ef4444' : diff < 0 ? '#22c55e' : 'var(--t2)';
    bwHTML = `<div class="recap-bw">
      <div class="recap-bw-lbl">Body Weight</div>
      <div class="recap-bw-vals">${startW}kg → <strong>${endW}kg</strong> <span style="color:${col}">(${sign}${diff}kg)</span></div>
      ${DB.bwGoal ? `<div class="recap-bw-goal">Goal: ${DB.bwGoal.direction} to ${DB.bwGoal.target}kg</div>` : ''}
    </div>`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const deltaSign = v => v > 0 ? `+${v}` : `${v}`;
  let html = `<div class="recap-period">${label}</div>
  <div class="recap-stats">
    <div class="recap-stat">
      <div class="recap-stat-val">${curDays}</div>
      <div class="recap-stat-lbl">Sessions</div>
      ${sessDelta !== null ? `<div class="recap-stat-delta" style="color:${sessDelta>=0?'#22c55e':'#ef4444'}">${deltaSign(sessDelta)}</div>` : ''}
    </div>
    <div class="recap-stat">
      <div class="recap-stat-val">${Math.round(curVol)}</div>
      <div class="recap-stat-lbl">Volume kg</div>
      ${volDelta !== null ? `<div class="recap-stat-delta" style="color:${volDelta>=0?'#22c55e':'#ef4444'}">${deltaSign(volDelta)}%</div>` : ''}
    </div>
    <div class="recap-stat">
      <div class="recap-stat-val">${prList.length}</div>
      <div class="recap-stat-lbl">New PRs</div>
    </div>
  </div>`;

  if (achievements.length) {
    html += `<div class="recap-section-lbl">TOP ${Math.min(3,achievements.length)} THIS ${mode.toUpperCase()}</div>`;
    html += achievements.slice(0,3).map(a => `<div class="recap-item green">
      <div class="recap-item-icon">${a.icon}</div>
      <div><div class="recap-item-title">${a.title}</div><div class="recap-item-sub">${a.sub}</div></div>
    </div>`).join('');
  }

  if (focus) {
    html += `<div class="recap-section-lbl">FOCUS FOR NEXT ${mode.toUpperCase()}</div>`;
    html += `<div class="recap-item orange">
      <div class="recap-item-icon">${focus.icon}</div>
      <div><div class="recap-item-title">${focus.title}</div><div class="recap-item-sub">${focus.sub}</div></div>
    </div>`;
  }

  if (bwHTML) html += bwHTML;

  return html;
}

// ── Import / Export ───────────────────────────────────────────────────────────
function exportData() {
  const b = new Blob([JSON.stringify(DB,null,2)], {type:'application/json'});
  const u = URL.createObjectURL(b), a = document.createElement('a');
  a.href = u; a.download = 'ironlog-backup.json'; a.click();
  URL.revokeObjectURL(u);
  toast('Exported!');
}

async function importData(e) {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = async ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (!d.exercises || !d.workouts) throw 0;
      const ok = await confirm2('Merge imported data with current data?', 'Import');
      if (!ok) return;
      const wi = new Set(DB.workouts.map(w => w.id));
      d.workouts.forEach(w => { if (!wi.has(w.id)) DB.workouts.push(w); });
      Object.entries(d.exercises).forEach(([cat,exs]) => {
        if (!DB.exercises[cat]) DB.exercises[cat] = [];
        const ei = new Set(DB.exercises[cat].map(e => e.id));
        exs.forEach(ex => { if (!ei.has(ex.id)) DB.exercises[cat].push(ex); });
      });
      if (d.bodyWeights) {
        const bi = new Set(DB.bodyWeights.map(e => e.id));
        d.bodyWeights.forEach(e => { if (!bi.has(e.id)) DB.bodyWeights.push(e); });
      }
      if (d.splits) DB.splits = d.splits;
      if (d.bwGoal) DB.bwGoal = d.bwGoal;
      saveDB(); updateStreak(); renderSidebar(); toast('Imported!');
    } catch { toast('Import failed'); }
  };
  r.readAsText(file);
  e.target.value = '';
}

// ── Profile UI ───────────────────────────────────────────────────────────────
function showProfilePicker() {
  closeSB();
  const ov       = document.getElementById('profOv');
  const listEl   = document.getElementById('profList');
  const subEl    = document.getElementById('profSub');
  const profiles = getProfiles();
  subEl.textContent = profiles.length ? "Who's training?" : 'Create your profile to start';
  listEl.innerHTML = profiles.map(name => {
    const col = profColor(name);
    const esc = name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<button class="prof-item" onclick="selectProfile('${esc}')">
      <div class="prof-avatar" style="background:${col}">${profInitials(name)}</div>
      <div class="prof-name">${name}</div>
      <button class="prof-del" onclick="event.stopPropagation();deleteProfile('${esc}')">&#10005;</button>
    </button>`;
  }).join('');
  ov.classList.add('open');
}

function closeProfilePicker() {
  document.getElementById('profOv').classList.remove('open');
}

function selectProfile(name) {
  localStorage.setItem(ACTIVE_KEY, name);
  closeProfilePicker();
  DB = loadDB();
  updateStreak();
  updateProfBtn();
  // reset open state so cards don't bleed across profiles
  openCards = {}; setCounts = {}; curSplit = null; cardioOpen = false; splitEditing = null;
  renderSidebar();
  const first = DB.splits[0] || {id:'split-0', name:'Back & Bis', color:'--back'};
  navTo(first.id, first.name, first.color);
  toast(`Welcome, ${name}! 💪`);
}

function showNewProf() {
  const listEl = document.getElementById('profList');
  const subEl  = document.getElementById('profSub');
  subEl.textContent = 'Create Profile';
  listEl.innerHTML = `<div class="prof-inp-wrap">
    <input class="sh-inp" id="profNameInp" placeholder="Your name" maxlength="24"
      onkeydown="if(event.key==='Enter')createProfile();if(event.key==='Escape')showProfilePicker()">
  </div>
  <div class="sh-acts" style="width:100%;margin-top:0">
    <button class="sh-cancel" onclick="showProfilePicker()">Back</button>
    <button class="sh-ok" onclick="createProfile()">Create</button>
  </div>`;
  setTimeout(() => document.getElementById('profNameInp')?.focus(), 80);
}

function createProfile() {
  const name = document.getElementById('profNameInp')?.value.trim();
  if (!name) { toast('Enter a name'); return; }
  const profiles = getProfiles();
  if (profiles.includes(name)) { toast('Name already taken'); return; }
  profiles.push(name);
  saveProfiles(profiles);
  selectProfile(name);
}

function deleteProfile(name) {
  if (!confirm(`Delete profile "${name}" and all their data?`)) return;
  const profiles = getProfiles().filter(p => p !== name);
  saveProfiles(profiles);
  localStorage.removeItem('il4_' + name);
  if (getActiveProfile() === name) localStorage.removeItem(ACTIVE_KEY);
  showProfilePicker();
}

function updateProfBtn() {
  const name = getActiveProfile() || '';
  const el   = document.getElementById('profBtn');
  if (!el || !name) return;
  const col = profColor(name);
  el.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${col};color:#000;font-family:'Syne',sans-serif;font-size:9px;font-weight:800;flex-shrink:0">${profInitials(name)}</span>&nbsp;${name}`;
}

// ── Init ──────────────────────────────────────────────────────────────────────
function startApp() {
  DB = loadDB();
  updateStreak();
  updateProfBtn();
  updateRestToggleBtn();
  renderSidebar();
  const first = DB.splits[0] || {id:'split-0', name:'Back & Bis', color:'--back'};
  navTo(first.id, first.name, first.color);
}

function initProfiles() {
  const profiles = getProfiles();
  if (profiles.length === 0) {
    // Auto-migrate existing single-user data so they don't lose anything
    const oldData = localStorage.getItem('il4');
    if (oldData) {
      const name = 'My Profile';
      saveProfiles([name]);
      localStorage.setItem(ACTIVE_KEY, name);
      localStorage.setItem('il4_' + name, oldData);
      startApp();
    } else {
      showProfilePicker();
    }
  } else {
    const active = getActiveProfile();
    if (!active || !profiles.includes(active)) {
      localStorage.removeItem(ACTIVE_KEY);
      showProfilePicker();
    } else {
      startApp();
    }
  }
}

initProfiles();
