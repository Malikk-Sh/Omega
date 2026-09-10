# OMEGA — Milestone 1: HOME vertical slice

Status: implementation candidate; requires final mobile acceptance by project owner.

## Purpose

Milestone 1 turns the Milestone 0 architecture test into the first playable HOME scene. Art is intentionally primitive/placeholder. The goal is to validate feel, interaction flow, story presentation, and the world↔OMEGA OS relationship before producing final 3D art.

## Implemented

- Mobile-first first-person movement and look controls.
- A more readable HOME apartment built from primitive Three.js geometry.
- Center-screen raycast interaction with stable gameplay IDs rather than model names.
- Interactable V.E.R.A., computer, mug, and SEA 2017 photograph.
- OMEGA OS may be opened from the world only while the computer is in interaction focus.
- DOM dialogue layer with V.E.R.A. portrait states.
- First-run HOME introduction dialogue.
- `/memories/sea_2017.img` bound to `apartment.photo_frame`.
- `/memories/vera_note.txt` readable from OMEGA OS.
- Delete/restore of SEA 2017 immediately affects the 3D world.
- First photo inspection triggers a one-time subtle anomaly: light instability + temporary silhouette + V.E.R.A. reaction.
- Story flags and filesystem changes persist through IndexedDB.
- M0 save fallback is supported and upgraded in memory to M1 state.
- Vercel build executes TypeScript compilation plus `tests/m1/home.test.mjs`.

## Automated acceptance

`npm run build` must:

1. compile TypeScript into `js/v2/m1`;
2. run the M1 HOME regression test;
3. fail deployment if the SEA 2017 world binding, save/load, restore flow, or story flag persistence regresses.

Expected final line:

```text
M1 HOME regression: PASS
```

## Manual mobile acceptance

On the production URL:

1. Let the V.E.R.A. introduction play and advance all lines.
2. Confirm joystick movement and touch-look work together.
3. Aim at V.E.R.A.; an interaction prompt should appear. Interact and confirm dialogue.
4. Aim at the mug and inspect it.
5. From away from the computer, press the OMEGA OS action and confirm it asks the player to approach the computer instead of opening globally.
6. Approach/aim at the computer and open OMEGA OS.
7. Open `vera_note.txt` and confirm the text is readable.
8. Delete `Море 2017.img`; confirm the wall photograph disappears and `MEMORY LINK: MISSING` is shown.
9. Reload the page; confirm the deleted state persists.
10. Restore `Море 2017.img`; confirm the photograph returns.
11. Aim at the photograph and interact. On first inspection, confirm the light flicker / temporary dark silhouette and follow-up V.E.R.A. lines occur.
12. Reload and verify the anomaly does not replay as a first-time event.

## Known polish item

The photo interaction handler already refuses interaction when its memory file is missing. A future interaction-system cleanup should additionally remove/disable hidden bound entities from raycast candidate evaluation so no stale focus prompt can appear for an invisible object.

## Not part of M1

- Final apartment model/materials/textures.
- Final V.E.R.A. 3D model, rig, facial animation, lip sync.
- Final audio/voice acting.
- Full chapter progression.
- Production puzzle complexity.
- NULL encounter beyond the first anonymous silhouette-like anomaly.

These belong to later milestones; do not block M1 acceptance on final art.
