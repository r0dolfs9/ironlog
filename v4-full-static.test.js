const assert = require('assert');
const fs = require('fs');

const sourceHtml = fs.readFileSync('IronLog v3.html', 'utf8');
const deployHtml = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

assert.strictEqual(deployHtml, sourceHtml, 'index.html must stay byte-identical to IronLog v3.html');

assert.ok(!sourceHtml.includes('chart.umd.min.js'), 'V4 custom charts must remove the Chart.js CDN runtime');
assert.ok(!sourceHtml.includes('new Chart('), 'V4 custom charts must not instantiate Chart.js');
assert.ok(!sourceHtml.includes('<canvas id="pst3RadarCanvas"'), 'progress radar must render as SVG, not canvas');
assert.ok(!sourceHtml.includes('<canvas id="chA"'), 'progress line chart must render as SVG, not canvas');
assert.ok(!sourceHtml.includes('<canvas id="fcChart"'), 'fullscreen PR chart must render as SVG, not canvas');
assert.ok(sourceHtml.includes('function lineChartSVG('), 'V4 must include the reusable SVG line chart helper');
assert.ok(sourceHtml.includes('function radarChartSVG('), 'V4 must include the reusable SVG radar helper');

['Data', 'Appearance', 'Training', 'About'].forEach(section => {
  assert.ok(sourceHtml.includes(`data-settings-section="${section}"`), `Settings must include ${section} section`);
});
assert.ok(sourceHtml.includes('Google Drive backup'), 'Settings must expose the V4 cloud-backup slot');
assert.ok(sourceHtml.includes('Drive OAuth client ID required'), 'Cloud backup must make the OAuth blocker explicit');

assert.ok(!sw.includes('chart.umd.min.js'), 'service worker must stop caching Chart.js after custom SVG chart migration');
assert.ok(/const CACHE='ironlog-v24'/.test(sw), 'service worker cache must be bumped after full V4 assets change');

console.log('v4-full-static tests passed');
