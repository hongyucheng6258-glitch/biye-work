import assert from 'node:assert/strict'
import test from 'node:test'
import { routeScroll } from '../web/frontend/student/src/ui/route-scroll.mjs'

test('new pages open at the top, including the first navigation', async () => {
  for (const [to, from] of [['/idle/detail/12', '/idle'], ['/profile', '/activity'], ['/message', undefined]]) {
    assert.deepEqual(await routeScroll({ path: to }, { path: from }), { left: 0, top: 0, behavior: 'instant' })
  }
})

test('browser history retains the saved reading position without mutating it', async () => {
  const saved = { left: 0, top: 710 }
  assert.deepEqual(await routeScroll({ path: '/idle' }, { path: '/idle/detail/12' }, saved), { ...saved, behavior: 'instant' })
  assert.deepEqual(saved, { left: 0, top: 710 })
})

test('same-page query changes retain the viewport', async () => {
  assert.equal(await routeScroll({ path: '/profile', query: { tab: 'idle' } }, { path: '/profile', query: { tab: 'activity' } }), false)
})

test('explicit anchors remain usable, with saved history taking priority', async () => {
  assert.deepEqual(await routeScroll({ path: '/notice/detail/1', hash: '#section' }, { path: '/notice' }), { el: '#section', behavior: 'instant' })
  assert.deepEqual(await routeScroll({ path: '/notice/detail/1', hash: '#section' }, { path: '/notice' }, { left: 0, top: 450 }), { left: 0, top: 450, behavior: 'instant' })
})

function fakeDocument() {
  const previous = Object.fromEntries(['document', 'window', 'ResizeObserver'].map(key => [key, globalThis[key]]))
  const observers = []
  globalThis.document = { documentElement: { scrollHeight: 300 }, body: {} }
  globalThis.window = { innerHeight: 500 }
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe() {}
    disconnect() { this.disconnected = true }
  }
  return {
    observers,
    restore() { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value } }
  }
}

test('history restoration waits until asynchronous content is tall enough', async () => {
  const dom = fakeDocument()
  try {
    const saved = { left: 0, top: 710 }
    let settled = false
    const pending = routeScroll({ path: '/idle' }, { path: '/idle/detail/12' }, saved).then(value => { settled = true; return value })
    await Promise.resolve()
    assert.equal(settled, false)
    document.documentElement.scrollHeight = 1800
    dom.observers[0].callback()
    assert.deepEqual(await pending, { ...saved, behavior: 'instant' })
    assert(dom.observers[0].disconnected)
  } finally { dom.restore() }
})

test('an older pending restoration cannot move a newer page', async () => {
  const dom = fakeDocument()
  try {
    const pending = routeScroll({ path: '/idle' }, { path: '/idle/detail/12' }, { left: 0, top: 710 })
    assert.deepEqual(await routeScroll({ path: '/message' }, { path: '/idle' }), { left: 0, top: 0, behavior: 'instant' })
    dom.observers[0].callback()
    assert.equal(await pending, false)
    assert(dom.observers[0].disconnected)
  } finally { dom.restore() }
})
