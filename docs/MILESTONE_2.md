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
