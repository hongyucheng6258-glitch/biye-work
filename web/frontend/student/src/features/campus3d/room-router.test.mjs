import test from 'node:test'
import assert from 'node:assert/strict'
import { createRoomRouter, SERVICE_PATHS } from './room-router.mjs'

const page = { render() {} }
const records = [{ path: '/', children: [
  { path: '', component: page, meta: { public: true } },
  ...Object.values(SERVICE_PATHS).filter(path => path !== '/').map(path => ({ path: path.slice(1), component: page, meta: { public: true } })),
  { path: 'activity/detail/:id', component: page, meta: { public: true } },
  { path: 'activity/publish', component: page },
  { path: 'chat/:conversationId', component: page }
] }, { path: '/login', component: page, meta: { public: true } }]
const tick = () => new Promise(resolve => setTimeout(resolve, 20))

test('all rooms reuse the student component records', async () => {
  for (const id of Object.keys(SERVICE_PATHS)) {
    const router = createRoomRouter(records, id, () => true)
    await router.replace(SERVICE_PATHS[id])
    assert.equal(router.currentRoute.value.matched[0].components.default, page)
  }
})
test('detail and private chat remain in room history and back preserves the detail target', async () => {
  const router = createRoomRouter(records, 'activity', () => true)
  await router.replace('/activity')
  await router.push('/activity/detail/42')
  await router.push('/chat/8')
  router.back(); await tick()
  assert.equal(router.currentRoute.value.fullPath, '/activity/detail/42')
  router.back(); await tick()
  assert.equal(router.currentRoute.value.fullPath, '/activity')
  router.back(); await tick()
  assert.equal(router.currentRoute.value.fullPath, '/activity')
})
test('unauthenticated publishing retains its return target', async () => {
  const router = createRoomRouter(records, 'activity', () => false)
  await router.push('/activity/publish')
  assert.equal(router.currentRoute.value.path, '/login')
  assert.equal(router.currentRoute.value.query.redirect, '/activity/publish')
})
