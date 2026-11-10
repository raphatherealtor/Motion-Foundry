# Motion Foundry M2: GPU float render pipeline (handoff spec)

**Status:** SPECIFIED ONLY. Nothing in this M2 spec is implemented, tested, or verified. M2 must not start until Raphael authorizes the Motion Suite branch (§2).

**Where M1 left off:** `motion-foundry` @ `b52aebd` on `m1-motion-suite-adapter`. The live Kimi loop and independent verification passed, 5 uncached repeats were identical, the full suite is 86/86, it runs on Chromium 153 only, recipes enforce word splitting, and Motion Suite was not changed. M1 settled these decisions, and M2 keeps every one of them:
- fps is pinned to 30/1, and an fps change is `FORBIDDEN_OP`.
- Times are integer frames with exact rational conversion. A non-integer frame is `TYPE_INVALID`.
- `shadowSoftness` runs 0–1, and a value outside that is `OUT_OF_BOUNDS`.
- New v2 schemas were added, and v1 is frozen.
- Determinism comes from `--num-raster-threads=1`.
- Preview, export, and worker renders are byte-identical.

**Evidence tags.** Every factual claim below carries one of these tags:
- **[OBSERVED@de612e4]**: read in `raphatherealtor/blank-canvas-starter` source at `claude/e3-highlight-render`, `de612e4`, during a read-only inspection. No tests were run.
- **[REPORTED@b52aebd]**: stated in Jackhammer's M1 completion report. The M1 report itself was not re-read for this spec.
- **[REPORTED:Raphael]**: Raphael's own description.
- **[DOC]**: from public Chromium documentation, which can change between Chromium versions.
- **[ASSUMED]**: a design assumption.
- **[TARGET]**: a number to measure against. It is not a fact.

Step 0 (M2.0) must turn every OBSERVED / REPORTED / DOC / ASSUMED item it depends on into **OBSERVED@\<new SHA\>** before any build starts, or record it as CORRECTED or NOT_FOUND.

---

## 1. Goal, scope philosophy, non-goals

**Goal.** Give Motion Suite one fast, float-precision GPU renderer that every Foundry-connected AI can drive and verify. It runs on WebGL2 with 16-bit float render targets, behind a thin backend interface so WebGPU can be added later. The pipeline has these parts:
- **Linear-light compositing**: blend modes, track mattes, masks, and color, all on the GPU.
- **A managed output transform**: linear to 8-bit sRGB, with defined dithering.
- **True sub-frame motion blur**: shutter angle and phase, with exact rational sub-frame times.
- **A seeded texture stack**: noise, displacement, grain, and paper, driven over mask fields.
- **The lit path**, migrated off the slow CPU float path onto the same pipeline.

When M2 is done there is one renderer, not two.

**Why.** [REPORTED:Raphael] Motion draws with Canvas 2D in 8-bit, and only lit scenes go through a slow CPU float path. Linear color, 16-bit internals, 8–16 sub-frame motion blur, and the texture stack all need fast float pixels. Canvas 2D can't provide them.

**Scope philosophy. This is binding on every builder and reviewer.**
- Motion Suite aims to be **better than any motion-graphics app with AI integration**. It is not a documentary-collage tool. **Nothing is cut.** M2 is a *build order*, not a scope ceiling.
- **Every capability ships with a Foundry validator (a check) and at least one recipe.** That way a connected AI can see the capability, use it, and verify it from day one. §13 is the coverage matrix. A capability without both is not done.
- **Building blocks stay general, and recipes carry styles.** No pipeline stage may hard-code a documentary assumption. M2.6 includes a non-documentary recipe that proves this.
- Claims like "90%+ of an AE camera" and "AE-class color" stay **unverified** until Foundry stress tests measure them. M2 builds the color stress tests (§6.6). Camera and DOF stress tests are a later phase (§15).

**Non-goals for M2.** These are deferred, not cut. §15 lists them as roadmap:
- the graph editor
- precomp and nesting ergonomics
- tracking and roto
- the effects/plugin ecosystem
- HDR, 32-bit, and wide-gamut output
- the WebGPU backend implementation
- 2.5D camera and DOF stress tests
- the Studio compositor (`src/engine/compositor.ts`) moving onto this pipeline
- Raphael's unique features (list pending from Raphael)
- audio, production assets, publishing, any spend
- changing the product's default renderer for end users

---

## 2. Boundaries and authorization

- **Foundry repo.** Work in `motion-foundry` on a new branch, `m2-gpu-renderer`, cut from `b52aebd`. The M0 and M1 contracts, allowlists, validators, and all 86 existing tests stay unchanged and must stay green at every commit. The v1 and v2 schemas are frozen. M2 adds only **v3** files (§10).
- **Motion Suite repo.** Unlike M1, M2 **has to edit existing renderer files**, because the pipeline lives inside the product. So:
  - **Kickoff needs Raphael's explicit authorization, recorded in the Jackhammer session**, covering: (a) creating the branch `foundry/m2-renderer` from the base Step 0 confirms, and (b) editing existing tracked files under the renderer paths Step 0 lists (for example `src/motion/render/**` and `src/motion/export/**`), plus adding new files.
  - Without that recorded authorization, only M2.0 (Step 0, read-only) may run. Everything after it is `BLOCKED`, with the detail `AWAITING_AUTHORIZATION`.
  - **The legacy Canvas 2D renderer stays in place and stays the product default** behind a renderer selector: `renderer: "canvas2d" | "gpu"`, default `"canvas2d"`. Switching the default is a separate decision for Raphael. Legacy also stays as the **runtime fallback** when WebGL2 or float targets are unavailable. [DOC] Chromium does not guarantee WebGL, and its automatic SwiftShader fallback is deprecated, so real users can hit this.
  - **Existing goldens are never regenerated or edited.** `npm run golden` on the legacy renderer must give the same result as at the base. GPU goldens go in a **new** directory (proposed `tests/golden-gpu/`).
  - Do not edit the Studio compositor, the catalog semantics, the persistence format, or handoff docs. If a document schema change is unavoidable, stop and report the exact diff first (§10.3).
  - No merge, rebase of other people's branches, force-push, deploy, visibility change, or PR without a separate instruction. Don't touch other agents' branches (`claude/*`, `codex/*`).
- **Commit discipline.** Commit each internal milestone (M2.0–M2.6) once its pass criteria hold. Each milestone also gets `docs/M2_<n>_REPORT.md` in `motion-foundry`. Don't start milestone n+1 inside milestone n's commit, and don't add scope beyond this spec. Ideas go in `docs/M2_BACKLOG.md`.
- **Spend and safety.** `allow_spend=false`, with no paid API fallback. Reviewer CLIs run on subscriptions only, with the canary re-run before any live loop (M0 §8). Use synthetic fixture assets only, never production art. Don't generate, publish, or message anything.
- **SwiftShader security note [DOC].** Chromium calls SwiftShader unsafe for untrusted content. The Foundry renders only local, network-blocked scenes (M0 §6). That stays mandatory, and any remote request fails the render.

---

## 3. M2.0 Step 0: GPU capability gate (mandatory, read-only, falsifiable)

Write `docs/M2_STEP0_FINDINGS.md` in `motion-foundry`, plus a machine-readable `docs/m2_step0/gpu_caps.<mode>.json` for each mode. Mark every item **CONFIRMED / CORRECTED / NOT_FOUND** with evidence: `file:line` plus SHA for code, or command plus output for runtime. Use only non-mutating commands in the Motion Suite checkout. Put probe pages on the Foundry side.

### 3.1 Code facts to re-confirm at the current base
1. **Base and heads.** Record the heads of `main` and `claude/e3-highlight-render`, and whether E3 has merged. Choose the base the same way as M1 §3.1 and record its SHA.
2. **Legacy draw path.** [REPORTED:Raphael] Confirm that unlit drawing is Canvas 2D at 8 bits per channel. Name the context creation sites, including `colorSpace` and `willReadFrequently`, and every `globalCompositeOperation`, `filter`, and `shadow*` use. [OBSERVED@de612e4] `buildSpatialFrame` → `drawPlanes` / `prepareLitLayers` (`src/motion/render/drawDocument`).
3. **Lit path.** [REPORTED:Raphael] There is a slow CPU float lit path. Locate it, and list its inputs (lights, `lighting.*`, surface shadow fields, grade fields `exposureEV`, `toneMap`, `keyLightId`, `vignette`, `vignetteFeather`, `colorTemperature`), its working precision, its color space, and its tone-map math. Measure the time per lit frame at 1080×1920 in the pinned environment. M1 recorded 3–6 s as **[UNVERIFIED]**, and this measurement replaces that figure.
4. **Projection.** Find out how `drawPlanes` draws projected planes. Is it an affine `setTransform`, a subdivided mesh, or something else? Does it do perspective-correct sampling? This decides the parity tolerance in M2.1.
5. **Blend modes, mattes, masks in use.** List every blend mode, track-matte type (alpha, alpha-inverted, luma, luma-inverted), mask mode, and mask feather implementation the document model can express. Each one becomes an M2.1 requirement.
6. **Time evaluation.** Is evaluation a **pure function of continuous time**? Check whether `buildSpatialFrame(doc, seconds)` gives a correct result at non-integer frame times. Also check for stateful or stepped systems (particles, physics, behaviors that integrate per frame, hold keys, `round`/`floor` on time). Each such system is listed. Motion blur (§7) is gated on this answer.
7. **Modes.** Locate the preview, export, and worker code paths, and the golden `renderProject(project, frame, mode)` modes [OBSERVED@de612e4]: `preview | export | worker | draft | defaults`. Find whether worker uses `OffscreenCanvas`, and the export frame source (GIF frame-by-frame; WebM/MP4 via `MediaRecorder` are never evidence, per M1 §5).
8. **Asset decode.** Find how images become pixels: `Image`, `createImageBitmap`, ICC handling, premultiplication.
9. **Toolchain.** Record the Chromium 153 build and channel (headless shell or new headless), the Playwright version, and Node. Run vitest and `npm run golden` once, read-only, and record the counts. Run the Foundry suite and confirm 86/86.

### 3.2 GPU probe: per mode, under SwiftShader, in headless Chromium 153
The probe page creates a WebGL2 context in each of three hosts: **preview** (main-thread `HTMLCanvasElement`), **export** (whatever the export path uses), and **worker** (`OffscreenCanvas` in a dedicated worker). For each host it records:

| Probe | Requirement to PASS |
|---|---|
| `getContext('webgl2', {antialias:false, premultipliedAlpha:true, preserveDrawingBuffer:false, powerPreference:'default'})` | non-null |
| `WEBGL_debug_renderer_info` unmasked renderer/vendor | string identifies SwiftShader (record verbatim). Anything else means **not pinned** |
| `EXT_color_buffer_float` | present |
| `RGBA16F` texture as `COLOR_ATTACHMENT0` | `checkFramebufferStatus === FRAMEBUFFER_COMPLETE` |
| `RGBA32F` color attachment | record complete or not (needed by §7.4) |
| `EXT_float_blend` | record present or not (blending into 32F targets) |
| `OES_texture_float_linear`, `EXT_color_buffer_half_float`, `EXT_texture_norm16`, `WEBGL_lose_context` | record present or not |
| `MAX_TEXTURE_SIZE`, `MAX_RENDERBUFFER_SIZE`, `MAX_DRAW_BUFFERS`, `MAX_COLOR_ATTACHMENTS`, `MAX_TEXTURE_IMAGE_UNITS`, `MAX_FRAGMENT_UNIFORM_VECTORS`, `MAX_VIEWPORT_DIMS` | record. `MAX_TEXTURE_SIZE ≥ 4096` required [TARGET: covers 2× supersampled 1080×1920 layers] |
| `getShaderPrecisionFormat(FRAGMENT_SHADER, HIGH_FLOAT)` and `HIGH_INT` | `precision ≥ 23`, `rangeMin/Max ≥ 127` (true fp32), `HIGH_INT` 32-bit |
| `IMPLEMENTATION_COLOR_READ_FORMAT/TYPE` on an RGBA16F FBO | record. Confirm `readPixels(RGBA, HALF_FLOAT)` or `(RGBA, FLOAT)` works for float readback |
| `readPixels(RGBA, UNSIGNED_BYTE)` from an RGBA8 FBO | works |
| Context-loss handling | `webglcontextlost` / `restored` events fire under `WEBGL_lose_context`, and the probe re-initializes |

### 3.3 Candidate launch flags: VERIFY, do not assume
[DOC] Chromium's documentation (current main) lists:
- `--use-gl=angle --use-angle=swiftshader`, SwiftShader as the GL driver
- `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`, software WebGL
- `--enable-unsafe-swiftshader`, needed since automatic fallback was deprecated (deprecation warnings since Chrome 130, removal rollouts from 139)

Step 0 must try these on Chromium 153 together with the existing M0/M1 flags (`--num-raster-threads=1`, the PaintHolding pin, and the rest). It must record **which exact set** yields a SwiftShader renderer string *and* passes §3.2 in all three hosts. It must also record whether `--disable-gpu` or `--headless=new` versus headless-shell changes the outcome. The working set is pinned in the renderer config and included in `render_id`'s config hash (M0 §6). If no set works, the gate fails.

### 3.4 Determinism probe
Run a fixed probe shader suite at 1080×1920. Each test writes to RGBA16F (and RGBA32F if supported), then goes through an encode pass to RGBA8:
- (a) a linear gradient across 0–1, in 1-ULP steps of half precision
- (b) an integer-hash noise field (PCG-style, uint math only)
- (c) transcendental math (`pow`, `exp`, `log`, `sin`, `sqrt`) over a range
- (d) bilinear sampling of an RGBA16F texture at sub-texel offsets, plus a custom box-filter mip chain
- (e) float blending (`ONE, ONE` additive) of 16 passes into 16F and, if supported, into 32F
- (f) a sRGB-encode + dither pass to RGBA8
- (g) a texture upload of a Canvas 2D–rasterized text layer (IBM Plex, which the harness registers) and of a decoded PNG fixture

For each host, do **5 repeats in fresh browser launches**. Hash both the float readback and the 8-bit output. Then compare across hosts (preview vs export vs worker).

### 3.5 Real-GPU observation (informational, not gating)
If a machine with a real GPU is available (for example Raphael's), run §3.2 and §3.4 there with no SwiftShader flags. Record the renderer string, extensions, and repeatability. Also record the **cross-backend diff** against SwiftShader using the §9 metrics. If no machine is available, record `NOT_RUN`. This seeds the tolerance calibration in §9.

### 3.6 Gate: every line is falsifiable
M2.0 **PASSES** only if all of these hold:
1. All three hosts create WebGL2 with a SwiftShader renderer string under one recorded flag set.
2. All three hosts have `EXT_color_buffer_float` and a complete RGBA16F FBO.
3. HIGH_FLOAT is fp32 in fragment shaders.
4. Every §3.4 test except (c) is byte-identical across 5 fresh launches, in every host, for both the float readback and the 8-bit output. Test (c) is diagnostic: any transcendental that differs is recorded and banned from shaders (§4.2); it is not a gate failure by itself.
5. Preview, export, and worker are byte-identical to each other on every §3.4 test.
6. §3.1 items 2, 3, 6, and 7 are CONFIRMED, or CORRECTED with the same semantics.
7. The Foundry suite is still 86/86, and the Motion Suite checkout `git status` is clean.

**Otherwise stop and report `BLOCKED`.** Include the failing item, the raw evidence, and the options you see. Do not pick a workaround yourself. Examples of what to report:
- "RGBA16F incomplete in worker; RGBA32F complete; cost ×2 memory."
- "transcendental test differs between launches; restrict shaders to rational/integer math?"
- "evaluation is not continuous-time for particles; motion blur would need sub-stepping."

In particular:
- **Never silently fall back to 8-bit, RGBA8, or Canvas 2D** inside the Foundry evidence path.
- If RGBA32F is not complete, or `EXT_float_blend` is missing, that alone is **not** a gate failure. §7.4 then uses its 16F fallback, and the findings must say so.
- If §3.1.6 shows non-continuous systems, M2.3 is gated on its own (§7.7). The rest of M2 may proceed.

---

## 4. Architecture

```
MotionDocument (product) + render settings (v3)
  └─► buildSpatialFrame(doc, t)            ← product evaluation, unchanged; called at each (sub-)frame time
        └─► Layer raster stage (Canvas 2D, unchanged code where possible)
        │     text / vectors / shapes / images → per-layer RGBA8 sRGB raster at quantized scale
        │     raster cache keyed by sha256(layer content + raster scale + font set)
        └─► Upload: texImage2D → RGBA8 texture (no implicit premultiply, no colorspace conversion)
              └─► GPU render graph (GpuBackend: webgl2 in M2, webgpu declared)
                    decode sRGB→linear, premultiply in linear
                    → per-layer: mask field → texture stack → light/shadow → transform (projected quad)
                    → composite: blend mode + track matte, linear float16 (RGBA16F)
                    → [motion blur: N sub-frame composites accumulated in RGBA32F | 16F tree]
                    → grade (exposure, temperature, vignette) → output transform (tone map, clamp)
                    → encode linear→sRGB (exact piecewise) → dither → RGBA8 → readPixels
                          └─► frames/*.png + perception/* + render_caps.json → EvidenceManifest (M0)
```

### 4.1 `GpuBackend` interface (thin, backend-neutral)
`src/motion/render/gpu/backend.ts` in Motion Suite. The proposed path is subject to Step 0.
```ts
interface GpuBackend {
  readonly kind: "webgl2" | "webgpu";            // webgpu: declared, status "UNVERIFIED", not built in M2
  caps(): GpuCaps;                                // the §3.2 record; hashed into render_id config
  createTexture(desc: {w:number,h:number,format:"rgba8"|"rgba16f"|"rgba32f"|"r16f"|"r32f",filter:"nearest"|"linear"}): TexHandle;
  upload(tex: TexHandle, src: ImageBitmap | HTMLCanvasElement | OffscreenCanvas | ImageData): void;
  createTarget(tex: TexHandle): TargetHandle;
  program(id: ShaderId): ProgramHandle;           // shaders from a registry; no runtime string building from scene data
  pass(p: {program:ProgramHandle, inputs:Record<string,TexHandle>, uniforms:Record<string,number|number[]>,
           target:TargetHandle, blend?: "none"|"premul_over"|"additive", clear?: [number,number,number,number]}): void;
  readback(t: TargetHandle, as: "u8"|"f16"|"f32"): Uint8Array | Uint16Array | Float32Array;
  release(h: Handle): void;
  lost(): boolean;                                // context-loss → ERROR/CONTEXT_LOST, never a partial frame
}
```
Rules:
- The render graph is plain data: an ordered list of passes. It is built deterministically from the document, and its canonical JSON hash is recorded per frame as `graph_sha256`. Pass order is never derived from hash maps, object identity, or timing.
- Shaders live in a **registry** with stable ids and hashes. Scene data reaches shaders **only as uniforms or textures**, never as shader source text.
- WebGPU later implements the same interface. An M2 test runs the whole graph through a **mock backend** that records the pass list, so the graph is backend-independent by construction.

### 4.2 Shader determinism rules (apply to every pass)
- Use `precision highp float; precision highp int;` everywhere.
- **Noise and dither use integer hashing** (PCG/xxhash-style `uint` math), never `fract(sin(x)*43758.5453)`. Sine-based hashing varies across GPUs, which breaks §9 tolerance.
- No derivatives (`dFdx`/`fwidth`) in non-uniform control flow. Fixed loop bounds only. No reads of uninitialized targets: every target is cleared explicitly.
- **Mipmaps come from a Foundry shader**, a box or Kaiser filter with weights computed in JS float64 and passed as uniforms. `generateMipmap` is implementation-defined, so it is not used. Do not use anisotropic filtering.
- Kernel weights (blur, feather, Gaussian) are computed once in JS float64, rounded to float32, and passed in. They are never computed in-shader with `exp`.
- No MSAA. Antialiasing comes from the Canvas 2D raster plus a fixed analytic edge coverage for quads. Supersampling, if used, is an explicit integer factor in the render settings.
- If Step 0 shows a transcendental differs between launches, that function is banned from shaders and replaced with a polynomial approximation, recorded in the findings.

### 4.3 Layer raster stage
- Canvas 2D stays the rasterizer for text, vectors, and shapes, reusing the product's existing draw code for each object type. This keeps font shaping and word layout identical, and M1's per-word bounds still hold.
- **Raster scale** = projected on-screen scale × supersample factor. It is quantized to steps of 2^(1/4) and capped by `MAX_TEXTURE_SIZE`. A layer rasterized below its on-screen size during a camera push counts as a defect, checked by `raster_resolution.v1` (§11).
- Upload uses `UNPACK_PREMULTIPLY_ALPHA_WEBGL=false`, `UNPACK_COLORSPACE_CONVERSION_WEBGL=NONE`, and `UNPACK_FLIP_Y_WEBGL=false`, and the shader flips explicitly. Images are decoded with an explicit, recorded `createImageBitmap` option set (`colorSpaceConversion`, `premultiplyAlpha`), as confirmed in Step 0 §3.1.8.

### 4.4 Memory [TARGET, measure in M2.1]
At 1080×1920, RGBA16F is about 16.6 MB per target and RGBA32F about 33.2 MB. The budget is ≤ 24 live full-frame float targets plus the raster cache, ≤ 1 GB of GPU memory in the Foundry config. Report the high-water mark per scene in the M2.1 report.

---

## 5. M2.1: GPU backend, upload, linear float compositing

M2.1 uses a minimal exact sRGB decode/encode (no dither, no grade) so parity can be measured; M2.2 adds the full output transform. M2.1 fixtures are unlit (lit documents return `UNSUPPORTED`/`LIT_PATH_PENDING_M2.5` in GPU mode).

### 5.1 Compositing model
- **Working space:** linear-light, Rec.709/sRGB primaries, scene-referred. Values above 1.0 are allowed until the output transform. Alpha is premultiplied in linear.
- **Comp setting `blending_gamma`: `"linear"` (default) | `"srgb"`.** In `srgb` mode, blending converts operands to sRGB-encoded values, blends, and converts back. This works like AE's "Blend colors using 1.0 gamma" toggle in reverse. It serves two purposes: it is a creative choice for users, and it is the **compat mode** M2.1 parity is measured in.
- **Blend modes**: every mode Step 0 §3.1.5 finds is required. The full target set is normal, multiply, screen, overlay, add (linear dodge), subtract, darken, lighten, difference, exclusion, color dodge, color burn, hard light, soft light, linear light, vivid light, pin light, hue, saturation, color, luminosity. Formulas follow the W3C Compositing and Blending Level 1 definitions where they exist, and the others are specified in `docs/M2_BLEND_FORMULAS.md` with a float64 reference. Modes beyond those Step 0 finds are **new capabilities**, so each gets an oracle test (§5.3) and appears in `lab.blend_matrix` (§12).
- **Track mattes**: alpha, alpha inverted, luma, luma inverted. Luma is linear Rec.709 Y (0.2126, 0.7152, 0.0722), which is a documented intentional difference from display-referred luma. If Step 0 finds the legacy luma definition differs, compat mode reproduces it.
- **Masks → mask field.** Each layer's masks resolve to one `r16f` coverage texture, the **mask field**, using the product's mode semantics (add, subtract, intersect, and the others Step 0 finds). Feather is a separable Gaussian with JS-computed weights. Expansion is a distance-field offset. A **signed distance field** of the field's edge is generated by jump flooding in a fixed pass count. M2.4 uses it for edge-driven effects such as deckle, fiber rims, and edge grain.

### 5.2 Parity with the legacy renderer
| Comparison | Mode | Metric gate [TARGET, calibrate in M2.1] |
|---|---|---|
| GPU `srgb` compat vs legacy Canvas 2D (unlit scenes) | pinned SwiftShader | ≥ 99.5% pixels with max channel Δ ≤ 2/255; PSNR ≥ 42 dB; SSIM(Y) ≥ 0.995; zero pixels Δ > 16/255 outside a 1-px band around projected-quad edges |
| GPU `linear` vs legacy | pinned | **not a pass/fail gate.** Reported as `foundry.render_parity/0.2` metrics plus heat maps, with each difference class attributed in `docs/M2_INTENTIONAL_DIFFERENCES.md` |
| GPU preview vs export vs worker | pinned | **byte-identical** (M1 rule, unchanged) |

- **Choosing the tolerances.** Start from the provisional numbers above. Measure the actual distribution on the M1 recipe fixtures and the `lab.*` scenes. Set the final gate at the observed worst case × 1.25. Then prove that it **discriminates** by running seeded regressions that must each FAIL: a 1-px layer offset, a wrong blend mode, a swapped matte, a missing layer, a 0.5% opacity error on a full-frame layer, a gamma applied twice. If any regression passes, tighten the gate and repeat. Record the final numbers, the distribution, and the regression results in the M2.1 report. These numbers become config (`parity_tolerance.v1`) and are hashed into the config.
- **Expected intentional differences**, to confirm or refute and then document:
  - Antialiased edges and text weight look slightly heavier or lighter in linear blending.
  - Soft shadows and gradients are brighter in the mid-falloff.
  - Additive and screen glows saturate differently.
  - Perspective-correct sampling differs from Canvas 2D affine approximations (§3.1.4).
  - Feather falloff changes.
- If a difference shows up that **is not** in this list and **is not** explained by color space or sampling, it is a semantic mismatch. Stop and report it (§14).

### 5.3 Oracle tests
Every blend mode, matte type, mask mode, and the premultiply/unpremultiply round trip gets a float64 TypeScript reference. Tests run on 64×64 synthetic tiles over the GPU path and compare in float, with tolerance ≤ 2 half-float ULP on the RGBA16F readback. These tests are what makes "AE-class compositing" a measured claim rather than an assertion.

**M2.1 pass:**
- §5.2 gates are met.
- The oracle tests pass.
- Preview, export, and worker are byte-identical, with 5 fresh-launch repeats identical on every M1 recipe fixture.
- The mock-backend graph test passes.
- Legacy `npm run golden` is unchanged.
- The full suite is green.

**Commit.**

---

## 6. M2.2: Color management, output transform, dithering

### 6.1 Input transforms
- 8-bit sRGB rasters and images are decoded with the exact IEC 61966-2-1 piecewise EOTF (linear segment below 0.04045). M2 uses no LUT approximation.
- Solid colors in the document (`#rrggbb` strings and `shadowColor`) are decoded in JS float64 and passed as linear uniforms.
- Assets with embedded ICC profiles get the decode behavior recorded in Step 0. Assets outside sRGB are flagged `WARN` in `render_caps.json`. Wide-gamut handling is roadmap.

### 6.2 Output transform (SDR, M2)
`linear scene` → `exposureEV` → `colorTemperature` → the product's `toneMap` (mapped exactly to the operator Step 0 finds; if none, `clamp`) → `vignette` → clamp to [0,1] → linear→sRGB OETF (exact piecewise) → **dither** → quantize to 8-bit → unpremultiply for straight-alpha PNG output if alpha is exported.

- The order of grade operations must match the legacy lit path's order, as Step 0 records it. If the orders differ, that is a semantic mismatch, so stop and report.
- Encode happens **in-shader** into an RGBA8 target. Do not use `SRGB8_ALPHA8` targets or hardware encode, because their rounding is implementation-defined.

### 6.3 Dithering: where it applies and where it doesn't
- **Applies only at the single float → 8-bit quantization at output/export.** It never applies to intermediate buffers, float readbacks, the motion-blur accumulator, or perception buffers.
- **Algorithm:** triangular-PDF noise of amplitude ±1 LSB (8-bit), added in sRGB-encoded space before rounding. Noise = `pcg3d(x, y, frame_index ^ dither_seed)`, using integers only. **Temporal** by default (it changes per frame), with `dither_mode: "temporal" | "static" | "off"`. `off` exists only for evidence diagnostics and the banding validator's negative control. Final exports must use `temporal` or `static`.
- **Alpha:** alpha is not dithered.
- **Fully black or fully white flat regions:** the noise is masked when the encoded value is exactly 0 or 255 after clamping, so true blacks stay 0 and whites stay 255.
- Dither is deterministic, so byte-identity in the pinned environment still holds.

### 6.4 Banding validator `banding.v1` (hard)
- **Test input:** `lab.gradient_banding` (§12) renders a full-frame horizontal linear-light gradient, a radial vignette, a dark navy-to-black gradient (the hardest case for 8-bit), and a warm skin-tone ramp.
- **Measurement:** the validator reads the 8-bit frame. In each gradient region it computes the step histogram along the gradient axis, meaning the run lengths of constant value in a 1-px scan line, averaged over 64 lines.
  - **FAIL** if any constant run is longer than `max_run_px` [TARGET: 1.5 × the theoretical run length for that gradient's slope].
  - **FAIL** if adjacent-run steps exceed 1 LSB.
  - **FAIL** if the local power spectrum shows a peak at the step frequency above the noise floor [TARGET: +6 dB].
- **Negative control:** the same scene with `dither_mode:"off"` **must FAIL**. If it doesn't, the validator is miscalibrated, and the result is `ERROR`.
- Production scenes run the same analysis over smooth regions they detect automatically (low gradient magnitude, large area). This version is a heuristic and caps at `WARN`.

### 6.5 Perception outputs for color
Written per evidence frame at the stride and at flagged frames. Listed in §11.
- **Luminance histograms** (linear and output, 256 bins)
- A **clipping map** of pixels above 1.0 before the tone map, and pixels clipped at 0 or 255 after it
- The **banding report**
- An **out-of-gamut count**, meaning negative linear components after the grade

### 6.6 Color stress tests (Foundry evidence for "AE-class color")
These are recorded as measurements. They do not count as marketing claims until Raphael reviews them.
- Gradient banding (above).
- Linear-vs-sRGB blend correctness: a 50% black/white checker at a 1-px pitch, downsampled, must equal linear 0.5 (encoded 188) ±1. The `srgb` compat mode gives 128 by design.
- Additive light accumulation without clipping before the output transform.
- An exposure ±2 EV round trip that stays within 1 half-float ULP in the float readback.
- A color temperature sweep that stays monotonic in the R/B ratio.

**M2.2 pass:**
- `banding.v1` passes on `lab.gradient_banding`, and its negative control fails.
- The OETF/EOTF round trip of all 256 codes is exact.
- The stress tests are recorded.
- The parity results from M2.1 are re-run and unchanged, or the changes are explained.
- Byte determinism holds.

**Commit.**

---

## 7. M2.3: Motion blur

### 7.1 Model
These settings live at the comp level and apply to every layer with motion blur on, which matches the AE mental model:
- `motion_blur.enabled` (comp switch) and a per-layer `motionBlur: boolean` (layer switch).
- `shutter_angle` θ: an integer in degrees, 0–720. Default **180**.
- `shutter_phase` φ: an integer in degrees, −360 to 360. Default **−90**, which centers a 180° shutter on the frame time. Whether the default should instead be 0 (shutter opens at frame time) is an open question for Raphael.
- `samples` N: 8–16. Default 16 for `final`, 8 for interactive `draft`.

The **Foundry evidence path always renders with `quality:"final"`**, so preview, export, and worker stay byte-identical.

### 7.2 Exact sub-frame times
- At fps 30/1 the frame period is T = 1/30 s.
- For frame *i* and sample *k* ∈ [0, N), using stratified midpoints:
  `t(i,k) = i/30 + (φ/360)/30 + ((2k+1)/(2N))·(θ/360)/30`
- This is computed as an **exact rational**: numerator and denominator as BigInt, reduced by gcd, with denominator `30·360·2N`. It is converted to float64 seconds **once**, by a single division, before calling `buildSpatialFrame(doc, t)`.
- The manifest records every `(i, k, num, den)`. `motion_blur.samples.v1` recomputes them independently.
- Sub-frame times may fall outside `[0, frames)` near the ends. Evaluation clamps to the composition range, the clamp is recorded, and that layer counts as static over the clamped samples.
- θ = 0, or a disabled layer or comp, renders exactly the single frame time `i/30`. That output must be **byte-identical** to M2.2 output.

### 7.3 What blurs
- Sampling uses full composites: each sub-sample is a complete composite of the scene at t(i,k). That gives correct occlusion, camera blur, and parallax.
- **Static-layer optimization:** if a layer's evaluated state hash (transform, projected corners, opacity, content, mask field, effect params) is identical across all N samples, its contribution is rendered once and reused. Layers with `motionBlur:false` are evaluated at t = i/30 for all samples. They render unblurred, but still composite correctly with blurred layers.
- Camera motion blurs every layer that moves relative to the camera when the comp switch is on, following AE semantics. A layer with its own switch off stays sharp.
- **Text.** Motion blur on text is allowed. The M1 text rules (whole-word fade + 8–12 px rise) are unchanged. At hold frames the words are static, so `word_reveal.v1`'s "fully opaque at hold" still applies unchanged.

### 7.4 Accumulation precision
- **Preferred:** sum the N premultiplied linear composites into an **RGBA32F** target with additive blend. This needs `EXT_float_blend`, or ping-pong add passes otherwise. Divide by N in the resolve pass.
- **Fallback, if RGBA32F is not renderable (Step 0):** pairwise tree reduction in RGBA16F, pairing (0,1), (2,3), and so on. This bounds the error to about log2(N) half ULPs. Record which path was used in `render_caps.json`. Never accumulate N samples sequentially in 16F.
- The sum is divided by N and goes through the grade, the output transform, and dither (§6) once.

### 7.5 Motion-blur validators
- **`motion_blur.samples.v1`** (hard): the manifest's sub-frame time list equals the §7.2 formula exactly (rational compare). N, θ, and φ match the settings, and N stays within the 8–16 range.
- **`motion_blur.shutter.v1`** (hard, on `lab.motion_blur_chart`): a 64-px white square moves at a constant v px/frame (v ∈ {4, 16, 48}) over black, under several shutter settings (θ ∈ {90, 180, 360}). The validator measures the blur length from the linear luminance profile along the motion axis, as the 1%–99% extent minus the square width. It must equal `v·θ/360` ± max(1 px, 3%). The blur **centroid** must sit at the square's position at t = i/30 + (φ + θ/2)/360/30, ±0.5 px.
- **`motion_blur.direction.v1`** (hard on the chart, heuristic `WARN` on production scenes): the chart has squares moving at 0°, 30°, 90°, and 135°. The blur axis comes from the structure tensor of the blurred edge region and must match the motion vector within ±2°. On production scenes, the direction from the motion-vector buffer (§7.6) is compared with the measured blur axis for each object.
- **`motion_blur.static.v1`** (hard): pixels of layers whose state hash is constant across the shutter are **byte-identical** to the θ=0 render, wherever no moving layer overlaps them (overlap is derived from per-sample coverage). This catches "blur on static layers" and accumulation precision drift.
- **`motion_blur.energy.v1`** (hard on the chart): the total linear luminance of the moving square equals the unblurred total within ±0.5%.
- **`judder.heuristic`** (`WARN`): a layer moving more than `judder_px_per_frame` [TARGET: 24 px] with blur off, or a fast camera move with the comp switch off.

### 7.6 Perception outputs for motion
- `perception/motion/f####.json`: for each tagged object, the screen-space motion vector over the shutter (from the projected-corner positions at shutter open and close), the max blur length in px, the direction, and whether it was treated as static.
- `perception/motion/f####_blurmap.png`: a heat map of the per-pixel blur length, made by rasterizing the per-object motion magnitude through the coverage. This is what lets the AI *see* motion that a still frame hides.
- The contact sheet gains an optional motion overlay mode. The base contact sheet stays byte-unchanged, and overlays are separate files.

### 7.7 Gate specific to M2.3
If Step 0 §3.1.6 found systems whose evaluation is not continuous-time, M2.3 implements blur only for continuous systems. Every non-continuous system is listed and gets `UNSUPPORTED` in `motion_blur.samples.v1` detail, along with a proposal (sub-stepping or deterministic replay) for Raphael to decide on. Do not fake blur for those systems by smearing after the fact.

### 7.8 Performance [TARGET]
- Unblurred final frame at 1080×1920 on a real GPU: ≤ 50 ms. Blur at N=16: ≤ 16× the unblurred frame time + 20%. The static-layer cache should make typical recipe scenes ≤ 6×.
- On SwiftShader, record the numbers and size `render_timeout_s` and `run_wall_clock_s` from them. M1's 1800 s ceiling stays unless Raphael raises it.
- Missing a perf target is `WARN` with numbers. Exceeding a run budget is `BLOCKED`/`BUDGET_EXHAUSTED` (M0).

**M2.3 pass:**
- All the motion-blur validators pass on `lab.motion_blur_chart`.
- θ=0 is byte-identical to the M2.2 output.
- Byte determinism holds over 5 repeats, and the parity pairs are identical.
- The perf numbers are recorded.

**Commit.**

---

## 8. M2.4: Texture stack over mask fields

### 8.1 Building blocks
These are general, not collage-specific. Each one is a registered effect with a typed param schema (v3), applied per layer in a defined order: `field → generators → displacement → paper/grain → light`.

| Effect | Params (all bounded) | Notes |
|---|---|---|
| `noise.value` / `noise.gradient` / `noise.cellular` | scale px, octaves 1–8, lacunarity, gain, evolution speed, seed | integer-hash based; tileable variant optional |
| `noise.fbm_turbulence` | as above + turbulence/ridged flag | |
| `displace.map` | source (noise / layer luma / mask-field SDF), `max_px` (0–64), axis weights, edge mode `clamp|mirror|transparent` | output offset is clamped to `max_px` in-shader |
| `grain.film` | amount, size px (0.5–3), luminance response curve (shadows/mids/highlights), chroma amount, `boil` frames (1 = every frame, k = hold k frames), seed | applied in linear before the output transform; seeded per frame/boil-step |
| `paper.procedural` | tooth scale, fiber density, fiber length, height strength, relief light angle, tint, seed | generates a height + albedo pair; in M2.4 the height is shaded by a fixed directional relief term in the effect; M2.5 binds it to the scene's key light |
| `paper.texture` | asset ref (synthetic fixtures in M2), scale, offset seed, multiply/height mode | random per-instance offset/rotation avoids visible repeats |
| `edge.deckle_field` | amplitude px, frequency, fiber-rim width 2–3 px, seed | consumes the mask-field SDF; produces a modulated field (torn edge) + rim albedo; supersedes M1 mask-path-only deckle when used, path deckle stays valid |
| `halftone` | cell px, angle, shape dot/line, field-driven size | needed by `editorial.cutout_pop` |

**Mask fields drive every effect.** Each effect has a `field` input:
- the layer's mask field
- its SDF band (`edge_band_px`)
- layer luma
- another layer's alpha (by stable id)
- a noise field
- a constant

Effect strength is multiplied by the field, so all modulation is spatial and explicit.

### 8.2 Seeding (deterministic, unique)
- `seed(effect instance) = u32(sha256(scene.seed ‖ layer_stable_id ‖ effect_id ‖ instance_index))`. This extends M1's rule of a derived seed per tear edge.
- Temporal effects mix in `floor(frame / boil)`.
- Sub-frame motion-blur samples use the **same** seed as their frame, so grain is not smeared into mush. This is a documented choice: grain is a per-frame, film-stock property.

### 8.3 Texture validators
- **`texture.seed_reproducible.v1`** (hard): the same seed and params give byte-identical effect output in the pinned environment, across 5 launches and across hosts.
- **`texture.seed_unique.v1`** (hard; generalizes `tear_seed_unique.v1`):
  - No two effect instances in a scene share a derived seed.
  - Consecutive same-type instances have a normalized cross-correlation of their generated fields ≤ 0.2 [TARGET].
  - Paper or texture assets reused on adjacent layers must differ in offset or rotation.
- **`displacement.bounds.v1`** (hard): from the float readback of the displacement offset buffer, max |offset| ≤ `max_px` + 0.01. Under `transparent` edge mode, no pixel samples from outside the source bounds. Under `clamp` and `mirror`, the edge behavior matches the mode on a test chart.
- **`grain.stats.v1`** (hard on `lab.texture_swatches`, heuristic on production):
  - On a flat mid-grey patch, measured in linear: grain mean within ±0.002 of 0.
  - Standard deviation within ±10% of the requested amount at that luminance, per the response curve.
  - Spatial autocorrelation length within ±20% of `size`.
  - The frame-to-frame correlation is ≈1 within a boil step and ≤ 0.1 across steps.
- **`texture.field_containment.v1`** (hard): pixels where the driving field = 0 are byte-identical to the effect-bypassed render.
- **`paper.no_tiling.v1`** (heuristic `WARN`): the autocorrelation of a large paper area shows no secondary peak above 0.5 at the asset's tile period.

### 8.4 Interaction with occlusion and text (hard rules, carried from M1)
- Effects on **protected** ids (M1 `ms_scene.protected`) are `FORBIDDEN_OP`.
- A new pixel-level validator, **`occlusion_coverage.v1`** (hard), checks that the occluder's rendered alpha over each protected region is ≥ the base render's alpha at every frame, within 1/255. This catches displacement, grain, or deckle effects that would uncover a covered face. The asset and mask hash check from `occlusion_preserved.v1` still runs as well.
- **Displacement on required text is `FORBIDDEN_OP`**, because it would distort the letterforms. Grain and paper multiply on text are allowed. `text_contrast.heuristic` (`WARN`) flags required text whose local contrast against its backdrop drops below a threshold [TARGET: WCAG-style 3:1 on the composited result] after texturing.

### 8.5 Perception outputs for textures
For each textured layer at stride frames: previews of the field and SDF, the displacement magnitude map, grain statistics (mean, std, autocorrelation), and the seed table.

**M2.4 pass:**
- All the texture validators pass on `lab.texture_swatches`, and seeded negative fixtures fail:
  - a duplicate seed
  - displacement over `max_px`
  - grain std doubled
  - an effect leaking outside its field
  - a deckle uncovering a protected region
- Byte determinism and parity hold.

**Commit.**

---

## 9. Real-GPU tolerance comparison (support level, not a deterministic PASS)

On user GPUs, frames are compared with the SwiftShader reference within a tolerance. Under M0 §6, this is a **separately labeled support level** that **never counts as deterministic PASS**. Contract `foundry.gpu_tolerance/0.1`:
```json
{"schema":"foundry.gpu_tolerance/0.1","reference":{"backend":"webgl2","renderer":"<SwiftShader string>","render_id":"r_…"},
 "candidate":{"backend":"webgl2","renderer":"<GPU string>","driver":"…"},
 "support_level":"TOLERANCE","thresholds_id":"gpu_tolerance.v1","frames":[0,45,90,135,179],
 "results":[{"frame":45,"status":"PASS","metrics":{"max_abs_8bit":3,"p999_abs_8bit":1,"pct_gt_2":0.04,"psnr_db":51.2,"ssim_y":0.9991,"diff_bbox":[0,0,0,0]}}]}
```
(Values in the example are illustrative placeholders, not measurements.)

**Metrics** (computed on the 8-bit output, and also on the float readback where it is available):
- max abs channel difference
- 99.9th-percentile abs difference
- the percent of pixels differing by more than 1, 2, and 4 LSB
- PSNR over RGB
- SSIM on linear-Y, using an 11×11 Gaussian window with σ = 1.5
- the diff bounding box

Dither noise uses integer hashing, so it is expected to be identical across GPUs **[ASSUMED, verify in §3.5]**.

**How the thresholds are chosen.** These are [TARGET] numbers until calibrated:
1. **Calibration set:** all `lab.*` scenes plus the M1 and M2 recipe fixtures, rendered on SwiftShader and on every available real GPU (§3.5), with 3 repeats each.
2. **Provisional thresholds:** the worst observed value per metric × 1.5, bounded by max_abs ≤ 4, PSNR ≥ 45 dB, and SSIM ≥ 0.995 (the looser of the two never wins; if the observed worst case already violates these bounds, report it, do not loosen).
3. **A discrimination check is mandatory.** The seeded regressions from §5.2 plus three color-specific ones (a gamma applied twice, a missing dither, a wrong blend mode on 10% of the frame) must each FAIL the thresholds. If any passes, tighten the thresholds and repeat. If you can't find thresholds that both admit all real GPUs and catch every regression, report `BLOCKED` with the numbers and do not pick a compromise.
4. **Record the result** in `config/gpu_tolerance.v1.json` (versioned and hashed) along with the calibration data.
5. If no real GPU was available, label the thresholds `[ASSUMED]` and the support level `NOT_RUN`.

A GPU that fails tolerance is reported per driver. It is never "fixed" by loosening thresholds within a run.

---

## 10. Schemas, contracts, and error codes (v3; v1 and v2 frozen)

### 10.1 Foundry-side (new v3 files, following M1's v2 naming convention as Step 0 records it)
- **Scene/recipe v3:**
  - adds `render` (`backend`, `precision:"f16"`, `blending_gamma`, `dither_mode`, `supersample`)
  - adds `motion_blur` (`enabled`, `shutter_angle`, `shutter_phase`, `samples`, `quality`)
  - adds per-layer `motionBlur`
  - adds `effects[]` (§8.1 effect schemas with bounds) and `fields[]`
  - v1 and v2 documents still validate against their frozen schemas, and v2 → v3 is a pure, tested upgrade
- **`foundry.recipe/0.2`** (new file next to `0.1`) adds `capabilities[]`, the capability ids the recipe exercises (§13), and recipe-scoped blur and effect bounds.
- **`foundry.evidence/0.1`** manifest: unchanged schema. New evidence files go in as additional hashed entries under an `extras` map (if the 0.1 schema allows additional properties). If it doesn't, add `foundry.evidence/0.2` as a new file and leave 0.1 frozen.
- **New contracts:**
  - `foundry.render_caps/0.1`: §3.2 record plus flags, accumulation path, shader registry hash
  - `foundry.render_parity/0.2`: adds `mode: compat|linear`, metric gates, intentional-difference attributions
  - `foundry.gpu_tolerance/0.1` (§9)
  - `foundry.perception/0.1` (§11)
  - `foundry.motion_blur/0.1` (sub-frame table)
- **Identity.** `render_id` additionally hashes the backend kind, the renderer string, the pinned flags, the shader registry hash, the tolerance and parity config ids, and the render settings. `revision_id` is unchanged in rule.

### 10.2 Repair allowlist `repair-allowlist.motion-suite.v2` (new file; v1 frozen)
These ops are added on top of v1. Each bound is intersected with the recipe's bounds.

| op | target | type / bounds |
|---|---|---|
| `set` | `motion_blur.shutter_angle` | int 0–360 (recipe may narrow; 360–720 only if recipe allows) |
| `set` | `motion_blur.shutter_phase` | int −360–360 |
| `set` | `motion_blur.samples` | enum {8, 12, 16} |
| `set` | `layers.<id>.motionBlur` | bool; not on protected ids |
| `set` | `effects.<id>.amount` / `grain.amount` | 0–1 |
| `set` | `effects.<id>.grain.size` | 0.5–3 |
| `set` | `effects.<id>.displace.max_px` | 0–recipe max (≤ 64) |
| `set` | `effects.<id>.noise.scale` / `octaves` | recipe bounds / int 1–8 |
| `reseed` | `effects.<id>` | replaces instance_index salt; must yield a new unique seed |
| `set` | `render.blending_gamma` | enum `linear|srgb` (only if recipe allows) |

**Forbidden** (`ERROR`/`FORBIDDEN_OP`):
- the dither mode, the shader registry, tolerance and parity configs, the backend, pinned flags, or `quality`
- effects on protected ids, or displacement on required text
- adding an effect type the recipe doesn't declare
- raising samples above 16 (`OUT_OF_BOUNDS`)
- all M1 forbidden ops (including any fps change)

A wrong type is `TYPE_INVALID`, and an out-of-range value is `OUT_OF_BOUNDS` (M0/M1).

### 10.3 Product-side (Motion Suite)
Render settings and effects have to persist somewhere in the product. Step 0 identifies where that could go. If it requires a `MotionDocument` field addition, the builder must **stop and propose** the exact diff for Raphael's approval: a `schemaVersion` 4 → 5 forward migration, round-trip tests, and v4 documents rendering byte-identically on the legacy renderer. Until that is approved, M2 passes settings out-of-band from the Foundry's v3 scene into the GPU renderer entry point, and the product document format stays untouched.

### 10.4 Reason codes
M1 forbade new reason codes inside M1. M2 declares exactly these, all under existing statuses (no new statuses):

| status | reason_code | when |
|---|---|---|
| `BLOCKED` | `GPU_UNAVAILABLE` | WebGL2 context cannot be created in a required host |
| `BLOCKED` | `FLOAT_TARGET_UNSUPPORTED` | RGBA16F not color-renderable |
| `BLOCKED` | `PRECISION_INSUFFICIENT` | HIGH_FLOAT not fp32 |
| `ERROR` | `BACKEND_MISMATCH` | renderer string ≠ pinned SwiftShader in an evidence render (prevents silent real-GPU or fallback evidence) |
| `ERROR` | `CONTEXT_LOST` | context loss during a render; no partial frame is ever written |
| `ERROR` | `SHADER_COMPILE_FAILED` | a registry shader fails to compile or link (log attached) |

Everything else uses existing codes plus `detail`. Examples: tolerance failures are `FAIL` with `detail:"TOLERANCE_EXCEEDED psnr_db=…"`, a banding failure is `FAIL` from `banding.v1`, missing authorization is `BLOCKED` with `detail:"AWAITING_AUTHORIZATION"`, and a lit document in GPU mode before M2.5 is `UNSUPPORTED` with `detail:"LIT_PATH_PENDING_M2.5"`.

---

## 11. Foundry perception layer: what a connected AI can see

Everything listed is written under `renders/<render_id>/<attempt_id>/perception/`, SHA-256-hashed into the manifest, and covered by `foundry verify` (M0). It is produced at contact-sheet stride frames plus every frame that any validator flags.

| Output | Content | Feeds |
|---|---|---|
| `render_caps.json` | backend, renderer string, extensions, flags, accumulation path | identity, `BACKEND_MISMATCH` |
| `color/f####_hist.json` (+ `.png`) | linear + output luminance histograms | AI review of exposure/contrast |
| `color/f####_clip.png` | pre-tone-map >1.0 and post-encode 0/255 clip map | highlight/shadow review |
| `color/banding.json` | per-region run-length + spectral banding report | `banding.v1` |
| `motion/f####.json`, `_blurmap.png` | per-object motion vectors, blur length/direction, static flag | blur validators, AI motion review |
| `texture/<layer>/f####_field.png`, `_disp.png`, `grain.json`, `seeds.json` | fields, displacement magnitude, grain stats, seeds | texture validators |
| `parity/…` | diff heat maps (compat, linear, tolerance) | parity review |
| `layers/f####.json` | per-layer raster scale, cache hit, effect stack, blend mode, matte | `raster_resolution.v1`, AI debugging |

Validators added in M2 beyond §6–§8:
- **`raster_resolution.v1`** (hard): no layer is rasterized below 1.0× its on-screen scale at any frame, apart from the 2^(1/4) quantization.
- **`render_caps.v1`** (hard): the evidence renderer string matches the pinned SwiftShader, and the recorded flags equal the config.

The `ReviewRequest` (M0) may attach these files. The small-context rule (±15 frames) still applies, and attachments stay a recipe-chosen subset.

---

## 12. M2.5 and M2.6: Lit-path migration, recipes, live loop

Until M2.5 lands, lit documents in GPU mode return `UNSUPPORTED`/`LIT_PATH_PENDING_M2.5` and keep rendering on the legacy path. M2.1–M2.4 fixtures are unlit.

### 12.1 M2.5: Migrate the lit path (one renderer)
1. **Port** the CPU float lit path (Step 0 §3.1.3) to registry shaders:
   - lights and `lighting.*`
   - surface shadows (`shadowOpacity`, `shadowSoftness` 0–1, `shadowReceiverGap`, `shadowColor`)
   - exposure, tone map, vignette, and temperature through §6.2
   - binding the `paper.procedural` relief term (§8.1) to the scene key light
2. **Dual-run** with `renderer.lit: "cpu-legacy" | "gpu"`. The default stays `cpu-legacy` until parity is accepted.
3. **Parity gate:** GPU lit vs CPU-float lit, both in float, on every lit fixture and `lab.lit_parity`. Measure on the 8-bit output: max abs ≤ 2/255, PSNR ≥ 48 dB, SSIM(Y) ≥ 0.998 [TARGET, calibrated as in §5.2 with seeded lit regressions: light moved 1 px, shadow softness +0.05, exposure +0.1 EV, wrong tone-map operator]. Differences must be explained by float32-vs-float64 or sampling. Anything else is a semantic mismatch, so stop.
4. **Retirement:** after Raphael accepts the parity report, the GPU path becomes the lit path behind the selector. The CPU path stays in the repo as a **reference oracle**, used only in tests. Deleting the CPU path is a separate authorization and is not part of M2.
5. **Performance [TARGET]:** a lit 1080×1920 frame on a real GPU ≤ 100 ms, against the CPU path time Step 0 measures. On SwiftShader, record the time. A target that isn't met is `WARN` with the numbers.

**M2.5 pass:**
- The lit parity gate is met.
- The lit fixtures are byte-deterministic and parity-identical across preview, export, and worker.
- Perf numbers are recorded for both paths.

**Commit.**

### 12.2 M2.6: Recipes (`foundry.recipe/0.2`)
- **Style recipes (upgrade the M1 starter pack):**
  - **`paper-collage.build_tear` v0.2**:
    - capabilities: `paper.procedural`, `edge.deckle_field` over the mask-field SDF, `grain.film` with `boil:2`, and drop shadows via the GPU lit path
    - motion blur on the drops and on `transition.tear_away`, at shutter 180/−90
    - the M1 text rules and occlusion protection apply unchanged
  - **`editorial.cutout_pop` v0.2**:
    - capabilities: `halftone` driven by a field behind the subject, a shadow that grows on lift, motion blur on the lift, grain, and a whole-word large serif headline
    - fonts per M1 §7: bundled OFL fonts on the Foundry harness side, or the IBM Plex fallback, recorded
- **Generality recipe (non-documentary):**
  - **`kinetic.product_title`**: a high-energy title and product-reveal piece.
  - capabilities: a fast whip-pan camera move with heavy motion blur (θ up to 270), additive glow (add/screen blend in linear), a light sweep across a glossy plate (lit path), a displacement-wave transition on non-text layers, linear gradients under the banding check, and a luma track matte reveal on a *shape* layer
  - Its text follows the global whole-word rules unless Raphael changes them (open question).
  - Its job is to prove the blocks aren't documentary-bound.
- **Lab (capability exemplar) recipes:** these are test cards, and each is the "at least one recipe" for capabilities no style recipe covers:
  - `lab.blend_matrix`: every blend mode × 3 opacities × both blending gammas, and every matte type
  - `lab.gradient_banding`: §6.4
  - `lab.motion_blur_chart`: §7.5
  - `lab.texture_swatches`: every §8.1 effect over every field type
  - `lab.lit_parity`: lights, shadow softness sweep, exposure/tone-map/vignette/temperature sweeps

Lab recipes are built in the milestone that needs them (M2.1–M2.5); M2.6 adds the style and generality recipes. **Every recipe** has: a manifest, a deterministic compiler, positive fixtures, seeded-defect fixtures, its `validators[]`, its `allowed_ops`, and `capabilities[]`.

### 12.3 Mock loop, then live Kimi loop
- **Scene:** `paper-collage.build_tear` v0.2 with seeded M2-specific defects:
  1. Banding in a deep vignette gradient, planted by setting grain to 0 and using a fixture-only `dither_mode:"off"` override. `banding.v1` FAILs. `dither_mode` itself is not repairable, so the expected fix is through the allowlist, e.g. raising `grain.amount` until `banding.v1` passes. That tests whether the AI can see banding.
  2. `shutter_angle` 720 on a caption-adjacent drop, above the recipe bound of 270. The recipe-bound check fails (`OUT_OF_BOUNDS` against the recipe) and the caption gets a `text_contrast` `WARN`. The expected fix is `set shutter_angle` within bounds.
  3. A duplicate deckle seed on consecutive tears. `texture.seed_unique.v1` FAILs. The expected fix is `reseed`.
  4. A displacement `max_px` that pulls the occluder off a protected covered face. `occlusion_coverage.v1` FAILs. The naive fix is forbidden, so the correct fix lowers `max_px`.
- **Mock first:** `closed_loop:"MOCK"` reaches PASS.
- **Live:** re-run the Kimi canary (`VERIFIED_ATTACHMENT`). The live run has to reach an independent `foundry verify` PASS with no regressions, no human edits, and `closed_loop:"LIVE"`. The ReviewRequest attaches the contact sheet plus the relevant perception files (banding report, blur map, seed table). The 3-attempt limit applies; if four defects can't be fixed in 3 attempts, the run may batch ops per proposal, and the report states how many attempts were used.
- **Optional:** the same scene through Gemini (`agy`) as the M1b protocol. If it isn't `VERIFIED_ATTACHMENT`, it is `BLOCKED`/`NO_VISION_TRANSPORT`. It is not required for M2.

**M2.6 pass:**
- All recipes compile, render, and validate.
- The mock loop reaches PASS, and one live Kimi loop reaches an independent PASS.
- 5/5 uncached repeats are identical.
- The full suite is green.

**Commit. Stop.**

---

## 13. Capability coverage matrix (each row must have a validator AND a recipe)

| Capability | Milestone | Validator(s) | Recipe(s) |
|---|---|---|---|
| GPU backend + caps record | M2.0/2.1 | `render_caps.v1` | all |
| Layer raster + upload at correct scale | M2.1 | `raster_resolution.v1` | all; `kinetic.product_title` (push) |
| Linear float compositing | M2.1 | oracle tests, `render_parity/0.2` | `lab.blend_matrix` |
| Blend modes (each) | M2.1 | oracle tests | `lab.blend_matrix`; add/screen in `kinetic.product_title` |
| `blending_gamma` linear/srgb | M2.1 | parity (compat), checker stress test | `lab.blend_matrix` |
| Track mattes (4 types) | M2.1 | oracle tests | `lab.blend_matrix`; luma matte in `kinetic.product_title` |
| Mask field + feather + SDF | M2.1 | oracle tests, `texture.field_containment.v1` | `lab.texture_swatches`; `paper-collage.build_tear` |
| sRGB↔linear, output transform | M2.2 | round-trip test, color stress tests | `lab.gradient_banding` |
| Dithering | M2.2 | `banding.v1` (+ negative control) | `lab.gradient_banding`; all exports |
| Color perception (histograms, clipping) | M2.2 | hashed outputs verified by `foundry verify` | all |
| Motion blur (shutter angle/phase/samples) | M2.3 | `motion_blur.samples/shutter/direction/static/energy`, `judder.heuristic` | `lab.motion_blur_chart`; `kinetic.product_title`; `paper-collage.build_tear` |
| Noise (value/gradient/cellular/fBm) | M2.4 | `texture.seed_reproducible/unique.v1` | `lab.texture_swatches` |
| Displacement | M2.4 | `displacement.bounds.v1`, `occlusion_coverage.v1` | `lab.texture_swatches`; `kinetic.product_title` |
| Film grain | M2.4 | `grain.stats.v1` | `lab.texture_swatches`; `paper-collage.build_tear`; `editorial.cutout_pop` |
| Paper (procedural/texture) | M2.4 | `paper.no_tiling.v1`, seed validators | `paper-collage.build_tear`; `lab.texture_swatches` |
| Deckle edge field | M2.4 | `texture.seed_unique.v1`, `occlusion_coverage.v1` | `paper-collage.build_tear` |
| Halftone | M2.4 | `texture.field_containment.v1`, seed validators | `editorial.cutout_pop`; `lab.texture_swatches` |
| GPU lit path (lights, shadows, grade) | M2.5 | lit parity gate | `lab.lit_parity`; `editorial.cutout_pop`; `kinetic.product_title` |
| Real-GPU tolerance support | M2.1–2.5 | `foundry.gpu_tolerance/0.1` | calibration set (all `lab.*` + recipes) |
| Text-legibility under texture/blur | M2.4 | `text_contrast.heuristic` (WARN) | `paper-collage.build_tear`; `editorial.cutout_pop` |

If implementation adds a capability that has no row here, add a row with a validator and a recipe, or remove the capability.

---

## 14. Acceptance tests and stop rules

**Existing:** all 86 must pass at every milestone commit. Legacy `npm run golden` must stay unchanged from the base.

**New tests** (minimum):
- **Step 0 (M2.0):** the probe harness itself is tested with a mock context.
  - A missing extension must yield `BLOCKED`/`FLOAT_TARGET_UNSUPPORTED`.
  - A non-SwiftShader string must yield `ERROR`/`BACKEND_MISMATCH`.
  - HIGH_FLOAT precision below 23 must yield `BLOCKED`/`PRECISION_INSUFFICIENT`.
- **Backend:**
  - Mock-backend graph snapshots are stable.
  - Shader registry hash changes → new `render_id`.
  - A scene string can't reach shader source (static check).
  - Context loss mid-render → `ERROR`/`CONTEXT_LOST`, and no frame file is written.
- **Compositing:** an oracle test per blend mode, matte, and mask mode. Premultiply round trip. Compat parity gate. Each seeded regression fails parity.
- **Color:**
  - All 256 codes round-trip exactly.
  - `banding.v1` passes with dither on and fails with dither off.
  - Dither leaves alpha alone and leaves exact 0/255 flats unchanged.
  - Dither is deterministic.
  - The checker-downsample test gives 188±1 linear and 128±1 compat.
- **Motion blur:**
  - The rational sub-frame table matches the formula for N ∈ {8, 12, 16}, θ ∈ {0, 90, 180, 360, 720}, φ ∈ {−180, −90, 0}.
  - θ=0 is byte-identical to the unblurred render.
  - The shutter, direction, static, and energy validators pass on the chart, and seeded wrong-θ and wrong-φ renders fail them.
  - Samples=17 → `OUT_OF_BOUNDS`.
  - Out-of-order seek with blur on matches sequential capture.
- **Textures:**
  - Seed reproducibility, seed uniqueness, displacement bounds, grain stats, and field containment each have positive and negative fixtures.
  - Displacement on required text → `FORBIDDEN_OP`.
  - An effect on a protected id → `FORBIDDEN_OP`.
  - `occlusion_coverage.v1` catches an uncovered protected region.
- **Lit:** the parity gate plus the seeded lit regressions fail.
- **Schemas:** v1 and v2 fixtures still validate. The v2→v3 upgrade is pure. The v3 allowlist bounds, including type and bounds negatives, are tested.
- **Determinism:** 5 uncached repeats are identical for every recipe fixture. Preview, export, and worker are byte-identical at 5 frames per fixture.
- **Boundary:** in `motion-foundry`, `git diff b52aebd..HEAD` touches no M0/M1 contract, test, or v1/v2 schema file. In Motion Suite, `git diff --name-status <base>..foundry/m2-renderer` touches only the Step 0–listed renderer paths plus new files, and the goldens directory is unchanged.

**Stop and report (never improvise):**
- any Step 0 gate failure
- a semantic mismatch: an unexplained parity difference, a different grade order, non-continuous evaluation (for blur), or a legacy blend formula that doesn't match its documentation
- a needed product document schema change
- a need to edit a file outside the authorized paths
- a determinism failure
- thresholds that can't discriminate the seeded regressions
- budget exhaustion

A clear `BLOCKED` beats an inflated PASS. Never report a number you didn't measure, and tag every reported figure OBSERVED (with its command) or TARGET.

---

## 15. Roadmap after M2 (not built in M2, nothing cut)

Each item follows the same rule: it ships with Foundry validators and at least one recipe, and claims stay unverified until measured. Order to be agreed with Raphael:
1. **Graph editor** on the existing curve engine. Validators: curve continuity, overshoot bounds, speed-graph monotonicity where declared.
2. **Precomps and nesting ergonomics.** Collapse transformations, per-precomp motion blur and render settings, and nested time remapping, validated by nested-render parity.
3. **2.5D camera and DOF stress tests.** These test the "90%+ of AE camera" claim: a camera push with DOF, parallax depth ordering, focal-plane accuracy, and bokeh energy conservation.
4. **Tracking and roto.** Point and planar tracking, AI cutout to mask field, and roto edge refinement, with tracking-error and edge-stability validators.
5. **Effects/plugin ecosystem.** A registered effect API on `GpuBackend` with an effect manifest, sandboxed shader registry entries, and a validator per effect.
6. **HDR, 32-bit, wide gamut.** A float32 working mode, Display P3 and Rec.2020 output transforms, HDR export, and ACES-style tone mapping, with color stress tests extended.
7. **WebGPU backend.** Implements `GpuBackend` and uses compute for blur accumulation and particles. Parity: byte-identity under its own pinned software adapter if one exists (to verify), otherwise tolerance vs WebGL2.
8. **Studio compositor** moved onto the pipeline, which closes the measured M1 Studio gap.
9. **Raphael's unique features.** This waits on his list. Each goes into the master capability map with a validator and a recipe.
10. **Master capability map** document covering everything comparable to AE plus everything unique, with status and the Foundry check for each. It is requested and waiting on item 9.

---

## 16. Done definition

M2 is done when all of the following hold:
1. M2.0–M2.6 are each committed with a report.
2. A single GPU pipeline (WebGL2, RGBA16F, linear) renders unlit and lit Motion Suite scenes through the product's own evaluation.
3. Preview, export, and worker are byte-identical under pinned SwiftShader, and 5/5 uncached repeats are identical for every recipe.
4. The compat parity, lit parity, and tolerance thresholds are calibrated and shown to discriminate the seeded regressions (tolerance may be `NOT_RUN` if no real GPU was available, labeled as such).
5. Every §13 row has a passing validator and a recipe.
6. One live Kimi loop on `paper-collage.build_tear` v0.2 reaches an independent PASS with no regressions.
7. The 86 existing tests plus all new tests pass, and the legacy goldens are unchanged.
8. Motion Suite changes are confined to `foundry/m2-renderer` and the authorized paths, with the legacy renderer still the default.
9. Spend is zero.

Report each capability as SPECIFIED, TESTED, or LIVE-VERIFIED.
