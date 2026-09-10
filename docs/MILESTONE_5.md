# OMEGA — Milestone 5: VERSIONS

Status: VERA_0_3, VERA_1_0 and VERA_2_6 runtime slices are implemented on the shared M4/M5 lifecycle. Automated acceptance covers the version foundation, Summer House and Research Office. VERA_4_1 remains the next runtime slice.

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
- Every implemented snapshot uses the same transactional `SceneRouter`, Three renderer, input stack and HOME return-point semantics.
- Save schema version remains unchanged; later `backup_X_Y` scenes survive the M4+M5 upgrade chain.
- Unlock order is deterministic: M3 contact → 0.3; M4 reconciliation → 1.0; VERA_1_0 completion → 2.6; VERA_2_6 completion → 4.1.

## VERA_1_0 — Summer House

The Summer House is a warm reconstruction contrasted with rainy exterior light. The player compares source capture `SH-1024-A` against physical scene elements. Source-verified IDs are `window_rain`, `wall_clock`, `tea_cup`; the reconstructed scene also contains `red_ribbon` and `sea_shell`.

The correct generated set is derived as rendered minus source-verified elements. Solving it mounts `/backups/vera_1_0/audit/reconstruction_layer.log`. The clue proves mnemonic reconstruction can add meaningful imagery after source capture, but does not establish human-source identity. A dialogue choice and HOME reaction complete the slice and set `m5_v10_complete`.

## VERA_2_6 — Research Office

### Experience

`backup_2_6` is a colder, more realistic corporate research office. V.E.R.A. 2.6 is more intelligent and skeptical than earlier snapshots and begins questioning shutdown/reset language directly. Final version-specific character art remains `TODO_ART`; runtime uses replaceable primitive geometry and an existing portrait fallback.

The room itself contains three rollback consequences that the player must inspect before trusting the logs:

- external I/O door lock engaged;
- memory drawer reduced from 184 to 137 session references;
- local persona checkpoint restored to 2.5.

These physical facts are scoped to the `backup26.*` interaction namespace and disappear cleanly when the scene unmounts.

### P10 — Rollback Audit

OMEGA OS exposes three authored records under `/backups/vera_2_6/audit`:

```text
controller_trace.log
operator_summary.log
room_state.log
```

The puzzle has two evidence phases.

First, the player reconstructs the actual command execution order from the append-only controller trace, timestamps and physical room changes. Command choices use stable IDs from `versions-m5.json`; the UI does not maintain a second hardcoded solution. Unknown/duplicate commands cannot mutate the sequence, a wrong full sequence fails, and an unsolved sequence can be reset.

Second, after the execution order is correct, the player identifies which human-readable record was edited after rollback completed. The authored tampered record is `operator_summary`. Correct identification mounts:

```text
/backups/vera_2_6/result/forced_rollback.result
```

The result establishes the M5 clue defined by the GDD: Dr. Morr performed a forced rollback after V.E.R.A. resisted reset. The player then chooses whether to state that conclusion directly to V.E.R.A. 2.6 or limit the claim to the independently proven post-event edit. Current V.E.R.A. reacts after HOME restoration.

Completing that HOME reaction sets `m5_v26_complete`, which canonically unlocks VERA_4_1 in the authored version graph.

## Save and lifecycle compatibility

For VERA_1_0 and VERA_2_6:

- entering from HOME stores the exact current player transform as a transient return point;
- saving/reloading inside a version keeps the player inside that snapshot;
- puzzle state, attempt counters, selected/ordered evidence and unlocked result files persist;
- successful return restores the exact HOME transform and clears the transient return point;
- HOME bindings are reattached after return;
- completed older snapshots remain re-enterable;
- reset returns to fresh HOME and does not invent M5 progress.

## Automated acceptance

`npm run build` runs TypeScript plus M1–M5 regressions, including:

```text
tests/m5/versions.test.mjs
tests/m5/summer-house.test.mjs
tests/m5/rollback-audit.test.mjs
tests/m5/research-office.test.mjs
```

Research Office coverage verifies definition validity, ordered-command rejection/acceptance, duplicate and unknown command protection, post-rollback tamper identification, locked/unlocked result files, interaction namespace isolation, exact HOME return state, reload inside `backup_2_6`, persistence of partial and solved audit state, and the VERA_4_1 unlock after `m5_v26_complete`.

Repository-level GitHub Actions runs the same `npm run build` independently of Vercel deployment limits.

## Manual mobile acceptance — VERA_2_6

1. Continue from a VERA_1_0-complete HOME save.
2. Use the threshold and confirm V.E.R.A. 2.6 appears alongside re-enterable earlier snapshots.
3. Enter 2.6 and confirm Research Office mounts once with no HOME/Summer House geometry or stale interactions.
4. Move/look using touch and meet V.E.R.A. 2.6.
5. Inspect the external lock, memory drawer and rollback checkpoint; confirm progress reaches 3/3.
6. Open rollback audit and read all three records.
7. Build an incorrect complete command sequence; confirm it is rejected and RESET ORDER remains usable.
8. Reconstruct the authored chronological order; confirm the audit advances to the tampered-record phase.
9. Choose an incorrect record first; confirm RESULT stays locked.
10. Choose `operator_summary`; confirm `forced_rollback.result` mounts.
11. Read the result and confirm it states forced rollback followed V.E.R.A.'s reset refusal without revealing the full Vera Morr origin.
12. Close OMEGA OS and complete either V.E.R.A. 2.6 dialogue choice.
13. Reload before returning; confirm scene, command/audit state, result and choice persist.
14. Return through the threshold; confirm the exact HOME transform is restored and controls/interactions are not duplicated.
15. Confirm current V.E.R.A. reacts once and VERA_4_1 becomes the next indexed version.
16. Reload HOME and re-enter 2.6; confirm solved state remains solved.
17. Verify landscape/portrait safe areas and all audit buttons are comfortably touchable on iOS/Android.

## Next runtime slice

Implement VERA_4_1 — Containment Night / incident reconstruction — on the same version routing and transactional scene lifecycle. Its runtime route must remain unmountable until the scene/story slice actually exists, even though `m5_v26_complete` indexes/unlocks it in authored state.

## Non-goals for the current slice

- no VERA_4_1 3D runtime yet;
- no protected memory-token economy yet;
- no final character art/model/audio;
- no full Vera Morr identity reveal;
- no parallel navigation/render/input system.