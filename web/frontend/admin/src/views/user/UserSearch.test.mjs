import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { setupSfc } from '../../../../../../tests/ui/sfc-harness.mjs'
const require = createRequire(new URL('../../../../student/package.json', import.meta.url))
const { reactive } = require('vue')

test('B05: global search filters the initial route and subsequent same-page searches', async t => {
  const route = reactive({ query: { q: '2021001' } })
  const sfc = setupSfc('web/frontend/admin/src/views/user/UserList.vue', {
    useRoute: () => route,
    listUsers: async params => ({ list: [{ studentNo: params.keyword }], total: 1 })
  })
  t.after(() => sfc.dispose())
  await sfc.mount()
  assert.equal(sfc.state.keyword.value, '2021001')
  assert.equal(sfc.state.list.value[0].studentNo, '2021001')
  sfc.state.pageNum.value = 3
  route.query = { q: '2021002' }
  await sfc.flush()
  await sfc.flush()
  assert.equal(sfc.state.pageNum.value, 1)
  assert.equal(sfc.state.keyword.value, '2021002')
  assert.equal(sfc.state.list.value[0].studentNo, '2021002')
  sfc.state.keyword.value = 'manual input'
  sfc.state.search()
  await sfc.flush()
  await sfc.flush()
  assert.equal(sfc.state.list.value[0].studentNo, 'manual input')
  route.query = {}
  await sfc.flush()
  await sfc.flush()
  assert.equal(sfc.state.keyword.value, '')
})
