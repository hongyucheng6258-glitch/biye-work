# Admin Sidebar Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add accessible, single-open accordion behavior to the desktop admin sidebar while preserving route links, permissions, badges, and the compact mobile icon rail.

**Architecture:** Extract the sidebar route-match and accordion-toggle rules into a small pure ES module so Node's built-in test runner can verify route edge cases without mounting Vue. Keep the actual expanded-group state, route watcher, markup, and responsive styles in `AdminLayout.vue`.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router, CSS, Node.js `node:test`.

---

## Files and responsibilities

- Create `web/frontend/admin/src/layout/adminSidebarNavigation.mjs` for pure route matching, active-group lookup, and one-group toggle behavior.
- Create `web/frontend/admin/src/layout/adminSidebarNavigation.test.mjs` for route matching, system-route exact matching, group lookup, and accordion toggle cases.
- Modify `web/frontend/admin/src/layout/AdminLayout.vue` to render semantic group buttons, sync the expanded group when the active route moves between groups, preserve the current compact icon rail, and style the disclosure indicator.

## Global constraints

- Do not modify router definitions, stores, APIs, backend code, page content, or login behavior.
- Preserve the special exact match for `/system`; `/system/config` must never activate the `/system` administrator-account entry.
- Preserve all visible links at widths up to and including 920px, where the existing compact icon rail hides group headings and labels.
- Use only this plan's files. The repository already has unrelated uncommitted changes; do not stage or alter them.

### Task 1: Add tested sidebar navigation rules

**Files:**
- Create: `web/frontend/admin/src/layout/adminSidebarNavigation.test.mjs`
- Create: `web/frontend/admin/src/layout/adminSidebarNavigation.mjs`

- [ ] **Step 1: Write the failing tests first**

Create `adminSidebarNavigation.test.mjs` with:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  findNavigationGroup,
  matchesNavigationPath,
  toggleExpandedGroup
} from './adminSidebarNavigation.mjs'

const groups = [
  { label: '概览', items: [{ to: '/dashboard' }] },
  { label: '内容审核', items: [{ to: '/audit/activity' }] },
  { label: '系统', items: [{ to: '/system/config' }, { to: '/system' }] }
]

test('matches dashboard and nested navigation paths without prefix collisions', () => {
  assert.equal(matchesNavigationPath('/dashboard', '/dashboard'), true)
  assert.equal(matchesNavigationPath('/audit/activity', '/audit/activity/42'), true)
  assert.equal(matchesNavigationPath('/audit/activity', '/audit/idle'), false)
})

test('keeps the administrator account route exact while matching system config', () => {
  assert.equal(matchesNavigationPath('/system', '/system'), true)
  assert.equal(matchesNavigationPath('/system', '/system/config'), false)
  assert.equal(matchesNavigationPath('/system/config', '/system/config'), true)
})

test('finds the group containing the active route', () => {
  assert.equal(findNavigationGroup(groups, '/audit/activity/42'), '内容审核')
  assert.equal(findNavigationGroup(groups, '/missing'), null)
})

test('opens a selected group and collapses it when selected again', () => {
  assert.equal(toggleExpandedGroup(null, '内容审核'), '内容审核')
  assert.equal(toggleExpandedGroup('内容审核', '系统'), '系统')
  assert.equal(toggleExpandedGroup('内容审核', '内容审核'), null)
})
```

- [ ] **Step 2: Run the targeted test and confirm it fails because the helper module is missing**

Run from `web/frontend/admin`:

```powershell
node --test src/layout/adminSidebarNavigation.test.mjs
```

Expected: the test process fails with `ERR_MODULE_NOT_FOUND` for `adminSidebarNavigation.mjs`.

- [ ] **Step 3: Implement the pure helper module**

Create `adminSidebarNavigation.mjs`:

```js
export function matchesNavigationPath(to, path) {
  if (to === '/dashboard' || to === '/system') return path === to
  return path === to || path.startsWith(`${to}/`)
}

export function findNavigationGroup(groups, path) {
  return groups.find((group) =>
    group.items.some((item) => matchesNavigationPath(item.to, path))
  )?.label ?? null
}

export function toggleExpandedGroup(currentGroup, targetGroup) {
  return currentGroup === targetGroup ? null : targetGroup
}
```

- [ ] **Step 4: Run the targeted test and confirm all four cases pass**

Run:

```powershell
node --test src/layout/adminSidebarNavigation.test.mjs
```

Expected: `4` tests pass, `0` fail.

- [ ] **Step 5: Commit the tested helper and tests**

Stage only the two new files and commit them as `feat: add admin sidebar accordion navigation rules`.

### Task 2: Wire the accordion into the existing admin layout

**Files:**
- Modify: `web/frontend/admin/src/layout/AdminLayout.vue`
- Test: `web/frontend/admin/src/layout/adminSidebarNavigation.test.mjs`

**Interfaces:** Import `findNavigationGroup`, `matchesNavigationPath`, and `toggleExpandedGroup` from `./adminSidebarNavigation.mjs`. The helper accepts the existing `visibleGroups` shape (`{ label, items: [{ to }] }`) and `route.path`.

- [ ] **Step 1: Add expanded-group state and route synchronization**

Import `watch` from Vue and the three helper functions. After `visibleGroups`, define:

```js
const activeGroupLabel = computed(() => findNavigationGroup(visibleGroups.value, route.path))
const expandedGroup = ref(activeGroupLabel.value)

watch(activeGroupLabel, (label) => {
  if (label) expandedGroup.value = label
}, { immediate: true })

function toggleGroup(label) {
  expandedGroup.value = toggleExpandedGroup(expandedGroup.value, label)
}
```

Update `isActive(to)` to return `matchesNavigationPath(to, route.path)` so group auto-open and link highlighting use the same route rules.

- [ ] **Step 2: Make each group a keyboard-operable disclosure**

Replace the static `.nav-label` and loose link loop with a `.nav-group` wrapper per visible group. Render its heading as a `<button type="button">` with `aria-expanded`, `aria-controls="nav-group-items-${groupIndex}"`, and `@click="toggleGroup(group.label)"`. Render child links inside the matching ID container and add an `is-collapsed` class when `expandedGroup !== group.label`. Keep the existing `router-link`, active class, icon, count, and item order unchanged.

- [ ] **Step 3: Add disclosure styling and retain the narrow icon rail**

Style the group button to retain the current `.nav-label` typography and spacing, add a small decorative chevron that rotates when `aria-expanded="true"`, and show/hide `.nav-group-items.is-collapsed` on desktop. At `max-width: 920px`, hide the group buttons as today and set `.nav-group` and `.nav-group-items` (including the collapsed selector) to `display: contents`; this keeps every router link visible in the icon rail regardless of desktop expanded state. Disable the chevron transition under `prefers-reduced-motion: reduce`.

- [ ] **Step 4: Run the focused test, the admin test suite, and the production build**

Run from `web/frontend/admin`:

```powershell
node --test src/layout/adminSidebarNavigation.test.mjs
npm test
npm run build
```

Expected: the focused tests pass, the complete admin test suite exits with code `0`, and Vite completes a production build without compilation errors.

- [ ] **Step 5: Review the final diff and commit only the layout change**

Check that only `AdminLayout.vue` remains for this task, confirm router links and responsive behavior are unchanged outside the accordion, and commit it as `feat: add collapsible admin sidebar groups`.

## Self-review

- The tests cover active-group matching, nested routes, the `/system` exact-match exception, and single-open toggle behavior.
- The layout task implements route-based initial expansion, switching groups after navigation, manual collapse, accessible disclosure controls, and the narrow icon rail exception.
- Existing icons, active styles, counts, role filtering, and router destinations remain supplied by the existing `visibleGroups` and `router-link` data.
- All planned changes are limited to the three files listed above; unrelated dirty files remain untouched.
