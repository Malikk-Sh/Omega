# OMEGA — AI Context Bundle

Эта папка — **единая точка входа для любой нейросети/AI coding agent**, продолжающей разработку OMEGA.

Не начинай изменять проект, пока не прочитаешь файлы в указанном порядке.

## Reading order

1. [`PROJECT_SNAPSHOT.md`](./PROJECT_SNAPSHOT.md) — что реально находится в текущем `main`: версия, milestone, build/tests, deployment, source commit.
2. [`HANDOFF.md`](./HANDOFF.md) — актуальный контекст, архитектурные решения, уже найденные ошибки и следующий шаг.
3. [`TECH_CONTRACT.md`](./TECH_CONTRACT.md) — обязательные технологические ограничения.
4. [`GDD.md`](./GDD.md) — полный Game Design Document + Technical Design Specification.
5. [`MILESTONES.md`](./MILESTONES.md) — объединённая история реализованных milestone-документов.
6. [`ROADMAP.md`](./ROADMAP.md) — текущий production-план следующих этапов.
7. [`SOURCE_INDEX.md`](./SOURCE_INDEX.md) — ссылки на актуальный код, data, tests, UI и assets.
8. [`ASSET_BACKLOG.md`](./ASSET_BACKLOG.md) — состояние UI/art/audio pipeline.
9. [`CONTEXT_MANIFEST.json`](./CONTEXT_MANIFEST.json) — machine-readable snapshot и SHA-256 важных файлов.
10. [`RECENT_CHANGES.md`](./RECENT_CHANGES.md) — последние substantive commit-сообщения проекта.

## Source of truth priority

При противоречии информации используй этот порядок:

```text
1. Текущий source/data/tests в main
2. ai-context/PROJECT_SNAPSHOT.md
3. docs/OMEGA_IMPLEMENTATION_CONTRACT.md / ai-context/TECH_CONTRACT.md
4. Последний docs/MILESTONE_N.md / ai-context/MILESTONES.md
5. ai-context/HANDOFF.md
6. ai-context/GDD.md
7. Старые prototype/legacy идеи
```

GDD определяет конечное видение, но уже доказанные технические решения не следует ломать только потому, что ранняя формулировка GDD отличается от фактического runtime.

## Technology in one paragraph

OMEGA — **mobile-first framework-free browser game**. Runtime: semantic HTML/CSS + TypeScript/JavaScript + Web APIs. Three.js разрешён только как 3D rendering library. Canonical game/story state живёт в сериализуемых TypeScript services, не в DOM и не в Three.js. OMEGA OS/HUD/dialogue/touch UI строятся DOM + CSS + SVG. Saves — IndexedDB. React/Vue/Svelte/Angular/Phaser/Godot/Unity/Unreal и другие application/game frameworks запрещены без явного разрешения владельца.

## Current development workflow

Новый milestone обычно делается так:

```text
main
→ milestone-N-name branch
→ implementation
→ npm run build
→ Vercel preview
→ все старые + новый regression tests PASS
→ compare against main
→ fast-forward main without force
→ production deploy
→ mobile acceptance владельцем
```

Нельзя публиковать красный build или сбрасывать существующие saves ради удобства нового milestone.

## Automatic synchronization

Эта папка поддерживается скриптом:

```bash
npm run ai:sync
```

Проверка без записи:

```bash
npm run ai:check
```

На `main` GitHub Action `.github/workflows/sync-ai-context.yml` запускает синхронизацию автоматически после substantive push и коммитит изменившиеся generated-файлы отдельным commit:

```text
chore(ai-context): auto-sync [skip ci]
```

### Как понимать `sourceCommit`

Generated context описывает **substantive commit**, из которого он был построен. Поэтому обычное состояние истории выглядит так:

```text
<substantive game/docs commit>   ← PROJECT_SNAPSHOT.sourceCommit
        ↓
chore(ai-context): auto-sync     ← current main HEAD
```

То есть `main` может совершенно корректно быть на один generated-only commit впереди `sourceCommit`. Это **не означает**, что контекст устарел.

Каноническая проверка свежести:

```bash
npm run ai:check
```

Дополнительно `CONTEXT_MANIFEST.json` содержит SHA-256 важных source/data/test/config файлов. Если `ai:check` проходит, generated bundle соответствует текущему substantive состоянию проекта.

### Автоматически генерируются

- `GDD.md` — из `ai-context/gdd-source/part-*.md`;
- `TECH_CONTRACT.md` — зеркало `docs/OMEGA_IMPLEMENTATION_CONTRACT.md`;
- `ASSET_BACKLOG.md` — зеркало `docs/UI_ASSET_BACKLOG.md`;
- `MILESTONES.md` — объединение всех `docs/MILESTONE_*.md`;
- `PROJECT_SNAPSHOT.md`;
- `SOURCE_INDEX.md`;
- `CONTEXT_MANIFEST.json`;
- `RECENT_CHANGES.md`;
- `HANDOFF.md` — durable handoff base + автоматически обновляемый current snapshot/latest milestone.

### Редактируются вручную как authoritative source

- `HANDOFF_BASE.md` — долговечные архитектурные/narrative lessons;
- `ROADMAP.md` — план будущих milestone, когда сам план меняется;
- `gdd-source/part-*.md` — исходник полного GDD.

Не редактируй generated-файлы вручную: следующий sync перезапишет их.

## Production links

- Repository: <https://github.com/Malikk-Sh/Omega>
- Production: <https://omega-five-peach.vercel.app/>
- Current game route: `/v2/`
- Preserved original demo: `/legacy/`

## Rule for the next AI

**Не перепридумывай фундамент.** Сначала пойми существующую связку:

```text
3D world ↔ WorldBinding ↔ virtual filesystem/process state ↔ GameState ↔ IndexedDB
                              ↕
                         DOM OMEGA OS
                              ↕
                        story / V.E.R.A.
```

Расширяй её небольшими проверяемыми слоями.
