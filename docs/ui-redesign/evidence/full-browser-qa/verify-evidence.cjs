const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = __dirname;
const report = JSON.parse(fs.readFileSync(path.join(root, 'results.json'), 'utf8'));
assert.equal(report.summary.confirmedIssues, report.findings.length);
assert.equal(report.summary.attempts, report.checks.length);
assert.equal(report.summary.uniqueNamedScenarios, report.scenarios.length);
assert.equal(report.summary.signoff, 'NOT_PASSED');
assert.deepEqual(report.summary.scenarioCounts, { PASS: 181, FAIL: 10, BLOCKED: 1 });
assert.equal(new Set(report.findings.map(item => item.id)).size, 8);
for (const item of report.findings) {
  for (const file of [item.evidence, ...(item.moreEvidence || [])]) {
    assert(fs.existsSync(path.join(root, file)), `Missing defect evidence: ${file}`);
  }
}
for (const item of report.visual) {
  assert(fs.existsSync(path.join(root, item.shot)), `Missing viewport screenshot: ${item.shot}`);
}
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'inventory.json'), 'utf8'));
assert.equal(inventory.areas.length, 78);
assert(!inventory.areas.some(item => item.status === 'PENDING'));
const markdownPath = path.resolve(root, '../../full-browser-qa-report.md');
const markdown = fs.readFileSync(markdownPath, 'utf8');
for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
  if (/^[a-z]+:\/\//i.test(match[1])) continue;
  assert(fs.existsSync(path.resolve(path.dirname(markdownPath), match[1])), `Missing report link: ${match[1]}`);
}
console.log(`Verified ${report.checks.length} attempts, ${report.scenarios.length} scenarios, 8 issues, 78 areas and ${report.visual.length} screenshot records. Product signoff: NOT_PASSED.`);
