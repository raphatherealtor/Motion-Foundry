# FM2.2 color — BLOCKED: serial acceptance failed, not cleared to land

Raphael approved a replacement banding contract and a zero-tolerance capture investigation on2026-11-11. Both banding and capture gates must pass before landing/pushing. No merge, default switch or FM2.3 work is authorized by this report.

## Old banding contract and why it was wrong

The old contract capped raw adjacent-run steps at1 LSB and each constant run at1.5× a theoretical slope-derived length. It rejected both the prescribed ±1-LSB triangular PCG dither and the intended sRGB OETF slope itself: the horizontal ramp has an intended3.054-LSB step near black at1080px. Historical measurements: docs/fm2_2/stress/banding-results.json. The old limits are removed, not widened silently.

## Approved replacement contract

- Float64 CPU oracle applies the same wrapping-integer PCG3d dither, seed/frame and output quantization. GPU error≤1 LSB per channel, zero channels≥2: hard gate.
- Per-pixel quantization residual magnitude≤1.5 LSB. Centered sampling noise uses |mean|≤kσ/√64, k=Φ⁻¹(1−0.001/(2C)), measured per-pixel σ and tested-column count C. GPU column means must match the oracle within0.02 LSB.
- Averaged64-line profiles: step≤oracle step+0.25 LSB and monotonic wherever the oracle is monotonic.
- GPU run histograms compared with the oracle-with-dither histograms; no fixed per-run cap.
- Dither-on spectral peaks<+6dB; dither-off negative control must FAIL. Accepting the negative control is ERROR.

Implementation: src/fm2/color/oracle.ts and banding.ts; exact PCG uint wrapping is independent of the GLSL shader. AllRGB channels in all four regions are measured. The continuous quantization reference is the dithered float64 code immediately before rounding; undithered-signal residuals are retained separately. Profile comparisons use the quantized dithered oracle. Histogram equality is currently strict; a near-match tolerance was not invented.

## Replacement-contract measurements so far

Analysis of the saved, deterministic card outputs (a fresh15-host rerun is still required):

| Measurement | Static | Temporal |
|---|---:|---:|
| Max GPU/oracle byte error |1|1|
| Channels with error≥2 |0|0|
| Max per-pixel quantization residual LSB |0.500041|0.500033|
| Max64-line column mean residual LSB |0.155061|0.140169|
| CPU oracle's own max column mean |0.155061|0.140169|
| Max profile step excess LSB |0.015625|0.015625|
| Monotonicity violations |0|0|
| Max measured spectral peak dB |1.597|1.356|

The signed column residuals have both signs in every dither-on region/channel, with aggregate means near0 (largest absolute region mean0.002674 LSB). Global-mean Z magnitudes stay below2.44. This is centered sampling noise, not a consistently signed floor/rounding or noise-centering defect; neither GPU nor oracle quantizer was changed.

Measured σ remains static0.287146–0.289266 and temporal0.287525–0.289226 LSB. The family includes all4 regions ×3 channels ×1080 columns per mode: C=12,960, k=5.3736454844. Static's formerly failing horizontal-blue column570 has z=4.3072735413; temporal's worst z=3.8874949062. Both are below either family threshold: **static and temporal column-statistics PASS**, with zero exceedances. No noise pattern or quantizer change is justified. GPU/oracle column differences≤0.015625 LSB also pass0.02. Details: docs/fm2_2/familywise/banding-results.json.

The oracle byte match, per-pixel residual, profile and spectral checks pass on saved outputs. Strict run-histogram equality still detects a few changed bins at permitted1-LSB boundaries (L1 deltas3–8); no near-match tolerance has been applied. A concrete0.03% normalized histogram L1 proposal is awaiting review. Off still FAILS. Fresh15-host rerun remains pending. Full σ/sign/bound details: docs/fm2_2/statistical/banding-results.json.

## M0 capture investigation — zero tolerance

Baseline matrix COMPLETE, same compiled render/scene/test code, Chromium153, dependencies, fonts and fixture:

| Revision/condition | Results |
|---|---|
| M1b52aebd, isolated |20/20 PASS|
| FM2.1 8f64cb1, isolated |20/20 PASS|
| FM2.2baseline42c476c, isolated |20/20 PASS|
| Same FM2.2baseline, full suite |19/20 PASS;1 capture failure: **5% observed failure rate**|

Run6 failed at frame81:3 changed channels,maxΔ5; all object-box/source/config hashes match. Original95/121 failure evidence is retained. Passing isolated runs do not rule out an intermittent race. Setup-invalid worktree attempts were excluded and retained separately. CPU-only oracle/unit analysis overlapped part of the suite phase; its precise overlap with frame81 is unknown. No competing GPU/browser probe was launched.

Readiness diagnostic: three standalone launches, triple captures at81/95/121. All fonts loaded, no image assets, frame/time and GSAP ticker stable; pixels match within each triple and across launches. Layout-reading instrumentation may flush work, so this does not replace the uninstrumented matrix or prove a Chromium-internal cause.

Resource audit finds fresh browsers/profiles, unique artifact directories and port0 M1 servers. The isolated shared resource is host CPU scheduling/software-rasterization capacity accessed by concurrent browser-test workers. After freezing all80 baseline results, the sole candidate change is npm test's **--test-concurrency=1**. Renderer, browser flags, schemas, test bodies and tolerances are unchanged. Preliminary five uncached repeat tests and98/98 passed but were not counted toward acceptance. The fresh60-suite campaign **stopped at run14**:13 suites passed; run14 had71/98 passing and27 failures from one shared negative-test setup hook. The mock repair loop returned ERROR, reason_code `page.screenshot`, after24 saved frames (last complete:23), before any manifest. The separate M0 repeat test still passed and its cross-cohort pixel/box/sheet fingerprints match. All frozen source/config identities match.

This is not proof of a pixel-race recurrence, but it fails the user's ANY-full-suite-failure acceptance rule. The cohort is preserved as FAILED and is **not restarted**. The final five repeats and final98/98 were not run. Serial isolation cannot yet be accepted as a sufficient reliability fix. Existing exception truncation discarded the screenshot's full error, so timeout versus crash versus another capture exception is not established.

One focused, instrumented mock-loop diagnostic passed; it does not clear the cohort. A bounded series of at most20 further focused diagnostics now records full screenshot errors, stacks, paths, durations, crash events and error-time cgroup metrics, stopping on the first failure. This is root-cause investigation, not acceptance or retry-until-PASS. Production renderer, tests, schemas, timeouts and tolerances remain unchanged.

Evidence: docs/fm2_2/capture-matrix/{m1-isolated,fm21-isolated,fm22-isolated,full-suite,readiness}-results.json, suite-failure-05/, resource-audit.md. Serial results accumulate at runs/fm2-2/serial-validation/.

## Color foundation retained

Existing five-launch ×three-host evidence remains exact under Chromium153.0.8010.12 SwiftShader: all256 opaque/partial-alpha code round trips in16F/32F, grade witness[156,156,156,255], checker linear0.5→188 versus sRGB128, additive linear1.5 before tone mapping, ±2EV round trips0 half-float ULP, and monotonic temperature R/B sweep. Previous product checks:729/729, type-check PASS,52/52 legacy goldens unchanged. Revised Foundry color unit checks:12/12 PASS. Final full suite remains pending.

Revised15-host browser rerun is pending capture acceptance; no product shader changed.

## Compat invariants — renderer checklist

This is distinct from Raphael's preserve list. Reference: COMPAT_INVARIANTS.md.

| Invariant group | Current evidence scope |
|---|---|
| Draw order, opacity, blend | Ordered capture unchanged; prior exact overlap gate and compat shader hash retained. |
| Isolation, groups, clipping | Legacy boundaries/clip replay unchanged; groups unisolated with inherited opacity and ignored group blend. |
| Grade, timing, identity | Exposure→temperature→vignette→tone and rational FPS retained; color identity integration deferred. |
| Frozen contracts, default/fallback | M0/M1 schemas/test bodies unchanged. Legacy default; GPU opt-in. |
| Hosts, goldens, capture | Prior15-host parity,52 goldens and FM2.1 570/7/0 diff pins retained. New GPU rerun pending; serial capture acceptance FAILED. |

## Raphael's real preserve A–M check

| Principle | Current preservation check |
|---|---|
| A — Directed temporal anchors | Integer-frame/rational timing unchanged; no color-driven retiming. |
| B — Editable causality | Explicit color settings and editable project source retained. |
| C — Gradient of agency | User scope and gate decisions govern all changes. |
| D — Perceptual-evidence loop (advisory) | Review evidence retained; production heuristics WARN, explicit lab contracts may FAIL. |
| E — Scoped AI authority | Allowlists/edit boundaries retained; no reviewer project edits here. |
| F — Procedural deterministic motion | THREATENED by suite-only capture mismatch; zero tolerance, isolation validation pending. |
| G — Advanced temporal geometry | Untouched; no new geometry capability claimed. |
| H — One lighting model | Product lighting/grade authoritative; no replacement lit model. |
| I — Recipes as editable executable knowledge | Frozen M1 recipe source retained; no flattened substitutes. |
| J — Model neutrality | Color/capture validation provider-independent. |
| K — External-agent operation | Existing CLI/API operation preserved; no new integration. |
| L — One canonical scene/render state | Project remains canonical; later app integration must bind color settings into render identity. |
| M — Preserved roadmap | FM2.3–FM2.6 deferred; FM2.2 lands only after both gates pass. |

Full scope and limitations: docs/PRESERVE_A_M.md. This is separate from the renderer checklist above.

Acceptance protocol and cause scope: docs/fm2_2/capture-matrix/serial-acceptance-protocol.md. Both capture and banding gates remain required for push.
