# Student Personal Center Dashboard Redesign

**Status:** Design approved; implementation details pending user review.

## Context

The student `/profile` page currently combines a large identity banner, a tabbed management table, and two right-rail statistics panels. The page contains useful functions, but the banner and side rail compete with the content tables for space. The page stylesheet also has a duplicated `<style scoped>` opening tag near its end.

The working copy already contains a user change that adds the “我的举报” tab and query-driven tab selection. The redesign must preserve that work.

## Goal

Make the personal center read as a clear management dashboard: identify the account quickly, show useful activity and study counts compactly, and give the user's managed content most of the available width. Keep the existing campus blue and cloud-white visual language, including dark theme support.

## Scope

- Redesign the student-owned `/profile` view in `web/frontend/student/src/views/profile/Profile.vue`.
- Keep `WtPageHeader` and shared application layout unchanged.
- Keep all current data sources, API calls, tabs, links, dialog actions, and save behavior.
- Preserve the existing uncommitted “我的举报” tab and `?tab=` support exactly.
- Repair the malformed/duplicated scoped-style boundary as part of organizing this view's styles.

## Proposed layout

1. **Page heading:** Keep the existing “个人中心” title and subtitle.
2. **Identity strip:** Reduce the tall banner to a compact horizontal profile panel. Keep avatar, nickname, student number, phone binding state, current status tags, “编辑资料”, and “修改密码”. Use the existing campus image treatment only as a quiet backdrop; retain readable contrast and avoid adding assets.
3. **Data summary:** Present all six existing values in one compact responsive band, grouped visually into campus activity (`我的闲置`, `累计错题`, `AI 会话`) and study progress (`待复习`, `已掌握`, `本周复习`). Do not invent or fetch new metrics.
4. **Management area:** Give the existing “我的闲置 / 我的报名 / 错题本 / 我的收藏 / 我的举报” tabs the full content width. Preserve each current table, empty state, loading state, links, and row actions. Keep long tables usable on narrow screens through their own horizontal scrolling rather than widening the page.

## Responsive behavior

- On wide screens, keep the identity strip and summary compact and allow the management area to use the full page width.
- On tablet widths, wrap the summary into fewer columns without squeezing table controls.
- On phones, stack identity and actions, use a two-column summary grid, keep tab labels reachable with horizontal scrolling, and keep tables inside a horizontally scrollable region.
- Constrain the edit-profile and password dialogs to the viewport width while retaining their existing fields and actions.
- Avoid horizontal page overflow at phone widths.

## Visual direction

- Reuse existing design tokens for brand blue, paper/surface colors, borders, type sizes, radii, and dark mode.
- Establish hierarchy through spacing and typography; avoid decorating every value as an identical raised card.
- Keep table/status colors legible in both light and dark themes.
- Retain visible focus indicators and use motion only for user-triggered state changes.
- Add no dependencies, global CSS changes, or new image/font assets.

## Behavior that must remain unchanged

- `tab` initialization from the `tab` query parameter, including `report`.
- Loading and rendering for idle items, favorites, reports, wrong-book statistics, and conversations.
- Idle edit/offline/relist actions, cancellation of favorites, report display, profile editing, and password update flows.
- Existing navigation targets, permissions, API payloads, success messages, and validation.

## Acceptance criteria

- The page presents identity information without the banner dominating the viewport.
- All six current data values remain visible and their labels are clear.
- The management tabs receive more room than they do in the current two-column layout.
- Existing tabs, actions, loading/empty states, and the local “我的举报” addition remain intact.
- Desktop, tablet, and phone layouts do not cause page-level horizontal overflow; tables may scroll internally.
- Both dialogs fit within a phone viewport.
- The stylesheet has one correctly closed scoped style block.
- The student frontend production build succeeds.

## Review and validation notes

Review desktop and phone layouts visually if a browser is available. If browser automation is unavailable, report that limitation separately from the production build result. Do not run automated test suites for this visual-only change unless explicitly requested.
