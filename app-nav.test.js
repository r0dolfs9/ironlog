const assert = require('assert');

const nav = require('./app-nav.js');

// ── resolveScreen ──────────────────────────────────────────────────────────
assert.strictEqual(nav.resolveScreen('home'), 'home');
assert.strictEqual(nav.resolveScreen(), 'home');
assert.strictEqual(nav.resolveScreen('fitness', 'Train'), 'fitness:Train');
assert.strictEqual(nav.resolveScreen('nutrition', 'Foods'), 'nutrition:Foods');
// Unknown sub falls back to the domain's first sub.
assert.strictEqual(nav.resolveScreen('fitness', 'Bogus'), 'fitness:Home');
assert.strictEqual(nav.resolveScreen('nutrition'), 'nutrition:Today');
// Coming-Soon domains have no sub.
assert.strictEqual(nav.resolveScreen('sleep'), 'sleep:');
assert.strictEqual(nav.resolveScreen('finance', 'whatever'), 'finance:');
// Unknown view collapses to home.
assert.strictEqual(nav.resolveScreen('mystery'), 'home');

// ── domainAccentVar ─────────────────────────────────────────────────────────
assert.strictEqual(nav.domainAccentVar('home'), 'var(--fitness)');
assert.strictEqual(nav.domainAccentVar('fitness'), 'var(--fitness)');
assert.strictEqual(nav.domainAccentVar('nutrition'), 'var(--nutrition)');
assert.strictEqual(nav.domainAccentVar('sleep'), 'var(--sleep)');
assert.strictEqual(nav.domainAccentVar('finance'), 'var(--finance)');
assert.strictEqual(nav.domainAccentVar('???'), 'var(--fitness)');

// ── isComingSoon ────────────────────────────────────────────────────────────
const settings = { domainsEnabled: { fitness: true, nutrition: true, sleep: false, finance: false } };
assert.strictEqual(nav.isComingSoon('sleep', settings), true);
assert.strictEqual(nav.isComingSoon('finance', settings), true);
assert.strictEqual(nav.isComingSoon('fitness', settings), false);
assert.strictEqual(nav.isComingSoon('nutrition', settings), false);
// No settings => nothing is Coming-Soon (don't hide data without an explicit flag).
assert.strictEqual(nav.isComingSoon('sleep', undefined), false);
assert.strictEqual(nav.isComingSoon('sleep', {}), false);
// Flipping the flag restores the real domain.
assert.strictEqual(nav.isComingSoon('sleep', { domainsEnabled: { sleep: true } }), false);
// Home/unknown is never Coming-Soon.
assert.strictEqual(nav.isComingSoon('home', settings), false);

// ── normalizeNav (pure defaulting, no data rewrite) ──────────────────────────
{
  const fresh = nav.normalizeNav({});
  assert.strictEqual(fresh.app.lastView, 'home');
  assert.strictEqual(fresh.app.lastSub.fitness, 'Home');
  assert.strictEqual(fresh.app.lastSub.nutrition, 'Today');
  assert.deepStrictEqual(fresh.settings.domainsEnabled, { fitness: true, nutrition: true, sleep: false, finance: false });
}
{
  // Existing values must be preserved untouched.
  const existing = { app: { lastView: 'nutrition', lastSub: { fitness: 'Progress', nutrition: 'Trends' } }, settings: { domainsEnabled: { fitness: true, nutrition: true, sleep: true, finance: false } } };
  const out = nav.normalizeNav(existing);
  assert.strictEqual(out.app.lastView, 'nutrition');
  assert.strictEqual(out.app.lastSub.fitness, 'Progress');
  assert.strictEqual(out.settings.domainsEnabled.sleep, true);
}
{
  // Undefined DB must not throw.
  const out = nav.normalizeNav(undefined);
  assert.strictEqual(out.app.lastView, 'home');
}

// ── restore ──────────────────────────────────────────────────────────────────
{
  const state = nav.restore({ app: { lastView: 'fitness', lastSub: { fitness: 'History', nutrition: 'Foods' } } });
  assert.strictEqual(state.view, 'fitness');
  assert.strictEqual(state.sub.fitness, 'History');
  assert.strictEqual(state.sub.nutrition, 'Foods');
}
{
  // Invalid persisted view collapses to home; invalid subs fall back to defaults.
  const state = nav.restore({ app: { lastView: 'wat', lastSub: { fitness: 'Nope' } } });
  assert.strictEqual(state.view, 'home');
  assert.strictEqual(state.sub.fitness, 'Home');
  assert.strictEqual(state.sub.nutrition, 'Today');
}
{
  // Empty DB yields the default state.
  const state = nav.restore({});
  assert.deepStrictEqual(state, nav.defaultNavState());
}

// ── setView / setSubFor (immutable transitions) ──────────────────────────────
{
  const s0 = nav.defaultNavState();
  const s1 = nav.setView(s0, 'nutrition');
  assert.strictEqual(s1.view, 'nutrition');
  assert.strictEqual(s0.view, 'home', 'setView must not mutate the input state');

  const s2 = nav.setView(s1, 'bogus');
  assert.strictEqual(s2.view, 'nutrition', 'invalid view is ignored');

  const s3 = nav.setView(s1, 'home');
  assert.strictEqual(s3.view, 'home');

  const s4 = nav.setSubFor(s0, 'fitness', 'Progress');
  assert.strictEqual(s4.sub.fitness, 'Progress');
  assert.strictEqual(s0.sub.fitness, 'Home', 'setSubFor must not mutate the input state');

  const s5 = nav.setSubFor(s0, 'fitness', 'Invalid');
  assert.strictEqual(s5.sub.fitness, 'Home', 'invalid sub is ignored');

  const s6 = nav.setSubFor(s0, 'sleep', 'anything');
  assert.deepStrictEqual(s6.sub, s0.sub, 'sub-less domains accept no sub');
}

// ── toPersisted ───────────────────────────────────────────────────────────────
{
  const state = { view: 'fitness', sub: { fitness: 'Train', nutrition: 'Trends' } };
  assert.deepStrictEqual(nav.toPersisted(state), { lastView: 'fitness', lastSub: { fitness: 'Train', nutrition: 'Trends' } });
}

console.log('app-nav.test.js: all assertions passed');
