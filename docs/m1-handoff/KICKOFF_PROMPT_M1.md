# Kickoff prompt: Motion Foundry M1, the Motion Suite adapter (paste into Jackhammer / Codex)

You are implementing **Milestone M1** of Motion Foundry (M0 accepted at `ad063d3`, 46/46). Read `MOTION_SUITE_ADAPTER_M1_SPEC.md` in full first. Reuse the M0 contracts, IDs, statuses, reason codes, budgets, and canary rules exactly. Don't add statuses or reason codes; put sub-causes in `detail`.

## Boundaries

- Work in `motion-foundry` on a new branch, `m1-motion-suite-adapter`. New code goes under `src/adapters/motion-suite/` and `src/recipes/`. Don't change M0 contracts, the M0 allowlist, M0 validators, or M0 tests.
- `raphatherealtor/blank-canvas-starter` (Motion Suite) is **read-only**. Use it as a pinned checkout at a recorded SHA (Path A).
- Path B is allowed only if Path A is impossible **and** Raphael's authorization to modify that repo is recorded in this session:
  - Branch `foundry/m1-adapter`, new files only, under `foundry/`.
  - Never edit an existing tracked file. If you would need to, stop and report `BLOCKED` with the diff.
  - No merge, force-push, golden updates, deploy, visibility change, or PR.
- Don't touch other agents' branches, the CutLab-Motion-EmergentLabs backend, the live app session, or the MCP broker.
- `allow_spend=false`. No paid API fallback. No generation, publishing, or messaging. Use synthetic fixture assets only, never production art.

## Order of work

0. **Step 0 inspection (spec §3), before any build.** Write `docs/M1_STEP0_FINDINGS.md`, marking every assumption CONFIRMED / CORRECTED / NOT_FOUND with `file:line` and the SHA. `[OBSERVED@de612e4]` items come from a read-only code reading, not runtime truth. Run vitest and `npm run golden` once, read-only. Gate: stop if `parseProject`, `applyMotionTransaction`, or a product render path is missing, or if a correction changes semantics rather than a name or path.
1. **Renderer adapter.** Render via the golden harness (`window.golden.renderProject`) or the product's `buildSpatialFrame` → `drawPlanes`; never reimplement renderer code. Emit `foundry.render_parity/0.1`: preview, export-prequant, and worker byte-identical in the pinned environment; golden-runner and Studio gaps measured (WARN plus metrics) or labeled UNSUPPORTED/NOT_RUN. Don't modify the Studio compositor.
2. **Timing.** Enforce fps 30/1 and exact integer frames. Reject with `TYPE_INVALID` + `NON_INTEGER_FRAME`, and never round silently.
3. **Evidence.** Collect per-word projected bounds through camera moves into the M0 manifest.
4. **Recipes.** Write the `foundry.recipe/0.1` manifests and a deterministic compiler for `vox-doc.chart_explainer` (the priority and the live proof), `paper-collage.build_tear`, and `editorial.cutout_pop`.
5. **Validators.** Hard: `safe_area.v1`, `required_content.v1`, `word_reveal.v1`, `occlusion_preserved.v1`, `tear_seed_unique.v1`, `anchor_timing.v1`. Heuristics cap at WARN.
6. **Repair lowering.** Lower `repair-allowlist.motion-suite.v2` to MotionOps on a candidate copy using the product's `applyMotionTransaction`, then re-check with `parseProject`.
7. **Mock loop**, then the **live Kimi loop** on the seeded vox scene. Re-run the canary first.
8. **Optional M1b.** Compare Gemini via `agy` against Kimi (spec §12). Probe `agy` first. If it isn't `VERIFIED_ATTACHMENT`, report `BLOCKED`/`NO_VISION_TRANSPORT`.

## Hard art rules

Text reveals one whole word at a time with a fade and an 8–12 px rise. On text, never use wipes, clip or per-character reveals, `typewriter`, `char-pop`, `projector-sweep`, or pen-stroke handwriting. Never change narration or script text, and never touch protected occlusions or covered faces. Repairs may be aggressive, but only through typed, bounded ops, with at most 3 attempts and an oscillation stop. The deterministic core is the only verifier, and a builder never verifies its own work.

## Stop point

Stop after the live loop, or after M1b if you attempt it. Don't start CutLab or Wayframe adapters, UI, or Studio changes.

## Report back

Step 0 findings (corrections first); Path A or B with the Motion Suite SHA and a clean `git status` (or the added-files list); the parity report; 5/5 determinism hashes; test counts (M0 46 plus new); artifact paths for one live run (manifest, contact sheet, failing ValidationResult, proposal, candidate, RunResult with `closed_loop`); recipe status (SPECIFIED / TESTED / LIVE-VERIFIED); the M1b comparison JSON or why it is BLOCKED; spend (expected none); and deviations from the spec.

A clear BLOCKED is better than an inflated PASS.
