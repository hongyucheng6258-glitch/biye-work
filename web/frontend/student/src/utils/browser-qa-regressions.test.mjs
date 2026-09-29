import test from 'node:test'
import assert from 'node:assert/strict'
import { setupSfc } from '../../../../../tests/ui/sfc-harness.mjs'

const base = 'web/frontend/student/src/views/'
const route = (query = {}) => ({ query, params: { id: '7' } })
const user = () => ({ userInfo: { id: 1, nickname: 'QA' }, isLoggedIn: true, async refresh() {} })

test('B01: favorite deep link loads saved records on initial mount', async t => {
  const sfc = setupSfc(base + 'profile/Profile.vue', {
    useRoute: () => route({ tab: 'favorite' }), useUserStore: user,
    fetchMyIdle: async () => ({ list: [] }), wrongStats: async () => ({}), listConversations: async () => [],
    myFavorites: async () => ({ list: [{ targetId: 8, title: 'Saved item' }] })
  })
  t.after(() => sfc.dispose())
  await sfc.mount()
  assert.equal(sfc.state.myFavList.value[0]?.title, 'Saved item')
})

test('B02: actual comment click opens, repeats close, hot-post entry still opens', async t => {
  const sfc = setupSfc(base + 'social/PostSquare.vue', { useRoute: () => route(), useUserStore: user })
  t.after(() => sfc.dispose())
  sfc.state.p = { id: 5 }
  const source = sfc.template.match(/<span class="op" @click="toggleComments\(p\)">[\s\S]*?<\/span>/)[0]
  await sfc.render(source).props.onClick({ type: 'click' })
  assert.equal(sfc.state.expandedPostId.value, 5)
  await sfc.render(source).props.onClick({ type: 'click' })
  assert.equal(sfc.state.expandedPostId.value, null)
  sfc.state.openPost({ id: 6 })
  assert.equal(sfc.state.expandedPostId.value, 6)
})

test('B03: actual member button passes a numeric page rather than PointerEvent', async t => {
  const sfc = setupSfc(base + 'activity/Detail.vue', {
    useRoute: () => route(), useUserStore: user,
    activityMembers: async (id, params) => {
      assert.equal(id, 7)
      assert.equal(params.pageNum, 1)
      return { list: [{ id: 2 }], total: 1 }
    }
  })
  t.after(() => sfc.dispose())
  const source = sfc.template.match(/<button[^>]*@click="loadMembers[^"]*"[^>]*>报名名单管理<\/button>/)[0]
  await sfc.render(source).props.onClick({ type: 'click', toString: () => '[object PointerEvent]' })
  assert.equal(sfc.state.membersVisible.value, true)
  assert.equal(sfc.state.members.value[0].id, 2)
})

for (const [label, response] of [['string', '# Review outline\nRevise derivatives'], ['object', { answer: '# Review outline\nRevise derivatives' }]]) {
  test(`B06: outline renders the ${label} API response`, async t => {
    const sfc = setupSfc(base + 'ai/components/WrongOutlineDialog.vue', { generateOutline: async () => response }, { modelValue: false, autoMode: '', selectedIds: [] })
    t.after(() => sfc.dispose())
    await sfc.state.run({ mode: 'all' })
    assert.equal(sfc.state.result.value, '# Review outline\nRevise derivatives')
    assert.equal(sfc.state.loading.value, false)
  })
}

test('B07: cancellation unlocks sending and late callbacks cannot change the next request', async t => {
  const streams = []
  const sfc = setupSfc(base + 'ai/ChatView.vue', {
    useRoute: () => route(), useUserStore: user,
    aiApi: { chatStream: (payload, handlers, options) => new Promise(resolve => streams.push({ handlers, options, resolve })), listSessions: async () => [] }
  })
  t.after(() => sfc.dispose())
  sfc.state.question.value = 'First request'
  const first = sfc.state.send()
  assert.equal(sfc.state.asking.value, true)
  sfc.state.cancelStream()
  assert.equal(streams[0].options.signal.aborted, true)
  assert.equal(sfc.state.asking.value, false)
  sfc.state.messages.value = []
  sfc.state.question.value = 'Next request'
  const second = sfc.state.send()
  assert.equal(streams.length, 2)
  streams[0].handlers.onDelta('obsolete answer')
  streams[0].handlers.onDone()
  streams[0].resolve()
  await first
  assert.equal(sfc.state.asking.value, true)
  assert.equal(sfc.state.messages.value[1].content, '')
  streams[1].handlers.onDelta('current answer')
  streams[1].handlers.onDone()
  streams[1].resolve()
  await second
  assert.equal(sfc.state.messages.value[1].content, 'current answer')
  assert.equal(sfc.state.asking.value, false)
})

test('B07: switching scene during a request enables the new scene immediately', async t => {
  let finish
  const sfc = setupSfc(base + 'ai/ChatView.vue', {
    useRoute: () => route(), useUserStore: user,
    aiApi: { chatStream: () => new Promise(resolve => { finish = resolve }), aiGuideAsk: async () => 'Campus guide answer', listSessions: async () => [] }
  })
  t.after(() => sfc.dispose())
  sfc.state.question.value = 'Pending chat'
  const old = sfc.state.send()
  sfc.state.tab.value = 'guide'
  await sfc.flush()
  sfc.state.question.value = 'Guide question'
  await sfc.state.send()
  assert.equal(sfc.state.messages.value[1]?.content, 'Campus guide answer')
  finish()
  await old
})

test('B07: a pending session history load cannot replace a newly sent question', async t => {
  let finishHistory
  const requests = []
  const sfc = setupSfc(base + 'ai/ChatView.vue', {
    useRoute: () => route(), useUserStore: user,
    aiApi: {
      listMessages: () => new Promise(resolve => { finishHistory = resolve }),
      chatStream: async (payload, handlers) => { requests.push(payload); handlers.onDelta('New answer'); handlers.onDone() },
      listSessions: async () => [{ id: 2 }]
    }
  })
  t.after(() => sfc.dispose())
  const switching = sfc.state.switchSession({ id: 2 })
  await sfc.flush()
  sfc.state.question.value = 'New question'
  await sfc.state.send()
  assert.equal(requests.length, 0, 'Sending must wait for session history')
  finishHistory({ list: [{ role: 'user', content: 'History' }] })
  await switching
  await sfc.state.send()
  assert.equal(requests.length, 1)
  assert.deepEqual(Array.from(sfc.state.messages.value, m => m.content), ['History', 'New question', 'New answer'])
})

test('B07: late history from an abandoned session never replaces the new scene', async t => {
  let finishHistory
  const sfc = setupSfc(base + 'ai/ChatView.vue', {
    useRoute: () => route(), useUserStore: user,
    aiApi: {
      listMessages: () => new Promise(resolve => { finishHistory = resolve }),
      aiGuideAsk: async () => 'Current guide answer', listSessions: async () => []
    }
  })
  t.after(() => sfc.dispose())
  const switching = sfc.state.switchSession({ id: 2 })
  await sfc.flush()
  sfc.state.tab.value = 'guide'
  await sfc.flush()
  sfc.state.question.value = 'Current guide question'
  await sfc.state.send()
  finishHistory({ list: [{ role: 'user', content: 'Obsolete history' }] })
  await switching
  assert.deepEqual(Array.from(sfc.state.messages.value, m => m.content), ['Current guide question', 'Current guide answer'])
})
