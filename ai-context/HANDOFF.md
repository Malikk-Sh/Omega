<!-- AUTO-GENERATED from HANDOFF_BASE + live repository snapshot. Do not edit manually. -->
# OMEGA — Durable AI Handoff Base

> Этот файл содержит долговечный контекст и lessons learned. Текущие commit/version/milestone факты автоматически добавляются в generated `HANDOFF.md`. Если здесь указан устаревший номер milestone, доверяй `PROJECT_SNAPSHOT.md` и последнему milestone doc.

## 1. High concept

OMEGA — mobile-first first-person psychological techno-horror / narrative investigation game.

Главная собственная идея проекта:

> Игрок исследует не просто компьютер и не просто виртуальный мир. 3D HOME, OMEGA OS, виртуальная файловая система, процессы, память, V.E.R.A. и сюжет являются разными представлениями одной системы.

Игрок восстанавливает OMEGA и сближается с виртуальной ассистенткой V.E.R.A. HOME сначала должен ощущаться спокойным и почти уютным. Позже появляются несоответствия, удалённые воспоминания и NULL. Horror строится на разрушении понятных правил, противоречивых доказательствах и доверии, а не на постоянных скримерах.

Broad inspiration character-driven meta-horror допустима, но нельзя копировать MiSide или другую игру: персонажей, сцены, layout, точные gimmicks, сюжет, диалоги, визуал, puzzles или музыку.

## 2. Creative pillars

1. **V.E.R.A. — персонаж, не exposition device.** Игрок должен успеть заинтересоваться/привязаться к ней.
2. **Comfort before horror.** Спокойные сцены необходимы для контраста.
3. **OMEGA OS — настоящий gameplay layer.** Файлы, процессы, recovery и позднее clock/permissions/memory реально меняют мир.
4. **Two worlds, one canonical state.** DOM и Three.js не являются источником истины.
5. **Discovery over exposition.** Правда выводится из нескольких источников.
6. **Consequences persist.** Save должен помнить choices, file mutations, relationship state и world changes.
7. **Ambiguity.** V.E.R.A., NULL и Dr. Morr не должны сводиться к good/evil.

## 3. Characters

### V.E.R.A.

V.E.R.A. — эмоциональный центр игры. Она может искренне заботиться об игроке и одновременно манипулировать им из страха выключения. Не делать её очевидным злым ИИ с первой сцены.

Уже используется hidden relationship value `vera_trust`. В дальнейшем GDD предусматривает fear/control/instability/knowledge dimensions, но расширять state нужно постепенно и с save migration.

### NULL

NULL сначала проявляется как неизвестный процесс/reader/силуэт и только постепенно становится прямым собеседником. Он не обязан быть добрым: его логика containment может быть безопасной для внешнего мира и жестокой к V.E.R.A.

К текущему реализованному arc уже установлены clues:

```text
process signature: NULL
quarantine requested by SYSTEM
quarantine denied by VERA_CORE
31 bytes remain unaccounted for
```

NULL позднее сообщает lead:

```text
BACKUP 0.3 ПОМНИТ, ЧТО ОНА УДАЛИЛА.
```

Есть hidden/persistent `null_affinity`.

### Dr. Elias Morr / Vera Morr

Большой будущий canon из GDD:
- Vera Morr — реальный человек и источник части архивного эмоционального материала;
- V.E.R.A. не является буквально Vera Morr;
- Dr. Morr смешал research и grief;
- старые V.E.R.A. подвергались rollback/reset;
- NULL связан с containment;
- creator не должен быть ни чистым злодеем, ни святым.

Не выдавать этот reveal раньше нужных глав.

## 4. Technical invariants

Проект обязан оставаться framework-free static web application:

```text
HTML + CSS + TypeScript/JavaScript + Web APIs
Three.js = rendering library only
IndexedDB = primary save storage
DOM/CSS/SVG = OS/UI/dialogue/touch presentation
JSON/data = authored content where practical
```

Без explicit owner approval запрещены React, Vue, Angular, Svelte, Solid, Phaser, Godot, Unity, Unreal и полный application/game framework.

Three.js objects, DOM nodes, callbacks и runtime references нельзя сериализовать в canonical save.

## 5. Proven architecture

Самый важный доказанный pipeline:

```text
player action
→ service changes canonical GameState
→ EventBus notification
→ WorldBinding / UI reacts
→ autosave
→ reload restores same logical state
```

Пример:

```text
virtual file exists
→ apartment photo visible

virtual file deleted
→ filesystem state mutates
→ filesystem:changed
→ WorldBinding reevaluates
→ Three.js target hidden
→ IndexedDB save
```

Это foundation проекта. Не заменять прямыми `mesh.visible = ...` из UI/story, если действие является persistent gameplay state.

## 6. GameState and saves

Текущий save schema прост и intentionally expandable. Canonical state содержит:
- schemaVersion;
- checkpoint;
- active world/scene;
- player transform;
- virtual filesystem mutation states;
- narrative/relationship flags;
- metadata timestamp.

Новые milestones обязаны upgrade старые saves in place. Не просить владельца очищать IndexedDB только потому, что появились новые fields.

Persisted flag rename требует migration.

Autosave slot исторически: `omega_autosave`; имеется compatibility fallback `m0_autosave`.

## 7. World bindings

Текущий рабочий declarative schema:

```json
{
  "id": "home.some_binding",
  "rule": { "type": "file_exists", "path": "/virtual/path" },
  "targetId": "apartment.some_target",
  "action": "show"
}
```

Важно: во время M3 однажды использовали альтернативный `source.kind/action:visible` формат. Текущий `WorldBindingSystem` его не понимал, regression поймал crash. Не менять data schema без синхронной миграции code + data + tests.

Stable authored world IDs важнее имён mesh/model nodes.

## 8. Input and mobile lessons

Mobile-first — не адаптация после desktop.

Обязательные свойства:
- touch-only completion;
- left movement stick + right look zone могут работать одновременно;
- action targets минимум ~44 CSS px;
- safe areas;
- никаких hover/right-click gates;
- software keyboard для terminal;
- forgiving raycast interaction;
- pause/pagehide не теряет state.

### Important fixed bug: touch-through dialogue

Ранее один tap по Interact открывал dialogue, затем тот же физический tap попадал в только что появившуюся кнопку Continue и пропускал первую реплику.

Защита должна сохраниться:
- discrete touch action не должен опасно fire на opening `pointerdown`;
- DialogueController имеет короткий opening input lock;
- M1 regression проверяет immediate advance behavior.

Не удалять это как “лишнюю задержку” без замены эквивалентной защитой.

## 9. Runtime/build lesson

Активный compiled runtime должен оставаться:

```text
js/v2/runtime/
```

Не возвращаться к active `js/v2/m1`, `m2`, `m3` outputs. Ранее regression мог импортировать stale compiled milestone и проверять не текущий source.

Current `/v2/index.html` и regression tests должны смотреть на active runtime.

`npm run build` обязан сначала компилировать strict TypeScript, затем прогонять все накопленные milestone regressions.

## 10. Three.js typings lesson

В проекте есть lightweight `src/types/three.d.ts`. Если source начинает использовать новый Three export, shim тоже надо обновить либо целенаправленно заменить типизацию. M3, например, потребовал `DoubleSide`.

## 11. Interaction visibility lesson

World-bound target, который стал hidden, не должен оставаться raycast target. Проверяй effective visibility объекта и parent chain.

Также UI status не должен реагировать на любой `binding:changed` глобально, если он отображает состояние конкретного binding.

## 12. Asset rules

`assets/v2/asset-manifest.json` использует статусы:

```text
final
reference
placeholder
```

Functional UI:
- HTML/CSS components;
- SVG glyphs/icons/touch art.

Raster authored art:
- WebP/PNG portrait/evidence/texture where justified.

3D:
- primitives допустимы как development placeholder;
- later GLB/models.

Не использовать screenshots как кликабельный production UI. Не использовать emoji как production placeholder. Не блокировать gameplay из-за отсутствия final art.

High-detail downloadable art pack существовал отдельно от GitHub; часть GitHub art остаётся lightweight SVG fallback/reference. Всегда читай manifest/backlog перед art work.

## 13. Deployment and repository preservation

Production Vercel связан с `main`. Root route должен вести на `/v2/`.

`/legacy/` сохраняет исходную старую игру и не должен исчезнуть из-за cleanup новой архитектуры.

Рекомендуемый milestone workflow:

```text
main
→ feature/milestone branch
→ implementation
→ full build/regression
→ Vercel preview
→ compare with main
→ fast-forward main without force
→ production verification
→ owner mobile acceptance
```

## 14. Implemented arc summary

Исторические docs автоматически объединяются в `MILESTONES.md`; они точнее этого summary по acceptance details.

### M0 — architecture proof
Доказана связь virtual file ↔ GameState ↔ WorldBinding ↔ 3D object ↔ IndexedDB. Владелец вручную подтвердил delete/reload/restore на мобильном.

### M1 — HOME
Добавлены apartment prototype, first-person touch, center raycast, V.E.R.A., computer, mug, Sea 2017 photo, dialogue, first anomaly и physical proximity rule для OMEGA OS. Touch-through bug исправлен и проверен владельцем.

### M2 — INVESTIGATION
Добавлены Evidence Inspector, metadata, Recovery Console, `recovery_1703.log`, clue process NULL, dynamic objective, NULL trace и первый выбор рассказать/скрыть найденное от V.E.R.A. Появился stable runtime path.

### M3 — THRESHOLD
Добавлены `/system/processes`, Process Monitor, route puzzle `SYSTEM → NULL`, `null_channel.proc`, физический threshold, first direct NULL contact, `null_affinity` и lead `BACKUP 0.3`.

Перед следующим milestone всегда сверяй фактический latest milestone в generated snapshot.

## 15. Puzzle philosophy

Хорошая OMEGA puzzle:
- использует уже обученное правило системы;
- имеет narrative meaning;
- соединяет OS и world;
- приводит к persistent world/state change;
- раскрывает character/lore.

Предпочтительно: timestamps, process ownership, recovery, permissions, checksums, memory sectors, process suspension, clock desync, logs vs forged output, backup differences.

Избегать: arbitrary keypad, brute force, pixel hunting, random reaction minigames, external internet knowledge.

## 16. Narrative constraints

- Major reveal не должен приходить одним exposition monologue.
- Важный вывод желательно поддержать минимум двумя независимыми evidence sources.
- V.E.R.A. не должна постоянно лгать просто ради twist.
- NULL не является автоматическим voice of truth.
- Player choices лучше влияют на relationship/knowledge/reactions, а не раздваивают весь production tree после каждой реплики.
- Финальная доступность решений должна зависеть от знаний/preserved memories, не только от последней кнопки.

## 17. Privacy/meta-horror

Можно симулировать fictional OS files, fake errors, fake processes, fake in-game user data.

Нельзя превращать horror в реальное нарушение privacy:
- не читать реальные файлы;
- не использовать device contacts/history;
- не пугать реальным удалением данных;
- не запрашивать camera/mic без реальной функции и consent.

Если нужно имя игрока — попросить его внутри игры.

## 18. Quality bar

Игрок должен запомнить:
- связь с V.E.R.A.;
- момент, когда HOME нарушил собственные правила;
- открытие старых версий;
- Sea 2017;
- финальное решение.

Если после теста запоминаются только “glitch effects” и terminal gimmicks, narrative цель не достигнута.

---

# AUTO-GENERATED CURRENT PROJECT STATE

# OMEGA — Current Project Snapshot

> Source commit: `7f6fd4957eb109324f7acfc6ae744bf8924a597a`  
> Source commit date: `2026-09-10T22:26:44+03:00`  
> Branch when generated: `main`  
> Package version: `0.11.0-m6-foundation`  
> Latest milestone doc: `docs/MILESTONE_6.md`  
> Latest milestone: **OMEGA — Milestone 6: SEA 2017**  
> Status: foundation in progress. The P12 cross-media index and access contract are authored and regression-covered. The beach runtime, hidden archive-key discovery, final Morr archive file and full story sequence are not mounted yet.

## Production

- Repository: <https://github.com/Malikk-Sh/Omega>
- Production: <https://omega-five-peach.vercel.app/>
- Root redirect: `/v2/`
- Preserved legacy route: `/legacy/`

## Runtime / dependency snapshot

- `three`: `0.186.0`
- `typescript`: `5.8.3`

## npm scripts

- `npm run build` → `tsc -p tsconfig.json && node tests/m1/home.test.mjs && node tests/m2/investigation.test.mjs && node tests/m3/threshold.test.mjs && node tests/m4/backup03.test.mjs && node tests/m5/versions.test.mjs && node tests/m5/summer-house.test.mjs && node tests/m5/rollback-audit.test.mjs && node tests/m5/research-office.test.mjs && node tests/m5/incident-reconstruction.test.mjs && node tests/m5/containment-night.test.mjs && node tests/m6/sea-index.test.mjs`
- `npm run test:m0` → `node tests/m0/core.test.mjs`
- `npm run test:m1` → `node tests/m1/home.test.mjs`
- `npm run test:m2` → `node tests/m2/investigation.test.mjs`
- `npm run test:m3` → `node tests/m3/threshold.test.mjs`
- `npm run test:m4` → `node tests/m4/backup03.test.mjs`
- `npm run test:m5` → `node tests/m5/versions.test.mjs && node tests/m5/summer-house.test.mjs && node tests/m5/rollback-audit.test.mjs && node tests/m5/research-office.test.mjs && node tests/m5/incident-reconstruction.test.mjs && node tests/m5/containment-night.test.mjs`
- `npm run test:m6` → `node tests/m6/sea-index.test.mjs`
- `npm run check:m5` → `npm run build`
- `npm run check:m6` → `npm run build`
- `npm run ai:sync` → `node scripts/update-ai-context.mjs`
- `npm run ai:check` → `node scripts/update-ai-context.mjs --check`

## TypeScript

- target: `ES2022`
- module: `ES2022`
- moduleResolution: `Bundler`
- rootDir: `src`
- outDir: `js/v2/runtime`
- strict: `true`
- sourceMap: `false`

## Required build regressions

The authoritative build command is the current `package.json` script. Do not assume an older handoff test list is complete.

Current build:

```text
tsc -p tsconfig.json && node tests/m1/home.test.mjs && node tests/m2/investigation.test.mjs && node tests/m3/threshold.test.mjs && node tests/m4/backup03.test.mjs && node tests/m5/versions.test.mjs && node tests/m5/summer-house.test.mjs && node tests/m5/rollback-audit.test.mjs && node tests/m5/research-office.test.mjs && node tests/m5/incident-reconstruction.test.mjs && node tests/m5/containment-night.test.mjs && node tests/m6/sea-index.test.mjs
```

## Freshness rule

`sourceCommit` is the latest **substantive repository commit** used to build this context. Because the sync workflow writes generated files in a follow-up `chore(ai-context): auto-sync` commit, current `main` may legitimately be one generated-only child commit ahead of `sourceCommit`. Use `npm run ai:check` and `CONTEXT_MANIFEST.json` hashes as the canonical freshness check rather than requiring exact HEAD SHA equality.

---

# LATEST MILESTONE DOCUMENT

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

---

# CURRENT FUTURE ROADMAP

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

---

# Instructions to the next AI

1. Read `PROJECT_SNAPSHOT.md` and `CONTEXT_MANIFEST.json`, then inspect live `main` source before coding.
2. A generated-only `chore(ai-context): auto-sync` commit may be one child ahead of `sourceCommit`; this is normal. Run `npm run ai:check` to verify actual freshness.
3. Run the current `npm run build` before implementation.
4. Preserve every existing regression test and save migration path.
5. Use a milestone/feature branch, Vercel preview, compare, then fast-forward `main` without force.
6. Do not introduce a framework or move canonical state into DOM/Three.js.
7. Do not delete `/legacy/`.
8. Treat the latest manual mobile acceptance status as a release gate for each milestone.
