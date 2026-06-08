const assert = require('assert');
const fs = require('fs');

const sourceHtml = fs.readFileSync('IronLog v3.html', 'utf8');
const deployHtml = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

assert.strictEqual(deployHtml, sourceHtml, 'index.html must stay byte-identical to IronLog v3.html for release parity');

assert.ok(/const CACHE='ironlog-v2[4-9]'/.test(sw), 'service worker cache must be bumped for V4 runtime assets');
assert.ok(sw.includes("'./app-nav.js'"), 'service worker must cache app-nav.js');
assert.ok(sw.includes("'./app-insights.js'"), 'service worker must cache app-insights.js');

assert.ok(sourceHtml.includes('<script src="app-nav.js"></script>'), 'V4 source must load app-nav.js before app glue');
assert.ok(sourceHtml.includes('<script src="app-insights.js"></script>'), 'V4 source must load app-insights.js before app glue');
assert.ok(
  /navState\s*=\s*IronLogNav\.restore\(DB\)/.test(sourceHtml),
  'startup must restore persisted V4 nav state before rendering'
);
assert.ok(sourceHtml.includes('enterDomain(d){ navigate(d, navState.sub[d]); }'), 'domain tiles must route through V4 domain navigation');
assert.ok(sourceHtml.includes('if(typeof IronLogNav!==\'undefined\' && IronLogNav.isComingSoon(\'sleep\''), 'Sleep must be gated by Coming-Soon flag');
assert.ok(sourceHtml.includes('if(typeof IronLogNav!==\'undefined\' && IronLogNav.isComingSoon(\'finance\''), 'Finance must be gated by Coming-Soon flag');

assert.ok(sourceHtml.includes('function playMotion(target, cls'), 'animation helpers must expose replayable motion hooks');
assert.ok(sourceHtml.includes('.motion-save .toast-check'), 'save feedback must use the selected checkmark/pulse animation');
assert.ok(sourceHtml.includes('motion-domain'), 'domain navigation must trigger the selected accent morph');
assert.ok(sourceHtml.includes('motion-stagger'), 'home/today cards must use the selected staggered entrance');
assert.ok(sourceHtml.includes('dismissSuggestion('), 'focus suggestions must animate before being dismissed');
assert.ok(sourceHtml.includes('animationDelay'), 'nutrition macro bars must stagger-fill from rendered data');
assert.ok(sourceHtml.includes('function showSettingsDataSheet()'), 'settings must expose a dedicated import/export sheet page');
assert.ok(sourceHtml.includes('settings-footer'), 'settings must keep the import/export entry pinned at the bottom');
assert.ok(sourceHtml.includes('onclick="showSettingsDataSheet()">Import / Export</button>'), 'settings footer must open the import/export page');
assert.ok(sourceHtml.includes('function ensureDB(){if(!DB)DB=loadDB();return DB}'), 'settings/export must tolerate first-run clicks before onboarding creates DB');

console.log('v4-phase1-static tests passed');
