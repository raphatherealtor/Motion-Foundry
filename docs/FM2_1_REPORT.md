# FM2.1 — COMPLETE: approved compat checkpoint

Raphael approved **570 AA-edge / 7 interior-under-clip / 0 interior-outside-clip pixels per recipe** in this topic on 2026-11-11. The count-only patch is applied. The gate passes with the original diff-position and signed-delta pins unchanged.

## Reclassification and exact scope

The earlier 568/9 report mislabeled two path-fill AA pixels as interior-under-clip. Independent legacy controls establish zero clip coverage at (351,1126) and (400,1227), but native opaque-white path-fill coverage of 3/255 at both coordinates. The accurate classification is 570/7/0. The total remains the same577 pixels; no rendered pixel, diff position or signed delta changed.

| Recipe at frame90 | Differing channels / total | AA edge px | Interior under clip | Interior outside clip | Max channel delta |
|---|---:|---:|---:|---:|---:|
| paper-collage.build_tear | 946 / 8,294,400 | 570 | 7 | 0 | 1 |
| editorial.cutout_pop | 955 / 8,294,400 | 570 | 7 | 0 | 1 |

The only exception is capture-side AA quantization (clip-mask and path-fill coverage), within these per-recipe bounds and the fixed maps. The ≤0.02% channel limit and zero deltas≥2 remain enforced. Any map/sign/value change fails and requires review. Nothing else in compat receives a tolerance.

## Immutable pins

- build_tear positions: `5a2713e6accda1b560bf1195442eaf3f29b578c8f33d3a28710b98dca8be4f79`
- build_tear signed deltas: `94d911f599f31136dc8fe8f86e9a81de0eb412de6a9f5737f07b768ae6012c91`
- cutout_pop positions: `e21c50775ca586164e0242d26b9650487159aa25173af58b3d821b48d8e7a95f`
- cutout_pop signed deltas: `01fab7ca8c91082b39855016aa9cb08d38212a6de3e25098e62967bd8e7ba901`

Signed deltas serialize every RGBA channel as little-endian int16. The position map records any differing pixel. Both repeat exactly over five fresh Chromium153.0.8010.12 SwiftShader launches.

## Verification

- Chart-explainer frame90: zero differing channels, all five launches.
- Archived accepted M1 proof project frame90: zero differing channels, all five launches; project SHA256 `feb870ba43231362883fdb0872d685dcfd9dad343518b792a09dfecf4d95b6b7`.
- Four opacity cases: exact whole-frame parity and pinned legacy pixels `[0,0,255,255]`, `[128,0,0,255]`, `[64,0,128,255]`, `[48,0,64,255]` in all five launches.
- The approved gate was re-executed against that unchanged five-launch evidence and passes. This approval changed policy counts only; the renderer was not rerendered or altered for it.
- Product type-check: PASS; freshly rerun Vitest:719/719, including ten bounds/hash negative controls.
- Preceding full regression at the unchanged renderer:52/52 legacy golden frames with existing baselines identical;86/86 frozen Foundry tests. No baseline or frozen test edits.

## Known issue and revisit

Reset per-draw capture and an accumulated Canvas surface can quantize AA coverage differently. The isolated historical clip/path repro records255 versus248. These are observations; internal Skia cache behavior was not instrumented. The accepted exception is pinned rather than treated as general rendering tolerance.

Live-backdrop feedback was rejected because it moves compositing back into Canvas/CPU. Open-ended internal Skia investigation was deferred; no measured slowdown is claimed. Revisit if Chrome exposes relevant coverage/clip controls, or later WebGPU/own-rasterizer work replaces this capture stage.

## Preserve A–M and boundaries

[PRESERVE_A_M.md](PRESERVE_A_M.md) remains the reference. Ordered destination draws, per-draw opacity/blend, existing isolation boundaries, unisolated legacy groups, inherited group opacity and ignored group blend are retained. Future nests remain isolated precomps.

Legacy stays the default; GPU stays explicit harness opt-in. The existing preview/export/draw entry points are untouched. `layerMask.ts` is restored to the pinned base; coverage controls live in new test files. Frozen M0/M1 code, schemas, validators and tests are unchanged. No merge, PR, deployment or spend.

This accepted checkpoint covers the stated compat fixtures and frames. It does not establish new product GPU mode wiring, exhaustive blend-mode oracles, or GPU graph identity coverage. Historical M1 and FM2.0 evidence retains its original scope.

## Checkpoint and artifacts

Product: `a8073b8` on `foundry/m2-renderer`. The approved patch changes only two count bounds, boundary-test values and the gate's status text.

- `docs/fm2_1/bounds-review-evidence.json`: five-launch evidence; pins unchanged.
- `docs/fm2_1/clip-containment-control.json`: independent native controls.
- `docs/fm2_1/approved-closeout/`: passing gate log, unchanged-pin proof and fresh test statuses.
- `docs/FM2_1_DEVIATION_ACCEPTANCE.md`: approval history.

FM2.1 is closed before FM2.2 color implementation begins. FM2.2 must include its own A–M preserve check.
