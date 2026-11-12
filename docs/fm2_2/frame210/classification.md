# Frame210 investigation — acceptance HOLD

## Saved-capture diff

The 540×960 RGB captures differ at exactly two pixels, six channels; maximum absolute channel delta6. Output coordinates and RGB values:

- (322,763): A[71,113,106], B[73,119,111], signed B−A[2,6,5].
- (464,763): A[37,57,62], B[40,62,65], signed B−A[3,5,3].

Both lie at the lower left/right antialiased perimeter of shape2, the mint CSS circle. Its identical logical bounds are[626.666687,1293,946.666687,1613], or output bounds[313.333344,646.5,473.333344,806.5]. Pixel-center distances from its output center[393.333344,726.5] are approximately79.91 and80.22, against radius80. The differences are isolated edge pixels, not a whole region, text or the other circle. src/scene.ts supplies shape2 as a border-radius:50% DOM div, background#71bba4; GSAP translates it. There is no application Canvas draw call to identify. Chromium's internal paint/raster draw cannot be identified from the saved PNGs. All frame boxes and manifest source/config/assets/schema hashes match. Decoder: diff.py, PNG filters0–4, no browser capture; pixel-diff.json retains all changed bytes.

## Offline50 diagnostic: unavailable for the actual renderer

M0 is HTML/CSS/GSAP rendered by Chromium, captured through page.screenshot. It does not render into an application-owned Canvas/WebGL target and has no float64 full-scene pixel oracle. The Motion Suite GPU backend and FM2.2 color oracle are different renderers; substituting either would not preserve these inputs/rasterization semantics. An analytic circle oracle likewise cannot establish Chromium DOM raster determinism. Decoding or hashing the saved PNG50 times would not be a re-render. Therefore zero offline re-renders were performed; no deterministic-renderer conclusion is claimed.

The requested step2 needs a way to replay Chromium's actual recorded paint/raster output independently of screenshot capture, or an explicitly revised diagnostic using Chromium compositor/raster tracing. Neither is currently provided by this harness. Step3's conditional40-suite campaign is not started: capture-only causality has not been established.

## Classification

Observed: repeat-render pixel determinism failure localized to shape2 edge coverage. Causal split between Chromium rasterization and screenshot timing remains UNVERIFIED. High load or a matching analytic oracle would not establish that split. Run14 remains an unreproduced screenshot API exception whose full error was lost; there is no evidence tying it to these two edge pixels. Both are capture-path incidents, but a common timing mechanism is not established.
