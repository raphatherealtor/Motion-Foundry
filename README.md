# Motion Foundry

Motion Suite M1 has an independently verified live Vox repair proof. See [the M1 report](docs/M1_REPORT.md) for artifacts and final acceptance status. The full suite passed **86/86**, including all46 unchanged M0 tests. Historical M0 evidence remains in [the capture-race report](CAPTURE_RACE_REPORT.md) and [the Kimi report](M0_KIMI_REPORT.md).

Standalone TypeScript/Node core. Read docs/amendments.md alongside the original handoff; the amendments take precedence. No existing application is modified.

Requires Node22.14.0 and pinned Chromium153.0.8010.12. Chromium131 is retired. Install the isolated153 browser using [these instructions](tooling/m1-browser/README.md); there is no system-browser fallback. Dependencies remain pinned. The synthetic fixture embeds local pinned GSAP and OFL Inter font bytes and makes no network requests while rendering.

```sh
npm ci --ignore-scripts
npm test
npm run foundry -- --help
npm run foundry -- render fixtures/m0-overflow/scene.json --out runs/render-a --no-cache
npm run foundry -- validate <attempt_directory>
npm run foundry -- probe-reviewer runs/probe
npm run foundry -- repair-loop fixtures/m0-overflow/scene.json --out runs/mock --mock --max-attempts 3
npm run foundry -- verify runs/mock
# Explicit live commands consume existing Kimi Code subscription quota.
npm run foundry -- canary-reviewer runs/new-canary
npm run foundry -- probe-reviewer runs/new-probe --canary runs/new-canary
npm run foundry -- repair-loop fixtures/m0-overflow/scene.json --out runs/new-live --canary runs/new-canary
npm run foundry -- verify runs/new-live
```

Use fresh output directories for each loop/probe. Existing evidence is never overwritten. Each render invocation gets a new attempt, including cache hits. Validation exits nonzero for hard failures. A second validate invocation on the same attempt refuses to overwrite its existing results; verify recomputes without mutation.

A mock PASS demonstrates geometry plumbing only. A live run requires an explicit, current sealed canary receipt and verified managed Kimi Code OAuth. Without --mock or a valid --canary receipt, review remains blocked. No paid API fallback is enabled. The earlier M0_REPORT.md is retained as a historical milestone-7 snapshot; M0_KIMI_REPORT.md retains the historical M0 connection evidence; docs/M1_REPORT.md records the current adapter proof.

required_content.v1 is a fixture-only M0 invariant. Its baseline counts fully opaque, displayed word frames even when the deliberate overflow places a word outside the canvas; candidates must satisfy those counts inside the safe area. This avoids a zero-count escape for originally clipped words.

Blank and visibility-flash heuristics are advisory. Explicit region/object visibility contracts are deterministic checks of tagged geometry, not a general pixel-level blankness or creative-quality classifier. The M0 path does not implement audio or pixel-luma/collision assessment. M1 adds advisory luma/collision checks and the Motion Suite adapter; other host adapters remain interface declarations.

M1 uses the pinned Motion Suite checkout at `/root/projects/motion-suite-m1`, unchanged. Every recipe emits measured single-word text objects; unsupported word evidence fails hard checks.

```sh
npm run foundry -- canary-reviewer runs/fresh-ms-canary
npm run foundry -- motion-suite-loop fixtures/m1/vox-doc.chart_explainer/ms_scene.json --out runs/fresh-ms-live --canary runs/fresh-ms-canary
npm run foundry -- verify runs/fresh-ms-live
```

Use `--mock` in place of `--canary` for an explicitly labeled mock. Reviewer calls consume the existing Kimi subscription quota; no paid API fallback is available.
