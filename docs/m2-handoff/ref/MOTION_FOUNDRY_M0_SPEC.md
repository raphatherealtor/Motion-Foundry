# Motion Foundry Core — M0 Technical Spec (handoff)

**Status of this document:** SPECIFIED ONLY. Nothing here has been implemented, tested, or verified end to end. Every model capability, CLI flag, subscription inclusion, and vision-support claim from earlier research counts as **UNVERIFIED** and must not be hardcoded. The technologies named below (TypeScript/Node, Playwright/Chromium, GSAP, ffmpeg/ffprobe) are *proposed* choices. They are not dependencies known to exist in any repo.

## 1. Goal and non-goals

**Goal.** Build shared infrastructure that renders, captures, reviews, keeps evidence for, and repairs AI-authored motion graphics. It must run as a standalone, host-neutral core that BandAI (the user's host for several coding-agent CLIs) can call. M0 proves one closed loop with no human edits: render → measurable failure → a real agent sees the evidence → the agent proposes a scoped fix → the fix is applied to a candidate → rerender → an independent PASS with no regressions.

**Builder roles (configurable, not hardcoded).** Kimi is the intended primary builder. Gemini can act as builder, art director, or visual reviewer. Mistral/Vibe can do coding and verification where its capabilities allow. Codex implements the core tonight. Use existing subscriptions first. **Never silently fall back to a paid API or create spend.**

**Non-goals for tonight:** a frontend, hosting, a multi-agent scheduler, a full NLE, real Wayframe/Motion Suite/CutLab integration, production assets, real Mommy Issues output, generated speech or music, paid generation, publishing, or sending anything.

## 2. Components and dataflow

```
scene.json (fixture) ──► Renderer (HTML/GSAP in headless Chromium, frame-seek)
                              │ frames/*.png + render.json
                              ▼
                       Evidence builder ──► EvidenceManifest (immutable, hashed)
                              │                 │ contact_sheet.png, frame index
                              ▼                 ▼
                    Deterministic validators ──► ValidationResult[]
                              │ (fail)
                              ▼
         ReviewRequest ──► Reviewer/Repair adapter (external CLI, configurable)
                              │ RepairProposal (ProposedOperation[])
                              ▼
         Proposal gate (stale check, allowlist, budget) ──► candidate copy of scene
                              │
                              ▼  rerender → new render_id → revalidate → RunResult
```

Components:
- **core/contracts**: TypeScript types plus JSON Schemas, with a version field in every document.
- **core/hash**: canonical JSON with sorted keys, then SHA-256.
- **adapters/local-html-gsap**: the only renderer adapter built in M0.
- **core/evidence**: frame capture, contact sheet, manifest.
- **core/validators**: geometry hard checks, plus heuristics labeled as heuristics.
- **core/reviewer**: provider-neutral interface, CLI capability probe, and a mock that is flagged as mock.
- **core/repair**: the state machine, operation allowlist, and checkpoints.
- **cli**: a thin command entry point.

## 3. Proposed layout and commands (to implement, not existing)

```
motion-foundry/
  package.json            # pinned deps incl. local gsap
  assets/fonts/           # package-pinned font files (OFL), no CDN
  fixtures/m0-overflow/scene.json
  src/contracts/  src/hash/  src/render/  src/evidence/
  src/validate/   src/review/ src/repair/ src/cli.ts
  config/foundry.config.json   # budgets, reviewer adapter config
  test/                         # unit + negative tests
  runs/<run_id>/               # outputs (gitignored)
```

Proposed commands, each to be built:
- `foundry render <scene> --out <dir>`
- `foundry validate <render_dir>`
- `foundry probe-reviewer`: writes `capabilities.json`
- `foundry repair-loop <scene> --max-attempts 3`
- `foundry verify <run_dir>`: recomputes hashes and revalidates on its own
- `npm test`

## 4. Timebase and identity

- Logical canvas is 1080×1920. fps is stored as a rational `{num:30, den:1}`. The **integer frame index is the primary time.** Seconds are derived: `t = frame * den / num`.
- Canonical mapping is `canonical_frame = frame + range_start_frame`. Ranges are **half-open** `[start, end)` and quantized to integer frames with an explicit rounding rule (`floor` on start, `ceil` on end, recorded).
- The review render may be downscaled, for example to 540×960. In that case the manifest records `transform: {scale_x:0.5, scale_y:0.5, offset_x:0, offset_y:0}`, and every finding is reported in **logical** coordinates.
- Identity:
  - `revision_id` is the hash of scene source.
  - `candidate_id` identifies a repair candidate and its parent revision.
  - `render_id` is **content-derived**: the hash of (schema version, source_hash, assets_hash, renderer_config_hash, frame range, output dims). Identical inputs reproduce the **same** `render_id`. A changed source, assets, config, range, or dims produces a new one.
  - `attempt_id` is unique for every render invocation, and its output lives under `renders/<render_id>/<attempt_id>/`.
  - Evidence is never mutated after it is written. A rerender with identical inputs writes a new attempt directory and never overwrites an earlier one.
- Frame labels (`f0000`…) and contact-sheet cell indexes are a deterministic function of the frame list, so they are stable across reruns.
- `canonical_word_ids` is nullable. Standalone fixtures leave it `null`.

## 5. Contracts (names proposed)

Statuses are shared across documents: `PASS | FAIL | WARN | UNKNOWN | NOT_RUN | UNSUPPORTED | ERROR | BLOCKED | UNREVIEWED`. **Only `PASS` counts as pass.** Absence of a result never counts as PASS.

Stop and rejection conditions are expressed as a `reason_code` under one of the declared statuses above. They are never new statuses:
- `BLOCKED` with `reason_code` `BUDGET_EXHAUSTED`, `OSCILLATION`, `NO_VISION_TRANSPORT`, `SPEND_RISK`, or `NONDETERMINISTIC`.
- `ERROR` with `reason_code` `STALE_BASE`, `FORBIDDEN_OP`, `TYPE_INVALID`, `OUT_OF_BOUNDS`, `REQUIRED_CONTENT_LOST`, or `EVIDENCE_HASH_MISMATCH`.

Example: `{"status":"ERROR","reason_code":"STALE_BASE","detail":"…"}`.

**EvidenceManifest**
```json
{"schema":"foundry.evidence/0.1","render_id":"r_9f2c","attempt_id":"a_0001","revision_id":"v_a11e","candidate_id":null,
 "hashes":{"schema":"sha256:…","source":"sha256:…","assets":"sha256:…","renderer_config":"sha256:…"},
 "logical":{"w":1080,"h":1920},"output":{"w":540,"h":960},
 "transform":{"scale_x":0.5,"scale_y":0.5,"offset_x":0,"offset_y":0},
 "fps":{"num":30,"den":1},"range":{"start":0,"end":270},"timebase":"frame",
 "frames":[{"i":0,"label":"f0000","path":"frames/f0000.png","sha256":"…"}],
 "contact_sheet":{"path":"contact_sheet.png","sha256":"…","cells":[{"cell":0,"frame":0}],"stride":15},
 "object_boxes":{"path":"boxes.jsonl","sha256":"…"},"audio":null,"created_at":"…"}
```
`object_boxes` holds, for every frame, the logical bounds of every tagged object and of each **word span** inside text objects, plus a visibility record per item (§7). Bounds are taken after CSS/GSAP transforms are applied, for example from each word's client rects, so they are not just the container box.

Every evidence file (frames, `boxes.jsonl`, contact sheet, validation JSON) carries a recorded SHA-256. The RunResult records the hash of the manifest itself. `foundry verify` recomputes all of these hashes and reports `ERROR` with `reason_code:"EVIDENCE_HASH_MISMATCH"` on any difference. **Full-frame analysis** uses every frame, never only the contact sheet, so single-frame events are caught.

**ValidationResult**
```json
{"schema":"foundry.validation/0.1","render_id":"r_9f2c","validator":"safe_area.v1",
 "kind":"hard_geometry","status":"FAIL",
 "params":{"safe":{"x0":90,"y0":200,"x1":990,"y1":1720}},
 "violations":[{"object":"title_text","frames":{"start":42,"end":270},
   "worst_frame":120,"bbox":[60,880,1032,1010],"overflow_px":{"left":30,"right":42}}]}
```

**PerceptualFinding** (from a reviewer, which is never authoritative for PASS)
```json
{"schema":"foundry.finding/0.1","render_id":"r_9f2c","source":"reviewer:gemini-cli",
 "kind":"ai_perceptual","confidence":0.6,"frames":[120,135],"objects":["title_text"],
 "evidence_refs":["contact_sheet.png#cell8"],"note":"Title clipped at right edge"}
```

**ReviewRequest**
```json
{"schema":"foundry.review_request/0.1","run_id":"…","base_revision_id":"v_a11e","base_render_id":"r_9f2c",
 "attachments":[{"path":"contact_sheet.png","sha256":"…"}],"failures":["validation/safe_area.v1.json"],
 "window":{"start":105,"end":150},"allowed_ops":"repair-allowlist.v1","budget":{"attempt":1,"max":3}}
```

**RepairProposal / ProposedOperation**
```json
{"schema":"foundry.repair_proposal/0.1","base_revision_id":"v_a11e","base_render_id":"r_9f2c",
 "rationale":"Reduce font size and enable wrap to fit safe area",
 "ops":[{"op":"set","target":"objects.title_text.style.fontSize","value":72},
        {"op":"set","target":"objects.title_text.layout.maxWidth","value":860}]}
```

**RunResult**
```json
{"schema":"foundry.run_result/0.1","run_id":"…","status":"PASS","closed_loop":"LIVE",
 "reviewer":{"adapter":"…","vision_transport":"VERIFIED_ATTACHMENT","mock":false},
 "attempts":[{"n":1,"candidate_id":"c_01","render_id":"r_b730","validation":"PASS","regressions":[]}],
 "last_passing":"c_01","budgets_used":{"renders":2,"wall_s":140}}
```
`closed_loop` takes one of these values: `LIVE` | `MOCK` | `BLOCKED` | `UNREVIEWED`. A mock run can never report `LIVE`.

## 6. Deterministic render strategy

- Scene HTML loads GSAP, fonts, and assets **from local package paths only**. Route interception aborts any non-`file:`/local request, and the render fails if one is attempted.
- Build one master `gsap.timeline({paused:true})`. For each integer frame `i`, call `tl.seek(i*den/num, false)`, wait two `requestAnimationFrame` ticks, then screenshot. Disable CSS transitions/animations that sit outside GSAP.
- **Seek must be idempotent.** A test captures frames out of order and repeatedly (for example 200, 10, 200, 135) and compares them byte for byte with the sequential capture. If that turns out impractical, record `NOT_RUN` with the reason.
- Before frame 0, await `document.fonts.ready`, the `load` event for every image/asset, and an explicit `window.__foundryReady` flag. Fail with `ERROR` on timeout; never capture a partial frame.
- **Scene time and randomness are injected.** Scene code gets `foundry.frame`, `foundry.time` (derived from the frame), and `foundry.rng` (a seeded PRNG such as mulberry32, with its seed in the scene). Inside the page, `Math.random` may be replaced with the seeded PRNG.
- Do **not** globally make `Date.now`/`performance.now` throw, because GSAP internals may need a clock. Determinism comes from the paused timeline plus explicit seeks, not from the ticker.
- Scene-authored code and data are statically checked. Wall-clock sources (`Date.now`, `new Date`, `performance.now`), unseeded `Math.random`, and timer-driven animation are rejected (`ERROR`, `reason_code:"FORBIDDEN_OP"`).
- Pin the viewport, deviceScaleFactor, and Chromium launch args in the renderer config, which is part of the hash. Record the browser version, Node version, and ffmpeg version in the manifest.
- **Cache:** if `render_id` already exists and its hashes verify, reuse it, so unchanged renders are not redone. A `--no-cache` flag bypasses the cache and is required for the determinism test.
- Use ffmpeg/ffprobe only to assemble an optional MP4 preview and to probe audio. M0 has no audio, so audio evidence is `NOT_RUN`.
- **Repeat-determinism test:** render twice with `--no-cache` in the pinned environment. The result must be the same `render_id`, different `attempt_id`s, and **identical** hashes for frames, boxes, and contact sheet.
- Any mismatch or `UNKNOWN` is **not** a pass. It reports `BLOCKED` with `reason_code:"NONDETERMINISTIC"`, and overall M0 success cannot be claimed.
- A documented pixel tolerance may become a separate, separately labeled support level later. It never counts as deterministic PASS.

## 7. Validation: hard vs heuristic

- **Hard geometry** checks run before any model call: safe area `x90..990, y200..1720` in logical px, plus off-canvas and min font size. A result is binary and reproducible.
- **Safe-area scope:** the check runs on every frame against each **visible word span's** transformed bounds, not the container box.
- An item counts as visible at a frame when it is displayed, not `visibility:hidden`, has effective (ancestor-multiplied) opacity above `visibility_opacity_threshold` (proposed 0.02), and has bounds that intersect the canvas. Invisible items are excluded. A word that is still at opacity 0 while it starts its fade-and-rise therefore cannot fail the fixture.
- **Entrance vs. accidental clipping:** an annotation `{"type":"offscreen_entrance","object":id,"range":[s,e)}` lets that object sit outside the safe area during that range. Any other visible word outside the safe area is accidental clipping and a `FAIL`.
- The fixture's intended failure comes only from **visible** title words overflowing the safe area while they are fully shown.
- **Required content** (`required_content.v1`, hard): every word of the original required text must stay present, unchanged, and visible inside the safe area for at least its original count of fully visible frames.
- **Heuristics** (labeled `kind:"heuristic"`, maximum status `WARN`) include flash/luma-jump, object collision, and blank frames. Intentional blanks and flashes can be allowed by an annotation `{"type":"intentional_flash","range":[s,e)}`. Heuristics are never universal proofs.
- **AI perceptual** findings are advisory, carry a confidence, and **can never produce semantic PASS.** PASS comes only from deterministic validators run by the core itself.
- **Regression set:** all validators run on the candidate. Any validator that passed on the base and fails on the candidate is a regression, and the candidate is rejected.
- Audio seam assessment requires audio evidence (waveform/RMS around cut frames). If that evidence is missing, the result is `NOT_RUN`, never inferred from visuals.

## 8. Reviewer and CLI capability probe

- The adapter config names a command template supplied by the operator. **Never invent invocations.** During implementation, confirm the real syntax from the installed tool's `--help` or docs and record the evidence in `capabilities.json`.
- Probe fields per provider: `installed`, `version_string` (as reported), `auth_mode` (`subscription|api_key|unknown`), `may_incur_spend` (unknown counts as true, which blocks the call), `text_io`, `model_modality_claimed`, and `cli_image_transport` (`VERIFIED_ATTACHMENT|UNVERIFIED|UNSUPPORTED`), each with `evidence` text.
- **Model modality ≠ CLI transport.** Printing a file path into a prompt, or creating a contact sheet, is not proof that the agent saw it. `VERIFIED_ATTACHMENT` requires a documented attachment mechanism plus a canary test. In that test, an image containing a random token that appears in no text channel is sent, and the agent must return the token.
- If no transport is verified, perceptual review is `BLOCKED` and the run is `UNREVIEWED`. The geometry-only repair loop can still run with a text-only agent that gets the failure JSON, but `closed_loop` is labeled accordingly and never claims the agent saw the images.
- An environment flag `FOUNDRY_VISION=off` forces the disabled-vision path and is used in tests.
- The host (BandAI) grants sandbox and rendering access. This spec does not grant any tools or permissions.

## 9. Repair state machine and guardrails

States: `INIT → RENDERED → VALIDATED{PASS→DONE | FAIL→REVIEW} → PROPOSED → GATED{reject→REVIEW|STOP} → CANDIDATE_APPLIED → RERENDERED → REVALIDATED{PASS&no-regress→DONE | else→REVIEW|STOP}`.

Guardrails:
- **Stale check:** reject if `base_revision_id`/`base_render_id` does not match the current snapshot (`ERROR`, `reason_code:"STALE_BASE"`).
- **Typed allowlist (M0):** only the `set` operation, with these types (bounds are proposed defaults):
  - `style.fontSize`: integer 40–160.
  - `style.letterSpacing`: number −2–10 px.
  - `style.lineHeight`: number 0.9–1.6.
  - `layout.x`, `layout.y`: integers inside the canvas.
  - `layout.maxWidth`: integer 200–900.
  - `layout.align`: exactly `"left"|"center"|"right"`.
  - `layout.wrap`: exactly `true|false`.
  - `timing.in`/`timing.out`: integer frames inside the scene range, with `in < out`.
  - A wrong type gives `ERROR`/`TYPE_INVALID`, and a value outside its range gives `ERROR`/`OUT_OF_BOUNDS`.
- Edits to text content, validators, limits, budgets, tests, renderer, config, or core source are **forbidden** (`ERROR`, `reason_code:"FORBIDDEN_OP"`). Narration is preserved.
- **Intent:** a repair may shrink, reposition, or wrap the offending title. It may not pass by hiding, deleting, zeroing opacity, moving words offscreen, shortening the title's visible duration, or changing text. Opacity, display, and visibility are not on the allowlist. Timing changes that reduce the required visible duration fail `required_content.v1` (`ERROR`/`REQUIRED_CONTENT_LOST`).
- Changes apply only to a **candidate copy** (`runs/<id>/candidates/c_NN/scene.json`). The original fixture is never modified.
- At most **3** attempts. **Oscillation stop:** if a candidate's source hash equals any earlier candidate, or a property flips back to an earlier value, the loop stops with `BLOCKED`, `reason_code:"OSCILLATION"`.
- Checkpoint after each state. Retain the **last passing** candidate and never overwrite it.
- **Retry context is small:** the failure JSON, the contact sheet for the failing window (±15 frames), the allowlist, and the prior proposals. Never send the whole project.

## 10. Budget knobs (proposed defaults, in config)

`max_attempts=3`, `max_renders_per_run=5`, `render_timeout_s=120`, `asset_ready_timeout_s=20`, `reviewer_timeout_s=180`, `run_wall_clock_s=900`, `max_output_mb=500`, `contact_sheet_stride=15`, `review_window_pad_frames=15`, `review_scale=0.5`, `allow_spend=false`. Also `visibility_opacity_threshold=0.02`. When a budget is exceeded the result is `BLOCKED`, `reason_code:"BUDGET_EXHAUSTED"`, never a silent continue.

## 11. M0 tonight: ordered milestones

1. **Contracts + hashing.** Schemas, types, canonical hash. *Pass:* schema round-trip tests and stable-hash tests.
2. **Fixture.** A synthetic 9 s (270-frame) scene: background, two shapes, a title with whole-word fade+small-rise, and a **deliberately overflowing** title (too large / no wrap). *Pass:* loads offline, seeded.
3. **Renderer.** Frame-seek capture, readiness gating, network block, cache. *Pass:* two `--no-cache` renders give the same `render_id` and identical frame, boxes, and contact-sheet hashes, and the seek-idempotency test passes. Anything else is `BLOCKED`/`NONDETERMINISTIC`: report it as a blocker, and M0 is not successful.
4. **Evidence + validators.** Manifest, contact sheet with stable cell→frame map, per-frame boxes, safe-area check. *Pass:* the fixture yields safe-area `FAIL` citing exact frames, object, word, and bbox, coming only from visible words. Invisible pre-entrance frames produce no violation.
5. **Capability probe.** `capabilities.json` for the configured CLIs, with evidence. *Pass:* the probe runs; unknowns are reported honestly.
6. **Repair loop with mock reviewer.** *Pass:* mock proposal → candidate → PASS, labeled `closed_loop:"MOCK"`.
7. **Negative tests** (§12). *Pass:* all are rejected with the correct codes.
8. **Live loop** with one subscription CLI whose image transport is `VERIFIED_ATTACHMENT`. *Pass:* the agent receives the actual contact sheet plus failure JSON, the proposal is applied to the candidate, and an independent `foundry verify` gives PASS with no regressions and no human edits.

**Stop point:** stop after milestone 8, or at milestone 7 with `BLOCKED` if no verified transport exists. Do not start adapters, recipes, or UI.

## 12. Required tests

- Stale revision/render base, rejected.
- Forbidden edit (validator param, budget, text content, opacity/visibility, file outside the candidate), rejected.
- Wrong type (string fontSize, `"yes"` for wrap, unknown align) and out-of-bounds value, rejected.
- Cheat attempts: `timing.in >= timing.out`, a title shortened below its required visible duration, or the title moved offscreen, all rejected.
- Visibility: an opacity-0 word outside the safe area is ignored. A transformed visible word outside it fails even when its container box is inside. An annotated offscreen entrance passes, and the same position without the annotation fails.
- Oscillation, which must stop.
- Budget exhaustion, which must stop.
- Disabled vision gives `BLOCKED/UNREVIEWED`, never `LIVE`.
- Mock reviewer can never yield `closed_loop:"LIVE"`.
- Identity and immutability: an identical `--no-cache` rerender gives the same `render_id` and a new `attempt_id`, and a changed source or config gives a new `render_id`. Earlier files stay byte-unchanged. `foundry verify` detects a tampered frame, `boxes.jsonl`, or contact sheet (`EVIDENCE_HASH_MISMATCH`).
- Determinism and seek: out-of-order and repeated seeks match the sequential capture. A static check rejects wall-clock use in the scene.
- Half-open range/quantization edge cases.
- Coordinate transform round-trip.
- Single-frame event detected by the full-frame scan but absent from the contact-sheet stride.
- Remote URL in the scene, so render fails.

## 13. Acceptance status levels

Each capability is reported as **SPECIFIED** (in this doc), **TESTED** (automated tests pass, mocks allowed), or **LIVE-VERIFIED** (real CLI, real attachment, independent verify). Today everything is SPECIFIED only.

## 14. Declared adapters (interfaces only; do not implement)

- **Wayframe, Motion Suite, CutLab**: declare TypeScript interfaces (`RendererAdapter`, `SnapshotSource`, `OperationSink`) with `status:"UNVERIFIED"`. Any real integration needs live contract verification against the actual tool. No tools, endpoints, or invocations may be invented.
- **Motion Suite**: may construct inside a scoped scene. Its later tests cover parallax, camera, tracking, ghosting, and 2.5D temporal features. The core must not rebuild these.
- **CutLab**: the canonical timeline is the source of truth. Typed visual/audio/timing evidence stays separate from the semantic layer. The flow is evidence in, proposed ops out, through CutLab's existing lowering/verification and the user's candidate audition/commit. **No direct timeline mutation.**
- **Snapshot (future):** selected occurrence IDs, revision, review range, word timestamps, active layers, cut/caption bounds, protected occlusions, annotations, validator results.

## 15. Later: creative quality

M0 proves **plumbing, not artistic quality.** The next test should be a perceptual issue that geometry does not detect, for example an awkward easing rhythm or text that is legible but fights the background. That test needs a verified vision reviewer and a human-labeled expectation.

Recipe families come later: collage build/disassemble, tearaway/cutout/rip/serrated-edge, magazine editorial, and Vox documentary. **None is bundled.** No reference scene or recipe pack is included.

**Future dependencies (not M0 blockers):** BandAI repo integration, the user's existing assets and recipes, a reference scene, Wayframe/Motion Suite/CutLab live contracts, audio evidence, and verified vision transports per CLI.
