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
