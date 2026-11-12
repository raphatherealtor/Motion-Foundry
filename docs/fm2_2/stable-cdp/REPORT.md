# FM2.2 stable-scale CDP capture — stopped at exact-identity gate

Harness-only diagnostic,2026-11-12. No renderer/scene/assertion/golden edit, extra flag, sleep, retry, timeout extension, adoption, acceptance restart or push. The prior baseline is inactive:8completed full suites,6,880duplicate pairs,110within-pair differences;426partial pairs/8differences excluded from completed counts. The earlier separate frame210 investigation is not pooled here.

## Scale-changing path, one line

Playwright1.48.2 Chromium crPage.takeScreenshot computes and sends a per-capture clip.scale with Page.captureScreenshot; this screenshot clip/emulation path, combined with the0.5DPR viewport, is the scale-changing path implicated by the accepted trace finding.

Source evidence: node_modules/playwright-core/lib/server/chromium/crPage.js:234–265 calls Page.getLayoutMetrics, forms clip using visualViewport.scale, then sends captureScreenshot with clip. The default screenshot mode is device; it does not explicitly setDeviceMetricsOverride in takeScreenshot. Initial viewport setup separately sets DSF and browser window size in _updateViewport:828–892. No claim is made that application motion changed scale.

## Candidate transport and one-time setup

Every candidate capture is exactly Page.captureScreenshot({format:'png',fromSurface:true,captureBeyondViewport:false}), with no clip or scale field. Existing browser args are retained, including num-raster-threads1 and disable-partial-raster. At page creation, before scene content, Browser.setWindowBounds sets540×960 once and Emulation.setDeviceMetricsOverride sets CSS1080×1920,DSF0.5,screen1080×1920,mobilefalse,scale0.5 once. These settings are never changed per capture. The Emulation scale is an initialization value, not a screenshot scale option.

Setup probes found that leaving Playwright's original1080×1920 window yields a1080×1920 unscaled surface; setting only the window540×960 crops1:1 CSS content. The single initialization metrics scale0.5 restores the required scene mapping and540×960 PNG size. Probe outputs are separate from pass/fail counts.

## Step3: one traced session, frames0–210

211frames captured. All633 root-layer snapshots have ideal contents scale0.5, geometry contents scale0.5 and raster contents scale[0.5,0.5]. Every recorded tiling is content_scale0.5 (633tiling entries); no alternate scale-1 tiling or scale-1 fallback is recorded. No scale flip is observed. The trace meets the requested scale-stability condition for this session; it is not an untraced stability/load test.

Raw trace, extracted root snapshots and per-frame PNGs are retained at runs/fm2-2/stable-cdp/traced/. No additional traced session was run.

## Step4: untraced exact-identity gate FAILED at frame0

The untraced fixed-setup frame0 PNG is byte-identical to traced frame0 (SHA7f2e0bf55d65d96474868e7a22ebf70b35ddb681181c194222c8517138b3ee09), but differs from the retained SHA274c8fad54c43ec3e448ca738fb507aabba0ae6998a665fd9a3f5c3d476c7fe6. Both are540×960,8-bit RGB PNGs. Independently decoded values show4changed pixels/11channels,maxDelta5, bbox[333,763,476,763]. This is real AA-edge coverage, not encoding-only. Whole circle placement, scale and interior colors now agree; the mismatch is on the mint circle's lower perimeter at the previously identified tile row.

|Output pixel|Retained RGB|Stable-CDP RGB|Signed candidate−retained|
|---|---|---|---|
|333,763|17,22,35|19,25,37|+2,+3,+2|
|334,763|103,170,150|100,165,147|−3,−5,−3|
|475,763|103,170,151|100,166,147|−3,−4,−4|
|476,763|17,22,35|17,21,34|0,−1,−1|

The211traced frame hashes all differ from retained references, but that is not an untraced golden validation and no aggregate decoded-pixel conclusion is claimed for those frames. The exact untraced gate stops at the first frame0difference. The remaining untraced frames, M1 proof, chart_explainer f90 and opacity comparisons were not run after this stop. None passed or was waived; all committed references remain unchanged. The original viewport/DPR surface-crop error from BeginFrame is not present in this stable-scale candidate; this failure is the smaller AA-edge mismatch.

## Stop and limits

No artificial CPU-load runs were started: both scale stability and exact identity were prerequisites, and identity failed. No acceptance was started. Latest conditional acceptance remains10clean consecutive full suites then5freshuncached+98/98; no push without approval. The0.5stable-scale capture fixes the observed scale flip in one traced session but is NOT accepted as a parity-preserving fix. No retry, tolerance or re-pin was introduced. Run14 remains open/unverified.

The observed edge change is consistent with the accepted scale/fallback explanation; the trace shows the candidate uses only0.5tiling, while previous evidence includes scale-1 fallback. It does not prove that every retained frame has a particular fallback history. Further capture changes need a new decision; sampling has stopped.

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

