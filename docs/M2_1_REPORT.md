# M2.1 — BLOCKED, incomplete

Detail: `LAYER_ISOLATION_CHANGES_OPACITY`. This is a source-path discriminator, not a completed GPU renderer or GPU parity result.

Product authorization is recorded in [M2_PRODUCT_AUTHORIZATION.md](M2_PRODUCT_AUTHORIZATION.md). Branch `foundry/m2-renderer` exists at db36db39821f46ec4b7057bb431ffb9e82473c33. Its tracked files and working tree are unchanged/clean. Foundry is on `m2-gpu-renderer`.

## Observed semantic mismatch

At the pinned product SHA, `src/motion/render/drawDocument.ts:281–282` sets object opacity and blend mode on the destination context; `:192–193` then fills and strokes separately. For flat, non-isolated layers, `projectedPlane.ts:20` paints directly. M2's single-raster-per-layer architecture loses the separate overlapping paint operations before the GPU composite.

The probe uses the actual product `drawPlanes` in both branches. Direct: a red-filled, blue-stroked rectangle with object opacity 0.5 on black. Isolated: the same object at opacity 1 into transparent Canvas, then the resulting layer composited at 0.5. Both use the same pinned Canvas/sRGB implementation, so this isolates operation ordering rather than GPU precision, color space, or projection sampling.

On a 128×128 fixture with a 16-pixel stroke:
- Interior-overlap pixel (18,64): direct RGBA [64,0,128,255]; isolated [0,0,128,255].
- 2304 pixels differ; maximum channel delta 64/255.
- The sample is well inside the padded projected quad, not its 1-pixel edge band.
- Opacity 1 with stroke and opacity 0.5 with no visible stroke are exact-match controls.
- All four cases repeated identically over five fresh Chromium 153 launches.

[Probe](m2_1/opacity-semantics.mjs), [raw results](m2_1/opacity-semantics.json), [direct image](m2_1/opacity-direct.png), [isolated image](m2_1/opacity-isolated.png).

## Stop rule and proposed correction

[M2 §5.2](m2-handoff/MOTION_FOUNDRY_M2_SPEC.md) says: “If a difference shows up that is not in this list and is not explained by color space or sampling, it is a semantic mismatch. Stop and report it.” This difference survives using Canvas for both sides and arises before GPU upload. It cannot be resolved by increasing the parity tolerance or adding it to the existing color/sampling explanations.

Recommended architecture correction: retain a logical layer, but let its compat render graph carry the ordered paint operations and the product's existing isolation boundaries. Apply opacity/blend at the same boundaries as legacy. Do not flatten overlapping fill/stroke into one opaque raster and then apply opacity once. Add this fixture as a compat regression before continuing. This does not require new product-edit paths or a document schema change. Linear mode's grouping policy must be explicit rather than accidentally inherited from raster flattening.

Implementation stopped before integration. The incomplete backend prototype was moved out of the product checkout to ignored `runs/m2-1/draft-product/gpu/` on the Foundry side so the clean product remains buildable. It is untested and not a delivered backend. M2.1 acceptance criteria are NOT_RUN. The last full suites remain M2.0's 86 Foundry tests, 709 product tests, and 52 goldens; they were not rerun or relabeled as M2.1 results. No push, merge, PR, generation or spend occurred.

This commit is a blocked evidence record, not a completed M2.1 milestone. Next step: resolve the compat paint-operation ordering correction, then resume M2.1 within the already authorized product paths.
