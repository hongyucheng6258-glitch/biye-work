# Draw-and-Guess Gallery Privacy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exclude saved artwork from private rooms from the shared Campus Gallery while leaving public artwork visible and preserving the eight-item gallery limit.

**Architecture:** Select gallery rounds with one joined mapper query that filters `draw_game_room.private_room = 0` before applying `LIMIT 8`. Keep the existing record mapping, public record shape, and frontend gallery unchanged.

**Tech Stack:** Spring Boot 3, MyBatis, MySQL, JUnit 5, existing authenticated browser session.

**Spec:** `docs/superpowers/specs/2026-09-24-draw-guess-reconnect-and-gallery-privacy.md`

---

## File map

- `web/backend/src/main/java/com/campus/platform/module/drawgame/mapper/DrawGuessRoundMapper.java`: joined public-gallery query.
- `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`: use that query while retaining existing public record mapping.
- `web/backend/src/test/java/com/campus/platform/module/drawgame/db/DrawGuessGalleryQueryTest.java`: assert SQL privacy predicate and limit.
- `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`: verify record mapping requests eight public records.
- No frontend source files change; gallery markup and DTO fields remain stable.

## Global constraints

- `listRecords()` remains authenticated and returns at most eight newest public snapshots.
- SQL must exclude private rooms before `LIMIT 8`; Java filtering after selecting eight mixed records is insufficient.
- Preserve the `DrawGuessRecordVO` fields and public artwork URLs/titles.
- Do not delete rooms, upload records, or artwork files during acceptance cleanup.

## Task 1: Add and use the public-only gallery query

**Files:**
- Create: `web/backend/src/test/java/com/campus/platform/module/drawgame/db/DrawGuessGalleryQueryTest.java`
- Modify: `web/backend/src/test/java/com/campus/platform/module/drawgame/service/DrawGuessRoomServiceTest.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/mapper/DrawGuessRoundMapper.java`
- Modify: `web/backend/src/main/java/com/campus/platform/module/drawgame/service/DrawGuessRoomService.java`

- [ ] **Step 1: Write a failing mapper-query test.** Use reflection to locate `selectPublicGalleryRounds(int)` on `DrawGuessRoundMapper`. Assert it exists, has `@Select`, and its normalized SQL contains `JOIN draw_game_room`, `room.private_room = 0`, `r.status = 'FINISHED'`, `r.snapshot_resource_id IS NOT NULL`, descending `ended_at`, and `LIMIT #{limit}`. Reflection lets the test compile before the method exists; absence fails an assertion.
- [ ] **Step 2: Write a service mapping test.** Reflectively locate the query method, configure the mocked mapper to return one public finished round, stub its room/upload/drawer rows, call `listRecords()`, and assert the public record retains its current title, image URL, drawer name, and turn number. Verify reflectively that the service invoked the public query with `8`.
- [ ] **Step 3: Run focused backend tests and confirm RED.** Run `mvn -f web/backend/pom.xml '-Dtest=DrawGuessGalleryQueryTest,DrawGuessRoomServiceTest' test`. Expected: compilation succeeds and the query-existence assertion fails because no joined gallery method exists.
- [ ] **Step 4: Add the MyBatis query.** Import `org.apache.ibatis.annotations.Param` and `org.apache.ibatis.annotations.Select`; add:

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

- [ ] **Step 5: Route `listRecords()` through that method.** Replace the current round `QueryWrapper` with `roundMapper.selectPublicGalleryRounds(8)`. Keep room/upload/drawer lookups and null checks, and do not change `DrawGuessRecordVO` or the frontend.
- [ ] **Step 6: Run focused tests and confirm GREEN.** Repeat `mvn -f web/backend/pom.xml '-Dtest=DrawGuessGalleryQueryTest,DrawGuessRoomServiceTest' test`. Expected: the SQL predicate/limit test, public record mapping, snapshot ownership, and room service tests pass.
- [ ] **Step 7: Commit the completed task.** Stage only the mapper, service, and two test files; commit with `fix(drawgame): exclude private artwork from gallery`.

## Task 2: Verify live gallery privacy and clean acceptance residue

**Files:**
- No additional production files.

- [ ] **Step 1: Run the backend suite.** Run `mvn -f web/backend/pom.xml test`. Expected: exit 0; report any pre-existing failures by exact test name and output.
- [ ] **Step 2: Verify authenticated gallery behavior.** In the existing two-account acceptance session, refresh the gallery. Confirm the saved temporary private-room artwork is absent, public saved works remain visible, and `/api/draw-guess/records` responds HTTP 200.
- [ ] **Step 3: Identify only the two acceptance rooms.** Query recent rooms for accounts 2021001 and 2021002 and match exact titles `临时验收-画廊保存` and `临时验收-画猜完整流程`; do not act on any other room.
- [ ] **Step 4: Leave the two acceptance rooms through the supported API.** For each matching room, POST `/api/draw-guess/rooms/{roomId}/leave` once for each participant who is still active. Do not issue database deletes or remove the saved artwork resource.
- [ ] **Step 5: Verify recent lists are clean.** Fetch both accounts' recent rooms again and confirm neither exact title remains. Confirm the saved private artwork stays in storage but not in shared gallery results.

## Review focus

- Confirm private filtering executes in SQL before the eight-record limit.
- Confirm public gallery response shape is unchanged.
- Confirm cleanup affects only the two explicitly named acceptance rooms and preserves room/artwork rows.
