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
