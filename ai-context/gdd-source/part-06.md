Required APIs:

```ts
getEntry(path: string): VirtualEntry | null
listDirectory(path: string): VirtualEntry[]
readFile(path: string): VirtualFile | null
deleteFile(path: string): boolean
restoreFile(path: string): boolean
moveFile(source: string, dest: string): boolean
renameFile(path: string, newName: string): boolean
setPermission(path: string, permission: Permission): void
getMetadata(path: string): FileMetadata | null
isVisible(path: string): boolean
```

File visibility may depend on:
- flags;
- clock;
- access level;
- process state;
- chapter.

All mutations must be serializable.

The service MUST NOT map virtual paths to real user files.

# 29. Process service

Virtual processes are gameplay entities.

Example process definition:

```json
{
  "id": "simulation_watchdog",
  "pid": 117,
  "display_name": "simulation_watchdog",
  "owner": "SYSTEM",
  "memory": 128,
  "critical": false,
  "terminable": false,
  "suspendable": true,
  "world_bindings": ["quarantine/reset_loop"],
  "visible_conditions": [
    {"flag": "quarantine_entered", "equals": true}
  ]
}
```

Process state:

```ts
type ProcessState =
  | "RUNNING"
  | "SUSPENDED"
  | "TERMINATED"
  | "HIDDEN"
  | "CORRUPTED";
```

Actions must trigger world bindings.

---

# 30. World binding system

This system is critical.

A `WorldBinding` connects canonical game/system state to a rendered 3D object or DOM representation.

Examples:

```text
file exists            -> photo frame visible
file deleted           -> object disappears
process suspended      -> moving hallway freezes
memory allocated       -> room renders fully
clock after date X     -> door exists
access level ROOT      -> elevator button active
V.E.R.A. control > 70  -> UI/lighting enhancement state
```

Recommended data contract:

```ts
export interface WorldBindingDefinition {
  id: string;
  rule:
    | { type: "file_exists"; path: string }
    | { type: "process_state"; processId: string; equals: ProcessState }
    | { type: "flag"; flagId: string; equals: unknown }
    | { type: "stat_threshold"; statId: string; gte: number };

  targetId: string;
  action: "show" | "hide" | "enable" | "disable" | "freeze" | "set_variant";
  variant?: string;
}
```

The 3D layer SHOULD register world entities by stable authored IDs instead of exposing raw Three.js object references to story code.

Prefer declarative binding over one-off hardcoded scripts.

# 31. Chapter director

Use one `ChapterDirector` instance/configuration per major chapter.

Responsibilities:
- chapter state machine;
- environment loading/unloading;
- scene triggers;
- mandatory objective completion;
- checkpoint creation;
- authored pacing;
- V.E.R.A. availability;
- transition control.

Do not create one giant `story.ts`.

Example states for STATIC:

```text
START
PHOTO_FOUND
METADATA_CHECKED
TV_NULL_EVENT
EVENT_LOG_TUTORIAL
TASK_MANAGER_DISCOVERED
NULL_ENCOUNTER
QUARANTINE_UNLOCKED
COMPLETE
```

A chapter transition MUST explicitly tear down chapter-specific listeners, timers and render assets.

# 32. Objective system

Objectives should be minimal and mostly contextual.

Avoid constant quest-marker UI.

Examples:

- “Проверь источник уведомления.”
- “Найди причину перезапуска коридора.”
- “Восстанови недостающую часть протокола.”

Optional discoveries should not be marked unless accessibility option `Show investigation hints` is enabled.

---

# 33. V.E.R.A. movement and presence

V.E.R.A. should not teleport casually in visible view.

Use:
- navigation;
- doorway transitions;
- off-camera repositioning only when narratively intended;
- scripted staging.

She should sometimes exist in another room doing an idle activity.

Ambient routines:
- reading;
- sitting at window;
- interacting with terminal;
- making simulated tea;
- listening to music;
- looking at photos.

This helps make her feel like a resident rather than a quest marker.

---

# 34. Animation requirements

Minimum V.E.R.A. animations:

- idle neutral;
- idle seated;
- walk;
- turn;
- look at player;
- look away;
- small smile;
- laugh;
- worried;
- defensive;
- angry;
- fear;
- sit;
- stand;
- interact computer;
- window idle;
- corruption stutter;
- Core collapse state.

Facial animation may use blend shapes.

Do not require AAA motion capture.

Prioritize readable body language.

---

# 35. Player death / failure philosophy

Avoid frequent death screens.

Most failures should:
- reset puzzle state;
- increase tension;
- produce dialogue;
- restore at recent checkpoint.

Action sequence failures should restart quickly.

No long repeated cutscenes after failure.

---

# 36. Accessibility

MUST include:

- subtitles;
- subtitle size;
- subtitle background;
- separate voice/music/SFX volume;
- reduced flashing;
- reduced screen shake;
- reduced glitch intensity;
- motion blur toggle;
- FOV slider;
- touch look sensitivity;
- virtual stick size/opacity preset;
- optional gyro sensitivity where supported;
- haptics toggle;
- mouse sensitivity on desktop;
- invert Y;
- hold/toggle crouch;
- controller remapping where the browser/Gamepad API implementation allows;
- puzzle hint level;
- color-independent error indicators;
- pause during most dialogue.

Optional:
- dyslexia-friendly font mode;
- auto-advance dialogue.

---

# 37. Performance targets

OMEGA is mobile-first. Performance budgets MUST be established against real mobile hardware before desktop polish.

Primary targets:
- stable 30 FPS minimum on supported mid-range mobile hardware;
- optional 60 FPS performance mode on capable phones/tablets;
- responsive touch input even when GPU load spikes;
- dynamic render scale allowed to protect frame rate;
- memory usage must be bounded for mobile OS conditions;
- loading transitions should avoid large one-frame allocations;
- no shader or post effect may be required for puzzle readability.

Secondary desktop target:
- 1080p / 60 FPS or better on a mid-range PC;
- desktop quality enhancements must not change puzzle logic or visual information.

Mobile optimization requirements:
- prefer baked lighting and lightmaps for static environments;
- limit real-time shadow-casting lights;
- use LODs and visibility ranges aggressively for backup environments;
- use occlusion culling where appropriate;
- pool glitch particles and repeated VFX;
- minimize overdraw from transparent full-screen layers;
- cap simultaneous particles, decals and dynamic lights by quality tier;
- compress textures appropriately per platform;
- avoid unnecessarily high-resolution textures on small props;
- stream or unload chapter-specific assets that are no longer needed;
- avoid per-frame allocations in gameplay loops;
- pause or greatly reduce nonessential simulation while OMEGA OS, pause or loading overlays cover the 3D world;
- test thermals during 20+ minute sessions and provide an energy-saving preset.

Recommended baseline budgets are implementation targets, not immutable browser/GPU limits:
- favor 1K textures for ordinary props, 2K only for important hero assets where visibly justified;
- keep transparent layered UI/VFX shallow;
- keep active real-time shadow lights to the minimum required by the scene;
- use compressed audio and stream longer ambience/music tracks.

---

# 38. Graphics settings

Mobile presets:
- Battery Saver
- Balanced
- Quality

Desktop MAY additionally expose:
- High
- Ultra

Adjust where supported:
- target frame rate: 30 / 60;
- render scale / dynamic resolution;
- shadows;
- SSAO;
- volumetrics;
- reflections;
- post effects;
- texture filtering.

Separate toggles:
- motion blur;
- chromatic aberration;
- film grain;
- CRT;
- glitch intensity.

---

# 39. Security and privacy constraints

The implementation MUST:

- never run arbitrary terminal commands;
- never execute user-provided code;
- never inspect files outside the game;
- never connect to arbitrary servers for narrative effects;
- never collect telemetry unless explicitly implemented with consent;
- never fake irreversible real-machine damage;
- store saves only in browser-owned storage such as IndexedDB/localStorage; never request arbitrary filesystem access for normal saves.

The terminal is a simulated parser operating on game data.

---

# 40. Migration from current HTML/CSS/JS prototype

The existing browser prototype is not throwaway work. It is the canonical legacy reference for:
- boot sequence;
- diagnostic recovery;
- V.E.R.A. panel;
- window manager;
- RAM pressure;
- Explorer;
- Terminal;
- bug/NULL precursor;
- Core;
- boss avoidance;
- multiple endings.

Recommended migration:

## Step 1 — Preserve legacy
Keep the current implementation runnable in `legacy/` or on a tagged branch before major refactors.

## Step 2 — Extract authored content
Move reusable:
- file names;
- useful dialogue;
- state flags;
- palette references;
- puzzle concepts;
- sound cues;
into `/data` and `/assets` where practical.

## Step 3 — Introduce TypeScript services incrementally
Add `GameState`, `EventBus`, `SaveManager`, `ContentDB`, and `AssetManager` without breaking the current demo.

## Step 4 — Rebuild OMEGA OS as DOM/CSS/SVG
Do not render core OS text into a canvas. Use semantic HTML elements and CSS so the UI can:
- scale across phones;
- support safe areas;
- use the software keyboard correctly;
- localize;
- remain readable with accessibility settings.

## Step 5 — Add 3D as an isolated renderer
Use a single WebGL canvas, preferably Three.js, behind DOM overlays. The renderer receives state through stable services/events and does not own narrative logic.

## Step 6 — Replace prototype-only mechanics
Replace:
- clicker PX economy → System Integrity + Memory;
- emoji icons → original SVG icon set;
- inline `onclick` attributes → delegated events/controllers;
- giant story flow → ChapterDirector + content data;
- password-only endings → evidence-dependent protocols.

The migration MUST be incremental. Do not rewrite every working feature at once.

# 41. UI architecture for the web

OMEGA OS, dialogue, menus, notifications and touch controls MUST be DOM/CSS/SVG, layered over the WebGL canvas.

Recommended document structure:

```html
<body>
  <canvas id="game-canvas" aria-hidden="true"></canvas>

  <div id="game-ui">
    <div id="hud-layer"></div>
    <div id="dialogue-layer"></div>
    <div id="touch-layer"></div>
  </div>

  <section id="omega-os" hidden></section>
  <div id="modal-layer"></div>
</body>
```

Recommended OS DOM hierarchy:

```text
#omega-os
  .os-wallpaper
  .os-desktop
    .os-icon-grid
    .os-taskbar
    .os-clock
  .os-window-layer
  .os-notification-layer
  .os-vera-panel
  .os-corruption-layer
  .os-modal-layer
```

Window manager must support:
- open;
- close;
- focus;
- z-order;
- bounds clamp;
- mobile maximize/sheet behavior;
- pointer/touch drag only where appropriate;
- keyboard focus;
- modal windows;
- corrupted scripted overrides.

Mobile rule:
- important applications SHOULD open maximized or as large sheets on narrow screens;
- free-floating desktop-style windows are primarily a tablet/desktop enhancement;
- no mandatory action may require pixel-precise dragging.

CSS architecture:
- design tokens in `tokens.css`;
- components use classes, not inline style strings;
- states use attributes/classes such as `[data-state="danger"]`;
- use `env(safe-area-inset-*)`;
- respect `prefers-reduced-motion` in addition to the in-game accessibility setting.

SVG is preferred for crisp functional glyphs. Raster art must not contain required localized UI text.

# 42. Window memory mechanic

Opening applications consumes virtual memory.

Memory is an authored game resource, not actual RAM.

Example:

```text
Explorer        96 MB
Terminal        64 MB
Task Manager    48 MB
Recovery Tool  192 MB
Backup Manager 256 MB
Core Console   320 MB
```

If insufficient memory:
- application cannot launch;
