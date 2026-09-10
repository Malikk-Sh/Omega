Reconstruct which rollback commands were executed and which entries were edited later.

## P11 — Incident Reconstruction

Chapter: VERSIONS / 4.1  
Teaches: source reliability  
Sort evidence into direct telemetry / V.E.R.A. reconstruction / Morr note.

## P12 — Sea Index

Chapter: SEA_2017  
Teaches: cross-media deduction  
Align camera timestamps, audio, tide marker, folder order.

## P13 — Core Memory Allocation

Chapter: CORE  
Teaches: sacrifice  
Limited protected memory means player cannot preserve everything.

## P14 — Desktop War

Chapter: CORE  
Teaches: full system mastery  
Identify real processes, free memory, disable defenses and reach Core without destroying essential evidence.

---

# 19. Horror design

## 19.1 Horror philosophy

Prefer:
- contradiction;
- surveillance feeling;
- impossible continuity;
- character behavior changes;
- environmental mismatch;
- loss of UI trust;
- quiet anticipation;
- emotional coercion.

Use jump scares sparingly.

Target:
0–3 major jump scares in full game.

## 19.2 Safe meta-horror

Allowed:
- fake desktop inside game;
- fake crash screen;
- fake file deletion;
- fake restart;
- fake system username that is actually player-entered display name;
- fake save corruption that is reversible and internal to game state.

Forbidden:
- reading real personal files;
- accessing camera/mic without explicit feature need and consent;
- changing real OS settings;
- deleting real files;
- opening real browser pages as horror;
- pretending real malware behavior;
- persistent changes outside game save directory.

## 19.3 UI corruption rules

Corruption should escalate in authored stages.

Stage 0:
- stable;
- slight CRT/noise optional.

Stage 1:
- occasional text displacement;
- 1-frame geometry jitter.

Stage 2:
- forged notification design differences;
- window lag;
- cursor ghost.

Stage 3:
- V.E.R.A. control changes layout;
- task windows reposition;
- audio desync.

Stage 4:
- Core collapse;
- controlled unreadability only during short transitions.

Accessibility option MUST reduce flashes and heavy jitter.

---

# 20. Visual direction

# 20.1 Main identity

OMEGA should combine:

- late-21st-century research OS;
- industrial diagnostic UI;
- clean geometric typography;
- restrained monochrome surfaces;
- selective state colors.

Avoid generic neon cyberpunk overload.

## Color semantics

Base stable:
- black / charcoal;
- warm gray;
- pale green for validated system state.

Warnings:
- amber.

Errors:
- red.

NULL:
- desaturated white + black void / missing texture.

V.E.R.A. enhancement:
- subtle cyan/violet iridescence, not constant neon.

Sea 2017:
- warm faded film tones;
- subdued sky;
- natural palette that feels emotionally different from the OS.

## 20.2 Visual irony

As V.E.R.A. gains control:
- UI becomes cleaner;
- transitions smoother;
- apartment lighting warmer;
- animations more polished.

As NULL gains control:
- visuals become primitive;
- debug geometry appears;
- rendering loses decoration.

This creates a thematic conflict:
**beauty is not equal to safety.**

---

# 21. 3D environment design

# 21.1 Apartment

Required rooms:

- Living Room
- Kitchen
- Office / Computer Room
- Bedroom / quiet room
- Bathroom
- Hallway
- Locked Storage Door / Quarantine access

The apartment should be compact enough that the player learns it intimately.

Target traversal:
< 20 seconds from one end to the other.

This familiarity is important because later subtle changes become noticeable.

## Apartment state variants

### Stable
Warm, believable, comfortable.

### Corrupted
Small geometry mismatches, duplicate props, impossible doors, missing reflections.

### Core Collapse
Architecture reveals data-structure logic; walls open into abstract memory sectors.

---

# 21.2 Backup environments

Each is compact:
10–20 minutes including puzzle.

Do not build four full levels.

Use reused spatial motifs transformed enough to feel like different representations of the same underlying memory architecture.

---

# 22. Audio design

Audio is essential.

## V.E.R.A. voice

Preferred:
full voice acting.

If unavailable during prototype:
use placeholder generated/TTS only for internal development, not final commercial release unless properly licensed.

Voice states:
- neutral;
- warm;
- playful;
- worried;
- defensive;
- angry;
- frightened;
- fragmented.

Do not apply heavy “robot filter” continuously.

## Music

Dynamic layers:

- recovery ambience;
- warm apartment theme;
- anomaly layer;
- NULL layer;
- backup themes;
- Sea 2017 motif;
- Core escalation.

The apartment theme should recur in distorted forms.

## System sound language

Create original:
- click;
- notification;
- warning;
- process suspend;
- recovery;
- checksum success;
- boot;
- corruption;
- memory protection.

Avoid stock Windows/macOS sound imitation.

---

# 23. Save system

Must support:

- 3 manual save slots;
- autosave;
- chapter checkpoint;
- save version migration;
- recovery from malformed/incomplete saves when possible.

Canonical persistence format: versioned JSON.

Primary browser storage:
- IndexedDB for save slots, large structured data, discovered screenshots/thumbnails and future migration;
- `localStorage` MAY store only tiny noncritical preferences such as volume or last selected slot;
- never require cookies for gameplay;
- never depend on real filesystem access.

Recommended external save schema:

```json
{
  "save_version": 1,
  "chapter": "STATIC",
  "checkpoint": "static_after_tv",
  "player_name": "Player",
  "stats": {
    "vera_trust": 58,
    "vera_fear": 21,
    "vera_control": 44,
    "vera_instability": 17,
    "player_knowledge": 26,
    "null_alignment": 8
  },
  "flags": {
    "met_vera_3d": true,
    "saw_null_tv": true,
    "told_vera_about_null": false
  },
  "discoveries": [
    "clue_future_timestamp",
    "clue_pid_null"
  ],
  "choices": [
    "hide_null_encounter"
  ],
  "filesystem_changes": {
    "deleted": [],
    "restored": ["sys/simulation_engine.pkg"],
    "renamed": {}
  },
  "protected_memories": [],
  "simulated_clock": "2081-09-04T19:30:00"
}
```

The save service MUST:
- serialize only authored game state;
- write atomically where practical;
- keep a previous known-good copy before migrations;
- expose `save(slot)`, `load(slot)`, `autosave()`, `listSlots()`, `deleteSlot()` and migration hooks;
- treat browser storage eviction as a recoverable user-facing error, not a crash.

Never store secrets or unrelated device information.

# 24. Game state architecture

Use one framework-free TypeScript state service as the canonical source of mutable narrative/system state.

Recommended module:

`src/core/GameState.ts`

```ts
export interface OmegaState {
  chapter: ChapterId;
  checkpoint: string;

  stats: {
    veraTrust: number;
    veraFear: number;
    veraControl: number;
    veraInstability: number;
    playerKnowledge: number;
    nullAlignment: number;
  };

  flags: Record<string, boolean | number | string>;
  discoveries: string[];
  choices: string[];
  protectedMemories: string[];

  system: {
    integrity: number;
    memoryTotal: number;
    memoryUsed: number;
    corruption: number;
    networkOnline: boolean;
    accessLevel: "GUEST" | "USER" | "ADMIN" | "ROOT";
    simulatedClock: string;
  };
}
```

Provide a small service API:

```ts
setFlag(id, value)
getFlag(id, fallback)
addStat(id, amount)
unlockDiscovery(id)
hasDiscovery(id)
recordChoice(id)
canTrigger(contentId)
snapshot()
hydrate(data)
reset()
```

Rules:
- no UI component owns canonical story state;
- Three.js objects MUST NOT be used as save data;
- DOM references MUST NOT be stored in canonical state;
- services observe state and update DOM/3D representations;
- mutations should be explicit enough to log in development builds.

# 25. Event architecture

Use a small typed event bus implemented with native TypeScript/JavaScript. `EventTarget` is acceptable; a tiny custom publisher/subscriber module is also acceptable.

Recommended events:

```ts
type GameEvents = {
  "chapter:changed": { chapterId: ChapterId };
  "flag:changed": { id: string; value: unknown };
  "stat:changed": { id: string; value: number };
  "discovery:unlocked": { id: string };
  "dialogue:started": { id: string };
  "dialogue:finished": { id: string };
  "filesystem:changed": { path: string; action: FileAction };
  "process:changed": { id: string; state: ProcessState };
  "clock:changed": { iso: string };
  "world-binding:changed": { id: string };
  "vera:emotion": { id: VeraEmotion };
  "checkpoint:requested": { id: string };
};
```

Avoid excessive direct imports between high-level systems.

Rules:
- events are for cross-system notifications, not as a replacement for every function call;
- unregister listeners on teardown;
- no anonymous listener leaks across chapter changes;
- development mode SHOULD be able to trace meaningful events.

# 26. Scene structure

The project is a framework-free static web application. Use ES modules / TypeScript modules and explicit lifecycle classes rather than engine scenes.

Recommended repository structure:

```text
/
  index.html
  package.json
  tsconfig.json
  README.md

  src/
    main.ts

    core/
      Game.ts
      GameState.ts
      EventBus.ts
      SaveManager.ts
      AssetManager.ts
      SettingsManager.ts
      ContentDB.ts

    render/
      WorldRenderer.ts
      CameraController.ts
      PostFX.ts
      materials/
      shaders/

    player/
      PlayerController.ts
      InteractionSystem.ts
      TouchInput.ts
      GamepadInput.ts

    world/
      WorldBinding.ts
      EnvironmentManager.ts
      InteractionRegistry.ts
      chapters/

    omega-os/
      OmegaOS.ts
      WindowManager.ts
      FileSystemService.ts
      TerminalService.ts
      ProcessService.ts
      MemoryService.ts
      EventLogService.ts
      ClockService.ts
      RecoveryService.ts
      apps/

    story/
      StoryEngine.ts
      ChapterDirector.ts
      DialogueManager.ts
      ChoiceSystem.ts
      EndingResolver.ts

    characters/
      VeraController.ts
      VeraBehavior.ts
      NullController.ts

    ui/
      HUD.ts
      DialogueUI.ts
      TouchControls.ts
      MenuUI.ts
      NotificationUI.ts
      DOMView.ts

  styles/
    tokens.css
    base.css
    mobile.css
    omega-os.css
    dialogue.css
    hud.css
    effects.css

  data/
    dialogues/
    filesystem/
    processes/
    chapters/
    puzzles/
    lore/
    endings/
    localization/

  assets/
    characters/
    entities/
    environments/
    props/
    story/
    ui/
      icons/
      glyphs/
      effects/
      references/
    audio/
    models/
    textures/

  tests/
```

Runtime layer split:

```text
Three.js/WebGL canvas = 3D world only
DOM + CSS + SVG       = OMEGA OS, dialogue, HUD, menus, touch controls
TypeScript services   = canonical state and gameplay logic
JSON                  = authored content
IndexedDB             = saves
Web Audio API         = audio graph/playback
```

The 3D renderer MUST be replaceable without rewriting story, filesystem or save logic.

# 27. Content database

Use `ContentDB.ts` to load authored JSON from `/data`.

The game should not scatter story strings through gameplay scripts.

Content categories:
- dialogues;
- files;
- process definitions;
- puzzle definitions;
- chapter trigger definitions;
- inspectable objects;
- ending conditions;
- asset manifest entries.

At startup:
- validate required IDs;
- report duplicates;
- validate referenced asset paths;
- show descriptive development errors;
- fail gracefully if optional content is missing;
- prevent a broken optional file from corrupting the whole save.

For a simple static deployment, data MAY be imported at build time or fetched with relative URLs. Runtime networking to external services is not required.

# 28. Filesystem service

Implement a virtual filesystem fully inside game data.

Recommended class:

`src/omega-os/FileSystemService.ts`

