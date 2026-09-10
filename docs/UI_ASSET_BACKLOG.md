# OMEGA v2 — UI & Asset Production Backlog

This document defines what is already reusable, what must be implemented as code, and which authored art assets still need production. It is mandatory guidance for coding and asset-generation agents.

## Status vocabulary

- **DONE / CODE** — implemented as reusable HTML/CSS/JS/SVG. Do not replace with raster screenshots.
- **PLACEHOLDER** — valid development asset with stable ID; replace later without changing gameplay/story logic.
- **REFERENCE** — visual direction only; never bind gameplay interaction to it.
- **TODO_ART** — authored image/texture/model/audio still required.
- **TODO_CODE** — reusable web component/behavior still required.

## P0 — foundation already available

### DONE / CODE
- UI color/token layer: `styles/omega-ui-tokens.css`.
- Base UI components: `styles/omega-ui-components.css`.
- Mobile-first v2 shell/components: `css/v2/omega-ui.css`.
- DOM helper/presentation module: `js/v2/ui/omega-ui.js`.
- Isolated preview: `dev/ui-kit.html` + `dev/ui-kit.js`.
- OMEGA OS application icons in `assets/v2/ui/icons/`.
- Generic UI glyphs in `assets/v2/ui/glyphs/`.
- Scanline/grid vectors in `assets/v2/ui/effects/`.
- Mobile touch artwork in `assets/v2/ui/touch/`.
- SVG fallback portraits for V.E.R.A., NULL, props and environment references.

### Required states for every interactive component
Where relevant, every component must expose:
1. normal;
2. hover only when a hover-capable pointer exists;
3. `:focus-visible` keyboard/accessibility focus;
4. pressed/active;
5. disabled;
6. danger/error;
7. V.E.R.A. accent;
8. NULL/corrupted state.

Do not encode required text into images. Touch targets for primary actions must be at least 44 CSS px.

---

# P0 — UI still required before vertical slice polish

## 1. Boot / recovery flow — TODO_CODE
Create reusable DOM/CSS screens for:
- OMEGA logo/boot screen;
- diagnostic text stream;
- recovery progress;
- safe-mode/performance choice;
- fatal-error state;
- restore/retry action;
- transition from boot to desktop.

Use CSS/SVG noise/glitch overlays. Do not create these as one full-screen PNG.

## 2. Mobile OMEGA desktop — TODO_CODE
Create:
- responsive app icon grid;
- taskbar/dock;
- system time/status group;
- open-window indicator;
- notification badge;
- long-press context sheet;
- mobile window modes: fullscreen, bottom sheet, centered dialog;
- desktop/free-window layout only on sufficiently wide screens.

A phone must never require precise window dragging to finish the game.

## 3. Explorer / evidence browser — TODO_CODE
Create:
- breadcrumbs;
- folder/file grid and compact list mode;
- locked/corrupted/deleted/hidden states;
- file metadata panel;
- contextual actions: open, inspect, restore, delete, copy path;
- evidence marker;
- image/audio/text file viewers;
- loading and empty-folder states.

## 4. Evidence inspector — TODO_CODE
Critical for puzzles. Required gestures:
- pinch zoom;
- one-finger pan while zoomed;
- double tap reset/zoom;
- rotate only when puzzle explicitly needs rotation;
- hotspots layered in DOM/SVG instead of painted into the evidence image;
- accessible alternate text/hints for mandatory evidence.

## 5. Terminal — TODO_CODE / partially available
Current visual shell exists. Add:
- command history;
- autocomplete suggestions;
- mobile IME-safe input;
- virtual-keyboard viewport handling;
- copyable output;
- command-result semantic colors;
- progressive permissions: GUEST / USER / ADMIN / ROOT;
- corrupted command suggestions that may be unreliable but must remain game-state driven.

## 6. Task Manager / Process Manager — TODO_CODE / partially styled
Add:
- process list sorting;
- CPU/RAM/activity indicators;
- process detail sheet;
- terminate/suspend/restart actions;
- protected process warning;
- unknown PID rendering for NULL;
- V.E.R.A. process mutations by story state.

## 7. Dialogue system — TODO_CODE / partially available
Add:
- typewriter with skip/instant-text accessibility option;
- dialogue backlog/history;
- portrait expression transitions;
- choice timeout only in scenes explicitly authored for it;
- relationship feedback that is subtle and optional;
- interruption events from OMEGA OS/NULL;
- auto mode;
- no required tap targets smaller than 44px.

## 8. HUD / world interaction — TODO_CODE
Create minimal first-person overlay:
- center reticle only when useful;
- contextual interaction prompt;
- object name/action hint;
- optional objective hint;
- crouch/run states;
- low-profile System Integrity feedback when narratively active;
- accessibility alternative to color-only danger feedback.

The normal exploration screen should remain visually quiet.

## 9. Pause / settings / save — TODO_CODE
Required:
- continue;
- settings;
- controls/help;
- chapter/checkpoint info;
- manual save slots where allowed;
- autosave indicator;
- restart checkpoint;
- return to title;
- audio sliders/mute;
- graphics quality/30 vs 60 FPS mode;
- sensitivity;
- text speed;
- subtitles;
- reduced motion;
- reduced glitch/flashing;
- high-contrast UI option;
- touch-control opacity/size/sensitivity;
- reset controls/settings.

## 10. Notification/toast system — TODO_CODE / partially available
Support:
- information;
- success/recovery;
- warning;
- error;
- V.E.R.A. authored message;
- suspicious/fake system notification.

Important: a fake V.E.R.A. notification must be distinguishable through discoverable forensic details, not only color.

## 11. Chapter transition / ending UI — TODO_CODE
Create:
- chapter title card;
- brief save/checkpoint transition;
- ending decision terminal/core screen;
- ending title cards;
- credits;
- post-credit anomaly layer;
- ending gallery after first completion.

Do not reveal locked ending requirements in the first playthrough.

---

# P1 — authored UI art / textures

These may use PNG/WebP because they are authored visual content rather than functional controls.

## V.E.R.A. — TODO_ART
Create one locked master design and derive all expressions from it. Required portrait states:
- neutral;
- warm smile;
- affectionate;
- shy;
- concerned;
- nervous;
- sad;
- angry;
- glitched;
- exhausted/weak;
- frightened;
- emotionally blank;
- late-game unstable;
- goodbye/decay.

All portraits for one age/version must preserve facial proportions, hair, ribbon, choker, clothing and rendering style. Existing generated WebP portraits are development placeholders/references, not immutable final canon.

## V.E.R.A. version portraits — TODO_ART
Distinct but related designs for:
- V.E.R.A. 0.3;
- 1.0;
- 2.6;
- 4.1;
- 8.1/current.

Differences should communicate development era/personality, not merely recolor the same image.

## NULL — TODO_ART
Required states:
- distant silhouette;
- doorway observer;
- crouched observer;
- crawling/glitch trail;
- terminal/avatar marker;
- core form;
- attack/interference mask;
- non-hostile/communication form if story path requires it.

NULL should remain recognizable from silhouette and eyes even at small mobile size.

## System wallpapers — TODO_ART
At minimum:
- boot/default OMEGA wallpaper;
- V.E.R.A.-restored clean wallpaper;
- corrupted NULL wallpaper;
- SEA_2017 memory wallpaper;
- final/core wallpaper.

Prefer 16:9 master art with safe central composition for phone/tablet crops. Export optimized WebP variants rather than shipping the largest source image.

## Evidence images — TODO_ART
Priority set:
- `sea_2017_polaroid`;
- creator/Vera family photo(s);
- corrupted photograph variants;
- handwritten creator note;
- V.E.R.A. generated note;
- access card/keycard;
- research diagram;
- incident still/frame;
- version-history photograph;
- false/fabricated evidence authored by V.E.R.A.

Clues required for solving puzzles must remain readable on a phone. If text is required, provide semantic/transcribed DOM text rather than depending solely on pixels.

## UI atmosphere textures — TODO_ART
Small tileable/overlay textures only:
- subtle film/noise;
- digital block corruption mask;
- chromatic separation mask;
- memory dissolve mask;
- CRT/scanline variant;
- glass/smudged monitor overlay;
- red emergency pulse mask;
- NULL interference displacement/noise maps.

Keep these lightweight. Do not use a full-screen 4K texture when a tiny repeatable texture or procedural CSS/WebGL effect is sufficient.

---

# P1 — 3D/world assets

## Apartment
TODO_MODEL/TODO_TEXTURE:
- room shell;
- desk + computer/monitor;
- bed;
- shelves;
- window/rain plane;
- door and corridor entrance;
- picture frames;
- props that map to virtual files;
- basic interactable drawers/cabinet;
- low-cost lamps with baked/static lighting strategy for mobile.

## Corridor
TODO_MODEL/TODO_TEXTURE:
- modular corridor segment;
- doors;
- ceiling/floor/wall variants;
- exit sign;
- camera;
- electrical boxes/pipes;
- corruption decals;
- NULL spawn/observation anchors.

## SEA_2017
TODO_MODEL/TODO_TEXTURE:
- shoreline plane;
- sky/sunset treatment;
- water appropriate for mobile GPU budget;
- memory fragments/photo anchors;
- optional low-poly distant geometry.

World geometry may begin with Three.js primitives. Do not block gameplay on final models.

---

# P1 — audio asset backlog

TODO_AUDIO:
- OMEGA boot motif;
- desktop ambience;
- V.E.R.A. interaction/UI motif;
- apartment rain/room tone;
- NULL interference sound family;
- terminal key/input sounds;
- recovery/success/error UI sounds;
- memory transition;
- corridor ambience;
- SEA_2017 ambience;
- core/finale layers;
- ending stingers.

Do not create a unique audio file for every button. Build a small coherent UI sound family and vary pitch/filter programmatically where appropriate.

---

# Mobile performance asset budgets

These are target budgets, not excuses to ship poor art:

- Prefer WebP/AVIF for opaque photographic art; WebP is the safe baseline.
- Use alpha only where required.
- Generate multiple raster sizes for large backgrounds when beneficial.
- Avoid simultaneously keeping multiple full-resolution V.E.R.A. portraits decoded in memory.
- Lazy-load chapter-specific evidence/backgrounds.
- SVG icons should avoid excessive filters/path complexity.
- Glitch effects should be procedural/CSS/WebGL where possible rather than long frame-by-frame PNG sequences.
- 3D textures should use power-conscious sizes and compressed delivery where the chosen library/tooling supports it.

AssetManager must be able to unload/release chapter-specific resources.

---

# Rules for an asset-generation AI

When asked to create missing assets:

1. Read the GDD, `docs/OMEGA_IMPLEMENTATION_CONTRACT.md`, this backlog and `assets/v2/asset-manifest.json` first.
2. Never invent a second unrelated visual identity for V.E.R.A.
3. Generate one coherent family at a time.
4. Do not bake Russian/English gameplay UI text into assets unless the file is explicitly a diegetic story prop.
5. Provide transparent background for sprites/portraits/icons that need compositing.
6. Keep mobile legibility and cropping in mind.
7. Give every generated asset a stable snake_case name.
8. Register it in the manifest with `placeholder` or `reference` unless explicitly approved as `final`.
9. Preserve an existing stable asset ID when replacing art.
10. Never overwrite the only source/reference file without retaining a recoverable version.

# Recommended next implementation order

1. Finish OMEGA desktop + mobile window behavior.
2. Finish Explorer/evidence inspector.
3. Finish Terminal command UX and Process Manager.
4. Finish dialogue/backlog system.
5. Integrate touch HUD with InputManager.
6. Build pause/settings/save UI.
7. Implement boot/recovery screens.
8. Wire the vertical-slice world↔filesystem state bridge.
9. Only then expand final authored art for the vertical slice.
10. After the slice is playable on target phones, produce chapter-specific art in batches.
