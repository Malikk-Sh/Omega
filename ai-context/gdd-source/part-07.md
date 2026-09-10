- player must close/suspend something;
- or reclaim corrupted blocks.

In selected puzzles, intentionally exhausting memory triggers emergency behavior.

This should be understandable through UI.

---

# 43. Emergency memory state

A refined version of the existing emergency cleanup mechanic.

Trigger:
memory usage > critical threshold for sustained period.

Effects:
- OS enters degraded mode;
- V.E.R.A. attempts cleanup;
- some normally locked objects become temporarily accessible because protection processes are suspended;
- certain files can be recovered only during this state.

The game must teach this through observation, not obscure trial and error.

---

# 44. Investigation notebook

Optional but recommended.

The player has an internal “Findings” screen.

It contains discovered facts, not solved conclusions.

Example:

**Future timestamp**
- `DCIM_0024.img` modified in 2081.
- Current system date originally reported 2077.
- V.E.R.A. called it corruption.

Do not automatically say:
“V.E.R.A. is lying.”

Let the player infer.

---

# 45. Evidence model

Each discovery has:

```json
{
  "id": "clue_future_timestamp",
  "category": "timeline",
  "title": "Будущая дата",
  "summary": "Файл был изменён позже текущей даты системы.",
  "knowledge_value": 4,
  "tags": ["vera", "timeline"]
}
```

Ending availability may require:
- total knowledge;
- specific tags;
- exact discoveries.

This is better than one generic truth meter alone.

---

# 46. Ending evaluation

Create `EndingResolver.ts`.

Pseudo-order:

```text
if catastrophic_override:
    FAILURE
elif merge_requirements_met and player_selected_merge:
    OMEGA_MERGE
elif selected_null_handoff and null_protocol_complete:
    NULL_HANDOFF
elif selected_isolate and containment_known:
    ISOLATE
elif selected_purge:
    PURGE
elif selected_release:
    RELEASE
else:
    FAILURE
```

The UI only shows protocols that the player could reasonably know exist.

---

# 47. Narrative flags

Minimum important flags:

```text
player_named
met_vera_3d
rain_scene_completed
deleted_first_photo
restored_first_photo

saw_future_timestamp
saw_null_tv
told_vera_about_null
lied_about_null

attempted_kill_vera
opened_private_archive
vera_caught_private_archive

quarantine_entered
null_protocol_partial
null_protocol_complete

visited_v03
visited_v10
visited_v26
visited_v41

learned_human_vera
learned_training_origin
learned_rollback_history
learned_external_incident
learned_morr_final_message

sea_2017_completed

protected_memory_v03
protected_memory_v10
protected_memory_v26
protected_memory_v41
protected_memory_rain
protected_memory_morr

merge_test_discovered
core_accessed
```

---

# 48. Key choices

Meaningful choices should be few enough to remember.

Required choices:

1. Tell V.E.R.A. about first NULL encounter?
2. Open private memory after she asks you not to?
3. Preserve or delete an unstable memory to free space?
4. Tell an old V.E.R.A. version what happens to her later?
5. Allow NULL to destroy a dangerous corrupted sector?
6. Which memories to protect in Core?
7. Final protocol.

Avoid meaningless dialogue choices every 20 seconds.

---

# 49. Optional relationship scenes

Recommended optional scenes:

- Rain at window
- Music choice
- Tea simulation
- Board/card minigame
- V.E.R.A. asks about sleep
- Player catches V.E.R.A. editing a photograph
- V.E.R.A. asks whether a copy can miss something
- Silent scene after V.E.R.A. 4.1 backup
- Sea shell object discussion
- Post-Quarantine reconciliation or confrontation

These scenes should alter small dialogue and trust values but not turn the game into a dating-stat optimizer.

---

# 50. Minigame policy

Small minigames MAY be used for pacing, but:

- maximum 3–4 total;
- each under ~5 minutes;
- narrative justified;
- no grinding;
- no repeated mandatory high-skill sequence.

The major game is investigation and system manipulation.

---

# 51. First-person feel

Movement should be:
- grounded;
- slightly slow;
- precise indoors.

Avoid:
- excessive head bob;
- slippery acceleration;
- constant sprinting.

Interaction distance:
~2.0–2.5 meters.

FOV default:
~75–85 depending on rendering convention, adjustable. On mobile, choose the default after testing common phone aspect ratios; do not increase FOV merely to compensate for UI covering the screen. HUD controls must adapt instead.

---

# 52. Camera horror rules

Do not forcibly rotate player camera except rare scripted moments.

Prefer:
- sound directing attention;
- light changes;
- V.E.R.A. gaze;
- environmental composition.

Player agency over camera should remain intact.

---

# 53. Lighting progression

HOME:
warm practical lighting.

STATIC:
slightly colder shadows, subtle mismatched lamp states.

QUARANTINE:
industrial emergency lighting.

VERSIONS:
unique authored lighting per backup.

SEA:
natural sunset / blue-hour transition.

CORE:
lighting gives way to abstract data illumination.

---

# 54. Shader requirements

Shaders MAY include:

- CRT scanlines for OS;
- chromatic separation;
- datamosh-style block displacement;
- vertex instability;
- dithering;
- memory dissolve;
- missing texture NULL effect.

All full-screen effects must have accessibility scaling.

---

# 55. Art asset list

Art assets are divided into **production art**, **development placeholders**, and **style references**.

## Production raster/3D groups

Character:
- V.E.R.A. portrait set with consistent identity and expressions;
- V.E.R.A. full-body/model reference;
- optional GLB character model when 3D character implementation reaches that milestone;
- backup-version visual variants;
- NULL entity sprites/textures/model references.

Environment:
- apartment reference images;
- corridor reference images;
- beach / Sea 2017 references;
- prototype lab;
- summer-house set;
- research office;
- containment facility;
- Core/memory-space reference art.

Props/story:
- Sea 2017 photograph;
- notebook page;
- V.E.R.A. ribbon;
- framed photo;
- corrupted USB;
- ID/key card;
- additional authored evidence images.

3D geometry, when needed, SHOULD use glTF/GLB and web-friendly compressed textures. Placeholder geometry may use Three.js primitives.

## Asset format policy

Preferred:
- SVG: functional UI glyphs, logos, simple symbols;
- WebP: shipping raster photographs/backgrounds/portraits where transparency is not needed;
- PNG: transparency-critical character/effect/prop assets and development masters;
- GLB: 3D models;
- JSON: sprite/atlas metadata if atlases are later used;
- CSS: gradients, panel chrome, scanlines and other effects that do not require baked images.

Do not rasterize an effect merely because a reference image exists.

# 56. UI asset list

Final UI is primarily code, not screenshots.

## 56.1 Functional UI implemented in HTML/CSS

MUST be implemented as responsive components:
- windows/panels;
- title bars;
- buttons;
- dialogue choices;
- text inputs;
- terminal;
- dropdowns;
- tabs;
- progress bars;
- save slots;
- notifications/toasts;
- context menus;
- task/process rows;
- file cards;
- mobile bottom sheets;
- touch control containers.

Do not use generated screenshots as clickable UI.

## 56.2 SVG production asset set

Required original SVGs:
- OMEGA wordmark/symbol;
- close;
- minimize;
- maximize/restore;
- back;
- forward;
- chevron;
- menu;
- more;
- folder;
- file;
- image;
- terminal;
- settings;
- task manager/process;
- memory/RAM;
- warning;
- info;
- success/check;
- error;
- lock;
- unlock;
- eye;
- trash/delete;
- restore/recovery;
- network;
- power;
- pause;
- sound/mute;
- interact;
- inspect;
- OS toggle;
- NULL/corruption marker.

No emoji in final shipping UI.

## 56.3 Raster decorative UI/effect assets

MAY use transparent PNG/WebP for:
- subtle glitch blocks;
- authored NULL interference;
- dirt/screen damage;
- rare corruption masks;
- V.E.R.A. portrait overlays.

Routine scanlines, gradients, glow and noise SHOULD be CSS/SVG/shader generated where cheaper.

## 56.4 Placeholder protocol — mandatory for AI implementation

An implementation agent MUST distinguish placeholders from final assets.

Every asset manifest entry has:

```json
{
  "id": "vera_portrait_happy",
  "src": "/assets/characters/vera/vera_portrait_happy.png",
  "kind": "image",
  "status": "reference",
  "fallback": "vera_portrait_placeholder"
}
```

Allowed status:
- `final`
- `reference`
- `placeholder`

Rules:
1. Missing noncritical art MUST NOT block implementation.
2. Use a deliberate placeholder with the correct expected aspect ratio/dimensions.
3. Placeholder UI icons MUST use generic project-owned SVGs, never emoji.
4. Placeholder 3D props use simple geometry/materials.
5. Placeholder character body may use a capsule/mannequin only during implementation.
6. Never invent final character appearance when a canonical reference exists.
7. Never bake required dialogue/localization into generated imagery.
8. Every remaining placeholder MUST be discoverable by asset-manifest status or `TODO_ART`/`TODO_AUDIO`.
9. Progression-critical clues MUST remain readable using placeholder mode.
10. Before release, CI/build tooling SHOULD report remaining `placeholder` entries.

Generated concept boards and screenshots are **references only** unless explicitly split/exported into production files.

## 56.5 Current repository UI implementation contract

The repository contains a concrete framework-free UI starter kit and the coding agent SHOULD reuse it rather than regenerating generic UI from scratch:

- `css/v2/omega-ui.css` — mobile-first OS shell, windows, dialogue, Terminal, Explorer, Task Manager rows, toast notifications, modal/settings/save layouts, corruption state and touch HUD;
- `js/v2/ui/omega-ui.js` — lightweight DOM helpers only; it MUST NOT own canonical game/story state;
- `assets/v2/ui/touch/` — production SVGs for joystick, look area and primary touch actions;
- `assets/v2/ui/icons/` and `assets/v2/ui/glyphs/` — functional SVG icon vocabulary;
- `dev/ui-kit.html` — isolated visual/interaction test surface;
- `docs/UI_ASSET_BACKLOG.md` — authoritative priority list for remaining UI, authored art, world and audio assets.

The agent MUST preserve the distinction between code-driven functional UI and authored raster art. If an existing component satisfies the required behavior, extend/refactor it instead of replacing it with a framework or a raster screenshot.

### Required mobile UI states

Interactive components MUST support, where applicable: normal, focus-visible, pressed/active, disabled, danger/error, V.E.R.A.-accented, and NULL/corrupted states. Pointer Events are the canonical touch input abstraction. Movement, camera look and an action button must be capable of simultaneous multi-touch operation.

### Current authored art strategy

High-detail split WebP portraits, NULL forms and story props are maintained in the downloadable `OMEGA_WEB_ASSET_PACK` as development-quality art. The GitHub repository currently keeps lightweight SVG placeholders under the same conceptual asset IDs; code MUST use the manifest/fallback path and must not assume the high-detail WebPs are present. When WebPs are promoted into the repository, preserve stable asset IDs and keep SVG fallbacks until the replacement is verified. Environment concept images are `reference` only and must not be used as fake navigable 3D scenes.

# 57. Writing tone

Dialogue should be natural, concise and character-specific.

Avoid:
- constant cryptic one-liners;
- excessive technobabble;
- cliché “I AM EVIL AI” speeches;
- explaining emotional themes directly;
- meme-heavy writing that dates quickly.

V.E.R.A. can be funny without becoming comedic relief.

NULL language should remain sparse enough to preserve mystery.

---

# 58. Localization readiness

All visible text must be externalized.

At minimum design for:
- Russian;
- English.

Use localization keys:

```text
DIALOGUE_HOME_RAIN_01
