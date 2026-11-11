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
