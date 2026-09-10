# OMEGA — Milestone 5: VERSIONS

Status: foundation in progress on a stacked branch above M4. The first data/state/routing regressions are implemented; additional 3D snapshot traversal is not yet part of this slice.

## Purpose

Expand the proven M4 backup framework into a sequence of emotionally and mechanically distinct V.E.R.A. snapshots without rebuilding BACKUP 0.3 or moving narrative state into Three.js.

Target sequence:

```text
VERA_0_3 — Sandbox / classification token
VERA_1_0 — Summer House / synthetic photograph
VERA_2_6 — Research Office / rollback audit
VERA_4_1 — Containment Night / incident reconstruction
```

## Foundation implemented

- Added authored `data/v2/versions-m5.json`.
- Added stable IDs, scene IDs, environment roles, puzzle IDs, unlock flags and completion flags for 0.3 / 1.0 / 2.6 / 4.1.
- Added `VersionsProtocol.ts` as framework-free story/state logic.
- Added `VersionRoute.ts` as a renderer-independent route contract.
- Added M5 save defaults without changing save schema version.
- M5 state upgrade does not change the current scene or checkpoint.
- Existing M4 completion state is preserved.
- Version unlock order is deterministic:
  - M3 contact exposes 0.3;
  - M4 HOME reconciliation exposes 1.0;
  - VERA_1_0 completion exposes 2.6;
  - VERA_2_6 completion exposes 4.1.
- Duplicate version IDs and scene IDs are rejected by definition validation.
- Authored version order is validated so content cannot silently reorder the narrative arc.
- Route targets are validated as unique and forbidden from aliasing canonical HOME.
- Routable snapshots are derived from canonical unlock flags; adding a newly unlocked authored version does not require a new hardcoded route branch.
- Locked route resolution returns the exact canonical flag that still gates the version.
- All version routes declare HOME as the canonical return scene.

## VERA_1_0 puzzle foundation — Synthetic Photograph

The first M5 puzzle compares a source capture record with a reconstructed rendered memory.

Source-verified elements:

```text
window_rain
wall_clock
tea_cup
```

Rendered memory elements:

```text
window_rain
wall_clock
tea_cup
red_ribbon
sea_shell
```

The puzzle solution is **derived** as rendered minus source-verified elements:

```text
red_ribbon
sea_shell
```

The evaluator therefore does not trust a UI button or hardcoded answer path. It checks the selected stable element IDs against the authored evidence relationship.

Rules already covered:

- partial selection is rejected;
- selecting a source-verified object as generated is rejected;
- unknown object IDs are rejected descriptively;
- selection order does not matter;
- duplicate taps do not create duplicate evidence selections;
- a valid audit emits clue ID `v10_reconstruction_layer_detected`.

This clue establishes that a later association/reconstruction layer can add meaningful imagery that was absent from the source capture. It must not by itself reveal the full Vera Morr origin.

## Save compatibility

`upgradeStateForVersions()` only adds missing M5 flags/counters. It does not:

- change `world.activeScene`;
- change the current checkpoint;
- clear M1–M4 flags;
- clear filesystem mutations;
- reset V.E.R.A./NULL relationship state.

A completed M4 save therefore unlocks VERA_1_0 immediately after M5 upgrade without inventing progress inside that snapshot.

## Automated regression

`tests/m5/versions.test.mjs` verifies:

1. authored version data validates;
2. version route targets validate;
3. M4 state survives M5 upgrade;
4. M5 upgrade does not move scene/checkpoint;
5. VERA_1_0 unlocks after M4 completion;
6. VERA_2_6 and VERA_4_1 remain gated in order;
7. routable version list is derived from canonical unlock flags;
8. locked versions cannot resolve a route;
9. newly unlocked versions become routable from authored scene metadata without router-specific conditionals;
10. every version route returns to canonical HOME;
11. synthetic-photo generated elements are derived correctly;
12. partial/over/unknown selections fail;
13. correct selection succeeds independent of order/duplicate taps;
14. reward clue ID is deterministic;
15. M5 puzzle flags/counters persist through SaveManager;
16. upgrading an older completed-M4 save adds defaults without fake M5 progress.

The repository Vercel integration reached its deployment-rate limit while this stacked branch was being built. That status is infrastructure-only (`Deployment rate limited — retry in 24 hours`), not a compiler/test failure.

To avoid treating the rate limit as validation, the new M5 TypeScript modules were independently compiled with TypeScript 5.8.3 and isolated Node regressions passed:

```text
M5 isolated regression: PASS
M5 route contract isolated regression: PASS
```

M1–M4 remained green on the final M4 implementation commit before the external rate limit was reached.

## Next implementation slice

Wire VERA_1_0 into the existing scene lifecycle:

- connect the generic version route contract to the transactional M4 `SceneRouter` rather than creating a second navigation system;
- add a version-selection surface that only exposes unlocked snapshots;
- build a distinct Summer House primitive environment rather than recoloring HOME;
- stage V.E.R.A. 1.0 as a more socially developed but still trusting version;
- expose source-photo metadata through DOM OMEGA OS;
- make rendered-memory objects use stable IDs matching the synthetic-photo evidence contract;
- persist entry, puzzle solution, clue read, choice and HOME return;
- keep M1–M5 regressions green.

## Non-goals of the foundation slice

- no VERA_2_6 or VERA_4_1 3D environment yet;
- no protected memory-token economy yet;
- no final character art/model/audio;
- no Vera Morr identity reveal;
- no alternative navigation system parallel to M4 SceneRouter.
