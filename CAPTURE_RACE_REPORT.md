# Frame 202 capture-race fix

**Result: step 2 passed the requested acceptance checks.** The only behavioral change is `--num-raster-threads=1`. Five consecutive repeat-render tests passed, covering ten uncached renders and 2,700 primary frames. Frame PNGs, transformed bounds and contact sheets match byte for byte across all ten renders. Zero tolerance is unchanged. The complete regression suite passes **46/46**.

## Ordered investigation

1. Frame 202 contains fully shown text and two circles undergoing small translations. There are no image elements, background textures, filters, blur, masks, clip paths or scale changes. Fonts were loaded. No image-decoding change was needed. Comparing the original failed PNGs found four changed pixels on circle edges: one on the upper circle and three on the lower circle, with no changed title pixels. Bounds were identical.
2. `num-raster-threads` and `PaintHolding` were verified in the installed Chrome for Testing 131.0.6778.204 binary and its matching Chromium source tag. The actual renderer process confirms one raster thread. Playwright already disabled `PaintHolding`; the existing disabled-feature list was pinned unchanged in the hashed renderer config. No other feature was toggled. Single-threaded rasterization was the first behavioral intervention tested.
3. BeginFrame control was not applied: step 2 passed all five repeat tests and the full suite. No unsupported protocol mechanism or extra browser change was introduced.
4. The diagnostic followed the normal capture sequence through frame 201, then captured frame 202 three consecutive times without another seek. This was repeated in a second browser launch. All six PNG hashes and all bounds match. The post-fix diagnostic did not reproduce a within-session timing difference or a per-launch difference; it cannot conclusively classify the original intermittent cause by itself.

The observed failure is resolved under this pinned configuration and the requested five-test criterion. This is finite test evidence, not a guarantee across different Chromium builds or machines. The fixture, narration, validators, budgets and existing test assertions were not changed.

## Evidence

All paths are relative to `/root/projects/motion-foundry`:

- [Acceptance summary](runs/capture-race/acceptance.json).
- [Five repeat tests and their immutable attempt paths](runs/capture-race/step2-single-raster/result.json).
- [Frame-202 triple-capture diagnostic](runs/capture-race/step4-single-raster/result.json), with six PNGs in the same directory.
- [Original scene inspection](runs/capture-race/step1-inspection.json).
- [Original four-pixel difference](runs/capture-race/step1-pixel-diff.json).
- [Installed-browser and tagged-source flag evidence](runs/capture-race/chromium-flags.json).
- [Browser/renderer command lines](runs/capture-race/step2-runtime-flags.json) and [verification](runs/capture-race/step2-runtime-flags-verified.json).
- [Full regression TAP output](runs/capture-race/regression-suite.tap).
- [Independent recheck of the prior live geometry repair](runs/capture-race/prior-live-verify.json).

The repeat runner invokes the original repeat-render test five times. Each test renders twice with cache bypassed, verifies immutable hashes, tests cache reuse separately, and checks repeated/out-of-order seeks. Cached copies do not count toward the ten uncached renders. The runner also compares every uncached render against the first render across pair boundaries.

The batch tool response exceeded its 300-second transport wait. All five test processes nevertheless completed and persisted exit code 0, their TAP logs, verified manifests and the completed series result; those artifacts were checked directly afterward. No render timeout or acceptance rule was increased.

No additional Kimi/model calls were made. Earlier failed evidence and historical reports remain intact. The prior live repair still passes independent verification; this change addresses capture only.

## Reproduction

Use a fresh stage name each time; evidence refuses overwrites.

```sh
npm run build
node scripts/repeat-capture.mjs fresh-five-pair-series
node scripts/frame202-diagnostic.mjs fresh-frame202-diagnostic
npm test
```

Renderer fix and diagnostic tools: commit `ad063d3`.

Primary references: [Chromium 131 raster-thread switch](https://chromium.googlesource.com/chromium/src/+/refs/tags/131.0.6778.204/cc/base/switches.cc) and [Chromium 131 PaintHolding feature](https://chromium.googlesource.com/chromium/src/+/refs/tags/131.0.6778.204/third_party/blink/common/features.cc).
