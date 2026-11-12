# FM2.2 direct-CDP capture acceptance report

Status: PASS_USER_APPROVED (8/8 clean, per Raphael). No push authorized or performed.

Adopted harness-only Page.captureScreenshot, PNG/fromSurface true/captureBeyondViewport false, without per-capture clip/scale. View/window/DSF configured once per page. Scene/seek/assertion/schema files and renderer flags are unchanged. Capture helper hash is included in cache identity. Existing screenshot-failure instrumentation now also observes direct CDP captures.

All 211 approved M0 frame pins adopted:597 pixels, max channel delta14, max feasible coverage shift1/16. M1 proof/chart f90/opacity and all FM2.1 GPU pins unchanged. The completed editorial measurement stands; its out-of-spec second attempt was not repeated.

## CPU-load checks

Four parallel CPU workers per run; no retries, sleeps, extra flags or timeouts beyond existing budgets. Each run checks all211 frames plus four out-of-order seek captures (215 pairs). Both captures must match each other and the approved pin.

| Run | Pairs | Mismatches | Result |
|---|---:|---:|---|
| 1 | 215 | 0 | PASS |
| 2 | 215 | 0 | PASS |
| 3 | 215 | 0 | PASS |

## Acceptance

**8/8 consecutive full serial suites accepted; each98/98, zero failures, skips or cancellations within those completed suites.** Exact M0 pins and full-render fingerprints match. All95 frozen source guards still match.

Raphael superseded the ten-suite/five-repeat/final-suite requirement: eight clean suites are sufficient. The service and scheduled follow-up are stopped; the remaining suite work, uncached repeats and final proof are cancelled by instruction, not reported as passing or as test skips.

A ninth suite had already completed clean before the stop reached the service. It is retained as supplemental evidence, separate from the accepted8/8. Any interrupted next trial remains uncounted. Run14 stays UNVERIFIED. No push performed; awaiting push approval. Pending banding histogram approval is not silently granted by this capture decision.

## Re-pinned frame ledger

| Frame | Changed pixels | Max delta | Max coverage shift |
|---:|---:|---:|---:|
| 0 | 4 | 5 | 0.027892543 |
| 1 | 3 | 4 | 0.025450339 |
| 2 | 4 | 7 | 0.030843009 |
| 3 | 4 | 7 | 0.032079179 |
| 4 | 4 | 8 | 0.035991923 |
| 5 | 3 | 5 | 0.032079179 |
| 6 | 2 | 4 | 0.029012652 |
| 7 | 1 | 5 | 0.030298022 |
| 8 | 2 | 7 | 0.032273263 |
| 9 | 1 | 5 | 0.030298022 |
| 10 | 2 | 8 | 0.037422177 |
| 11 | 1 | 5 | 0.030298022 |
| 12 | 2 | 6 | 0.033988872 |
| 13 | 3 | 8 | 0.033585731 |
| 14 | 3 | 6 | 0.035145706 |
| 15 | 3 | 5 | 0.032079179 |
| 16 | 3 | 6 | 0.033364549 |
| 17 | 3 | 5 | 0.030298022 |
| 18 | 5 | 8 | 0.035991923 |
| 19 | 4 | 7 | 0.032273263 |
| 20 | 4 | 7 | 0.032273263 |
| 21 | 3 | 5 | 0.032079179 |
| 22 | 3 | 6 | 0.035145706 |
| 23 | 3 | 5 | 0.032079179 |
| 24 | 3 | 7 | 0.031297325 |
| 25 | 3 | 14 | 0.062500000 |
| 26 | 3 | 6 | 0.027231495 |
| 27 | 1 | 5 | 0.030298022 |
| 28 | 1 | 5 | 0.030298022 |
| 29 | 2 | 7 | 0.030843009 |
| 30 | 3 | 7 | 0.033988872 |
| 31 | 3 | 8 | 0.035991923 |
| 32 | 3 | 6 | 0.035145706 |
| 33 | 3 | 5 | 0.032079179 |
| 34 | 3 | 6 | 0.033364549 |
| 35 | 4 | 7 | 0.032273263 |
| 36 | 4 | 5 | 0.027892543 |
| 37 | 4 | 8 | 0.037422177 |
| 38 | 3 | 4 | 0.023044859 |
| 39 | 3 | 5 | 0.032079179 |
| 40 | 4 | 8 | 0.035145706 |
| 41 | 3 | 5 | 0.032079179 |
| 42 | 2 | 4 | 0.029012652 |
| 43 | 1 | 5 | 0.030298022 |
| 44 | 1 | 4 | 0.027231495 |
| 45 | 2 | 8 | 0.035991923 |
| 46 | 2 | 7 | 0.032273263 |
| 47 | 2 | 7 | 0.032273263 |
| 48 | 2 | 6 | 0.033988872 |
| 49 | 2 | 4 | 0.023044859 |
| 50 | 3 | 6 | 0.035145706 |
| 51 | 4 | 7 | 0.032079179 |
| 52 | 5 | 14 | 0.062500000 |
| 53 | 5 | 6 | 0.030298022 |
| 54 | 4 | 5 | 0.027892543 |
| 55 | 3 | 4 | 0.025450339 |
| 56 | 4 | 7 | 0.030843009 |
| 57 | 4 | 7 | 0.032079179 |
| 58 | 4 | 8 | 0.035991923 |
| 59 | 3 | 5 | 0.032079179 |
| 60 | 2 | 4 | 0.029012652 |
| 61 | 1 | 5 | 0.030298022 |
| 62 | 2 | 7 | 0.032273263 |
| 63 | 1 | 5 | 0.030298022 |
| 64 | 2 | 8 | 0.037422177 |
| 65 | 1 | 5 | 0.030298022 |
| 66 | 2 | 6 | 0.033988872 |
| 67 | 3 | 8 | 0.033585731 |
| 68 | 3 | 6 | 0.035145706 |
| 69 | 3 | 5 | 0.032079179 |
| 70 | 3 | 6 | 0.033364549 |
| 71 | 3 | 5 | 0.030298022 |
| 72 | 5 | 8 | 0.035991923 |
| 73 | 4 | 7 | 0.032273263 |
| 74 | 4 | 7 | 0.032273263 |
| 75 | 3 | 5 | 0.032079179 |
| 76 | 3 | 6 | 0.035145706 |
| 77 | 3 | 5 | 0.032079179 |
| 78 | 3 | 7 | 0.031297325 |
| 79 | 3 | 14 | 0.062500000 |
| 80 | 3 | 6 | 0.027231495 |
| 81 | 1 | 5 | 0.030298022 |
| 82 | 1 | 5 | 0.030298022 |
| 83 | 2 | 7 | 0.030843009 |
| 84 | 3 | 7 | 0.033988872 |
| 85 | 3 | 8 | 0.035991923 |
| 86 | 3 | 6 | 0.035145706 |
| 87 | 3 | 5 | 0.032079179 |
| 88 | 3 | 6 | 0.033364549 |
| 89 | 4 | 7 | 0.032273263 |
| 90 | 4 | 5 | 0.027892543 |
| 91 | 4 | 8 | 0.037422177 |
| 92 | 3 | 4 | 0.023044859 |
| 93 | 3 | 5 | 0.032079179 |
| 94 | 4 | 8 | 0.035145706 |
| 95 | 3 | 5 | 0.032079179 |
| 96 | 2 | 4 | 0.029012652 |
| 97 | 1 | 5 | 0.030298022 |
| 98 | 1 | 4 | 0.027231495 |
| 99 | 2 | 8 | 0.035991923 |
| 100 | 2 | 7 | 0.032273263 |
| 101 | 2 | 7 | 0.032273263 |
| 102 | 2 | 6 | 0.033988872 |
| 103 | 2 | 4 | 0.023044859 |
| 104 | 3 | 6 | 0.035145706 |
| 105 | 4 | 7 | 0.032079179 |
| 106 | 5 | 14 | 0.062500000 |
| 107 | 5 | 6 | 0.030298022 |
| 108 | 4 | 5 | 0.027892543 |
| 109 | 3 | 4 | 0.025450339 |
| 110 | 4 | 7 | 0.030843009 |
| 111 | 4 | 7 | 0.032079179 |
| 112 | 4 | 8 | 0.035991923 |
| 113 | 3 | 5 | 0.032079179 |
| 114 | 2 | 4 | 0.029012652 |
| 115 | 1 | 5 | 0.030298022 |
| 116 | 2 | 7 | 0.032273263 |
| 117 | 1 | 5 | 0.030298022 |
| 118 | 2 | 8 | 0.037422177 |
| 119 | 1 | 5 | 0.030298022 |
| 120 | 2 | 6 | 0.033988872 |
| 121 | 3 | 8 | 0.033585731 |
| 122 | 3 | 6 | 0.035145706 |
| 123 | 3 | 5 | 0.032079179 |
| 124 | 3 | 6 | 0.033364549 |
| 125 | 3 | 5 | 0.030298022 |
| 126 | 5 | 8 | 0.035991923 |
| 127 | 4 | 7 | 0.032273263 |
| 128 | 4 | 7 | 0.032273263 |
| 129 | 3 | 5 | 0.032079179 |
| 130 | 3 | 6 | 0.035145706 |
| 131 | 3 | 5 | 0.032079179 |
| 132 | 3 | 7 | 0.031297325 |
| 133 | 3 | 14 | 0.062500000 |
| 134 | 3 | 6 | 0.027231495 |
| 135 | 1 | 5 | 0.030298022 |
| 136 | 1 | 5 | 0.030298022 |
| 137 | 2 | 7 | 0.030843009 |
| 138 | 3 | 7 | 0.033988872 |
| 139 | 3 | 8 | 0.035991923 |
| 140 | 3 | 6 | 0.035145706 |
| 141 | 3 | 5 | 0.032079179 |
| 142 | 3 | 6 | 0.033364549 |
| 143 | 4 | 7 | 0.032273263 |
| 144 | 4 | 5 | 0.027892543 |
| 145 | 4 | 8 | 0.037422177 |
| 146 | 3 | 4 | 0.023044859 |
| 147 | 3 | 5 | 0.032079179 |
| 148 | 4 | 8 | 0.035145706 |
| 149 | 3 | 5 | 0.032079179 |
| 150 | 2 | 4 | 0.029012652 |
| 151 | 1 | 5 | 0.030298022 |
| 152 | 1 | 4 | 0.027231495 |
| 153 | 2 | 8 | 0.035991923 |
| 154 | 2 | 7 | 0.032273263 |
| 155 | 2 | 7 | 0.032273263 |
| 156 | 2 | 6 | 0.033988872 |
| 157 | 2 | 4 | 0.023044859 |
| 158 | 3 | 6 | 0.035145706 |
| 159 | 4 | 7 | 0.032079179 |
| 160 | 5 | 14 | 0.062500000 |
| 161 | 5 | 6 | 0.030298022 |
| 162 | 4 | 5 | 0.027892543 |
| 163 | 3 | 4 | 0.025450339 |
| 164 | 4 | 7 | 0.030843009 |
| 165 | 4 | 7 | 0.032079179 |
| 166 | 4 | 8 | 0.035991923 |
| 167 | 3 | 5 | 0.032079179 |
| 168 | 2 | 4 | 0.029012652 |
| 169 | 1 | 5 | 0.030298022 |
| 170 | 2 | 7 | 0.032273263 |
| 171 | 1 | 5 | 0.030298022 |
| 172 | 2 | 8 | 0.037422177 |
| 173 | 1 | 5 | 0.030298022 |
| 174 | 2 | 6 | 0.033988872 |
| 175 | 3 | 8 | 0.033585731 |
| 176 | 3 | 6 | 0.035145706 |
| 177 | 3 | 5 | 0.032079179 |
| 178 | 3 | 6 | 0.033364549 |
| 179 | 3 | 5 | 0.030298022 |
| 180 | 5 | 8 | 0.035991923 |
| 181 | 4 | 7 | 0.032273263 |
| 182 | 4 | 7 | 0.032273263 |
| 183 | 3 | 5 | 0.032079179 |
| 184 | 3 | 6 | 0.035145706 |
| 185 | 3 | 5 | 0.032079179 |
| 186 | 3 | 7 | 0.031297325 |
| 187 | 3 | 14 | 0.062500000 |
| 188 | 3 | 6 | 0.027231495 |
| 189 | 1 | 5 | 0.030298022 |
| 190 | 1 | 5 | 0.030298022 |
| 191 | 2 | 7 | 0.030843009 |
| 192 | 3 | 7 | 0.033988872 |
| 193 | 3 | 8 | 0.035991923 |
| 194 | 3 | 6 | 0.035145706 |
| 195 | 3 | 5 | 0.032079179 |
| 196 | 3 | 6 | 0.033364549 |
| 197 | 4 | 7 | 0.032273263 |
| 198 | 4 | 5 | 0.027892543 |
| 199 | 4 | 8 | 0.037422177 |
| 200 | 3 | 4 | 0.023044859 |
| 201 | 3 | 5 | 0.032079179 |
| 202 | 4 | 8 | 0.035145706 |
| 203 | 3 | 5 | 0.032079179 |
| 204 | 2 | 4 | 0.029012652 |
| 205 | 1 | 5 | 0.030298022 |
| 206 | 1 | 4 | 0.027231495 |
| 207 | 2 | 8 | 0.035991923 |
| 208 | 2 | 7 | 0.032273263 |
| 209 | 2 | 7 | 0.032273263 |
| 210 | 2 | 6 | 0.033988872 |

## Compat invariants

| Invariant | Diagnostic preservation |
|---|---|
|Draw order/opacity/blend|Production renderer untouched|
|Groups/isolation/clip semantics|Untouched; no new flattening|
|Timing/settings|Original scene/integer seeks retained; approved capture transport/pins only; no tracing in acceptance|
|Frozen contracts/default|Schemas/assertions unchanged; legacy default and GPU opt-in retained|
|Parity/determinism|FM2.1 pins unchanged; exact M0 equality passes under accepted8/8 protocol|

## Raphael's separate A–M preserve check

| Principle | Check |
|---|---|
|A Directed temporal anchors|No timing edits|
|B Editable causality|Editable source retained|
|C Gradient of agency|Latest explicit capture adoption and acceptance approval respected|
|D Perceptual-evidence loop, advisory|Evidence reported; no heuristic override|
|E Scoped AI authority|Diagnostic scope only|
|F Procedural deterministic motion|PRESERVED under Raphael-approved8/8 capture acceptance; historical failures retained|
|G Advanced temporal geometry|Untouched|
|H One lighting model|Untouched|
|I Recipes as editable executable knowledge|No recipe edits|
|J Model neutrality|Provider-independent diagnostics|
|K External-agent operation|Existing operation preserved|
|L One canonical scene/render state|Canonical and repaired scene results separated|
|M Preserved roadmap|Only approved capture work; no FM2.3 expansion|


Failure artifacts, full logs and exact fingerprints retained under runs/fm2-2/direct-cdp-acceptance/. Implementation checks: TypeScript build, capture transport regression and all three existing artifact-outcome regressions pass. No browser retries, skips, tolerance, golden changes outside approved M0 pins, merge or push.
