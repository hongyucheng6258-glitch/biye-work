# 端到端业务闭环与测试可靠性实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复已发现的业务闭环缺口和测试误判，并在不清库的前提下完成本地与 Docker 验收。

**Architecture:** 后端继续使用现有 Spring Boot 模块和 REST 路由；学生端复用现有消息导航和分页包装；E2E 脚本通过共享 helper 统一响应解包、证据记录和临时数据清理。每项业务先验证接口结果，再验证状态和通知，最后验证页面。

**Tech Stack:** Spring Boot、MyBatis-Plus、Vue 3、Element Plus、Playwright、Node.js `node:test`、Docker Compose。

---

### Task 1: 建立可审计的 E2E 断言工具

**Files:**
- Modify: `tests/browser/e2e/helpers.cjs`
- Modify: `tests/browser/e2e/run-all.cjs`
- Test: `tests/browser/e2e/test-results.json` (generated output)

- [ ] **Step 1: Add response/list helpers**

  在 `helpers.cjs` 增加 `unwrapList(body)`、`unwrapPage(body)` 和 `messageMatches(messages, predicate)`；列表按 `data.list`、`data.records`、数组顺序解包，未知结构抛出带响应摘要的错误。

- [ ] **Step 2: Make records fail-safe**

  修改 `record`，只有调用方明确传入 `PASS`、`FAIL`、`BLOCK` 或 `UNCOVERED` 才写入结果；移除任何默认成功路径，并把 HTTP code、业务 code 和 message 写入 detail。

- [ ] **Step 3: Verify helper tests**

  在项目根目录运行 `node --test tests/browser/e2e/*.test.cjs`；若没有匹配文件，运行 `node --check tests/browser/e2e/helpers.cjs` 和 `node --check tests/browser/e2e/run-all.cjs`，预期无语法错误。

### Task 2: 修正闲置预约闭环和状态断言

**Files:**
- Modify: `tests/browser/e2e/test-03-idle-appoint.cjs`
- Modify: `tests/browser/e2e/test-20-concurrency.cjs`
- Modify: `web/backend/src/main/java/com/campus/platform/module/idle/service/IdleService.java` only if a reproduced state failure remains
- Test: `tests/browser/e2e/test-03-idle-appoint.cjs`

- [ ] **Step 1: Match notifications by appointment ID**

  在卖家和买家消息断言中使用 `bizType === 'idle'`、`bizId === itemId` 或后端实际约定的 appointment target，并同时检查标题包含预约语义；只看到 `/message/list` 成功不能通过。

- [ ] **Step 2: Assert seller received list by role**

  使用 `unwrapPage` 读取卖家收到的预约，断言 appointment ID、seller ID 和 item ID 同时匹配；若接口返回空列表记录 FAIL 并保留响应摘要。

- [ ] **Step 3: Separate buyer and seller finish operations**

  接受后先查询状态为 accepted；买家确认后允许状态变为 buyer-finished 或后端定义的中间状态；卖家确认后断言最终 finished。若后端设计为双方确认才完成，测试不得把第一次确认后的拒绝当成失败。

- [ ] **Step 4: Verify rejection relists item**

  拒绝后查询闲置详情，按 `status` 的常量语义断言在架，同时断言 appointment 为 rejected；若接口返回 0，先读取 `Constants.IDLE_*` 和详情 VO 的约定再调整代码或断言，禁止用猜测值通过。

- [ ] **Step 5: Run the isolated flow**

  运行 `node tests/browser/e2e/run-all.cjs --only 03,20`（若 runner 不支持 `--only`，临时使用现有 runner 的类别过滤参数）；预期预约通知、接受、双方完成、拒绝重上架和重复预约均得到明确 PASS 或预期拒绝。

### Task 3: 修复举报记录和管理员处理链路

**Files:**
- Modify: `web/backend/src/main/java/com/campus/platform/module/report/controller/ReportController.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/report/service/ReportService.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/admin/controller/AdminReportController.java` only if route contract differs from frontend
- Modify: `tests/browser/e2e/test-12-report.cjs`
- Modify: `web/frontend/student/src/utils/message-navigation.mjs`
- Test: backend report service tests if present, otherwise E2E category 12

- [ ] **Step 1: Inspect and preserve actual route contract**

  Keep administrator operations under `/api/admin/report/list` and `/api/admin/report/{id}/handle`; use the existing admin interceptor and DTO rather than adding a parallel route.

- [ ] **Step 2: Add student “my reports” query**

  Add `GET /api/report/my` returning the current user’s paged reports ordered by newest first. Reuse `PageResult` and `ReportMapper`; never accept a user ID from the query string.

- [ ] **Step 3: Send a traceable result notification**

  When admin handling succeeds, send a message to `reporterId` with `type=system`, `bizType=report`, `bizId=report.id`, and text containing the resulting status. Keep the submission receipt notification separate.

- [ ] **Step 4: Make E2E verify the exact report**

  After handling, query `/report/my`, locate `reportId`, assert status equals resolved/rejected according to the request, then query messages and assert matching `bizType` and `bizId`. A generic successful message-list response records FAIL.

- [ ] **Step 5: Run category 12**

  Run the report test against the current service and verify student access is 200, admin access is 200, non-admin access is 403, and the notification is tied to the created report.

### Task 4: Correct lost-found, QA, login, and chat image tests

**Files:**
- Modify: `tests/browser/e2e/test-05-lostfound.cjs`
- Modify: `tests/browser/e2e/test-07-qa.cjs`
- Modify: `tests/browser/e2e/test-01-auth.cjs`
- Modify: `tests/browser/e2e/test-13-chat.cjs`
- Modify: `tests/browser/e2e/test-14-upload.cjs`
- Modify: `web/frontend/student/src/views/` only for a reproduced UI defect

- [ ] **Step 1: Use the correct lost-found type**

  Create a `type=1` found item, confirm its audit status before claiming, and assert the claim belongs to the created lost-found ID.

- [ ] **Step 2: Normalize QA detail status**

  Read the actual `QuestionDetailVO` fields and assert the documented solved field (`status`, `solved`, or equivalent) explicitly; do not compare an undefined wrapper field.

- [ ] **Step 3: Fix UI auth evidence**

  Wait for the login request and router navigation, assert the application’s actual token key and authenticated route, then test logout from the real profile menu. A screenshot remains supplementary evidence.

- [ ] **Step 4: Create an owned upload resource for chat**

  Upload a small PNG through `/api/upload/image`, retain the returned `resourceId` and URL, pass both to the chat message endpoint, and read the conversation to confirm the image message. Verify a different user cannot reuse the resource.

- [ ] **Step 5: Run categories 01, 05, 07, 13, and 14**

  Record each rejected request with its expected business code; do not classify an expected duplicate or permission rejection as a product failure.

### Task 5: Replace pseudo-concurrency with real race tests

**Files:**
- Modify: `tests/browser/e2e/test-20-concurrency.cjs`
- Modify: `web/backend/src/main/java/com/campus/platform/module/idle/service/IdleService.java` only if duplicate reservations are reproduced
- Modify: activity service only if a real over-capacity race is reproduced

- [ ] **Step 1: Start requests together**

  Build two or more authenticated clients and invoke the same appointment or signup request inside one `Promise.all` call without awaiting either request first.

- [ ] **Step 2: Assert the final state**

  Query the item/activity and related rows after all requests settle; assert one valid appointment or no more than `maxMembers` approved members. Record each response code and the final row count.

- [ ] **Step 3: Keep expected rejection separate**

  A second request may return a business error; that is a PASS only when the first request succeeded and the final state is consistent. Never record a hard-coded final PASS.

- [ ] **Step 4: Run the race suite repeatedly**

  Run the concurrency category five times against the same non-production test prefix and confirm identical invariants on every run.

### Task 6: Expand 3D and persistence checks

**Files:**
- Modify: `tests/browser/e2e/test-18-campus3d.cjs`
- Modify: `web/frontend/student/` 3D view only if stable selectors are missing
- Modify: `tests/browser/e2e/test-14-upload.cjs`

- [ ] **Step 1: Use semantic 3D selectors**

  Select the campus start control, room control, open-content control, room return control, and 2D/3D control by `data-testid` or visible accessible name; assert each exists before clicking.

- [ ] **Step 2: Assert manual room behavior**

  After entering a room, assert room content is hidden before clicking “打开服务内容”, visible after the click, and hidden again after returning to the room. Assert the URL remains inside the 3D route.

- [ ] **Step 3: Verify ordinary student synchronization**

  Create or sign up for one service in the room, query the ordinary student endpoint, and assert the same record ID appears there.

- [ ] **Step 4: Verify file persistence after restart**

  Save the uploaded resource URL, restart only the backend container, then request the asset URL and assert a successful content response.

### Task 7: Run Docker acceptance without database cleanup

**Files:**
- Modify: `docker-compose.yml` only for a reproduced health or startup issue
- Modify: `DEPLOYMENT_ACCEPTANCE_2026-09-22.md`
- Create: `tests/browser/e2e/final-acceptance-report.json`

- [ ] **Step 1: Check service health**

  Run the existing Compose health/status commands and verify MySQL, Redis, backend, student, and admin are healthy. Preserve the current database volume.

- [ ] **Step 2: Run API smoke checks**

  Check authentication, report, message, upload, and WebSocket ticket endpoints using a test account; redact secrets from logs.

- [ ] **Step 3: Run the complete E2E suite**

  Run `node tests/browser/e2e/run-all.cjs` with Docker URLs and write the result JSON outside the database volume. The final report must list PASS, expected rejection, FAIL, BLOCK, and UNCOVERED separately.

- [ ] **Step 4: Review changed files and preserve user work**

  Run `git diff --check` and `git status --short`; do not reset, clean, or overwrite unrelated user changes.
