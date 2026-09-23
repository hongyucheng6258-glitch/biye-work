# Draw-and-Guess Reconnect and Gallery Privacy

## Problem

When a round ends, `DrawGuessRoomService` marks the round finished and immediately clears its in-memory strokes. The browser can offer the drawer a save action while the `round_ended` event is live, but a reload or reconnect loses that action because completed strokes are not stored. Separately, the shared gallery query includes saved works from private rooms.

The acceptance run also left two finished temporary rooms visible in the participating accounts' recent-room lists. The application has a supported leave operation that deactivates a member, but no room-delete operation. One temporary artwork was intentionally saved and may remain stored; privacy filtering should keep it out of the shared gallery.

## Goals

1. Let a drawer reload or reconnect to a room and recover save actions for their own completed, unsaved rounds.
2. Keep private-room artwork out of the shared gallery while keeping public-room artwork visible.
3. Keep recovered drawing data limited to the room member who drew that round.
4. Remove the two acceptance rooms from the test participants' recent lists through the existing leave operation, without deleting the saved artwork or database history.
5. Preserve the existing live drawing, round transitions, room access checks, upload authorization, and public gallery behavior.

## Proposed design

### Persist completed strokes

Add a nullable `drawing_data` text column to `draw_game_round`. Use a new additive migration for already initialized databases, and include the column in the fresh-install schema and Docker initialization schema. Keep the previous migration immutable. Update the migration consistency test so fresh-install definitions and the new upgrade migration remain aligned.

Before clearing strokes in `finishTurn`, serialize the completed round's validated strokes to its round row. Existing completed rounds have no stored drawing and remain unchanged.

Extend the room response with pending completed artwork entries for the requesting member's own rounds only. Each entry contains the round ID, turn number, and strokes; it does not add the answer or another member's artwork. Include entries only for finished rounds with a stored drawing and no saved snapshot. The room GET already checks active membership, and socket room-state responses are generated per session; retain those checks when constructing entries.

In the browser, rebuild each pending image on a detached canvas from the normalized stroke points and existing color, width, and tool values. Do not paint a prior round over the currently active board. Keep the existing live-event capture path and deduplicate against already saved or pending rounds.

### Filter the shared gallery

Exclude rooms marked private when selecting gallery records. Apply the privacy condition before the gallery's eight-item limit so private entries do not displace public works. Keep the same record shape for public works.

### Clean acceptance residue

Use the existing leave endpoint for both test participants in the two acceptance rooms. This marks their memberships inactive, so those rooms leave their recent-room lists. The room rows and the one accepted temporary artwork remain stored; the gallery filter prevents that private work from appearing publicly.

## Alternatives considered

1. **Browser-only storage:** easier to add, but does not survive a different browser, cleared site data, or reconnecting on another device. It also cannot reliably restore a round after leaving the page.
2. **Keep strokes only in server memory:** survives a tab reload while the process remains alive, but fails after a backend restart and duplicates transient state without improving persistence.
3. **Persist completed strokes by round (recommended):** supports reload, reconnect, and process restart, with a small additive schema change and ownership-scoped responses.

## Safety and compatibility

- The new database column is nullable, so existing rows and saved snapshots remain valid.
- The existing upload endpoint remains the only way to publish a drawing, and its drawer-ownership check remains in force.
- Private-room records are excluded from the shared gallery query; public-room response fields and artwork uploads stay unchanged.
- Tests will cover serialization/persistence, the drawer-only pending response, save-after-reconnect, gallery filtering, migration consistency, and frontend reconstruction without overwriting an active canvas.
- Validation will be limited to draw-and-guess backend and frontend tests, then the existing two-account browser acceptance flow if services are available.

## Out of scope

- Deleting room rows or uploaded resources.
- Restoring rounds completed before this migration, because their strokes were already discarded and were never persisted.
- Changing the game's scoring, word selection, room access, or general gallery layout.

## Review checklist

- [ ] Pending data is returned only to the original drawer who remains an active room member.
- [ ] A reload after the next round starts restores the previous unsaved save action.
- [ ] Finishing a room still permits saving the final drawing.
- [ ] Saved artwork disappears from pending actions and remains in the gallery only when its room is public.
- [ ] A private saved artwork does not appear in shared gallery results or consume the eight-record limit.
- [ ] Existing database rows are unaffected by the additive migration.
- [ ] Temporary rooms no longer appear in either test participant's recent list.
