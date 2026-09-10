# OMEGA v2 — framework-free UI kit

This UI kit is production scaffolding for the mobile-first web build.

## Files

- `css/v2/omega-ui.css` — shell, windows, dialogue, terminal, Explorer, Task Manager, notifications, modal/save UI, corrupted mode, mobile touch HUD.
- `js/v2/ui/omega-ui.js` — small DOM helpers for windows, toasts, dialogue, terminal and touch input. It is not a framework and must not become canonical game state.
- `assets/v2/ui/touch/` — touch-control SVG artwork.
- `dev/ui-kit.html` — isolated visual/interaction test page.

## Architectural rule

DOM components emit/receive data; canonical story/game state belongs to game services. Do not serialize DOM nodes. Do not make the UI module depend on Three.js.

## Mobile rule

Every required action must be reachable via touch. Touch controls use Pointer Events and `touch-action` deliberately so simultaneous movement/look/actions are possible.

## Raster rule

Portraits and evidence art can be WebP. Windows, buttons, lists, terminal, dialogs, menus and HUD are HTML/CSS/SVG and must remain localization-safe.

## Component states

Where relevant, components should support normal, focus-visible, pressed/active, disabled, danger/error, V.E.R.A.-accented and NULL/corrupted states. `prefers-reduced-motion` must disable nonessential motion.

## Asset binding

Gameplay and dialogue should resolve visual art through `assets/v2/asset-manifest.json`, not hardcode generated art filenames into story data. SVG fallbacks remain valid when higher-detail WebP art is absent or replaced.
