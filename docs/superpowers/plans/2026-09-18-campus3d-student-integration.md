# Student 3D Campus Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vue student-side 3D campus entry that reuses the `corridor.html` spatial prototype and opens the existing student pages from each 3D room.

**Architecture:** Extract only the prototype's spatial engine and data into a Vue feature module. A new `/campus-3d` page owns the scene lifecycle, room prompt, controls and state restoration; existing student routes remain the only implementation of business content. The prototype's 2D directory and demo workspace are intentionally omitted.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router 4, Vite 5, Three.js r160 ESM, existing student design tokens and Node test runner.

---

## File map

- Create `web/frontend/student/src/features/campus3d/campus-scene.js`: migrated spatial engine with a small restore-state API.
- Create `web/frontend/student/src/features/campus3d/campus-data.js`: migrated service/group/theme data used by the spatial engine and room prompt.
- Create `web/frontend/student/src/features/campus3d/three.module.js`: local Three.js r160 module copied from the prototype vendor file.
- Create `web/frontend/student/src/views/campus3d/Campus3D.vue`: full-screen 3D page, controls, room prompt, route bridge and lifecycle cleanup.
- Modify `web/frontend/student/src/router/index.js`: register public `/campus-3d` route.
- Modify `web/frontend/student/src/views/home/Home.vue`: add the prominent “进入3D校园” entry and route handler.
- Modify `web/frontend/student/src/layout/MainLayout.vue`: add desktop and mobile navigation entries and page title.
- Create or modify `web/frontend/student/src/views/campus3d/Campus3D.test.mjs`: static route/service mapping checks that do not require WebGL.

## Task 1: Add behavior tests and copy the spatial source

**Files:**
- Create: `web/frontend/student/src/views/campus3d/Campus3D.test.mjs`
- Create: `web/frontend/student/src/features/campus3d/campus-scene.js`
- Create: `web/frontend/student/src/features/campus3d/campus-data.js`
- Create: `web/frontend/student/src/features/campus3d/three.module.js`

- [ ] **Step 1: Write static integration tests.**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

test('campus 3d route is public and points to Campus3D', () => {
  const router = read('src/router/index.js')
  assert.match(router, /path:\s*['"]campus-3d['"]/) 
  assert.match(router, /Campus3D\.vue/)
  assert.match(router, /campus-3d[\s\S]*public:\s*true/)
})

test('room ids map to existing student pages without a 2d directory', () => {
  const source = read('src/views/campus3d/Campus3D.vue')
  for (const route of ['/activity', '/idle', '/partner', '/lostfound', '/qa', '/social', '/notice', '/message', '/ai/chat', '/ai/code', '/ai/wrong']) assert.match(source, new RegExp(route.replace('/', '\\/')))
  assert.doesNotMatch(source, /directoryPagination|view2d|Campus3DDirectory/)
})

test('scene module exposes restore and destroy lifecycle hooks', () => {
  const scene = read('src/features/campus3d/campus-scene.js')
  assert.match(scene, /restoreState\(/)
  assert.match(scene, /destroy\(/)
})
```

- [ ] **Step 2: Run the new test to verify it fails.**

Run from `web/frontend/student`:

```powershell
node --test src/views/campus3d/Campus3D.test.mjs
```

Expected: FAIL because the new route, scene feature and view do not exist yet.

- [ ] **Step 3: Copy the prototype spatial files.**

Copy `E:/work/毕业设计UI原型/js/campus-scene.js`, the data definitions from `E:/work/毕业设计UI原型/js/campus-data.js`, and `E:/work/毕业设计UI原型/vendor/three.module.js` into the new feature directory. Change the scene import from `../vendor/three.module.js` to `./three.module.js`; keep the public `createCampusScene({ container, labels, services, onEnter, onRoomInteract, onNavigate, onPosition, onError })` contract.

- [ ] **Step 4: Add restore state to the scene API.**

Expose `restoreState({ insideId, position, yaw, pitch })` next to `getDebug()` and `destroy()`. Validate numeric coordinates and known room IDs, copy the camera position, set orientation, hide the external landscape when restoring a room, and call `applyCamera()`, `reportPosition(true)`, `updateLabels(true)` and `renderOnce()`. If the state is invalid, leave the scene at its normal hall start.

- [ ] **Step 5: Run syntax and the copied-module test.**

```powershell
node --check src/features/campus3d/campus-scene.js
node --check src/features/campus3d/campus-data.js
node --test src/views/campus3d/Campus3D.test.mjs
```

Expected: syntax checks pass; static tests still fail only on the missing Vue route/view.

- [ ] **Step 6: Commit the isolated spatial migration.**

```powershell
git add web/frontend/student/src/features/campus3d web/frontend/student/src/views/campus3d/Campus3D.test.mjs
git commit -m "feat(student): migrate campus 3d spatial engine"
```

## Task 2: Build the 3D page and bridge rooms to existing routes

**Files:**
- Create: `web/frontend/student/src/views/campus3d/Campus3D.vue`

- [ ] **Step 1: Add the page shell.**

Create refs for `sceneCanvas`, `sceneLabels`, `loading`, `error`, `roomPrompt`, `locationName`, `travelStatus` and `travelProgress`. Mount the scene in `onMounted()` and destroy it in `onBeforeUnmount()`. The page must not render the prototype's 2D directory, pagination controls or demo workspace.

- [ ] **Step 2: Add the service route map.**

Use this constant in the component:

```js
const SERVICE_ROUTES = {
  activity: '/activity', idle: '/idle', partner: '/partner', lost: '/lostfound',
  qa: '/qa', square: '/social', notice: '/notice', message: '/message',
  aichat: '/ai/chat', code: '/ai/code', wrong: '/ai/wrong'
}
```

`openService(id)` stores the scene debug state in `sessionStorage` under `wutong-campus-3d-state`, pauses the scene, and calls `router.push(SERVICE_ROUTES[id])`. Unknown IDs display an in-page error toast and keep the user in the room.

- [ ] **Step 3: Implement room prompt behavior.**

On `onEnter(id)`, show the room name, room code, profile text and two actions: `打开服务内容` and `回到门口`. Do not call `openService` automatically. On room interaction, call `openService(id)`. The exit action calls `scene.exit(id)` and hides the prompt. The prompt must focus its primary action when it appears.

- [ ] **Step 4: Implement state restoration.**

On mount, read and parse `sessionStorage`. After `createCampusScene` resolves, call `scene.restoreState(saved)` only when the saved timestamp is less than 30 minutes old and the saved `returnPath` is `/campus-3d`; then show the room prompt for the saved service. Remove the saved state after a successful restore or when the user explicitly returns home.

- [ ] **Step 5: Add scene controls.**

Implement the prototype controls without a 2D mode switch:

- Return home button: `router.push('/')` after clearing the saved state.
- Fullscreen button: `sceneFrame.requestFullscreen()` / `document.exitFullscreen()` with a CSS fallback.
- Comfort button: toggle `scene.setComfort(value)` and persist the preference.
- Minimap toggle: hide/reopen the map overlay.
- Cancel travel: `scene.goHall()` and hide travel status.
- Escape: if the room prompt is visible, exit to the door; otherwise return home.

- [ ] **Step 6: Add scene markup and responsive styles.**

Use the prototype scene overlays and adapt their colors to `tokens.css`: canvas, labels, top location chip, loading/error panels, room prompt, travel status, minimap and bottom movement hint. On screens below 760px, move the prompt to a bottom sheet and keep controls reachable above the mobile browser safe area.

- [ ] **Step 7: Run tests and build the page.**

```powershell
node --test src/views/campus3d/Campus3D.test.mjs
npm run build
```

Expected: static tests pass and Vite produces a `dist` bundle without unresolved Three.js imports.

- [ ] **Step 8: Commit the page implementation.**

```powershell
git add web/frontend/student/src/views/campus3d/Campus3D.vue
git commit -m "feat(student): add 3d campus experience"
```

## Task 3: Register the route and add student-side entry points

**Files:**
- Modify: `web/frontend/student/src/router/index.js`
- Modify: `web/frontend/student/src/views/home/Home.vue`
- Modify: `web/frontend/student/src/layout/MainLayout.vue`

- [ ] **Step 1: Add the public route.**

Add this route before the catch-all redirect:

```js
{
  path: '/campus-3d',
  name: 'Campus3D',
  component: () => import('../views/campus3d/Campus3D.vue'),
  meta: { public: true, title: '3D校园' }
}
```

- [ ] **Step 2: Add the homepage entry.**

Add a primary or soft hero button labeled `进入3D校园` that calls the existing `go({ to: '/campus-3d' })` helper. Keep the current activity and AI buttons unchanged.

- [ ] **Step 3: Add desktop and mobile navigation entries.**

Add `{ to: '/campus-3d', label: '3D校园', icon: 'cube' }` to the desktop navigation and the student drawer. Add a `cube` SVG path to `ICONS`, and add `'/campus-3d': '3D校园'` to `PAGE_TITLES`.

- [ ] **Step 4: Run route and UI tests.**

```powershell
node --test src/views/home/Home.test.mjs src/layout/MainLayout.test.mjs src/views/campus3d/Campus3D.test.mjs
```

Expected: all selected tests pass.

- [ ] **Step 5: Commit the entry points.**

```powershell
git add web/frontend/student/src/router/index.js web/frontend/student/src/views/home/Home.vue web/frontend/student/src/layout/MainLayout.vue
git commit -m "feat(student): add 3d campus navigation entries"
```

## Task 4: Browser regression and final validation

**Files:**
- Modify: `web/frontend/student/src/views/campus3d/Campus3D.test.mjs` only if a discovered regression needs a focused static assertion.

- [ ] **Step 1: Start the student frontend and open the home page.**

Run:

```powershell
npm run dev -- --host 127.0.0.1
```

Open the printed local URL in a Chromium browser.

- [ ] **Step 2: Verify entry points.**

Click the homepage `进入3D校园` button, then return home and verify the desktop navigation and mobile drawer entries reach `/campus-3d`.

- [ ] **Step 3: Verify three representative rooms.**

Check activity, AI chat and wrong-book rooms: enter through the door, confirm no automatic content navigation, click the room screen, confirm the existing route opens, use browser Back, confirm the same room prompt and camera state return, then click `回到门口`.

- [ ] **Step 4: Verify controls and cleanup.**

Check fullscreen, minimap collapse/reopen, comfort mode, WASD/drag movement, Escape behavior, loading/error state, and mobile layout. Navigate away and back multiple times to ensure the WebGL renderer is destroyed and recreated only once per page visit.

- [ ] **Step 5: Run the final checks.**

```powershell
npm test
npm run build
git status --short
```

Expected: tests and production build pass; only intentional source changes remain.

- [ ] **Step 6: Commit any final test-only adjustments.**

```powershell
git add web/frontend/student/src/views/campus3d/Campus3D.test.mjs
git commit -m "test(student): verify campus 3d navigation flows"
```
