# M1 milestone evidence

Base: Motion Suite 25cb5454d1f14f889d36c79dec3965a95f7b2c99, Path A (unchanged). Approved corrections: M1_APPROVED_CORRECTIONS.md. Branch: m1-motion-suite-adapter. No push, merge, deployment, paid API or generated assets.

## Step 0 and browser prerequisite — TESTED

Step 0 semantic corrections cleared by Raphael on 2026-11-10. New isolated Playwright 1.63.0 / Chromium 153.0.8010.12 installation is under Foundry tooling/m1-browser; M0 retains Chromium 131.0.6778.204. The downloaded headless-shell binary contains num-raster-threads, PaintHolding and enable-begin-frame-control symbols. Runtime version is recorded in render config.

Product `npm run golden` rerun with only PLAYWRIGHT_BROWSERS_PATH selecting the Foundry browser: **52 frames, 0 failed**. All 47 existing OFF-default frames and committed baselines are identical. Worker/inline and preview/export checks passed. Original Step 0 Vitest result remains 671/671; not rerun. No golden-update or tolerance flags. Evidence: runs/m1-resume/golden.log, golden-report.json, golden.exit (0), browser.json.

This product golden PASS is separate from M1 scene parity, which is pending until milestone 1 passes.

M0 browser migration check: **5/5 uncached repeats PASS** on Chromium153. Every repeat produced the same frame/boxes/contact-sheet aggregate hash `793a025eefb32733327d3feb0d40e47fde40926efbc80ee35b44fb0b53af9f84`. Each run captured all270frames and checked out-of-order seeks [200,10,200,135] with zero tolerance. Evidence: runs/m1-resume/m0-153/repeats.json and m0-repeats.log. Source and tests were unchanged; the new loader substitutes only the launch path and records its hash. These checks do not claim M1 proof-scene determinism.

## Milestone 1 — TESTED

New Foundry harness imports the pinned product golden entry, parseProject and constructors. A Foundry-only Vite retention transform prevents sideEffects:false from stripping that entry; product source is not copied or edited. MotionSuiteRenderer implements frozen RendererAdapter (whose historical status literal stays UNVERIFIED); parity artifacts carry actual runtime status.

Three new tests passed. Preview/export-GIF-prequant/worker/golden-environment raw RGBA were byte-identical at frames0,45,90,135,179. Out-of-order seeks120,10,120,75 matched. Actual PNG capture also passed for synthetic frames0–4. Studio is explicitly NOT_RUN. Evidence: runs/m1-resume/renderer-tests.log and renderer-parity.json; initial capture under runs/m1-renderer/renders/. M1 recipe parity remains pending.

The first unchanged M0 suite on legacy131 was45/46: repeat-render frame55 differed. This is retained as a capture-race finding; no tolerance or frozen implementation was changed. The failure is being rechecked separately from the successful153 five-repeat migration check.
