# Serial capture acceptance protocol

Raphael superseded the preliminary five-repeat acceptance with60 complete serial full-suite runs and zero failures, followed by five fresh uncached M0 repeat tests and a final98/98 suite. Preliminary checks are archived, not counted toward60.

The candidate change is only package.json's --test-concurrency=1. The shared resource being isolated is **host CPU scheduling/software-rasterization capacity accessed by concurrent browser-test workers**. Serial test-file execution prevents M0's screenshot pipeline from overlapping M1 browser/render tests. Browsers already have independent processes/profiles, artifact directories and ephemeral server ports; a shared browser process or fixed port was not found.

The observed trigger is concurrent test workload:0/60 isolated baseline failures versus1/20 full-suite failures. Readiness checks found stable frame/time/ticker, loaded fonts and no image assets. This explains the harness isolation change; it does not establish a specific Chromium-internal raster defect. F remains threatened until the acceptance cohort passes.

serial-acceptance.mjs waits for preliminary validation, archives it, then runs60 sequential npm test invocations. Each must report98 tests passed, zero failures/skips/cancellations, plus one passing M0 determinism event. It also compares uncached frame/box/contact-sheet fingerprints across the cohort. Source/test/config identities are frozen. Any failure stops the cohort and is retained; no automatic retries or discarded failures.

After60, serial-validation.mjs runs five new repeat tests (two uncached renders each) and another98-test suite. The five fingerprints must match each other and the60-suite cohort. No unrelated GPU/browser probes, heavy CPU analyses or source changes during measurement. Histogram-policy approval can be recorded in docs meanwhile, but its implementation waits until this cohort finishes.

If0/60 is observed, the exact one-sided95% binomial upper bound is1−0.05^(1/60), approximately4.8703%, under the repeated-trial model. This is evidence for the tested serial configuration, not proof that every concurrent rendering environment is deterministic.

Live results: runs/fm2-2/serial-acceptance/results.json; preliminary archive: runs/fm2-2/serial-preliminary/. Mark complete/land/push only after the required capture and banding gates both pass.
