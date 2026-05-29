const assert = require('assert');

const core = require('./app-core.js');

const db = {};
const app = core.ensureAppShell(db);
assert.strictEqual(app.activeDomain, 'fitness');
assert.strictEqual(app.version, 1);
assert.ok(Array.isArray(db.sleep.logs));
assert.ok(Array.isArray(db.finance.expenses));
assert.ok(db.finance.categories.includes('Food'));

assert.strictEqual(core.sleepDurationMinutes('2026-05-29', '23:45', '07:15'), 450);
assert.strictEqual(core.sleepDurationMinutes('2026-05-29', '22:00', '22:00'), 1440);
assert.strictEqual(core.sleepDurationMinutes('2026-05-29', '', '07:15'), 0);

const idFactory = (() => {
  let i = 0;
  return () => `id-${++i}`;
})();
const firstSleep = core.saveSleepLog(db, { date: '2026-05-28', bedtime: '23:30', wakeTime: '07:10', quality: 4 }, idFactory);
const secondSleep = core.saveSleepLog(db, { date: '2026-05-29', bedtime: '00:10', wakeTime: '06:40', quality: 3 }, idFactory);
assert.strictEqual(firstSleep.durationMinutes, 460);
assert.strictEqual(secondSleep.durationMinutes, 390);
assert.deepStrictEqual(core.sleepWeeklySummary(db, '2026-05-29'), {
  loggedDays: 2,
  avgDurationMinutes: 425,
  avgQuality: 3.5,
  consistencyMinutes: 40,
  logs: db.sleep.logs
});

core.setMonthlyBudget(db, '2026-05', 600);
const food = core.saveExpense(db, { date: '2026-05-28', category: 'Food', merchant: 'Rimi', amount: 42.35 }, idFactory);
const transport = core.saveExpense(db, { date: '2026-05-29', category: 'Transport', amount: 8.15 }, idFactory);
assert.strictEqual(food.amount, 42.35);
assert.strictEqual(transport.amount, 8.15);
assert.deepStrictEqual(core.financeMonthSummary(db, '2026-05'), {
  month: '2026-05',
  budget: 600,
  total: 50.5,
  remaining: 549.5,
  byCategory: { Food: 42.35, Transport: 8.15 },
  items: db.finance.expenses
});

core.deleteExpense(db, transport.id);
assert.strictEqual(core.financeMonthSummary(db, '2026-05').total, 42.35);
core.deleteSleepLog(db, secondSleep.id);
assert.strictEqual(core.sleepWeeklySummary(db, '2026-05-29').loggedDays, 1);

console.log('app-core tests passed');
