# FM2.2 — IN PROGRESS: color foundation

FM2.1 was committed first: product `a8073b8`, Foundry `8f64cb1`. Its approved570/7/0 gate passes with all position and signed-delta pins unchanged. Color work starts after that checkpoint.

## Implemented so far

- Exact piecewise sRGB EOTF/OETF in a float64 CPU reference and registered GPU shaders; no color-transfer LUT.
- An explicit RGBA8 sRGB input → linear-premultiplied RGBA16F/32F decode pass.
- A separate output pass: exposure → temperature → vignette → existing tone-map operator → clamp → exact OETF → deterministic triangular dither → RGBA8 straight-alpha output.
- Actual product bounds: exposure −16..16 EV, temperature −1..1, vignette/feather0..1. No document-schema changes.
- Output-only PCG integer dither: temporal default, static supported, off restricted to diagnostics. Alpha and true black/white endpoints are not dithered. Intermediate float targets receive no dither.
- Explicit resource ownership/cleanup. These APIs are opt-in and are not connected to the legacy entry points.

The CPU reference tests round-trip all256 codes exactly and pin the approved grade-order witness at RGB156 (not137). GPU validation is being recorded by `docs/fm2_2/color-foundation.mjs`.

## A–M preserve check

This table states the evidence scope; it is not a claim that FM2.2 is complete.

| Item | Preservation check |
|---|---|
| A: draw order | Compat capture/compositor untouched; new color passes do not reorder scene draws. |
| B: per-draw opacity | Existing exact opacity gate retained; color alpha is carried separately from output dither. |
| C: blend semantics | Accepted compat shader source hash pinned at `1480642771f054cc33b0d27d310f78666701c118491a2fc4e5a451f7d434e3f1`. No compat blend edits. |
| D: isolation | No isolation/flattening boundary changes. |
| E: groups | Legacy inherited opacity and ignored group blend stay unchanged; no new group/precomp behavior. |
| F: clipping | Existing clip/capture code unchanged by color work. |
| G: grade order | CPU/GPU witness must stay156: temperature → vignette → tone map, with exposure first for the new unlit input stage. Existing lit per-layer exposure is untouched; integration remains FM2.5 work. |
| H: frozen contracts | No changes to M0/M1 schemas, validators, allowlists or tests. |
| I: default/fallback | No edits to drawDocument/export/CanvasPreview entry points; legacy remains default, GPU explicit opt-in. |
| J: timing/identity | FPS/rational timing unchanged; color frame/seed inputs require uint32 integers. New color settings identity must be bound at later evidence integration. |
| K: host parity | Foundation probe checks HTMLCanvas, main-thread OffscreenCanvas and dedicated-worker OffscreenCanvas. Product GPU preview/export/worker integration remains outside this foundation claim. |
| L: legacy goldens | No golden or baseline files edited; FM2.1's52-frame pass retained. Full regression is required again before FM2.2 completion. |
| M: capture fidelity | Approved570/7/0 bounds and fixed maps remain active. The complete compat parity gate must be rerun before closing FM2.2. |

## Remaining before FM2.2 can pass

- Finish `lab.gradient_banding` and the hard `banding.v1` validator, including a dither-off negative control that fails; calibrate and record the measurement thresholds.
- Record the linear/sRGB downsample, unclipped additive accumulation, exposure round-trip and temperature GPU stress tests.
- Add linear/output luminance histograms, pre-tone/output clipping maps, out-of-gamut counts and banding reports.
- Connect/profile ICC warnings and evidence settings without changing frozen schemas.
- Rerun the approved compat gate and full regressions, establish final-byte determinism and record all measurements.

No “AE-class color” or FM2.2 completion claim is made. No FM2.3 work has started.

## Foundation measurements — TESTED, not a complete FM2.2 sign-off

Pinned Chromium153.0.8010.12 SwiftShader: five fresh browser launches, with HTMLCanvas, main-thread OffscreenCanvas and dedicated-worker OffscreenCanvas in each launch. Results and byte hashes are identical across all15 host runs.

- All256 opaque and partial-alpha sRGB codes round-trip exactly through both RGBA16F and RGBA32F. Transparent-black handling is tested separately.
- Measured max linear EOTF error:0.00023492088426790847 in16F;4.977549565854389e-7 in32F. Byte round trips still have zero changed channels.
- The GPU corner-grade witness is exactly `[156,156,156,255]`.
- Static dither is frame-independent; temporal dither repeats for the same seed/frame and changes with frame. RGB changes stay within one output LSB. Alpha and black/white endpoints remain exact.
- Compat and copy shader source hashes remain byte-identical to the FM2.1 checkpoint.
- Product type-check passes. Full product unit suite:729/729 (719 prior tests plus10 color reference/settings tests).

Reproduction: `node docs/fm2_2/color-foundation.mjs`. Evidence: `docs/fm2_2/foundation-results.json`, `foundation.log`, `preserve-programs.json`. These measure the foundation passes; the remaining milestone gates above are still outstanding. The color foundation is a checkpoint, not a completed FM2.2 milestone.

Foundation checkpoint: product `5e8337f` on `foundry/m2-renderer`. FM2.1 closeout and this FM2.2 start are separate commits. FM2.2 remains IN PROGRESS.
