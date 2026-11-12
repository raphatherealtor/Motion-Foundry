# FM2.2 frame210 bounded diagnostic report

2026-11-12. Sampling stopped within the fixed09:37:56UTC cutoff. All three diagnostic services are inactive; the final driver reports TIMEBOX_STOP. FM2.2 remains blocked. No fix, adopted flag, acceptance restart or push.

## Classification

**Capture/compositor timing established at the unchanged-scene screenshot boundary; exact Chromium mechanism and load causality remain unverified.** In the first full diagnostic suite, an untraced render.test.js session produced different back-to-back frame210 screenshots with no seek or scene mutation between them. The hashes are exactly the two hashes from failed acceptance suite13, not a new unrelated variation.

- First:042a37ad916bf10d3b54de7b7271c8fd8b6e6b7018a385c6613f20a6d8e79eac
- Second:c65682cd0bead5089f35fbf5bd319360d5b9592a649df8f8947667403eb3709f

This rules out the proposed signature of a fixed image per browser launch. It does not prove that raster tasks are deterministic internally: late raster completion or scale/tile selection can participate in compositor timing.

## Exact pixels and timing

540×960 output:2 changed pixels,6 channels,max absolute delta6. Both pixels sit on mint shape2's lower circle perimeter, not a whole region or text.

| Output coordinate | Previously failing image | Other image | Absolute RGB delta |
|---|---|---|---|
|322,763|71,113,106|73,119,111|2,6,5|
|464,763|37,57,62|40,62,65|3,5,3|

The decisive diagnostic pair occurred in reverse image order. Pair start07:46:41.205UTC, first completion07:46:41.286, second completion07:46:41.350. Monotonic total145.632407ms; first81.222218ms, second64.410189ms. Load averages[38.17,46.77,44.40]. This load reading alone is not causal evidence. Captures preserve original options except the second output filename. No extra seek, DOM mutation, sleep or readiness retry intervened.

## Completed sampling, not acceptance

| Condition | Completed runs | Frame210 pairs | Within-pair differences | Full-suite failures |
|---|---:|---:|---:|---:|
|Initial full suites, one separately traced session|2|8|1|0|
|Full-suite continuation before scale instrumentation|2|8|0|0|
|Stripped M0 frames0–210, no trace|20|20|0|Not a full suite|
|Stripped M0 with scale trace|3|3|0|Not a full suite|
|Full suites with scale trace per M0 pair|23|92|0|3|

Totals:27 completed full suites,23 stripped runs. Full suites contain three canonical-scene pairs and one repaired-mock-scene pair apiece:81 canonical pairs and27 repaired pairs. The repaired image hashc700ca6b… belongs to a different scene and is not a canonical mismatch. Stripped runs use only the canonical scene.

Three scale-instrumented suites failed exact M0 repeat equality at other frames: index9/frame209, index12/frame198,index18/frame0. Each had97/98 tests passing, no skips. All raw assertion logs are retained. Matching frame210 pairs do not make these suites pass. The first diagnostic suite's extra second screenshot differed even though its original test evidence passed.

Interrupted next-trial directories created at diagnostic mode switches are retained but excluded from completed-run counts. The final prospective full-scale/index23 directory has no completed trial. The original stopped acceptance cohorts and their runs never count here.

The stripped pilot did not reproduce, so it was not used for flag-isolation claims. Its clean samples do not prove background load causality. Tracing changes timing; traced and untraced counts must not be pooled as evidence of a fix.

## Raster scale comparison

All95 completed scale-instrumented pairs have nonempty root-scroller snapshots and zero trace errors. Stripped snapshots:9 at[0.5,0.5],12 at[1,1]. Full-suite snapshots:279 at[0.5,0.5],354 at[1,1]. These are repeated snapshots, not independent runs. Both scales occur in both modes despite matching pairs; scale changes alone are insufficient to explain failure. The decisive mismatching session was untraced, so its instantaneous scale is unknown. No mismatch-versus-scale causal correlation can be calculated from the traced sample.

Matching traced full-pair one-minute load spans22.56–53.31, including values above the decisive pair's38.17. Stripped traced load spans27.08–31.72. This observational comparison does not identify a load threshold or shared-resource cause.

## Tile check and flag limits

The cc/viz trace contains root-scroller tile geometry with row origins0,511,1019,1527 at geometry scale1 and screen transform0.5. Logical tile edge1527 maps to output763.5, exactly the center of differing row763. Other snapshots show row origins0,255,509,763,… and different raster scales. This is actual tile geometry, not an inference from proximity to768. The trace is from a different session than the mismatch; alignment supports a tile/scale hypothesis but does not prove its mechanism.

| Proposed flag | Isolated samples completed | Conclusion |
|---|---:|---|
|--disable-gpu-rasterization|0/40|Untested; no elimination claim|
|--disable-partial-raster|0/40 as separate condition|Already enabled in every baseline; not a new intervention|
|--disable-zero-copy|0/40|Untested; no elimination claim|

--num-raster-threads=1 was retained. No flag was adopted. The prescribed160 full suites cannot fit the two-hour bound at roughly four minutes each. Sequential sampling, the nonreproducing stripped pilot and the later per-sample scale request consumed the available time; the flag phases were not reached. This diagnostic did not satisfy the requested40-run baseline or any40-run flag condition.

## Run14 and next decision

Run14 remains an unverified, unreproduced screenshot API exception. Its original full exception was discarded; the new same-frame pixel mismatch does not establish that they share a mechanism. No run14-type screenshot exception recurred in this bounded campaign.

Recommendation for Raphael's next decision: approve a narrowly scoped investigation of a confirmed compositor frame/commit readiness signal, as proposed in frame210/readiness-proposal.md and f19e3ae. Its availability must first be verified in pinned Chromium153. An unrelated WebGL fence is not sufficient for this DOM renderer, and two rAF callbacks already exist. No readiness fix is implemented. No retries, longer timeout, skip or pixel tolerance is proposed. M0 equality stays exact.

## Compat invariants

| Invariant | Diagnostic preservation |
|---|---|
|Draw order/opacity/blend|Production renderer untouched|
|Groups/isolation/clip semantics|Untouched; no new flattening|
|Timing/settings|Original scene and integer frame seeks retained; only authorized diagnostic captures/tracing added|
|Frozen contracts/default|Schemas/assertions unchanged; legacy default and GPU opt-in retained|
|Parity/determinism|FM2.1 pins unchanged; exact M0 equality remains failing, not waived|

## Raphael's separate A–M preserve check

| Principle | Check |
|---|---|
|A Directed temporal anchors|No timing edits|
|B Editable causality|Editable source retained|
|C Gradient of agency|User hold and cutoff respected|
|D Perceptual-evidence loop, advisory|Evidence reported; no heuristic override|
|E Scoped AI authority|Diagnostic scope only|
|F Procedural deterministic motion|THREATENED; exact-repeat failures retained|
|G Advanced temporal geometry|Untouched|
|H One lighting model|Untouched|
|I Recipes as editable executable knowledge|No recipe edits|
|J Model neutrality|Provider-independent diagnostics|
|K External-agent operation|Existing operation preserved|
|L One canonical scene/render state|Canonical and repaired scene results separated|
|M Preserved roadmap|No unauthorized implementation or next milestone|

## Evidence and reproduction scope

Diagnostic scripts and protocol:docs/fm2_2/frame210/bounded/. Exact initial byte diff:docs/fm2_2/frame210/pixel-diff.json. Completed phase records, decisive PNG pair, mismatch event log and three failure logs are checkpointed in bounded/evidence/. retained-file-index.json records SHA256 and size for254 raw trace/event/result log files. The downloadable ZIP includes those raw files, including per-pair cc/viz traces, and the diagnostic scripts. Intermediate frames remain in the runtime directories; they are not all included in the ZIP. No fresh render/probe was run while assembling this report.

All diagnostic services are inactive. Sampling is over; no further sampling is scheduled. FM2.2 has not landed and nothing was pushed.
