# M1 Step 0 findings

**Status: BLOCKED. No M1 adapter, recipe compiler, validator or repair implementation has started.**

Foundry branch: `m1-motion-suite-adapter`, based on `0edb70c`. Path A checkout: `/root/projects/motion-suite-m1`, detached at **`25cb5454d1f14f889d36c79dec3965a95f7b2c99`**. Unless marked Foundry, every file:line below refers to that Motion Suite SHA.

## Corrections first

1. **CORRECTED — FPS-change semantics.** The spec's §3.4 says `motion_composition` keeps frame indexes, changing elapsed seconds. Current main preserves elapsed seconds and re-expresses keyframes, behaviors, camera keys and duration on the new frame grid. Evidence: `src/motion/host/retime.ts:49`, `src/motion/control/commands.ts:30`, `src/motion/control/catalog.json:90`; the passing test at `src/motion/__tests__/coherence.test.js:65` checks the midpoint and retained 0/2-second keyframes after 30→60 FPS. This is a semantic correction, not a rename. The spec's gate requires stopping.
2. **CORRECTED — shadow-softness domain.** M1 §9 allows `surface.shadowSoftness` 0–40. The real property is normalized 0–1, with penumbra growing with receiver gap: `src/motion/engine/motion-document.ts:187`, `src/motion/host/validation.ts:27`, `src/motion/engine/lights.ts:435`. Values above 1 are rejected. No conversion or product change was invented. Approve normalized bounds or omit this repair target.
3. **CORRECTED — strict transaction purity.** `applyMotionTransaction` is callable without a browser and did not mutate its input in the probe, but always stamps `updatedAt: Date.now()`: `src/motion/engine/motion-document.ts:973`. It is not a strictly deterministic pure return value. M1 §4 already anticipates excluding `updatedAt`; that exclusion must be explicit rather than freezing the product clock.
4. **NOT_FOUND — compatible M1 operation envelope in frozen M0.** Foundry `src/contracts.ts:4` restricts operations to `set`; `src/schemas.ts:10` also restricts target groups and scalar values. `src/schemas.ts:14` fixes the review allowlist ID to `repair-allowlist.v1`. A real schema probe rejected both `shift_keyframes` and `repair-allowlist.motion-suite.v1`. M1 §9's wider envelope cannot validate against these unchanged schemas. An adapter-specific extension policy needs clarification; no M0 contract was edited.

The provided gate says: **“If something is CORRECTED, continue only when the correction is a rename or a moved path with the same semantics. Any other correction means stop and report first.”** Source: [M1 spec §3](m1-handoff/MOTION_SUITE_ADAPTER_M1_SPEC.md). Branch authorization does not waive this gate.

## 1. Access and base

- **CONFIRMED:** SSH clone works through the existing container SSH identity. Plain unauthenticated HTTPS failed; the connected Work GitHub API independently confirmed repository access. No credentials were displayed or copied.
- **CORRECTED:** E3 has merged. Main is `25cb5454d1f14f889d36c79dec3965a95f7b2c99`; E3 is `de612e423bfe8aff37bd5dc29117cab72418da05`, now 11 commits behind main and an ancestor. Therefore main is the selected base, per §3.1. See `runs/m1-step0/refs.txt:1` and the recorded commit comparison.
- **CORRECTED:** `claude/agent-readiness` is now published at `2a9c68a8d68a165906a2e9622dbe7862f135ac8b`. `codex/p1-preview-perf` is `e18fe6cf4276c82b6f1a446d669791726087de0b`. These heads were read only; no other agent's branch was checked out or changed.
- **CONFIRMED:** Raphael's Nov 9 authorization, supplied in this topic, permits Path B only on `foundry/m1-adapter`, with additive files under the allowed Foundry directories. It was not used. No Motion Suite branch, commit, push, PR, merge or tracked-file edit was made.

## 2. Product render paths

- **CONFIRMED:** `buildSpatialFrame(doc, seconds)` exists at `src/motion/render/spatialProjection.ts:24`; slicing is at `src/motion/html/runtime.ts:165`; `drawPlanes` and `prepareLitLayers` are at `src/motion/render/drawDocument.ts:264` and `:325`.
- **CONFIRMED:** `tests/golden/page/main.ts:136` exposes `window.golden.renderProject`. Mode declarations are at `:35`; RGBA/base64 packing is at `:51`. Preview uses FULL_QUALITY and `frame/doc.fps` at `:67`; worker rendering is at `:79`; export observes the product GIF encoder's prequantization read at `:92`. Product parity is not yet measured.
- **CONFIRMED:** Export is frame-stepped through `src/motion/export/pipeline.ts:51` and `:112`. GIF reads pixels at `:119`; MediaRecorder pacing is at `:102` and `:124`; MP4's .mkv fallback is at `:141`. Encoded video is not deterministic evidence.
- **CONFIRMED:** Previously unverified `motion_render_frame` and `motion_render` now exist in `src/motion/control/catalog.json:978` and `:1008`. Product `renderStill` exists at `src/motion/export/pipeline.ts:166` and rounds its frame argument at `:169`; M1 must reject fractional frames before calling product helpers. No tool, broker, job or live session was invoked.

## 3. Project format and edits

- **CONFIRMED:** Portable format/version, document map, active id, dimensions, duration and image/SVG assets: `src/motion/host/types.ts:9`, `src/motion/host/persistence.ts:41`. Asset data URLs must start `data:image/` at `:62`; integer FPS 1–120 is checked at `:46`. `materials` and `signals` are also required. Lighting fields are optional; schema version 4 is declared at `src/motion/engine/motion-document.ts:394` and migrated at `src/motion/engine/lights.ts:54`.
- **CORRECTED, path only:** `makeOp` is in `src/motion/host/operations.ts:6`. The transaction function is at `src/motion/engine/motion-document.ts:973`; op schemas are in `src/motion/host/validation.ts:35`.
- **CONFIRMED:** A Node-only probe successfully applied an op to a candidate, left the source unchanged, passed the result through `parseProject`, and built an empty spatial frame. This proves entry-point callability, not pixel parity or universal mutation-freedom. The parser performs migrations on its input map (`persistence.ts:60`), so use a candidate copy.

## 4. Time

- **CONFIRMED:** Rational `{value,timescale}` at `src/motion/engine/time.ts:7`, integer validation at `src/motion/host/persistence.ts:53`, and the 30000 default at `src/motion/host/operations.ts:5`. Frame-count rounding is at `src/motion/host/retime.ts:6`.
- **CORRECTED:** FPS changes preserve elapsed seconds, as described above. M1 must still enforce exactly 30 FPS and exact integer frames independently.
- **CONFIRMED:** Studio clocks differ: `src/engine/render-plan.ts:102` includes source-in and speed; `src/engine/motion-bridge.ts:51` includes speed/reverse; `src/engine/workspace-context.ts:144` subtracts placement without those factors. Runtime agreement was NOT_RUN; Studio placement remains outside M1.

## 5. Text, fonts and word geometry

- **CONFIRMED:** `src/motion/spatial/typography.ts:63` creates per-word child objects. The forbidden presets remain at `:91`: typewriter, char-pop and projector-sweep. M1 must not use them.
- **CONFIRMED:** Fonts are family-name strings, not portable font assets (`src/motion/engine/motion-document.ts:105`, `src/motion/host/types.ts:4`). The golden page registers only IBM Plex Sans 400/600 (`tests/golden/page/main.ts:113`). Other recipe fonts need an explicitly registered bundled font or a recorded compiler fallback; automatic IBM fallback for arbitrary missing family names was not assumed.
- **CORRECTED, access representation:** Planes expose `state.objectId` and transforms, not precomputed corner fields (`src/motion/render/spatialProjection.ts:10`, `:41`). The product's exported `projectedCorners` helper at `:62` computes those corners through the camera. No projection code needs copying. Word-level runtime evidence is NOT_RUN.
- **NOT_FOUND:** Native `layout.maxWidth`/`layout.wrap` fields in the inspected MotionObject/op schemas. Text properties are flat (`motion-document.ts:222`, `host/validation.ts:16`). Those logical repair targets need an approved mapping or must be omitted, per M1 §9.

## 6. Masks, lights, grade and shadows

- **CONFIRMED:** Mask/light/lighting op families and surface edits exist at `src/motion/host/validation.ts:27`, `:36`, `:39`, `:50`.
- **CONFIRMED:** Grade fields are declared at `src/motion/engine/motion-document.ts:360`; their validation is at `src/motion/host/validation.ts:32`. Shadow fields exist at `motion-document.ts:184`; softness has the normalized-domain correction above.
- **CONFIRMED:** Arbitrary SVG mask paths are representable (`motion-document.ts:59`, `host/validation.ts:33`) and are consumed by `Path2D` in `src/motion/render/drawDocument.ts:90` and `src/motion/render/layerMask.ts:49`. No runtime tear/occlusion claim is made.
- **CONFIRMED:** Product easing values are enumerated at `src/motion/host/operations.ts:12` and `src/motion/host/validation.ts:10`. No M1 lowering map has been built.

## 7. Studio and baseline checks

Studio exports `renderFrame` (`src/engine/compositor.ts:895`); its private motion renderer at :984 follows a separate root-object path. Headless Studio rendering and pixel agreement were NOT_RUN.

Using CI's Bun 1.4.2, frozen dependencies and Vitest 3.2.7, the product suite passed once: **671 tests, 41 files**. `npm run golden` was attempted once as-is and exited 2 because Playwright's Chromium 153 headless shell was absent. **Zero frames rendered**; golden parity is NOT_RUN. No browser override, baseline update or tolerance change was made. Logs and probes are in `runs/m1-step0/`. M0's previous 46-test result was not rerun here.

All 587 tracked product files retained their SHA256 hashes, with clean git status at the pinned SHA. Protected M0 files also remain unchanged. No M1 live Kimi loop, optional Gemini comparison, recipes or repeat-render validation ran.

The brief must resolve the semantic corrections and M1 envelope policy before implementation resumes. This commit records Step 0 only.
