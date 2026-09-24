# Draw-and-Guess Artwork Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the original drawer's save action for completed rounds after reload or reconnect, including after the next turn begins.

**Architecture:** Persist validated normalized strokes as nullable JSON text on each finished round. Add drawer-scoped pending artworks to the existing room response. Rebuild each recovered PNG on a detached canvas so loading a prior round never overwrites the active board.

**Tech Stack:** Spring Boot 3, MyBatis-Plus, MySQL, Vue 3, Canvas API, JUnit 5, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-24-draw-guess-reconnect-and-gallery-privacy.md`

---

## File map

- `web/backend/src/main/resources/db/migrate_v9_draw_guess_artwork.sql`: additive upgrade for existing databases.
- `web/backend/src/main/resources/db/schema.sql` and `docker/mysql/02-app-extension.sql`: fresh-install definitions; keep their marked schema blocks identical.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/entity/DrawGuessRound.java`: nullable serialized-stroke field.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/vo/DrawGuessCompletedArtworkVO.java`: one drawer-owned restore item.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/vo/DrawGuessRoomVO.java`: add `pendingArtworks`.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`: persist before clearing and construct scoped pending items.
- `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`: persist/restore/ownership regression tests.
- `web/backend/src/test/java/com/campus/platform/module/drawgame/db/DrawGuessMigrationTest.java`: v8 and v9 schema checks.
- `web/frontend/student/src/features/drawGuess/completedArtwork.mjs` and `completedArtwork.test.mjs`: detached image rendering and restoration mapping.
- `web/frontend/student/src/views/drawGuess/Room.vue`: restore pending save buttons without touching the visible board.

## Global constraints

- Keep `migrate_v8_draw_guess.sql` unchanged; existing databases apply the additive v9 migration once.
- Return only finished, unsaved strokes from rounds drawn by the active requesting member. Also filter mapper results in service code.
- Return no pending entries when the viewer membership is absent or inactive, including from `leaveRoom` responses.
- Never include words or answers in `pendingArtworks`.
- Preserve `uploadSnapshot` membership, drawer ownership, and one-snapshot checks.
- Do not change live drawing, active-round replay, room navigation, or live final-round capture.

## Task 1: Persist the strokes of each completed round

**Files:**
- Modify: `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`
- Modify: `web/backend/src/test/java/com/campus/platform/module/drawgame/db/DrawGuessMigrationTest.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/entity/DrawGuessRound.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`
- Modify: `web/backend/src/main/resources/db/schema.sql`
- Modify: `docker/mysql/02-app-extension.sql`
- Create: `web/backend/src/main/resources/db/migrate_v9_draw_guess_artwork.sql`

- [ ] **Step 1: Write a test that completes a round after one validated stroke.** Retain inserted rounds in a list, start a two-player room, send `{"type":"draw","points":[{"x":0.25,"y":0.5}],"color":"#304d99","width":4,"tool":"pen"}` as `playing.drawerUserId()`, then send `skip` as that drawer. Assert the serialized finished round has a `drawingData` field whose JSON contains the submitted point. Use `ObjectMapper.valueToTree(round)` so the test compiles before the entity field exists. In test setup, default `roundMapper.selectList(any(QueryWrapper.class))` to `List.of()`.
- [ ] **Step 2: Write a v9 schema assertion.** Assert a classpath resource named `db/migrate_v9_draw_guess_artwork.sql` exists, that it adds nullable `drawing_data` to `draw_game_round`, and both fresh schema blocks contain the column. Compare v8's block with each fresh block after removing only the new column line; leave the v8 file unchanged.
- [ ] **Step 3: Run the tests and confirm RED.** Run `mvn -f web/backend/pom.xml '-Dtest=DrawGuessRoomServiceTest,DrawGuessMigrationTest' test`. Expected: compilation succeeds and the new stroke/schema assertions fail because persistence and v9 do not exist.
- [ ] **Step 4: Add the column and serialization.** Add `private String drawingData;` to `DrawGuessRound`; add `drawing_data MEDIUMTEXT DEFAULT NULL` after `snapshot_resource_id` in both fresh definitions; create v9 with `ALTER TABLE draw_game_round ADD COLUMN drawing_data MEDIUMTEXT DEFAULT NULL AFTER snapshot_resource_id;`. In `finishCurrentRound`, serialize `runtime.strokes` before setting `FINISHED` and before `roundMapper.updateById`. If serialization throws `JsonProcessingException`, throw `IllegalStateException`; keep the existing later `runtime.strokes.clear()`.
- [ ] **Step 5: Run the focused tests and confirm GREEN.** Repeat the same Maven command. Expected: both test classes pass, and the v8 schema parity assertion still passes after normalizing the one new column.
- [ ] **Step 6: Commit the completed task.** Run `git add` for only the seven files listed above and commit with `feat(drawgame): persist completed round strokes`.

## Task 2: Return only the drawer's pending completed artwork

**Files:**
- Modify: `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`
- Create: `web/backend/src/main/java/com/campus/platform/module/drawgame/vo/DrawGuessCompletedArtworkVO.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/vo/DrawGuessRoomVO.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`

- [ ] **Step 1: Write a reload regression test.** Finish the first of two turns after a non-empty stroke, configure `roundMapper.selectList` to return that finished round, reload through `service.getRoom(roomId, drawerUserId)`, and serialize the response. Assert `pendingArtworks` contains the round ID, turn number, and points, with no `word` or `answer` property. Assert the other active player sees an empty list. Set `snapshotResourceId` on the returned round and assert that it no longer appears. Mark the requesting drawer membership inactive and assert its response has no pending items.
- [ ] **Step 2: Run the focused service test and confirm RED.** Run `mvn -f web/backend/pom.xml '-Dtest=DrawGuessRoomServiceTest' test`. Expected: compilation succeeds and the new pending-artwork response assertions fail because `DrawGuessRoomVO` has no such field.
- [ ] **Step 3: Add the restore DTO and room field.** Define `DrawGuessCompletedArtworkVO(Long roundId, int turnNumber, List<Map<String,Object>> strokes)` and append `List<DrawGuessCompletedArtworkVO> pendingArtworks` to `DrawGuessRoomVO`.
- [ ] **Step 4: Implement member- and drawer-scoped lookup.** In `roomView`, return an empty list for a null viewer or absent/inactive `DrawGuessMember`; otherwise query finished rounds for the room with matching `drawer_user_id`, null snapshot, and non-null drawing data. Filter each returned row again by the viewer ID and null snapshot, deserialize its strokes, and map only round ID, turn number, and strokes. Treat a null mapper result as empty. Append the list to the `DrawGuessRoomVO` constructor.
- [ ] **Step 5: Run backend regressions and confirm GREEN.** Run `mvn -f web/backend/pom.xml '-Dtest=DrawGuessRoomServiceTest' test`. Expected: the new reload/privacy tests and all existing service tests pass.
- [ ] **Step 6: Commit the completed task.** Stage only the DTO, room VO, service, and service test; commit with `feat(drawgame): restore drawer's pending artwork`.

## Task 3: Render stored strokes on a detached canvas

**Files:**
- Modify: `web/frontend/student/src/features/drawGuess/completedArtwork.test.mjs`
- Modify: `web/frontend/student/src/features/drawGuess/completedArtwork.mjs`

- [ ] **Step 1: Write the renderer test first.** Import the module namespace and assert `typeof completedArtwork.renderStoredArtwork === 'function'`. Pass one pen stroke and one eraser stroke to the helper with a fake canvas factory. The fake canvas records `setTransform`, `save`, `restore`, `beginPath`, `moveTo`, `lineTo`, and `stroke`; assert normalized coordinates, color/width, `destination-out`, and a PNG data URL. Assert malformed/empty strokes and a missing context return `null`.
- [ ] **Step 2: Run the helper test and confirm RED.** Run `node --test web/frontend/student/src/features/drawGuess/completedArtwork.test.mjs`. Expected: the new export assertion fails while current capture/blob tests pass.
- [ ] **Step 3: Implement `renderStoredArtwork(strokes, width, height, pixelRatio, canvasFactory)`.** Create a new canvas, size it to `width * pixelRatio` by `height * pixelRatio`, set a matching transform, replay normalized paths with round caps/joins and existing pen/eraser composition, and return `toDataURL('image/png')`. Reject invalid data. Never accept or write to `canvasRef`.
- [ ] **Step 4: Re-run the helper tests and confirm GREEN.** Repeat the Node command. Expected: all tests in the helper file pass.
- [ ] **Step 5: Commit the completed task.** Stage only `completedArtwork.mjs` and its test; commit with `feat(drawgame): rebuild completed artwork from strokes`.

## Task 4: Restore save buttons without replacing the active board

**Files:**
- Modify: `web/frontend/student/src/features/drawGuess/completedArtwork.test.mjs`
- Modify: `web/frontend/student/src/features/drawGuess/completedArtwork.mjs`
- Modify: `web/frontend/student/src/views/drawGuess/Room.vue`

- [ ] **Step 1: Write a restoration-mapping test.** Add a pure helper test for `restorePendingArtworks(entries, renderArtwork, excludedRoundIds)`: it returns valid entries with the original round ID/turn number and PNG data, skips saved IDs, duplicate IDs, missing strokes, and invalid renderer results. Stub `renderArtwork` so the test asserts exact arguments.
- [ ] **Step 2: Run the helper test and confirm RED.** Run `node --test web/frontend/student/src/features/drawGuess/completedArtwork.test.mjs`. Expected: the helper export assertion fails.
- [ ] **Step 3: Implement the mapping helper and connect room loading.** Implement `restorePendingArtworks` as a pure map/filter helper. In `loadRoom`, after `nextTick()` and `redrawCanvas()`, map `data.pendingArtworks` using `renderStoredArtwork(item.strokes, canvasRef.value.clientWidth, canvasRef.value.clientHeight, window.devicePixelRatio || 1, () => document.createElement('canvas'))`; assign only valid, unsaved results to `pendingCompletedArtworks` before connecting the socket.
- [ ] **Step 4: Verify visible-canvas isolation and existing event behavior.** Keep `redrawCanvas()` limited to `room.value.strokes`; keep `round_ended` capture and `saveSnapshot` intact. The recovered data URL must be stored only in `pendingCompletedArtworks` and uploaded through the existing snapshot API.
- [ ] **Step 5: Run full scoped verification.** Run the focused Maven command from Tasks 1–2, `npm test` and `npm run build` from `web/frontend/student`. Expected: backend tests pass, all frontend tests pass, and Vite exits 0. Existing warning output is acceptable only if it is unchanged from baseline.
- [ ] **Step 6: Commit the completed task.** Stage only the helper, helper test, and `Room.vue`; commit with `feat(drawgame): restore save actions after reload`.

## Review focus

- Confirm data is persisted before runtime strokes are cleared.
- Confirm room responses omit other players' art, answers, and inactive-member pending art.
- Confirm saved and legacy-null drawings do not create pending save buttons.
- Confirm detached rendering never overwrites the active canvas.
- Confirm upload ownership checks and public gallery behavior remain unchanged.
