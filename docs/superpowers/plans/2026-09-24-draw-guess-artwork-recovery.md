# Draw-and-Guess Artwork Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the original drawer's save action for completed rounds after reload or reconnect, including after the next turn begins.

**Architecture:** Persist validated normalized strokes as nullable JSON text on each finished round. Add drawer-scoped pending artworks to the existing room response. Rebuild each recovered PNG on a detached canvas so loading a prior round never overwrites the active board.

**Tech Stack:** Spring Boot 3, MyBatis-Plus, MySQL, Vue 3, browser Canvas API, JUnit 5, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-24-draw-guess-reconnect-and-gallery-privacy.md`

---

## File map

- `web/backend/src/main/resources/db/migrate_v9_draw_guess_artwork.sql`: additive upgrade for existing databases.
- `web/backend/src/main/resources/db/schema.sql` and `docker/mysql/02-app-extension.sql`: fresh-install definitions; keep their marked draw-guess blocks identical.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/entity/DrawGuessRound.java`: nullable serialized stroke field.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/vo/DrawGuessCompletedArtworkVO.java`: per-round drawer-owned restore payload.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/vo/DrawGuessRoomVO.java`: adds `pendingArtworks` to the response.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`: stores strokes before clearing and builds scoped pending payloads.
- `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`: persistence, restore, ownership, and saved-artwork coverage.
- `web/backend/src/test/java/com/campus/platform/module/drawgame/db/DrawGuessMigrationTest.java`: v8 immutability and v9/fresh-schema checks.
- `web/frontend/student/src/features/drawGuess/completedArtwork.mjs`: detached-canvas rendering of stored strokes.
- `web/frontend/student/src/features/drawGuess/completedArtwork.test.mjs`: deterministic renderer tests.
- `web/frontend/student/src/views/drawGuess/Room.vue`: turns room-response entries into pending save buttons without changing the live canvas.

## Global constraints

- Keep migration `migrate_v8_draw_guess.sql` unchanged; existing installations apply v9 once.
- Return only finished, unsaved strokes whose `drawer_user_id` equals the active room member's user ID. Also filter rows in service code so a mapper/mock returning extra rows cannot expose another drawer's payload.
- Return no pending entries if the viewing membership is absent or inactive, including from the response produced by `leaveRoom`.
- Never include words/answers in `pendingArtworks`.
- Keep `uploadSnapshot`'s existing active-membership, drawer ownership, and one-snapshot checks.
- Do not change current live drawing, active-round replay, room navigation, or final-round live capture.

## Task 1: Specify persistence, migration, and drawer-only restore with failing tests

**Files:**
- Modify: `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`
- Modify: `web/backend/src/test/java/com/campus/platform/module/drawgame/db/DrawGuessMigrationTest.java`

- [ ] **Step 1: Add a finished-round persistence assertion.** In a test that starts a two-player room, sends a valid `draw` message from `playing.drawerUserId()`, then sends `skip` from that drawer, retain the inserted `DrawGuessRound` and assert `new ObjectMapper().valueToTree(round).has("drawingData")`. Assert the stored node contains the submitted normalized x/y point and color. Use the JSON tree so the test compiles before the entity field exists.
- [ ] **Step 2: Add a room-reload restore assertion.** Stub the round mapper to return the finished unsaved round, call `service.getRoom(roomId, drawerUserId)`, serialize the response, and assert `pendingArtworks` contains the round ID and stored strokes. Call `getRoom` as the other active member with the same stub result and assert their JSON contains an empty `pendingArtworks` list. Change the round's `snapshotResourceId` to a non-null value and assert it no longer appears. Assert that the restore JSON contains no `word` or `answer` field. In `setUp`, default `roundMapper.selectList(any(QueryWrapper.class))` to an empty list so existing room-view tests keep their original expectations.
- [ ] **Step 3: Assert fresh and upgrade schemas.** In `DrawGuessMigrationTest`, assert the v9 resource exists, adds nullable `drawing_data` to `draw_game_round`, and both fresh-install schema blocks include it. Compare the v8 block to each fresh block after removing only the new `drawing_data` column line, keeping the v8 migration unmodified.
- [ ] **Step 4: Run the focused backend tests and record the expected red.** Run `mvn -f web/backend/pom.xml -Dtest=DrawGuessRoomServiceTest,DrawGuessMigrationTest test`. Expected: test compilation succeeds, and the new persistence/restore/schema assertions fail because the field, response property, and v9 migration do not exist.

## Task 2: Implement additive persistence and scoped room restoration

**Files:**
- Create: `web/backend/src/main/resources/db/migrate_v9_draw_guess_artwork.sql`
- Modify: `web/backend/src/main/resources/db/schema.sql`
- Modify: `docker/mysql/02-app-extension.sql`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/entity/DrawGuessRound.java`
- Create: `web/backend/src/main/java/com/campus/platform/module/drawgame/vo/DrawGuessCompletedArtworkVO.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/vo/DrawGuessRoomVO.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`

- [ ] **Step 1: Add the nullable column to v9 and both fresh schemas.** Use `drawing_data MEDIUMTEXT DEFAULT NULL` in the round table definitions. The upgrade script alters only `draw_game_round`; it must not rewrite or rerun v8's table/seed statements.
- [ ] **Step 2: Add the entity and response types.** Add `private String drawingData;` to `DrawGuessRound`. Define `DrawGuessCompletedArtworkVO(Long roundId, int turnNumber, List<Map<String,Object>> strokes)`. Add `List<DrawGuessCompletedArtworkVO> pendingArtworks` as the last `DrawGuessRoomVO` component.
- [ ] **Step 3: Store strokes before the runtime buffer is cleared.** In `finishCurrentRound`, serialize `runtime.strokes` to `runtime.currentRound.drawingData` before setting status/ended time and calling `roundMapper.updateById`. Wrap the impossible validated-map serialization error in `IllegalStateException`; leave `finishTurn`'s subsequent `runtime.strokes.clear()` in place.
- [ ] **Step 4: Build pending data with both query and service ownership filters.** In `roomView`, use an empty list when `viewerUserId == null` or `member(roomId, viewerUserId)` is absent/inactive; otherwise query finished rounds for the current room where `drawer_user_id` is that viewer, `snapshot_resource_id IS NULL`, and `drawing_data IS NOT NULL`. Filter returned objects again by exact `drawerUserId`, deserialize the JSON as `List<Map<String,Object>>`, and map to the new VO without copying the answer. Treat a null mapper result as an empty list for test/mapping resilience. Add the result as the final constructor argument.
- [ ] **Step 5: Run the focused backend tests.** Run `mvn -f web/backend/pom.xml -Dtest=DrawGuessRoomServiceTest,DrawGuessMigrationTest test`. Expected: all focused service and migration tests pass, including the existing live-game and snapshot ownership tests.

## Task 3: Add a detached-canvas renderer with a failing frontend test

**Files:**
- Modify: `web/frontend/student/src/features/drawGuess/completedArtwork.test.mjs`
- Modify: `web/frontend/student/src/features/drawGuess/completedArtwork.mjs`

- [ ] **Step 1: Add a test for the new renderer export before implementing it.** Import the module namespace and assert `typeof completedArtwork.renderStoredArtwork === 'function'`; add a fake `canvasFactory` with `width`, `height`, `getContext()`, `toDataURL()`, and a recording 2D context (`setTransform`, `save`, `restore`, `beginPath`, `moveTo`, `lineTo`, `stroke`). Assert normalized points, stroke color/width, eraser compositing, and a PNG data URL. Assert invalid or empty stroke data returns `null`.
- [ ] **Step 2: Run the single frontend test file.** Run `node --test web/frontend/student/src/features/drawGuess/completedArtwork.test.mjs`. Expected: the renderer export assertion fails while existing capture/blob tests still pass.
- [ ] **Step 3: Implement the smallest detached renderer.** Add `renderStoredArtwork(strokes, width, height, pixelRatio, canvasFactory)` to create a new canvas, set `canvas.width = Math.round(width * pixelRatio)` and `canvas.height = Math.round(height * pixelRatio)`, scale its context with `setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)`, replay each stored stroke with the same round-cap, round-join, normalized point, color, width, and eraser compositing rules as `Room.vue`, and return `canvas.toDataURL('image/png')`. Reject missing context, empty data, and malformed strokes by returning `null`. Do not accept a reference to the active room canvas.
- [ ] **Step 4: Re-run the single frontend test file.** Expected: all completed-artwork tests pass.

## Task 4: Restore the save actions on room load and verify regressions

**Files:**
- Modify: `web/frontend/student/src/views/drawGuess/Room.vue`
- Verify: `web/frontend/student/src/features/drawGuess/completedArtwork.test.mjs`
- Verify: `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`

- [ ] **Step 1: Seed pending artwork entries from `getDrawGuessRoom`.** After setting `room.value`, wait for `nextTick`, call `redrawCanvas()` to size the visible board, then map `data.pendingArtworks` through `renderStoredArtwork(item.strokes, canvasRef.value.clientWidth, canvasRef.value.clientHeight, window.devicePixelRatio || 1, () => document.createElement('canvas'))`; append only entries that return a valid PNG and whose round IDs are neither saved nor already pending. Preserve `turnNumber` and `roundId` for `saveSnapshot`, then connect the socket.
- [ ] **Step 2: Keep the current board independent.** Use the helper's detached canvas only for a PNG data URL. Keep `redrawCanvas()` drawing only `room.value.strokes` onto `canvasRef`; do not add recovered strokes to `room.value.strokes` or call `clearRect` on the visible board while building saved images.
- [ ] **Step 3: Run focused backend and frontend tests.** Run `mvn -f web/backend/pom.xml -Dtest=DrawGuessRoomServiceTest,DrawGuessMigrationTest test` and `npm test` from `web/frontend/student`. Expected: both exit 0 with no test failures.
- [ ] **Step 4: Build the student frontend.** Run `npm run build` from `web/frontend/student`. Expected: Vite exits 0 and compiles `Room.vue` with the renderer import.

## Review focus

- Confirm pending stroke JSON is persisted before the service clears the runtime strokes.
- Confirm all viewer-facing room views omit another player's drawings and omit answers.
- Confirm a reload during a later turn restores the prior drawer's save action without painting over the active board.
- Confirm old rounds with `drawing_data IS NULL` stay loadable and do not break room views.
- Confirm the additive migration and fresh schemas do not alter v8's existing install contract.
