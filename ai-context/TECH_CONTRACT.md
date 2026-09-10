<!-- AUTO-GENERATED from docs/OMEGA_IMPLEMENTATION_CONTRACT.md. Do not edit this copy manually. -->
# OMEGA — implementation contract

This file is a compact mandatory companion to the full GDD.

## Target

OMEGA is a **mobile-first browser game**. Android/iOS mobile browsers are primary. Landscape phone/tablet UX is the baseline; desktop is secondary and adapts from mobile rather than defining the controls.

## Allowed runtime technology

- semantic HTML5
- CSS
- JavaScript / TypeScript
- Web APIs
- Canvas / WebGL2
- Web Audio API
- IndexedDB; localStorage only for tiny preferences/fallbacks
- Web Workers / Service Worker where justified
- focused external JS/TS libraries
- Three.js as a rendering library for 3D

## Forbidden unless the owner explicitly changes this contract

Do not introduce React, Vue, Angular, Svelte, Solid, Phaser, Godot, Unity, Unreal, or another application/game framework. Do not let Three.js own canonical game state. Runtime architecture must remain framework-free and deployable as static web files.

## Rendering split

- 3D world: one WebGL canvas, Three.js allowed.
- OMEGA OS, menus, HUD, dialogue, terminal and touch controls: real DOM + CSS + SVG.
- Canonical game/story state: serializable TypeScript/JavaScript services, independent of DOM and Three.js objects.
- Content: external JSON/data modules where practical.

## Mobile-first rules

The complete game must be finishable using touch only. All required controls must respect safe areas and common narrow phone sizes. Minimum primary touch target is 44 CSS px. Terminal interaction must work with the mobile virtual keyboard. Pause/suspend/resume, orientation changes, memory pressure and low-performance settings must be handled deliberately.

## UI asset rule

Functional UI is not raster screenshots. Build windows, buttons, inputs, lists, dialogue boxes, notifications, tabs, save slots and progress bars in HTML/CSS. Use SVG for icons/glyphs/effects. Use PNG/WebP only for authored raster art such as portraits, photographs, textures and special effects.

## Asset status rule

Read `assets/v2/asset-manifest.json`. Every asset is `final`, `reference`, or `placeholder`. Never silently promote reference/placeholder art to final. Gameplay binds by stable asset ID so art can be replaced without changing story logic.

## Architecture goals

Use small modules such as GameState, EventBus, SaveManager, AssetManager, AudioManager, InputManager, WorldRenderer, InteractionSystem, OmegaOS, FileSystem, Terminal, ProcessManager, DialogueEngine, ChapterManager and EndingResolver. Avoid giant managers, hidden global state, inline onclick handlers, `window.*` module coupling, and frame-rate-dependent gameplay timers.

## Persistence

Primary saves use IndexedDB with a versioned serializable JSON schema. Critical choices, discoveries, file-system mutations, chapter/checkpoint, V.E.R.A. relationship state, NULL state and world bindings must survive reloads. DOM nodes and Three.js object references are never persisted directly.

## Core vertical slice

The first architecture milestone must prove a shared-state bridge: a simple 3D apartment contains a framed photo; the same photo exists as `/memories/test_photo.img` inside the DOM-based OMEGA OS; deleting/restoring the virtual file hides/shows the 3D object; save/load preserves the result after page reload. This slice must be touch-completable before expanding story content.

## Placeholder policy

Missing noncritical art must not block implementation. Use project-owned SVG placeholders or primitive Three.js geometry, preserve intended layout/aspect ratio, and mark TODO_ART/TODO_MODEL/TODO_AUDIO. Never use emoji as production placeholders. Never bake required localized dialogue into raster art.
