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
