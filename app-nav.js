// app-nav.js — IronLog V4 two-tier navigation controller.
// Pure state/resolve/restore parts are unit-tested in app-nav.test.js.
// The DOM-side glue (calling render*, setting --acc, persisting DB) lives in
// the app and calls these pure helpers — no DOM access happens in this file.
(function (root) {
  'use strict';

  // Tier-1 domains shown in the bottom bar (Home is reached via the wordmark,
  // not a bottom-bar slot).
  var DOMAINS = ['fitness', 'nutrition', 'sleep', 'finance'];

  // Tier-2 sub-tabs per domain. Empty array => no sub-nav (Coming-Soon domains).
  var SUBS = {
    fitness: ['Home', 'Train', 'Progress', 'History'],
    nutrition: ['Today', 'Foods', 'Trends'],
    sleep: [],
    finance: []
  };

  // Per-domain accent CSS custom property. Home borrows the Fitness coral.
  var DOMAIN_ACCENT = {
    home: 'var(--fitness)',
    fitness: 'var(--fitness)',
    nutrition: 'var(--nutrition)',
    sleep: 'var(--sleep)',
    finance: 'var(--finance)'
  };

  function isDomain(view) {
    return DOMAINS.indexOf(view) !== -1;
  }

  // Default sub-tab for a domain (first entry, or '' when none).
  function defaultSub(view) {
    var subs = SUBS[view] || [];
    return subs.length ? subs[0] : '';
  }

  function defaultNavState() {
    return { view: 'home', sub: { fitness: 'Home', nutrition: 'Today' } };
  }

  // resolveScreen('home') -> 'home'
  // resolveScreen('fitness','Train') -> 'fitness:Train'
  // resolveScreen('sleep') -> 'sleep:' (Coming-Soon, no sub)
  function resolveScreen(view, sub) {
    if (view === 'home' || !view) return 'home';
    if (!isDomain(view)) return 'home';
    var subs = SUBS[view] || [];
    if (!subs.length) return view + ':';
    var chosen = subs.indexOf(sub) !== -1 ? sub : subs[0];
    return view + ':' + chosen;
  }

  function domainAccentVar(view) {
    return DOMAIN_ACCENT[view] || DOMAIN_ACCENT.home;
  }

  // A domain is Coming-Soon when it is explicitly disabled in settings.
  function isComingSoon(view, settings) {
    if (!isDomain(view)) return false;
    var enabled = settings && settings.domainsEnabled;
    if (!enabled) return false;
    return enabled[view] === false;
  }

  // Pure defaulting applied on load — never rewrites existing data.
  // Mutates and returns DB so it can slot into app-storage's normalize step.
  function normalizeNav(DB) {
    DB = DB || {};
    DB.app = DB.app || {};
    if (!DB.app.lastView) DB.app.lastView = 'home';
    if (!DB.app.lastSub) DB.app.lastSub = {};
    if (!DB.app.lastSub.fitness) DB.app.lastSub.fitness = 'Home';
    if (!DB.app.lastSub.nutrition) DB.app.lastSub.nutrition = 'Today';
    DB.settings = DB.settings || {};
    if (!DB.settings.domainsEnabled) {
      DB.settings.domainsEnabled = { fitness: true, nutrition: true, sleep: false, finance: false };
    }
    return DB;
  }

  // Build the live navState from a (possibly partial) persisted DB.
  function restore(DB) {
    var src = (DB && DB.app) || {};
    var view = src.lastView || 'home';
    if (view !== 'home' && !isDomain(view)) view = 'home';
    var savedSub = src.lastSub || {};
    var state = defaultNavState();
    state.view = view;
    // Carry forward any valid saved sub-tabs, falling back to defaults.
    Object.keys(SUBS).forEach(function (d) {
      var subs = SUBS[d];
      if (!subs.length) return;
      var s = savedSub[d];
      state.sub[d] = subs.indexOf(s) !== -1 ? s : defaultSub(d);
    });
    return state;
  }

  // Pure transition: move to a domain (or home). Returns a new state object.
  function setView(state, view) {
    var next = { view: state.view, sub: {} };
    Object.keys(state.sub).forEach(function (k) { next.sub[k] = state.sub[k]; });
    next.view = (view === 'home' || isDomain(view)) ? view : state.view;
    return next;
  }

  // Pure transition: set the active sub-tab for a domain. Ignores invalid subs.
  function setSubFor(state, view, sub) {
    var next = { view: state.view, sub: {} };
    Object.keys(state.sub).forEach(function (k) { next.sub[k] = state.sub[k]; });
    var subs = SUBS[view] || [];
    if (subs.indexOf(sub) !== -1) next.sub[view] = sub;
    return next;
  }

  // Project the live navState back into the DB persistence shape.
  function toPersisted(state) {
    return { lastView: state.view, lastSub: { fitness: state.sub.fitness, nutrition: state.sub.nutrition } };
  }

  var api = {
    DOMAINS: DOMAINS,
    SUBS: SUBS,
    DOMAIN_ACCENT: DOMAIN_ACCENT,
    isDomain: isDomain,
    defaultSub: defaultSub,
    defaultNavState: defaultNavState,
    resolveScreen: resolveScreen,
    domainAccentVar: domainAccentVar,
    isComingSoon: isComingSoon,
    normalizeNav: normalizeNav,
    restore: restore,
    setView: setView,
    setSubFor: setSubFor,
    toPersisted: toPersisted
  };

  root.IronLogNav = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
