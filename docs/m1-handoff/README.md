# Motion Foundry M1 handoff: Motion Suite adapter

| File | Purpose |
|---|---|
| `KICKOFF_PROMPT_M1.md` | Paste into Jackhammer / Codex first. |
| `MOTION_SUITE_ADAPTER_M1_SPEC.md` | Full M1 spec: Step 0 gate, renderer parity, timing, recipe contract, validators, repair allowlist, tests, done definition, optional M1b. |
| `ref/recipe-starter-pack.md` | Raphael's Motion Suite recipe starter pack (v1), for reference when naming recipes. |
| `ref/MOTION_FOUNDRY_M0_SPEC.md` | The M0 spec, whose contracts M1 reuses. |

Motion Suite facts come from a read-only source inspection at `blank-canvas-starter@de612e4` (`claude/e3-highlight-render`), where no tests were run. Step 0 must re-verify them against the current code before anything is built. Changes to the Motion Suite repo need Raphael's explicit authorization, and even then they are additive only, on `foundry/m1-adapter`.
