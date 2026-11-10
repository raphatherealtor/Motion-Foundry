# M2 Step 0 findings — BLOCKED

No M2 renderer implementation has started. GPU probes and test suites are NOT_RUN because the semantic stop rule fired first. This is not a GPU capability failure.

## Corrections first

**CORRECTED — grade order changes semantics.** Current product `finishFrame` applies temperature and vignette before tone mapping, then sRGB encoding. M2 §6.2 specifies temperature → tone map → vignette. M2 §4's architecture diagram instead places vignette before tone mapping, matching the product. Those two sections disagree.

All product evidence below is pinned at **db36db39821f46ec4b7057bb431ffb9e82473c33**, current main at inspection, in `/root/projects/motion-suite-m2`.

OBSERVED source:
- `src/motion/render/frameGrade.ts:47–55`: `encodeSrgbByte(toneMap(mode, data[i+c] * gains[c] * v))`.
- `src/motion/render/drawDocument.ts:266` selects the linear grade path; `:382` obtains lit radiance; `:395` calls `finishFrame`.
- `src/motion/render/linearLight.ts:50` applies exposure to layer radiance before final grade.
- `src/motion/render/lighting.ts:276–282`: Reinhard is `value/(1+value)`; ACES and clamp are also explicit.

These grade files are unchanged from the M1 product pin25cb5454. This is a brief/product mismatch, not a newly introduced product regression.

OBSERVED runtime discriminator: `node docs/m2_step0/grade-probe.cjs` transpiles the actual pure product modules in memory, with no edits or product dependency installation. For linear radiance1, neutral temperature, Reinhard and a0.5 corner vignette, the product emits RGB **156**, whereas the §6.2 order emits **137**. All four2×2 test pixels agree. This is source-function execution, not a rendered scene or a GPU test. Raw output: [grade-order.json](m2_step0/grade-order.json).

**CORRECTED — M2 repair ID collides with frozen M1.** M2 §2 freezes v1/v2 and permits only new v3 files, but §10.2 calls the new allowlist `repair-allowlist.motion-suite.v2` and describes v1 as its predecessor. That ID already exists in M1 at `src/adapters/motion-suite/schemas/repair-allowlist.v2.json:2`. Proposed clarification: preserve it and use a new `.v3` ID/file for M2. No schema or allowlist was changed.

**CONFIRMED — evidence0.1 cannot accept extras.** `schemas/EvidenceManifest.json:261` has `additionalProperties:false`. Follow M2 §10.1's already-declared alternative: a new evidence0.2 file; never add `extras` to frozen0.1.

## Base and authorization

OBSERVED: remote main advanced from M1's25cb5454 to db36db3. E3 remains de612e423bfe8aff37bd5dc29117cab72418da05 and is an ancestor of main (`git merge-base --is-ancestor`, exit0). The new checkout is detached at the selected SHA and clean;634 tracked files are present. Commands: read-only SSH `git ls-remote origin refs/heads/main refs/heads/claude/e3-highlight-render`, clone, detached checkout and ancestry/status checks. Details: [inspection.json](m2_step0/inspection.json).

Foundry branch `m2-gpu-renderer` was cut directly from b52aebd. Its M0/M1 source, tests, allowlists and schemas remain unchanged. Only handoff/reference documents and this read-only probe/report were added.

The M2 handoff authorizes Step0 only. Raphael's earlier M1 additive-file permission does not cover M2 renderer edits. No foundry/m2-renderer development branch was created, no product file was edited, and nothing was pushed or merged. M2.1+ remains BLOCKED with detail `AWAITING_AUTHORIZATION` even after the semantic correction is resolved.

## Stop rule and proposed correction

The handoff explicitly says in §6.2: **“If the orders differ, that is a semantic mismatch, so stop and report.”** Section14 repeats the semantic-mismatch stop rule. [Original M2 spec](m2-handoff/MOTION_FOUNDRY_M2_SPEC.md).

Recommended decision for Raphael:
1. Confirm that the actual legacy grade semantics are authoritative. Amend §6.2's final-grade order to temperature → vignette → tone map, consistent with §4 and product `finishFrame`. Do not reorder the product or its existing goldens. Per-layer exposure placement remains as observed and must be included in the remaining audit.
2. Reserve a new M2 `.v3` allowlist ID/file, leaving M1's `.v2` untouched.

These are proposed brief corrections only. They have not been applied to the attached spec or product. After confirmation, resume the remaining read-only Step0 checks. Request product-edit authorization only after a complete edit-path inventory and GPU gate are reviewable.

## Check coverage at stop

| Step0 item | Evidence/status |
|---|---|
| Base/heads/E3 ancestry | OBSERVED, confirmed at db36db3 |
| Graded draw and light exposure path | OBSERVED, cited above; complete Canvas context/state inventory pending |
| Precision/tone-map code | OBSERVED Float32 frame buffers, float64 JS arithmetic and explicit maps; no lit-frame performance measurement |
| Projection/blends/mattes/masks | NOT_RUN at this base; prior M1 facts are not relabeled as new observations |
| Continuous-time evaluation | NOT_RUN; no motion-blur eligibility claim |
| Host/mode and asset-decode audit | NOT_RUN at this base |
| GPU flags/caps/shader suite | NOT_RUN in every host; no tested flag set or renderer string |
| Five fresh launches/cross-host parity | NOT_RUN; zero GPU launches |
| Real GPU | NOT_RUN; no availability claim |
| Foundry86 / product Vitest / legacy goldens | NOT_RUN during M2.0; stopped on the earlier semantic gate. M1's86/86 remains historical evidence at b52aebd |

Machine-readable unrun records are `m2_step0/gpu_caps.preview.json`, `.export.json`, `.worker.json`. Missing measurements are not represented as a GPU failure or an8-bit/Canvas fallback.

## Provisional product paths

Observed relevant existing paths are `src/motion/render/frameGrade.ts`, `lighting.ts`, `linearLight.ts` and `drawDocument.ts`. These are not an authorized edit list: export/worker/selector paths and schema implications still need the interrupted audit. No MotionDocument migration, selector, GPU backend, v3 schema or shader has been implemented.
