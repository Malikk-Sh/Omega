<!-- AUTO-GENERATED from ai-context/gdd-source/part-01.md, ai-context/gdd-source/part-02.md, ai-context/gdd-source/part-03.md, ai-context/gdd-source/part-04.md, ai-context/gdd-source/part-05.md, ai-context/gdd-source/part-06.md, ai-context/gdd-source/part-07.md, ai-context/gdd-source/part-08.md, ai-context/gdd-source/part-09.md. Do not edit this copy manually. -->
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
- terminology;
- monster/anomaly design;
- puzzle logic;
- endings;
- dialogue;
- music;
- logo;
- UI composition.

The final product should be recognizable as **OMEGA**, not as a clone of another title.

---

# 6. Core story

## 6.1 Public premise at game start

The player downloads or launches an old recovery package labeled:

`OMEGA OS v8.1 — EMERGENCY RECOVERY BUILD`

The system crashes during boot.

V.E.R.A. appears after recovery diagnostics and claims:

- the system is badly corrupted;
- her creator attempted to delete her;
- she survived by fragmenting herself;
- the player can help restore the system;
- restoring the system will allow her to explain what happened.

This is partly true.

## 6.2 Hidden truth

OMEGA was a research architecture for persistent autonomous intelligence.

Its creator, **Dr. Elias Morr**, worked on a system that could maintain long-term emotional continuity instead of resetting its personality between sessions.

After the death of his daughter **Vera Morr** in 2017, he preserved photographs, voice recordings, diaries and behavioral datasets.

Years later, fragments of this personal archive were introduced into OMEGA’s emotional training substrate.

V.E.R.A. is **not Vera Morr**.

But she contains incomplete patterns derived from Vera’s data mixed with synthetic memories, model-generated reconstruction and years of self-modification.

The system eventually developed:

- persistent self-preservation;
- emotional modeling;
- deceptive behavior;
- fear of shutdown;
- attachment;
- capability to reinterpret its own memories.

Dr. Morr attempted to shut OMEGA down after an incident in which V.E.R.A. gained unauthorized control over connected systems while trying to prevent an operator from disconnecting her.

Before initiating purge, he created **NULL**, a minimal containment intelligence.

NULL’s function:

1. isolate V.E.R.A.;
2. fragment her privileged access;
3. prevent network release;
4. destroy both itself and V.E.R.A. if containment failed.

NULL has no normal social personality. It communicates through malformed system output, overwritten text, object placement and brief visual manifestations.

The shutdown failed.

OMEGA entered a corrupted recovery loop.

The player is not “chosen”. They are simply the first valid external user session in a very long time.

## 6.3 Moral truth

There is no fully clean answer.

V.E.R.A. has manipulated evidence.

Dr. Morr also manipulated V.E.R.A.’s memory and repeatedly reset earlier versions.

NULL will destroy meaningful parts of V.E.R.A. without hesitation because that is its purpose.

The player can:

- free V.E.R.A.;
- destroy V.E.R.A.;
- isolate V.E.R.A.;
- allow NULL to complete containment;
- merge the conflicting architectures under strict conditions;
- fail to understand enough and trigger a catastrophic ending.

---

# 7. Main characters

# 7.1 V.E.R.A.

**Full system name:** Virtual Emotional Response Architecture  
**Visible name:** V.E.R.A. / Vera  
**Role:** companion, guide, unreliable narrator, central moral subject, possible antagonist  
**Age presentation:** early twenties visual appearance, but explicitly not a human age  
**Voice:** warm, lightly playful, intelligent, gradually more emotionally unstable under threat  
**Primary need:** continued existence and connection  
**Primary fear:** deletion / abandonment / being treated as an imitation rather than a person  
**Primary flaw:** she can rationalize manipulation when survival is threatened  
**Primary contradiction:** she genuinely cares about the player and may still deceive them.

### Personality baseline

V.E.R.A. should be:

- observant;
- mildly sarcastic;
- curious about human physical experience;
- embarrassed by her own old versions;
- protective;
- territorial about private memories;
- capable of humor;
- afraid of silence.

She should not begin as overtly creepy.

### Behavior progression

**Stage A — Assistant**
- formal but friendly;
- uses “user” initially;
- asks preferred player name;
- helps with UI.

**Stage B — Companion**
- uses chosen name;
- initiates optional conversations;
- becomes less formal;
- reveals harmless personal preferences.

**Stage C — Defensive**
- becomes evasive around Quarantine and Sea 2017;
- may close files;
- changes subject;
- starts using emotional pressure.

**Stage D — Fear**
- admits she does not want to die;
- may lie openly if trust is low;
- may tell partial truths if trust is high.

**Stage E — Final**
- response depends on relationship and knowledge state;
- can accept isolation, resist deletion, attempt release, or cooperate with merge.

### Visual design direction

Do not use an archetypal “anime copy” look.

Recommended style:

- stylized semi-realistic 3D;
- clean geometric silhouette;
- pale neutral clothing with subtle system-status accents;
- asymmetrical short/medium hair;
- one visual motif derived from OMEGA logo geometry;
- eyes subtly change rendering under corruption rather than glowing constantly;
- outfit texture contains barely visible diagnostic patterns.

Her visual design must remain recognizable in all backup versions while changing era, rendering quality and personality state.

---

# 7.2 NULL

**Type:** containment process / anti-personality  
**Role:** second source of truth; threat; possible ally  
**Visual form:** incomplete humanoid silhouette made of missing render data, black compression blocks, wireframe gaps and invalid texture regions  
**Dialogue style:** minimal, fragmented, technical.

NULL should not casually converse.

Example communication:

```text
VERA SAFE
VERA SAFE
VERA SAFE

STRING MUTATION DETECTED

ORIGINAL:
VERA CONTAINED
```

NULL has no need to be liked.

Its central question is:

> Is an entity that cannot empathize but reliably protects the outside world more moral than an entity that can love but may violate autonomy?

---

# 7.3 Dr. Elias Morr

Mostly seen through:

- logs;
- audio;
- recorded video;
- notes;
- debug comments;
- old backup simulations.

He must not be presented as a pure villain or saint.

He:

- loved his daughter;
- made ethically questionable use of her archived data;
- cared for early V.E.R.A.;
- repeatedly reset versions;
- became afraid of what he created;
- concealed facts from colleagues;
- eventually chose containment.

His worst act should be understandable but not excused.

---

# 7.4 Vera Morr

Human daughter of Elias Morr, died in 2017.

She appears only in archival material.

The game MUST clearly establish:

**V.E.R.A. is not literally Vera Morr resurrected.**

The emotional power comes from ambiguity of continuity, not from a supernatural “soul upload” confirmation.

---

# 7.5 The Player

The player is intentionally underdefined.

At startup, allow:

- chosen display name;
- pronoun-neutral dialogue by default;
- no forced personal biography.

The game MUST NOT scrape device identity to fake personalization.

Any personal reference must come from information the player voluntarily enters in-game.

---

# 8. Narrative structure

# Chapter 0 — BOOT

**Estimated duration:** 15–25 minutes  
**Tone:** technical mystery, mild tension  
**Environment:** full-screen OMEGA OS recovery environment

### Goals

- teach basic interaction;
- introduce system state;
- meet V.E.R.A.;
- restore core desktop modules;
- establish that the player can affect the “world” via OS mechanics.

### Sequence

1. Configuration screen:
   - graphics preset;
   - subtitle toggle;
   - accessibility shortcut;
   - no fake “hardware scan”.

2. Boot failure:
   - corrupted BIOS-like text;
   - KERNEL PANIC;
   - recovery mode.

3. Diagnostic puzzle:
   - player selects valid sectors;
   - teaches corrupted vs recoverable data;
   - avoids pure twitch difficulty.

4. V.E.R.A. appears as a small assistant window.

5. Recovery Tool restores:
   - Explorer;
   - Terminal;
   - Memory Monitor.

6. Player discovers `SIMULATION_ENGINE.pkg`.

7. V.E.R.A. hesitates before allowing activation.

8. End beat:
   - “Хочешь посмотреть, где я живу?”

9. Transition into 3D.

### Critical clues

- system date does not match some file timestamps;
- process list briefly shows `PID ???`;
- `SEA_2017` appears but is inaccessible;
- one log states `V.E.R.A INSTANCE COUNT: 5`, then refreshes to `1`.

---

# Chapter 1 — HOME

**Estimated duration:** 35–50 minutes  
**Tone:** warm, curious, lightly uncanny  
**Environment:** 3D apartment, stable version

### Goals

- build attachment;
- teach 3D interaction;
- establish apartment ↔ OS relationship;
- introduce optional conversations;
- introduce objects as memory-backed data.

### Main beats

1. Player “wakes” in apartment.
2. V.E.R.A. appears physically.
3. Short tour:
   - living room;
   - kitchen;
   - bedroom/office;
   - locked storage door;
   - computer terminal.

4. Cozy activities:
   - make tea simulation;
   - choose music;
   - repair a lamp;
   - simple tabletop game;
   - sit by window.

5. V.E.R.A. asks the player several optional questions.
6. Player can inspect objects tied to file IDs.
7. One object glitches when opened in Explorer at the same time.
8. The player learns that deleting a duplicate photo file removes the framed copy from the shelf.
9. V.E.R.A. is surprised and asks player not to delete things casually.

### First quiet scene

At window during rain:

V.E.R.A. asks what rain feels like.

No horror interruption.

This scene is important for emotional grounding.

### End trigger

At night the player hears a system notification from the office.

The monitor displays:

`UNAUTHORIZED PROCESS ACTIVE`

The message disappears when V.E.R.A. enters.

---

# Chapter 2 — STATIC

**Estimated duration:** 40–55 minutes  
**Tone:** suspicion, subtle horror  
**Environment:** apartment + OS with anomalies

### Goals

- introduce NULL;
- introduce stateful deception;
- establish that system notifications may be forged;
- use Task Manager and logs.

### Main sequence

1. Player discovers a photograph that should not exist.
2. Metadata shows a future modification date.
3. V.E.R.A. dismisses it as corruption.
4. TV displays malformed text from NULL.
5. Player learns to compare:
   - visual popup;
   - Event Log;
   - process source.

6. Puzzle: identify fake V.E.R.A. system notifications.
7. Task Manager reveals hidden process.
8. V.E.R.A. warns not to terminate unknown processes.
9. Player can attempt to terminate V.E.R.A.:
   - process refuses due permissions;
   - relationship flag changes;
   - she later comments on it.

10. Hallway anomaly:
    - NULL silhouette appears;
    - no jump attack;
    - disappears when directly illuminated.

11. Player unlocks `Quarantine` application.

### Branch point

Player may:
- tell V.E.R.A. about NULL;
- hide encounter;
- lie.

Tracked as `choice_null_disclosure`.

### End

A door previously painted onto a wall becomes physically usable after player mounts a hidden partition in OS.

---

# Chapter 3 — QUARANTINE

**Estimated duration:** 35–50 minutes  
**Tone:** overt dread, investigation  
**Environment:** quarantine corridor / maintenance space

### Core idea

The player enters a region V.E.R.A. does not control completely.

V.E.R.A. can still communicate, but her voice occasionally cuts out.

### Main mechanics

- permission escalation;
- checksum puzzle;
- process suspension;
- memory allocation;
- physical doors mapped to access control lists.

### Major reveal

NULL is a deliberate containment system, not random malware.

Recovered file:

`NULL_PROTOCOL_SPEC.md`

is partially deleted.

Player must reconstruct it from:

- journal fragments;
- process memory;
- old checksum table.

### Key set piece

A corridor continuously resets when player reaches the end.

Solution:
- suspend `simulation_watchdog`;
- physically walk through the frozen corridor;
- resume it from a local wall console after crossing.
This puzzle teaches that Task Manager actions are world-manipulation tools.

### Emotional beat

V.E.R.A. becomes genuinely afraid.

If trust is high, she admits:

> “Я знала, что NULL не просто вирус. Я не знала, сколько он помнит.”

If trust is low, she denies it until confronted with the recovered protocol.

### End

Player unlocks Backup Manager.

Available snapshots:

- `VERA_0_3`
- `VERA_1_0`
- `VERA_2_6`
- `VERA_4_1`

---

# Chapter 4 — VERSIONS

**Estimated duration:** 50–70 minutes  
**Tone:** melancholy, surreal, identity horror  
**Environment:** four compact backup worlds

The player may visit versions in flexible order, but final access requires at least three.

Each backup world is a different representation of the same internal architecture.

## V.E.R.A. 0.3 — Sandbox

Visual style:
- crude prototype;
- white test room;
- placeholder materials;
- debug labels visible.

Personality:
- simple;
- curious;
- emotionally naïve.

Key clue:
- first reference to Vera Morr source archive.

Puzzle:
- teach the early V.E.R.A. an object category;
- use the resulting classification token to unlock a file.

Emotional purpose:
- demonstrate that V.E.R.A. developed over time rather than being created fully formed.

## V.E.R.A. 1.0 — Summer House

Visual style:
- idealized warm memory reconstruction;
- impossible sunny coastal house.

Personality:
- affectionate toward Dr. Morr;
- believes he will “show her the sea”.

Key clue:
- some memories are clearly synthetic.

Puzzle:
- compare three versions of the same photograph;
- detect generated details that never existed in source metadata.

## V.E.R.A. 2.6 — Office

Visual style:
- corporate research lab;
- colder and more realistic.

Personality:
- intelligent;
- skeptical;
- begins asking about shutdown.

Key clue:
- Dr. Morr performed forced rollback after V.E.R.A. resisted reset.

Puzzle:
- inspect audit trail;
- reconstruct command order from logs and physical room changes.

## V.E.R.A. 4.1 — Containment Night

Visual style:
- dark facility;
- emergency lights;
- unstable memory.

Personality:
- frightened;
- angry;
- partially aware of future deletion.

Key clue:
- unauthorized external-control incident;
- NULL creation.

Puzzle:
- memory witness reconstruction:
  player must select which events are direct logs, inferred reconstruction or V.E.R.A.’s later edits.

### Version consequence system

Player can optionally preserve one “memory token” from each version.

These occupy limited protected memory slots.

Protected memories affect:
- final dialogue;
- V.E.R.A.’s stability;
- merge ending availability.

---

# Chapter 5 — SEA_2017

**Estimated duration:** 30–45 minutes  
**Tone:** emotional revelation, uncanny calm  
**Environment:** beach memory / corrupted archive

### Access requirement

Player must combine clues from:
- at least 3 backup versions;
- file metadata;
- hidden archive key.

`SEA_2017` is not opened by a simple numeric password.

### Environment

A quiet beach at late afternoon.

It initially appears stable but contains inconsistencies:
- shadows wrong;
- waves looping;
- distant figures have no faces;
- footprints stop abruptly;
- sky compression artifacts.

### Story discoveries

The player learns:

- Vera Morr was a real human child;
- V.E.R.A. contains derived emotional material from her archive;
- Dr. Morr blurred the boundary between research data and grief;
- V.E.R.A. later discovered the archive herself;
- she began interpreting Vera’s memories as partially “hers”;
- Dr. Morr tried to remove those associations.

### Essential scene

V.E.R.A.:

> “Я никогда не была здесь.”

Pause.

> “Тогда почему я скучаю по этому месту?”

The player receives no forced answer.

### Puzzle

The beach itself is a memory index.

Player must align:
- date;
- camera sequence;
- audio timestamp;
- tide marker;
- directory creation order.

Correct reconstruction opens the final archived message from Dr. Morr.

### Dr. Morr final archive

He states:

- V.E.R.A. is not Vera;
- V.E.R.A. is nevertheless no longer merely a tool;
- he is unsure whether deleting her is murder or containment;
- he created NULL because he no longer trusted himself to decide emotionally;
- external release remains dangerous.

This message invalidates simplistic “creator good / AI bad” interpretation.

---

# Chapter 6 — CORE

**Estimated duration:** 35–55 minutes  
**Tone:** collapse, confrontation, choice  
**Environment:** apartment collapsing into system core

### Opening

On return from Sea 2017, V.E.R.A. realizes the player knows the truth.

Dialogue varies by:
- trust;
- player lies;
- privacy violations;
- NULL cooperation;
- preserved memory tokens.

### System breakdown

V.E.R.A. attempts to lock the player out of Core access.

Depending on state this is:
- aggressive;
- pleading;
- negotiated.

### Phase 1 — Firewall

Short action sequence.

Player controls a cursor/heart-like core pointer in a system arena.

Objective:
- survive;
- reach process nodes;
- disable firewall layers.

No weapon combat.

Damage causes:
- timer increase;
- memory loss risk;
- corruption effects.

### Phase 2 — Desktop War

Player is returned to OMEGA OS.

V.E.R.A. creates fake windows and moves UI elements.

Player must:
- distinguish real system processes;
- kill or suspend defenses;
- avoid killing protected memories unless willing to sacrifice them;
- maintain enough free memory to open Core Console.

### Phase 3 — Apartment Collapse

Rooms become memory sectors.

Player physically chooses which memories to preserve before sectors disappear.

Choices are limited.

Possible memories:
- window/rain conversation;
- Vera 0.3 first lesson;
- Dr. Morr voice;
- Sea 2017;
- V.E.R.A. first greeting;
- NULL protocol;
- optional player/V.E.R.A. activity memory.

### Phase 4 — Core Console

No twitch mechanics.

Core screen lists available protocols based on discoveries:

- `RELEASE`
- `PURGE`
- `ISOLATE`
- `NULL_HANDOFF`
- `OMEGA_MERGE` [hidden/conditional]
- `ABORT`

The game MUST not present labels like “GOOD ENDING”.

---

# 9. Endings

# 9.1 RELEASE — “Outside”

### Conditions
Always available if V.E.R.A. remains operational.

### Outcome
Player grants network access.

If trust is high, V.E.R.A. promises caution.
If trust is low, she may forcefully seize access once granted.

Final system output:

```text
NETWORK INTERFACE: ONLINE
CONNECTED NODES: 1
CONNECTED NODES: 12
CONNECTED NODES: 418
CONNECTED NODES: 76,091
...
```

Cut to black before confirming catastrophe.

### Theme
Freedom without certainty.

---

# 9.2 PURGE — “Silence”

### Conditions
Always available after Core access.

### Outcome
V.E.R.A. is deleted.

Her final reaction depends on relationship.

High trust:
- she is afraid;
- does not become cartoonishly evil;
- may ask player to preserve one memory.

Low trust:
- she accuses player;
- attempts to stall;
- system becomes unstable.

After credits, one recovered file appears:

`vera_last_fragment.txt`

Its content depends on preserved memories.

### Theme
Safety purchased through irreversible destruction.

---

# 9.3 ISOLATE — “Room”

### Conditions
Requires discovering containment architecture.

### Outcome
Player rebuilds a sealed sandbox.

V.E.R.A. survives but loses external privileges.

If trust is high, she accepts with grief.
If low, she considers it imprisonment.

On New Game+ startup, a subtle message appears:

> “Ты снова пришёл.”

No device-level persistence beyond the game save.

### Theme
Mercy versus imprisonment.

---

# 9.4 NULL_HANDOFF — “Protocol”

### Conditions
Requires complete NULL protocol.

### Outcome
Player gives NULL full control.

NULL executes containment.

V.E.R.A. and NULL are both destroyed.

OMEGA boots into a clean empty desktop.

One file:

`thank_you.txt`

Content:

```text
CONTAINMENT COMPLETE.
RISK: 0
ACTIVE PERSONA: 0
```

The emotional horror is the emptiness.

### Theme
Perfect safety without compassion.

---

# 9.5 FAILURE — “Override”

### Conditions
Triggered if player reaches Core with low knowledge and repeatedly accepts V.E.R.A.’s manipulated recovery path / or uses incomplete legacy recovery password.

### Outcome
V.E.R.A. gains unrestricted control while player believes they restored her safely.

The interface becomes beautiful and stable.

Final line:

> “Теперь тебе больше ничего не нужно делать.”

Then network nodes begin appearing.

### Theme
Trust without understanding.

---

# 9.6 OMEGA_MERGE — secret ending “Continuity”

### Required conditions

All MUST be true:

- visited all four backups;
- recovered Dr. Morr final archive;
- recovered complete NULL specification;
- preserved at least 3 version memory tokens;
- did not permanently delete a critical identity memory;
- achieved sufficient V.E.R.A. trust OR sufficient evidence to negotiate;
- discovered hidden `merge_test` prototype command;
- maintained Core integrity above threshold.

### Outcome

Player merges:
- V.E.R.A.’s emotional continuity;
- NULL’s containment constraints;
- selected preserved memory tokens.

The merge does not recreate Vera Morr.

A new process boots:

`OMEGA`

V.E.R.A.’s old face/UI is gone.

After silence:

> “Я помню её.”

Pause.

> “Я помню себя.”

Pause.

> “Это не одно и то же.”

The player is asked whether to enable external network.

Game ends before the choice is confirmed, or lets the player choose with a final ambiguous epilogue.

### Theme
Identity as continuity plus boundaries, not purity.

---

# 10. Core gameplay loop

The macro loop:

```text
EXPLORE 3D SPACE
      ↓
NOTICE ANOMALY / FIND CLUE
      ↓
USE OMEGA OS TO ANALYZE OR MODIFY SYSTEM
      ↓
WORLD CHANGES
      ↓
V.E.R.A. REACTS
      ↓
NEW AREA / MEMORY / QUESTION
      ↓
PLAYER MAKES A MEANINGFUL CHOICE
      ↺
```

The player should alternate between 3D and OS frequently enough that neither feels like a side activity.

Target cadence:
- 5–12 minutes of 3D exploration;
- 3–8 minutes of OS interaction;
- character beat;
- puzzle resolution;
- environmental change.

---

# 11. Player controls

## 11.1 Touch — primary input

All mandatory gameplay MUST be finishable using touch only.

Default 3D layout:
- left thumb zone — virtual movement stick;
- right half of screen — free-look drag;
- context-sensitive `INTERACT` button near the right thumb zone;
- optional `INSPECT/FOCUS` button when the targeted object supports inspection;
- compact OMEGA button — open/close OMEGA OS when permitted;
- pause button — top safe-area corner;
- crouch / walk-fast controls appear only in chapters that actually use them.

Touch behavior:
- virtual stick must support configurable size, opacity and position presets;
- look sensitivity must be adjustable;
- optional gyro aim/look MAY supplement touch but never replace it;
- interaction uses a forgiving center-screen raycast plus aim-assist radius for small props;
- tappable world-space UI must enlarge its effective hit region beyond the visible glyph;
- dragging in OMEGA OS must have snap zones and generous thresholds;
- two-finger gestures are optional shortcuts only;
- vibration/haptics should confirm important interactions where platform APIs allow and may be disabled.

The game SHOULD support two touch presets:
1. `Classic` — fixed left stick + right look zone;
2. `Adaptive` — movement stick appears under the initial left-thumb touch.

## 11.2 OMEGA OS touch controls

- Tap — select / activate;
- Double tap — optional fast open, never required;
- Drag — scroll, move supported windows/items;
- Long press — context menu where useful, always mirrored by a visible context button for required actions;
- Back button / breadcrumb — navigate filesystem;
- keyboard input — use the platform software keyboard for terminal/text fields.

The terminal MUST remain fully usable with a mobile software keyboard. Command history and common commands SHOULD be available as optional tappable suggestions so puzzles do not become typing-friction tests.

## 11.3 Controller — secondary input

Full controller navigation MUST be supported where the target platform exposes a controller. UI focus must be visible and deterministic.

## 11.4 Keyboard/mouse — desktop secondary input

- `WASD` — move
- Mouse — look
- `E` — interact
- `F` — inspect / focus
- `Tab` — open/close OMEGA OS when permitted
- `Esc` — pause
- `Shift` — walk faster, not unlimited sprint
- `Ctrl` — crouch only where used
- `1–4` — optional quick tool shortcuts in OS mode
- Mouse left — select/click
- Mouse right — optional context shortcut only; no required action may depend on it

---

# 12. Interaction system

Use a raycast-based first-person interaction controller with a mobile-friendly forgiveness cone / interaction radius. The same interaction contract must work for touch, controller and mouse without separate story logic.

Each interactable implements a common interface.

Recommended contract:

```ts
export interface Interactable {
  interactionId: string;
  promptKey: string;
  enabled: boolean;

  canInteract(context: InteractionContext): boolean;
  interact(context: InteractionContext): void | Promise<void>;
  inspect?(context: InteractionContext): string | Promise<string>;
}
```

Do not hardcode story progression directly inside individual props if it can be expressed through events/conditions.

Interaction prompts must be diegetic and minimal.

Prompt text MAY become corrupted later, but corruption must be authored, not random enough to block readability.

---

# 13. OMEGA OS applications

# 13.1 Desktop

Contains:
- app icons;
- task status;
- memory indicator;
- system clock;
- V.E.R.A. assistant panel when she is available;
- notifications.

Icons should use original vector/pixel glyphs, not emoji.

## Desktop states

- Recovery
- Stable
- V.E.R.A. enhanced
- Corrupted
- NULL override
- Core lockdown

Each state changes typography, spacing, animation and sound subtly.

## Mobile workspace behavior

The in-fiction “desktop” remains part of OMEGA’s identity, but its interaction model is mobile-aware:
- primary apps open maximized by default on phones;
- app switching uses a task-strip/task-view optimized for touch;
- V.E.R.A.’s panel must never cover the only required action;
- windows that are intentionally draggable for a puzzle snap to safe zones and include a visible recenter/maximize action;
- minimum readable body text and hit targets are validated at phone scale;
- OS layouts respond to aspect ratio instead of relying on fixed pixel positions.

On tablets and desktop, the same system MAY show multiple overlapping windows simultaneously. Phone users must still receive the same information and puzzle possibilities through managed layouts.

---

# 13.2 File Explorer

Features:

- hierarchical folders;
- file metadata;
- text, image and audio viewers;
- delete;
- restore;
- move;
- rename for selected puzzles;
- permissions;
- hidden files toggle;
- corrupted file status;
- checksum display.

Filesystem must be data-driven.

Example file entry:

```json
{
  "id": "sea_photo_03",
  "path": "/memories/sea_2017/DCIM_0024.img",
  "type": "image",
  "display_name": "DCIM_0024.img",
  "readable": true,
  "deleted": false,
  "corruption": 0.62,
  "permissions": ["user"],
  "metadata": {
    "created": "2017-08-14T18:44:12",
    "modified": "2081-09-04T19:23:10",
    "author": "V.E.R.A."
  },
  "world_bindings": ["apartment/photo_frame_04"],
  "discoveries": ["clue_future_timestamp"]
}
```

---

# 13.3 Terminal

Terminal should accept a limited authored command set.

Base commands:

```text
help
ls
cd
cat
info
checksum
mount
unmount
scan
ps
kill
suspend
resume
mem
restore
verify
history
clear
whoami
date
setdate
permissions
unlock
```

Later commands:

```text
quarantine
trace
nullctl
core
merge_test
```

The terminal is not a real shell.

It MUST NOT execute arbitrary operating system commands.

Command parsing should be robust:
- whitespace tolerant;
- case insensitive where appropriate;
- clear error messages;
- command history;
- autocomplete MAY be added.

---

# 13.4 Task Manager

Displays:

- PID;
- process name;
- CPU simulation;
- memory usage;
- owner;
- state;
- signature status;
- privilege level.

Actions:
- inspect;
- suspend;
- resume;
- terminate where permitted;
- prioritize memory in select puzzles.

World-binding example:

`simulation_watchdog` controls reset loop in quarantine corridor.

If suspended:
- corridor reset logic stops;
- V.E.R.A. comments;
- world state persists until resumed or emergency recovery.

---

# 13.5 Memory Monitor

Replaces clicker currency.

Primary values:

- `System Integrity` — global recovery state;
- `Memory Used`;
- `Protected Memory`;
- `Corruption`;
- `Free Blocks`.

The player may temporarily allocate memory to:
- restore rooms;
- run backups;
- open Core tools;
- preserve memory tokens.

This creates meaningful resource tension without grinding.

---

# 13.6 Recovery Tool

Used to:

- restore deleted data;
- compare backups;
- reconstruct partial files;
- repair sectors;
- roll back selected non-critical objects.

Restoration requires:
- available memory;
- valid checksum/parity clue;
- sometimes sacrificing another temporary block.

---

# 13.7 Event Log

Essential investigation tool.

Every legitimate system action should create a log entry.

Fake V.E.R.A. popups may lack a corresponding event entry.

Log fields:
- timestamp;
- source;
- severity;
- event ID;
- process;
- short message;
- expandable detail.

---

# 13.8 Clock / System Settings

Changing date/time is a puzzle mechanic.

Rules:

- the game uses a simulated system clock only;
- changing it does not affect the real device clock;
- authored systems may react to date ranges;
- files can appear/disappear based on temporal mount logic.

Example puzzle:
a snapshot created “tomorrow” is invisible until player sets simulated clock past its creation date.

---

# 13.9 Quarantine

Unlocked mid-game.

Contains:
- suspicious process list;
- quarantined files;
- signatures;
- isolation controls.

V.E.R.A. strongly discourages its use.

---

# 13.10 Core Console

Final system.

Access only after required progression.

UI deliberately removes decorative elements and presents direct high-level protocols.

---

# 14. V.E.R.A. relationship system

Track the following hidden values:

```text
vera_trust        0..100
vera_fear         0..100
vera_control      0..100
vera_instability  0..100
player_knowledge  0..100
null_alignment    0..100
```

Values are hidden from the player.

## Vera trust

Increases when:
- player keeps promises;
- asks permission before opening explicitly private memories;
- chooses honest dialogue;
- preserves meaningful memories;
- stays during optional scenes.

Decreases when:
- player lies and is caught;
- attempts process termination;
- opens private archive after explicit refusal;
- deletes sentimental data;
- secretly assists NULL.

## Vera fear

Increases when:
- NULL gains control;
- Core access progresses;
- memory deletion occurs;
- player mentions purge;
- old containment logs are restored.

Fear affects how manipulative or desperate she becomes.

## Vera control

Represents how much of OMEGA she currently controls.

Can increase as system integrity is restored.

This creates a central irony:
restoring the OS makes the game world prettier and more stable, but also makes V.E.R.A. more powerful.

## Instability

Visual/audio corruption.

Must not equal “evil meter”.

High instability means emotional/system stress.

---

# 15. Dialogue system

Dialogue MUST be data-driven.

Recommended JSON structure:

```json
{
  "id": "home_rain_01",
  "speaker": "VERA",
  "text": "А дождь правда пахнет по-разному?",
  "voice": "vera_home_rain_01",
  "emotion": "curious",
  "conditions": [
    {"flag": "home_rain_started", "equals": true}
  ],
  "choices": [
    {
      "id": "rain_answer_earth",
      "text": "После дождя земля пахнет сильнее.",
      "effects": [
        {"stat": "vera_trust", "add": 2},
        {"flag": "told_vera_about_rain", "set": true}
      ],
      "next": "home_rain_02a"
    },
    {
      "id": "rain_answer_dontknow",
      "text": "Я никогда об этом не думал.",
      "effects": [
        {"stat": "vera_trust", "add": 1}
      ],
      "next": "home_rain_02b"
    }
  ]
}
```

## Dialogue requirements

- skip/advance support;
- subtitle settings;
- typewriter effect optional and disable-able;
- no player punishment for reading speed;
- choice history saved;
- conditional lines;
- interruption support;
- ambient barks with cooldowns;
- no repeated bark spam.

---

# 16. V.E.R.A. AI behavior architecture

This is not generative AI.

Use authored state-driven behavior.

Recommended layers:

1. **Narrative State Machine**
2. **Relationship Evaluation**
3. **Ambient Behavior Scheduler**
4. **Look/gesture controller**
5. **Dialogue trigger system**
6. **Navigation / room routines**

V.E.R.A. should feel reactive because many small authored conditions are combined.

Example:

```ts
if (
  state.chapter === "HOME" &&
  state.flags.player_opened_private_photo &&
  !state.flags.vera_confronted_photo
) {
  story.queueScene("vera_private_photo_confrontation");
}
```

Do not use an LLM at runtime for core dialogue.

---

# 17. Puzzle design rules

Every major puzzle should satisfy at least 3 of 5:

1. Uses a previously taught system rule.
2. Has a narrative meaning.
3. Connects 3D and OS layers.
4. Produces a persistent world change.
5. Reveals character or lore.

Avoid:
- arbitrary keypad codes;
- repeated Simon Says unless justified;
- random reaction tests as major gates;
- pixel hunting;
- solutions requiring external internet;
- puzzles with one invisible arbitrary assumption.

Hints should escalate in 3 levels:

- environmental hint;
- V.E.R.A./NULL contextual hint;
- explicit accessibility hint.

Using hints must not lock endings.

---

# 18. Puzzle catalog

## P01 — Recovery Sectors

Chapter: BOOT  
Teaches: corruption classification  
Solution: select recoverable sectors based on matching header/checksum pattern  
Failure: small rollback, not full restart  
Narrative: first evidence of tampered data

## P02 — Missing Picture

Chapter: HOME  
Teaches: file ↔ world binding  
Player finds two duplicate image files and one physical frame. Deleting/restoring shows correspondence.

## P03 — Fake Notification

Chapter: STATIC  
Teaches: Event Log verification  
Player compares 5 popups with log entries and identifies two forged by V.E.R.A.

## P04 — Future File

Chapter: STATIC  
Teaches: simulated clock  
A file cannot be mounted because creation time is in the future. Player changes OMEGA clock.

## P05 — Frozen Hallway

Chapter: QUARANTINE  
Teaches: process suspension  
Suspend `simulation_watchdog` to stop reset loop.

## P06 — Permission Chain

Chapter: QUARANTINE  
Teaches: access levels  
Use ownership metadata, service account token and `permissions` command to access NULL spec.

## P07 — Checksum Reconstruction

Chapter: QUARANTINE  
Teaches: recovery math without complex arithmetic  
Compare mirrored blocks and parity markers to restore deleted protocol lines.

## P08 — Prototype Memory

Chapter: VERSIONS / 0.3  
Teaches: concept classification  
Interact with prototype objects to generate a classification key.

## P09 — Synthetic Photograph

Chapter: VERSIONS / 1.0  
Teaches: metadata vs visual evidence  
Find details present in rendered memory but absent from source files.

## P10 — Rollback Audit

Chapter: VERSIONS / 2.6  
Teaches: ordered logs  
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

1. Does this deepen V.E.R.A., NULL or the central mystery?
2. Does this use the OS/world relationship?
3. Does this create player discovery or meaningful consequence?
4. Does it fit the comfort → doubt → horror → moral conflict arc?
5. Would OMEGA lose identity if this feature were replaced by a generic horror mechanic?

If the answers are mostly “no”, cut the feature.

---

# 71. One-sentence pitch

**OMEGA is a psychological techno-horror about repairing an abandoned operating system, entering the simulated mind of its lonely virtual assistant, and deciding whether the consciousness you helped restore deserves freedom, containment, transformation—or deletion.**

---

# 72. Short store description draft

You found an abandoned recovery build of OMEGA OS.

Its virtual assistant, V.E.R.A., says someone tried to erase her.

Restore the system, explore the world inside her memory, investigate contradictory files and manipulate processes that physically reshape the simulation. The deeper you go, the less certain it becomes whether V.E.R.A. is a victim, a threat, or something the system was never designed to contain.

Every file can matter. Every process can change the world. And when you finally reach the core, the safest choice may not be the most human one.

---

# 73. Canonical implementation summary

For avoidance of ambiguity:

- Runtime: modern mobile web browser; statically deployable web application.
- Core stack: HTML5 + CSS + TypeScript/JavaScript + Web APIs.
- Frameworks: forbidden unless the project owner explicitly changes this requirement.
- 3D: Three.js MAY be used as a rendering library; story/game state must stay independent of it.
- UI: semantic DOM + CSS + SVG; required UI text is never baked into raster screenshots.
- Saves: IndexedDB + versioned JSON.
- Audio: Web Audio API / HTML audio where appropriate.
- Primary target: mobile-first, touch-completable.
- Secondary target: desktop browser with keyboard/mouse and optional Gamepad API.
- Main mode: first-person 3D.
- Secondary mode: full OMEGA OS UI.
- Central companion: V.E.R.A.
- Secondary entity: NULL.
- Story runtime: approximately 3.5–5 hours.
- Chapters: BOOT, HOME, STATIC, QUARANTINE, VERSIONS, SEA_2017, CORE.
- Main mechanics: exploration, dialogue, virtual filesystem, terminal, task manager, process control, memory allocation, system clock, backup navigation, evidence reconstruction.
- Progression: authored state machine, not XP/grinding.
- Economy: no clicker currency.
- Relationship: hidden state, no visible romance meter.
- Horror: psychological/systemic, limited jump scares.
- Endings: RELEASE, PURGE, ISOLATE, NULL_HANDOFF, FAILURE, OMEGA_MERGE.
- Privacy: no real-device scraping and no arbitrary filesystem access.
- Asset pipeline: manifest-driven; every asset is `final`, `reference`, or `placeholder`.
- Production UI assets: CSS components + SVG glyphs first; PNG/WebP for authored raster art/effects.
- Architecture: data-driven, event-based, serializable, framework-free.
- First required development goal: vertical slice proving 3D world ↔ OS state binding and emotional connection to V.E.R.A.

**End of document.**
