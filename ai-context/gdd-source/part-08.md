UI_TERMINAL_HELP
FILE_SEA_LOG_03_BODY
ENDING_PURGE_TITLE
```

Do not concatenate grammar-sensitive sentences from fragments.

---

# 59. Testing strategy

## Unit-like tests

Test:
- save serialization;
- flag conditions;
- ending resolver;
- terminal parser;
- filesystem operations;
- process suspension;
- clock condition evaluation;
- dialogue branching.

## Integration tests

Required automated or scripted checks:

1. New game can reach HOME.
2. Save/load in every chapter restores correct world state.
3. Deleting/restoring bound file changes world object.
4. Suspending watchdog stops corridor loop.
5. All endings are reachable from valid states.
6. Secret ending cannot unlock without conditions.
7. Reduced glitch mode remains readable.
8. Touch can navigate every mandatory OS screen and complete every required puzzle.
9. Controller can navigate every mandatory OS screen.
10. Safe-area layouts remain valid on representative notched phones and tablets.
11. Background/suspend and resume cannot silently corrupt progression state.

## Mobile device matrix

Before release, test at minimum:
- one lower/mid Android device representative of the minimum supported GPU/RAM tier;
- one current mid/high Android device;
- one smaller iPhone form factor;
- one larger/notched iPhone form factor;
- one tablet class device or simulator layout.

For each representative configuration verify:
- boot and chapter transitions;
- touch movement/look/interact comfort;
- software keyboard terminal flow;
- safe areas and aspect-ratio adaptation;
- 30 FPS stability target;
- thermal behavior over an extended play session;
- suspend/resume;
- save/load;
- all mandatory puzzles;
- final ending interaction.

---

# 60. Debug tools

Development builds should include a hidden debug panel.

Features:
- jump chapter;
- set flags;
- set stats;
- unlock discoveries;
- set simulated clock;
- open any OS app;
- set process state;
- preview dialogue;
- trigger ending resolver;
- save state dump.

Debug tools must be disabled in release builds.

---

# 61. Logging

Development log categories:

```text
[NARRATIVE]
[STATE]
[DIALOGUE]
[FILESYSTEM]
[PROCESS]
[WORLD_BINDING]
[SAVE]
[PUZZLE]
[ENDING]
```

Avoid noisy per-frame logs.

---

# 62. Error handling

If content ID missing:
- log descriptive error;
- show safe fallback only in development;
- do not crash entire save if avoidable.

If save version incompatible:
- create backup;
- attempt migration;
- inform player if migration fails.

---

# 63. Production milestones

# Milestone 0 — Web architecture prototype

Deliver:
- static web project boots on mobile browser;
- TypeScript entrypoint;
- Three.js/WebGL apartment test scene;
- DOM/CSS OMEGA OS shell;
- touch-first movement/look/interact;
- GameState;
- EventBus;
- IndexedDB save manager;
- virtual filesystem prototype;
- one world binding;
- asset manifest with placeholder/reference/final statuses.

Definition of done:
delete a virtual file in OS → bound object disappears in 3D → reload page → load save → result persists.

# Milestone 1 — Vertical slice

Contains:
- BOOT;
- first 15–20 minutes HOME;
- initial V.E.R.A. representation;
- File Explorer;
- Terminal;
- one cozy scene;
- P02 Missing Picture;
- first anomaly;
- autosave;
- production mobile UI component set.

This is the most important milestone.

Do not build all endings before this feels good.

# Milestone 2 — Investigation systems

Add:
- Task Manager;
- Event Log;
- simulated clock;
- STATIC chapter;
- NULL first appearance;
- fake notification puzzle.

# Milestone 3 — Quarantine

Add:
- process world bindings;
- permissions;
- Recovery Tool;
- QUARANTINE chapter;
- NULL protocol reconstruction.

# Milestone 4 — Backup framework

Add:
- Backup Manager;
- version loading;
- common memory-token system;
- all four backup chapters.

# Milestone 5 — Sea 2017

Add:
- beach environment;
- archive reconstruction;
- major story reveal;
- Dr. Morr final archive.

# Milestone 6 — Core + endings

Add:
- Firewall sequence;
- Desktop War;
- memory allocation;
- Core Console;
- all endings;
- credits.

# Milestone 7 — Polish/PWA/release

Add:
- final animation/art pass;
- final audio;
- localization;
- accessibility;
- performance;
- touch UX and safe areas;
- mobile thermal tuning;
- responsive desktop controls;
- offline caching/PWA only if it improves release goals;
- QA;
- achievements only if desired.

# 64. Vertical slice acceptance criteria

The slice is successful only if a tester can say all of the following:

- “I understand basic OMEGA OS rules.”
- “I like or am at least interested in V.E.R.A.”
- “The apartment feels connected to the computer.”
- “I personally discovered one contradiction.”
- “The horror did not begin as constant screaming/glitches.”
- “I want to know what V.E.R.A. is hiding.”

If testers only say “cool glitch effects”, the slice has failed the narrative goal.

---

# 65. AI implementation rules

This section is addressed directly to an AI coding agent.

## 65.1 General behavior

You are implementing **OMEGA** from this specification.

You MUST:

- preserve the defined architecture;
- keep the project runnable after each meaningful change;
- implement systems incrementally;
- prefer data-driven content;
- avoid monolithic scripts;
- write clear, typed TypeScript where practical;
- use typed variables/functions where practical;
- add comments only where logic is non-obvious;
- avoid introducing network dependencies unless explicitly required;
- not replace game systems with placeholder text screens in the final implementation.

## 65.2 Before coding

First:
1. inspect the repository;
2. identify the current prototype;
3. preserve the current web prototype before large refactors and create an incremental migration branch/directory when appropriate;
4. document assumptions;
5. implement Milestone 0 before narrative bulk content.

Do not rewrite everything blindly without preserving useful existing content.

## 65.3 Implementation order

Required order:

```text
GameState
→ EventBus
→ SaveManager
→ WorldRenderer / FirstPersonController
→ Interaction system
→ OmegaOS shell
→ FileSystemService
→ WorldBinding
→ DialogueManager
→ V.E.R.A. controller
→ BOOT
→ HOME vertical slice
→ remaining systems
```

## 65.4 Code quality constraints

Do not:

- use one giant multi-thousand-line `GameManager.ts`;
- hardcode every dialogue in scripts;
- couple systems through deep DOM queries or global mutable `window.*` state;
- depend on frame rate for timers;
- rely on real system time for story progression;
- use random puzzle solutions unless seeded and clearly communicated;
- access user device files.

## 65.5 Scene changes

Use a `SceneRouter` / environment router that:
- fades safely;
- autosaves at allowed transitions;
- restores player spawn;
- handles backup-world return state.

## 65.6 Content placeholders

During implementation, missing art/audio/3D content may use controlled placeholders.

Mandatory rules:
- consult `/assets/v2/asset-manifest.json` during migration (or `/assets/asset-manifest.json` after v2 becomes the canonical asset root);
- `status: "final"` may ship;
- `status: "reference"` may guide implementation but is not automatically shippable;
- `status: "placeholder"` is temporary;
- preserve the intended aspect ratio and interaction bounds;
- do not substitute emoji;
- do not generate random character identities when V.E.R.A./NULL canonical references exist;
- do not put required localized text inside raster art.

Use explicit markers in code/data where useful:

```text
TODO_ART:
TODO_AUDIO:
TODO_MODEL:
```

A development asset audit MUST be able to list all non-final assets.

The implementation should continue when noncritical art is missing. A grey box with a descriptive dev-only label is preferable to blocking an entire feature.

## 65.7 Testing after each system

After implementing a system:
- run project;
- test success path;
- test failure path;
- test save/load;
- verify controller/UI focus where relevant;
- fix errors before moving on.

---

# 66. Suggested first AI task

Use this exact scoped task for the first implementation pass:

> Refactor OMEGA into a framework-free mobile-first web game without deleting the working legacy prototype. Use semantic HTML, CSS and TypeScript/JavaScript; application/game frameworks are forbidden. Three.js may be used only as the 3D rendering library. Implement `GameState`, a typed `EventBus`, IndexedDB `SaveManager`, `AssetManager`, a basic first-person apartment test scene in a WebGL canvas, touch movement/look/interact controls, and a safe-area-aware DOM/CSS `OmegaOS` overlay. Implement one virtual file `/memories/test_photo.img` and one `WorldBinding` where deleting/restoring that file hides/shows a framed 3D photo. Add keyboard/mouse as secondary desktop input. Use `/assets/v2/asset-manifest.json` (or move it to the canonical asset root when migration is complete) and preserve explicit `placeholder/reference/final` statuses. Keep state serializable and data-driven. The output must remain deployable as static files.

Acceptance:
- project launches from a documented local static/dev server;
- phone viewport is the primary tested layout;
- touch-only interaction can enter the OS and operate Explorer;
- Explorer shows `/memories/test_photo.img`;
- deleting file hides framed photo;
- restoring file shows it;
- save/load persists deleted/restored state after page reload;
- no React/Vue/Svelte/Angular/Phaser/Godot/Unity dependency is introduced;
- required UI is DOM/CSS/SVG, not a screenshot texture.

# 67. Suggested second AI task

> Implement the BOOT chapter and V.E.R.A. 2D assistant panel using the existing framework-free web architecture. Add the recovery diagnostic puzzle, simulated boot log, System Integrity progression, File Explorer, Terminal base commands, and transition trigger for `SIMULATION_ENGINE.pkg`. Use external JSON data for dialogue and filesystem content. Use the asset manifest and placeholders where noncritical final art is unavailable. Add checkpoints and test save/load during BOOT. All mandatory UI must remain touch-friendly on a narrow phone viewport and use DOM/CSS/SVG.

# 68. Suggested third AI task

> Implement the HOME vertical slice as mobile-first web content: stable apartment environment rendered through Three.js/WebGL, V.E.R.A. presence/controller using the best currently available approved asset status, touch-first navigation/interactions, gaze/staging behavior, apartment tour, rain-at-window optional scene, and Missing Picture puzzle. The computer must open the same DOM-based OMEGA OS state. V.E.R.A. must react when the player deletes and restores the bound photo. Validate at 360×800, 390×844 and at least one larger phone/tablet viewport. End the slice with the first unauthorized-process notification. Keep visual placeholders explicit and replaceable.

# 69. Definition of done for full game

The game is considered feature-complete when:

- all 7 chapters are playable start to finish;
- all mandatory puzzles function;
- all 6 endings resolve correctly;
- no progression-critical placeholder content remains;
- save/load works from every chapter;
- all major choices influence at least one later reaction or ending condition;
- OS and 3D layers share persistent state;
- V.E.R.A. relationship state meaningfully changes dialogue;
- NULL route is coherent;
- secret ending has valid discoverable requirements;
- accessibility settings work;
- touch alone can finish the entire game;
- keyboard/mouse and controller can also finish the game on supported secondary platforms;
- mandatory UI remains usable on phone safe areas and common mobile aspect ratios;
- no real user-device data is accessed;
- release build has no debug shortcuts;
- credits and restart flow work.

---

# 70. Final creative test

Before approving any new feature, ask:

