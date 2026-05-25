# Nutrition Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Nutrition tab: database migration, macro totals, bottom-tab entry point, daily dashboard, meal sections, and manual ingredient logging.

**Architecture:** Keep IronLog's current single-file app pattern. Add pure nutrition helper functions inside `IronLog v3.html`, then render the Nutrition tab from those helpers. Copy `IronLog v3.html` to `index.html` after each working stage and bump `sw.js` cache on release.

**Tech Stack:** Vanilla HTML/CSS/JS, localStorage, single-file PWA, Node for a small helper test script.

---

## Files

| File | What changes |
|---|---|
| `IronLog v3.html` | Add nutrition CSS, page markup, nav tab, DB defaults/migration, helper functions, `renderNutrition()`, manual add/save flow |
| `index.html` | Verbatim copy of `IronLog v3.html` after implementation |
| `sw.js` | Bump `CACHE` after app changes |
| `nutrition-stage1.test.js` | New Node smoke/unit test for pure nutrition helpers |
| `PROGRESS.md` | Add implementation session note after each committed task |

---

## Task 1: Add nutrition helper tests first

**Files:**
- Create: `nutrition-stage1.test.js`

- [ ] **Step 1: Create the failing test file**

Create `nutrition-stage1.test.js` with this content:

```js
const assert = require('assert');

function nRound(v){ return Math.round((Number(v) || 0) * 10) / 10; }

function nutritionDefaults(){
  return {
    targets: {
      mode: 'standard',
      goal: 'cut',
      startDate: null,
      weeklyLossRatePct: 0.6,
      trainingDay: { calories: 2400, protein: 180, carbs: 260, fat: 70 },
      restDay: { calories: 2100, protein: 180, carbs: 185, fat: 70 },
      history: []
    },
    diary: {},
    foods: [],
    recipes: [],
    checkins: []
  };
}

function ensureNutrition(db){
  const next = db || {};
  if(!next.nutrition) next.nutrition = nutritionDefaults();
  if(!next.nutrition.targets) next.nutrition.targets = nutritionDefaults().targets;
  if(!next.nutrition.diary) next.nutrition.diary = {};
  if(!Array.isArray(next.nutrition.foods)) next.nutrition.foods = [];
  if(!Array.isArray(next.nutrition.recipes)) next.nutrition.recipes = [];
  if(!Array.isArray(next.nutrition.checkins)) next.nutrition.checkins = [];
  return next;
}

function emptyNutritionDay(targetType='training'){
  return {
    targetType,
    status: 'open',
    quality: 'missing',
    meals: [
      { id: 'breakfast', name: 'Breakfast', items: [] },
      { id: 'lunch', name: 'Lunch', items: [] },
      { id: 'dinner', name: 'Dinner', items: [] },
      { id: 'snacks', name: 'Snacks', items: [] }
    ]
  };
}

function nutritionDay(db, date){
  ensureNutrition(db);
  if(!db.nutrition.diary[date]) db.nutrition.diary[date] = emptyNutritionDay();
  return db.nutrition.diary[date];
}

function nutritionTotals(day){
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  (day.meals || []).forEach(meal => {
    (meal.items || []).forEach(item => {
      totals.calories += Number(item.calories) || 0;
      totals.protein += Number(item.protein) || 0;
      totals.carbs += Number(item.carbs) || 0;
      totals.fat += Number(item.fat) || 0;
    });
  });
  return {
    calories: Math.round(totals.calories),
    protein: nRound(totals.protein),
    carbs: nRound(totals.carbs),
    fat: nRound(totals.fat)
  };
}

function nutritionQuality(day){
  const totals = nutritionTotals(day);
  if(day.status === 'complete') return 'complete';
  if(totals.calories === 0) return 'missing';
  if(totals.calories < 1200 || totals.protein < 80) return 'likelyIncomplete';
  return 'open';
}

const db = ensureNutrition({ workouts: [] });
assert.ok(db.nutrition.targets.trainingDay.calories > db.nutrition.targets.restDay.calories);
const day = nutritionDay(db, '2026-05-25');
assert.strictEqual(day.meals.length, 4);
day.meals[1].items.push({ name: 'Chicken rice', calories: 700, protein: 55, carbs: 80, fat: 15 });
assert.deepStrictEqual(nutritionTotals(day), { calories: 700, protein: 55, carbs: 80, fat: 15 });
assert.strictEqual(nutritionQuality(day), 'likelyIncomplete');
day.status = 'complete';
assert.strictEqual(nutritionQuality(day), 'complete');

console.log('nutrition-stage1 tests passed');
```

- [ ] **Step 2: Run the test**

Run:

```bash
node nutrition-stage1.test.js
```

Expected output:

```text
nutrition-stage1 tests passed
```

- [ ] **Step 3: Commit the test scaffold**

```bash
git add nutrition-stage1.test.js
git commit -m "test: add nutrition stage 1 helper tests"
```

---

## Task 2: Add nutrition DB defaults and migration

**Files:**
- Modify: `IronLog v3.html`
- Modify: `index.html`

- [ ] **Step 1: Add helper functions after `parseNum`**

In `IronLog v3.html`, find:

```js
function parseNum(v){return parseFloat(String(v||'').replace(',','.').trim())||0}
```

Immediately after it, add:

```js
function nRound(v){return Math.round((Number(v)||0)*10)/10}
function nutritionDefaults(){
  return {
    targets:{
      mode:'standard',
      goal:'cut',
      startDate:null,
      weeklyLossRatePct:0.6,
      trainingDay:{calories:2400,protein:180,carbs:260,fat:70},
      restDay:{calories:2100,protein:180,carbs:185,fat:70},
      history:[]
    },
    diary:{},
    foods:[],
    recipes:[],
    checkins:[]
  };
}
function ensureNutrition(db){
  const base=nutritionDefaults();
  if(!db.nutrition)db.nutrition=base;
  if(!db.nutrition.targets)db.nutrition.targets=base.targets;
  if(!db.nutrition.diary)db.nutrition.diary={};
  if(!Array.isArray(db.nutrition.foods))db.nutrition.foods=[];
  if(!Array.isArray(db.nutrition.recipes))db.nutrition.recipes=[];
  if(!Array.isArray(db.nutrition.checkins))db.nutrition.checkins=[];
  return db.nutrition;
}
function emptyNutritionDay(targetType='training'){
  return {
    targetType,
    status:'open',
    quality:'missing',
    meals:[
      {id:'breakfast',name:'Breakfast',items:[]},
      {id:'lunch',name:'Lunch',items:[]},
      {id:'dinner',name:'Dinner',items:[]},
      {id:'snacks',name:'Snacks',items:[]}
    ]
  };
}
function nutritionDay(date=today()){
  ensureNutrition(DB);
  if(!DB.nutrition.diary[date])DB.nutrition.diary[date]=emptyNutritionDay();
  return DB.nutrition.diary[date];
}
function nutritionTotals(day){
  const t={calories:0,protein:0,carbs:0,fat:0};
  (day.meals||[]).forEach(m=>(m.items||[]).forEach(it=>{
    t.calories+=Number(it.calories)||0;
    t.protein+=Number(it.protein)||0;
    t.carbs+=Number(it.carbs)||0;
    t.fat+=Number(it.fat)||0;
  }));
  return {calories:Math.round(t.calories),protein:nRound(t.protein),carbs:nRound(t.carbs),fat:nRound(t.fat)};
}
function nutritionTarget(day){
  const n=ensureNutrition(DB);
  return day.targetType==='rest'?n.targets.restDay:n.targets.trainingDay;
}
function nutritionQuality(day){
  const t=nutritionTotals(day);
  if(day.status==='complete')return 'complete';
  if(t.calories===0)return 'missing';
  if(t.calories<1200||t.protein<80)return 'likelyIncomplete';
  return 'open';
}
```

- [ ] **Step 2: Call migration inside `loadDB()` for existing DBs**

In `loadDB()`, change:

```js
if(!d.settings)d.settings={restEnabled:true,restSecs:90};
return d;
```

to:

```js
if(!d.settings)d.settings={restEnabled:true,restSecs:90};
ensureNutrition(d);
return d;
```

- [ ] **Step 3: Add nutrition to a fresh DB**

In the fresh return object, change:

```js
return{exercises:ex,workouts:[],bodyWeights:[],splits:DEFAULT_SPLITS.map(s=>JSON.parse(JSON.stringify(s))),bwGoal:null,settings:{restEnabled:true,restSecs:90}};
```

to:

```js
const fresh={exercises:ex,workouts:[],bodyWeights:[],splits:DEFAULT_SPLITS.map(s=>JSON.parse(JSON.stringify(s))),bwGoal:null,settings:{restEnabled:true,restSecs:90}};
ensureNutrition(fresh);
return fresh;
```

- [ ] **Step 4: Copy source to deploy file**

```powershell
Copy-Item -LiteralPath 'IronLog v3.html' -Destination 'index.html' -Force
```

- [ ] **Step 5: Verify syntax**

Run:

```bash
node --check "IronLog v3.html"
```

Expected: no syntax errors.

- [ ] **Step 6: Commit**

```bash
git add "IronLog v3.html" index.html
git commit -m "feat: add nutrition data model migration"
```

---

## Task 3: Add Nutrition tab shell

**Files:**
- Modify: `IronLog v3.html`
- Modify: `index.html`

- [ ] **Step 1: Add Nutrition page markup**

In `IronLog v3.html`, after:

```html
<div class="page" id="page-train"><div id="trainContent"></div></div>
```

add:

```html
<!-- NUTRITION -->
<div class="page" id="page-nutrition"><div id="nutritionContent"></div></div>
```

- [ ] **Step 2: Add Nutrition bottom tab**

In the bottom tab bar, insert this button between Train and Progress:

```html
<button class="v3-tab" id="tab-nutrition" onclick="switchTab('nutrition')">
  <svg class="v3-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M7 19V9"/><path d="M12 19V5"/><path d="M17 19v-7"/></svg>
  Nutrition
</button>
```

- [ ] **Step 3: Update tab order and page map**

Change:

```js
const _TAB_ORDER = ['home','train','progress','history'];
```

to:

```js
const _TAB_ORDER = ['home','train','nutrition','progress','history'];
```

Change:

```js
const pageMap = {home:'page-home',train:'page-train',progress:'page-progress-hub',history:'page-history'};
```

to:

```js
const pageMap = {home:'page-home',train:'page-train',nutrition:'page-nutrition',progress:'page-progress-hub',history:'page-history'};
```

- [ ] **Step 4: Add `switchTab` render branch**

Between the Train and Progress branches, add:

```js
} else if (tab === 'nutrition') {
  renderNutrition();
  updateTopbar('nutrition');
```

- [ ] **Step 5: Add Nutrition topbar label**

In `updateTopbar`, add:

```js
nutrition: 'Nutrition',
```

- [ ] **Step 6: Add temporary render function**

Before `renderHome()`, add:

```js
function renderNutrition(){
  const el=document.getElementById('nutritionContent');
  if(!el)return;
  el.innerHTML='<div class="no-data" style="padding:40px 20px;text-align:center;color:var(--t3)">Nutrition tracker coming online.</div>';
}
```

- [ ] **Step 7: Copy, verify, commit**

```powershell
Copy-Item -LiteralPath 'IronLog v3.html' -Destination 'index.html' -Force
node --check "IronLog v3.html"
git add "IronLog v3.html" index.html
git commit -m "feat: add nutrition tab shell"
```

---

## Task 4: Render macro dashboard and meal sections

**Files:**
- Modify: `IronLog v3.html`
- Modify: `index.html`

- [ ] **Step 1: Add nutrition CSS near existing card styles**

Add:

```css
.nut-wrap{padding:0 14px 20px;display:flex;flex-direction:column;gap:14px}
.nut-card{background:var(--glass);backdrop-filter:blur(24px) saturate(1.5);-webkit-backdrop-filter:blur(24px) saturate(1.5);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px}
.nut-kicker{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t3);margin-bottom:8px}
.nut-cal-row{display:flex;align-items:center;justify-content:space-between;gap:14px}
.nut-cal{font-family:'Instrument Serif',serif;font-size:54px;line-height:.9;color:var(--text)}
.nut-cal span{font-family:'Geist',sans-serif;font-size:12px;color:var(--t3);margin-left:4px}
.nut-pill{font-size:11px;font-weight:700;color:var(--acc);background:var(--acc-dim);border:1px solid rgba(255,107,53,.22);border-radius:999px;padding:7px 10px}
.nut-bars{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.nut-bar-top{display:flex;justify-content:space-between;font-size:12px;color:var(--t2);margin-bottom:5px}
.nut-bar-track{height:7px;background:var(--s3);border-radius:99px;overflow:hidden}
.nut-bar-fill{height:100%;background:var(--acc);border-radius:99px}
.nut-meal{display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--border)}
.nut-meal:last-child{border-bottom:0}
.nut-meal-name{font-size:14px;font-weight:700}
.nut-meal-sub{font-size:11px;color:var(--t3);margin-top:2px}
.nut-add{width:100%;border:0;border-radius:var(--r-md);padding:14px;background:var(--acc);color:#130b06;font-weight:800}
```

- [ ] **Step 2: Replace `renderNutrition()`**

Replace the temporary function with:

```js
function macroBar(label,val,target){
  const pct=target?Math.min(100,Math.round((val/target)*100)):0;
  return `<div><div class="nut-bar-top"><span>${label}</span><span>${val} / ${target}g</span></div><div class="nut-bar-track"><div class="nut-bar-fill" style="width:${pct}%"></div></div></div>`;
}
function mealTotals(meal){return nutritionTotals({meals:[meal]})}
function renderNutrition(){
  const el=document.getElementById('nutritionContent');
  if(!el)return;
  const day=nutritionDay(today());
  day.quality=nutritionQuality(day);
  const totals=nutritionTotals(day);
  const target=nutritionTarget(day);
  const remaining=Math.max(0,target.calories-totals.calories);
  const meals=day.meals.map(m=>{
    const mt=mealTotals(m);
    const sub=mt.calories?`${mt.calories} kcal · ${mt.protein}P / ${mt.carbs}C / ${mt.fat}F`:'No items yet';
    return `<div class="nut-meal"><div><div class="nut-meal-name">${esc(m.name)}</div><div class="nut-meal-sub">${sub}</div></div><button class="mini" onclick="openNutritionAdd('${jsa(m.id)}')">Add</button></div>`;
  }).join('');
  el.innerHTML=`<div class="nut-wrap">
    <div class="nut-card">
      <div class="nut-kicker">Today · ${day.targetType==='rest'?'Rest':'Training'} day</div>
      <div class="nut-cal-row">
        <div><div class="nut-cal">${remaining}<span>kcal left</span></div><div class="nut-meal-sub">${totals.calories} / ${target.calories} kcal</div></div>
        <button class="nut-pill" onclick="toggleNutritionTargetType()">${day.quality}</button>
      </div>
      <div class="nut-bars">
        ${macroBar('Protein',totals.protein,target.protein)}
        ${macroBar('Carbs',totals.carbs,target.carbs)}
        ${macroBar('Fat',totals.fat,target.fat)}
      </div>
    </div>
    <div class="nut-card"><div class="nut-kicker">Meals</div>${meals}</div>
    <button class="nut-add" onclick="openNutritionAdd('snacks')">Add food</button>
  </div>`;
}
function toggleNutritionTargetType(){
  const d=nutritionDay(today());
  d.targetType=d.targetType==='rest'?'training':'rest';
  saveDB();renderNutrition();
}
```

- [ ] **Step 3: Copy, verify, commit**

```powershell
Copy-Item -LiteralPath 'IronLog v3.html' -Destination 'index.html' -Force
node --check "IronLog v3.html"
git add "IronLog v3.html" index.html
git commit -m "feat: render nutrition macro dashboard"
```

---

## Task 5: Add manual food logging sheet

**Files:**
- Modify: `IronLog v3.html`
- Modify: `index.html`
- Modify: `sw.js`

- [ ] **Step 1: Add global selected meal state**

Near other globals, add:

```js
let _nutritionMealId='snacks';
```

- [ ] **Step 2: Add manual food sheet functions**

Before `renderNutrition()`, add:

```js
function openNutritionAdd(mealId='snacks'){
  _nutritionMealId=mealId;
  const sheet=document.getElementById('sheet');
  sheet.innerHTML=`<div class="sh-title">Add food</div>
    <input class="sh-inp" id="nfName" placeholder="Food name">
    <div class="cc-fields">
      <div class="ccfw"><div class="cfl">Grams</div><input class="cff" id="nfGrams" inputmode="decimal" placeholder="100"></div>
      <div class="ccfw"><div class="cfl">Calories</div><input class="cff" id="nfCalories" inputmode="decimal" placeholder="0"></div>
    </div>
    <div class="cc-fields">
      <div class="ccfw"><div class="cfl">Protein</div><input class="cff" id="nfProtein" inputmode="decimal" placeholder="0"></div>
      <div class="ccfw"><div class="cfl">Carbs</div><input class="cff" id="nfCarbs" inputmode="decimal" placeholder="0"></div>
      <div class="ccfw"><div class="cfl">Fat</div><input class="cff" id="nfFat" inputmode="decimal" placeholder="0"></div>
    </div>
    <button class="nut-add" onclick="saveNutritionFood()">Save food</button>`;
  sheet.classList.add('open');
  document.getElementById('shBg').classList.add('open');
}
function saveNutritionFood(){
  const day=nutritionDay(today());
  const meal=day.meals.find(m=>m.id===_nutritionMealId)||day.meals[3];
  const name=document.getElementById('nfName')?.value.trim()||'Food';
  const item={
    type:'food',
    sourceId:null,
    name,
    grams:parseNum(document.getElementById('nfGrams')?.value),
    calories:Math.round(parseNum(document.getElementById('nfCalories')?.value)),
    protein:nRound(parseNum(document.getElementById('nfProtein')?.value)),
    carbs:nRound(parseNum(document.getElementById('nfCarbs')?.value)),
    fat:nRound(parseNum(document.getElementById('nfFat')?.value)),
    snapshot:true
  };
  meal.items.push(item);
  day.quality=nutritionQuality(day);
  saveDB();
  closeSheet();
  renderNutrition();
  toast('Food added');
}
```

- [ ] **Step 3: Bump service worker cache**

In `sw.js`, change the cache constant from its current value to the next version, for example:

```js
const CACHE='ironlog-v17';
```

Use the next number after the current value in the file.

- [ ] **Step 4: Copy, verify app syntax, run helper tests**

```powershell
Copy-Item -LiteralPath 'IronLog v3.html' -Destination 'index.html' -Force
node --check "IronLog v3.html"
node nutrition-stage1.test.js
```

Expected:

```text
nutrition-stage1 tests passed
```

- [ ] **Step 5: Commit**

```bash
git add "IronLog v3.html" index.html sw.js
git commit -m "feat: add manual nutrition food logging"
```

---

## Verification After Task 5

- [ ] Open `IronLog v3.html` in a browser.
- [ ] Click Nutrition tab.
- [ ] Confirm macro dashboard renders.
- [ ] Toggle Training/Rest target type.
- [ ] Add food to Lunch.
- [ ] Confirm calories and macros update.
- [ ] Refresh the page.
- [ ] Confirm the logged food persists.
- [ ] Confirm Home, Train, Progress, and History still open.

## Stage 1 Completion Criteria

- Nutrition tab exists in bottom navigation.
- Existing user DBs migrate without losing training/bodyweight data.
- Daily macro dashboard works from `DB.nutrition`.
- Four default meals render.
- Manual food logging works with calories/protein/carbs/fat.
- `IronLog v3.html` and `index.html` are synced.
- `sw.js` cache is bumped.
- `nutrition-stage1.test.js` passes.

