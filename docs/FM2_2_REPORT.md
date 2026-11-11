# FM2.2 color — review report: BLOCKED

FM2.1 remains COMPLETE. FM2.2 color foundations and stress measurements pass, but the positive gradient card fails the literal banding contract and the final frozen M0 repeat-render check finds nondeterminism. No tolerance or dither algorithm was silently changed. No FM2.3 work has started.

## Scope and implementation

The new GPU path remains opt-in. Legacy rendering is the default; none of drawDocument.ts, export/pipeline.ts or CanvasPreview.tsx was edited for this phase. M0/M1 source, schemas and tests remain frozen.

Implemented: exact piecewise sRGB EOTF/OETF; linear-premultiplied RGBA16F/32F decode; exposure → temperature → vignette → existing tone operator → OETF → output-only triangular dither → explicit RGBA8 quantization. Solid-color CPU reference uses float64. No hardware sRGB encode or transfer LUT. Actual bounds: exposure ±16 EV, temperature ±1, vignette/feather 0–1. Existing lit-layer exposure is untouched; product integration remains later work.

Dither is deterministic PCG3d triangular noise, ±1 output LSB. Temporal is default; static is available; off is diagnostic only. Alpha, true black and true white are not dithered; float intermediates are not dithered.

## Environment and determinism

Chromium 153.0.8010.12, pinned SwiftShader and single-thread raster flags. Five fresh launches × HTMLCanvas, main-thread OffscreenCanvas and dedicated-worker OffscreenCanvas: all 15 stress results, float buffers and final-byte hashes identical. Foundation probes independently passed the same five-launch/three-host matrix. App preview/export wiring is not claimed.

## Color measurements

| Check | Result |
|---|---|
| All 256 opaque and partial-alpha codes through 16F and 32F | Exact byte round trips; zero changed channels |
| Maximum EOTF linear error | 16F: 0.00023492088426790847; 32F: 4.977549565854389e-7 |
| Approved grade-order corner witness | [156,156,156,255] exactly |
| Checker downsample | Linear mean 0.5 → 188; sRGB compatibility control 128 |
| Additive HDR | [1.5,1.5,1.5,1] before tone map; Reinhard output [203,203,203,255] |
| Exposure ±2 EV round trip | 0 half-float ULP in both directions |
| Temperature sweep | R/B strictly monotonic over 21 samples |
| Negative/HDR control | [-0.125,0.25,2,1] → [0,137,255,255] |

## Banding gate — FAIL on the positive card

1080×1920 synthetic four-region card; 64 scanlines per region, R channel except navy B. Thresholds kept at 1-LSB adjacent-run steps, 1.5× local theoretical run length, and +6 dB spectral peak. Local spectra average 64 quantization-error periodograms over 256-pixel windows. Run maxima and violation counts are retained alongside the 64-line averages.

| Mode / region | Max step LSB | Steps >1 | Long runs | Peak dB |
|---|---:|---:|---:|---:|
| off / horizontal_linear | 3 | 768 | 128 | 20.06 |
| off / radial_vignette | 1 | 0 | 0 | 13.18 |
| off / navy_black | 1 | 0 | 0 | 26.92 |
| off / skin_tone | 1 | 0 | 0 | 21.16 |
| static / horizontal_linear | 5 | 2749 | 856 | 0.33 |
| static / radial_vignette | 2 | 1652 | 336 | 1.09 |
| static / navy_black | 2 | 1202 | 5 | 1.11 |
| static / skin_tone | 2 | 1340 | 4 | 1.10 |
| temporal / horizontal_linear | 5 | 2731 | 782 | 0.98 |
| temporal / radial_vignette | 2 | 1629 | 309 | 0.68 |
| temporal / navy_black | 2 | 1222 | 1 | 1.18 |
| temporal / skin_tone | 2 | 1322 | 5 | 0.81 |

All dither-on spectral peaks are below +6 dB; all dither-off peaks exceed it. The negative control correctly FAILS, so this is not an ERROR from accepting the negative control. The combined gate is BLOCKED because the positive card also FAILS.

The blocker is the measurement contract: independent ±1-LSB triangular noise can make adjacent quantized pixels differ by 2 LSB even in a smooth region. The full linear-light ramp itself has an intended OETF step of 3.054 LSB near black at this resolution; its off control already has 3-LSB steps. The hard raw-neighbor limit therefore rejects intended signal as well as prescribed noise. Static/temporal dither also produces rare constant runs exceeding the per-run bound. These failures were retained, not averaged away or reclassified as WARN.

Suggested review direction: define the hard criterion on quantization residuals or spatially aggregated profiles, with an explicit statistical run bound, while retaining the dither-off spectral negative control. This is a proposed contract correction, not an applied change. The production-region path remains heuristic WARN and currently requires caller-supplied regions; automatic smooth-region detection is not implemented. No production-band validation claim is made.

## Perception and profile evidence

Each card mode has 256-bin pre-tone linear/output luminance histograms, a binary clipping map, negative-component counts and the full banding report. The independent float64 oracle retains continuous expected output codes. Output endpoint masks denote channels at 0/255, including intentional endpoints; they do not by themselves establish accidental clipping. The negative/HDR control verifies mask bits independently.

Profile metadata reports browser-managed sRGB decode. Declared non-sRGB or unverified profiles produce WARN; wide gamut is deferred. Metadata policy is implemented and tested; ICC blob parsing and a real wide-gamut asset decode test are not implemented or claimed. Synthetic sRGB assets are the only inputs in this run.

## A–M preserve check

| Item | Preservation check |
|---|---|
| A: draw order | Compat capture/compositor untouched; new color passes do not reorder scene draws. |
| B: per-draw opacity | Five-launch exact opacity gate PASS; color alpha is carried separately from output dither. |
| C: blend semantics | Accepted compat shader source hash pinned at `1480642771f054cc33b0d27d310f78666701c118491a2fc4e5a451f7d434e3f1`. No compat blend edits. |
| D: isolation | No isolation/flattening boundary changes. |
| E: groups | Legacy inherited opacity and ignored group blend stay unchanged; no new group/precomp behavior. |
| F: clipping | Existing clip/capture code unchanged by color work. |
| G: grade order | CPU/GPU witness must stay156: temperature → vignette → tone map, with exposure first for the new unlit input stage. Existing lit per-layer exposure is untouched; integration remains FM2.5 work. |
| H: frozen contracts | No changes to M0/M1 schemas, validators, allowlists or tests. |
| I: default/fallback | No edits to drawDocument/export/CanvasPreview entry points; legacy remains default, GPU explicit opt-in. |
| J: timing/identity | FPS/rational timing unchanged; color frame/seed inputs require uint32 integers. New color settings identity must be bound at later evidence integration. |
| K: host parity | Foundation and stress:5 launches ×3 hosts each, exact hashes. Product GPU preview/export/worker integration remains outside this foundation claim. |
| L: legacy goldens | No golden or baseline files edited; All52 legacy goldens pass; committed baselines are identical. |
| M: capture fidelity | Approved570/7/0 bounds and fixed maps remain active. Fresh compat rerun:5/5 PASS, fixed position/signed-delta pins unchanged. Frozen M0 repeat capture separately FAILS, below. |

## Reproduction and evidence

From Foundry: `npm test`; `node docs/fm2_2/color-foundation.mjs`; `node docs/fm2_2/color-stress.mjs 5`; `node docs/fm2_2/analyze-color.mjs`; `node docs/fm2_2/export-card.mjs`; `node docs/fm2_1/parity-gate.mjs 5`. Product: `npm run type-check`, `npm test`, and `PLAYWRIGHT_BROWSERS_PATH=/root/projects/motion-foundry/tooling/m1-browser/browsers npm run golden`.

`docs/fm2_2/stress/` contains host results, banding results, histograms and render_caps.json. Runtime raw frames and maps are under runs/fm2-2/stress; rendered PNGs are included in the downloadable review evidence.

Foundation: product `5e8337f`, Foundry `a88c6d0`. FM2.1: product `a8073b8`, Foundry `8f64cb1`. Stress checkpoint: product `90c6924`. Per the request to push when FM2.2 lands, this blocked milestone is not pushed as a completed delivery. No merge, default switch or FM2.3 work was performed.

## Current regression checks

- Product type-check: PASS. Product Vitest: 729/729 PASS across47 files.
- Legacy golden renderer:52 frames,0 failures;47 explicit-OFF frames identical and committed baselines identical.
- Foundry preliminary suite:95/95 PASS. Final suite with all12 new tests:97/98 PASS; all12 color tests pass, but the unchanged M0 repeat-render test FAILS. Neither the earlier pass nor a future isolated pass clears this intermittent failure.
- No existing product base file is modified. No frozen M0/M1 source, test or schema is modified. The compat and copy shader SHA256s still match the FM2.1 pins.
- Full app e2e suites are not run for this blocked checkpoint; no product entry-point integration or push is claimed.

## Additional strict blocker: frozen M0 repeat capture

The final suite found different hashes for frames95 and121 between uncached attempts with identical Chromium153 configuration. Each frame differs in9 channels; max deltas are5 and8 respectively. The existing single-raster-thread and disabled PaintHolding flags are present in both configs. Cause is unverified; no load-flake or settings-gap diagnosis is claimed. No frozen code or tolerance was changed. Before calling it fixed, the capture-race protocol still requires a justified one-change-at-a-time investigation and five uncached repeats. Failure configs, frames and pixel statistics are retained in stress/capture-race/.

The banding analysis command exits1 because its positive-card gate is BLOCKED; the off negative control correctly FAILS. Compat independently passes5/5: chart_explainer f90, M1 proof and opacity are exact; both torn-paper recipes retain570/7/0 and all diff pins. Both blockers must be resolved before FM2.2 can land.
