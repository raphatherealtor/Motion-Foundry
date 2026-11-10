# M2.1 Compat Parity — Status & Residual Analysis

Date: 2026-11-10 · Branches: product `foundry/m2-renderer` (uncommitted work on pinned `db36db3`), Foundry M2 branch.

## What was rebuilt (this session)

The first GPU compat compositor blended in float sRGB space with `q()` rounding and captured paints on
float16 scratch canvases. Probing proved that was the wrong model:

1. **Legacy compositing is 8-bit premultiplied integer math.** A full-space probe
   (`docs/m2_1/blend-fit-probe.mjs`, 655,360 opaque-dst samples) fits with **zero failures**:
   - source premul: `pr(c,a) = (c*a + 127) / 255` (rounded)
   - src-over: `out_p = sp + ((dp * (256 - a)) >> 8)` (truncated)
   - alpha: `out_a = sa + ((da * (256 - sa)) >> 8)`
2. **Premul→straight decode** is `round(p*255/a)` (round-half-up), proven on all 96 clean
   `createImageBitmap`/`getImageData` pairs.
3. **Float16 capture is dead** — it adds error (f16 audit still produced a one-byte miss) and fixes nothing.
   Abandoned; capture uses the default 8-bit canvas.

The compositor was rewritten to match exactly:
- `shaders/registry.ts`: `compat.composite.v1` does all math in **byte space** (`texel*255`), with
  `floor(+0.5)` rounding on texel→byte conversion (f32 normalized texels land 1 ULP below round numbers —
  this alone caused maxDelta 62 → the last systematic error).
- `paintCompositor.ts`: all-rgba8 triple-buffer ping-pong, premul internally, CPU decode once at `pixels()`.
- `paintCapture.ts`: 8-bit scratch, no `colorType:'float16'`.
- `tests/golden-gpu/audit.ts`: decode fixed for premul buffers; ops/state instrumentation added.

## Verified results

| Check | Result |
|---|---|
| Opacity overlap regression (mandated pins `[64,0,128]` @0.5 fill+stroke, `[128,0,0]`, `[48,0,64]`, `[0,0,255]`) | **EXACT, 5/5 fresh launches, 0 changed channels, maxDelta 0** (`runs/m2-1/opacity-regression.log/json`) |
| `vox-doc.chart_explainer` frame 90 full-frame vs legacy | **EXACT — 0 changed channels, maxDelta 0, 78 draws** |
| Product `type-check` | pass |
| Product `vitest` | 709/709 |
| Product `golden` | 52/52 frames, baselines identical |
| Foundry suite | 86/86 (twice; earlier single sha-mismatch was a load flake, not reproducible) |
| GPU output determinism | 3 fresh launches per recipe → identical SHA-256 |

## Remaining residual (NOT yet pixel-exact)

`paper-collage.build_tear` (946 channels) and `editorial.cutout_pop` (955 channels) differ from legacy by
**exactly ±1 byte** on 0.011% of channels, deterministically, on anti-aliased edges of clipped
`Path2D` fills.

Root cause, established by experiment:

- The compositor formula itself is exact: a 256-point sweep of AA coverage over a known backdrop gives
  `out − kt(scratch_coverage) == 0` for **all** coverages (`/tmp/aa-probe.mjs` data in
  `runs/m2-1/aa-probe.json`).
- The divergence is in the **capture side**: the audit's mirror shows the legacy canvas rasterizes a clipped
  `Path2D` fill with AA coverage ≈2/255 where our freshly-reset scratch rasterizes ≈1/255 for the *same*
  draw call (`runs/m2-1/frame68.json`).
- Chrome/Skia's AA clip-mask rasterization is **surface-history dependent**: applying the same clip+fill
  twice on a canvas that has had content drawn through the clip yields different coverage than a fresh
  application (`/tmp/clipmask-probe.mjs`, `/tmp/clip-twice.mjs`: x=102 → 255 vs 248).
- Our mandated architecture rasterizes each draw on a reset scratch, so it reproduces the *fresh*
  quantization, not the history-dependent one. Matching it bit-for-bit would require feeding the live
  backdrop back into the 2D rasterizer per draw (i.e., CPU compositing) or replicating Skia's clip-mask
  cache behavior (not observable/controlable from script).

## Options for M2.1 completion

1. **Accept as documented deviation** — compat mode is pixel-exact on the M1 proof recipe, the mandated
   opacity suite, and 99.989% of channels on the two torn-paper recipes; residual is ±1 on AA edges,
   deterministic. Document in `M2_1_REPORT.md` as a known capture-side artifact with the evidence above.
2. **Per-draw backdrop feedback** — read the compositor backdrop back into a 2D canvas before each draw so
   the scratch carries the same surface history. Correct by construction but turns the GPU path into
   CPU compositing (defeats the purpose of the GPU backend; likely 10–50× slower).
3. **Keep investigating Skia clip-mask caching** — no known API to control it; low odds.

Recommendation: **option 1**, with the residual listed as an M2.1 known issue and revisited if any downstream
milestone (M2.2 grade) shows sensitivity.
