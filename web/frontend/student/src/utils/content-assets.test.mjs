import test from 'node:test'
import assert from 'node:assert/strict'
import { firstContentImage, fallbackImageFor } from './content-assets.mjs'

test('真实 imageList 优先于模块回退图', () => {
  assert.equal(firstContentImage({ imageList: ['https://cdn.example/a.png'] }, 'idle'), 'https://cdn.example/a.png')
})

test('imageList 和 images 都为空时返回模块回退图', () => {
  assert.equal(firstContentImage({ imageList: [], images: '' }, 'idle'), '/images/generated-idle-items.png')
  assert.equal(fallbackImageFor('activity'), '/images/generated-activity-campus.png')
})

test('未知模块不伪造接口图片', () => {
  assert.equal(firstContentImage({}, 'unknown'), '')
})
