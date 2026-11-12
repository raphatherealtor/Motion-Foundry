# Bounded frame210 diagnostic, not acceptance

Two-hour total time box. The driver reserves five minutes for setup/reporting, runs for at most115 minutes, and starts no new suite with under five minutes remaining. Existing900-second process limit is never increased; deadline can shorten it. All partial trials retained. No resumption/restart. Full serial98-test suites with unchanged assertions; failure is evidence, not retried. No acceptance or fix or push.

At every path ending f0210.png, two sequential screenshot calls use identical options except the second artifact destination. No seek/DOM mutation intervenes. The first remains the actual test evidence. Exact PNG SHA comparisons and both PNGs are retained with timestamps/load/test-file IDs. Additional capture can perturb timing; clean results do not prove absence of race.

Ordered phases baseline40, gpu-rasterization40, partial-raster40, zero-copy40; one added flag per phase. Existing num-raster-threads=1 retained. disable-partial-raster is ALREADY in baseline; its phase is a duplicate condition, not a new intervention. Actual launch flags logged separately, since frozen renderer config is not rewritten for diagnostics. About4minutes/suite means this entire matrix cannot fit two hours. Partial counts must never be represented as0/40. No concurrent browser phases to compress the budget.

First suite has one cc/viz trace from frame209 capture to frame210 double capture in one M0 browser session. Marked traced; separate from untouched baseline timing evidence. Trace metadata must demonstrate actual tile origin/scale before attributing y763 to a tile boundary. Arithmetic proximity to768 alone is insufficient.

Interpretation: within-pair mismatch supports capture/compositor timing with unchanged scene state; matching pairs but differing sessions is a per-launch/raster signature, not by itself proof of an internal raster mechanism. Report signatures and limits. All M0 checks exact. On deadline stop and report; flags remain proposals only until Raphael approves adoption.

## User-approved stripped pilot adaptation

After first full diagnostic suite, one pair in render.test.js returned baseline hash042a37ad… then previously failing hashc65682cd… with no scene mutation. That session was not the session traced earlier in the suite. This directly supports capture/compositor timing, rather than a pure per-launch fixed raster image.

User then authorized a stripped pilot. adapt.mjs waits for the current full suite to complete, stops the full-suite driver and retains any just-started partial trial uncounted. It runs up to20 fresh-browser M0 pilots, preserving the original exact scene/assets/viewport/flags and frame0–210 seek/screenshot/boxes order; only later frames/contact-sheet/other tests are omitted. If hashes differ within/across pilots, it uses this reproducing stripped path for40 baseline samples and40 per flag. If not, it returns to full-suite sampling without claiming that no-reproduction proves background load causality. All modes use the original09:37:56UTC deadline; no extra time or acceptance restart.

## Raster-scale logging requested by Raphael

A scale-instrumented comparison waits for the current full suite to finish, retains any just-started partial trial uncounted, then collects three stripped samples and remaining full-suite samples under the SAME original deadline. Each M0 frame210 pair gets a cc/viz window from209 through the second screenshot, retaining raw trace and root-scroller raster/ideal scale, geometry scale, transform, tile coverage and tilings with trace timestamps and page/test identity. The pair is linked by page ID and file path to the snapshots; a missing snapshot remains unavailable, never inferred from DPR. Tracing can perturb timing, so old untraced pairs and new traced pairs are reported separately. Earlier20 stripped pilots have no recorded raster scale; new stripped samples provide the measured comparison. No renderer flag is adopted and no readiness behavior changes.
