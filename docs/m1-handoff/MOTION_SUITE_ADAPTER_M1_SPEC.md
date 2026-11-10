# Motion Foundry M1: Motion Suite adapter (handoff spec)

**Approved corrections:** See ../M1_APPROVED_CORRECTIONS.md (Raphael, 2026-11-10), authoritative over historical inspection assumptions.

**Status:** SPECIFIED ONLY. M0 is accepted (`motion-foundry` @ `ad063d3`, 46/46 tests, byte-identical renders with `--num-raster-threads=1`). Nothing in this M1 spec is implemented yet.

**Evidence base:** everything said about Motion Suite comes from a read-only source inspection of `raphatherealtor/blank-canvas-starter` at branch `claude/e3-highlight-render`, commit `de612e423bfe8aff37bd5dc29117cab72418da05`. That inspection read code but ran no tests or goldens. Each such claim is tagged **[OBSERVED@de612e4]**. Claims tagged **[UNVERIFIED]** are reports or assumptions. Step 0 has to confirm or correct all of them before any build work starts.

## 1. Goal and non-goals

**Goal.** Run the accepted M0 loop on real Motion Suite compositions, rendered by Motion Suite's own renderer: build → render → evidence → hard validators → vision review → typed repair → rerender → independent verify. M1 proves this on at least one scene built from a recipe. It also defines how a recipe declares its validators and the repair ops it allows.

**Non-goals:** changing Motion Suite or Studio features, fixing the Studio compositor, the live browser session or MCP broker, the CutLab-Motion-EmergentLabs backend, audio or narration rendering, production assets, publishing, and any spend.

## 2. Boundaries and authorization

- **Foundry work** happens in the Jackhammer project `motion-foundry` on a new branch, `m1-motion-suite-adapter`. New code lives under `src/adapters/motion-suite/` and `src/recipes/`. M0 contracts, the M0 allowlist, M0 validators, and all 46 M0 tests stay unchanged and must keep passing.
- **The Motion Suite repo is read-only by default.** Use it as a pinned checkout (a worktree at an exact SHA recorded in the config hash). This is **Path A**, and it is preferred because it changes nothing in the repo.
- **Path B** is a Motion Suite branch, allowed only if Path A turns out infeasible **and** Raphael's explicit authorization to modify the repo is recorded in the Jackhammer session:
  - Branch `foundry/m1-adapter` from the base Step 0 confirms.
  - Add new files only, under `foundry/` (or `tests/foundry/`).
  - **Do not edit any existing tracked file.** That includes `package.json`, renderer files, goldens, catalogs, and handoff docs. If an edit to an existing file seems necessary, stop and report `BLOCKED` with the exact diff you would need.
  - Do not merge, rebase other people's branches, force-push, update goldens, deploy, change repo visibility, or open a PR without a separate instruction.
- Other agents may be working in parallel (Claude `claude/agent-readiness`, Codex `codex/p1-preview-perf`). Do not touch their branches.
- `allow_spend=false` throughout. There is no paid API fallback. Reviewer CLIs run on subscriptions only, with spend risk probed the same way as in M0 §8.

## 3. Step 0: inspect the real Motion Suite code before building (mandatory gate)

Write `docs/M1_STEP0_FINDINGS.md` in `motion-foundry`. Mark each item **CONFIRMED / CORRECTED / NOT_FOUND** with `file:line` evidence and the commit SHA. Use non-mutating commands only.

1. **Access and base.**
   - Can Jackhammer clone `raphatherealtor/blank-canvas-starter`?
   - Current heads for `main`, `claude/e3-highlight-render`, `claude/agent-readiness`, `codex/p1-preview-perf`. Has E3 merged? **[OBSERVED@de612e4]** E3 = `main` (`991b787`) plus 2 commits, and `claude/agent-readiness` was not published.
   - Choose the base: Raphael's designated branch if he named one; otherwise E3 if it is unmerged, or `main` if E3 has merged. Record the SHA.
2. **Render entry points [OBSERVED@de612e4].**
   - `buildSpatialFrame(doc, seconds)` (`src/motion/render/spatialProjection`), then `sliceByHtmlLayers` (`src/motion/html/runtime`), then `drawPlanes` / `prepareLitLayers` (`src/motion/render/drawDocument`).
   - `exportComposition` (`src/motion/export/pipeline.ts`): GIF is frame-by-frame; WebM/MP4 come from `MediaRecorder`, are paced by wall clock, and fall back to `.mkv`.
   - Golden harness `tests/golden/page/main.ts` exposes `window.golden.renderProject(project, frame, mode)` with modes `preview | export | worker | draft | defaults` and returns raw RGBA plus base64. `tests/golden/run.ts` / `npm run golden` compares repeatability, preview vs export, and worker vs inline.
   - Check whether `motion_render_frame` / `motion_render` now exist **[UNVERIFIED: reported only]**.
3. **Project format [OBSERVED@de612e4].**
   - Portable JSON is `format:"cutlab-motion-project", version:1` with `motionDocuments`, `activeDocumentId`, and `assets` (where `dataUrl` must start with `data:image/`).
   - `MotionDocument` has `fps` (integer 1–120), `width`, `height`, `duration:{value,timescale}`, `objects`, `rootObjectIds`, `cameras`, `lights`, `lighting`, and `schemaVersion` (migrated to 4).
   - Validator: `parseProject` in `src/motion/host/persistence.ts`.
   - Ops: `makeOp`, `applyMotionTransaction` (`src/motion/engine/motion-document.ts`), and op validation in `src/motion/host/validation.ts`. Confirm `applyMotionTransaction` is pure and callable headless.
4. **Time [OBSERVED@de612e4].**
   - Keyframe `time` and behavior `startTime`/`duration` are rational `{value,timescale}` with integer `value`. Timescales seen: `doc.fps`, `30`, and `30000` (Studio).
   - `compositionFrames = round(duration.value/duration.timescale*fps)`.
   - An fps change in `motion_composition` preserves elapsed time. Foundry pins 30/1 and forbids FPS edits (Raphael correction, 2026-11-10).
   - Studio uses three clocks that disagree on a sped-up or reversed clip: `render-plan.ts`, `studioTimeToMotionTime`, and `buildWorkspaceHandoff`.
5. **Text [OBSERVED@de612e4].**
   - The kinetic-typography tool (`catalog.json` ~line 415) can split text into per-word child segments.
   - Its presets include `typewriter`, `char-pop`, and `projector-sweep`. These break the reveal rule (§8) and must never be used.
   - Text stores only a `fontFamily` string. Projects do not load fonts. The golden harness registers IBM Plex Sans 400/600 itself.
   - Confirm whether `buildSpatialFrame` planes carry object ids plus projected corners. Word bounds depend on this **[UNVERIFIED]**.
6. **Masks, lights, shadow, grade [OBSERVED@de612e4].**
   - Ops: `motion.mask.upsert/remove/setProps`, `motion.light.*`, `motion.lighting.setProps`, and `surface` through `motion.object.setProps`.
   - Grade fields: `exposureEV`, `toneMap`, `keyLightId`, `vignette`, `vignetteFeather`, `colorTemperature`.
   - Shadow fields: `shadowOpacity`, `shadowSoftness`, `shadowReceiverGap`, `shadowColor`.
   - Confirm that mask geometry can express arbitrary paths (needed for seeded deckle and serrated edges) **[UNVERIFIED]**.
7. **Studio renderer [OBSERVED@de612e4].** `renderMotionDocument` in `src/engine/compositor.ts` draws root objects itself, **without** `buildSpatialFrame`/`drawPlanes`. Can it be invoked headless?
8. **Toolchain.** Record the Chromium/Playwright versions the golden suite uses alongside the Foundry's pinned Chromium 131 flags. Run the existing `vitest` and `npm run golden` once at the base, read-only, and record the counts. No updates.

**Gate.** If `parseProject`, `applyMotionTransaction`, or a product render path (golden `renderProject` or `buildSpatialFrame`+`drawPlanes`) is **NOT_FOUND**, stop and report `BLOCKED`. If something is CORRECTED, continue only when the correction is a rename or a moved path with the same semantics. Any other correction means stop and report first.

## 4. Architecture

```
ms_scene.json (recipe intent + text lock + protected list)
   └─► Recipe compiler (Foundry, deterministic) ─► cutlab-motion-project JSON (candidate copy)
          └─► parseProject (product) ─► MS render harness in pinned Chromium
                 window.golden.renderProject(project, frame, mode)  ← product code, not reimplemented
                    └─► frames/*.png + boxes.jsonl ─► EvidenceManifest (M0, unchanged)
                           └─► M0 validators + Motion Suite validators ─► ValidationResult[]
                                  └─► ReviewRequest ─► Kimi (VERIFIED_ATTACHMENT) ─► RepairProposal
                                         └─► gate (allowlist from recipe) ─► lower to MotionOps
                                                └─► applyMotionTransaction on candidate ─► rerender
```

- **Renderer adapter** `adapters/motion-suite/renderer.ts` implements the M0 `RendererAdapter` interface. It builds the harness with the repo's own Vite config from the pinned checkout, or with a Foundry-side Vite config that aliases `@` to the checkout's `src`. It never copies or edits renderer code.
- **Snapshot source**: a portable project JSON file. M1 never reads the live Zustand session. **[OBSERVED@de612e4]** Revision lives on the session, not in the document.
- **Operation sink**: Foundry applies validated MotionOps to a candidate copy with the product's `applyMotionTransaction`, then re-checks the result with `parseProject`. M1 does not call `executeTool`, the poller, or the broker.
- **Identity (M0 rules):**
  - `revision_id` = `sha256(canonical(ms_scene.json) + canonical(compiled project))`, excluding volatile fields (`createdAt`, `updatedAt`, plus anything else Step 0 shows is volatile, such as `contributionTrace`).
  - `render_id` additionally hashes the Motion Suite checkout SHA, the harness bundle hash, the render mode, and the Chromium flags.

## 5. Renderer parity: the mismatch fix

**Evidence path.** Use golden `preview` mode at `FULL_QUALITY`, inline. If Step 0 shows the golden suite treats another mode as its reference, use that mode instead and record why.

New contract **`foundry.render_parity/0.1`**, one document per render (status vocabulary from M0):
```json
{"schema":"foundry.render_parity/0.1","render_id":"r_…","ms_sha":"…","frames":[0,45,90,135,179],
 "pairs":[
  {"a":"ms_preview","b":"ms_export_gif_prequant","status":"PASS","identical":true},
  {"a":"ms_preview","b":"ms_worker","status":"PASS","identical":true},
  {"a":"ms_preview","b":"golden_runner_env","status":"PASS","identical":true},
  {"a":"ms_preview","b":"studio_compositor","status":"WARN","identical":false,
   "metrics":{"pct_pixels_equal":91.2,"max_channel_delta":187,"psnr_db":24.1,"diff_bbox":[120,300,960,1500]},
   "detail":"Studio renderMotionDocument skips buildSpatialFrame/drawPlanes; lighting/mask/grade diverge"}]}
```

Rules:
- **Product modes inside the Foundry's pinned environment** (`ms_preview`, `ms_export_gif_prequant`, `ms_worker`) must be byte-identical with zero tolerance. Otherwise the result is `BLOCKED` / `NONDETERMINISTIC`, or `FAIL` if the result is repeatable but different, and M1 cannot be accepted.
- **`golden_runner_env`** renders the same frames with the Motion Suite golden runner's own launch configuration. Report `PASS` if identical; otherwise `WARN` with metrics and the flag diff. This measures the Foundry-vs-Motion-Suite environment gap; it is not a product failure.
- **Studio** is a measured gap, never fixed in M1. Report `WARN` with metrics, `UNSUPPORTED` if it cannot be invoked headless, or `NOT_RUN` with the reason. Do not alter `compositor.ts`.
- WebM/MP4 from `MediaRecorder` are never evidence, because they are paced by wall clock. An optional MP4 preview may still be assembled by ffmpeg from the evidence frames.
- Repeat determinism: 5 uncached runs of the proof scene with identical hashes, as in M0. Golden baselines are never regenerated; a difference from committed baselines is a recorded finding. Parity and determinism renders do not count toward the per-run repair budget.

## 6. Canonical timing (fps 30/1, integer frames)

- The adapter accepts only documents with `doc.fps === 30`. Every keyframe and behavior time must map to an exact integer frame: `value*30 % timescale === 0`. A violation is `ERROR`/`TYPE_INVALID` with `detail:"NON_INTEGER_FRAME <object>.<key>"`. Never silently round.
- Duration: `compositionFrames` must be an integer, and the Foundry range is half-open `[0, frames)`.
- Seek: frame `i` → `buildSpatialFrame(doc, i/30)` via the harness. This is exactly what the product calls. **[OBSERVED@de612e4]** The harness passes `frame/doc.fps`.
- Lowering: every timing op the Foundry emits is written as `{value: frame, timescale: 30}`.
- Studio placement (`startTime`, `sourceIn/Out` at timescale 30000, speed, reverse) is out of scope. The parity report notes only that the three Studio clocks agree at speed 1 with no reverse, if testable. Otherwise `NOT_RUN`.

## 7. Recipes: manifest contract

Each recipe is a versioned file in `src/recipes/<id>.recipe.json`, validated by the schema **`foundry.recipe/0.1`**:
```json
{"schema":"foundry.recipe/0.1","id":"vox-doc.chart_explainer","family":"vox-documentary","version":"0.1.0",
 "status":"SPECIFIED","fonts":["IBM Plex Sans:400","IBM Plex Sans:600"],
 "params":{"$ref":"params.schema.json"},
 "text_reveal":{"mode":"whole_word_fade_rise","rise_px":[8,12],"forbidden":["wipe","clip_reveal","per_char","typewriter","char-pop","projector-sweep","pen_stroke"]},
 "validators":[{"id":"safe_area.v1","params":{"safe":{"x0":90,"y0":200,"x1":990,"y1":1720}}},
   {"id":"required_content.v1"},{"id":"word_reveal.v1"},{"id":"occlusion_preserved.v1"},
   {"id":"anchor_timing.v1","params":{"max_early_s":0.5,"target_early_s":0.2}},
   {"id":"flash_luma.heuristic","max_status":"WARN"}],
 "allowed_ops":[{"op":"set","target":"objects.*.transform.x","type":"int","min":0,"max":1080}],
 "protected":"from ms_scene.protected"}
```

- **The compiler is deterministic.** Typed params in, MotionOps out, with stable object ids derived from recipe block id plus role (repair targets reference these ids). It is seeded from `ms_scene.seed`, and each tear edge gets its own derived seed.
- **A candidate** = `ms_scene.json` + an ordered list of accepted typed ops. Rendering compiles the scene, then applies the ops with `applyMotionTransaction`. `apply_recipe` appends a recipe block to the candidate's `ms_scene`; all other ops append to the op list. The original scene is never modified.
- **No arbitrary code or raw ops from agents.** Builders (Kimi) author `ms_scene.json` by choosing recipes and params only.
- **Starter recipes for M1:**
  - **`vox-doc.chart_explainer`** (priority, and the **required live-loop proof**): a cut-paper notebook background, a `doc.chart_build`-style bar build with value counters, a source line, a whole-word headline, and a `doc.lower_third`.
  - **`paper-collage.build_tear`** (Mommy Issues style): `collage.build` with seeded `edge.deckle` / `edge.serrated` masks, staggered drops with shadows, then `transition.tear_away`, plus a `slip.typed` whole-word caption.
  - **`editorial.cutout_pop`** (Dating Games style): a magazine grid, a silhouette cutout lifting with a growing shadow over a colour or halftone block, and a large serif headline revealed word by word.
- **Fonts.** M1 recipes are limited to fonts the harness registers. **[OBSERVED@de612e4]** Projects do not carry fonts. Recipes that need Caveat, Special Elite, or a serif need an additive Foundry harness page with bundled OFL fonts (Path B, or Path A on the Foundry side). Otherwise they fall back to IBM Plex and record it.
- **Wipes.** `editorial.halftone_wipe` and similar wipes may apply only to non-text colour blocks. A wipe on any text object is `ERROR`/`FORBIDDEN_OP`.
- Only synthetic fixture assets are used (procedural shapes, noise paper, simple silhouettes). Do not use production art.

## 8. Validators (Motion Suite set)

All of these are deterministic and run before any model call. Output is M0 `ValidationResult`.

- **`safe_area.v1`** (M0) runs on per-word bounds taken from projected planes after the camera transform. It requires recipe text to be split per word. If word bounds are unavailable, report `UNSUPPORTED` at word level. The object-level check still runs but is labeled as object level and never counts as the word-level PASS.
- **`required_content.v1`** (M0). The text lock is `ms_scene.text_lock` (path plus sha256 of Raphael's script or narration text). Every word must be present, unchanged, in order, and visible inside the safe area for its required duration.
- **`word_reveal.v1`** (new, hard).
  - Static part: each text word's entrance animates only opacity 0→1 plus y rise within `rise_px`. No mask, clip, or scale-x animation on text. No per-character segments. No forbidden presets.
  - Frame part: at hold frames (after the entrance ends), every word is fully opaque. No half-revealed word.
- **`occlusion_preserved.v1`** (new, hard). `ms_scene.protected` lists object, mask, and asset ids (for example a covered face). Any op touching their masks, assets, opacity, or z-order relative to the occluder is `ERROR`/`FORBIDDEN_OP`. Their mask and asset hashes must equal the base.
- **`tear_seed_unique.v1`** (new, hard). No two consecutive tear or edge instances share a seed.
- **`anchor_timing.v1`** (new, hard when word timestamps exist). Each anchored element lands on its word or up to 0.2 s before it, and never more than 0.5 s early. Without a timestamps file the result is `NOT_RUN`. Fixtures ship synthetic timestamps.
- **`flash_luma`, `blank_frame`, `collision`** (M0 heuristics, max `WARN`).
- **`render_parity.v1`** (§5).
- Regressions: any validator that passed on the base and fails on the candidate means rejection (M0).

## 9. Repair: wider allowlist for Motion Suite

Motion Suite may repair more aggressively than CutLab, using typed ops only. The allowlist **`repair-allowlist.motion-suite.v2`** is the intersection of a global bound table and the recipe's `allowed_ops`. The M0 allowlist is untouched.

| op | targets (examples) | type / bounds |
|---|---|---|
| `set` | `transform.x/y` | int, within canvas |
| `set` | `transform.scale` | 0.25–3.0 |
| `set` | `transform.rotation` | −30–30° |
| `set` | `transform.z` | −2000–2000 |
| `set` | `text.fontSize` / `letterSpacing` / `lineHeight` | M0 bounds |
| `set` | `layout.maxWidth`, `align`, `wrap` | M0 bounds |
| `set` | `surface.shadowOpacity` | 0–1 |
| `set` | `surface.shadowSoftness` | 0–1 |
| `set` | `lighting.exposureEV` | −2–2 |
| `set` | `lighting.vignette` | 0–1 |
| `set` | `camera.keyframes[k].value` (push/drift) | ≤ 2.5× push |
| `shift_keyframes` | an object's entrance | integer frames ±30, inside the range, order preserved |
| `set_stagger` | recipe word/layer stagger | 0.15–0.35 s, converted to integer frames |
| `set_easing` | keyframe easing | enum of easings confirmed in Step 0 |
| `apply_recipe` | add or replace a recipe block | registered recipe id plus params that pass its schema; existing assets only |

The M1 `ProposedOperation` envelope is a new versioned v2 contract; frozen M0 continues to use v1. `op` values beyond `set` are valid only under this allowlist id. Target paths are Foundry logical names; Step 0 maps each to the real Motion Suite field, and unmapped targets are dropped from the allowlist, not guessed.

**Forbidden** (`ERROR`/`FORBIDDEN_OP` unless noted):
- Text content edits, or anything that drops a required word (`REQUIRED_CONTENT_LOST`).
- Opacity, visibility, or delete on required text.
- Moving text offscreen without an `offscreen_entrance` annotation.
- Any op on protected ids.
- Asset swaps or new generated assets.
- Validator, budget, recipe-manifest, or harness edits.
- Raw `motion_apply_transaction` batches from the agent.
- A wrong type is `TYPE_INVALID`; an out-of-range value is `OUT_OF_BOUNDS`.

**Loop limits (M0):** ≤3 attempts, stop on `OSCILLATION`, `STALE_BASE` check against `revision_id`, candidate copies only, keep the last passing candidate, and send small retry context (failing window ±15 frames).

**Budgets** (config, recorded in RunResult):
- `max_renders_per_run=5`
- `reviewer_timeout_s=180`
- `run_wall_clock_s=900`. If Step 0 timings show lit Motion Suite frames are slow (reported **[UNVERIFIED]** at 3–6 s per lit frame), raise this to at most 1800 and record why.
- `render_timeout_s` scaled per frame count.
- Proof scene ≤ 180 frames.
- `allow_spend=false`.

Exceeding any budget is `BLOCKED`/`BUDGET_EXHAUSTED`.

## 10. M1 milestones (ordered)

0. **Step 0 findings** (§3). *Pass:* findings file committed and the gate is satisfied.
1. **Harness and renderer adapter.** *Pass:* render a synthetic Motion Suite project through the product path. In the pinned environment, preview = export-prequant = worker byte-identical. Golden-runner and Studio gaps are measured or labeled.
2. **Timing normalizer.** *Pass:* integer-frame acceptance tests (§11).
3. **Word bounds and evidence.** *Pass:* `boxes.jsonl` holds per-word projected bounds through a camera push. The manifest is the M0 manifest.
4. **Recipe contract and compiler.** Three manifests. *Pass:* each compiles to a project that `parseProject` accepts. Each renders, and validators run on it.
5. **Motion Suite validators.** *Pass:* positive and negative fixtures per validator.
6. **Repair lowering.** Allowlist → MotionOps → `applyMotionTransaction` on the candidate. *Pass:* round trip, plus every forbidden-op test.
7. **Mock loop.** Run on `vox-doc.chart_explainer` with a seeded defect: the headline overflows the safe area during a camera push, and a bar label is clipped. *Pass:* `closed_loop:"MOCK"` PASS.
8. **Live loop.** Kimi with `VERIFIED_ATTACHMENT` (re-run the canary). *Pass:* independent `foundry verify` PASS, no regressions, no human edits, `closed_loop:"LIVE"`.
9. *(Optional M1b, §12.)*

**Stop point:** after 8, or after 9 if attempted. Do not start CutLab or Wayframe adapters, UI, or Studio changes.

## 11. Acceptance tests (new; M0 suite must stay 46/46)

- Parity: product preview, export-prequant, and worker are byte-identical in the pinned environment on 5 frames of every recipe fixture. Golden-runner and Studio entries are present with status and metrics.
- Determinism: 5 uncached repeat renders of the proof scene have identical frame, boxes, and contact-sheet hashes. Seek out of order (e.g. 120, 10, 120, 75) matches sequential capture.
- Timing:
  - fps 24 or 29.97 → `TYPE_INVALID`.
  - Keyframe `{value:1001, timescale:30000}` → `TYPE_INVALID` (`NON_INTEGER_FRAME`).
  - `{value:15000, timescale:30000}` → frame 15.
  - Half-open last frame is `frames-1`.
- Identity: a changed checkout SHA, harness hash, or render mode gives a new `render_id`. Volatile `updatedAt` does not change `revision_id`.
- Text rules:
  - A `typewriter`, `char-pop`, `projector-sweep`, or wipe/clip on text is rejected, both in a recipe and in a proposal.
  - A word half-revealed at a hold fails `word_reveal.v1`.
  - A rise outside 8–12 px fails.
- Occlusion: an op touching a protected mask or asset is rejected. The protected hash changing fails.
- Required content: a changed word, a dropped word, a shortened hold, opacity 0, or offscreen text → rejected with the M0 codes.
- Allowlist: wrong type, out of bounds, unknown target, unregistered recipe id, `apply_recipe` with a non-existing asset, and raw MotionOps from the agent → rejected.
- Tear seeds: a duplicate consecutive seed fails.
- Anchor timing: an element landing 0.6 s early fails, 0.1 s early passes, and no timestamps gives `NOT_RUN`.
- Loop safety: stale base, oscillation, budget, disabled vision (`UNREVIEWED`), and mock can never be `LIVE`.
- Boundary: the test asserts `git status` in the Motion Suite checkout is clean after the full suite (Path A). On Path B, `git diff --name-status base..HEAD` shows only added files under `foundry/`.

## 12. Optional M1b: second-reviewer comparison (Gemini via `agy`)

- Probe `agy` exactly as in M0 §8. **[UNVERIFIED]** The research brief says the Antigravity CLI `agy` replaced Gemini CLI. Confirm installation, auth mode, spend risk, and image transport from `--help` and docs, then run the canary. Without `VERIFIED_ATTACHMENT`, M1b is `BLOCKED`/`NO_VISION_TRANSPORT`. Never fall back to an API key.
- Scene: synthetic `paper-collage.build_tear` with seeded defects (a caption clipped during the tear, a protected covered face that a naive fix would uncover, a word half-revealed at a hold).
- Protocol: both reviewers get the same `ReviewRequest`, byte-identical by hash, blind to each other. Each proposal runs on its own candidate chain with the same budgets. The verifier is always the Foundry deterministic core, never either model, and **the builder is never its own verifier**. Optional cross-critique (each model reviews the other's final frames) is advisory only.
- Output **`foundry.reviewer_comparison/0.1`**:
```json
{"schema":"foundry.reviewer_comparison/0.1","base_render_id":"r_…","review_request_sha256":"…",
 "reviewers":[{"adapter":"kimi","vision_transport":"VERIFIED_ATTACHMENT",
   "findings":[{"frames":[88,96],"objects":["caption_w3"],"matched_validator":"safe_area.v1"}],
   "finding_precision":0.67,"finding_recall":1.0,"proposals_valid":2,"proposals_rejected":[{"reason_code":"FORBIDDEN_OP"}],
   "final_status":"PASS","attempts":2,"renders":3,"wall_s":410,"regressions":0},
  {"adapter":"gemini-agy","vision_transport":"UNVERIFIED","final_status":"BLOCKED","reason_code":"NO_VISION_TRANSPORT"}],
 "human_preference":null,"contact_sheets":["kimi/c_02/contact_sheet.png","gemini/c_01/contact_sheet.png"]}
```
  Precision and recall are measured against the seeded defect list and the validator failures, matched by frame window and object. `human_preference` stays `null` for Raphael to fill in.

## 13. Done definition

M1 is done when all of the following hold:
1. Step 0 findings are committed.
2. Motion Suite renders through its own code path, with preview, export, and worker byte-identical in the pinned environment. Golden-runner and Studio gaps are measured or labeled.
3. Canonical 30/1 integer-frame timing is enforced.
4. Three recipe manifests compile, render, and validate.
5. One live Kimi loop on `vox-doc.chart_explainer` reaches an independent PASS with no regressions.
6. 5/5 uncached determinism runs pass.
7. All §11 tests and the 46 M0 tests pass.
8. The Motion Suite repo is unchanged, or additive-only on `foundry/m1-adapter` with recorded authorization.
9. Spend is zero.

Report each capability as SPECIFIED, TESTED, or LIVE-VERIFIED. A clear `BLOCKED` beats an inflated PASS.
