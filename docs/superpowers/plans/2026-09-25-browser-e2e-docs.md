# Browser E2E and Project Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the project and deployment status documentation, and verify real browser workflows against a disposable Compose stack without touching the running application database.

**Architecture:** Make the existing E2E runner's three application URLs configurable while preserving localhost defaults. Add a dedicated Compose override for test-only captcha and AI settings, use a unique Compose project name and alternate host ports, and document the repeatable flow.

**Tech Stack:** Node.js built-in test runner, Playwright, Docker Compose, Spring Boot, Markdown.

---

### Task 1: Create an isolated implementation workspace

**Files:**
- No project files changed by workspace creation.

- [ ] **Step 1: Create the feature worktree from the plan commit**

Run from the repository root:

```powershell
git worktree add .worktrees/browser-e2e-docs -b docs/browser-e2e-docs
```

Expected: a new branch `docs/browser-e2e-docs` at the current plan commit; existing root working changes remain untouched.

- [ ] **Step 2: Confirm the worktree and ignored location**

Run:

```powershell
git check-ignore .worktrees
git -C .worktrees/browser-e2e-docs status --short
```

Expected: `.worktrees` is ignored and the new worktree has no uncommitted changes.

### Task 2: Add configurable E2E target URLs with tests

**Files:**
- Create: `tests/browser/e2e/config.cjs`
- Create: `tests/browser/e2e/config.test.cjs`
- Modify: `tests/browser/e2e/helpers.cjs`

- [ ] **Step 1: Write tests for default and overridden endpoints**

Create `tests/browser/e2e/config.test.cjs`:

```js
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
```

- [ ] **Step 2: Verify the endpoint tests fail before implementation**

Run: `node --test tests/browser/e2e/config.test.cjs`

Expected: failure because `config.cjs` does not exist yet.

- [ ] **Step 3: Implement the endpoint resolver and connect the helper**

Create `tests/browser/e2e/config.cjs`:

```js
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
```

In `tests/browser/e2e/helpers.cjs`, replace the three fixed URL declarations with:

```js
const { resolveEndpoints } = require('./config.cjs');
const { BACKEND, STUDENT_WEB, ADMIN_WEB } = resolveEndpoints();
```

- [ ] **Step 4: Verify the endpoint tests pass**

Run: `node --test tests/browser/e2e/config.test.cjs`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the E2E endpoint configuration**

```powershell
git add tests/browser/e2e/config.cjs tests/browser/e2e/config.test.cjs tests/browser/e2e/helpers.cjs
git commit -m "test: allow isolated browser e2e targets"
```

### Task 3: Add a test-only Compose override

**Files:**
- Create: `docker-compose.e2e.yml`

- [ ] **Step 1: Add the override without changing the default Compose stack**

Create `docker-compose.e2e.yml`:

```yaml
services:
  backend:
    environment:
      PLATFORM_CAPTCHA_ENABLED: "false"
      AI_API_KEY: ""
```

The base Compose file continues to control ports and project resources. Run it with project name `ai-campus-e2e` and alternate ports so all containers and named volumes receive an isolated project prefix.

- [ ] **Step 2: Validate Compose service resolution without printing secrets**

Run with the test environment variables assigned in the shell:

```powershell
docker compose -p ai-campus-e2e -f docker-compose.yml -f docker-compose.e2e.yml config --services
```

Expected: `mysql`, `redis`, `backend`, `student`, and `admin`; no rendered environment values are printed.

- [ ] **Step 3: Commit the isolated Compose override**

```powershell
git add docker-compose.e2e.yml
git commit -m "test: isolate browser e2e runtime settings"
```

### Task 4: Update project, deployment, and browser test documentation

**Files:**
- Modify: `README.md`
- Modify: `部署说明.md`
- Modify: `tests/browser/README.md`

- [ ] **Step 1: Correct the README project status and production-data warning**

Replace the stale “前端功能已完成，等待后端环境联调” banner with a concise statement that the student web app, admin app, and Spring Boot backend are integrated and Docker Compose deployment is available. State that AI provider calls require a configured key. In the Docker section and test account section, make clear that the automatic seed SQL is development/demo data, must not be used in production, and should be removed from the production Compose initialization mounts.

- [ ] **Step 2: Document isolated real-browser E2E commands**

In `tests/browser/README.md`, document the configurable URLs `E2E_BACKEND_URL`, `E2E_STUDENT_WEB_URL`, and `E2E_ADMIN_WEB_URL`, the isolated Compose file, required temporary environment variables, the test categories to run, and the project-scoped cleanup command. Note that category `15` is excluded because it calls an external AI provider. State that the project's main Compose services and database are not targets for this run.

- [ ] **Step 3: Align deployment guidance and link test details**

In `部署说明.md`, clarify that Docker's test-data SQL runs only on first initialization of a fresh named volume, distinguish `down` from project-scoped `down -v`, and link to `tests/browser/README.md` for isolated browser testing. Keep production instructions explicit: remove the seed SQL mount before first production initialization and never apply the reset/test-data script to an existing database.

- [ ] **Step 4: Review the documentation diff and commit it**

Run: `git diff --check`

Expected: no whitespace errors; all test URLs, project names, and commands agree across the three documents.

```powershell
git add README.md '部署说明.md' tests/browser/README.md
git commit -m "docs: clarify deployment and browser test workflow"
```

### Task 5: Run regression checks and isolated browser flows

**Files:**
- No additional source files changed.

- [ ] **Step 1: Run the endpoint resolver tests**

Run: `node --test tests/browser/e2e/config.test.cjs`

Expected: 2 tests pass.

- [ ] **Step 2: Launch only the isolated Compose project**

Set process-local values so this run gets a unique Compose project, random secrets, alternate ports, and matching test URLs. Use the default database name `ai_campus_platform`: `reset_and_testdata.sql` selects that database explicitly, while the unique Compose project gives MySQL its own isolated container and volume. The seeded test admin password is `admin123`. Then run:

```powershell
$e2eProject = "ai-campus-e2e-$([DateTime]::Now.ToString('yyyyMMddHHmmss'))"
$env:MYSQL_ROOT_PASSWORD = [guid]::NewGuid().ToString('N')
$env:MYSQL_DB = 'ai_campus_platform'
$env:REDIS_PASSWORD = [guid]::NewGuid().ToString('N')
$env:JWT_SECRET = [guid]::NewGuid().ToString('N')
$env:SIGNIN_SECRET = [guid]::NewGuid().ToString('N')
$env:AI_API_KEY = ''
$env:BACKEND_PORT = '18080'
$env:STUDENT_PORT = '15173'
$env:ADMIN_PORT = '15174'
$env:TRUSTED_ORIGINS = 'http://localhost,http://localhost:15173,http://localhost:15174,http://127.0.0.1:15173,http://127.0.0.1:15174'
$env:E2E_BACKEND_URL = 'http://localhost:18080'
$env:E2E_STUDENT_WEB_URL = 'http://localhost:15173'
$env:E2E_ADMIN_WEB_URL = 'http://localhost:15174'
$env:E2E_TEST_PASSWORD = ([guid]::NewGuid().ToString('N').Substring(0, 12) + 'Aa1!')
$env:E2E_ADMIN_PASSWORD = 'admin123'

docker compose -p $e2eProject -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
docker compose -p $e2eProject -f docker-compose.yml -f docker-compose.e2e.yml ps
```

Expected: only the new E2E project is started; MySQL, Redis, and backend are healthy, student/admin web containers are running, and the original `ai-campus` project remains up.

- [ ] **Step 3: Run real browser workflows, excluding external AI calls**

Run:

```powershell
$onlyCoreE2e = '01,02,03,04,05,06,07,08,09,10,11,12,13,14,16,17,18,19,20'
node tests/browser/e2e/run-all.cjs "--only=$onlyCoreE2e"
```

Expected: the runner writes its JSON result to the OS temporary directory and reports each category's actual PASS, FAIL, BLOCK, or UNCOVERED results. Category 15 is not run.

- [ ] **Step 4: Run the existing API-mocked browser regression scripts**

Run each script against the already-running student/admin pages:

```powershell
node tests/browser/system-interactions.cjs
node tests/browser/system-all-rooms.cjs
node tests/browser/system-auth.cjs
node tests/browser/system-admin.cjs
node tests/browser/system-scene-and-fallback.cjs
```

Expected: each script reports its own assertions; these scripts intercept API requests and do not write application data.

- [ ] **Step 5: Confirm the original stack is unchanged and remove only E2E resources**

Capture `docker compose ps` for both project names. Then stop and delete only the isolated E2E project's containers and volumes:

```powershell
docker compose -p $e2eProject -f docker-compose.yml -f docker-compose.e2e.yml down -v
```

Expected: the `ai-campus` services remain running; only resources prefixed for `ai-campus-e2e` are removed.

- [ ] **Step 6: Commit and integrate the implementation branch**

Commit test evidence only if it is a source artifact requested by the user; do not add passwords, `.env` files, screenshots, or raw logs. Merge the implementation commits back into `feat/v2-visual-upgrade` by fast-forward/cherry-pick while preserving the pre-existing `application.yml` edit and untracked files.
