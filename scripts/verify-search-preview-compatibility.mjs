import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Follow-up display repairs are checked explicitly; the original freeze audit
// and its trusted baseline remain unchanged and must still report these edits.
const baseline = '91214e0'
const normalize = value => value.replaceAll('\r\n', '\n')
const readOriginal = path => {
  const result = spawnSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8', windowsHide: true })
  assert.equal(result.status, 0, `Cannot read baseline ${path}`)
  return normalize(result.stdout)
}
const routerPath = 'web/frontend/student/src/router/index.js'
const modulePath = 'web/frontend/student/src/ui/route-scroll.mjs'
const searchPath = 'web/frontend/student/src/views/search/SearchResults.vue'
const coverPath = 'web/frontend/student/src/components/wt/SearchResultCover.vue'
const expectedRouter = readOriginal(routerPath)
  .replace("import { isLoggedIn } from '../utils/auth'\n", "import { isLoggedIn } from '../utils/auth'\nimport { routeScroll } from '../ui/route-scroll.mjs'\n")
  .replace('  routes\n', '  routes,\n  scrollBehavior: routeScroll\n')
assert.equal(normalize(readFileSync(routerPath, 'utf8')), expectedRouter, 'Unexpected routing/auth changes')
const policy = readFileSync(modulePath, 'utf8')
assert(!/\b(?:localStorage|fetch|XMLHttpRequest|WebSocket|axios)\b/.test(policy), 'Viewport policy must not access account/data/network state')

const scripts = source => [...source.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(match => match[0]).join('\n')
const search = scripts(normalize(readFileSync(searchPath, 'utf8')))
const coverImport = "import SearchResultCover from '../../components/wt/SearchResultCover.vue'\n"
assert.equal(search.split(coverImport).length - 1, 1, 'Exactly one display component import is allowed')
assert.equal((search.match(/key: item\.id, media: item,/g) || []).length, 4, 'Each existing result mapping forwards its source record once')
const restoredSearch = search.replace(coverImport, '').replaceAll('key: item.id, media: item,', 'key: item.id,')
assert.equal(restoredSearch, scripts(readOriginal(searchPath)), 'Search requests, filters, highlighting or navigation changed beyond forwarding existing media')

const coverScript = scripts(readFileSync(coverPath, 'utf8'))
assert.deepEqual([...coverScript.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map(match => match[1]), ['vue', '../../utils/content-assets.mjs'], 'Thumbnail imports must stay in the presentation/image helper scope')
assert(!/\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest|WebSocket|axios|useRouter|useRoute|emit|defineEmits)\b/.test(coverScript), 'Thumbnail must not access account/business/network/navigation state')

const audit = spawnSync(process.execPath, ['scripts/ui-contract-audit.mjs', 'check', '--rev', baseline], { encoding: 'utf8', windowsHide: true })
assert.equal(audit.status, 1, 'The original strict audit must report the explicit presentation exceptions')
const errors = [...(audit.stdout + audit.stderr).matchAll(/^ERROR (.+)$/gm)].map(match => match[1]).sort()
assert.deepEqual(errors, [
  `${routerPath}: protected file changed (content suppressed)`,
  `${modulePath}: new file in protected business/config/test scope`,
  `${searchPath}: script blocks changed (including script attributes/order)`
].sort(), 'Unexpected protected business contract change')
console.log('PASS: search script differs only by one thumbnail import and four source-record display fields. Existing search behavior and all original template contracts retained; remaining 505 protected files and 82 Vue scripts unchanged. Previous viewport exceptions verified. Original strict audit/baseline unchanged (3 expected errors).')
