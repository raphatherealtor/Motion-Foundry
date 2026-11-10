# Kickoff prompt: Motion Foundry M2, the GPU float render pipeline (paste into Jackhammer / Codex)

You are implementing **Milestone M2** of Motion Foundry. M1 was accepted at `b52aebd` on `m1-motion-suite-adapter`: the live Kimi loop and independent verify passed, 5/5 repeats were identical, the suite is 86/86, and it runs on Chromium 153 only. Read `MOTION_FOUNDRY_M2_SPEC.md` in full first, then `ref/MOTION_SUITE_ADAPTER_M1_SPEC.md`.

Reuse the M0/M1 contracts, IDs, statuses, budgets, canary rules, and M1 decisions exactly:
- fps is 30/1, and an fps change is `FORBIDDEN_OP`.
- Frames are integers with exact rational conversion.
- `shadowSoftness` runs 0–1.
- v1 and v2 schemas are frozen.
- Keep `--num-raster-threads=1`.
- Preview, export, and worker must be byte-identical.

The only new reason codes allowed are the six listed in spec §10.4. Put every other sub-cause in `detail`.

## Authorization gate (check first)
- M2.0 (Step 0) is read-only and may start now.
- **Everything after M2.0 needs Raphael's explicit authorization, recorded in this session.** It must cover creating the branch `foundry/m2-renderer` in `raphatherealtor/blank-canvas-starter` and editing the existing renderer files Step 0 lists, plus adding new files.
- Without that authorization, stop after M2.0 and report `BLOCKED` with the detail `AWAITING_AUTHORIZATION`.

## Boundaries
- **Foundry:** work on the new branch `m2-gpu-renderer`, cut from `b52aebd`. Don't change M0/M1 contracts, allowlists, validators, tests, or the v1/v2 schemas. Add only v3 files.
- **Motion Suite (only after authorization):** work only on `foundry/m2-renderer`, and only in the authorized paths.
  - Keep the legacy Canvas 2D renderer as the **default** and as the runtime fallback, behind `renderer: "canvas2d" | "gpu"`.
  - **Never edit or regenerate existing goldens.** GPU goldens go in a new directory.
  - Don't touch the Studio compositor or the product document format. If a schema change is needed, stop and propose the diff.
  - No merge, force-push, deploy, visibility change, or PR. Don't touch other agents' branches.
- `allow_spend=false`. No paid API fallback. No generation, publishing, or messaging. Use synthetic fixtures only.
- **Commit each milestone (M2.0–M2.6) when its pass criteria hold**, each with `docs/M2_<n>_REPORT.md`.
  - No scope creep. Put ideas in `docs/M2_BACKLOG.md`.
  - Keep the full suite green at every commit.

## Order of work
0. **M2.0 Step 0 (spec §3). This is a gate. Build nothing yet.**
   - Re-confirm the code facts: the legacy Canvas 2D 8-bit path, the CPU float lit path (with timing), projection, the blend/matte/mask set, continuous-time evaluation, the modes, asset decode, and the toolchain.
   - Probe WebGL2 in the **preview, export, and worker** hosts under SwiftShader in headless Chromium 153. Record the renderer string, extensions (`EXT_color_buffer_float`, `EXT_float_blend`, and the rest), RGBA16F/32F FBO completeness, limits, HIGH_FLOAT precision, and float readback.
   - **Verify, don't assume, the flags.** Candidates from Chromium docs: `--use-gl=angle --use-angle=swiftshader`, `--use-angle=swiftshader-webgl`, `--enable-unsafe-swiftshader`.
   - Run the probe shader suite with 5 fresh-launch repeats per host, plus cross-host parity.
   - Tag every fact OBSERVED (with its command or `file:line`) or ASSUMED.
   - **Stop and report on any gate failure.** Never fall back silently to 8-bit or Canvas 2D in evidence.
1. **M2.1:** build the `GpuBackend` interface (webgl2, with a mock backend), the layer raster and upload, linear float16 compositing, the full blend-mode set, track mattes, mask fields with SDF, and `blending_gamma`.
   - Measure compat parity against legacy with calibrated tolerances, and prove they discriminate seeded regressions.
   - Write `docs/M2_INTENTIONAL_DIFFERENCES.md` and the oracle tests.
2. **M2.2:** add the exact sRGB EOTF/OETF, the output transform in the legacy grade order, and dither at final quantization only.
   - Add `banding.v1` with a negative control, the color stress tests, and the color perception outputs.
3. **M2.3:** add motion blur with exact rational sub-frame times, 8–16 samples, shutter angle 180, phase −90, a 32F accumulator (or a 16F tree), and the static-layer cache.
   - Add the samples, shutter, direction, static, and energy validators plus judder, and the blur maps.
   - θ=0 must be byte-identical to the unblurred output.
4. **M2.4:** build the texture stack over mask fields (noise, displacement, grain, paper, deckle, halftone) with integer-hash seeding.
   - Add the seed, displacement, grain, containment, tiling, and `occlusion_coverage.v1` validators.
   - Displacement on required text is forbidden.
5. **M2.5:** port the lit path to the GPU and dual-run it.
   - Run the lit parity gate. Keep the CPU path as a test oracle and keep it as the default until Raphael accepts the parity report.
   - Record the perf numbers as measured against TARGETs.
6. **M2.6:** build the recipes `paper-collage.build_tear` v0.2, `editorial.cutout_pop` v0.2, and `kinetic.product_title` (non-documentary), plus the `lab.*` test cards.
   - Run the mock loop, then the **live Kimi loop** on the seeded collage scene. Re-run the canary first. Gemini via `agy` is optional, and if it isn't `VERIFIED_ATTACHMENT` it is BLOCKED.

## Hard rules
- Every capability ships with a validator **and** a recipe (spec §13). Keep the building blocks general.
- Never invent results. Every perf and tolerance number is a TARGET until it is measured.
- Stop and report on semantic mismatches: unexplained parity differences, a grade-order mismatch, non-continuous evaluation, or an undocumented legacy formula.
- **M1 art rules hold:**
  - Text reveals whole words with a fade and an 8–12 px rise. Never use wipes, clip reveals, or per-character reveals on text.
  - Never change narration or script text.
  - Never touch protected occlusions or covered faces.
- Repairs use typed, bounded ops only (`repair-allowlist.motion-suite.v2`), with at most 3 attempts and an oscillation stop.
- The deterministic core is the only verifier, and a builder never verifies its own work.

## Stop point
Stop after M2.6. Don't start the graph editor, precomps, tracking, WebGPU, HDR, Studio, UI, or CutLab work. Don't switch the product's default renderer.

## Report back (per milestone and at the end)
- Step 0 findings, corrections first, including the exact working flag set and the renderer strings.
- Branch SHAs and the changed-files list for both repos.
- Test counts: 86 existing plus new.
- 5/5 determinism hashes, and preview/export/worker parity.
- Calibrated parity and tolerance thresholds, with discrimination results.
- Perf numbers marked OBSERVED versus TARGET.
- Capability status (SPECIFIED / TESTED / LIVE-VERIFIED) per §13 row.
- Live run artifacts: manifest, contact sheet, perception files, failing ValidationResult, proposal, candidate, and RunResult with `closed_loop`.
- Spend (expected none) and any deviations from the spec.

A clear BLOCKED is better than an inflated PASS.
