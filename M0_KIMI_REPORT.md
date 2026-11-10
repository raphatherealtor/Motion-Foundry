# Kimi subscription reviewer connection

Kimi Code 2.5.2 is installed at `/root/.kimi-code/bin/kimi` and exposed through `/usr/local/bin/kimi`. Device-code OAuth completed successfully. Credentials remain in the CLI's private home; no credential values are stored in this repository or report.

The selected alias is `kimi-code/kimi-for-coding`, using managed OAuth at `https://api.kimi.ai/coding/v1`. The adapter rejects API keys, other endpoints, model-provider changes, stale canary receipts, disabled vision, and tool-enabled reviewer sessions. [Kimi's billing documentation](https://www.kimi.com/code/docs/en/kimi-code/faq.html) distinguishes this membership endpoint from the pay-as-you-go platform.

## Verified image transport

The final canary is `runs/kimi-canary-003/`. A cryptographically random token was drawn into a local PNG. Only its SHA-256 was stored as expected text data. The CLI received actual base64 PNG bytes through ACP, not a path in its prompt, and returned the exact token. The prompt did not contain the answer. [Kimi ACP documentation](https://www.kimi.com/code/docs/en/kimi-code-cli/reference/kimi-acp.html) documents this image mechanism.

The sealed receipt binds the CLI binary, version, model, image hash, response, and reviewer policy. Kimi's native audit confirms the custom prompt, zero effective tools, and zero tool schemas. The actual request used the advertised low-thinking setting. No file/tool operations or subagents were invoked.

The reviewer workspace is a separate Git root with a project-scoped default-agent override. ACP did not honor the initial launch-time agent-file flag; that limitation was discovered and corrected. Acceptance checks inspect the effective native audit rather than trusting a requested flag.

## Commands

```sh
npm run build
node dist/src/cli.js canary-reviewer <fresh_canary_directory>
node dist/src/cli.js probe-reviewer <fresh_probe_directory> --canary runs/kimi-canary-003
node dist/src/cli.js repair-loop fixtures/m0-overflow/scene.json --out <fresh_run_directory> --canary runs/kimi-canary-003 --max-attempts 3
node dist/src/cli.js verify <run_directory>
```

No canary or model call runs automatically in `npm test`. Default loops without an explicit verified canary remain UNREVIEWED; `--mock` cannot be combined with a live canary.

## Current acceptance

**Overall M0: BLOCKED / NONDETERMINISTIC.** The latest full suite passed 45 of 46 tests. The repeat-render test detected different PNG hashes at frame 202 with identical word/object bounds. The earlier rasterization flags did not fully eliminate the problem. No tolerance, budget increase, validator weakening or scene-text edit was used to hide it.

**Live repair loop: PASS / LIVE.** Kimi returned the proposal; the strict gate accepted it, the core created a candidate, all hard validators passed, and a separate CLI verify returned PASS with no regressions. This geometry result does not override the outstanding determinism blocker.

The first live review timed out at the unchanged 180-second budget. The second returned extra top-level metadata and was rejected as FORBIDDEN_OP before candidate creation. A final request explicitly required exactly the five proposal keys and succeeded. Rejected/failed runs remain untouched; the successful scene was not edited by a human.

- M0 status: [runs/m0-live-kimi-003/m0-status.json](runs/m0-live-kimi-003/m0-status.json).
- Live RunResult: [runs/m0-live-kimi-003/run-result.json](runs/m0-live-kimi-003/run-result.json).
- Independent verify: [runs/m0-live-kimi-003/verify-result.json](runs/m0-live-kimi-003/verify-result.json).
- Decision log: [runs/m0-live-kimi-003/decision-log.json](runs/m0-live-kimi-003/decision-log.json).
- Model proposal: [runs/m0-live-kimi-003/reviews/1/proposal.json](runs/m0-live-kimi-003/reviews/1/proposal.json).
- Candidate: [runs/m0-live-kimi-003/candidates/c_01/scene.json](runs/m0-live-kimi-003/candidates/c_01/scene.json).
- Base failure: [runs/m0-live-kimi-003/renders/ac47d0954be83574c5df20f9d051d56adfe2b07a037a03b2b7abddffb2094532/0d940598-978b-400a-9c4d-a91834d9f3f9/validation/safe_area.v1.json](runs/m0-live-kimi-003/renders/ac47d0954be83574c5df20f9d051d56adfe2b07a037a03b2b7abddffb2094532/0d940598-978b-400a-9c4d-a91834d9f3f9/validation/safe_area.v1.json).
- Final manifest: [runs/m0-live-kimi-003/renders/09ce3c4a093118bccbc9e4252fa0ac5dc8b035be664a1687bd6b76758a3cf106/1196afe3-87f1-4bb8-9477-a34e7f32d453/manifest.json](runs/m0-live-kimi-003/renders/09ce3c4a093118bccbc9e4252fa0ac5dc8b035be664a1687bd6b76758a3cf106/1196afe3-87f1-4bb8-9477-a34e7f32d453/manifest.json).
- Contact sheet: [runs/m0-live-kimi-003/renders/09ce3c4a093118bccbc9e4252fa0ac5dc8b035be664a1687bd6b76758a3cf106/1196afe3-87f1-4bb8-9477-a34e7f32d453/contact_sheet.png](runs/m0-live-kimi-003/renders/09ce3c4a093118bccbc9e4252fa0ac5dc8b035be664a1687bd6b76758a3cf106/1196afe3-87f1-4bb8-9477-a34e7f32d453/contact_sheet.png).
- Canary receipt: [runs/kimi-canary-003/receipt.json](runs/kimi-canary-003/receipt.json).
- Capabilities: [runs/kimi-live-probe-002/capabilities.json](runs/kimi-live-probe-002/capabilities.json).
- Test output: [runs/m0-live-kimi-003/test-results.tap](runs/m0-live-kimi-003/test-results.tap).
- Determinism blocker: [runs/m0-live-kimi-003/determinism-result.json](runs/m0-live-kimi-003/determinism-result.json).

## Status and scope

| Capability | Evidence level and result |
|---|---|
| Contracts, hashing, guardrails and mock loop | TESTED; their tests passed. |
| Repeat render determinism | TESTED; BLOCKED / NONDETERMINISTIC at frame 202. |
| Kimi subscription login and actual image attachment | LIVE-VERIFIED; final random-token canary passed. |
| Kimi proposal, candidate gate, rerender and independent geometry verification | LIVE-VERIFIED; PASS with no regressions. |
| Overall M0 acceptance | BLOCKED until exact repeat determinism is fixed. |
| Wayframe, Motion Suite, CutLab and creative recipes | SPECIFIED only; no integrations or recipes added. |

No PAYG API key or endpoint was used. Existing subscription quota was consumed by explicit canary/reviewer prompts; no purchase, top-up or upgrade was made. No scene text, validators, limits, budgets, or hard acceptance assertions were weakened. The reviewer timeout remains 180 seconds. The original fixture and earlier evidence directories were not overwritten.

The next required work is the frame-202 rasterization mismatch. A fresh single render or successful geometry repair must not be used to erase the failed repeat-determinism result. Earlier reports and all failed live attempts are preserved for audit.
