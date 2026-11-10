# Kickoff prompt: Motion Foundry Core M0 (paste into Jackhammer / Codex)

You are implementing **only Milestone M0** of Motion Foundry Core. The full spec is in `MOTION_FOUNDRY_M0_SPEC.md`, and the art rules are in `AGENTS_EXCERPT.md`. Read both before writing any code.

## Scope

Build a standalone, host-neutral TypeScript/Node package in a **new, empty directory** (for example `motion-foundry/`). Do not modify any existing app or repository: not BandAI, CutLab, Motion Suite, or Wayframe. Do not launch integrations, other agents, publishing, or messaging.

Deliver, in this order (spec §11):
1. Versioned contracts and JSON Schemas (EvidenceManifest, ValidationResult, PerceptualFinding, ReviewRequest, RepairProposal/ProposedOperation, RunResult), plus canonical hashing.
2. A synthetic, seeded HTML/GSAP fixture of about 9 s, 1080×1920 logical at 30/1 fps, with a **deliberately overflowing** title. Load fonts, GSAP, and assets from local package files only; make no CDN or network calls.
3. A deterministic renderer.
   - Paused timeline, seeking idempotently by integer frame. Await fonts, assets, and the ready flag, and block the network.
   - Inject the scene clock and seeded RNG. Statically reject wall-clock use in scene code, but don't globally make `Date.now` throw.
   - Cache by content-derived `render_id`, and give each invocation its own `attempt_id`.
   - The determinism check runs twice with `--no-cache` and must produce identical hashes. Otherwise report `BLOCKED`/`NONDETERMINISTIC` and do **not** claim M0 success.
4. Evidence: per-frame PNGs, per-frame word-level transformed bounds with visibility, a contact sheet with a stable cell→frame map, and a manifest that records SHA-256 hashes for the schema, frames, `boxes.jsonl`, and contact sheet. Never overwrite evidence.
5. Hard validators that run on **every** frame, before any model call:
   - Safe area (x90..990, y200..1720) on **visible** word bounds only, honoring `offscreen_entrance` annotations.
   - `required_content.v1`.
6. A reviewer capability probe that writes `capabilities.json`. **Do not invent CLI flags.** Run each installed tool's `--help` or read its docs, record the evidence, and treat any spend risk you can't confirm as blocking.
7. The repair state machine.
   - A **typed** allowlist (spec §9), candidate copies only, and ≤3 attempts.
   - A repair may shrink, reposition, or wrap. It may not hide, delete, zero opacity, move offscreen, shorten, or change text.
   - Stop and reject conditions are declared statuses plus a `reason_code` (`BLOCKED`/`OSCILLATION`, `BLOCKED`/`BUDGET_EXHAUSTED`, `ERROR`/`STALE_BASE`, `ERROR`/`FORBIDDEN_OP`, etc.). Keep the last passing candidate.
8. The negative tests in spec §12.
9. A live loop attempt. This needs a subscription CLI whose image attachment is verified with the canary test from spec §8. If no such CLI exists, report `BLOCKED/UNREVIEWED` and stop. Do not fake it.

## Hard rules

- No paid API fallback. Default to `allow_spend=false`.
- Model vision capability is not the same as the CLI being able to attach an image. A file path in a prompt is not proof the model saw the image.
- PASS comes only from the core's deterministic validators. AI findings are advisory.
- Never edit validators, limits, tests, or narration text to make a run pass.
- Keep retries small: failure JSON plus the failing window only.

## Stop point

Stop after the live loop, or after the negative tests if vision is blocked. Do not start adapters, recipes, UI, or creative-quality work.

## Report back (required)

- The file tree and the exact commands you implemented.
- Test results with counts, and the artifact paths from one run: manifest, contact sheet, failing ValidationResult, proposal, candidate, passing RunResult.
- `capabilities.json` and its evidence, per CLI.
- A status per capability: **SPECIFIED / TESTED / LIVE-VERIFIED**.
- Whether `closed_loop` was LIVE, MOCK, BLOCKED, or UNREVIEWED, and why.
- Determinism results, any spend incurred (expected: none), open blockers, and deviations from the spec.

A clear BLOCKED report beats an inflated PASS.
