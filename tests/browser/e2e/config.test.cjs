const assert = require('node:assert/strict');
const { test } = require('node:test');
const { resolveEndpoints } = require('./config.cjs');

test('uses the existing localhost addresses by default', () => {
  assert.deepEqual(resolveEndpoints({}), {
    BACKEND: 'http://localhost:8080',
    STUDENT_WEB: 'http://localhost:5173',
    ADMIN_WEB: 'http://localhost:5174'
  });
});

test('allows an isolated browser environment to override every address', () => {
  assert.deepEqual(resolveEndpoints({
    E2E_BACKEND_URL: 'http://localhost:18080/',
    E2E_STUDENT_WEB_URL: 'http://localhost:15173/',
    E2E_ADMIN_WEB_URL: 'http://localhost:15174/'
  }), {
    BACKEND: 'http://localhost:18080',
    STUDENT_WEB: 'http://localhost:15173',
    ADMIN_WEB: 'http://localhost:15174'
  });
});
