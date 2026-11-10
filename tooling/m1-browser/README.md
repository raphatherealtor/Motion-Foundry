# Isolated M1 browser

Motion Suite SHA 25cb5454 expects Playwright 1.63.0 / Chromium 153.0.8010.12 (revision 1243). M0's frozen renderer still launches Chromium 131 at /usr/local/bin/chromium. Neither installation replaces the other.

From the Foundry root:

```sh
npm ci --prefix tooling/m1-browser --no-audit --no-fund
PLAYWRIGHT_BROWSERS_PATH="$PWD/tooling/m1-browser/browsers" node tooling/m1-browser/node_modules/playwright/cli.js install chromium --only-shell
```

Run product goldens with PLAYWRIGHT_BROWSERS_PATH set to this directory's browsers path. No baseline-update flags. The product checkout and its dependencies remain pinned; no source changes are required.

Supplemental M0 repeats use the new m0-browser-override.mjs loader to substitute only the browser launch path at module load time. It records its fingerprint in renderer config; frozen M0 source, compiled files, tests and the 131 executable stay unchanged. Actual browser version participates in M0's render identity. Run:

```sh
FOUNDRY_M1_BROWSER="$PWD/tooling/m1-browser/browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell" node --loader ./src/adapters/motion-suite/m0-browser-override.mjs ./src/adapters/motion-suite/m0-repeats.mjs
```

This is a browser migration check, not a replacement for M0's unchanged test suite. Run outputs live under runs/m1-resume/.
