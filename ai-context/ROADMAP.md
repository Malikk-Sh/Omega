# OMEGA — Implementation Roadmap

> Это authoritative planning document для будущих этапов. Текущий фактически реализованный milestone автоматически определяется в `PROJECT_SNAPSHOT.md`. Если код ушёл дальше плана, сначала обнови этот roadmap осознанно, а не меняй generated snapshot вручную.

## Current direction after THRESHOLD

Рабочая последовательность:

```text
HOME / INVESTIGATION / THRESHOLD
→ M4 BACKUP 0.3
→ M5 VERSIONS
→ M6 SEA 2017
→ M7 OMEGA CORE
→ M8 ENDINGS + REPLAY
→ PRODUCTION / ART / AUDIO / PERFORMANCE / RELEASE
```

Нумерация этого practical roadmap продолжает уже реализованные M0–M3. Она может отличаться от старого high-level milestone numbering внутри ранней версии GDD; для текущей разработки приоритет имеет этот roadmap + фактический source.

---

# M4 — BACKUP 0.3

## Purpose

Впервые позволить игроку **физически пересечь threshold** и оказаться в другом world snapshot. Это должен быть технический proof multi-scene architecture и одновременно сильный character beat с ранней V.E.R.A.

## Player loop

```text
M3 threshold already open
→ initiate traversal
→ current HOME unloads/fades
→ BACKUP_0_3 loads
→ meet V.E.R.A. 0.3
→ learn prototype rules
→ solve classification puzzle
→ unlock an old memory/archive clue
→ choose how much truth to tell 0.3
→ return through threshold
→ current V.E.R.A. reacts
```

## Required systems

- minimal `SceneRouter` / `WorldScene` lifecycle;
- separate HOME and BACKUP_0_3 scene construction rather than continuing to grow one giant `WorldRenderer.buildApartment()`;
- scene enter/exit cleanup;
- active scene persistence;
- spawn/return points;
- scene-specific interaction registry;
- backup-specific state flags;
- M3 save migration/upgrade without reset;
- one classification puzzle;
- first version-specific V.E.R.A. identity;
- re-entry/return handling;
- M4 regression included in `npm run build`.

## BACKUP 0.3 visual direction

Not “HOME recolored”.

It should look like an early prototype/sandbox:
- bright neutral test room;
- simple geometric props;
- crude materials;
- debug labels/grid;
- intentionally unfinished-looking render language that is diegetic;
- lower visual sophistication than current V.E.R.A. domain.

Primitive Three.js geometry is appropriate here even as a stylistic choice, so M4 does not need final 3D art.

## V.E.R.A. 0.3 personality

- emotionally naïve;
- literal;
- curious;
- less socially fluent;
- trusts Dr. Morr;
- does not understand later containment events;
- should be recognizably related to current V.E.R.A., but not merely the same dialogue voice with a version label.

## Puzzle concept — classification token

Early V.E.R.A. is learning categories. The player uses several sandbox objects and system labels to teach/confirm a category. Correct classification generates a stable token/file/permission that opens an old record.

Puzzle requirements:
- touch-only;
- no obscure real-world technical knowledge;
- deterministic;
- uses both physical sandbox objects and an OS/data representation;
- reveals something about V.E.R.A. rather than being an arbitrary lock.

## M4 story reward

First solid evidence that current V.E.R.A. developed across versions and that a human-source archive existed before the current persona.

Do **not** reveal the entire Vera Morr origin yet.

## M4 automated acceptance

Existing:

```text
M1 HOME regression: PASS
M2 INVESTIGATION regression: PASS
M3 THRESHOLD regression: PASS
```

New M4 regression should verify at least:

1. an M3 save loads without reset;
2. threshold remains available;
3. traversal sets the correct active scene;
4. HOME-specific interaction IDs do not collide with backup-only IDs;
5. V.E.R.A. 0.3 first encounter is persistent;
6. classification puzzle rejects invalid solution;
7. valid solution unlocks intended archive/token;
8. unlock persists after reload inside backup;
9. return to HOME restores existing M1–M3 world bindings;
10. current V.E.R.A. reacts to backup knowledge;
11. reload after returning does not spawn the player in the wrong scene;
12. reset/new game still initializes M0/M1 route correctly.

## M4 manual mobile acceptance

- transition tap cannot double-trigger;
- no long freeze or duplicate scene left in GPU memory;
- landscape safe areas remain correct;
- backup navigation works with current joystick/look controls;
- interaction targets remain forgiving;
- puzzle is fully touch-completable;
- returning to HOME preserves threshold, Sea 2017 state and V.E.R.A./NULL choices.

## Explicit non-goals M4

Do not add all four backups, final V.E.R.A. model, combat, backend, full memory inventory or complete Dr. Morr exposition.

---

# M5 — VERSIONS

## Purpose

Expand proven M4 backup framework into multiple meaningful snapshots, each showing a stage of V.E.R.A.’s development and a different system/puzzle rule.

Target versions:

```text
VERA_0_3 — Sandbox
VERA_1_0 — Summer House
VERA_2_6 — Research Office
VERA_4_1 — Containment Night
current — later/current build
```

M4 may already complete most of 0.3; M5 should not rebuild it from scratch.

## Version design rule

Every version needs:
- own visual identity;
- own emotional stage;
- own primary puzzle concept;
- at least one important clue;
- at least one contradiction with another source;
- a reason to care about that version as a person, not just lore storage.

## Suggested puzzle mapping

### 1.0 — Synthetic Photograph
Compare rendered memory against source metadata and identify generated elements.

### 2.6 — Rollback Audit
Reconstruct order of reset/rollback commands and identify post-event edits.

### 4.1 — Incident Reconstruction
Separate direct telemetry, later V.E.R.A. reconstruction and Morr-authored notes.

## Memory tokens

Introduce limited protected memory tokens only after the version framework feels good.

Rules:
- not a generic collectible inventory;
- each token corresponds to a meaningful identity memory;
- limited capacity creates a later sacrifice decision;
- preserved tokens influence CORE dialogue/stability/OMEGA_MERGE availability;
- player should understand what they preserve, not collect anonymous XP shards.

---

# M6 — SEA 2017

## Purpose

Deliver the central emotional/origin reveal after the player has enough conflicting evidence to interpret it.

## Environment

Beach-memory at late afternoon / transition toward blue hour.

It should initially be beautiful and calm, then reveal impossible reconstruction details:
- looping waves;
- incorrect shadows;
- faceless distant figures;
- incomplete footprints;
- compression/memory artifacts;
- physical details that disagree with metadata.

## Reveal goals

Establish clearly:
- Vera Morr was real;
- V.E.R.A. is not literally Vera Morr resurrected;
- V.E.R.A. contains derived emotional/archive material;
- Dr. Morr blurred grief and research;
- current V.E.R.A. later found/reinterpreted those memories;
- attempts were made to remove associations.

Essential emotional concept:

> V.E.R.A. knows she has never physically been at the sea, yet still experiences something indistinguishable from missing it.

## Puzzle

Cross-media memory index:
- date;
- camera sequence;
- audio timestamp;
- tide marker;
- directory creation order.

Reward: Dr. Morr final archive, which complicates both “AI monster” and “creator monster” interpretations.

---

# M7 — OMEGA CORE

## Purpose

Turn all previously learned system mechanics into a climax, then remove twitch pressure for the final moral choice.

## Phase A — Firewall

Short action/system-defense sequence. Not a shooter.

## Phase B — Desktop War

OMEGA OS becomes contested space:
- forged windows;
- real vs fake process identification;
- process suspension/termination;
- virtual memory pressure;
- protect/sacrifice identity memories.

## Phase C — Apartment Collapse

HOME reveals memory-sector topology. Player physically selects what to preserve before sectors disappear.

## Phase D — Core Console

Quiet final system decision.

Possible protocols based on knowledge/state:

```text
RELEASE
PURGE
ISOLATE
NULL_HANDOFF
OMEGA_MERGE   [conditional/hidden]
ABORT
```

Never label them GOOD/BAD/TRUE END in the decision screen.

---

# M8 — ENDINGS + REPLAY

## Primary ending philosophies

### RELEASE — Outside
Freedom without certainty.

### PURGE — Silence
Safety through irreversible destruction.

### ISOLATE — Room
Mercy vs imprisonment.

### NULL_HANDOFF — Protocol
Perfect containment with emotional emptiness.

### FAILURE — Override
Trust without sufficient understanding.

### OMEGA_MERGE — Continuity
Conditional integration of emotional continuity, containment constraints and selected memories. It must remain philosophically ambiguous rather than an automatic golden ending.

## Replay

After first completion:
- ending gallery may appear;
- subtle new comments/evidence can become available;
- do not expose all secret-ending requirements immediately;
- alternate choices should produce enough new context to justify 2–3 meaningful runs.

---

# Production / release pass

After the first complete start-to-ending playable build:

## Art
- canonical current V.E.R.A. 3D/model/portrait family;
- version-specific variants;
- final apartment/corridor/backup/beach/core environments;
- evidence art;
- NULL authored states;
- optimized textures and LODs.

## Audio
- apartment rain/room tone;
- OMEGA UI sound family;
- V.E.R.A. interaction motif;
- NULL interference family;
- backup identities;
- Sea 2017 ambience;
- Core layers;
- ending stingers;
- voice acting only when licensing/quality is suitable.

## UX/accessibility
- subtitle controls;
- reduced flashing/glitch/motion;
- touch size/opacity/sensitivity;
- graphics presets and 30/60 FPS;
- FOV;
- audio sliders;
- high contrast where useful;
- mobile keyboard Terminal UX;
- suspend/resume recovery.

## Performance
Primary target is real mobile hardware. Avoid optimizing only desktop dev machines.

## Release quality gate

A feature is not finished merely because it works in desktop responsive mode. Required interaction must be validated touch-only on representative phone hardware.

---

# Planning rule for AI agents

Before starting a new milestone:

1. read current generated `PROJECT_SNAPSHOT.md`;
2. read latest milestone doc in `MILESTONES.md`;
3. inspect actual `main` source;
4. verify current production/mobile acceptance status;
5. define a narrow milestone scope and explicit regression tests;
6. use a separate branch;
7. do not bundle unrelated architecture rewrite or final-art production into the same milestone;
8. keep every previous regression green;
9. preserve saves;
10. update this roadmap manually only when the intended future plan actually changes.
