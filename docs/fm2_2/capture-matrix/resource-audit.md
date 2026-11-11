# Shared-resource audit — provisional, not a root-cause verdict

Baseline full-suite run6 failed the unchanged M0 repeat test at frame81:3 changed channels, max delta5. All270 frames' object-box evidence matches between attempts, as do source/assets/config hashes. All60 isolated tests had passed. The remaining full-suite runs must finish before intervention.

Source audit:
- M0 creates a fresh chromium.launch per render; it does not reuse the M1 browser/session.
- Playwright launches use separate temporary user-data directories and remote-debugging pipes, not a shared debugging port.
- M0 artifacts use per-test mkdtemp directories and per-attempt UUID directories, not shared image filenames.
- M1 harness servers listen on port0 and return the assigned port; there is no fixed common HTTP port.
- The Node test runner currently runs files concurrently. M1 browser tests can overlap M0's raster/capture work and compete for host CPU/raster resources.

CPU-only color-oracle analysis was also performed during part of this full-suite phase; no separate browser/GPU probe was launched. Its exact temporal overlap with the failing frame is not established. This external CPU load must not be concealed or asserted as the cause.

Candidate single-variable isolation after all20 baseline runs: run the same unchanged test files with --test-concurrency=1. This removes overlapping test-file workers without changing render code, frame readiness, fonts, browser flags, capture pixels or tolerances. It is a hypothesis to validate, not yet an applied fix. Readiness/triple-capture diagnostic is also prepared and must be recorded separately from uninstrumented baseline results.
