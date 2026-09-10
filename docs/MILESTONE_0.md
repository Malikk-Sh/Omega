# OMEGA Milestone 0 — Architecture Prototype

Milestone 0 is isolated from the legacy demo. Open `/v2/` through an HTTP server.

## Purpose

Prove the shared canonical-state bridge before story production:

`virtual file -> GameState -> EventBus -> WorldBinding -> Three.js object -> IndexedDB save`

The only authored test binding is:

- virtual path: `/memories/test_photo.img`
- world target: `apartment.photo_frame`
- rule: file exists => photo frame visible

## Acceptance test

1. Serve the repository over HTTP/HTTPS. Do not open the HTML as `file://`.
2. Open `/v2/` on a phone or responsive browser viewport.
3. Open OMEGA OS.
4. Delete `/memories/test_photo.img`.
5. Confirm the photo frame disappears from the apartment immediately.
6. Reload the page.
7. Confirm the deleted state is restored from IndexedDB and the frame remains hidden.
8. Restore the file.
9. Confirm the frame immediately returns.

## Input

Primary:
- left virtual stick: move;
- right-side look zone: camera look;
- interact: opens OMEGA OS in M0;
- OMEGA button: toggle OMEGA OS;
- pause: closes OMEGA OS.

Secondary desktop:
- WASD/arrows: move;
- E: interact;
- Tab: toggle OMEGA OS;
- Escape: close overlay.

## Build/check

The committed `/js/v2/m0/` output is deployable static JavaScript. TypeScript source lives in `/src/`.

```bash
npm install
npm run check:m0
```

The runtime pins Three.js `0.186.0` in the `/v2/index.html` import map. Three.js is a rendering dependency only; canonical game state must never move into Three.js objects.

## Deliberate limitations

This is an architecture slice, not HOME gameplay. The room uses primitive geometry, has no production collision system, no V.E.R.A. NPC, no dialogue progression and no final art. Those belong to Milestone 1.
