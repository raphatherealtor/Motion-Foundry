# Motion Foundry M1 report

**M1 verification PASS.** The Vox live loop passed independent verification, and5/5 uncached renders of its accepted candidate matched exactly.

## Corrections and boundary

Motion Suite preserves elapsed time on FPS changes; Foundry pins30/1 and rejects FPS edits. Shadow softness is0–1. New M1 v2 schemas coexist with unchanged frozen M0 v1 schemas. Unmapped wrap/maxWidth, unconsumed letter spacing and camera-value targets are omitted. Chromium131 is retired; all active rendering and image canaries use153.0.8010.12. See M1_APPROVED_CORRECTIONS.md and M1_STEP0_FINDINGS.md for the complete bound/source audit.

Path A: `/root/projects/motion-suite-m1` at `25cb5454d1f14f889d36c79dec3965a95f7b2c99`, read-only. Path B was not needed. No branch/push/merge, deploy, paid API fallback, generation or messaging was performed in Motion Suite.

## Live proof

Runtime code milestone: f6db508. Kimi2.5.2 on managed subscription passed a fresh image canary. Native audit confirms attached pixels, empty tools, low thinking effort and the required custom profile.

The seeded headline and counter failed safe-area/required-content checks. Kimi proposed parent headline scale0.58 and counter x360. Both passed v2 gates and real product transactions. All words, order and holds remained intact. One repair attempt, 2 renders, 595.929 seconds, zero regressions. The measured-render forecast raised the recorded wall cap to1800seconds; attempts≤3, renders≤5 and reviewer timeout180seconds remain enforced.

Final render: `c71c217f782e4e9e87bfc41796c91e5f7c614f29f55d72e0f466f24de138286a`. All180frames are present. Preview/export-prequant/worker/golden-environment raw RGBA parity passed with zero tolerance at five stages. Studio and audio are NOT_RUN, as scoped.

## Checks and artifacts

- Full suite:86/86, including46 unchanged M0 tests and40 M1 tests.
- Product goldens on153:52frames, zero failures; committed baselines and OFF defaults unchanged.
- Three recipe fixtures:180frames each, every hard check passed. All recipe text is measured per word; unsupported/unsplit word evidence fails instead of skipping.
- Default153 M0 determinism:5/5 uncached repeats, identical frame/box/contact-sheet hash.
- Mock loop and independent verification passed; forged LIVE labels were rejected.

[RunResult](../runs/m1-live/run-result.json), [decision log](../runs/m1-live/decision-log.json), [Kimi proposal](../runs/m1-live/reviews/1/proposal.json), [fresh canary](../runs/m1-resume/canary-live/canary-result.json).

Base failure: `runs/m1-live/renders/5b0508ed47064539ea8ab6ac599eb6667c01f4bb5a7a1c2d2739c805a2de2bbe/bc50ff82-9d4c-4bdc-9853-0cbd4992ee8a/validation/safe_area.v1.json`.

Final manifest: `runs/m1-live/renders/c71c217f782e4e9e87bfc41796c91e5f7c614f29f55d72e0f466f24de138286a/89b3e03f-8dd7-4cd3-b731-ee3fdcb8d927/manifest.json`.

Final contact sheet: `runs/m1-live/renders/c71c217f782e4e9e87bfc41796c91e5f7c614f29f55d72e0f466f24de138286a/89b3e03f-8dd7-4cd3-b731-ee3fdcb8d927/contact_sheet.png`.

Candidate: `runs/m1-live/candidates/c_01/candidate.json`. Verification log: `runs/m1-resume/live-verify.log` (exit0). Source/validation indexes, boxes and immutable policy/adapter/harness snapshots are inside the render directories.

## Recipe status and limits

Vox chart explainer: LIVE-VERIFIED. Paper build/tear and editorial cutout-pop: TESTED. Their specialty-font requests explicitly fall back to registered IBM Plex Sans400/600. Only synthetic fixture shapes are used. The required-content frame-count invariant remains fixture-only, not a universal artistic rule. Heuristics cannot hard-fail a scene; explicit contracts and geometry retain deterministic authority.

Optional Gemini/agy comparison: NOT_RUN; no second-reviewer capability or transport claim is made. No additional spend or paid fallback was used.

## Final determinism and audit

Five fresh-browser uncached renders captured900frames in total. All five matched the accepted live candidate's frame, word-box and contact-sheet digest:

`713dd63be428706a6965b1db01f60665dcf92138aa3aa00687b05823c8d4ec57`

Each repeat also passed preview/export/worker/golden-environment parity and out-of-order seeks120,10,120,75. Full evidence: [five-run record](../runs/m1-determinism/repeats.json) (PASS, complete:true). Two independent jobs ran concurrently; no rendering cache or source changes were used during capture.

Boundary audit: all587 tracked Motion Suite files retain their Step0 SHA256 values, its git status is clean, and frozen M0 files are unchanged. `runs/m1-resume/boundary-final.json` records the result.

A metadata-only follow-up makes new runs record the already-enforced frame-scaled render deadline explicitly (960seconds for180frames, bounded by remaining wall time). The immutable live run retains its inherited120-second M0 base value; its actual archived adapter enforced the scaled deadline. No effective limit was relaxed, no live candidate/evidence was edited, and the three safety tests were rerun successfully. The full86-test suite passed before this logging correction.

Machine-readable committed evidence index: [m1-evidence-summary.json](m1-evidence-summary.json). Final independent verification was rerun successfully after the logging correction; six targeted recipe/safety tests passed.
