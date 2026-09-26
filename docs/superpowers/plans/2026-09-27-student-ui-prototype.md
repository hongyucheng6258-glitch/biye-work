# Student UI Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an independent, clickable HTML prototype for the full student-facing experience without changing production Vue screens or services.

**Architecture:** Add one standalone HTML file under `ui-prototype/`, with embedded CSS and small vanilla JavaScript. Reuse existing student routes, visual tokens, and local image assets; render every primary module through a shared responsive shell and show detail/publish states as local-only prototype views.

**Tech Stack:** HTML, CSS, vanilla JavaScript, existing local campus images.

---

### Task 1: Create an isolated implementation worktree

**Files:**
- Create: `.worktrees/student-ui-prototype` (worktree only; no source file changes)

- [ ] **Step 1: Create a feature branch from the plan commit**

Run from the repository root:

```powershell
git worktree add .worktrees/student-ui-prototype -b docs/student-ui-prototype
```

Expected: a new `docs/student-ui-prototype` branch and worktree based on the current project head.

- [ ] **Step 2: Confirm the worktree starts clean**

Run:

```powershell
git -C .worktrees/student-ui-prototype status --short
```

Expected: no output. Do not copy uncommitted main-worktree files into this worktree.

### Task 2: Build the standalone shell and home view

**Files:**
- Create: `ui-prototype/student-refresh.html`

- [ ] **Step 1: Add the document shell, design tokens, and accessible base styles**

Create a `lang="zh-CN"` HTML5 document with UTF-8 and viewport metadata. Define CSS variables for the approved palette (`#F5F8FD`, `#FFFFFF`, `#24324C`, `#4267DC`, `#F0D7B3`, `#DDECE3`), spacing, radii, typography, focus rings, and reduced-motion behavior. Keep all CSS in the file and load no remote assets or libraries.

- [ ] **Step 2: Add responsive shared navigation and the portal homepage**

Use a semantic `<aside>` for grouped navigation, a `<header>` for search/global actions, and a `<main>` for page content. Add the existing local campus image using `../web/frontend/student/public/images/campus-v2.webp`. The home view must show an editorial campus hero, one event feature, clear service entry points, and a varied activity feed. On narrow screens, collapse the sidebar into an accessible drawer and make the content one column.

### Task 3: Add module-specific student views

**Files:**
- Modify: `ui-prototype/student-refresh.html`

- [ ] **Step 1: Add campus service, community, and search views**

Create switchable primary views for `/campus-3d`, `/search`, `/activity`, `/idle`, `/lostfound`, `/partner`, `/qa`, `/social`, `/draw-guess`, and `/notice`. Use campus/activity/product image assets from `../web/frontend/student/public/images/`. Keep each module's hierarchy distinct: event posters for activities, compact listings for lost-and-found and idle items, question rows for Q&A, a chronological feed for social, and a two-dimensional room mockup for the game.

- [ ] **Step 2: Add messaging, AI, and profile views**

Create primary views for `/message`, `/chat`, `/ai/chat`, `/ai/code`, `/ai/wrong`, `/profile`, and `/user/:id`. Use conversation lists and a focused transcript for messages, a working area with clear input for AI chat/code, a grouped review list for wrong answers, and a profile header plus organized user content for profile pages.

- [ ] **Step 3: Add authentication and fallback views**

Create `/login`, `/register`, and `/maintenance` prototype states. Use the local `login-bg.jpg` and `register-bg.png` assets with a calm photo treatment, readable form contrast, and an obvious switch between login and registration.

- [ ] **Step 4: Add detail, publish, appointment, signup, and room states**

For activity, idle, lost-and-found, partner, Q&A, notice, chat, and draw-guess, add the relevant local-only detail, publish, appointment/signup, conversation, or room state. Every state must provide a visible way back to its parent module. Forms use native labels and required-field feedback; prototype submissions show a local success notice and do not persist.

### Task 4: Wire local prototype interactions

**Files:**
- Modify: `ui-prototype/student-refresh.html`

- [ ] **Step 1: Implement module and sub-state navigation**

Use one page registry keyed by these IDs: `home`, `campus3d`, `search`, `activity`, `activity-detail`, `activity-publish`, `activity-signup`, `idle`, `idle-detail`, `idle-publish`, `idle-appointments`, `lostfound`, `lostfound-detail`, `lostfound-publish`, `partner`, `partner-publish`, `qa`, `qa-detail`, `qa-publish`, `qa-mine`, `social`, `draw-guess`, `draw-room`, `notice`, `notice-detail`, `message`, `chat`, `chat-room`, `ai-chat`, `ai-code`, `ai-wrong`, `profile`, `public-profile`, `login`, `register`, and `maintenance`. Use one `showView(id)` function to reveal the selected view, update the active navigation item, close the mobile drawer, and update the document title. Route links in cards and action buttons must call that function with a defined ID; invalid IDs fall back to `home`.

- [ ] **Step 2: Implement search, filters, theme, and modal actions**

Search submits the entered text into `search` and displays it in a result summary. Category filters update selected styling and the visible sample collection. The theme control toggles a `data-theme` attribute. Publish controls open one accessible modal with a close button, Escape handling, and focus returned to the opening button. Login/register tabs switch between `login` and `register`.

- [ ] **Step 3: Implement form feedback and prototype-only message sending**

Validate required inputs before displaying success feedback. Submitting a prototype form routes to its matching parent list and announces that the preview submission succeeded; it must not persist data. In `chat-room`, submitting non-empty text adds a message bubble to the current sample conversation and clears the composer. Announce feedback through an `aria-live="polite"` status region.

### Task 5: Review and integrate the prototype

**Files:**
- Modify: `ui-prototype/student-refresh.html`

- [ ] **Step 1: Review representative desktop and mobile layouts**

Open the HTML directly in a browser at desktop and phone-sized widths. Review the homepage, one dense list, AI chat, login, and profile views. Confirm local photos load, navigation opens and returns, the mobile drawer closes after selection, and no main content is clipped horizontally. Make focused fixes in the standalone file only.

- [ ] **Step 2: Check the source diff and commit only the prototype file**

Run:

```powershell
git diff --check
git status --short
```

Stage only `ui-prototype/student-refresh.html`, then commit with:

```powershell
git add ui-prototype/student-refresh.html
git commit -m "feat: add student UI refresh prototype"
```

Expected: the commit contains only the standalone HTML prototype; no production component, local configuration, or existing untracked user file is included.

- [ ] **Step 3: Fast-forward the prototype branch into the main worktree**

From the main worktree, fast-forward `feat/v2-visual-upgrade` to `docs/student-ui-prototype` only if the current main head is an ancestor of the feature branch. Preserve all existing main-worktree modifications and untracked files. Remove only the `student-ui-prototype` worktree and its merged branch after integration.

Expected: the main branch gains the standalone prototype while production application files and pre-existing local changes remain untouched.
