# Motion Foundry Core M0

Current M0 acceptance: **BLOCKED / NONDETERMINISTIC**. Kimi OAuth, image transport, and one live geometry repair are verified; see [the current report](M0_KIMI_REPORT.md).

Standalone TypeScript/Node core. Read docs/amendments.md alongside the original handoff; the amendments take precedence. No existing application is modified.

Requires Node 22.14.0 and Chromium at /usr/local/bin/chromium. Dependencies are pinned in package-lock.json; do not download Playwright browser binaries. The synthetic fixture embeds local pinned GSAP and OFL Inter font bytes and makes no network requests while rendering.

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

A mock PASS demonstrates geometry plumbing only. A live run requires an explicit, current sealed canary receipt and verified managed Kimi Code OAuth. Without --mock or a valid --canary receipt, review remains blocked. No paid API fallback is enabled. The earlier M0_REPORT.md is retained as a historical milestone-7 snapshot; M0_KIMI_REPORT.md records the current results and open blocker.

required_content.v1 is a fixture-only M0 invariant. Its baseline counts fully opaque, displayed word frames even when the deliberate overflow places a word outside the canvas; candidates must satisfy those counts inside the safe area. This avoids a zero-count escape for originally clipped words.

Blank and visibility-flash heuristics are advisory. Explicit region/object visibility contracts are deterministic checks of tagged geometry, not a general pixel-level blankness or creative-quality classifier. Audio, luma-jump and collision assessment are not implemented. Future host adapters are TypeScript interfaces only.
