# Draw-and-Guess Gallery Privacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exclude saved artwork from private rooms from the shared Campus Gallery while leaving public artwork visible and preserving the eight-item gallery limit.

**Architecture:** Select gallery rounds with one joined mapper query that filters `draw_game_room.private_room = 0` before applying `LIMIT 8`. Keep record display mapping and public room artwork fields unchanged. Clean only the two acceptance-run memberships using the existing leave API after the implementation is live.

**Tech Stack:** Spring Boot 3, MyBatis, MySQL, JUnit 5, existing authenticated browser session.

**Spec:** `docs/superpowers/specs/2026-09-24-draw-guess-reconnect-and-gallery-privacy.md`

---

## File map

- `web/backend/src/main/java/com/campus/platform/module/drawgame/mapper/DrawGuessRoundMapper.java`: joined public-gallery query.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`: use the query while retaining existing record mapping.
- `web/backend/src/test/java/com/campus/platform/module/drawgame/db/DrawGuessGalleryQueryTest.java`: assert SQL privacy predicate and limit order.
- `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`: verify list-record mapping uses the public query.
- No frontend file changes are required; the gallery already renders the returned record list.

## Global constraints

- `listRecords()` remains authenticated and returns at most eight newest public snapshots.
- The SQL predicate for public rooms must run before `LIMIT 8`; filtering only the first eight mixed records in Java is insufficient.
- Preserve `DrawGuessRecordVO` fields and public-room artwork URL/title behavior.
- Do not delete room rows, upload rows, or artwork files during test cleanup.

## Task 1: Add a failing query and service contract test

**Files:**
- Create: `web/backend/src/test/java/com/campus/platform/module/drawgame/db/DrawGuessGalleryQueryTest.java`
- Modify: `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`

- [ ] **Step 1: Assert the public query exists and filters before its limit.** Use reflection over `DrawGuessRoundMapper.class.getDeclaredMethods()` to find `selectPublicGalleryRounds(int)`. Assert the method exists, has `@Select`, and its SQL includes `JOIN draw_game_room`, `private_room = 0`, finished/snapshot conditions, newest-first ordering, and `LIMIT #{limit}`. Normalize whitespace and case before checks. The test compiles before the mapper method exists and fails as an assertion.
- [ ] **Step 2: Assert the service asks for exactly eight public records.** Add a service test that stubs the mapper's new public query to return public rounds, stubs their room/resource/drawer entities, calls `listRecords()`, asserts the returned list and titles/URLs, and verifies a query with limit `8`. To keep the test source compiling before the method exists, locate and invoke the mapper method reflectively, first asserting it was found.
- [ ] **Step 3: Run the focused backend tests.** Run `mvn -f web/backend/pom.xml -Dtest=DrawGuessGalleryQueryTest,DrawGuessRoomServiceTest test`. Expected: the new query-existence assertion fails because the mapper has no private-room filter yet.

## Task 2: Implement database-side privacy filtering

**Files:**
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/mapper/DrawGuessRoundMapper.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`

- [ ] **Step 1: Add the mapper query.** Import `org.apache.ibatis.annotations.Param` and `org.apache.ibatis.annotations.Select`, then add a method annotated with:

```java
@Select("""
        SELECT r.*
        FROM draw_game_round r
        INNER JOIN draw_game_room room ON room.id = r.room_id
        WHERE r.status = 'FINISHED'
          AND r.snapshot_resource_id IS NOT NULL
          AND room.private_room = 0
        ORDER BY r.ended_at DESC
        LIMIT #{limit}
        """)
List<DrawGuessRound> selectPublicGalleryRounds(@Param("limit") int limit);
```

- [ ] **Step 2: Route `listRecords()` through the public query.** Replace the current round `QueryWrapper` with `roundMapper.selectPublicGalleryRounds(8)`. Keep the existing room, upload, and drawer lookups used for captions and URL mapping, and retain null checks for missing related rows.
- [ ] **Step 3: Run the focused backend tests.** Run `mvn -f web/backend/pom.xml -Dtest=DrawGuessGalleryQueryTest,DrawGuessRoomServiceTest test`. Expected: SQL assertions, public record mapping, existing drawer snapshot rules, and current room tests pass.

## Task 3: Verify public behavior and clean acceptance residue

**Files:**
- No production files beyond Tasks 1–2.

- [ ] **Step 1: Run the complete backend test suite.** Run `mvn -f web/backend/pom.xml test`. Expected: exit 0; if unrelated baseline failures occur, report the exact failing test names and outputs.
- [ ] **Step 2: Check authenticated gallery behavior.** With the existing two-account acceptance session, refresh `/draw-guess` and verify the saved temporary private-room artwork is absent while saved public-room artwork, if present, still appears. Confirm the records endpoint returns HTTP 200.
- [ ] **Step 3: Remove the two temporary rooms from both recent lists.** Query each acceptance account's recent rooms, identify only titles `临时验收-画廊保存` and `临时验收-画猜完整流程`, then POST the existing `/api/draw-guess/rooms/{roomId}/leave` endpoint for each active participant. Re-query both recent lists and verify neither room remains. Do not issue SQL deletes; the one permitted saved artwork remains in storage and is hidden by the public-gallery query.

## Review focus

- Confirm SQL excludes private room IDs before applying the eight-result limit.
- Confirm gallery endpoint response remains unchanged for public snapshots.
- Confirm cleanup targets only the two explicitly named acceptance rooms and leaves artwork/resource rows intact.
