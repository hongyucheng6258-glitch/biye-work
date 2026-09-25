const trimTrailingSlashes = (value, fallback) => {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return candidate ? candidate.replace(/\/+$/, '') : fallback;
};

function resolveEndpoints(env = process.env) {
  return {
    BACKEND: trimTrailingSlashes(env.E2E_BACKEND_URL, 'http://localhost:8080'),
    STUDENT_WEB: trimTrailingSlashes(env.E2E_STUDENT_WEB_URL, 'http://localhost:5173'),
    ADMIN_WEB: trimTrailingSlashes(env.E2E_ADMIN_WEB_URL, 'http://localhost:5174')
  };
}

module.exports = { resolveEndpoints };
