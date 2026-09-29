import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const beforeQA = '7723374'
const normalize = text => text.replaceAll('\r\n','\n')
const git = args => {
  const result=spawnSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024})
  assert.equal(result.status,0,'Git comparison failed')
  return normalize(result.stdout)
}
const original = file => git(['show',`${beforeQA}:${file}`])
const current = file => normalize(readFileSync(file,'utf8'))
const script = text => [...text.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(match=>match[0]).join('\n')
const template = text => text.match(/<template>[\s\S]*?<\/template>\s*\n\s*<script/)[0]
const prefix='web/frontend/student/src/'
const replacements = new Map([
  [prefix+'views/profile/Profile.vue',[['  loadMyIdle()\n  if (tab.value',"  loadMyIdle()\n  if (tab.value === 'favorite') loadFavorites()\n  if (tab.value"]]],
  [prefix+'views/social/PostSquare.vue',[['async function sharePost(p)',"function toggleComments(p) {\n  expandedPostId.value = expandedPostId.value === p.id ? null : p.id\n}\nasync function sharePost(p)"]]],
  [prefix+'views/ai/ChatView.vue',[
    ['const asking = ref(false)', 'const asking = ref(false)\nconst sessionLoading = ref(false)'],
    ['  requestSeq += 1\n','  requestSeq += 1\n  asking.value = false\n  sessionLoading.value = false\n'],
    ['async function restorePdfDoc(session)', 'async function restorePdfDoc(session, seq)'],
    ['    pdfDoc.value = await aiApi.pdfDoc(session.docId)\n  } catch {\n    pdfDoc.value = null', '    const doc = await aiApi.pdfDoc(session.docId)\n    if (seq === requestSeq) pdfDoc.value = doc\n  } catch {\n    if (seq === requestSeq) pdfDoc.value = null'],
    [`  cancelStream()
  currentSession.value = s
  await restorePdfDoc(s)
  const res = await aiApi.listMessages(s.id, 1, 50)
  // 接口倒序返回，翻转为正序展示
  messages.value = (res.list || []).reverse().map((m) => ({
    role: m.role,
    content: m.content,
    streaming: false
  }))
  scrollBottom()`, `  cancelStream()
  const seq = requestSeq
  sessionLoading.value = true
  currentSession.value = s
  try {
    await restorePdfDoc(s, seq)
    if (seq !== requestSeq) return
    const res = await aiApi.listMessages(s.id, 1, 50)
    if (seq !== requestSeq) return
    // 接口倒序返回，翻转为正序展示
    messages.value = (res.list || []).reverse().map((m) => ({
      role: m.role,
      content: m.content,
      streaming: false
    }))
    scrollBottom()
  } finally {
    if (seq === requestSeq) sessionLoading.value = false
  }`],
    ['  if (!q || asking.value) return', '  if (!q || asking.value || sessionLoading.value) return']
  ]],
  [prefix+'views/ai/components/WrongOutlineDialog.vue',[['    result.value = res.answer','    result.value = typeof res === \'string\' ? res : res.answer']]],
  ['web/frontend/admin/src/views/user/UserList.vue',[
    ["import { onMounted, ref } from 'vue'","import { onMounted, ref, watch } from 'vue'\nimport { useRoute } from 'vue-router'"],
    ["const keyword = ref('')","const route = useRoute()\nconst keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')"],
    ['onMounted(load)','onMounted(load)\nwatch(() => route.query.q, (q) => {\n  keyword.value = typeof q === \'string\' ? q : \'\'\n  search()\n})']
  ]]
])
for(const [file,changes] of replacements) {
  let expected=script(original(file))
  for(const [from,to] of changes) {assert(expected.includes(from),`Missing known fix anchor: ${file}`);expected=expected.replace(from,to)}
  assert.equal(script(current(file)),expected,`Unexpected functional change: ${file}`)
  const expectedTemplate = file.endsWith('/ai/ChatView.vue')
    ? template(original(file)).replace(':disabled="!question.trim() || asking"', ':disabled="!question.trim() || asking || sessionLoading"')
    : template(original(file))
  assert.equal(template(current(file)),expectedTemplate,`Unexpected template change: ${file}`)
}
const activity=prefix+'views/activity/Detail.vue'
assert.equal(script(current(activity)),script(original(activity)))
assert.equal(template(current(activity)),template(original(activity)).replace('@click="loadMembers"','@click="loadMembers()"'))
for(const file of [prefix+'layout/MainLayout.vue',prefix+'views/chat/ChatRoom.vue']) {
  assert.equal(script(current(file)),script(original(file)),`Layout must not alter functionality: ${file}`)
  const expected = file.endsWith('MainLayout.vue')
    ? template(original(file)).replace('<div class="app">', '<div class="app" :class="{ \'conversation-shell\': route.path === \'/ai/chat\' || /^\\/chat\\/\\d+$/.test(route.path) }">')
    : template(original(file))
  assert.equal(template(current(file)),expected,`Unexpected layout control change: ${file}`)
}
const dto='web/backend/src/main/java/com/campus/platform/module/admin/dto/AdminSaveDTO.java'
assert.equal(current(dto),original(dto).replace('    @NotBlank(message = "密码不能为空")','    // 新增的非空校验由 createAdmin 执行；编辑留空时保留原密码。'))

const additions=[
  'tests/browser/ui-fix-layout.cjs','tests/browser/ui-qa-fix-regression.cjs','tests/ui/sfc-harness.mjs',
  'web/backend/src/test/java/com/campus/platform/module/admin/AdminPasswordEditTest.java',
  'web/frontend/admin/src/views/user/UserSearch.test.mjs',prefix+'utils/browser-qa-regressions.test.mjs'
]
const allowed=new Set([...replacements.keys(),activity,prefix+'layout/MainLayout.vue',prefix+'views/chat/ChatRoom.vue',dto,...additions,'scripts/verify-qa-fixes-compatibility.mjs'])
const changed = new Set([...git(['diff','--name-only',beforeQA]).split('\n'),...git(['ls-files','--others','--exclude-standard']).split('\n')].filter(Boolean))
for(const file of changed) assert(file.startsWith('docs/ui-redesign/')||allowed.has(file),`Out-of-scope change: ${file}`)

// The trusted freeze baseline is NOT updated. Its expected errors are explicit;
// an additional request/store/API/permission change must still fail this check.
const audit=spawnSync(process.execPath,['scripts/ui-contract-audit.mjs','check','--rev','91214e0'],{encoding:'utf8',windowsHide:true})
assert.equal(audit.status,1,'Original freeze must continue to report authorized fixes')
const expectedErrors=[
  dto+': protected file changed (content suppressed)',
  ...[...replacements.keys(),prefix+'views/search/SearchResults.vue'].map(file=>file+': script blocks changed (including script attributes/order)'),
  activity+': nodes missing/changed: ["button",[["@click","loadMembers"],["type","button"]]] (expected 1, found 0)',
  prefix+'views/ai/ChatView.vue: nodes missing/changed: ["button",[[":disabled","!question.trim() || asking"],["@click","send"]]] (expected 1, found 0)',
  prefix+'router/index.js: protected file changed (content suppressed)',
  ...[...additions,prefix+'ui/route-scroll.mjs'].map(file=>file+': new file in protected business/config/test scope')
].sort()
const errors=[...(audit.stdout+audit.stderr).matchAll(/^ERROR (.+)$/gm)].map(match=>match[1]).sort()
assert.deepEqual(errors,expectedErrors,'Unexpected protected file or removed functional binding')
console.log('PASS: only B01–B08 fixes and their tests changed; API/store/routes/permissions/service logic unchanged. Original freeze baseline and audit retained with 17 explicit expected errors.')
