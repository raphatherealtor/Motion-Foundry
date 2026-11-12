# FM2.2 narrow re-pin check — STOPPED, no re-pins

Raphael approved direct CDP capture and a narrow re-pin bound of maxDelta6, independently certified AA edges and scale-1 tile boundaries ±1output pixel. The candidate violates that bound at frame2. All capture/test work has stopped. No pins, committed goldens, renderer sources or production capture path have been changed; no stress runs, acceptance restart or push. This stopped within the30-minute box.

## Fresh-browser identity

M0 frames0–210 were rendered untraced in two separate fresh Chromium153 browsers with direct Page.captureScreenshot({format:'png',fromSurface:true,captureBeyondViewport:false}), no clip/scale per capture. Both complete211-frame outputs are byte-identical by SHA256; zero frame-hash differences. Setup is the previously verified one-time540×960window plus CSS1080×1920/DSF0.5/Emulation scale0.5, with unchanged renderer args and seeks.

The M1 proof/chart_explainer f90/opacity two-browser runner did not return an identity verdict within its120-second command budget. Its bundle preparation warnings are retained. No successful identity/parity claim is made for those suites, and it was not retried or given a longer timeout. The lingering runner/browser descendants were explicitly terminated. This incomplete check independently leaves step1 unfinished; it is not evidence of product nondeterminism.

## First disallowed pixel

|Frame|Changed pixels|Changed channels|Max delta|Rule result|Re-pinned|
|---|---:|---:|---:|---|---|
|0|4|11|5|Pixel class/boundary/delta eligible|No|
|1|3|9|4|Pixel class/boundary/delta eligible|No|
|2|4|11|7|FAIL maxDelta6 bound|No|

Frame2 pixel(230,255): retained RGB[23,22,34], candidate RGB[30,24,36], signed delta[+7,+2,+2]. It is on the red circle AA perimeter and output tile row255.5, but red-channel delta7 exceeds the approved6. This alone requires stopping. The other frame2 differences are at(333,763),(334,763),(475,763), max deltas2,4,1 respectively.

Boundary classification uses pixel centers against255.5/509.5/763.5 rows/columns with ±1pixel. AA classification is independent of observed deltas: a unit output pixel square must intersect the circle boundary using the captured exact shape bounds (nearest corner/edge distance < radius < farthest corner distance). This does not classify text AA by guessing; any uncertified changed pixel fails closed. All changed pixels in frames0–2 satisfy the circle-edge/boundary predicates; frame2 fails solely on delta7. Classification stops there; later frames were not classified for re-pin eligibility. No eligible frame was partially re-pinned ahead of the complete gates.

## Unreached gates and retained evidence

FM2.1 GPU pins were not re-pinned or declared unchanged: their re-measurement gate has not completed. No3-run artificial-load test was started. The conditional10clean full suites→5uncached repeats→98/98 acceptance did not start. Any future push still requires Raphael's approval. Run14 remains open/unverified. F stays THREATENED.

Evidence: m0-identity.json; classification.json; first-disallowed-pixels.json with all four changed frame2 pixels; evidence/m0-a-captures.json and m0-b-captures.json with211hashes and bounds each; both frame2 candidate PNGs and retained reference PNG. Diagnostic sources are supplied for reproduction, not as an adopted relaxation. No tolerance was added to equality checks. No recommendation to widen the delta bound is implied.

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

