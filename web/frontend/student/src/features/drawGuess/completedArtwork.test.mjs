import test from 'node:test'
import assert from 'node:assert/strict'
import { captureCompletedArtwork, dataUrlToBlob } from './completedArtwork.mjs'

test('captures an ended canvas only for its drawer and keeps the source image', () => {
  const imageDataUrl = 'data:image/png;base64,AQID'
  const canvas = { toDataURL: (type) => type === 'image/png' ? imageDataUrl : null }

  assert.deepEqual(captureCompletedArtwork({ roundId: 19, drawerUserId: 7 }, 7, canvas), {
    roundId: 19,
    imageDataUrl
  })
  assert.equal(captureCompletedArtwork({ roundId: 19, drawerUserId: 7 }, 8, canvas), null)
  assert.equal(captureCompletedArtwork({ roundId: null, drawerUserId: 7 }, 7, canvas), null)
})

test('converts a preserved data URL into an uploadable PNG blob', async () => {
  const blob = dataUrlToBlob('data:image/png;base64,AQID')

  assert.equal(blob.type, 'image/png')
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())], [1, 2, 3])
})
