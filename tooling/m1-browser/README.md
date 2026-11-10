# Pinned Foundry browser

All active Foundry rendering, review sheets and image canaries select Chromium153.0.8010.12 (revision1243). Motion Suite expects Playwright1.63.0, isolated here. Chromium131 is retired as a renderer; its system binary may remain installed but is never selected or used as a fallback.

```sh
npm ci --prefix tooling/m1-browser --no-audit --no-fund
PLAYWRIGHT_BROWSERS_PATH="$PWD/tooling/m1-browser/browsers" node tooling/m1-browser/node_modules/playwright/cli.js install chromium --only-shell
```

Product goldens use PLAYWRIGHT_BROWSERS_PATH pointing here, without update flags. Motion Suite source remains unchanged. M0 schemas, validator logic, allowlist and tests are unchanged; only its browser selection was migrated under Raphael's explicit instruction. The previous migration loader is now inert.

```sh
node src/adapters/motion-suite/m0-repeats.mjs
```

Run outputs live under runs/m1-resume/.
