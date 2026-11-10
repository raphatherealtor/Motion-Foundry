# Motion Foundry Core M0

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
```

Use fresh output directories for each loop/probe. Existing evidence is never overwritten. Each render invocation gets a new attempt, including cache hits. Validation exits nonzero for hard failures. A second validate invocation on the same attempt refuses to overwrite its existing results; verify recomputes without mutation.

A mock PASS demonstrates geometry plumbing only. Without --mock, an overflowing fixture is rendered and validated, then the missing/unverified CLI transport blocks review. There is no paid API fallback. No image canary has been run in this container; no live adapter invocation is invented.

required_content.v1 is a fixture-only M0 invariant. Its baseline counts fully opaque, displayed word frames even when the deliberate overflow places a word outside the canvas; candidates must satisfy those counts inside the safe area. This avoids a zero-count escape for originally clipped words.

Blank and visibility-flash heuristics are advisory. Explicit region/object visibility contracts are deterministic checks of tagged geometry, not a general pixel-level blankness or creative-quality classifier. Audio, luma-jump and collision assessment are not implemented. Future host adapters are TypeScript interfaces only.
