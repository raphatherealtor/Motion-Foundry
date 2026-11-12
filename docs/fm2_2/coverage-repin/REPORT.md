# FM2.2 coverage-rule re-pin investigation

Status: STOPPED; no pins changed, no capture adoption, no stress runs, no acceptance restart, and no push.

The revised coverage classifier accepts all 211 M0 frames. The two retained fresh-browser direct-CDP renders match exactly. Against the historical baseline, 597 pixels change across 211 frames; maximum channel delta is 14. Every changed pixel passes the tile-boundary and independent circle-geometry AA-edge checks and the coverage feasibility rule. Maximum fitted coverage shift is 0.0625. Text and uncertified pixels fail closed.

The bundle was built once, separately. M1 proof, chart_explainer f90 and opacity each completed two fresh browsers within their own 120-second command budget, with identical results. M1/chart remain zero-difference; opacity hashes remain pinned. Paper GPU completed two identical measurements; editorial completed one. Both recipes retain the accepted diff and signed-delta hashes and 570/7/0 classification.

## Stop and its limits

The generic GPU worker also attempted a second editorial browser, beyond the separately requested GPU re-measurement. That extra check exhausted the 120-second command budget (exit 124). Its untruncated terminal exception is retained in editorial.log: page.evaluate: Target page, context or browser has been closed, at suite.mjs:5:25. The first completed editorial result matches the pins. The second is incomplete, not a renderer mismatch or a completed identity check. No retry or longer timeout was used. I stopped here rather than describing the incomplete check as passing. This added duplicate was implementation overhead, not a newly imposed user requirement.

Proposed capture/observer code is retained as unadopted files only. Production capture and observer are unchanged. All historical pins remain unchanged.

## Coverage interpretation

Each old/new pixel must admit a single t in [0,1] with every RGB residual at most 2. The classifier intersects the three allowed t intervals. It then checks whether the pair admits a separation at most 1/16, retaining least-squares estimates separately. A provisional least-squares-only rejection was an overly strict analysis, not a failed render or retry; its output is retained. No old/new render bytes were regenerated to pass classification. F/B are selected from unchanged neighboring pixels wholly inside/outside the same independent circle geometry.

## Frame ledger

These are eligible candidates only: **zero frames were re-pinned**.

| Frame | Changed pixels | Max channel delta | Max feasible coverage shift | Re-pinned |
|---:|---:|---:|---:|---|
| 0 | 4 | 5 | 0.027892543 | No |
| 1 | 3 | 4 | 0.025450339 | No |
| 2 | 4 | 7 | 0.030843009 | No |
| 3 | 4 | 7 | 0.032079179 | No |
| 4 | 4 | 8 | 0.035991923 | No |
| 5 | 3 | 5 | 0.032079179 | No |
| 6 | 2 | 4 | 0.029012652 | No |
| 7 | 1 | 5 | 0.030298022 | No |
| 8 | 2 | 7 | 0.032273263 | No |
| 9 | 1 | 5 | 0.030298022 | No |
| 10 | 2 | 8 | 0.037422177 | No |
| 11 | 1 | 5 | 0.030298022 | No |
| 12 | 2 | 6 | 0.033988872 | No |
| 13 | 3 | 8 | 0.033585731 | No |
| 14 | 3 | 6 | 0.035145706 | No |
| 15 | 3 | 5 | 0.032079179 | No |
| 16 | 3 | 6 | 0.033364549 | No |
| 17 | 3 | 5 | 0.030298022 | No |
| 18 | 5 | 8 | 0.035991923 | No |
| 19 | 4 | 7 | 0.032273263 | No |
| 20 | 4 | 7 | 0.032273263 | No |
| 21 | 3 | 5 | 0.032079179 | No |
| 22 | 3 | 6 | 0.035145706 | No |
| 23 | 3 | 5 | 0.032079179 | No |
| 24 | 3 | 7 | 0.031297325 | No |
| 25 | 3 | 14 | 0.062500000 | No |
| 26 | 3 | 6 | 0.027231495 | No |
| 27 | 1 | 5 | 0.030298022 | No |
| 28 | 1 | 5 | 0.030298022 | No |
| 29 | 2 | 7 | 0.030843009 | No |
| 30 | 3 | 7 | 0.033988872 | No |
| 31 | 3 | 8 | 0.035991923 | No |
| 32 | 3 | 6 | 0.035145706 | No |
| 33 | 3 | 5 | 0.032079179 | No |
| 34 | 3 | 6 | 0.033364549 | No |
| 35 | 4 | 7 | 0.032273263 | No |
| 36 | 4 | 5 | 0.027892543 | No |
| 37 | 4 | 8 | 0.037422177 | No |
| 38 | 3 | 4 | 0.023044859 | No |
| 39 | 3 | 5 | 0.032079179 | No |
| 40 | 4 | 8 | 0.035145706 | No |
| 41 | 3 | 5 | 0.032079179 | No |
| 42 | 2 | 4 | 0.029012652 | No |
| 43 | 1 | 5 | 0.030298022 | No |
| 44 | 1 | 4 | 0.027231495 | No |
| 45 | 2 | 8 | 0.035991923 | No |
| 46 | 2 | 7 | 0.032273263 | No |
| 47 | 2 | 7 | 0.032273263 | No |
| 48 | 2 | 6 | 0.033988872 | No |
| 49 | 2 | 4 | 0.023044859 | No |
| 50 | 3 | 6 | 0.035145706 | No |
| 51 | 4 | 7 | 0.032079179 | No |
| 52 | 5 | 14 | 0.062500000 | No |
| 53 | 5 | 6 | 0.030298022 | No |
| 54 | 4 | 5 | 0.027892543 | No |
| 55 | 3 | 4 | 0.025450339 | No |
| 56 | 4 | 7 | 0.030843009 | No |
| 57 | 4 | 7 | 0.032079179 | No |
| 58 | 4 | 8 | 0.035991923 | No |
| 59 | 3 | 5 | 0.032079179 | No |
| 60 | 2 | 4 | 0.029012652 | No |
| 61 | 1 | 5 | 0.030298022 | No |
| 62 | 2 | 7 | 0.032273263 | No |
| 63 | 1 | 5 | 0.030298022 | No |
| 64 | 2 | 8 | 0.037422177 | No |
| 65 | 1 | 5 | 0.030298022 | No |
| 66 | 2 | 6 | 0.033988872 | No |
| 67 | 3 | 8 | 0.033585731 | No |
| 68 | 3 | 6 | 0.035145706 | No |
| 69 | 3 | 5 | 0.032079179 | No |
| 70 | 3 | 6 | 0.033364549 | No |
| 71 | 3 | 5 | 0.030298022 | No |
| 72 | 5 | 8 | 0.035991923 | No |
| 73 | 4 | 7 | 0.032273263 | No |
| 74 | 4 | 7 | 0.032273263 | No |
| 75 | 3 | 5 | 0.032079179 | No |
| 76 | 3 | 6 | 0.035145706 | No |
| 77 | 3 | 5 | 0.032079179 | No |
| 78 | 3 | 7 | 0.031297325 | No |
| 79 | 3 | 14 | 0.062500000 | No |
| 80 | 3 | 6 | 0.027231495 | No |
| 81 | 1 | 5 | 0.030298022 | No |
| 82 | 1 | 5 | 0.030298022 | No |
| 83 | 2 | 7 | 0.030843009 | No |
| 84 | 3 | 7 | 0.033988872 | No |
| 85 | 3 | 8 | 0.035991923 | No |
| 86 | 3 | 6 | 0.035145706 | No |
| 87 | 3 | 5 | 0.032079179 | No |
| 88 | 3 | 6 | 0.033364549 | No |
| 89 | 4 | 7 | 0.032273263 | No |
| 90 | 4 | 5 | 0.027892543 | No |
| 91 | 4 | 8 | 0.037422177 | No |
| 92 | 3 | 4 | 0.023044859 | No |
| 93 | 3 | 5 | 0.032079179 | No |
| 94 | 4 | 8 | 0.035145706 | No |
| 95 | 3 | 5 | 0.032079179 | No |
| 96 | 2 | 4 | 0.029012652 | No |
| 97 | 1 | 5 | 0.030298022 | No |
| 98 | 1 | 4 | 0.027231495 | No |
| 99 | 2 | 8 | 0.035991923 | No |
| 100 | 2 | 7 | 0.032273263 | No |
| 101 | 2 | 7 | 0.032273263 | No |
| 102 | 2 | 6 | 0.033988872 | No |
| 103 | 2 | 4 | 0.023044859 | No |
| 104 | 3 | 6 | 0.035145706 | No |
| 105 | 4 | 7 | 0.032079179 | No |
| 106 | 5 | 14 | 0.062500000 | No |
| 107 | 5 | 6 | 0.030298022 | No |
| 108 | 4 | 5 | 0.027892543 | No |
| 109 | 3 | 4 | 0.025450339 | No |
| 110 | 4 | 7 | 0.030843009 | No |
| 111 | 4 | 7 | 0.032079179 | No |
| 112 | 4 | 8 | 0.035991923 | No |
| 113 | 3 | 5 | 0.032079179 | No |
| 114 | 2 | 4 | 0.029012652 | No |
| 115 | 1 | 5 | 0.030298022 | No |
| 116 | 2 | 7 | 0.032273263 | No |
| 117 | 1 | 5 | 0.030298022 | No |
| 118 | 2 | 8 | 0.037422177 | No |
| 119 | 1 | 5 | 0.030298022 | No |
| 120 | 2 | 6 | 0.033988872 | No |
| 121 | 3 | 8 | 0.033585731 | No |
| 122 | 3 | 6 | 0.035145706 | No |
| 123 | 3 | 5 | 0.032079179 | No |
| 124 | 3 | 6 | 0.033364549 | No |
| 125 | 3 | 5 | 0.030298022 | No |
| 126 | 5 | 8 | 0.035991923 | No |
| 127 | 4 | 7 | 0.032273263 | No |
| 128 | 4 | 7 | 0.032273263 | No |
| 129 | 3 | 5 | 0.032079179 | No |
| 130 | 3 | 6 | 0.035145706 | No |
| 131 | 3 | 5 | 0.032079179 | No |
| 132 | 3 | 7 | 0.031297325 | No |
| 133 | 3 | 14 | 0.062500000 | No |
| 134 | 3 | 6 | 0.027231495 | No |
| 135 | 1 | 5 | 0.030298022 | No |
| 136 | 1 | 5 | 0.030298022 | No |
| 137 | 2 | 7 | 0.030843009 | No |
| 138 | 3 | 7 | 0.033988872 | No |
| 139 | 3 | 8 | 0.035991923 | No |
| 140 | 3 | 6 | 0.035145706 | No |
| 141 | 3 | 5 | 0.032079179 | No |
| 142 | 3 | 6 | 0.033364549 | No |
| 143 | 4 | 7 | 0.032273263 | No |
| 144 | 4 | 5 | 0.027892543 | No |
| 145 | 4 | 8 | 0.037422177 | No |
| 146 | 3 | 4 | 0.023044859 | No |
| 147 | 3 | 5 | 0.032079179 | No |
| 148 | 4 | 8 | 0.035145706 | No |
| 149 | 3 | 5 | 0.032079179 | No |
| 150 | 2 | 4 | 0.029012652 | No |
| 151 | 1 | 5 | 0.030298022 | No |
| 152 | 1 | 4 | 0.027231495 | No |
| 153 | 2 | 8 | 0.035991923 | No |
| 154 | 2 | 7 | 0.032273263 | No |
| 155 | 2 | 7 | 0.032273263 | No |
| 156 | 2 | 6 | 0.033988872 | No |
| 157 | 2 | 4 | 0.023044859 | No |
| 158 | 3 | 6 | 0.035145706 | No |
| 159 | 4 | 7 | 0.032079179 | No |
| 160 | 5 | 14 | 0.062500000 | No |
| 161 | 5 | 6 | 0.030298022 | No |
| 162 | 4 | 5 | 0.027892543 | No |
| 163 | 3 | 4 | 0.025450339 | No |
| 164 | 4 | 7 | 0.030843009 | No |
| 165 | 4 | 7 | 0.032079179 | No |
| 166 | 4 | 8 | 0.035991923 | No |
| 167 | 3 | 5 | 0.032079179 | No |
| 168 | 2 | 4 | 0.029012652 | No |
| 169 | 1 | 5 | 0.030298022 | No |
| 170 | 2 | 7 | 0.032273263 | No |
| 171 | 1 | 5 | 0.030298022 | No |
| 172 | 2 | 8 | 0.037422177 | No |
| 173 | 1 | 5 | 0.030298022 | No |
| 174 | 2 | 6 | 0.033988872 | No |
| 175 | 3 | 8 | 0.033585731 | No |
| 176 | 3 | 6 | 0.035145706 | No |
| 177 | 3 | 5 | 0.032079179 | No |
| 178 | 3 | 6 | 0.033364549 | No |
| 179 | 3 | 5 | 0.030298022 | No |
| 180 | 5 | 8 | 0.035991923 | No |
| 181 | 4 | 7 | 0.032273263 | No |
| 182 | 4 | 7 | 0.032273263 | No |
| 183 | 3 | 5 | 0.032079179 | No |
| 184 | 3 | 6 | 0.035145706 | No |
| 185 | 3 | 5 | 0.032079179 | No |
| 186 | 3 | 7 | 0.031297325 | No |
| 187 | 3 | 14 | 0.062500000 | No |
| 188 | 3 | 6 | 0.027231495 | No |
| 189 | 1 | 5 | 0.030298022 | No |
| 190 | 1 | 5 | 0.030298022 | No |
| 191 | 2 | 7 | 0.030843009 | No |
| 192 | 3 | 7 | 0.033988872 | No |
| 193 | 3 | 8 | 0.035991923 | No |
| 194 | 3 | 6 | 0.035145706 | No |
| 195 | 3 | 5 | 0.032079179 | No |
| 196 | 3 | 6 | 0.033364549 | No |
| 197 | 4 | 7 | 0.032273263 | No |
| 198 | 4 | 5 | 0.027892543 | No |
| 199 | 4 | 8 | 0.037422177 | No |
| 200 | 3 | 4 | 0.023044859 | No |
| 201 | 3 | 5 | 0.032079179 | No |
| 202 | 4 | 8 | 0.035145706 | No |
| 203 | 3 | 5 | 0.032079179 | No |
| 204 | 2 | 4 | 0.029012652 | No |
| 205 | 1 | 5 | 0.030298022 | No |
| 206 | 1 | 4 | 0.027231495 | No |
| 207 | 2 | 8 | 0.035991923 | No |
| 208 | 2 | 7 | 0.032273263 | No |
| 209 | 2 | 7 | 0.032273263 | No |
| 210 | 2 | 6 | 0.033988872 | No |

## Compat invariants

| Invariant | Diagnostic preservation |
|---|---|
|Draw order/opacity/blend|Production renderer untouched|
|Groups/isolation/clip semantics|Untouched; no new flattening|
|Timing/settings|Original scene and integer frame seeks retained; retained renders analyzed, exact-suite workers use the prebuilt bundle|
|Frozen contracts/default|Schemas/assertions unchanged; legacy default and GPU opt-in retained|
|Parity/determinism|FM2.1 pins unchanged; exact M0 equality remains failing, not waived|

## Raphael's separate A–M preserve check

| Principle | Check |
|---|---|
|A Directed temporal anchors|No timing edits|
|B Editable causality|Editable source retained|
|C Gradient of agency|User coverage rule and stop discipline respected|
|D Perceptual-evidence loop, advisory|Evidence reported; no heuristic override|
|E Scoped AI authority|Diagnostic scope only|
|F Procedural deterministic motion|THREATENED; exact-repeat failures retained|
|G Advanced temporal geometry|Untouched|
|H One lighting model|Untouched|
|I Recipes as editable executable knowledge|No recipe edits|
|J Model neutrality|Provider-independent diagnostics|
|K External-agent operation|Existing operation preserved|
|L One canonical scene/render state|Canonical and repaired scene results separated|
|M Preserved roadmap|No unauthorized implementation or next milestone|


## Evidence and next step

The scripts, classification ledger, completed suite rows, complete worker logs, and timebox timestamps accompany this report. M0 sources: runs/fm2-2/repin-check/m0-a and m0-b; historical reference: the events[0].b path in serial-acceptance-tagged/12.json. Identity evidence: ../repin-check/m0-identity.json. Exact GPU references: runs/fm2-1/accepted-gate/parity-gate.json, launches[0].

No further sampling is scheduled. The remaining check is the unfinished editorial second-browser identity run; its first GPU re-measurement is valid and unchanged. No renderer regression is inferred from process termination. Run14 stays open and UNVERIFIED. F remains THREATENED. Conditional acceptance remains ten clean suites, five uncached repeats, then 98/98; none started here. Banding histogram approval remains pending independently.
