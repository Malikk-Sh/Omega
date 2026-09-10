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

The Vercel preview for the implementation commit completes `npm run build` successfully with all four milestone regressions passing.

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
