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
vm.runInContext(storageScript, context);
vm.runInContext(fitnessScript, context);
vm.runInContext(script, context);
vm.runInContext('DB = loadDB();', context);

['searchFoodLibrary','recipeDraftLoad','updateRecipe','nutritionWeeklyTrend','macroAdjustmentAdvice'].forEach(name => {
  assert.strictEqual(typeof context[name], 'function', `${name} should exist`);
});

const starters = context.starterFoods();
assert.ok(starters.length >= 20, 'starter foods should cover common cutting staples');
assert.ok(starters.every(f => f.category && f.source === 'USDA FoodData Central'));

const chickenResults = context.searchFoodLibrary('chick breast', 5);
assert.strictEqual(chickenResults[0].id, 'usda-chicken-breast-cooked');
assert.ok(chickenResults[0].matchLabel.includes('Protein'));

vm.runInContext(`DB.nutrition.foods.push({
  id: 'private-oats',
  name: 'My cinnamon oats',
  source: 'private',
  category: 'Saved',
  per100g: { calories: 140, protein: 5, carbs: 24, fat: 2 },
  serving: null,
  archived: false
});`, context);
assert.strictEqual(context.searchFoodLibrary('cinnamon', 3)[0].id, 'private-oats');

vm.runInContext(`
recipeDraftClear();
recipeDraftAddIngredient({name:'Chicken breast, cooked',grams:300,calories:495,protein:93,carbs:0,fat:10.8});
recipeDraftAddIngredient({name:'White rice, cooked',grams:500,calories:650,protein:13.5,carbs:141,fat:1.5});
`, context);
const recipe = context.createRecipeFromDraft('Chicken rice prep', 1100);
const logged = context.logRecipePortion(recipe.id, 350, 'lunch', '2026-05-20');
assert.strictEqual(logged.calories, 364);

const updated = context.updateRecipe(recipe.id, {
  name: 'Chicken rice prep lean',
  cookedWeightGrams: 1000,
  ingredients: [
    { name: 'Chicken breast, cooked', grams: 350, calories: 578, protein: 108.5, carbs: 0, fat: 12.6 },
    { name: 'White rice, cooked', grams: 450, calories: 585, protein: 12.2, carbs: 126.9, fat: 1.4 }
  ]
});
assert.strictEqual(updated.name, 'Chicken rice prep lean');
assert.strictEqual(JSON.stringify(updated.per100g), JSON.stringify({ calories: 116, protein: 12.1, carbs: 12.7, fat: 1.4 }));
assert.strictEqual(context.nutritionDay('2026-05-20').meals.find(m => m.id === 'lunch').items[0].calories, 364, 'old logged portions remain snapshots');

const baseDates = ['2026-05-21','2026-05-22','2026-05-23','2026-05-24','2026-05-25','2026-05-26','2026-05-27'];
baseDates.forEach((date, idx) => {
  const day = context.nutritionDay(date);
  day.status = idx < 5 ? 'complete' : 'partial';
  day.targetType = 'training';
  day.meals[0].items.push({ name: 'Logged day', grams: 100, calories: 2100 + idx * 20, protein: 170, carbs: 220, fat: 60 });
});
vm.runInContext(`
DB.bodyWeights = [
  { id:'w1', date:'2026-05-21', weight:'84.0' },
  { id:'w2', date:'2026-05-22', weight:'83.9' },
  { id:'w3', date:'2026-05-23', weight:'83.8' },
  { id:'w4', date:'2026-05-24', weight:'83.7' },
  { id:'w5', date:'2026-05-27', weight:'83.5' }
];`, context);

const trend = context.nutritionWeeklyTrend('2026-05-27');
assert.strictEqual(trend.loggedDays, 7);
assert.strictEqual(trend.completeDays, 5);
assert.strictEqual(trend.weighIns, 5);
assert.strictEqual(trend.avgCalories, 2160);
assert.strictEqual(trend.avgProtein, 170);
assert.strictEqual(trend.weightChange, -0.5);
assert.strictEqual(trend.calorieDelta, -240);

const advice = context.macroAdjustmentAdvice(trend);
assert.strictEqual(advice.confidence, 'high');
assert.ok(advice.recommendation.includes('hold targets'));
assert.ok(advice.reason.includes('cutting range'));

const lowAdvice = context.macroAdjustmentAdvice({ ...trend, completeDays: 2, weighIns: 1 });
assert.strictEqual(lowAdvice.confidence, 'low');
assert.ok(lowAdvice.recommendation.includes('Finish more complete entries'));

const coach = context.nutritionCoachSummary('2026-05-27');
assert.strictEqual(coach.confidence, 'high');
assert.ok(coach.lines.some(line => line.includes('Weekly averages')));
assert.ok(coach.lines.some(line => line.includes('hold targets')));

const md = context.nutritionMarkdownLines();
assert.ok(md.some(line => line.includes('Weekly trend:')));
assert.ok(md.some(line => line.includes('Macro recommendation:')));

console.log('nutrition-stage5 tests passed');
