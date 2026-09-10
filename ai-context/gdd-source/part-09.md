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
