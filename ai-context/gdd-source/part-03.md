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
