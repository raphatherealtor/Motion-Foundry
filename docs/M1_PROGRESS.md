# M1 milestone evidence

Base: Motion Suite 25cb5454d1f14f889d36c79dec3965a95f7b2c99, Path A (unchanged). Approved corrections: M1_APPROVED_CORRECTIONS.md. Branch: m1-motion-suite-adapter. No push, merge, deployment, paid API or generated assets.

## Step 0 and browser prerequisite — TESTED

Step 0 semantic corrections cleared by Raphael on 2026-11-10. New isolated Playwright 1.63.0 / Chromium 153.0.8010.12 installation is under Foundry tooling/m1-browser; M0 retains Chromium 131.0.6778.204. The downloaded headless-shell binary contains num-raster-threads, PaintHolding and enable-begin-frame-control symbols. Runtime version is recorded in render config.

Product `npm run golden` rerun with only PLAYWRIGHT_BROWSERS_PATH selecting the Foundry browser: **52 frames, 0 failed**. All 47 existing OFF-default frames and committed baselines are identical. Worker/inline and preview/export checks passed. Original Step 0 Vitest result remains 671/671; not rerun. No golden-update or tolerance flags. Evidence: runs/m1-resume/golden.log, golden-report.json, golden.exit (0), browser.json.

This product golden PASS is separate from M1 scene parity, which is pending until milestone 1 passes.

M0 browser migration check: **5/5 uncached repeats PASS** on Chromium153. Every repeat produced the same frame/boxes/contact-sheet aggregate hash `793a025eefb32733327d3feb0d40e47fde40926efbc80ee35b44fb0b53af9f84`. Each run captured all270frames and checked out-of-order seeks [200,10,200,135] with zero tolerance. Evidence: runs/m1-resume/m0-153/repeats.json and m0-repeats.log. Source and tests were unchanged; the new loader substitutes only the launch path and records its hash. These checks do not claim M1 proof-scene determinism.

## Milestone 1 — TESTED

New Foundry harness imports the pinned product golden entry, parseProject and constructors. A Foundry-only Vite retention transform prevents sideEffects:false from stripping that entry; product source is not copied or edited. MotionSuiteRenderer implements frozen RendererAdapter (whose historical status literal stays UNVERIFIED); parity artifacts carry actual runtime status.

Three new tests passed. Preview/export-GIF-prequant/worker/golden-environment raw RGBA were byte-identical at frames0,45,90,135,179. Out-of-order seeks120,10,120,75 matched. Actual PNG capture also passed for synthetic frames0–4. Studio is explicitly NOT_RUN. Evidence: runs/m1-resume/renderer-tests.log and renderer-parity.json; initial capture under runs/m1-renderer/renders/. M1 recipe parity remains pending.

The first unchanged M0 suite on legacy131 was45/46: repeat-render frame55 differed. This is retained as a capture-race finding; no tolerance or frozen implementation was changed. The failure is being rechecked separately from the successful153 five-repeat migration check.

Compatibility follow-up: the isolated unchanged131 repeat-render test passed (1/1); the first failure remains recorded. All **46 unchanged M0 tests passed on M1's153 browser**, using the test-only browser-path loader. Evidence: runs/m1-resume/m0-tests-153.log and exit0; m0-131-render-retry.log and exit0. Renderer now has four new tests: three initial tests including browser integration passed; the added stable-mismatch/capture-race test and other two nonbrowser tests passed separately.

## Milestone 2 — TESTED

Exact BigInt arithmetic validates and normalizes all project/document, keyframe, camera, light, behavior and text-segment rational times on a copied project. Every document and project must use30fps; proposals changingFPS areFORBIDDEN_OP. Noninteger/unsafe frame results areTYPE_INVALID with NON_INTEGER_FRAME and the precise path. No rounding; half-open ranges enforced before product loading or browser launch. Seven new timing tests passed, including15000/30000→15 and1001/30000 rejection. Build passed. Evidence: runs/m1-resume/timing-tests.log.

## Milestone 3 — TESTED

Product projectedCorners and objectBounds supply word geometry through a camera push. Evidence includes perword boxes, inherited/material/atmosphere opacity, raw-product-PNG frames and a contact sheet with exact cell mapping. The unchanged M0 EvidenceManifest validates under Ajv. The M1 verifier checks coverage, coordinate system, hashes, copied harness, source/config identity and path confinement. Two evidence tests passed, including unsplit words, unavailable projections, parent opacity, bad decode, camera/seek consistency and tampering. Evidence: runs/m1-resume/evidence-final.log, evidence-proof.json.

Raphael's resume instruction retires131: all active browser entry points now select153, no fallback. This supersedes earlier historical notes about retaining131 as M0's pin. Recipe compilation will require actual single-word objects and treat unsupported word evidence as a failure, never a skip.

Fresh Kimi canary on153: PASS / VERIFIED_ATTACHMENT, Kimi2.5.2 managed subscription, noAPIkey, no tools. Proof: runs/m1-resume/canary-fresh/. All46 unchanged M0 tests passed with153 as the default pin, without a migration loader (m0-153-only.log).

## Recipe compiler — TESTED

Three versioned manifests and recipe schema are present. Deterministic descriptions compile via product constructors, validateMotionOps, applyMotionTransaction and parseProject; the renderer implementation remains the product's. All text becomes measured single-word child objects with stable IDs, opacity fade and10px rise. Unsplit/segmented text is rejected, never skipped. Synthetic value counters are successive whole-number word objects; their holds remain locked. Caption/source/lower-third text is locked by fixture script hash.

All three recipes compiled and rendered through preview/export/worker/golden environment with zero-tolerance parity on frames0–4. Three contract/compiler unit tests passed. Evidence: recipe-proof.json/log and recipe-tests.log under runs/m1-resume. Full-frame validation and five-stage parity remain pending the validator milestone; no recipe is yet claimed LIVE-VERIFIED. Specialty fonts explicitly fall back to registered IBM Plex Sans and are recorded in compile metadata.
