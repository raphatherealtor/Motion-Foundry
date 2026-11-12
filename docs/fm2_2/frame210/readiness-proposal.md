# Proposal only — no implementation

For the DOM/CSS M0 path, an application WebGL fence is inapplicable: it would fence an unrelated context. Two requestAnimationFrame callbacks already exist in seekFrame; they do not prove that all Chromium raster tasks have committed.

First establish whether pinned Chromium153 exposes usable compositor tracing/frame presentation signals or explicit BeginFrame control in this headless shell. This is not yet verified. Proposed diagnostic records the requested frame index, seek/asset/font readiness UTC+monotonic timestamps, compositor frame/presentation identifiers and actual trace events, screenshot start/end, CPU pressure/load, exact SHA and test/run IDs. Do not label rAF or screenshot completion as actual frame commit without a verified correlation.

Candidate load-independent readiness: associate scene revision/frame with a confirmed compositor frame, then capture that frame. Alternatively, if the actual DOM surface supports independent readback, require two exact readback checksums associated with that frame after rAF. A mismatch must fail closed immediately, not retry until stable. Keep the existing timeout as a failure budget, not a delay; add no sleep, longer timeout, retry or pixel tolerance. Avoid circular verification in which the same unproven screenshot path supplies both the readiness checksum and evidence.

Only after approval and a verified signal/readback mechanism would a40-suite diagnostic be designed. This proposal is pulled forward for consideration from FM2.3; no readiness fix or new acceptance cohort has been implemented.
