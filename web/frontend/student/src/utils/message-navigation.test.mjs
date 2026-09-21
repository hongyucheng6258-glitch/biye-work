import test from 'node:test'
import assert from 'node:assert/strict'
import { messageTarget } from './message-navigation.mjs'

test('notification destinations cover every business module', () => {
  const cases = [
    [{ bizType: 'conversation', bizId: 8 }, '/chat/8'],
    [{ bizType: 'idle', bizId: 9 }, '/idle/appointments'],
    [{ bizType: 'activity', bizId: 12 }, '/activity/detail/12'],
    [{ bizType: 'lostfound', bizId: 5 }, '/lostfound/detail/5'],
    [{ bizType: 'qa', bizId: 3 }, '/qa/detail/3'],
    [{ bizType: 'post', bizId: 7 }, '/social?post=7'],
    [{ bizType: 'partner', bizId: 4 }, '/partner'],
    [{ bizType: 'notice', bizId: 2 }, '/notice/detail/2'],
    [{ bizType: 'user', bizId: 6 }, '/user/6']
  ]
  for (const [message, expected] of cases) assert.equal(messageTarget(message), expected)
})

test('missing identifiers fall back to the module list and unknown types stay in the inbox', () => {
  assert.equal(messageTarget({ bizType: 'activity' }), '/activity')
  assert.equal(messageTarget({ bizType: 'lostfound' }), '/lostfound')
  assert.equal(messageTarget({ bizType: 'post' }), '/social')
  assert.equal(messageTarget({ bizType: 'system' }), null)
  assert.equal(messageTarget({ bizType: 'audit' }), null)
})
