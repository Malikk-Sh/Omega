<!-- AUTO-GENERATED from docs/MILESTONE_*.md. Do not edit manually. -->
# OMEGA — Implemented Milestone Documents

Latest detected milestone: **OMEGA — Milestone 3: THRESHOLD**

---

<!-- Source: docs/MILESTONE_0.md -->
# OMEGA Milestone 0 — Architecture Prototype

Milestone 0 is isolated from the legacy demo. Open `/v2/` through an HTTP server.

## Purpose

Prove the shared canonical-state bridge before story production:

`virtual file -> GameState -> EventBus -> WorldBinding -> Three.js object -> IndexedDB save`

The only authored test binding is:

- virtual path: `/memories/test_photo.img`
- world target: `apartment.photo_frame`
- rule: file exists => photo frame visible

## Acceptance test

1. Serve the repository over HTTP/HTTPS. Do not open the HTML as `file://`.
2. Open `/v2/` on a phone or responsive browser viewport.
3. Open OMEGA OS.
4. Delete `/memories/test_photo.img`.
5. Confirm the photo frame disappears from the apartment immediately.
6. Reload the page.
7. Confirm the deleted state is restored from IndexedDB and the frame remains hidden.
8. Restore the file.
9. Confirm the frame immediately returns.

## Input

Primary:
- left virtual stick: move;
- right-side look zone: camera look;
- interact: opens OMEGA OS in M0;
- OMEGA button: toggle OMEGA OS;
- pause: closes OMEGA OS.

Secondary desktop:
- WASD/arrows: move;
- E: interact;
- Tab: toggle OMEGA OS;
- Escape: close overlay.

## Build/check

The committed `/js/v2/m0/` output is deployable static JavaScript. TypeScript source lives in `/src/`.

```bash
npm install
npm run check:m0
```

The runtime pins Three.js `0.186.0` in the `/v2/index.html` import map. Three.js is a rendering dependency only; canonical game state must never move into Three.js objects.

## Deliberate limitations

This is an architecture slice, not HOME gameplay. The room uses primitive geometry, has no production collision system, no V.E.R.A. NPC, no dialogue progression and no final art. Those belong to Milestone 1.

---

<!-- Source: docs/MILESTONE_1.md -->
# OMEGA — Milestone 1: HOME vertical slice

Status: implementation candidate; requires final mobile acceptance by project owner.

## Purpose

Milestone 1 turns the Milestone 0 architecture test into the first playable HOME scene. Art is intentionally primitive/placeholder. The goal is to validate feel, interaction flow, story presentation, and the world↔OMEGA OS relationship before producing final 3D art.

## Implemented

- Mobile-first first-person movement and look controls.
- A more readable HOME apartment built from primitive Three.js geometry.
- Center-screen raycast interaction with stable gameplay IDs rather than model names.
- Interactable V.E.R.A., computer, mug, and SEA 2017 photograph.
- OMEGA OS may be opened from the world only while the computer is in interaction focus.
- DOM dialogue layer with V.E.R.A. portrait states.
- First-run HOME introduction dialogue.
- `/memories/sea_2017.img` bound to `apartment.photo_frame`.
- `/memories/vera_note.txt` readable from OMEGA OS.
- Delete/restore of SEA 2017 immediately affects the 3D world.
- First photo inspection triggers a one-time subtle anomaly: light instability + temporary silhouette + V.E.R.A. reaction.
- Story flags and filesystem changes persist through IndexedDB.
- M0 save fallback is supported and upgraded in memory to M1 state.
- Vercel build executes TypeScript compilation plus `tests/m1/home.test.mjs`.

## Automated acceptance

`npm run build` must:

1. compile TypeScript into `js/v2/m1`;
2. run the M1 HOME regression test;
3. fail deployment if the SEA 2017 world binding, save/load, restore flow, or story flag persistence regresses.

Expected final line:

```text
M1 HOME regression: PASS
```

## Manual mobile acceptance

On the production URL:

1. Let the V.E.R.A. introduction play and advance all lines.
2. Confirm joystick movement and touch-look work together.
3. Aim at V.E.R.A.; an interaction prompt should appear. Interact and confirm dialogue.
4. Aim at the mug and inspect it.
5. From away from the computer, press the OMEGA OS action and confirm it asks the player to approach the computer instead of opening globally.
6. Approach/aim at the computer and open OMEGA OS.
7. Open `vera_note.txt` and confirm the text is readable.
8. Delete `Море 2017.img`; confirm the wall photograph disappears and `MEMORY LINK: MISSING` is shown.
9. Reload the page; confirm the deleted state persists.
10. Restore `Море 2017.img`; confirm the photograph returns.
11. Aim at the photograph and interact. On first inspection, confirm the light flicker / temporary dark silhouette and follow-up V.E.R.A. lines occur.
12. Reload and verify the anomaly does not replay as a first-time event.

## Known polish item

The photo interaction handler already refuses interaction when its memory file is missing. A future interaction-system cleanup should additionally remove/disable hidden bound entities from raycast candidate evaluation so no stale focus prompt can appear for an invisible object.

## Not part of M1

- Final apartment model/materials/textures.
- Final V.E.R.A. 3D model, rig, facial animation, lip sync.
- Final audio/voice acting.
- Full chapter progression.
- Production puzzle complexity.
- NULL encounter beyond the first anonymous silhouette-like anomaly.

These belong to later milestones; do not block M1 acceptance on final art.

---

<!-- Source: docs/MILESTONE_2.md -->
# OMEGA — Milestone 2: INVESTIGATION

Status: implementation candidate; automated acceptance passed on Vercel preview. Requires final project-owner mobile acceptance.

## Purpose

Milestone 2 introduces the first complete OMEGA investigation loop:

**observe something impossible in HOME → inspect its digital representation → derive a recovery key → restore hidden evidence → see the physical world react → decide what to tell V.E.R.A.**

The milestone intentionally keeps primitive 3D art. Its purpose is to validate mystery pacing and cross-layer gameplay before increasing content scope.

## Implemented

- Dynamic objective controller driven by canonical story flags.
- OMEGA OS navigation between `MEMORY` and `SYSTEM LOGS`.
- Evidence Inspector for `/memories/sea_2017.img` using the existing `sea_2017_polaroid.svg` asset.
- Evidence metadata including original capture timestamp, owner, sector, checksum and anomalous last-write timestamp.
- Mobile-friendly manual Recovery Console with numeric `inputmode`.
- First deduction rule: orphaned memory records use original capture date as `DDMM` recovery signature.
- Recovery key `1703` derived from `17.03.2017`.
- Hidden, initially-deleted `/system/logs/recovery_1703.log`.
- Recovery log contains the first explicit `NULL` process clue.
- Recovery log is not shown in Explorer until successfully recovered.
- New `FileSystemService` support for metadata, evidence artwork, `initiallyDeleted`, hidden-while-deleted records and keyed recovery.
- Persistent world binding from the recovered log to `apartment.null_trace`.
- A subtle glowing impossible doorway/trace appears on HOME's right wall after recovery.
- Hidden world-bound objects are excluded from raycast focus.
- First narrative decision: tell V.E.R.A. about NULL or hide the discovery.
- The choice changes persistent flags and `vera_trust`.
- V.E.R.A. dialogue after the decision reflects the selected branch.
- Existing M0/M1 save data upgrades in place; no manual wipe is required.
- Stable active compiled runtime path at `js/v2/runtime` so future milestones do not test stale milestone builds.

## Automated acceptance

`npm run build` must:

1. compile strict TypeScript to `js/v2/runtime`;
2. run the M1 HOME regression against that active runtime;
3. run the M2 investigation regression;
4. fail deployment if old HOME behavior, recovery behavior, binding behavior, save/load, or choice persistence regresses.

Expected lines:

```text
M1 HOME regression: PASS
M2 INVESTIGATION regression: PASS
```

The M2 regression specifically verifies:

- SEA 2017 metadata exists and contains the intended clue;
- the recovery log starts deleted and hidden;
- wrong recovery signatures do nothing;
- `1703` restores the log;
- restoring the log immediately activates the NULL world binding;
- the recovered log contains the first `NULL` clue;
- narrative choice/trust state survives save/load;
- replacing state/resetting HOME correctly restores `initiallyDeleted` defaults.

## Manual mobile acceptance

Use the normal production URL after merge.

1. Continue from an existing M1 save or reset HOME.
2. Complete the M1 photograph/anomaly sequence if it is not already complete.
3. Confirm the objective changes to **Изучи «Море 2017» в OMEGA OS**.
4. Approach the physical computer and open OMEGA OS.
5. In `MEMORY`, press **Анализ** on `Море 2017.img`.
6. Confirm the Evidence Inspector shows the polaroid and metadata. The relevant captured date is `17.03.2017`.
7. Confirm the objective changes to the recovery task.
8. Enter an incorrect recovery signature first; verify it is rejected and `SYSTEM LOGS` remains empty.
9. Enter `1703`.
10. Confirm the console reports successful recovery and switches to `SYSTEM LOGS`.
11. Open `recovery_1703.log` and confirm it contains `process signature: NULL`.
12. Close OMEGA OS.
13. Confirm V.E.R.A. notices the changed index and asks what was recovered.
14. Confirm two touch-friendly choices appear and the normal dialogue advance action cannot accidentally select/skip them.
15. Choose either **Рассказать ей про процесс NULL** or **Сказать, что ничего важного не нашёл**.
16. Confirm V.E.R.A.'s response matches the selected branch.
17. Look toward the right wall and confirm a faint glowing impossible rectangular trace is now present.
18. Reload the page.
19. Confirm the recovered log, objective completion, NULL trace and chosen V.E.R.A. branch remain persistent.
20. Talk to V.E.R.A. again and confirm her line reflects whether the player told her or hid the evidence.

## Expected player understanding after M2

The player should now understand three core rules without a tutorial screen:

1. Objects in HOME can be manifestations of files.
2. OMEGA OS can reveal information that V.E.R.A. either cannot or will not explain.
3. Information itself can alter HOME, and the player may choose how much of that information to share with V.E.R.A.

The player should **not** yet know what NULL really is.

## Deliberately unresolved

- The glowing right-wall trace does not open yet.
- NULL is not yet presented as a speaking character.
- V.E.R.A. trust is persisted but does not yet drive a large branching dialogue matrix.
- Evidence Inspector has no free pan/pinch forensic zoom in the runtime version yet.
- No final 3D models, final materials, voice acting, or production ambient audio are required for M2 acceptance.

These are later milestone work and must not block M2 acceptance.

---

<!-- Source: docs/MILESTONE_3.md -->
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
