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