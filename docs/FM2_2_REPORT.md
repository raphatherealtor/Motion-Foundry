# FM2.2 color — IN PROGRESS, not cleared to land

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

The previous full suite had97/98 passing tests; frozen M0 uncached frame95 and121 hashes differed. Each frame had9 differing channels, max deltas5 and8. Both configs used Chromium153, single-thread raster and disabled PaintHolding. The earlier95/95 pass did not clear this intermittent failure.

The requested matrix is sequential, using detached source snapshots and the same compiled render/scene/test harness, browser153, dependencies, fonts and fixture:

1. M1b52aebd:20 isolated M0 repeat tests.
2. FM2.1 8f64cb1:20 isolated M0 repeat tests.
3. FM2.2 baseline42c476c:20 isolated M0 repeat tests.
4. The same FM2.2 baseline:20 full-suite runs, recording M0 separately from unrelated failures.

Completed comparison: M1b52aebd isolated **20/20 PASS**, no failures observed. This does not rule out a pre-existing intermittent race or identify FM2.2 as the cause. FM2.1 8f64cb1 also completed **20/20 isolated PASS**, with no failures observed. FM2.2 isolated also passed20/20. Full-suite comparisons are underway; run6 reproduced a frame81 capture mismatch with the same harness. That frame differs in3 channels with maxΔ5; object-box hashes and source/config hashes match. Finish all20 before changing isolation. Evidence: docs/fm2_2/capture-matrix/{m1,fm21}-isolated-results.json.

Results are accumulated under runs/fm2-2/capture-matrix/. Initial missing-browser worktree setup failures were excluded and retained under capture-matrix-setup-invalid/. No capture or source change is part of these baseline comparisons. New Foundry color unit tests are CPU-only; standalone GPU stress probes are not implicitly part of npm test. Other GPU probes remain idle during isolated comparisons.

Readiness inspection is queued after the matrix: replay every frame, triple-capture95/121, record font/image readiness, GSAP frame/state and computed transforms. Existing seek waits for two rAF callbacks; the affected differences lie on circle edges, not an image asset. A cause is not yet established. No frozen tolerance or baseline has changed. Root-cause fix, five uncached repeat tests and98/98 final suite remain mandatory.

## Color foundation retained

Existing five-launch ×three-host evidence remains exact under Chromium153.0.8010.12 SwiftShader: all256 opaque/partial-alpha code round trips in16F/32F, grade witness[156,156,156,255], checker linear0.5→188 versus sRGB128, additive linear1.5 before tone mapping, ±2EV round trips0 half-float ULP, and monotonic temperature R/B sweep. Previous product checks:729/729, type-check PASS,52/52 legacy goldens unchanged. Revised Foundry color unit checks:12/12 PASS. Final full suite remains pending.

A new five-launch ×three-host browser rerun follows the revised oracle checks after isolated capture comparisons finish; it is not claimed complete. No product shader changed for this contract correction.

## Compat invariants — renderer checklist

This is distinct from Raphael's preserve list. Reference: COMPAT_INVARIANTS.md.

| Item | Evidence scope |
|---|---|
| Draw order | Existing ordered per-draw capture unchanged. |
| Opacity | Prior five-launch exact overlap suite retained. |
| Blend | Compat shader hash unchanged. |
| Isolation | Existing boundaries unchanged. |
| Groups | Unisolated, inherited opacity; group blend ignored. |
| Clipping | Existing capture and classification unchanged. |
| Grade order | Exposure→temperature→vignette→tone retained. |
| Frozen contracts | M0/M1 schemas and tests unchanged. Root fix not yet applied. |
| Default/fallback | Legacy remains default; GPU explicit opt-in. |
| Timing/identity | Rational FPS unchanged; final settings identity integration still deferred. |
| Host parity | Prior15-host foundation/stress results retained, revised rerun pending. |
| Goldens | Previous52/52, no baseline edits. |
| Capture fidelity | FM2.1 five-launch570/7/0 maps and signed deltas retained; M0 repeat capture separately unresolved. |

## Raphael's real preserve A–M check

| Item | FM2.2 preservation and evidence scope |
|---|---|
| A — Directed temporal anchors | Existing integer-frame and rational-time semantics remain unchanged. Color frame indices do not retime scene anchors. |
| B — Editable causality | Color settings remain explicit parameters; evidence images do not replace editable source projects. |
| C — Gradient of agency | User-approved scope and review remain authoritative. A failed gate is reported, not silently weakened. |
| D — Perceptual-evidence loop (advisory) | Histograms, clipping maps and banding evidence support review. Production visual analysis stays advisory; explicit lab contracts may hard-fail. |
| E — Scoped AI authority | Frozen allowlists and edit boundaries remain enforced. No reviewer-generated project edits occur in this phase. |
| F — Procedural deterministic motion | THREATENED: M0 uncached captures differ. Zero tolerance remains; isolated/history/load comparisons and a root-cause fix are required. |
| G — Advanced temporal geometry | Existing temporal geometry is untouched; color tests do not establish new geometry capability. |
| H — One lighting model | Existing product lighting/grade semantics remain authoritative; no replacement lighting model or lit-path integration is introduced here. |
| I — Recipes as editable executable knowledge | Existing recipe manifests remain editable source, not flattened image substitutes. No frozen M1 recipe changes. |
| J — Model neutrality | Color/capture validation is provider-independent. No new vendor-specific scene contract. |
| K — External-agent operation | Existing CLI/API workflows remain available; no new integration or external messaging is introduced. |
| L — One canonical scene/render state | Projects remain canonical input. The color backend consumes explicit textures/settings; later app integration must bind those settings into render identity. No second editable scene state is introduced. |
| M — Preserved roadmap | FM2.3–FM2.6 scope remains deferred. FM2.2 cannot land until banding and capture determinism pass. |
