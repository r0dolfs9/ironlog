const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('IronLog v3.html', 'utf8');
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
    documentElement: { setAttribute(){}, removeAttribute(){} },
    addEventListener(){},
    createElement(){ return { click(){}, set href(v){ this._href = v; }, set download(v){ this._download = v; } }; },
    querySelector(){ return null; },
    getElementById(){ return null; },
    querySelectorAll(){ return []; }
  },
  getComputedStyle(){ return { getPropertyValue(){ return ''; } }; },
  navigator: {}
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(script, context);

assert.strictEqual(typeof context.starterFoods, 'function');
assert.strictEqual(typeof context.foodLibrary, 'function');
assert.strictEqual(typeof context.calcPer100FromEntry, 'function');
assert.strictEqual(typeof context.nutritionCoachSummary, 'function');
assert.strictEqual(typeof context.nutritionMarkdownLines, 'function');

vm.runInContext('DB = loadDB();', context);

const starters = context.starterFoods();
assert.ok(starters.length >= 8, 'starter database should include at least 8 foods');
assert.ok(starters.every(f => f.source === 'USDA FoodData Central'));
assert.ok(starters.every(f => f.per100g && Number.isFinite(f.per100g.calories)));
assert.ok(starters.some(f => f.id === 'usda-chicken-breast-cooked'));
assert.strictEqual(
  JSON.stringify(starters.find(f => f.id === 'usda-olive-oil').per100g),
  JSON.stringify({ calories: 884, protein: 0, carbs: 0, fat: 100 })
);

const entry = context.calcPer100FromEntry({ calories: 330, protein: 62, carbs: 0, fat: 7.2, grams: 200 });
assert.strictEqual(JSON.stringify(entry), JSON.stringify({ calories: 165, protein: 31, carbs: 0, fat: 3.6 }));

vm.runInContext(`DB.nutrition.foods.push({
  id: 'private-test',
  name: 'My chicken bowl',
  source: 'private',
  per100g: { calories: 150, protein: 20, carbs: 10, fat: 3 },
  serving: null,
  archived: false
});`, context);
assert.ok(context.foodLibrary().some(f => f.id === 'private-test'));

const day = context.nutritionDay('2026-05-25');
day.status = 'complete';
day.meals[1].items.push({ name: 'Chicken rice', calories: 700, protein: 55, carbs: 80, fat: 15 });
vm.runInContext(`DB.bodyWeights.push({ id: 'bw1', date: '2026-05-19', weight: '84.0' });
DB.bodyWeights.push({ id: 'bw2', date: '2026-05-25', weight: '83.5' });`, context);

const coach = context.nutritionCoachSummary();
assert.ok(['high', 'medium', 'low'].includes(coach.confidence));
assert.ok(coach.lines.length >= 3);
assert.ok(coach.lines.join('\n').includes('Nutrition data'));

const md = context.nutritionMarkdownLines();
assert.ok(md.some(line => line === '## Nutrition'));
assert.ok(md.some(line => line.includes('Chicken rice')));
assert.ok(md.some(line => line.includes('Current targets')));

console.log('nutrition-stage2 tests passed');
