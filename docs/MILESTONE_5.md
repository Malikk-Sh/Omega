# OMEGA — Milestone 5: VERSIONS

Status: VERA_1_0 Summer House runtime slice implemented on top of the merged M5 foundation. Automated acceptance covers the foundation and Summer House lifecycle; VERA_2_6 and VERA_4_1 remain future runtime slices.

## Purpose

Expand the proven M4 backup framework into a sequence of emotionally and mechanically distinct V.E.R.A. snapshots without rebuilding BACKUP 0.3 or moving narrative state into Three.js.

Target sequence:

```text
VERA_0_3 — Sandbox / classification token
VERA_1_0 — Summer House / synthetic photograph
VERA_2_6 — Research Office / rollback audit
VERA_4_1 — Containment Night / incident reconstruction
```

## Foundation

- `data/v2/versions-m5.json` authors stable version IDs, scene IDs, environments, puzzles, unlock flags and completion flags.
- `VersionsProtocol.ts` owns framework-free version/puzzle state logic.
- `VersionRoute.ts` resolves routable snapshots from canonical unlock flags.
- Route targets are unique, cannot alias HOME and always declare HOME as the return scene.
- Unlock order is deterministic: M3 contact → 0.3; M4 reconciliation → 1.0; VERA_1_0 completion → 2.6; VERA_2_6 completion → 4.1.
- M5 state defaults preserve M1–M4 state and do not rewrite an existing scene/checkpoint.

## VERA_1_0 — Summer House runtime

The M4 threshold becomes a version selector after VERA_0_3 is reconciled. Only implemented and canonically unlocked routes are presented. VERA_0_3 remains re-enterable; VERA_1_0 appears after `m4_home_reaction_seen`.

VERA_1_0 uses the same transactional `SceneRouter` as M4. `backup_1_0` has its own spawn, bounds, scene-owned geometry, interaction namespace and HOME return point. No second renderer, input manager or navigation system is introduced.

The Summer House is visually distinct from both HOME and the VERA_0_3 training sandbox: warm interior materials, cold rainy window light, a source terminal, reconstructed photograph, domestic objects and an early V.E.R.A. 1.0 primitive avatar. Final version-specific character art remains `TODO_ART`.

## Synthetic Photograph puzzle

Source capture `SH-1024-A` verifies only:

```text
window_rain
wall_clock
tea_cup
```

The reconstructed scene contains:

```text
window_rain
wall_clock
tea_cup
red_ribbon
sea_shell
```

The correct generated set is derived rather than hardcoded into the interaction path:

```text
red_ribbon
sea_shell
```

Player flow:

1. meet V.E.R.A. 1.0;
2. read `/backups/vera_1_0/source/photo_SH-1024-A.record` in OMEGA OS;
3. inspect the reconstructed photograph;
4. toggle physical scene elements by stable evidence ID;
5. compare the selected set to the source-derived generated set;
6. correct selection mounts `/backups/vera_1_0/audit/reconstruction_layer.log`;
7. read the audit and answer V.E.R.A. 1.0;
8. return to HOME and hear current V.E.R.A. reconcile the result.

Partial selection, selecting source-verified elements and unknown element IDs cannot solve the audit. Selected element IDs and attempt count persist through save/load.

The audit establishes that meaningful details may be produced by a mnemonic reconstruction layer after source capture. It explicitly does **not** establish the identity of the human source or equate V.E.R.A. with Vera Morr.

## V.E.R.A. 1.0 story beat

V.E.R.A. 1.0 is more socially developed than 0.3 and already treats reconstructed memory as potentially useful even when it is not literal camera truth. She still speaks about Dr Morr with trust.

After the audit, the player chooses whether to tell 1.0 directly that the ribbon and shell were added by a memory/reconstruction layer or to withhold conclusions about the source of those associations. Current V.E.R.A. reacts to that branch after HOME restoration.

Completing the HOME reaction sets `m5_v10_complete`, which canonically unlocks VERA_2_6 in the authored version graph. VERA_2_6 is indexed but not mountable until its runtime slice exists.

## Save and lifecycle compatibility

- save schema version remains unchanged;
- M4 upgrader now preserves later versioned scene IDs such as `backup_1_0` instead of coercing them to HOME;
- save inside Summer House reloads inside `backup_1_0`;
- transient HOME return transform survives that reload;
- successful return restores the exact HOME transform and clears the transient return point;
- existing HOME bindings are reattached after return;
- VERA_0_3 remains re-enterable with its solved state intact;
- reset returns to fresh HOME with VERA_1_0 progress and audit locked.

## Automated acceptance

`npm run build` runs TypeScript plus M1–M5 regressions. The M5 suite now contains both the foundation regression and `tests/m5/summer-house.test.mjs`.

The Summer House regression verifies:

- VERA_1_0 unlocks only after M4 completion;
- its interaction namespace does not collide with HOME or VERA_0_3;
- entering produces exactly one `backup_1_0` mount and stores exact HOME return state;
- duplicate enter is rejected;
- source record is available while audit clue starts locked;
- physical selections persist by stable ID;
- partial and source-overselected audits fail;
- exact `red_ribbon + sea_shell` succeeds;
- successful audit restores the audit clue;
- save/reload inside VERA_1_0 remains inside the snapshot;
- the older M4 upgrader does not rewrite the later-version checkpoint;
- selected evidence and unlocked audit survive save/load;
- HOME return restores exact transform and rejects duplicate return;
- VERA_1_0 completion unlocks VERA_2_6;
- fresh reset state keeps VERA_1_0 progress and audit locked.

A repository-level GitHub Actions workflow now executes `npm run build` independently of Vercel, so deployment rate limits no longer substitute for compiler/regression validation.

## Manual mobile acceptance

1. Continue from an M4-complete save.
2. Use the HOME threshold and confirm the version selector shows V.E.R.A. 1.0 plus the re-enterable 0.3 route.
3. Enter V.E.R.A. 1.0 once and confirm only one Summer House scene mounts.
4. Confirm HOME geometry/interactions are absent while inside the snapshot.
5. Move/look on touch and meet V.E.R.A. 1.0.
6. Open the source terminal and read `photo_SH-1024-A.record`.
7. Inspect the reconstructed photograph.
8. Select one generated object and confirm the audit remains incomplete.
9. Select a source-verified object, confirm rejection, then toggle it back off.
10. Select only the red ribbon and sea shell; confirm AUDIT becomes available.
11. Read `reconstruction_layer.log` and confirm it says reconstruction is proven but identity is not.
12. Close OMEGA OS and complete either V.E.R.A. 1.0 dialogue choice.
13. Reload before returning; confirm the player remains in Summer House with puzzle/audit/choice state preserved.
14. Return through the threshold and confirm the exact HOME state is restored with no duplicate geometry/input behavior.
15. Confirm current V.E.R.A. reacts once and VERA_2_6 becomes the next indexed version.
16. Reload HOME; confirm the reaction does not duplicate.
17. Re-enter V.E.R.A. 1.0 and confirm solved audit/choice state remains solved.
18. Test portrait and landscape safe areas and touch targets on iOS/Android.

## Next runtime slice

Implement VERA_2_6 — Research Office / rollback audit — using the same version route + transactional scene lifecycle. Do not expose a mount option until the renderer/story slice actually supports `backup_2_6`.

## Non-goals for this slice

- no VERA_2_6 or VERA_4_1 3D environment yet;
- no protected memory-token economy yet;
- no final character art/model/audio;
- no Vera Morr identity reveal;
- no alternative navigation system parallel to the existing SceneRouter.
