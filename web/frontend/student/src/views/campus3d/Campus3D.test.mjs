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

test('room content stays inside the 3d page and has no duplicate 2d directory', () => {
  const source = read('src/views/campus3d/Campus3D.vue')
  const workspace = read('src/views/campus3d/CampusWorkspace.vue')
  assert.match(source, /CampusWorkspace/)
  assert.match(source, /workspaceOpen/)
  assert.doesNotMatch(source, /SERVICE_ROUTES|router\.push\(target\)/)
  assert.match(workspace, /学生端实时数据/)
  assert.match(workspace, /listActivity|listIdle|listQuestion|listPost|listNotice|listMessage|listWrong/)
  assert.match(workspace, /normalizeImages/)
  assert.match(workspace, /WtEventArt/)
  assert.match(workspace, /workspace-card-cover|workspace-post-images/)
  assert.match(workspace, /activityDetailOpen|fetchActivityDetail/)
  assert.match(workspace, /确认报名|activitySignupVisible/)
  assert.match(workspace, /openCard\(row\)/)
  assert.doesNotMatch(workspace, /wutong-campus-services-v1|const seed =|directoryPagination|Campus3DDirectory/)
})

test('scene module exposes restore and destroy lifecycle hooks', () => {
  const scene = read('src/features/campus3d/campus-scene.js')
  assert.match(scene, /restoreState\(/)
  assert.match(scene, /destroy\(/)
})
