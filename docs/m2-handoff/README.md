# Motion Foundry M2 handoff: GPU float render pipeline

| File | Purpose |
|---|---|
| `KICKOFF_PROMPT_M2.md` | Paste into Jackhammer / Codex first. |
| `MOTION_FOUNDRY_M2_SPEC.md` | Full M2 spec. It covers the Step 0 GPU gate, the `GpuBackend` interface, linear float16 compositing, color management and dither, motion blur, the texture stack, lit-path migration, real-GPU tolerance, v3 schemas and reason codes, perception outputs, recipes, the capability matrix, tests, the roadmap, and the done definition. |
| `ref/MOTION_SUITE_ADAPTER_M1_SPEC.md` | The M1 spec, whose contracts and decisions M2 keeps. |
| `ref/KICKOFF_PROMPT_M1.md` | The M1 kickoff, for continuity. |
| `ref/MOTION_FOUNDRY_M0_SPEC.md` | The M0 spec, which holds the base contracts. |
| `ref/recipe-starter-pack.md` | Raphael's recipe starter pack (v1). |

M2 builds on M1 (`motion-foundry` @ `b52aebd`). The Motion Suite facts are either `[OBSERVED@de612e4]`, from a read-only inspection, or reported by Raphael. Step 0 re-verifies all of them, along with every Chromium/SwiftShader flag, before anything is built.

Only Step 0 may run without further approval. All Motion Suite changes need Raphael's recorded authorization and stay on `foundry/m2-renderer`. The legacy renderer stays the default, and existing goldens are never touched. Every number marked [TARGET] is a goal to measure, not a result.
