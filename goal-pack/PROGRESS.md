# labs — progress ledger

<!-- Structure the hooks rely on: goals are h2 sections; machine-checked tables have a "Verdict" column
     and an "Evidence" column; the environment table uses "Proof" and the change ledger has no Verdict
     column, so the gate leaves them alone. An empty verdict means "not done yet". -->

**Status: not started.**

Verdicts: PASS / FAIL / BLOCKED / DEFERRED (defined in goal-brief.md). The "Plan" column is fixed before
the run; to change a plan, write the reason here first. "measure" means run it and quote the output,
including the exit code where the row is about one. A "control" is a planted violation that must turn
the check red. Never write a pipe character inside a cell: it splits the cell (facts F14).

## Environment (filled in G0; every row with the command and its output)

| Item | Value | Proof |
| --- | --- | --- |
| Node | | |
| pnpm (selected by packageManager) | | |
| Docker, Compose | | |
| The three images by digest | | |
| Ports 18460–18469 | | |

## Environment change ledger (before → change → restored)

| # | Goal | Object | Before | Change | Restored |
| --- | --- | --- | --- | --- | --- |

## Contract changes (frozen in G0; any later rename or reshape goes here)

| Date | Entry | Content |
| --- | --- | --- |

---

## G0 — toolchain, the environment re-measured, the given files read, the contract frozen

| Condition | Verdict | Evidence |
| --- | --- | --- |
| E1 Node, pnpm (11.28.0 inside the repository), Docker and Compose recorded with the commands' output and compared with F2 | | |
| E2 `pnpm install` succeeds with pnpm-workspace.yaml unchanged and no build script; the installed versions of the toolchains are those of F9 | | |
| E3 the three images of SCOPE.md section 1 are present by digest (`docker image inspect`), and each runs with `--network none` (the `mongod --version` and `java -version` lines of F3; actionlint's `-version`) | | |
| E4 ports 18460–18469 are free (the `ss` check of F4), and no Docker object named `labs-*` exists (containers, volumes, networks) | | |
| E5 the given `lab-b/build.sbt` and `lab-b/project/build.properties` pin the versions of F6, and a standard-library hello world compiles and runs offline in the sbt image as F6 shows (from a scratch copy in the OS temp directory, sources copied inside the container) | | |
| E6 a first Vitest test passes, and `pnpm lint` and `pnpm typecheck` are clean over every directory that holds code (quote Biome's file count) | | |
| E7 SCOPE.md marked FROZEN with the date, its content otherwise unchanged | | |
| E8 the change set is limited to `pnpm-lock.yaml`, the first test and this ledger (`git status --short`) | | |

## G1 — lab A, part 1: data, CSV, the store, the naive reports, the goldens

| AC | Item | Plan | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| AC-1 | xorshift32 with seed 20261005: the first five values, from a test that pins them (quote the test and its values) | measure | | |
| AC-2 | the generator: documents per collection for S and L (quote both reports), the boundary events of every user present (two per collection), and two generations of the same size give the same canonical dump (quote its sha256 twice) | measure | | |
| AC-3 | the CSV writer: one test per rule of SCOPE.md 2.2 (BOM, header, CRLF after every row including the last, quoting of a comma, of a quote and of a line break, a doubled quote, plain integers), each with a control that breaks the rule and fails | measure | | |
| AC-4 | the store: the in-memory and the MongoDB implementations answer the same find and the same window aggregation alike on size S (quote the test against a running `labs-a`) | measure | | |
| AC-5 | `lab-a/compose.yaml` as SCOPE.md 2.8 says: the image by digest, 127.0.0.1:18460, tmpfs, the healthcheck, the six proxy variables empty (quote the file); `up -d --wait` reaches healthy and `down -v` leaves no container, volume or network of `labs-a` (quote both) | measure | | |
| AC-6 | the naive implementation sends exactly the requests of SCOPE.md 2.3 in that order, each awaited before the next (quote the code lines) | read + quote | | |
| AC-7 | the naive requests counted on S and on L for each of the four reports: `find` 25 and 1,041, `aggregate` 0, `getMore` 0 (quote the counts and the zero-at-start line) | measure | | |
| AC-8 | the window: a user's boundary event at the upper bound is in no report and the one at the lower bound is in every report (quote a row of S and the arithmetic) | measure | | |
| AC-9 | the A/A check: two naive runs of every report and size are byte-identical (quote the eight pairs of sha256) | measure | | |
| AC-10 | `pnpm lab:a:golden` writes the eight goldens and `SHA256SUMS` (quote the file) and exits 0; run again, it refuses with exit 2 and writes nothing (control) | measure | | |
| AC-11 | the goldens read as SCOPE.md says: the first bytes are `ef bb bf`, every line ends in CRLF, the row counts are 20 and 1,000 users and 4 and 40 groups plus the header, and the quoted names `"サポート, 第一3"` and `"企画""室""4"` appear (quote `xxd`, counts and lines) | measure | | |
| AC-12 | after an A/A difference planted in a scratch copy (a varying field in the naive output), `pnpm lab:a:golden` in that copy exits 1 and writes no golden (control) | measure | | |

### G1 checks

| Check | Verdict | Evidence |
| --- | --- | --- |
| `pnpm test` passes (quote the count), twice in a row with the same count | | |
| `pnpm lint` and `pnpm typecheck` are clean | | |
| No Docker object of `labs-*` and no listener on 18460–18469 is left (quote the checks) | | |
| The change set is limited to the deliverables and this ledger (`git status --short`) | | |

## G2 — lab A, part 2: the bulk reports, byte equality, requests and timings

| AC | Item | Plan | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| AC-13 | the bulk implementation sends the three requests of SCOPE.md 2.3 together and folds in memory in the order of the reports (quote the code lines) | read + quote | | |
| AC-14 | on the in-memory store, bulk and naive give identical bytes for the four reports of size S (quote the test) | measure | | |
| AC-15 | on MongoDB, size S: the four bulk outputs match the goldens by sha256 and by a byte comparison (quote the four sha256 and the comparison's result) | measure | | |
| AC-16 | the same on size L | measure | | |
| AC-17 | the naive implementation still matches the goldens on both sizes, in the same `pnpm lab:a` run (quote the lines) | measure | | |
| AC-18 | the bulk requests counted per report: `find` 2 and `aggregate` 1 on both sizes, `getMore` as measured (quote the counts of both sizes) | measure | | |
| AC-19 | counting is clean: a fresh client per export, zero at the start; a planted extra query in a scratch copy shows up in the count and fails the check (control) | measure | | |
| AC-20 | timings on L: four reports × two implementations, one discarded warm-up and three runs each, the median and the range (quote the table with its machine block) | measure | | |
| AC-21 | timings on S, the same table (quote it) | measure | | |
| AC-22 | `pnpm lab:a` exits 0 on the repository; 1 on a scratch copy with one golden byte changed (control); 3 when 18460 is taken by a listener of the run's own (control) — quote the three | measure | | |
| AC-23 | the result files: `lab-a/results/<UTC date>-linux-x64.json` and `.md` exist, carry the machine block of SCOPE.md 1.4 and every raw timing (quote the machine block and a raw array) | measure | | |
| AC-24 | two consecutive `pnpm lab:a` runs agree on everything but the timings: the equalities and the request counts (quote both summaries) | measure | | |

### G2 checks

| Check | Verdict | Evidence |
| --- | --- | --- |
| `pnpm test` passes (quote the count), twice in a row with the same count | | |
| `pnpm lint` and `pnpm typecheck` are clean | | |
| The goldens are unchanged since G1 (`git diff --stat -- lab-a/goldens` empty and `sha256sum -c` of SHA256SUMS passes) | | |
| No Docker object of `labs-*` and no listener on 18460–18469 is left (quote the checks) | | |

## G3 — lab B: blocking await on a pool of three

| AC | Item | Plan | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| AC-25 | `Lab.scala` uses the standard library and the JDK only, and the given build files are unchanged (quote the imports and `git diff --stat -- lab-b/build.sbt lab-b/project`) | read + quote | | |
| AC-26 | the server, the two paths and their executors as SCOPE.md 3.1 says: the server's own cached pool, `/health` touching no pool, `/work` waiting at most 30 s on the server thread (quote the code lines) | read + quote | | |
| AC-27 | the four services as the table of SCOPE.md 3.1 (quote the code of each arm) | read + quote | | |
| AC-28 | the client: bursts of 8, 20 and 20 released by a latch, 5 s per request, one second between bursts, a probe and `/health` after each (quote the code lines) | read + quote | | |
| AC-29 | arm `fixed-await` as expected: burst 1 fewer than 8 ok, every probe a timeout, bursts 2 and 3 with 0 ok, `/health` 200 after every burst (quote its `LAB-B` lines) | measure | | |
| AC-30 | arm `global-await` as expected: 48 ok, every probe ok, `/health` 200 (quote its lines) | measure | | |
| AC-31 | arm `global-noextra` as expected, started with the three options of SCOPE.md (quote the options from the runner's command and its lines) | measure | | |
| AC-32 | arm `fixed-compose` as expected: 48 ok, every probe ok (quote its lines) | measure | | |
| AC-33 | each arm ran in its own container `labs-b-<arm>` with `--network none`, the sources copied inside, nothing written to the repository (`git status --short lab-b` shows only the program and the results; no `target/`) | measure | | |
| AC-34 | the runner compares with the table of SCOPE.md 3.3: on a scratch copy whose expected table is flipped for one arm, `pnpm lab:b --arm global-await` exits 1 and names the difference (control) | measure | | |
| AC-35 | the result files of lab B with the machine block, the table per arm and the raw lines (quote the Markdown) | measure | | |
| AC-36 | a second `pnpm lab:b` gives the same outcome per arm (quote both summaries) | measure | | |

### G3 checks

| Check | Verdict | Evidence |
| --- | --- | --- |
| `pnpm test` passes (quote the count; it includes the `LAB-B` parser and the comparison with a mismatch), twice in a row with the same count | | |
| `pnpm lint` and `pnpm typecheck` are clean | | |
| No container `labs-b-*` is left and no `target/` exists under `lab-b/` | | |
| The change set is limited to the deliverables and this ledger (`git status --short`) | | |

## G4 — lab C: the same application built two ways

| AC | Item | Plan | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| AC-37 | the generator: 1,000 modules and the entry; two generations are byte-identical (quote a sha256 of the tree twice); every module carries its own label `m<i>` and the classic runtime import (quote two files) | measure | | |
| AC-38 | the webpack setup as SCOPE.md 4.2: the loader, both presets with `runtime: 'classic'`, the HTML plugin, production mode, the dev server on 127.0.0.1:18461, no persistent cache (quote the config) | read + quote | | |
| AC-39 | the Rsbuild setup as SCOPE.md 4.2: the plugin with the classic runtime, `mountId`, the dev port 18462, no persistent cache (quote the config) | read + quote | | |
| AC-40 | the equivalence check: both production builds contain all 1,000 labels and an HTML page with `id="root"` that references an emitted script (quote the summary); on a scratch copy with one label removed from a build's output, the check fails and names the label (control) | measure | | |
| AC-41 | cold production builds: one discarded warm-up and five runs per tool, the output directory and the cache removed before each (quote the removal in the code and the table with its machine block) | measure | | |
| AC-42 | dev-server start: one discarded warm-up and five starts per tool, timed to the page and its first script answering 200 (quote the table and the definition's code lines) | measure | | |
| AC-43 | after every start the process is gone and its port free before the next one, and nothing listens on 18461 or 18462 at the end (quote the checks) | measure | | |
| AC-44 | the result files of lab C with the machine block, the tables and every raw run (quote the Markdown) | measure | | |
| AC-45 | a second `pnpm lab:c` also exits 0; both runs' medians are written down side by side, with no claim beyond them (quote both tables) | measure | | |

### G4 checks

| Check | Verdict | Evidence |
| --- | --- | --- |
| `pnpm test` passes (quote the count; it includes the generator and the equivalence check with a missing label), twice in a row with the same count | | |
| `pnpm lint` and `pnpm typecheck` are clean, and the generated `lab-c/app/` is ignored by Git, Biome and tsc | | |
| No listener on 18460–18469 and no process of the run is left (`pgrep -fa` for the dev servers prints nothing) | | |
| The change set is limited to the deliverables and this ledger (`git status --short`) | | |

## G5 — README, CI and closing

| AC | Item | Plan | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| AC-46 | README.md: the English summary; the seven sections with exactly the names of SCOPE.md 6, in order (quote `grep -n '^## '`); the signature line exactly, as the last line (quote `tail -n 1`) | read + quote | | |
| AC-47 | 背景 links case study 07 and keeps the two lists of `materials/practice.md` section 4 (quote them); no figure of the author's work anywhere in the repository (quote a search for the practice's numbers, expected empty) | read + quote | | |
| AC-48 | 結果 quotes only the run's result files, every table with its machine block, and reads them no further than the runs carry (quote the tables and their sources) | read + quote | | |
| AC-49 | 動かし方 gives one command per lab and its prerequisites; 制約・既知の限界 names at least the single machine, the timing spread, the image lab B needs and what CI runs smaller (quote them) | read + quote | | |
| AC-50 | `.github/workflows/ci.yml` has the jobs of SCOPE.md 6; every `uses:` is a SHA of F12 with its version comment; `permissions: contents: read`; no `corepack enable`; actionlint by digest reports nothing (quote the command of F15 and its output) | measure | | |
| AC-51 | PUBLISHING.md has the descriptions (the English one at most 350 characters; quote its length), topics and the checklist; LICENSE is unchanged (`git diff --stat -- LICENSE` empty) | measure + read | | |
| AC-52 | on the final build, the three labs end to end once more: `pnpm lab:a`, `pnpm lab:b` and `pnpm lab:c` each exit 0 (quote the last lines of each) | measure | | |

### G5 closing

| Condition | Verdict | Evidence |
| --- | --- | --- |
| SCOPE.md rewritten as AS-BUILT, every difference from the frozen contract marked with a reason | | |
| Change list, and one proposed commit message per goal (G0–G5) | | |
| Nothing temporary left in the repository (`git status --short` shows deliverables only; `lab-c/app/` is ignored) | | |
| Nothing of the run left: no Docker object `labs-*`, no listener on 18460–18469, no temporary directory of the run in the OS temp directory | | |
| The goldens still have the sha256 of AC-10 (`sha256sum -c lab-a/goldens/SHA256SUMS` passes) | | |
| No unexplained empty verdict anywhere | | |

---

## Handover (filled at the end; each item = fact, impact, the decision needed)

## Incidental findings (recorded, not fixed)

| # | Finding | Where | Note |
| --- | --- | --- | --- |
