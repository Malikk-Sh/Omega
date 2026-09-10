# OMEGA v2 Asset Pipeline

OMEGA is a mobile-first, framework-free browser game. Runtime UI is built with semantic HTML, CSS and SVG. Three.js may be used only as the 3D rendering library.

## Asset statuses

Every asset must be registered as `final`, `reference`, or `placeholder`.

- `final`: approved production asset that may ship.
- `reference`: art-direction reference only; never implement required interaction as a clickable screenshot.
- `placeholder`: valid for playable development builds but must remain replaceable.

## Functional UI

Buttons, windows, dialogue boxes, inputs, tabs, terminal rows, progress bars, save slots, notifications, lists and touch layouts must be real HTML/CSS components. Use SVGs under `assets/v2/ui/icons`, `assets/v2/ui/glyphs`, and `assets/v2/ui/effects` for scalable visual language.

## Missing assets

When art is missing, keep gameplay functional, preserve the intended aspect ratio, use the manifest fallback, use project-owned SVG/shapes for UI and primitive Three.js geometry for 3D props, and mark `TODO_ART`, `TODO_AUDIO`, or `TODO_MODEL`. Do not use emoji as production placeholders. Required localized text must not be baked into raster images.

## Current placeholder art

V.E.R.A. portraits, NULL variants, props and environment cards in `assets/v2` are lightweight SVG implementation placeholders with stable IDs. A separate higher-detail split WebP pack is maintained for art direction. Gameplay must bind by asset ID rather than rely on a particular file format.

## Next visual priorities

1. Final V.E.R.A. master and consistent expression set.
2. Final OMEGA wordmark and boot branding.
3. Touch-control states for mobile gameplay.
4. Normal/corrupted app icon variants.
5. NULL interference masks and overlays.
6. Sea 2017 evidence set.
7. Apartment photos, decals and memory props.
8. Chapter transition cards.
9. Final audio identity.