import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

test('campus 3d route is public and points to Campus3D', () => {
  const router = read('src/router/index.js')
  assert.match(router, /path:\s*['"]\/?campus-3d['"]/) 
  assert.match(router, /Campus3D\.vue/)
  assert.match(router, /campus-3d[\s\S]*public:\s*true/)
})

test('room ids map to existing student pages without a duplicate 2d directory', () => {
  const source = read('src/views/campus3d/Campus3D.vue')
  for (const route of ['/activity', '/idle', '/partner', '/lostfound', '/qa', '/social', '/notice', '/message', '/ai/chat', '/ai/code', '/ai/wrong']) {
    assert.match(source, new RegExp(route.replace('/', '\\/')))
  }
  assert.doesNotMatch(source, /directoryPagination|view2d|Campus3DDirectory/)
})

test('scene module exposes restore and destroy lifecycle hooks', () => {
  const scene = read('src/features/campus3d/campus-scene.js')
  assert.match(scene, /restoreState\(/)
  assert.match(scene, /destroy\(/)
})
