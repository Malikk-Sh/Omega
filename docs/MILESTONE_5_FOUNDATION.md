# OMEGA — Milestone 5: VERSIONS foundation

This document is intentionally created on the M5 stacked branch. It will describe the first implementation slice after M4 BACKUP 0.3 is accepted.

Initial scope:

- generalize backup/version metadata without rebuilding M4;
- define VERA_1_0, VERA_2_6 and VERA_4_1 as authored version records;
- implement deterministic version unlock ordering;
- implement the VERA_1_0 Synthetic Photograph deduction as pure story logic;
- preserve M4 save compatibility;
- add an M5 regression to the build before wiring additional 3D scenes.

This is a foundation slice, not the full M5 milestone. Runtime traversal to the new snapshots remains a follow-up after the data/state contract is green.
