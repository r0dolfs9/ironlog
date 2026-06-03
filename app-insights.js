// app-insights.js — IronLog V4 Today-hub suggestion engine.
// Pure functions, fully unit-tested in app-insights.test.js.
//
// The app assembles a plain `ctx` snapshot from its existing summary helpers
// (sleepWeeklySummary, financeMonthSummary, leastRecentSplitSuggestion,
// nutritionTotals/target) and passes it here — so the ranking rules stay pure
// and never duplicate the domain math. Every rule is guarded: it emits nothing
// when the data it needs is absent.
(function (root) {
  'use strict';

  // Severity drives ordering (higher = more urgent). Kept small + explicit.
  var SEV = { high: 3, medium: 2, low: 1 };

  function hhmm(totalMinutes) {
    var m = ((totalMinutes % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60);
    var mm = m % 60;
    return h + ':' + (mm < 10 ? '0' + mm : '' + mm);
  }

  // ── individual rules ─────────────────────────────────────────────────────
  // Each returns a suggestion object or null.

  function sleepDurationRule(ctx) {
    var s = ctx && ctx.sleep;
    if (!s || s.loggedDays === 0 || !s.lastLog) return null;
    var dur = Number(s.lastLog.durationMinutes) || 0;
    var targetMin = (s.targetMinutes != null ? s.targetMinutes : 420); // ~7h
    if (dur === 0 || dur >= targetMin) return null;
    return {
      domain: 'sleep',
      severity: 'high',
      icon: 'sleep',
      text: 'You went to bed at ' + (s.lastLog.bedtime || '—') + ' and slept ' +
        hhmm(dur) + '. Aim for lights-out by ' + hhmm(targetMin === 420 ? 1440 : targetMin) +
        ' tonight to clear the deficit.'
    };
  }

  function sleepConsistencyRule(ctx) {
    var s = ctx && ctx.sleep;
    if (!s || s.loggedDays < 3) return null;
    // > 90 min spread in bedtimes across the week = inconsistent.
    if ((Number(s.consistencyMinutes) || 0) <= 90) return null;
    return {
      domain: 'sleep',
      severity: 'medium',
      icon: 'sleep',
      text: 'Your bedtime is drifting across the week — pick a fixed lights-out and stick to it.'
    };
  }

  function fitnessGapRule(ctx) {
    var f = ctx && ctx.fitness;
    if (!f || !f.split) return null;
    var days = f.daysSince;
    if (days == null || days < 7) return null;
    return {
      domain: 'fitness',
      severity: days >= 10 ? 'high' : 'medium',
      icon: 'fitness',
      text: "You haven't trained " + f.split.name + ' in ' + days +
        ' days — your longest gap. Slot it in to keep your split balanced.',
      cta: { label: 'Start ' + f.split.name, view: 'fitness', sub: 'Train', splitId: f.split.id }
    };
  }

  function nutritionOverRule(ctx) {
    var n = ctx && ctx.nutrition;
    if (!n || !n.calorieTarget) return null;
    var over = (Number(n.calories) || 0) - n.calorieTarget;
    if (over < 150) return null; // small overshoot isn't worth a nudge
    return {
      domain: 'nutrition',
      severity: over >= 400 ? 'high' : 'medium',
      icon: 'nutrition',
      text: 'You ran +' + Math.round(over) + ' kcal over target. Trim ~' +
        Math.round(over) + ' today to stay on your cut.'
    };
  }

  function nutritionProteinRule(ctx) {
    var n = ctx && ctx.nutrition;
    if (!n || !n.proteinTarget) return null;
    var gap = n.proteinTarget - (Number(n.protein) || 0);
    if (gap < 25) return null;
    return {
      domain: 'nutrition',
      severity: 'low',
      icon: 'nutrition',
      text: 'Low on protein — add ~' + Math.round(gap) + 'g today to hit your target.'
    };
  }

  function financePaceRule(ctx) {
    var fin = ctx && ctx.finance;
    if (!fin || !fin.budget || fin.budget <= 0) return null;
    var pace = fin.dayOfMonth && fin.daysInMonth ? fin.dayOfMonth / fin.daysInMonth : null;
    if (pace == null) return null;
    var expectedSoFar = fin.budget * pace;
    if ((Number(fin.spent) || 0) <= expectedSoFar * 1.1) return null; // within 10% of pace
    var overPct = Math.round(((fin.spent - expectedSoFar) / fin.budget) * 100);
    return {
      domain: 'finance',
      severity: overPct >= 20 ? 'high' : 'medium',
      icon: 'finance',
      text: "You're " + overPct + '% over budget pace this month. Ease off spending this week to land under €' +
        Math.round(fin.budget) + '.'
    };
  }

  function positiveRule(ctx) {
    var f = ctx && ctx.fitness;
    if (!f || !f.streak || f.streak < 3) return null;
    return {
      domain: 'fitness',
      severity: 'low',
      icon: 'fitness',
      text: f.streak + '-day streak going — nice work. Keep the momentum.'
    };
  }

  var RULES = [
    sleepDurationRule,
    sleepConsistencyRule,
    fitnessGapRule,
    nutritionOverRule,
    nutritionProteinRule,
    financePaceRule,
    positiveRule
  ];

  // Returns up to `cap` suggestions sorted by severity (desc), stable within tie.
  function homeSuggestions(ctx, cap) {
    cap = cap || 4;
    var out = [];
    for (var i = 0; i < RULES.length; i++) {
      var r = RULES[i](ctx || {});
      if (r) out.push(r);
    }
    out.sort(function (a, b) { return (SEV[b.severity] || 0) - (SEV[a.severity] || 0); });
    return out.slice(0, cap);
  }

  var api = {
    SEV: SEV,
    hhmm: hhmm,
    homeSuggestions: homeSuggestions,
    // exported for targeted unit tests
    _rules: {
      sleepDurationRule: sleepDurationRule,
      sleepConsistencyRule: sleepConsistencyRule,
      fitnessGapRule: fitnessGapRule,
      nutritionOverRule: nutritionOverRule,
      nutritionProteinRule: nutritionProteinRule,
      financePaceRule: financePaceRule,
      positiveRule: positiveRule
    }
  };

  root.IronLogInsights = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
