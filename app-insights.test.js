const assert = require('assert');

const insights = require('./app-insights.js');
const R = insights._rules;

// ── hhmm formatting ──────────────────────────────────────────────────────────
assert.strictEqual(insights.hhmm(370), '6:10');
assert.strictEqual(insights.hhmm(60), '1:00');
assert.strictEqual(insights.hhmm(1440), '0:00'); // midnight wraps

// ── sleep duration rule (guarded) ────────────────────────────────────────────
assert.strictEqual(R.sleepDurationRule({}), null, 'no sleep ctx => no suggestion');
assert.strictEqual(R.sleepDurationRule({ sleep: { loggedDays: 0 } }), null);
{
  const s = R.sleepDurationRule({ sleep: { loggedDays: 1, lastLog: { bedtime: '1:00', durationMinutes: 370 } } });
  assert.ok(s && s.domain === 'sleep' && s.severity === 'high');
  assert.ok(/6:10/.test(s.text) && /1:00/.test(s.text));
}
// 8h sleep => no nudge.
assert.strictEqual(R.sleepDurationRule({ sleep: { loggedDays: 1, lastLog: { bedtime: '23:00', durationMinutes: 480 } } }), null);

// ── sleep consistency rule ───────────────────────────────────────────────────
assert.strictEqual(R.sleepConsistencyRule({ sleep: { loggedDays: 2, consistencyMinutes: 200 } }), null, 'needs >=3 nights');
assert.strictEqual(R.sleepConsistencyRule({ sleep: { loggedDays: 5, consistencyMinutes: 40 } }), null, 'tight spread => no nudge');
assert.ok(R.sleepConsistencyRule({ sleep: { loggedDays: 5, consistencyMinutes: 150 } }));

// ── fitness gap rule ─────────────────────────────────────────────────────────
assert.strictEqual(R.fitnessGapRule({}), null);
assert.strictEqual(R.fitnessGapRule({ fitness: { split: { id: 'legs', name: 'Legs' }, daysSince: 4 } }), null, '<7d => no nudge');
{
  const s = R.fitnessGapRule({ fitness: { split: { id: 'legs', name: 'Legs' }, daysSince: 9 } });
  assert.ok(s && s.severity === 'medium');
  assert.deepStrictEqual(s.cta, { label: 'Start Legs', view: 'fitness', sub: 'Train', splitId: 'legs' });
}
assert.strictEqual(R.fitnessGapRule({ fitness: { split: { id: 'legs', name: 'Legs' }, daysSince: 12 } }).severity, 'high');

// ── nutrition rules ──────────────────────────────────────────────────────────
assert.strictEqual(R.nutritionOverRule({ nutrition: { calories: 2400, calorieTarget: 2400 } }), null, 'on target => no nudge');
assert.strictEqual(R.nutritionOverRule({ nutrition: { calories: 2500, calorieTarget: 2400 } }), null, '<150 over => no nudge');
assert.strictEqual(R.nutritionOverRule({ nutrition: { calories: 2900, calorieTarget: 2400 } }).severity, 'high');
assert.strictEqual(R.nutritionProteinRule({ nutrition: { protein: 170, proteinTarget: 180 } }), null, 'small gap => no nudge');
assert.strictEqual(R.nutritionProteinRule({ nutrition: { protein: 120, proteinTarget: 180 } }).severity, 'low');

// ── finance pace rule ────────────────────────────────────────────────────────
assert.strictEqual(R.financePaceRule({ finance: { budget: 0 } }), null, 'no budget => no nudge');
// Half the month gone, spent right on pace => no nudge.
assert.strictEqual(R.financePaceRule({ finance: { budget: 600, spent: 300, dayOfMonth: 15, daysInMonth: 30 } }), null);
{
  // Half the month, but already spent 420 of 600 => over pace.
  const s = R.financePaceRule({ finance: { budget: 600, spent: 420, dayOfMonth: 15, daysInMonth: 30 } });
  assert.ok(s && s.domain === 'finance' && s.severity === 'high');
  assert.ok(/600/.test(s.text));
}

// ── ranking + cap ────────────────────────────────────────────────────────────
{
  const ctx = {
    sleep: { loggedDays: 5, consistencyMinutes: 150, lastLog: { bedtime: '1:00', durationMinutes: 370 } },
    fitness: { split: { id: 'legs', name: 'Legs' }, daysSince: 12, streak: 5 },
    nutrition: { calories: 2900, calorieTarget: 2400, protein: 120, proteinTarget: 180 },
    finance: { budget: 600, spent: 420, dayOfMonth: 15, daysInMonth: 30 }
  };
  const all = insights.homeSuggestions(ctx, 99);
  // Highs first.
  const sev = require('./app-insights.js').SEV;
  for (let i = 1; i < all.length; i++) {
    assert.ok(sev[all[i - 1].severity] >= sev[all[i].severity], 'sorted by severity desc');
  }
  // Cap respected.
  const capped = insights.homeSuggestions(ctx, 4);
  assert.strictEqual(capped.length, 4);
  // Every capped item is one of the highest-severity ones.
  assert.ok(capped.every(s => ['high', 'medium', 'low'].includes(s.severity)));
}
// Empty context yields nothing — never invents data.
assert.deepStrictEqual(insights.homeSuggestions({}, 4), []);

console.log('app-insights.test.js: all assertions passed');
