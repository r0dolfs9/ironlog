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
    documentElement: { attrs:{}, setAttribute(k,v){ this.attrs[k]=String(v); }, removeAttribute(k){ delete this.attrs[k]; } },
    addEventListener(){},
    createElement(){ return { click(){}, appendChild(){}, set href(v){ this._href = v; }, set download(v){ this._download = v; } }; },
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
vm.runInContext('DB = loadDB();', context);

['createRecipeFromDraft','recipeDraftTotals','recipeDraftAddIngredient','recipeDraftClear','openRecipeBuilder','openRecipePortionSheet'].forEach(name => {
  assert.strictEqual(typeof context[name], 'function', `${name} should exist`);
});

vm.runInContext(`
recipeDraftClear();
recipeDraftAddIngredient({name:'Chicken breast, cooked',grams:300,calories:495,protein:93,carbs:0,fat:10.8});
recipeDraftAddIngredient({name:'White rice, cooked',grams:500,calories:650,protein:13.5,carbs:141,fat:1.5});
`, context);

const totals = context.recipeDraftTotals();
assert.strictEqual(JSON.stringify(totals), JSON.stringify({ calories: 1145, protein: 106.5, carbs: 141, fat: 12.3 }));

const recipe = context.createRecipeFromDraft('Chicken rice prep', 1100);
assert.strictEqual(recipe.name, 'Chicken rice prep');
assert.strictEqual(recipe.cookedWeightGrams, 1100);
assert.strictEqual(recipe.ingredients.length, 2);
assert.strictEqual(JSON.stringify(recipe.per100g), JSON.stringify({ calories: 104, protein: 9.7, carbs: 12.8, fat: 1.1 }));
assert.ok(context.foodLibrary().some(f => f.id === recipe.id && f.type === 'recipe'));

const logged = context.logRecipePortion(recipe.id, 350, 'lunch', '2026-05-26');
assert.strictEqual(JSON.stringify(logged), JSON.stringify({
  type: 'recipe',
  sourceId: recipe.id,
  name: 'Chicken rice prep',
  grams: 350,
  calories: 364,
  protein: 33.9,
  carbs: 44.8,
  fat: 3.9,
  snapshot: true
}));

recipe.per100g.calories = 999;
const day = context.nutritionDay('2026-05-26');
assert.strictEqual(day.meals.find(m => m.id === 'lunch').items[0].calories, 364, 'logged recipe entries must be snapshots');

console.log('nutrition-stage4 tests passed');
