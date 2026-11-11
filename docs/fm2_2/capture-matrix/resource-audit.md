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

## Baseline finished and candidate applied

All20 full-suite baselines completed:19 passed,1 failed (5% observed). All60 isolated tests passed. Readiness diagnostic passed three launches with triple captures at81/95/121, loaded fonts/no images/stable clocks. The sole candidate policy change is now applied in package.json: --test-concurrency=1. Five uncached repeat tests plus the complete98-test serial suite are running; no result is assumed.

## Sixty-suite acceptance supersedes preliminary checks

The preliminary five repeats plus98/98 passed. They are not counted toward the fresh60-full-suite cohort;0/60 plus new five uncached repeats and a final98/98 are now required. The shared contention removed is host CPU/software-rasterization scheduling from concurrent browser-test workers, not a discovered shared browser/profile/port. See serial-acceptance-protocol.md for the cause scope, frozen-source guards and no-retry policy.
