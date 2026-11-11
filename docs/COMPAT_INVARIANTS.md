# Compat invariants

This renderer checklist is not Raphael's preserve A–M list. See PRESERVE_A_M.md for that list.

These are the behaviors the FM2 GPU compat path must preserve from the pinned legacy renderer
(blank-canvas-starter `db36db39821f46ec4b7057bb431ffb9e82473c33`). Each item names its source and the
check that covers it. Requirements are not blanket claims that every future GPU integration has been tested. This file is the reference for FM2 parity review.

**A. Draw order.** Every legacy Canvas destination call (fill, stroke, fillRect, strokeRect, fillText,
strokeText, drawImage) executes as its own ordered GPU composite. Pass order is never derived from hash
maps, object identity, or timing. — `FM2_COMPAT_BOUNDARIES.md`; parity gate `tests/golden-gpu/parity-run.ts`.

**B. Per-draw opacity.** Opacity is applied while rasterizing each draw and is never multiplied again
during GPU blending. Overlapping fill+stroke at opacity 0.5 stays `[64,0,128]`. — pinned in
`tests/golden-gpu/opacity.ts`; exact (zero tolerance).

**C. Per-draw blend.** The original destination blend (`globalCompositeOperation`) is recorded per draw
and performed by the GPU, including the full separable and non-separable set. — `src/motion/render/gpu/shaders/registry.ts`
(`compat.composite.v1`); oracle parity per recipe.

**D. Legacy isolation boundaries only.** Offscreen surfaces exist exactly where legacy creates them:
tilted planes (`projectedPlane.ts` plane textures + clipped affine triangles), lit readback surfaces, and
Holo optical treatments. Compat never introduces new flattening or new isolation. — `FM2_COMPAT_BOUNDARIES.md`.

**E. Groups are not isolated.** Ordinary document groups do not create offscreen surfaces: evaluated
parent opacity is multiplied into children (`motion-document-utils.ts:74–83`) and group blend is ignored,
exactly as legacy does. No new group flattening. — `FM2_COMPAT_BOUNDARIES.md`.

**F. Clipping state.** Ancestor hard clips and mask paths apply on each destination draw with the original
transform (`drawDocument.ts:276`), including antialiased clip semantics (clearRect through a clip is not a
full reset). — `gpu/paintState.ts` clip replay; `parity.ts` clip-edge classification.

**G. Grade order.** Final grade order is the product's: temperature → vignette → tone map, then sRGB, with
per-layer exposure as recorded. Never the spec's earlier reversed order. — `FM2_APPROVED_CORRECTIONS.md`;
`fm2_step0/grade-order.json` discriminator.

**H. Frozen schemas.** M0 v1 and M1 v2 schemas, validators, allowlists and tests are frozen; FM2 adds
only v3 files with a new ID. — `FM2_PRODUCT_AUTHORIZATION.md`; Foundry suite 86/86.

**I. Defaults and fallback.** The legacy Canvas 2D renderer stays the product default
(`renderer: "canvas2d" | "gpu"`, default `"canvas2d"`) and the runtime fallback when WebGL2 or float
targets are unavailable. GPU is opt-in. Switching the default is a separate decision for Raphael. —
spec §2; enforced by entry-point wiring, not by parity tests.

**J. Timing and identity.** FPS stays 30/1 (fps edits are `FORBIDDEN_OP`); frames are integers with exact
rational conversion; `shadowSoftness` runs 0–1; v1/v2 schemas unchanged; `graph_sha256` and render IDs are
retained as requirements. This classification gate does not add new GPU graph-identity verification. — kickoff "Reuse" list; Foundry suite.

**K. Preview/export/worker byte-identity.** The three modes are byte-identical under pinned SwiftShader,
with 5 fresh-launch repeats identical on every recipe fixture. — spec §5.2 (M1 rule unchanged). Historical M1 mode parity and FM2.0 host probes retain their scope; the current FM2.1 classification gate tests HTMLCanvas output and does not claim new product GPU mode wiring.

**L. Goldens.** Existing product goldens and committed baselines are never edited or regenerated. A
difference from a committed baseline is a recorded finding, never a silent update. — spec §2; golden run
52/52 with "committed baselines identical".

**M. Capture-side fidelity.** Each paint is rasterized with its original transform, clip, opacity,
shadows and filter on an 8-bit scratch — the same quantization domain as legacy — and the deviation from
legacy is confined to the AA/clip-mask quantization artifacts documented in `FM2_1_REPORT.md`
(max Δ≤1, ≤0.02% of channels; per torn-paper recipe ≤570 geometry AA-edge px and ≤7 interior-under-clip px; no interior diff outside a clip; fixed position and signed-delta hashes across five launches). — `FM2_1_REPORT.md` known deviation; parity gate.

**Future nests.** New nested compositions will be isolated precomps (their own offscreen surface with a
single destination draw). That is a forward policy for new documents; it changes nothing above.

## Approved closeout gate

Raphael approved570 AA-edge /7 interior-under-clip /0 interior-outside-clip pixels per deviation recipe on2026-11-11. These bounds, max delta1, ≤0.02% changed channels, and unchanged position/signed-delta pins pass the five-launch gate. Exact suites retain zero tolerance. FM2.1 is complete; FM2.2 must carry its own preserve check.
