# M2.0 report — PASS; M2.1 BLOCKED / AWAITING_AUTHORIZATION

Raphael's two approved corrections are recorded in [M2_APPROVED_CORRECTIONS.md](M2_APPROVED_CORRECTIONS.md). Legacy grade order and frozen M1 v2 files are preserved. No product implementation has started.

[Machine-readable validation](m2_step0/validation.json) and [source findings](M2_STEP0_FINDINGS.md) establish:

- Chromium 153.0.8010.12 SwiftShader: preview HTMLCanvas, export HTMLCanvas and dedicated-worker OffscreenCanvas all pass WebGL2, 16F/32F target, fp32 precision, float/byte readback and context recovery checks. Maximum texture size is 8192. Headless-shell/new-headless and with/without disable-gpu sweeps pass.
- All seven shader cases at 1080×1920, in both 16F and 32F, match on float-readback and encoded-byte hashes across five fresh launches per host: 15 launches, 210 case executions. The transcendental diagnostic also matched; no differing function was found to ban. This proves repeatability of this probe suite, not future GPU/product parity.
- Foundry: 86/86 unchanged tests. Product: 709/709 Vitest tests; 52 golden frames, zero failures, unchanged committed baselines. Current main db36db3 is clean and E3 is merged. M0/M1 source/contracts/tests are unchanged.
- CPU float lit-point-move at 1080×1920 measured 1.258 seconds cold and 1.274 seconds warm median, including full readback. Only this fixture was measured; prior 3–6 seconds/frame is not a universal measured fact.

The current product worker shades byte buffers; the GPU OffscreenCanvas host is newly probed capability. Video now uses WebCodecs with explicit timestamps; raw canvas/GIF prequantization evidence remains authoritative. Hold/invert keys, Holo frame-rounded effects and stepped signal boundaries restrict M2.3 blur eligibility. Existing track-matte fields were not found. No product schema migration is proposed. Physical-GPU comparison is NOT_RUN.

## Required authorization for M2.1+

M2 handoff §2 explicitly requires Raphael's recorded permission before creating `foundry/m2-renderer` from db36db39821f46ec4b7057bb431ffb9e82473c33 or editing existing product files. Approval of the grade/v3 corrections did not grant this permission.

Proposed existing-file edit boundary:

1. `src/motion/render/drawDocument.ts` — renderer selection/entry integration; preserve the Canvas implementation and default.
2. `src/motion/export/pipeline.ts` — route selected GPU raw-frame rendering into the existing export boundary.
3. `src/motion/components/CanvasPreview.tsx` — select the canvas host/backend before acquiring its context, including HTML slice integration.

Add new GPU backend/worker/shader files under `src/motion/render/`, helpers under `src/motion/export/`, and separate `tests/golden-gpu/`/test files. Foundry v3 settings remain out-of-band. No edits to the Studio compositor, MotionDocument schema, catalog semantics, existing baselines, or other branches; no push/merge/PR/deploy/spend. Any additional existing-file path needs a separate review before editing it.

Next step: Raphael authorizes this branch and exact product edit boundary under [handoff §2](m2-handoff/MOTION_FOUNDRY_M2_SPEC.md). M2.1 has not started.
