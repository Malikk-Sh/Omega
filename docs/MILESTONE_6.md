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
