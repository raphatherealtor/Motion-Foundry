# FM2.1 — BLOCKED by the accepted 568/9 bounds

Raphael's 2026-11-11 decision is recorded in [FM2_1_DEVIATION_ACCEPTANCE.md](FM2_1_DEVIATION_ACCEPTANCE.md). The requested bounds are implemented without relaxation. FM2.1 cannot yet be marked complete; FM2.2 has not started.

## Correction to the previous report

The previous report incorrectly described all nine non-edge pixels as being under a clip. Its clip-region calculation discarded the plane transform, and its edge classifier treated any pixel not showing partial capture alpha as interior (including zero-alpha pixels).

The corrected independent controls show, in both torn-paper recipes at frame 90:

- The reviewed capture-alpha classifier gives 568 partial-coverage pixels, 7 non-edge pixels inside clips, and **2 non-edge pixels outside all clips**.
- Those two coordinates are **(351,1126)** and **(400,1227)** on the 1080×1920 frame. Drawing the actual legacy masked planes confirms clip coverage 0 at both coordinates for every mask. The positive control at (585,884) has coverage 255 inside the center scrap.
- A separate geometry-only native path-fill raster (opaque white, opacity 1, no shadow/filter) gives coverage **3/255** at both disputed coordinates, on destination fill draw 66. They are path-fill AA edges, not interior-under-clip pixels.
- Therefore the accurate geometry classification is **570 edge pixels / 7 interior-under-clip pixels / 0 outside pixels**, not 568/9.

The total stays 577 pixels per recipe. GPU pixels, legacy pixels and both approved diff-position hashes are unchanged. The corrected geometry gate fails the explicit **568-edge maximum**. Relabeling these pixels or raising that cap without review would violate the decision.

## Test contract

`tests/golden-gpu/parity-contract.ts` holds fixed recipe-specific pins and asserts:

- max channel delta ≤1; no channel delta ≥2;
- differing channels ≤0.02% of frame channels;
- each deviation recipe: edge pixels ≤568, interior-under-clip pixels ≤9, and zero interior pixels outside clips;
- every differing pixel classified; existing diff-position SHA256 unchanged;
- a second fixed SHA256 over signed little-endian int16 channel deltas, so changing a sign/value at an existing pixel also fails.

`parity-run.ts` requires five fresh Chromium 153 launches, both position and signed-delta hashes identical, exact chart-explainer frame 90, exact archived M1 proof candidate frame 90, and all four exact opacity regressions. The M1 proof project is bound to SHA256 `feb870ba43231362883fdb0872d685dcfd9dad343518b792a09dfecf4d95b6b7`.

The gate has ten negative/positive contract tests, including changed hash, changed deltas, a 569th edge pixel, a tenth interior pixel, off-clip interior changes, delta 2, and any nonzero difference in an exact suite.

## Fixed maps and measured residual

| Recipe, frame 90 | Changed channels | Geometry AA edge px | Interior-under-clip px | Interior outside clip |
|---|---:|---:|---:|---:|
| paper-collage.build_tear | 946 / 8,294,400 (0.011405%) | 570 | 7 | 0 |
| editorial.cutout_pop | 955 / 8,294,400 (0.011514%) | 570 | 7 | 0 |

Position pins (unchanged from the approved results):
- build_tear: `5a2713e6accda1b560bf1195442eaf3f29b578c8f33d3a28710b98dca8be4f79`
- cutout_pop: `e21c50775ca586164e0242d26b9650487159aa25173af58b3d821b48d8e7a95f`

Signed-delta pins (little-endian int16 for each RGBA channel):
- build_tear: `94d911f599f31136dc8fe8f86e9a81de0eb412de6a9f5737f07b768ae6012c91`
- cutout_pop: `01fab7ca8c91082b39855016aa9cb08d38212a6de3e25098e62967bd8e7ba901`

The original capture-side quantization repro (same clip/path, accumulated vs reset surface, coverage 255 vs 248) remains in the historical probe artifacts. That is an observed discrepancy; the exact internal Skia cache mechanism was not instrumented. The newly established two-pixel classification error is a test/reporting issue, not a new GPU output difference.

The user rejected per-draw live-backdrop feedback because it shifts compositing back to Canvas/CPU, and deferred open-ended Skia investigation. No measured 10–50× performance claim is made here. Revisit when Chrome exposes relevant coverage/clip controls or when a later WebGPU/own-rasterizer milestone replaces the capture stage.

## Preserve A–M and boundaries

[PRESERVE_A_M.md](PRESERVE_A_M.md) retains the requirements. Per-draw order/opacity and fixed overlap pixels remain tested; ordinary groups remain unisolated, with inherited opacity and ignored group blend. Existing offscreen isolation stays at legacy boundaries. New nested compositions remain future isolated precomps.

The legacy entry points `drawDocument.ts`, `export/pipeline.ts`, and `CanvasPreview.tsx` are untouched. GPU remains harness-only opt-in. The prior test-only export added to `layerMask.ts` was removed; it is byte-identical to the pinned base again. Clip coverage is now tested through new test files, with no extra existing-file authorization needed. Frozen Foundry v1/v2 code, schemas and tests remain unchanged.

This closeout gate measures HTMLCanvas compat output at the stated frames. It does not newly establish product GPU preview/export/worker wiring, GPU graph identity coverage, or exhaustive blend-mode oracles. Historical M1 and FM2.0 evidence retains its original scope.

## Artifacts and next action

- `docs/fm2_1/parity-gate.mjs`: reproducible five-launch renderer and product gate invocation.
- `runs/fm2-1/accepted-gate/parity-gate.json`: current position/delta hashes and pixel classification.
- `docs/fm2_1/clip-containment.mjs`, `runs/fm2-1/containment-control/control.json`: independent native clip and path-fill controls, including positive/negative controls.
- `runs/fm2-1/closeout-checks/`: complete rerun logs and exit statuses.

The gate must stay blocked under the current 568-edge cap. The concrete review correction is **570 geometric AA edge pixels / 7 interior-under-clip pixels**, keeping the same 577 pixels, max delta 1, zero interior off-clip pixels and the same position/delta hashes. No bound or hash was automatically widened. FM2.2 is contingent on resolving this count discrepancy.

## Current verification results

Five fresh browser launches: fixed position and signed-delta maps identical for both deviation recipes; exact chart/M1-proof frame90/opacity cases all have zero changed channels. Geometry class counts are570/7/0 on every launch. The contract correctly returns FAIL because570 exceeds568. `audit-evidence.mjs` separately verifies all hash and exact-suite conditions even though the bound fails.

- Product type-check: PASS.
- Product Vitest:719/719 (709 existing plus10 new gate-contract tests).
- Legacy goldens:52/52; committed baselines unchanged.
- Frozen Foundry suite:86/86 unchanged tests.

Committed evidence: `docs/fm2_1/bounds-review-evidence.json`, `bounds-review-audit.json`, `clip-containment-control.json`, and `closeout-checks.json`. The unapplied proposal is `proposed-count-correction.patch`; it changes only the two class bounds and their contract tests, preserving both hash pins, the delta bound and zero off-clip interior differences.

## Review proposal validation

The 570/7 policy was simulated in an ignored copy under `runs/fm2-1/count-proposal/`, without changing the committed 568/9 gate. The proposed gate passes the same five-launch evidence, including all fixed position/delta pins and exact suites. The patch applies cleanly to product commit `c161c47`. This is a proposal test only; the active gate remains FAIL pending review.

Product checkpoint: `c161c47` on `foundry/m2-renderer`. It adds the strict gate and independent coverage tests, and restores `layerMask.ts` to the base. No numerical GPU renderer change is included.
