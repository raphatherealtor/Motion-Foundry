# FM2.1 accepted deviation — 2026-11-11

Raphael approved option (a) in this topic, with these binding bounds:

- Capture-side AA quantization only: clip-mask and path-fill coverage, including interior pixels under a clip region. Maximum channel delta 1; no delta of 2 or greater.
- Per recipe (`paper-collage.build_tear`, `editorial.cutout_pop`), at frame 90: at most 568 edge pixels and 9 interior-under-clip pixels. Every interior differing pixel must be inside a clip region. No exception applies outside a clip.
- Existing diff-position SHA256 pins remain fixed. A changed map needs review regardless of counts. The strengthened gate also pins signed channel deltas.
- Chart-explainer frame 90, the M1 proof recipe, and the opacity overlap suite retain zero tolerance.
- Five fresh browser launches must reproduce the same positions and deltas. Do not relax these bounds or regenerate pins automatically.

This closes the prior scope question only after the gate passes. Commit the completed FM2.1 checkpoint before starting FM2.2 color. Legacy remains default; GPU remains opt-in.
