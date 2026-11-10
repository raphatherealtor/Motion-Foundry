# M1 milestone evidence

Base: Motion Suite 25cb5454d1f14f889d36c79dec3965a95f7b2c99, Path A (unchanged). Approved corrections: M1_APPROVED_CORRECTIONS.md. Branch: m1-motion-suite-adapter. No push, merge, deployment, paid API or generated assets.

## Step 0 and browser prerequisite — TESTED

Step 0 semantic corrections cleared by Raphael on 2026-11-10. New isolated Playwright 1.63.0 / Chromium 153.0.8010.12 installation is under Foundry tooling/m1-browser; M0 retains Chromium 131.0.6778.204. The downloaded headless-shell binary contains num-raster-threads, PaintHolding and enable-begin-frame-control symbols. Runtime version is recorded in render config.

Product `npm run golden` rerun with only PLAYWRIGHT_BROWSERS_PATH selecting the Foundry browser: **52 frames, 0 failed**. All 47 existing OFF-default frames and committed baselines are identical. Worker/inline and preview/export checks passed. Original Step 0 Vitest result remains 671/671; not rerun. No golden-update or tolerance flags. Evidence: runs/m1-resume/golden.log, golden-report.json, golden.exit (0), browser.json.

This product golden PASS is separate from M1 scene parity, which is pending until milestone 1 passes.
