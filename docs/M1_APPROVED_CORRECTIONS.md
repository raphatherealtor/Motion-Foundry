# M1 approved corrections

Raphael approved these corrections in this topic on 2026-11-10. They supersede the reference brief; the M1 spec and kickoff now incorporate FPS, softness and v2-ID corrections; original ZIP remains the source reference. Step 0 semantic gate is cleared. Product base remains 25cb5454d1f14f889d36c79dec3965a95f7b2c99, Path A.

- Product FPS changes preserve elapsed time. Foundry accepts only 30/1; proposed FPS changes are FORBIDDEN_OP. Exact rational boundary conversion uses integer arithmetic; noninteger frame results are TYPE_INVALID with detail.
- Shadow softness is normalized 0–1. Out-of-bounds proposals yield OUT_OF_BOUNDS. Remaining differences are reported below without stopping.
- Frozen M0 schemas, validators, allowlist and tests remain unchanged. M1 gets new versioned operation-envelope v2 and allowlist v2 files, with its own ID.
- Chromium 153 is installed only under Foundry tooling, and product goldens are rerun without baseline updates. M0 retains its 131 installation; five additional uncached M0 repeats use the M1 browser. If installation fails, parity is BLOCKED and Foundry rendering remains explicitly unverified.
- Motion Suite stays unchanged. Authorization for additive files on foundry/m1-adapter remains conditional on Path A being infeasible; it has not been exercised.

## Bound audit

Evidence: product src/motion/host/validation.ts:8–52 and Foundry src/gate.ts:7–9. All product references use the pinned SHA above. Foundry repair restrictions may be narrower than product capabilities.

| Logical target | Foundry bound | Product domain / mapping |
|---|---|---|
| transform.x/y | integer canvas extent | finite number; same names |
| transform.scale | 0.25–3 | no scalar scale; lower to scaleX/scaleY (uniform) |
| transform.rotation | -30–30 degrees | rotationZ, finite number |
| transform.z | -2000–2000 | z, finite number |
| text.fontSize | integer 40–160 | flat fontSize 1–800 |
| text.letterSpacing | -2–10 | flat letterSpacing, finite number |
| text.lineHeight | 0.9–1.6 | flat lineHeight 0.1–10 |
| layout.align | left/center/right | flat textAlign enum |
| layout.maxWidth / wrap | omitted | no native fields; no guessed mapping |
| surface.shadowOpacity / shadowSoftness | 0–1 | same 0–1 |
| lighting.exposureEV | -2–2 | product -16–16; retain narrower repair bound |
| lighting.vignette | 0–1 | same 0–1 |
| camera push | at most 2.5x | no product zoom scalar; derive checked FOV/distance relative to base; omit generic camera value until mapped |
| shift_keyframes | integer +/-30, preserve order/range | rational keyframe time; lower exact frames/30 |
| set_stagger | 0.15–0.35 seconds | recipe parameter, no native op; at 30fps only exact grid points 5–10 frames accepted |
| set_easing | product enum | linear, ease-in, ease-out, ease-in-out, hold, spring, bounce, elastic, bezier; bezier requires validated handles |
| apply_recipe | registered recipe and valid params | no native op; compile candidate scene, existing assets only |

The new allowlist ID is repair-allowlist.motion-suite.v2. Proposal schema foundry.repair_proposal/0.2 uses operation-envelope v2; reviews use foundry.review_request/0.2. No M1 payload is passed to M0's v1 schema. Status and reason-code vocabulary remains M0's.
