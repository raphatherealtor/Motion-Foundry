# FM2.2 approved banding correction — 2026-11-11

Raphael approved replacing the original raw-neighbor ≤1-LSB limit and fixed 1.5× theoretical per-run cap. Those rejected the prescribed ±1-LSB PCG triangular dither and the intended OETF slope itself. Historical measurements remain in docs/fm2_2/stress/banding-results.json.

The replacement contract is:

1. Float64 CPU oracle with the same wrapped integer PCG3d, seed/frame and dither mode. GPU output must differ by at most1 LSB per channel; no channel may differ by2 or more.
2. Per-pixel quantization residual magnitude ≤1.5 LSB, each64-line column mean residual magnitude ≤0.05 LSB.
3. Averaged64-line profiles: adjacent steps ≤oracle step +0.25 LSB; preserve oracle monotonicity.
4. Compare GPU run histograms to oracle-with-dither histograms, not a fixed per-run length cap.
5. Dither-on spectral peaks strictly below+6 dB. Off negative control must FAIL; accepting it is ERROR.

The implementation records residuals against dithered continuous codes before rounding, plus undithered-signal residuals separately. Oracle quantized profiles define the profile comparison. AllRGB channels in all four regions are checked. Run histograms are retained exactly; no unapproved numerical histogram tolerance is invented.

Saved card results: oracle hard gate PASS (max1 LSB, zero channels≥2), max quantization residual ~0.50004 LSB. Profile step excess≤0.015625 LSB; zero monotonic violations. Spectra remain below+6 dB with dither and above it without.

However the literal per-column mean bound rejects the CPU oracle itself: max0.1550608563 static and0.1401686376 temporal. GPU and CPU maxima coincide. Exact run histograms also differ in a few bins at allowed1-LSB rounding boundaries (histogram L1 deltas3–8). These observations do not authorize relaxing a bound or claiming PASS. Clarification of the column-mean reference has been requested while capture comparisons continue independently.

## Approved column-mean clarification

Raphael subsequently required checking residual signs first. Consistently signed residuals indicate a possible systematic quantizer/dither bias to fix in both implementations. If centered, use |column mean|≤4σ/√N with measured per-pixel residual standard deviation and N=64. GPU column means must match the CPU oracle's within0.02 LSB.

Observed case: centered sampling noise. Every dither-on region/channel has both signs; grand-mean Z magnitudes<2.44. Population σ over the measured64 scanlines is0.287146–0.289266 LSB (static) and0.287525–0.289226 (temporal). Four-sigma bounds are0.143573–0.144633 and0.143762–0.144613 respectively. GPU-oracle column error≤0.015625 in both modes. Temporal has no statistical exceedance; static has one horizontal-blue column above its four-sigma bound, retained as FAIL. No shader/quantizer change was justified by this sign check.

The old0.05 bound and clarification request above are historical, superseded by this explicit statistical rule. Strict histogram comparisons remain recorded separately.

## Approved family-wise clarification

The four-sigma rule above is superseded by Raphael's family-wise bound: k=Φ⁻¹(1−0.001/(2C)), |mean|≤kσ/√64. C counts all columns tested by one mode's validation:4 regions ×3 RGB channels ×1080=12,960. Therefore k=5.3736454844. Even with C=1080 alone the exact formula gives k=4.9067613288, not the approximate4.4 in the request.

Static's formerly failing horizontal-blue column570 has |z|=4.3072735413. Temporal's largest |z|=3.8874949062. Both PASS, with no family-wise exceedances. The CPU/GPU dither and quantizers stay unchanged. The Gaussian survival integral is inverted directly and cross-checked against Python's statistics.NormalDist; k agrees within1.3e-10 at the actual C. Each validation records C, alpha0.001, k, σ, bound, worst coordinate and z-score. Modes are separate validation families; the diagnostic off control remains FAIL.

The remaining strict histogram difference is small (max8 counts /32,572 runs =0.024561%). A proposed0.03% normalized L1 limit per region/channel has been sent for review; it is not applied without approval.
