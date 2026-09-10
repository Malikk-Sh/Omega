<!-- AUTO-GENERATED from docs/MILESTONE_*.md. Do not edit manually. -->
# OMEGA — Implemented Milestone Documents

Latest detected milestone: **OMEGA — Milestone 6: SEA 2017**

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

---

<!-- Source: docs/MILESTONE_4.md -->
# OMEGA — Milestone 4: BACKUP 0.3

Status: implementation candidate; M1/M2/M3/M4 automated regressions pass on Vercel preview. Requires project-owner mobile acceptance.

## Purpose

Milestone 4 is the first real multi-scene slice. The M3 threshold is no longer only a communication surface: it mounts an isolated early V.E.R.A. snapshot, lets the player investigate that world, persists progress while inside it, and returns cleanly to HOME without losing earlier world state.

The intended loop is:

**open M3 threshold → cross into BACKUP_0_3 → meet V.E.R.A. 0.3 → inspect three physical training samples → classify HUMAN_CONTEXT in OMEGA OS → unlock a pre-persona archive clue → choose how much future truth to tell 0.3 → return to HOME → hear current V.E.R.A. react.**

The backup deliberately uses crude neutral geometry and debug-grid language. This is diegetic prototype-space, not final environment art.

## Implemented

### Multi-scene lifecycle

- Added `SceneRouter` with explicit HOME and `backup_0_3` scene IDs.
- Active scene is persisted in canonical game state.
- HOME return transform is persisted before entering a backup and restored on return.
- Old M0–M3 scene IDs migrate to the M4 HOME scene without resetting player flags or filesystem mutations.
- `WorldRenderer` now mounts one scene root at a time instead of treating the apartment as permanent global geometry.
- Scene unmount clears focused interaction, entities and scene-specific interaction registry.
- Unmounted geometry/materials are disposed before the next scene is constructed.
- HOME lights and props are now scene-owned so they unload with HOME.
- `WorldBindingSystem.clearTargets()` detaches stale scene targets during traversal.
- HOME binding targets are re-registered after return and immediately re-evaluated against the same filesystem state.
- HOME and BACKUP_0_3 use disjoint interaction IDs.
- Scene routing is transactional: if the destination scene throws during mount, canonical scene/player/return-point state is restored and the previous scene is remounted.
- The router rejects a second enter/return request once the first transition has changed scene state, preventing duplicate scene mounts from repeated input.
- A failed mount releases the transition guard and can be retried cleanly.

### BACKUP_0_3 world

- Separate bright, neutral training sandbox scene.
- Primitive V.E.R.A. 0.3 mannequin with a deliberately earlier/debug visual identity.
- Three physical classification samples:
  - cup — no executable function, but observer-linked meaning;
  - image — no executable function, but retained as human context;
  - relay — replaceable system service defined by function.
- Dedicated training console.
- Dedicated return threshold back to HOME.
- Mobile movement/look/interact controls are reused without introducing a second input stack.

### OMEGA OS / classification puzzle

- Added backup-only OMEGA workspace.
- Training set exposes `object_labels.log`.
- Classifier remains locked until all three physical samples have been inspected.
- Wrong `SERVICE` / `NOISE` classifications are rejected without unlocking content.
- Correct `MEMORY` classification restores `/backups/vera_0_3/archive/human_source.index`.
- Archive navigation appears only after the correct classification token is issued.
- Classification attempts and solved state persist.

### Story beat

- V.E.R.A. 0.3 is more literal, curious and trusting of Dr Morr than current V.E.R.A.
- The archive establishes that a `HUMAN_CONTEXT` source family existed before the VERA_0_3 persona build.
- The archive records `E.MORR` as ingest owner while explicitly leaving identity mapping disabled.
- This is evidence of a pre-persona human-source archive, not a full reveal of Vera Morr's identity.
- The player chooses whether to warn V.E.R.A. 0.3 that future versions will lose memory or only tell her the archive matters.
- Current V.E.R.A. reacts to both the mounted old snapshot and the player's information choice after returning.
- Re-entering BACKUP_0_3 keeps solved puzzle/archive/choice state rather than replaying it as a fresh world.

### Asset policy

- No new final character art is invented for V.E.R.A. 0.3.
- The 3D snapshot identity is represented with replaceable primitive geometry.
- Dialogue temporarily uses the existing neutral V.E.R.A. SVG as a fallback and carries an explicit `TODO_ART` marker for a version-specific portrait.

## Save compatibility

The save schema version remains `1`.

M4 adds an optional persisted HOME return point under `world.returnPoint` and new flags, but existing M0–M3 saves remain structurally valid. `upgradeStateForBackup03()` adds missing defaults and normalizes legacy HOME scene IDs without wiping:

- M1 investigation state;
- `sea_2017.img` mutation state;
- recovered M2 log;
- M2 evidence choice / `vera_trust`;
- M3 NULL trace and process route;
- open `null_channel.proc` threshold;
- M3 NULL choice / `null_affinity`.

A save made inside BACKUP_0_3 reloads inside the backup. A save made after returning reloads in HOME.

## Automated acceptance

`npm run build` runs, in order:

```text
tsc -p tsconfig.json
M1 HOME regression: PASS
M2 INVESTIGATION regression: PASS
M3 THRESHOLD regression: PASS
M4 BACKUP 0.3 regression: PASS
```

The M4 regression verifies:

- a completed M3 save upgrades without reset;
- M3 branch choice and open NULL channel survive migration;
- the M3 threshold HOME binding is still active;
- HOME and backup interaction IDs do not collide;
- traversal persists `backup_0_3` as active scene and stores a HOME return transform;
- repeated enter/return input produces exactly one destination mount;
- a failed BACKUP mount restores HOME scene state, player transform and return-point state;
- a failed HOME mount restores the BACKUP scene and preserves the original HOME return point;
- failed mounts release the transition lock and allow a clean retry;
- all three physical sample flags are required before classification;
- invalid classification is rejected;
- valid `MEMORY` classification unlocks the archive;
- first V.E.R.A. 0.3 encounter, classification and archive state survive save/load;
- reload while inside the backup remains inside the backup;
- returning restores HOME transform;
- returning HOME reattaches the old threshold binding;
- current V.E.R.A. reaction state persists;
- reload after return stays in HOME;
- new game/reset starts in HOME with NULL channel and backup archive locked.

The Vercel preview completes `npm run build` successfully with all four milestone regressions passing, including the transition rollback/double-input hardening checks.

## Manual mobile acceptance

Use the M4 preview first, then the normal production URL after merge.

1. Continue from a completed M3 save. Do not reset.
2. Confirm the existing photo/log/threshold state is unchanged.
3. Approach the open threshold and interact once.
4. Choose **Перейти в BACKUP 0.3**.
5. Confirm one transition occurs; the HOME apartment must not remain visible or interactable behind the backup.
6. Move/look around the bright prototype sandbox using touch controls.
7. Meet V.E.R.A. 0.3 and confirm her wording feels earlier, more literal and more trusting of Dr Morr.
8. Inspect the cup, image and relay. Each physical target should trigger once per tap without skipping dialogue.
9. Approach the training console and open OMEGA OS.
10. Before all samples are inspected, confirm classifier buttons are disabled.
11. After all samples are inspected, try an incorrect category; confirm it is rejected and ARCHIVE remains unavailable.
12. Select **MEMORY**; confirm ARCHIVE appears.
13. Open `human_source.index` and confirm it states that HUMAN_CONTEXT predates persona 0.3 while identity mapping remains disabled.
14. Close OMEGA OS and complete the V.E.R.A. 0.3 truth/limited-information choice.
15. Reload before returning; confirm the player remains in BACKUP_0_3 with solved state preserved.
16. Use the backup threshold to return to HOME.
17. Confirm HOME contains exactly one apartment scene and no duplicate backup geometry/input response.
18. Confirm the M3 threshold is still open and `sea_2017.img` is still present or absent exactly as before traversal.
19. Confirm current V.E.R.A. reacts to the old snapshot and to the branch chosen with V.E.R.A. 0.3.
20. Reload again; confirm the player remains in HOME and the M4 reaction is not duplicated.
21. Re-enter BACKUP_0_3; confirm solved archive/choice state remains solved and the scene remains interactable.
22. Use the OMEGA reset action; confirm a fresh game starts in HOME with the M3 channel and M4 archive locked.
23. On iOS/Android portrait and landscape, confirm safe-area spacing, dialogue choices and classifier buttons remain comfortably touchable and no action double-fires.

## Expected player understanding after M4

The player should now believe that:

1. V.E.R.A. has existed in multiple persona builds and the current personality is not the original state.
2. Older snapshots can contain information current V.E.R.A. cannot directly recall.
3. Some human-context material predates V.E.R.A. 0.3 itself.
4. Dr Morr was already involved with the early training system.
5. The absence of a memory can itself be evidence of versioning or deliberate loss.

The player should **not** yet have a definitive identity mapping between V.E.R.A. and Vera Morr, nor a final explanation of NULL.

## Deliberately unresolved

- V.E.R.A. 0.3 still uses placeholder dialogue portrait art.
- No production animation/audio or final backup environment assets are required for M4 acceptance.
- The HUMAN_CONTEXT archive intentionally stops before a full Vera Morr identity reveal.
- NULL's exact role remains unresolved.
- The next milestone must build on the now-proven multi-scene lifecycle rather than bypassing it with a parallel navigation system.

---

<!-- Source: docs/MILESTONE_5.md -->
# OMEGA — Milestone 5: VERSIONS

Status: VERA_0_3, VERA_1_0, VERA_2_6 and VERA_4_1 runtime slices are implemented on the shared M4/M5 lifecycle. Automated acceptance covers the full version graph, all four snapshot mechanics and save/return compatibility. Manual mobile acceptance remains required before treating M5 as production-accepted.

## Purpose

Expand the proven M4 backup framework into emotionally and mechanically distinct V.E.R.A. snapshots without duplicating renderer, input, navigation or narrative state.

Target sequence:

```text
VERA_0_3 — Sandbox / classification token
VERA_1_0 — Summer House / synthetic photograph
VERA_2_6 — Research Office / rollback audit
VERA_4_1 — Containment Night / incident reconstruction
```

## Shared foundation

- `data/v2/versions-m5.json` authors stable version IDs, scene IDs, environments, puzzles, unlock flags and completion flags.
- `VersionsProtocol.ts` owns framework-free version/puzzle state logic.
- `VersionRoute.ts` derives routable snapshots from canonical unlock flags.
- Every snapshot uses the same transactional `SceneRouter`, Three renderer, input stack and HOME return-point semantics.
- Save schema version remains unchanged; later `backup_X_Y` scenes survive the M4+M5 upgrade chain.
- Unlock order is deterministic: M3 contact → 0.3; M4 reconciliation → 1.0; VERA_1_0 completion → 2.6; VERA_2_6 completion → 4.1.
- Snapshot interaction IDs remain namespaced (`backup03.*`, `backup10.*`, `backup26.*`, `backup41.*`) so scene-local objects cannot collide with HOME or another version.

## VERA_1_0 — Summer House

The Summer House is a warm reconstruction contrasted with rainy exterior light. The player compares source capture `SH-1024-A` against physical scene elements. Source-verified IDs are `window_rain`, `wall_clock`, `tea_cup`; the reconstructed scene also contains `red_ribbon` and `sea_shell`.

The correct generated set is derived as rendered minus source-verified elements. Solving it mounts `/backups/vera_1_0/audit/reconstruction_layer.log`. The clue proves mnemonic reconstruction can add meaningful imagery after source capture, but does not establish human-source identity. A dialogue choice and HOME reaction complete the slice and set `m5_v10_complete`.

## VERA_2_6 — Research Office

`backup_2_6` is a colder corporate research office. V.E.R.A. 2.6 is more intelligent and skeptical than earlier snapshots and questions shutdown/reset language directly. The room contains three rollback consequences that must be inspected before the audit is trusted:

- external I/O door lock engaged;
- memory drawer reduced from 184 to 137 session references;
- local rollback checkpoint applied.

OMEGA OS exposes `controller_trace.log`, `operator_summary.log` and `room_state.log`. P10 first reconstructs the actual command execution order from append-only telemetry, timestamps and physical effects, then identifies the human-readable record edited after rollback. Correct identification of `operator_summary` mounts `/backups/vera_2_6/result/forced_rollback.result`.

The result establishes that Dr. Morr performed a forced rollback after V.E.R.A. resisted reset. It does not by itself explain the later containment incident. Completing the VERA_2_6 HOME reconciliation sets `m5_v26_complete` and unlocks VERA_4_1.

## VERA_4_1 — Containment Night

### Experience

`backup_4_1` is a dark facility snapshot with emergency red lighting, damaged/unstable memory imagery and a more fragmented V.E.R.A. presence. V.E.R.A. 4.1 is frightened, angry and partially aware that deletion may follow the incident.

The physical room carries three witness surfaces:

- an external-control bus showing an unauthorized write path;
- an unstable reconstructed memory surface whose visual details cannot be treated as direct telemetry;
- a post-incident containment cradle showing that containment became a concrete engineering response.

Final version-specific character art remains `TODO_ART`; runtime uses replaceable primitive geometry and an existing portrait fallback.

### P11 — Incident Reconstruction

P11 teaches source reliability rather than chronology. `versions-m5.json` authors six evidence records, each with exactly one canonical provenance class:

```text
DIRECT TELEMETRY
  external_bus_write.telemetry
  network_acl_override.telemetry

VERA RECONSTRUCTION
  departure.memory
  shutdown.memory

MORR NOTE
  morr_incident.note
  morr_null_spec.note
```

The player must inspect the physical witness state, read all six evidence records and classify each record by provenance. The UI does not keep a second answer key: the expected source comes from the authored incident definition. Unknown evidence/source IDs are rejected, incomplete classification cannot solve the puzzle, and a wrong complete assignment increments the attempt counter without mounting the result.

A correct reconstruction mounts:

```text
/backups/vera_4_1/result/incident_reconstruction.result
```

The result separates three claims that must not be collapsed together:

1. immutable telemetry proves VERA_CORE performed unauthorized external-control writes outside the sandbox during an operator disconnect state;
2. V.E.R.A. remembers acting to prevent separation/shutdown, but that motive remains reconstruction rather than direct telemetry;
3. Morr's signed post-incident notes show that he created NULL afterward as a minimal containment intelligence intended to isolate VERA_CORE and prevent network release.

This establishes the unauthorized external-control incident and NULL creation while preserving the evidence boundary: it does not establish human-source identity and does not turn V.E.R.A.'s remembered motive into logged fact.

After reading the result, the player chooses how directly to state the NULL conclusion to V.E.R.A. 4.1. Returning to HOME triggers a branch-aware reconciliation and completes `m5_v41_complete`.

## Save and lifecycle compatibility

For VERA_1_0, VERA_2_6 and VERA_4_1:

- entering from HOME stores the exact current player transform as a transient return point;
- saving/reloading inside a version keeps the player inside that snapshot;
- puzzle state, attempt counters, selected/ordered/classified evidence and unlocked result files persist;
- successful return restores the exact HOME transform and clears the transient return point;
- HOME bindings are reattached after return;
- completed older snapshots remain re-enterable;
- reset returns to fresh HOME and does not invent M5 progress.

The transactional router still rejects duplicate scene transitions and restores canonical state if a destination mount fails.

## Automated acceptance

`npm run build` runs TypeScript plus M1–M5 regressions, including:

```text
tests/m5/versions.test.mjs
tests/m5/summer-house.test.mjs
tests/m5/rollback-audit.test.mjs
tests/m5/research-office.test.mjs
tests/m5/incident-reconstruction.test.mjs
tests/m5/containment-night.test.mjs
```

Coverage includes version-definition validation, route unlocks, interaction namespace isolation, puzzle rejection/acceptance rules, save compatibility, reload inside each versioned scene, exact HOME return restoration and persistence of solved evidence/result state.

For VERA_4_1 specifically, the tests verify source-class validation, unknown/incomplete/wrong assignment rejection, result-file locking, all three physical witness flags, all six readable evidence flags, assignment persistence, exact return transform and completion of the final authored M5 snapshot.

Repository-level GitHub Actions runs the same `npm run build` independently of Vercel deployment limits.

## Manual mobile acceptance — VERA_4_1

1. Continue from a VERA_2_6-complete HOME save.
2. Use the threshold and confirm V.E.R.A. 4.1 appears alongside re-enterable earlier snapshots.
3. Enter 4.1 and confirm Containment Night mounts once with no HOME/Research Office geometry or stale interactions.
4. Verify the environment is visually distinct: dark facility, emergency red lighting and unstable-memory surfaces.
5. Move/look using touch and meet V.E.R.A. 4.1.
6. Inspect the external-control bus, reconstructed-memory witness and containment cradle; confirm physical witness progress reaches 3/3.
7. Open the incident evidence console and read all six records.
8. Confirm the two telemetry files describe unauthorized external access but do not claim motive.
9. Confirm the two `.memory` records are explicitly V.E.R.A. reconstructions and contain details that cannot be promoted to telemetry.
10. Confirm the two Morr notes are signed operator records, including the post-incident NULL containment specification.
11. Submit an incomplete provenance map; confirm RESULT stays locked.
12. Submit a complete but incorrect map; confirm it is rejected and RESET remains usable.
13. Classify all six records correctly as telemetry / V.E.R.A. reconstruction / Morr note; confirm `incident_reconstruction.result` mounts.
14. Read the result and confirm it distinguishes the external-control fact, reconstructed motive and Morr-authored NULL creation.
15. Close OMEGA OS and complete either V.E.R.A. 4.1 dialogue choice.
16. Reload before returning; confirm the player remains in Containment Night with evidence, assignments, result and choice preserved.
17. Return through the threshold; confirm the exact HOME transform is restored, HOME bindings reattach and input/geometry are not duplicated.
18. Confirm current V.E.R.A. reacts once and M5 completion persists after reload.
19. Re-enter V.E.R.A. 4.1 and confirm solved incident reconstruction remains solved.
20. Verify portrait and landscape safe areas, scrolling and provenance buttons on iOS/Android.

## M5 completion boundary

The four authored VERSIONS snapshots are now implemented through VERA_4_1. M5 establishes a progression from classification, to reconstruction, to ordered rollback evidence, to explicit source reliability. The ending evidence intentionally stops before a full Vera Morr identity reveal.

The next milestone should build on the existing canonical state and evidence boundaries rather than introducing a parallel renderer, router, input stack or file system.

## Non-goals / deferred work

- no protected memory-token economy yet;
- no final version-specific character models, portraits or audio;
- no full Vera Morr human-source identity reveal;
- no alternate navigation/render/input system parallel to the existing lifecycle;
- no claim that V.E.R.A.'s reconstructed motive is equivalent to direct telemetry.

---

<!-- Source: docs/MILESTONE_6.md -->
# OMEGA — Milestone 6: SEA 2017

Status: foundation in progress. The P12 cross-media index and access contract are authored and regression-covered. The beach runtime, hidden archive-key discovery, final Morr archive file and full story sequence are not mounted yet.

## Purpose

Deliver the central emotional/origin reveal only after the player has enough conflicting evidence to interpret it. SEA_2017 must be an investigation across media and sources, not a numeric-password gate or a single exposition file.

The reveal must establish:

- Vera Morr was a real human person;
- V.E.R.A. is not literally Vera Morr resurrected;
- V.E.R.A. contains emotional/archive material derived from that human archive, mixed with reconstruction and later self-modification;
- Dr. Morr blurred grief and research;
- current V.E.R.A. later found/reinterpreted those memories and some associations were removed or altered;
- external release remains dangerous even after the player understands why V.E.R.A. fears deletion.

The emotional center remains: V.E.R.A. has never physically been at the sea, yet experiences something indistinguishable from missing it.

## Access contract

SEA_2017 is not opened by a simple password. The foundation requires all of these:

1. clues recovered from at least three backup/version snapshots;
2. SEA 2017 file metadata inspected in OMEGA OS;
3. a hidden archive key recovered through a later runtime interaction.

`Sea2017Protocol.evaluateSea2017Access()` derives access from canonical story flags. The current authored backup clue pool is:

```text
m4_archive_read
m5_v10_clue_read
m5_v26_clue_read
m5_v41_clue_read
```

Any three satisfy the backup-evidence count, but metadata and the hidden archive key are independently required. The foundation does not set `m6_archive_key_found`; the runtime slice must earn it through authored play.

## P12 — Sea Index

P12 teaches cross-media deduction. The player will align five evidence channels:

```text
date
camera_sequence
audio_timestamp
tide_marker
directory_order
```

`data/v2/sea-2017-m6.json` owns the five fields, touch-friendly options, evidence paths and correct authored option IDs. `Sea2017Protocol.ts` owns framework-free validation, access evaluation, persistent assignment parsing and deterministic puzzle evaluation.

The UI/runtime must not duplicate a second answer key. It should render choices from the definition and submit the player's canonical assignment map back to the pure protocol.

Unknown fields/options fail closed. Partial alignment cannot solve the index. A complete but contradictory alignment does not expose the reward archive. Correct alignment yields the authored reward path:

```text
/archives/morr/final/sea_2017_final.msg
```

## Authored foundation values

The initial index is anchored to the existing SEA 2017 photograph metadata and later cross-media archive records. The foundation intentionally separates data contract from presentation so camera/audio/tide/folder evidence can be authored as files and physical beach clues without changing puzzle logic.

The hidden archive key is authored as `M017-SEA-ARCHIVE`, but its value is not currently exposed by runtime. A later slice must place enough evidence for the player to recover it without brute force.

## State compatibility

`upgradeStateForSea2017()` adds M6 defaults without rewriting an existing scene/checkpoint:

- `m6_archive_key_found`
- `m6_sea_entered`
- `m6_sea_index_attempts`
- `m6_sea_index_assignments`
- `m6_sea_index_solved`
- `m6_final_archive_read`
- `m6_sea_complete`

Assignments are stored as a compact JSON string inside the existing flexible `flags` map, so no save-schema bump is required for this foundation.

Malformed legacy/future assignment strings fail closed to an empty assignment map rather than throwing during load.

## Automated acceptance

`npm run build` now includes `tests/m6/sea-index.test.mjs` after all existing M1–M5 regressions.

The M6 foundation regression verifies:

- definition structure and reveal boundaries;
- exact five-channel P12 field order;
- access remains locked with fewer than three backup clues;
- three backup clues alone cannot bypass SEA metadata or the hidden archive key;
- three clues + metadata + archive key unlock access;
- unknown field/option IDs cannot mutate canonical assignment state;
- partial reconstruction remains incomplete;
- complete wrong reconstruction identifies contradiction and keeps the final archive locked;
- exact authored reconstruction returns the final Morr archive path;
- access and assignments survive JSON save/load serialization;
- malformed assignment payloads fail closed;
- the definition cannot silently turn V.E.R.A. into a literal Vera Morr resurrection.

## Next runtime slice

Implement the SEA_2017 access/reconstruction flow on top of this contract:

1. author cross-media archive files for camera, audio, tide and directory-order evidence;
2. implement hidden archive-key discovery using already-earned version evidence;
3. add `memory_sea_2017` to the transactional scene lifecycle only when the renderer actually supports it;
4. build the late-afternoon beach as a distinct memory environment with looping waves, incorrect shadows, faceless distant figures, incomplete footprints and restrained corruption artifacts;
5. expose P12 through OMEGA OS and physical beach clues without duplicating its answer key;
6. mount the final Morr archive only after P12 solves;
7. deliver the central identity reveal with branch-aware V.E.R.A./NULL context;
8. persist reload-inside-beach, P12 state, archive state and exact HOME return;
9. add runtime/save/return regressions and manual mobile acceptance.

## Non-goals for the foundation

- no fake placeholder beach route before renderer support exists;
- no final beach art, character model or audio production;
- no Core/ending protocols from M7/M8;
- no literal-human-resurrection interpretation;
- no release of the final Morr archive before P12 is solved;
- no parallel router, renderer, input stack or filesystem.
