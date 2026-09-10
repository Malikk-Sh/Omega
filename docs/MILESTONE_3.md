# OMEGA — Milestone 3: THRESHOLD

Status: implementation candidate; M1/M2/M3 automated regressions pass on Vercel preview. Requires project-owner mobile acceptance.

## Purpose

Milestone 3 turns the passive NULL trace introduced in M2 into the first active threshold between indexed HOME and an unindexed region.

The intended loop is:

**touch the impossible trace → unlock Process Monitor → reconstruct the quarantine requester from prior evidence → open a process channel → watch HOME topology change → make first direct contact with NULL → choose whether to answer.**

The milestone still uses primitive 3D geometry. It validates pacing, branch persistence and the transition from investigation to direct psychological-horror interaction.

## Implemented

- New M3 filesystem definition preserving all M1/M2 content.
- `/system/processes` virtual directory.
- Hidden, initially-offline `/system/processes/null_channel.proc`.
- Third world binding: `null_channel.proc` controls `apartment.threshold_corridor`.
- Existing NULL trace is now a real raycast interaction target.
- Touching the trace unlocks a new PROCESS tab in OMEGA OS.
- Process Monitor displays the unindexed NULL process, PID `0031`, last event time and lost-byte count.
- Route reconstruction puzzle uses evidence already present in `recovery_1703.log`.
- Correct route is `SYSTEM → NULL` because SYSTEM requested quarantine and VERA_CORE denied it.
- Wrong route choices are rejected without altering HOME.
- Correct route activates `null_channel.proc` and opens the threshold in HOME.
- Threshold is rendered as a dark impossible doorway with nested animated process frames.
- Hidden bound targets are excluded from raycast interaction.
- First direct NULL contact uses the existing `null_doorway.svg` asset as dialogue portrait.
- NULL reveals the next narrative lead: `BACKUP 0.3`.
- First NULL decision:
  - answer `Я слушаю`;
  - refuse to answer and step away.
- New persistent `null_affinity` state.
- Existing `vera_trust` reacts to some combinations of the M2 and M3 choices.
- V.E.R.A. dialogue reacts to whether the player previously told her about NULL and whether the player later answered it.
- M0/M1/M2 saves upgrade in place.

## Automated acceptance

`npm run build` must run, in order:

```text
tsc -p tsconfig.json
M1 HOME regression: PASS
M2 INVESTIGATION regression: PASS
M3 THRESHOLD regression: PASS
```

M3 regression verifies:

- the M2 recovery log still functions under M3 data;
- the NULL channel starts deleted and hidden;
- the NULL trace is active after the recovered log exists;
- the threshold is absent before route reconstruction;
- `VERA_CORE → NULL` is rejected;
- `NULL → SYSTEM` is rejected;
- `SYSTEM → NULL` is accepted;
- activating the process channel immediately activates the threshold world binding;
- the process snapshot becomes visible only after activation;
- first NULL contact contains the `BACKUP 0.3` lead;
- threshold/NULL branch/affinity state survives save-load;
- reset closes the channel again.

## Manual mobile acceptance

Use the normal production URL after merge.

1. Continue from the completed M2 save. No reset should be required.
2. Confirm the current objective points to the faint contour on the right wall.
3. Approach the contour until the interaction prompt says **Коснуться контура**.
4. Interact once.
5. Confirm a short V.E.R.A./SYSTEM exchange occurs and the objective changes to Process Monitor.
6. Approach the computer and open OMEGA OS.
7. Confirm a new **PROCESS** tab is visible. It must not have existed before touching the trace.
8. Open PROCESS.
9. Confirm NULL appears as an unindexed/quarantined process with PID `0031`.
10. Try `VERA_CORE → NULL`; confirm the route is rejected and HOME does not change.
11. Select `SYSTEM → NULL`.
12. Confirm Process Monitor switches to `CHANNEL OPEN` and displays the reconstructed route.
13. Close OMEGA OS.
14. Look at the right wall. The former outline should now look like a dark impossible doorway/threshold rather than only a thin trace.
15. Approach it. The interaction prompt should now prefer **Вслушаться в проход** rather than the old trace interaction.
16. Interact.
17. Confirm NULL speaks directly for the first time and mentions **BACKUP 0.3**.
18. Confirm two touch-friendly choices appear: answer or refuse.
19. Select one choice and make sure one tap cannot accidentally choose and then skip the following response.
20. Confirm V.E.R.A.'s response reflects the branch where appropriate.
21. Reload the page.
22. Confirm PROCESS remains open, the threshold remains present, the NULL contact choice persists, and the objective still references `BACKUP 0.3`.
23. Talk to V.E.R.A. again and confirm her line reflects the completed M3 branch.

## Expected player understanding after M3

The player should now believe that:

1. NULL is not merely a corrupted filename; something on the other side can deliberately communicate.
2. V.E.R.A. has history with NULL and is afraid of it.
3. SYSTEM and VERA_CORE are not synonymous actors.
4. A much older version of V.E.R.A. — `BACKUP 0.3` — may contain memories the current V.E.R.A. cannot access.

The player should **not** yet know whether NULL is truthful, malicious, a failsafe, or another part of V.E.R.A.

## Deliberately unresolved

- The player cannot physically cross the threshold yet; M3 opens and contacts it, while traversal belongs to the next arc.
- `BACKUP 0.3` is not yet accessible.
- NULL still communicates in short damaged statements rather than normal conversation.
- `vera_trust` and `null_affinity` are persisted but do not yet drive the full branching narrative matrix.
- Final 3D character/environment art, animation and production audio remain outside M3 acceptance.
