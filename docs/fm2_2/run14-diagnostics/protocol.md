# Run14 root-cause diagnostics — acceptance HOLD

Raphael requires at least20 isolated runs of the mock repair-loop test and20 runs inside the full serial suite. The failed acceptance cohort remains FAILED at14; no runs carry over and no acceptance is restarted until a verified cause and fix.

## Controlled conditions

- Isolated: the entire negative.test.js file (27 tests sharing its mock-loop setup), no name filters or skips.
- Suite: all98 test cases with --test-concurrency=1, preceded by the normal build step.
- Both use the same external screenshot observer and paired TAP/root-summary reporters. Existing render code, settings, screenshot options, timeouts and budgets remain unchanged. Each trial is independent, not an automatic retry; every failure is retained. Normal failures do not abort the requested20+20 diagnostic counts. Instrumentation/process failure stops for inspection; confirmed renderer regression stops as instructed.
- Each capture logs UTC start/end, monotonic elapsed time, system load/cgroup pressure, process/test identity and file. On error the complete original message/stack is recorded and the original error object rethrown. Crash/disconnect events are recorded. No DOM reads or readiness changes are added. Logging can still perturb timing; clean instrumented runs never establish a fix.
- Sources/tests/instrumentation are held fixed between conditions. Earlier exploratory diagnostics are separate because they lacked complete per-capture load logs.

## Cascades

The shared setup assertion now labels failures UPSTREAM_FAILED. Its condition and240000ms hook timeout are unchanged. Node already prevents dependent test bodies from running after the failed before-hook. The root reporter groups that one upstream failure once, while preserving every dependent's FAIL status and a short upstream message. Raw TAP is retained. No dependent becomes PASS or SKIP.

The instrumentation self-test injects a synthetic screenshot error to prove full colon-containing messages/stacks survive, options are unchanged and the call is not retried. A synthetic failed setup proves one root/two fast-failed dependents with zero body executions. This tests observability/reporting only, not a fix for run14.

## Classification rules

Classification remains unverified until evidence supports exactly one requested case:

(a) Same capture-timing/contention family: show matching failure signature plus controlled condition/readiness/load evidence. A timeout or high load alone is insufficient. Present the load-independent readiness proposal, pulled forward into FM2.2, BEFORE implementation. No arbitrary sleeps, retries or longer timeouts.

(b) Separate mock-harness/screenshot-path bug: identify the causal code/condition, fix it and add a regression reproducing the real bug. The synthetic observer test is not that regression.

(c) Real renderer/capture regression: stop diagnostics and report the evidence; do not implement a speculative fix. STOP_DIAGNOSTICS.json is a review stop marker checked before each new trial.

If40 trials do not reproduce it, report NOT REPRODUCED, not FIXED or classified by inference. After a verified approved fix: new acceptance starts at zero,60 clean serial full suites then five uncached repeats and all98 existing tests, with any necessary additional regression coverage. Nothing pushes before FM2.2 lands. Both Compat invariants and Raphael's separate A–M preserve check stay in the report.
