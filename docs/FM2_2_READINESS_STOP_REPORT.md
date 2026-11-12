# FM2.2 readiness diagnostic — stopped at decoded-pixel gate

Raphael’s new45-minute protocol terminates at step1: the already-completed decoded comparison fails exact golden equality. Baseline service was stopped at15:14:55UTC; its scheduled follow-up was disabled. No new browser probes, artificial-load check, begin-frame suite, capture switch or acceptance run was performed for this decision. Nothing is pushed.

## Counts at stop

| Completed condition | Suites | Duplicate pairs | Within-pair mismatches |
|---|---:|---:|---:|
|Baseline and baseline continuation|7|6,020|97|
|Existing-flag repeat, not a new intervention|1|860|13|
|Total completed diagnostics|8|6,880|110|

All eight original test suites passed98/98, but their diagnostic duplicate pairs did not meet zero tolerance. These are NOT acceptance passes. Candidate1 was already enabled and does not close the race. A stopped partial continuation trial retained426 additional pairs with8 mismatches; these are excluded from completed-suite totals. Another interrupted old trial had no completed pairs. Raw records are retained; stopped-summary.json separates completed and partial observations.

## Conditional work not entered

Step1 fails:121,325 decoded pixels differ, maximum channel delta222, in whole shape regions. Thus no harness switch or five-run artificial-load test is allowed by the new protocol. No re-pin or golden change.

Raphael’s new acceptance supersedes the earlier60-suite requirement: **10 consecutive clean full suites, then five fresh uncached repeats and98/98; any failure stops it.** That gate has not been reached or started. No retries, longer timeouts, skips or tolerance. Nothing may be pushed without Raphael’s approval. Run14 remains open/unverified; F remains THREATENED.

## Decoded diff

121,325 differing pixels;363,817 differing channels; maximum absolute delta222. Difference bounding box inclusive[70,179,484,806]. This affects whole shape regions and their edges, not just AA edges or PNG encoding. PNG filters were decoded independently with the existing Python PNG decoder; RGB was normalized to RGBA with opaque alpha for comparison.

| Property | Retained frame0 | Begin-frame probe |
|---|---|---|
|Output size|540×960|540×960|
|PNG IHDR|8-bit RGB, color type2, noninterlaced|Same|
|PNG bytes|10,150|9,718|
|Chunks|IHDR;IDAT4096,4096,1859,6;IEND|IHDR;IDAT4096,4096,1427,6;IEND|
|Explicit ICC/sRGB/gamma chunks|None|None|
|Red interior pixel bbox|[70,179,229,338]|[140,358,459,676]|
|Mint interior pixel bbox|[325,647,484,805]|No mint-colored pixels|

Reference SHA274c8fad54c43ec3e448ca738fb507aabba0ae6998a665fd9a3f5c3d476c7fe6; probe SHA0e70e180df2de079cbb1dfa019df8ac77f35ee322e08cfc759b0c0295af1a2c1. Compression payload sizes differ, but decoded differences prove this is not encoding-only.

## Explanation supported by the measurements

The browser reports devicePixelRatio0.5 and CSS viewport1080×1920. Shape2 DOM bounds remainx650,y1293,width320,height320,frame0. The retained PNG maps CSS coordinates/dimensions by0.5. The begin-frame PNG instead contains red interior at1:1 CSS coordinates and approximately320px diameter, twice the retained160px diameter. Mint begins at CSSx650 and is entirely outside a540px-wide1:1 crop. Thus Emulation.setVisibleSize(540,960) sized/cropped the capture surface without reproducing legacy screenshot's downscaled scene mapping. It did not achieve equivalent capture scaling despite the same output IHDR and reported DPR.

The original begin-frame default surface was1080×1920; forcing visible size corrected dimensions but not pixel mapping. Both stages are separate capability probes, excluded from suite counts. This localizes the compatibility failure to capture scaling/cropping; it does not establish an underlying color-management difference. Background and red interior RGB values are identical where those colors occur.

## Seek delivery and limits

The probe calls the original seekFrame(0), issues exactly two BeginFrames to service the two rAF callbacks, awaits that seek promise, sets visible size, then requests a third BeginFrame with PNG screenshot. This is a fixed documented count, not capture-until-stable. No sleeps, retries or longer timeouts. DOM state and seek promise completion were measured. A separately correlated compositor commit was not proven; therefore the three-frame probe is not yet a validated commit-readiness implementation. No missing-frame explanation is needed to explain the measured2× mapping/crop, and none is claimed.

## Reproducer and next action

The first normal full suite produced23 within-pair differences across860 M0 pairs while its original assertions passed98/98. The first separately labeled existing-flag repeat produced13/860,also98/98. Candidate1 was already enabled and has not closed the race. Its eight-suite condition was not completed before the between-suite probe pause. Full raw records remain in runs/fm2-2/readiness-investigation/; interrupted next-trial evidence is retained and not counted. Baseline-only continuation was separately labeled and has now stopped at Raphael’s direction.

No begin-frame8-suite claim and no golden/pin change. No raster-lock work has been performed. Next decision concerns whether to investigate a transport that preserves the0.5 scene-to-output mapping; do not implement or re-pin on the strength of this probe.

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

