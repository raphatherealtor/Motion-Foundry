# Acceptance stopped at run14

The cohort is FAILED and not restarted. Thirteen full suites passed; suite14 had71 passes and27 dependent failures from a single shared before-hook. The standalone M0 repeat test still passed, with unchanged cross-cohort frame/box/sheet fingerprints. All frozen-source identities match.

The negative-test mock repair loop returned ERROR/page.screenshot before its baseline manifest. Only24 frames were saved (0–23). Existing repairLoop code truncates the exception at the first colon, so the original full Playwright message is unavailable. Timeout, browser crash and other screenshot failures cannot be distinguished from this artifact alone.

Read-only post-event checks found ample disk space and no cgroup OOM-kill/throttling counters. They were not sampled at the failure and do not establish its cause. Current host load readings likewise cannot be attributed retrospectively.

One instrumented standalone mock loop passed. A separate bounded series of at most20 focused diagnostics records full screenshot exceptions, stack, file, elapsed time, crash events and error-time cgroup metrics, stopping on its first failure. No production source/test/timeout/tolerance changes; no failed acceptance results are erased or counted as passes.
