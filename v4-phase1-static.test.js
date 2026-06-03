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

console.log('v4-phase1-static tests passed');
