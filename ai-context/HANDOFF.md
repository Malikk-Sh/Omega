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

> Source commit: `9fc7f5907641a35353be373ffb27bfe39c36a32d`  
> Source commit date: `2026-09-10T20:22:37+03:00`  
> Branch when generated: `main`  
> Package version: `0.5.0-m3`  
> Latest milestone doc: `docs/MILESTONE_3.md`  
> Latest milestone: **OMEGA — Milestone 3: THRESHOLD**  
> Status: implementation candidate; M1/M2/M3 automated regressions pass on Vercel preview. Requires project-owner mobile acceptance.

## Production

- Repository: <https://github.com/Malikk-Sh/Omega>
- Production: <https://omega-five-peach.vercel.app/>
- Root redirect: `/v2/`
- Preserved legacy route: `/legacy/`

## Runtime / dependency snapshot

- `three`: `0.186.0`
- `typescript`: `5.8.3`

## npm scripts

- `npm run build` → `tsc -p tsconfig.json && node tests/m1/home.test.mjs && node tests/m2/investigation.test.mjs && node tests/m3/threshold.test.mjs`
- `npm run test:m0` → `node tests/m0/core.test.mjs`
- `npm run test:m1` → `node tests/m1/home.test.mjs`
- `npm run test:m2` → `node tests/m2/investigation.test.mjs`
- `npm run test:m3` → `node tests/m3/threshold.test.mjs`
- `npm run check:m3` → `npm run build`
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
tsc -p tsconfig.json && node tests/m1/home.test.mjs && node tests/m2/investigation.test.mjs && node tests/m3/threshold.test.mjs
```

## Freshness rule

`sourceCommit` is the latest **substantive repository commit** used to build this context. Because the sync workflow writes generated files in a follow-up `chore(ai-context): auto-sync` commit, current `main` may legitimately be one generated-only child commit ahead of `sourceCommit`. Use `npm run ai:check` and `CONTEXT_MANIFEST.json` hashes as the canonical freshness check rather than requiring exact HEAD SHA equality.

---

# LATEST MILESTONE DOCUMENT

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
