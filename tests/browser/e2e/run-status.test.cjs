const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getExitCode } = require('./run-status.cjs');

test('returns zero when all executed checks pass', () => {
  assert.equal(getExitCode([{ status: 'PASS' }]), 0);
});

test('returns zero for documented uncovered checks without failures', () => {
  assert.equal(getExitCode([{ status: 'UNCOVERED' }]), 0);
});

test('returns non-zero when any check fails or is blocked', () => {
  assert.equal(getExitCode([{ status: 'FAIL' }]), 1);
  assert.equal(getExitCode([{ status: 'BLOCK' }]), 1);
});

test('returns non-zero when a test category throws before recording a result', () => {
  assert.equal(getExitCode([], true), 1);
});
