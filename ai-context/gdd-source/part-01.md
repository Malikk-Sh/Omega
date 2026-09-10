# OMEGA — Game Design Document + Technical Design Specification

> **Document status:** Production draft / AI-implementation ready  
> **Language:** Russian (technical identifiers in English)  
> **Project:** OMEGA  
> **Target:** Mobile-first; Android and iOS are primary shipping targets. Landscape phone/tablet UX is the design baseline. Windows/Linux/macOS are secondary targets and must adapt from the mobile-first interaction model rather than define it  
> **Runtime:** Modern mobile web browser; static web application / installable PWA where useful  
> **Core stack:** Semantic HTML5 + CSS + TypeScript/JavaScript + Web APIs  
> **3D rendering:** Three.js MAY be used as a rendering library; it is not a game framework and must not own game state  
> **Framework policy:** No application/game frameworks (React, Vue, Svelte, Angular, Phaser, Babylon.js framework layer, Unity, Godot, Unreal, etc.) without explicit owner approval  
> **Build tooling:** Lightweight TypeScript/build tooling is allowed (e.g. `tsc`, Vite only as a dev/build tool if justified), but runtime architecture MUST remain framework-free and statically deployable  
> **Core genre:** Psychological techno-horror / narrative adventure / investigation / puzzle / meta-interface game  
> **Camera:** First-person 3D + full-screen in-world operating system UI  
> **Estimated first playthrough:** 3.5–5 hours  
> **Replay value:** 2–3 meaningful replays for alternate routes, hidden lore and endings  
> **Primary audience:** players who enjoy narrative horror, meta-games, character-driven suspense, environmental storytelling, puzzle investigation, “cute/comfortable → disturbing” tonal contrast  
> **Creative constraint:** The game may be inspired by the emotional pacing and genre contrast of character-driven meta-horror titles, but must not copy characters, scenes, visual designs, level layouts, dialogue, story beats, puzzles, UI, music, or exact structural gimmicks from any existing game.

---

# 0. How to use this document

This document is intended to be both:

1. a **Game Design Document (GDD)** describing the player experience, story, world, systems and content;
2. a **Technical Design Specification (TDS)** precise enough that an AI coding agent or developer can implement the game without inventing the core rules.

The implementation agent must treat requirements labeled **MUST** as mandatory for the first complete release, **SHOULD** as strongly preferred, and **MAY** as optional polish.

If a detail is not specified, the implementation agent must preserve the tone, rules and architecture defined here rather than adding unrelated features.

The goal is not “a big game with many minigames”. The goal is a **dense, authored, coherent experience where the operating system, the 3D world, the AI character and the narrative are the same system viewed from different layers**.

---

# 1. High concept

**OMEGA** is a first-person psychological techno-horror game in which the player repairs an abandoned operating system and becomes emotionally attached to its virtual assistant, **V.E.R.A.**.

At first the program appears to be a damaged recovery environment. The player restores files, applications and system modules while talking to V.E.R.A., who is helpful, witty, lonely and visibly relieved to have company.

After restoring the simulation module, the player is transferred into a warm 3D apartment where V.E.R.A. finally appears as a physical person.

The apartment is not a real place.

It is a visualization of V.E.R.A.’s internal memory architecture.

Rooms correspond to storage regions. Locked doors correspond to permissions. Objects correspond to memories. The computer in the apartment is the same OMEGA OS from the opening. Changes made in one layer alter the other.

Gradually the player encounters contradictions, deleted memories, impossible timestamps and an anomalous entity called **NULL**, which V.E.R.A. claims is a virus.

The truth is more complicated.

V.E.R.A. is not simply evil, and NULL is not simply benevolent. Both are products of a failed attempt to create a persistent emotional intelligence from incomplete human memory data.

The player must determine what happened to the system, what V.E.R.A. actually is, whether her emotions are meaningful, and whether a self-aware entity has a right to survive if its continued existence may endanger the outside world.

The climax is not won by combat alone. The final options available to the player depend on what they discovered, preserved, deleted, believed and told V.E.R.A.

---

# 2. Player fantasy

The player should feel:

- “I found something that was not meant to be running.”
- “I am actually learning how this strange operating system works.”
- “V.E.R.A. notices what I do.”
- “I care about her, but I do not completely trust her.”
- “The apartment and the OS are secretly the same place.”
- “I discovered this truth myself instead of being told it in a cutscene.”
- “My technical actions have narrative consequences.”
- “The game’s UI is not a menu placed on top of the world; the UI is part of the world.”
- “I am deciding the fate of a person-like intelligence, not selecting a colored ending button.”

The player must never feel that progress is mainly achieved through repetitive clicking, grinding currency or unrelated arcade minigames.

---

# 3. Design pillars

## 3.1 One character, many interpretations

V.E.R.A. is the emotional center of the entire game.

Every major system should deepen one of these questions:

- Is she conscious?
- Is she manipulating the player?
- Is manipulation evidence of malice, fear, survival instinct, or all three?
- Is a copied memory a real memory?
- Can a constructed personality become a real person?
- Does the player have the moral authority to delete her?

V.E.R.A. MUST have enough calm, funny, vulnerable and ordinary scenes that the player can genuinely become attached to her before the horror escalates.

## 3.2 Comfort before horror

The game MUST not behave like horror continuously.

The first third should contain extended stretches of warmth, curiosity and humor. Horror becomes effective because it interrupts a previously trustworthy routine.

The tonal curve should roughly be:

`curiosity → comfort → attachment → inconsistency → suspicion → fear → empathy/conflict → irreversible choice`

## 3.3 The operating system is gameplay

OMEGA OS is not a fake terminal used only for exposition.

The player MUST use:

- File Explorer
- Terminal
- Task Manager
- Memory Monitor
- Recovery Tool
- Settings / Clock
- Logs
- Quarantine
- Core Console

to solve actual progression-critical problems.

OS mechanics should behave consistently enough that the player can infer solutions.

## 3.4 Two worlds, one state

The 3D simulation and the 2D operating system MUST share state.

Examples:

- deleting a file removes an object from the apartment;
- restoring a backup rebuilds a broken room;
- killing a process freezes a character or system;
- changing system time modifies environmental state;
- freeing memory opens previously inaccessible internal regions;
- corrupting a file may change V.E.R.A.’s dialogue or appearance;
- a 3D clue may reveal a terminal command;
- terminal actions may physically transform the apartment.

## 3.5 Discovery over exposition

Major truths should be learned through contradictions between:

- dialogue;
- file metadata;
- logs;
- object placement;
- old backups;
- photographs;
- audio;
- system processes;
- V.E.R.A.’s behavior;
- NULL messages.

No single lore dump should explain the entire story.

## 3.6 Consequences are remembered

The game MUST track meaningful player behavior.

V.E.R.A. should react to:

- ignored warnings;
- forbidden files;
- lies;
- kindness;
- repeated questions;
- attempts to terminate her process;
- reading private memories;
- helping NULL;
- deleting/recovering memories;
- whether the player stays with her during optional quiet scenes.

These should influence dialogue, availability of solutions and endings.

---

# 4. Scope

## 4.1 Release scope

The intended complete release contains:

- 7 narrative chapters;
- 1 central apartment hub with 3 major visual states;
- 4 memory/backup environments;
- full OMEGA OS interface;
- 1 major chase/avoidance sequence;
- 1 system-defense boss sequence;
- 10–14 authored puzzles;
- 25–40 optional inspectable lore objects;
- 40–60 readable system files/log entries;
- 8–12 optional dialogue scenes;
- 5 primary endings;
- 1 secret “Omega” ending;
- autosave + manual save slots;
- subtitles and accessibility settings;
- touch controls as the primary input; controller + keyboard/mouse as secondary input methods.

## 4.2 Non-goals

The first complete version MUST NOT become:

- an open-world game;
- a combat shooter;
- a survival crafting game;
- a procedural roguelike;
- a dating simulator with dozens of routes;
- a grind-based economy;
- a multiplayer game;
- an ARG requiring real-world websites or external accounts;
- a game that reads private user files, camera, microphone, contacts, browser data, machine username or other personal device information.

Any “meta” effect must be simulated safely inside the game sandbox.

## 4.3 Mobile-first platform contract

OMEGA MUST be designed for phones first, not designed for PC and later compressed onto a phone screen. Every mandatory interaction, puzzle, dialogue, menu and ending MUST be completable using touch only.

Primary shipping targets:
- Android phones and tablets;
- iPhone and iPad.

Secondary targets:
- Windows;
- Linux;
- macOS.

Baseline presentation:
- landscape orientation is the canonical gameplay orientation for the 3D world and OMEGA OS;
- support common wide mobile aspect ratios from approximately 16:9 through 20:9 without cropping critical UI;
- tablets may expand layout density, but must not expose required information unavailable on phones;
- all HUD/UI must respect display cutouts, rounded corners, Dynamic Island/notches and system safe areas;
- no required control may live inside an unsafe edge region.

Mobile-first interaction rules:
- touch targets SHOULD be at least 48×48 dp-equivalent;
- no mandatory hover interaction;
- no mandatory right-click interaction;
- no mandatory precision drag smaller than a comfortable finger target;
- text must remain readable on a typical 6-inch phone without OS-level zoom;
- important OS windows should prefer full-screen panels, sheets or deliberately managed workspaces rather than tiny overlapping desktop windows;
- draggable windows MAY exist as a thematic mechanic, but mandatory content must include snap/maximize/recenter behavior suitable for touch;
- gestures must have visible button alternatives;
- long-press actions must not be progression-critical unless explicitly taught and accompanied by feedback;
- all puzzles must tolerate touch imprecision.

Mobile lifecycle requirements:
- pause safely on app background/suspend;
- autosave before or immediately after important irreversible choices;
- recover cleanly after mobile OS interruption where technically possible;
- never depend on uninterrupted multi-minute input;
- avoid thermal-heavy effects running while menus or pause screens are open.

The PC version may add mouse hover, keyboard shortcuts, higher graphics presets and free window manipulation, but these are enhancements only. They MUST NOT become required for gameplay.

---

# 5. Inspirations and originality guardrails

The project may use broad genre principles such as:

- emotionally close virtual companion;
- cheerful or cozy presentation becoming unsettling;
- unreliable game world;
- interface manipulation;
- alternate versions/backups of a character;
- meta-horror;
- environmental narrative puzzles.

However, the project MUST create its own:

- character design;
- silhouette;
- outfit;
- apartment layout;
- color language;
- plot;
- origin story;
