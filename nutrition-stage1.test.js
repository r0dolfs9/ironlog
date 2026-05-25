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
