import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Keep the original freeze audit intact. This follow-up repairs document scrolling,
// so verify the two explicit presentation additions separately from business code.
const routerPath = 'web/frontend/student/src/router/index.js'
const modulePath = 'web/frontend/student/src/ui/route-scroll.mjs'
const original = spawnSync('git', ['show', `91214e0:${routerPath}`], { encoding: 'utf8', windowsHide: true })
assert.equal(original.status, 0)
const normalize = value => value.replaceAll('\r\n', '\n')
const expected = normalize(original.stdout)
  .replace("import { isLoggedIn } from '../utils/auth'\n", "import { isLoggedIn } from '../utils/auth'\nimport { routeScroll } from '../ui/route-scroll.mjs'\n")
  .replace('  routes\n', '  routes,\n  scrollBehavior: routeScroll\n')
assert.equal(normalize(readFileSync(routerPath, 'utf8')), expected, 'Routing/auth code changed beyond attaching the viewport policy')
const policy = readFileSync(modulePath, 'utf8')
assert(!/\b(?:localStorage|fetch|XMLHttpRequest|WebSocket|axios)\b/.test(policy), 'Viewport code must not access account/data/network state')
const audit = spawnSync(process.execPath, ['scripts/ui-contract-audit.mjs', 'check', '--rev', '91214e0'], { encoding: 'utf8', windowsHide: true })
assert.equal(audit.status, 1, 'The unchanged strict audit must report the presentation additions')
const errors = [...(audit.stdout + audit.stderr).matchAll(/^ERROR (.+)$/gm)].map(m => m[1]).sort()
assert.deepEqual(errors, [
  `${routerPath}: protected file changed (content suppressed)`,
  `${modulePath}: new file in protected business/config/test scope`
].sort(), 'Unexpected business contract change')
console.log('PASS: only the explicit document-scroll policy and its router attachment differ; remaining 505 protected files and all 83 Vue contracts retained. Original strict audit/baseline unchanged.')
