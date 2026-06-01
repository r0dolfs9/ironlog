const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('IronLog v3.html', 'utf8');
const storageScript = fs.readFileSync('app-storage.js', 'utf8');
const fitnessScript = fs.readFileSync('app-fitness.js', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

const store = new Map();
const context = {
  console,
  Blob: function(parts, opts){ this.parts = parts; this.opts = opts; },
  URL: { createObjectURL(){ return 'blob:test'; } },
  setTimeout(){},
  clearTimeout(){},
  localStorage: {
    getItem(k){ return store.has(k) ? store.get(k) : null; },
    setItem(k,v){ store.set(k, String(v)); },
    removeItem(k){ store.delete(k); }
  },
  document: {
    documentElement: {
      attrs: {},
      setAttribute(k,v){ this.attrs[k] = String(v); },
      removeAttribute(k){ delete this.attrs[k]; }
    },
    addEventListener(){},
    createElement(){ return { click(){}, set href(v){ this._href = v; }, set download(v){ this._download = v; } }; },
    querySelector(sel){ if(sel === 'meta[name="theme-color"]') return { setAttribute(k,v){ this[k] = v; } }; return null; },
    getElementById(){ return null; },
    querySelectorAll(){ return []; }
  },
  getComputedStyle(){ return { getPropertyValue(){ return ''; } }; },
  navigator: {}
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(storageScript, context);
vm.runInContext(fitnessScript, context);
vm.runInContext(script, context);
vm.runInContext('DB = loadDB();', context);

['getTheme','setTheme','recipePer100','logRecipePortion','nutritionCoachSummary'].forEach(name => {
  assert.notStrictEqual(typeof context[name], 'undefined', `${name} should exist`);
});

assert.ok(vm.runInContext('Array.isArray(THEMES)', context));
assert.ok(vm.runInContext("THEMES.some(t => t.id === 'parchment')", context));
context.setTheme('forest');
assert.strictEqual(store.get('il4_theme'), 'forest');
assert.strictEqual(context.document.documentElement.attrs['data-theme'], 'forest');
context.setTheme('ember');
assert.strictEqual(context.document.documentElement.attrs['data-theme'], undefined);

const recipe = {
  id: 'r1',
  name: 'Turkey chili',
  ingredients: [
    { name: 'Lean turkey', grams: 500, calories: 675, protein: 105, carbs: 0, fat: 25, snapshot: true },
    { name: 'Beans', grams: 400, calories: 508, protein: 34, carbs: 91, fat: 2, snapshot: true }
  ],
  cookedWeightGrams: 1200,
  archived: false
};
assert.strictEqual(JSON.stringify(context.recipePer100(recipe)), JSON.stringify({ calories: 99, protein: 11.6, carbs: 7.6, fat: 2.3 }));
context.recipeForTest = recipe;
vm.runInContext('DB.nutrition.recipes.push(recipeForTest);', context);
const day = context.nutritionDay('2026-05-26');
context.logRecipePortion('r1', 300, 'dinner', '2026-05-26');
assert.strictEqual(day.meals.find(m => m.id === 'dinner').items[0].calories, 297);

day.status = 'complete';
vm.runInContext(`DB.bodyWeights.push({ id: 'a', date: '2026-05-20', weight: '84.0' });
DB.bodyWeights.push({ id: 'b', date: '2026-05-26', weight: '83.2' });`, context);
const coach = context.nutritionCoachSummary();
assert.ok(coach.recommendation);
assert.ok(coach.lines.some(l => l.includes('Recommendation')));

console.log('nutrition-stage3 tests passed');
