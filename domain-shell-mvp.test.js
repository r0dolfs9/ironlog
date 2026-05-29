const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('IronLog v3.html', 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

const store = new Map();
const context = {
  console,
  Blob: function(parts, opts){ this.parts = parts; this.opts = opts; },
  FileReader: function(){},
  URL: { createObjectURL(){ return 'blob:test'; } },
  setTimeout(fn){ if(typeof fn === 'function') fn(); return 1; },
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

[
  'ensureAppShell',
  'ensureSleep',
  'saveSleepLog',
  'sleepWeeklySummary',
  'ensureFinance',
  'setMonthlyBudget',
  'saveExpense',
  'financeMonthSummary'
].forEach(name => {
  assert.strictEqual(typeof context[name], 'function', `${name} should exist`);
});

assert.strictEqual(vm.runInContext('DB.app.activeDomain', context), 'fitness');
assert.ok(vm.runInContext('Array.isArray(DB.sleep.logs)', context));
assert.ok(vm.runInContext('Array.isArray(DB.finance.expenses)', context));
assert.ok(vm.runInContext('DB.finance.categories.includes("Food")', context));

const overnight = context.sleepDurationMinutes('2026-05-28', '23:30', '07:10');
assert.strictEqual(overnight, 460);

const sleepA = context.saveSleepLog({
  date: '2026-05-27',
  bedtime: '23:30',
  wakeTime: '07:10',
  quality: 4,
  notes: 'Good sleep'
});
assert.strictEqual(sleepA.durationMinutes, 460);
const sleepB = context.saveSleepLog({
  date: '2026-05-28',
  bedtime: '00:10',
  wakeTime: '06:40',
  quality: 3,
  notes: ''
});
const sleepSummary = context.sleepWeeklySummary('2026-05-28');
assert.strictEqual(sleepSummary.loggedDays, 2);
assert.strictEqual(sleepSummary.avgDurationMinutes, 425);
assert.strictEqual(sleepSummary.avgQuality, 3.5);
assert.strictEqual(sleepSummary.consistencyMinutes, 40);

context.setMonthlyBudget('2026-05', 600);
const expA = context.saveExpense({ date: '2026-05-27', category: 'Food', merchant: 'Rimi', note: 'groceries', amount: 42.35 });
const expB = context.saveExpense({ date: '2026-05-28', category: 'Transport', merchant: 'Bolt', amount: 8.15 });
assert.ok(expA.id && expB.id);
const financeSummary = context.financeMonthSummary('2026-05');
assert.strictEqual(financeSummary.budget, 600);
assert.strictEqual(financeSummary.total, 50.5);
assert.strictEqual(financeSummary.remaining, 549.5);
assert.strictEqual(financeSummary.byCategory.Food, 42.35);
assert.strictEqual(financeSummary.byCategory.Transport, 8.15);

context.deleteExpense(expB.id);
assert.strictEqual(context.financeMonthSummary('2026-05').total, 42.35);
context.deleteSleepLog(sleepB.id);
assert.strictEqual(context.sleepWeeklySummary('2026-05-28').loggedDays, 1);

console.log('domain-shell-mvp tests passed');
