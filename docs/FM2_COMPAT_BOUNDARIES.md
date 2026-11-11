# Compat paint order and isolation boundaries

Pinned legacy source: Motion Suite db36db39821f46ec4b7057bb431ffb9e82473c33. The approved correction changes the GPU compat architecture, not the product document format.

The destination context is wrapped by `gpu/paintCapture.ts`. Each fill, stroke, fillRect, strokeRect, fillText, strokeText and drawImage emits one ordered upload/composite. Clear operations emit ordered coverage clears. Rasterization retains the original transform, clipping, opacity, shadows and filter. Opacity is applied while rasterizing that individual draw and is not multiplied again during GPU blending. The original destination blend is recorded and performed by the GPU. No whole-object isolation is introduced.

Existing boundaries:

- Flat, ordinary planes: `projectedPlane.ts:20` calls the painter directly. Fill/stroke/text calls remain separate GPU draws.
- Tilted planes: `projectedPlane.ts:24–45` rasterizes into the existing plane texture, then draws clipped affine triangles. That scratch raster stays isolated; every destination triangle drawImage remains separate and ordered.
- Explicit isolation requested by the legacy renderer: the same function isolates Holo optical treatments and readback/depth-contrast surfaces. The recorded destination call is the already-isolated texture; its internal operations are not moved across that boundary.
- Soft masks: `layerMask.ts:85–91` paints content and builds/multiplies coverage in scratch canvases, then emits one destination drawImage. Keep that existing boundary. Hard ancestor clips remain state on each destination draw.
- Holo: `drawDocument.ts:285–287` opts into existing plane isolation because internal effects erase or override alpha. Those scratch passes stay inside that isolation.
- HTML slices: existing preview/export slice boundaries belong to their respective caller. Compat integration must preserve them; the core standalone regression currently covers Canvas-only fixtures.
- Ordinary document groups do not imply isolation: evaluated parent opacity is inherited by children in `motion-document-utils.ts:60–78`. No new group flattening is permitted.
- Cast-shadow byte merges and lit frame-grade paths are not part of unlit FM2.1. GPU entry rejects enabled lights/grade rather than silently using a Canvas output as GPU evidence.

The compat compositor retains RGBA16F linear-premultiplied storage, with legacy sRGB byte quantization at each destination operation. This is necessary to reproduce the legacy 8-bit accumulation. It is not the future linear-mode accumulation policy. No existing golden baseline or tolerance is changed.

Current exact pinned regression: opaque overlap control; translucent fill without visible stroke control; red fill/blue stroke at opacity 0.5 and 0.25. The overlap values are constants in `tests/golden-gpu/opacity.ts`, not values recomputed from the candidate.
