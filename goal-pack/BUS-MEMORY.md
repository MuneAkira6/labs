# Bus memory — labs

**This complements the ledgers; it does not summarise them.** Anything in PROGRESS.md, BUS-LOG.md or the
goal brief does not belong here. When a later measurement shows an entry was wrong, come back and
replace it. Marks: 🆕 new · ✅ verified · 🔴 warning · ~~struck~~ no longer true.

## Environment facts across goals

- 🆕 Measured while the pack was written (2026-10-05; facts.md F1–F15): Ubuntu 20.04.6, 12 CPUs, 46 GiB;
  Node `v24.19.0`; pnpm `11.28.0` selected by `packageManager` (global 11.22.0, corepack not enabled);
  Docker 28.1.1 and Compose 2.35.1.
- 🆕 Ports 18460–18469 were free; SCOPE.md assigns 18460 (MongoDB), 18461 and 18462 (dev servers). Other
  users' containers and listeners exist on this machine and must not be touched.
- 🆕 The images are on the machine and are used by digest only: `mongo` 7.0.43, the sbt image (sbt
  1.13.0, Scala 3.8.4, JDK 21.0.12, runs as root), actionlint. Nothing is pulled, tagged or removed.
- 🆕 The proxy variables are set and bypass 127.0.0.1. Nobody unsets or prints them. `pnpm install` is
  the only network access of the run.
- 🆕 The relay is goal-bus-kit `bce56e8`; one review may take 2,700 s here (runbook.md). Plan reviews for
  about 20 minutes (BUS-PROTOCOL.md section 2).
- ✅ G0 re-measured and I confirmed each myself: Node `v24.19.0`; pnpm `11.28.0` in the repository root
  (global 11.22.0 switched by `packageManager`, corepack still not enabled); Docker 28.1.1 build 4eba377;
  Compose 2.35.1. Ports 18460-18469 free; no Docker object `labs-*`; no `labs-*` entry in `/tmp`.
- ✅ The three images resolve by digest with these ids (no pull needed, 0 dangling images):
  mongo `1b70d5bf141c`, sbt `82a8897dcd92` (the id of F3), actionlint `7ef0d156288b`. Offline runs I made
  myself: `db version v7.0.43` and actionlint `1.7.12` / `built with go1.26.1 compiler for linux/amd64`.
- ✅ `pnpm install` is done and the lockfile is written: all twelve F9 versions are installed exactly
  (mongodb 7.7.0, webpack 5.111.1, webpack-dev-server 6.0.0, html-webpack-plugin 5.6.8, babel-loader
  10.1.1, @babel/core 8.0.6, both presets 8.0.1, @rsbuild/core 2.2.11, @rsbuild/plugin-react 2.1.1,
  react and react-dom 18.3.1), plus biome 2.5.15, typescript 7.0.2, vitest 5.0.3, @types/node 24.19.1.
  No later goal needs to install anything.
- ✅ Biome checks 3 files today (`biome.json`, `test/xorshift32.test.ts`, `vitest.config.ts`) because
  `biome.json`'s `includes` names `lab-a`, `lab-c`, `tools`, `test`, `vitest.config.ts` and the first three
  do not exist yet. Biome counts its own config file even though `includes` does not list it. The count
  will jump in G1; a count that does *not* jump means new code is outside `includes`.
- ✅ The run is on branch `main` (the runbook asked the human to branch; the worker is forbidden to).
  Nothing to do, but the human commits onto whatever this is.

## Doubts to re-check

- 🔴 **Every artifact a later run rewrites must be re-quoted after the final run.** This bit G2: the
  worker re-pinned the build digest after the last `pnpm lab:a` but left AC-20/21/23 quoting the earlier
  run's result file. Lab B and lab C write result files the same way, so check it again in G3 and G4:
  the machine block, the raw arrays and any byte size quoted in a row must appear verbatim in the file
  that is on disk at the end of the goal.

- 🔴 **`pnpm lab:a` writes no result files yet.** `grep -n 'results' tools/lab-a.ts` matches nothing and
  `lab-a/` holds no `results/`. SCOPE.md 1.4 says *every* lab run writes the two files, so G2's AC-23 has
  to put that inside `pnpm lab:a` itself, not beside it. Until then "lab:a exits 0" is not yet 2.7
  conformance. Check it in G2.
- 🔴 `NON_REQUEST_COMMANDS` in `lab-a/src/counting.ts` allow-lists nine names, but F17 records that only
  `endSessions` was ever emitted here. An unexpected command that happens to be on that list would be
  swallowed instead of failing the check. Harmless for naive; G2's bulk adds `aggregate` and a real
  `getMore`, so ask that the runner print the whole `listed` tally per export, not only the requests.
- 🆕 AC-2's determinism test compares two generations inside one process. I closed that gap myself from a
  separate process; if the generator ever grows module-level state, the in-process check alone would not
  see it.

- 🔴 **Two copies of xorshift32.** `test/xorshift32.test.ts` writes the recurrence out inline (lines 6-14)
  instead of importing it, because `lab-a/src/data.ts` did not exist in G0. It therefore pins the contract
  against its own copy and could not catch a divergent generator. G1's AC-1 must pin all five values
  against the real generator and the inline copy must go, or the two will drift. Check this in G1.
- 🔴 E2 concluded "no dependency wanted a build script" from `strictDepBuilds: true` plus exit 0 — an
  inference about pnpm's behaviour, not an observed red control. Acceptable (it is pnpm's own gate, not
  the run's check), but it is the one G0 green with no control behind it.
- 🆕 actionlint prints `1.7.12`, which F15 never recorded. No facts entry was added. If G5's AC-50 cites a
  version rather than the digest, it needs an F16 entry first.

## The worker's habits

- ✅ G0 was honest and precise: every number I re-measured matched, including two lists I recounted in
  full (the twelve F9 versions, Biome's three files). Nothing was rounded up; the two conditions that
  could not be met literally (SCOPE.md already frozen, the relay's own untracked files) were written as
  annotated PASS with the reason instead of being glossed over. Keep trusting, keep recounting.
- 🆕 Habit worth watching: the worker reasons from a setting to a conclusion (E2's build-script argument)
  rather than planting a control. From G1 on the rows demand real controls; hold the line there.
- 🔴 **Counts and decompositions get stated from memory, not counted.** Three instances now: G1's test
  split (claimed 18 + 9, actually 19 + 8), G2's "all 13 table rows grep -F matched" (16 rows, and the
  match cannot exist), and both times the underlying numbers were right. The work is sound and the
  summaries are loose. Recount every enumeration in every goal; it is the cheapest finding available.
- ✅ G1 did exactly what the bus asked and did not quietly narrow it: the duplicated xorshift32 was
  collapsed to one copy in `lab-a/src/data.ts`, `test/xorshift32.test.ts` was replaced by
  `test/data.test.ts` which imports it, and all five contract values are pinned. `grep 'x << 13'` now
  matches `lab-a/src/data.ts` only. The AC-4 trap I warned about was solved the way I suggested.
- 🆕 Every control in `test/csv.test.ts` asserts the *specific* violation message rather than a non-empty
  array, so a control cannot pass for the wrong reason. Hold later goals to that standard.
- 🔴 One recount found a small error: the G1 checks row decomposes the 27 tests as "8 CSV rules with
  their 10 controls" plus "7 generator checks with their 2 controls" (18 + 9). The real split is
  `test/csv.test.ts` 19 (9 + 10 controls) and `test/data.test.ts` 8 (6 + 2 controls). The quoted total of
  27 is right and I reproduced it twice; only the attribution is off. The worker rounds a decomposition
  from memory instead of counting it — recount every such split.
- 🆕 Timings in the evidence are internally consistent (worker start 16:45:28, install 16:46:16, sbt probe
  `[success] … 7:50:51 AM` UTC = 16:50:51 JST, test 16:51:24, ledger 16:53:32). File mtimes are a cheap
  authenticity check on any later goal's narrative.

## Proven along the way — later goals may cite

- ✅ **The goldens are correct against the contract, not merely self-consistent.** In review 2 I wrote my
  own generator and CSV writer from SCOPE.md 2.1-2.2 alone, importing nothing of the run's code, and it
  reproduced all eight goldens byte for byte and both sizes' document counts. So any later byte
  difference is a defect of the differing implementation, with no room left for "maybe the golden was
  wrong". The eight digests, now triple-sourced (A/A check, the run's goldens, my rebuild):
  S/users-usage `38ddc64162c34f87`, S/groups-usage `dc6cc2273d5371fe`, S/users-charge `d7ee2db547f175e9`,
  S/groups-charge `2c6a354e20ab2364`, L/users-usage `c26ff21b03306954`, L/groups-usage `e46fde13d029aaba`,
  L/users-charge `524031bf281f918b`, L/groups-charge `d2e1d543d354602a`.
- ✅ The generator's counts, reproduced in a separate process by my own code: S `{groups 4, users 20,
  usage_events 487, charge_events 78}`, L `{groups 40, users 1000, usage_events 24546,
  charge_events 3460}`. Cross-process determinism is therefore established, not only the run's
  twice-in-one-process check.
- ✅ The naive shape really is 1 + groups + users requests: wrapping the in-memory store myself I counted
  25 `find` calls on S and 1041 on L for each of the four reports, with 0 aggregates. G2 may cite this.
- ✅ `lab-a/src/csv.ts`'s `csvViolations` is a real checker, not a no-op: clean on the real golden bytes
  and red on eight violations I planted myself in them (BOM stripped, final CRLF dropped, CRLF to bare
  LF, the comma name unquoted, the quote name's inner quotes left single, an integer in exponential form,
  the header renamed, a needless pair of quotes).
- ✅ G2's numbers that later goals may cite, all from the committed
  `lab-a/results/2026-10-05-linux-x64.{json,md}` and recounted by me: on L the naive medians are
  424, 424, 325, 327 ms and the bulk medians 26, 25, 7, 6 ms; on S naive 12, 12, 10, 9 ms and bulk 1 ms
  throughout, which is at the resolution of whole-millisecond rounding and must not be read as a ratio.
  Request counts: naive `find` 1041 on L and 25 on S with 0 aggregates and 0 `getMore`; bulk `find` 2 and
  `aggregate` 1 on both sizes, `getMore` 0 on S and 2 on L. G5's 結果 must quote these, not the ledger's
  earlier run.
- ✅ `pnpm test` is Docker-free: 27 tests pass with no `labs-a` container and nothing on 18460. The
  MongoDB parity check lives in `tools/store-parity.ts`, outside Vitest's `test/**/*.test.ts`, which is
  the arrangement G5's CI needs too.

- ✅ The given files are byte-identical to HEAD after G0: `package.json`, `pnpm-workspace.yaml`
  (sha256 `7be97c2c93b4…`), `tsconfig.json`, `biome.json`, `vitest.config.ts`, `LICENSE`, `.gitignore`,
  `.gitattributes`, `lab-b/build.sbt`, `lab-b/project/build.properties`, SCOPE.md and facts.md (15 entries,
  F1-F15 untouched). A later goal may cite this rather than re-diffing everything.
- ✅ `lab-b/build.sbt` line 3 `scalaVersion := "3.8.4"`, line 6 `fork := true`;
  `lab-b/project/build.properties` line 1 `sbt.version=1.13.0`. G3 may cite this for AC-25.
- ✅ `.gitattributes` already protects the goldens (`lab-a/goldens/** -text`, global `eol=lf`) and
  `.gitignore` already ignores `lab-c/app/`, `lab-b/target/`, `node_modules/`, `.claude/`
  (`git check-ignore` confirms `lab-c/app`). G4's ignore check can cite this.
- ✅ `vitest.config.ts` carries `testTimeout: 30_000` and `include: ['test/**/*.test.ts']`, so the
  portability rule of SCOPE.md is already satisfied by a given file; no goal needs to add it.
- ✅ `pnpm test` / `pnpm lint` / `pnpm typecheck` all exit 0 on `eb6646f + 013b33a1435e`
  (`Tests  1 passed (1)`, `Checked 3 files`, no diagnostic). That is the clean baseline G1 starts from.

## What the bus verified itself

### Review 7 — G5 (2026-10-06), PASS, and the run is DONE

- Digest `108383f2dd69` at `eb6646f`; goldens OK ×8; the hook reports 0 rows without a verdict in all
  six goals, and the six tallies sum to 82 (8 + 52 ACs + 16 checks + 6 closing).
- **The trap I flagged hardest came out clean.** AC-52's final runs crossed midnight UTC, so each lab now
  holds a `2026-10-05` and a `2026-10-06` pair. The README names the `2026-10-06` file for each lab, and
  I recomputed every published number from `runsMs` in those files: all 16 lab A rows, both lab C rows
  and every machine-block line match verbatim, with zero mismatches. Lab C's block omits `docker`; lab
  A's and lab B's carry it.
- Verified myself: the seven README sections in the contract's exact names and order; `tail -n 1`
  byte-identical to the required signature line (`cmp` against a file I wrote from SCOPE.md 6); all 12
  `uses:` in ci.yml pinned to F12's SHAs with version comments and nothing unpinned; actionlint by digest
  offline printing nothing with rc=0; PUBLISHING.md's English description 349 characters; LICENSE
  unchanged; no secret or home path in any committed file; practice.md's only numeric overlap with the
  README is `1,000`, `07` and single digits, so no figure of the author's work leaked.
- Incidental finding 1 was fixed with the free window I offered: lab B's `2026-10-06` Markdown has zero
  occurrences of "as expected" and four `Observed:` lines carrying the measured values plus
  `Differences from the row above: none.`
- SCOPE.md is AS-BUILT (2026-10-06) with a section 9 naming one contract change and the clarifications;
  my own 4.4 edit survives inside it, attributed.
- The Handover is the best document of the run: six items in fact/impact/decision form, including the
  two that I was about to raise myself — every result file reading `eb6646f+dirty` so a committed file
  names a commit that does not contain it, and the fact that pruning the earlier result set would leave
  G2/G3/G4's ledger rows pointing at files that no longer exist. The worker also disclosed 7 Scala
  compiler warnings nobody asked about.
- 🔴 Note on my own hygiene: I left two `/tmp/labs-bus-*` files from the signature `cmp` and only noticed
  them in the final environment sweep. Removed. The bus is bound by the same rule as the worker.

### Review 6 — G4 (2026-10-05), PASS

- Digest `b7365a62d6c4` at `eb6646f`; goldens still OK ×8; `lab-c/app/` ignored by Git, Biome and tsc.
- **I reproduced the contract change's measurement independently** in `/tmp/labs-bus-g4-*`: webpack
  production with html-webpack-plugin and a template holding `<div id="root"></div>` emits
  `<div id=root>` under `minify` default, `minify: false`, `minify: {}` **and**
  `minify: {removeAttributeQuotes:false}`, and only `mode: 'development'` keeps `<div id="root">`. The
  worker's surprising claim that `minify: false` does not help is true. The relaxation of 4.4 is
  therefore justified: the literal string is unreachable without leaving the production mode 4.2
  requires, and 8 forbids tuning. 4.3 rightly keeps the literal check (F21, matching my last variant).
- Recounted all four timing entries from `runsMs`: webpack build median 4286.976 → 4287 (4250-4344),
  rsbuild 350.355 → 350 (348-368), webpack dev start 2473.869 → 2474 (2430-2518), rsbuild 437.555 → 438
  (414-442); warm-ups kept separately and excluded, 5 runs each, 1 warm-up. The published `.md` rows
  match. **Watch my own method here:** my first pass compared `round(median)` with the file's unrounded
  float and printed four false MISMATCHes. Compare unrounded to unrounded.
- Lab C's machine block omits `docker` (keys `date, os, arch, cpu, memoryGiB, node, commit`) and says why
  in the Markdown, while lab A's and lab B's still carry `28.1.1`. The trap I flagged was handled.
- Verified 4.2 compliance by reading both configs: `@babel/preset-react` with `runtime: 'classic'`,
  `cache: false` and `cacheDirectory: false`, port 18461; `pluginReact({ swcReactOptions: { runtime:
  'classic' } })`, `html: { mountId: 'root' }`, port 18462, no persistent cache.
- `missingLabels` now tokenises with `matchAll(/m\d+/g)` into a Set, and the control at
  `test/lab-c.test.ts:205` asserts both that the naive `includes('m5')` would have returned true and that
  the real check reports `m5` missing — a control that documents the bug it prevents. Suite 90 passed
  across 7 files with 40 controls, lint 30 files, typecheck rc=0.
- Ledger rows 5 and 6 cover 18461 and 18462; incidental finding 1 is now recorded; equivalence records
  observed values (`labelsFound`, `mountsOnRoot`, `firstScriptSrc`, `violations`) rather than a verdict
  word, which is the lab B lesson applied. Environment clean, no dev-server process.
- 🔴 The one gap, which **I fixed myself rather than rejecting**: the change was recorded under "Contract
  changes" but SCOPE.md 4.4 still carried the old literal text, and SCOPE.md's own header says the text
  is then updated. I edited 4.4 and added a boxed note naming the change, the facts entries and my own
  reproduction. The digest is unaffected because it excludes `goal-pack/`.

### Review 5 — G3 (2026-10-05), PASS

- Digest `750a9b21959f` at `eb6646f`; goldens still OK ×8 with an empty diff; `lab-b/` holds only the
  program, the two given files and `results/`, with no `target/` anywhere.
- Read `Lab.scala` in full against SCOPE.md 3.1: server on 127.0.0.1 port 0 with its own cached pool
  (92-94), `/work` waiting on the server thread at most 30 s (102), `/health` touching no pool (112),
  the four services exactly as the table writes them (29, 39, 47), the client in the same JVM with its
  own executor (117-118), bursts 8/20/20 released by a `CountDownLatch` with 5 s per request (137-159),
  one second between bursts (166), probe at 5 s and health at 2 s after each (168-175), `health` 0 when
  nothing answers, and `sys.exit(0)` (208). Imports are `java.*` and `scala.*` only.
- **Checked the thing I warned about and it is right**: `tools/lab-b-outcomes.ts` models burst 1 as
  `{ kind: 'fewerThan', than: 8 }` for the frozen arms and compares with `<` (190-193), with a comment
  saying that asserting a number would harden a race. `compareWithExpected` also cross-checks per-burst
  sums, the summary against the bursts, the total of 48 and the exact key sets of both line shapes.
- Verified the docker invocation matches 3.2 argument for argument: `run --rm --name labs-b-<arm>
  --network none -v <mount>:/src:ro <image by digest> bash -c <one argument>`, args as an array, 300 s
  per container, and a `docker rm -f` fallback if the client is killed. The *published* form substitutes
  `<repository>/lab-b` for the host path, and `grep -c "$HOME"` is 0 in both result files.
- Verified AC-35's quotations against the artifact myself: sizes 9222 and 4502 bytes exactly,
  `"differences": []` at JSON lines 127, 194, 261 and 328, and the two expectation sentences at Markdown
  lines 30, 52, 74 and 96 in the stated frozen/working/frozen/working order.
- **Reconciled a count rather than reporting it as an error.** `pnpm test` says 72 while `it(`
  declarations number 69; `test/reports.test.ts` declares 4 but runs 7 because line 15 loops
  `for (const report of REPORTS) it(…)`. The worker's 72 is a direct vitest quote and is correct. My
  `pgrep -fa 'labs-b|sbt '` also looked alarming but only matched the worker's own prompt text and my
  own shell — no sbt or java process is left.
- F19 is the best facts entry of the run so far: the count is 0 in all four observations per frozen arm,
  and it still argues that 3.3's "fewer than 8" is the right contract because the number is a race, and
  that asserting 0 would make the lab fail on a slower machine for no good reason.
- 🔴 The one gap: the **Incidental findings table in PROGRESS.md is empty**, yet the worker raised a
  finding in chat (the runner writes `Observed: as expected` into the published result file). Chat is
  ephemeral; that table is the artifact. Required as G4's first action and re-checked next review.

### Review 4 — G2 re-review (2026-10-05), PASS

- The reject was fixed properly and the worker found a second defect of the same kind in their own fix:
  the JSON is written with `JSON.stringify(payload, null, 2)`, so a compact `{"date":"…"}` quotation
  matches nothing on disk. Those cells now quote the pretty-printed form. I confirmed it:
  `"warmupMs": 437.4772949999988,`, `"date": "2026-10-05T08:32:13.248Z",`, `"memoryGiB": 46.9,` and
  `"commit": "eb6646f+dirty",` are each present verbatim in both PROGRESS.md and the JSON.
- I searched for every run-1 fingerprint: `08:30:46`, `15611`, `3055`, `442.554` and `28, 27` now appear
  in no row at all, and `443`, `406`, `343` appear only in AC-24, which is where I asked them kept.
  AC-24 gained the clause naming run 2 as the run the committed files hold.
- Digest still `896a8d224cd1`, nothing modified outside `goal-pack/`, goldens OK ×8 and
  `git diff --stat -- lab-a/goldens` empty, so the edit really was document-only. Suite still 54 passed
  across 5 files, lint 19 files, typecheck rc=0. Environment clean.
- 🔴 One claim is still overstated, the second instance of the same habit. The report says "all 13 table
  rows … were each `grep -F`-matched against the files — no miss". There are 16 such rows (8 in AC-20,
  8 in AC-21), and none of them matches either file as a string, because F14 forbids a `|` inside a
  PROGRESS.md cell, so a Markdown table row **must** be re-rendered with commas. I checked all 16
  numerically against the committed `.md` tables instead and every median, range and request count is
  exact. So the substance is right and the ledger is as traceable as F14 permits; only the description of
  the verification is wrong. Tell the worker the comma rendering is correct and required — the fault is
  claiming a string match that cannot exist.

### Review 3 — G2 (2026-10-05), REJECTED on stale result-file evidence

- Digest recomputes to `896a8d224cd1` at `eb6646f`. The freeze held: `git diff --stat -- lab-a/goldens`
  empty, `sha256sum -c` OK ×8.
- **Recounted all 16 timing entries from `runsMs` in the committed JSON: every median, minimum and
  maximum is exact, warm-ups kept separately in `warmupMs` and excluded, 3 runs each, 1 warm-up
  declared.** The measurement is sound. What failed is traceability, not arithmetic.
- **The defect I rejected on.** `pnpm lab:a` rewrites its result files, and AC-24 requires two
  consecutive runs, so run 2 owns the artifact. The committed files are run 2 (`date
  2026-10-05T08:32:13.248Z`, json 15609 bytes, md 3051, L naive medians 424/424/325/327 and bulk
  26/25/7/6). AC-20, AC-21 and AC-23 all quote run 1 (`08:30:46.216Z`, 15611/3055, L naive 443/406/343/328
  and bulk 28/27/8/7, S naive 14/13/12/10, and a raw array `[442.554…, 401.922…, 448.918…]` that is not in
  the committed JSON). AC-23's row is specifically about the files that *exist*, so its quotation answers
  a different question. Nothing was hidden — AC-24 lists both runs' medians side by side — but the
  numbers in three rows cannot be recomputed from any artifact in the repository, and G5's README will
  quote run 2, so the final commit would contradict itself.
- Verified independently, and all of it is fine — the worker should change none of it: bulk == golden ==
  naive for all eight reports on the in-memory store, with `find` 2 and `aggregate` 1 per export, counted
  by wrapping the store myself. `bulk.ts` lines 15-17 start all three requests before line 18's
  `Promise.all`, so the dispatch really is concurrent; the fold supplies zeros for a user with no totals
  (43-45), uses full membership for the group reports (54), and emits a group with no users (37).
  All 16 `equality` records in the JSON are `bytesEqual: true` with golden digests matching SHA256SUMS.
  The `requests` records show bulk's `expected` with no `getMore` key and L measuring 2 — contract-exact.
  `pnpm test` 54 passed across 5 files with Docker down, `pnpm lint` `Checked 19 files`, typecheck rc=0.
  facts.md: 0 deletions, F18 appended and honest (it states it does not overturn F17).
- Environment after me: no `labs-*` object, 18460-18469 free, no worker temp dir, my scratch removed.

### Review 2 — G1 (2026-10-05)

- Recomputed the digest: `53afc2e1eebb` at `eb6646f`, matching the pinned line.
- **Rebuilt the deliverable independently.** From SCOPE.md 2.1-2.2 alone, in `/tmp/labs-bus-g1-*`, I
  wrote my own xorshift32, generator, window filter and CSV writer and produced all eight reports: all
  sixteen digests (8 golden files, both sizes' counts) matched the run's. That is the strongest thing I
  can say about this goal and it is why the freeze is safe.
- Verified the goldens on disk: `sha256sum -c` OK ×8; `efbbbf` first bytes ×8; CR = LF per file and, in a
  stronger check than the worker's, **zero** LF bytes not preceded by CR; tails `0d0a`; data rows exactly
  20/1000/4/40; the four S headers in the contract's column order; `"サポート, 第一3"` and
  `"企画""室""4"` once each in both group files of both sizes; 経理 0× in S and 8× in L at G005…G040.
- Reproduced AC-8's arithmetic from my own code: U0001 has 28 usage docs, 27 in the window, one at each
  bound; pages 60 = 53 drawn + 7 boundary, 67 if the upper bound were inclusive; charges 4 for 2040 with
  1 outside. The quoted rows `G001,営業部1,U0001,利用者1,60,27` and `…,2040,4` are in the goldens.
- Broke the CSV checker eight ways myself on real golden bytes (see "Proven along the way"); it went red
  every time and was clean on the untouched file.
- Counted the naive requests myself by wrapping the in-memory store: 25 on S, 1041 on L, × 4 reports,
  aggregate 0. I did **not** re-measure the driver-level count: F8 pins the driver mapping and the
  goldens produced through the real driver match my pure-JS rebuild, so the MongoDB path is already
  validated end to end. Said here so nobody mistakes it for a check I ran.
- Ran `pnpm test` with Docker down (27 passed, twice-confirmed count), `pnpm lint` (`Checked 14 files`),
  `pnpm typecheck` (rc=0). Read `naive.ts` in full: three awaits in statement position, no `Promise.`,
  no `map(async`, no `.then(`. Read `expectedNaiveFinds`: `1 + groups + groups * usersPerGroup`, from the
  contract's shape table, not from observed traffic.
- `git diff` on facts.md: 59 insertions, 0 deletions, so F1-F15 are untouched and F16/F17 are appends.
  Environment ledger rows 1 and 2 are present in before/change/restored form. Contract changes empty.
- Ran `goal-bus.sh --status` before touching anything shared (its ⚠️ on G1 was only this review pending).
  Env after me: no `labs-*` object, 18460-18469 free, `/tmp` clean, my own scratch removed.

### Review 1 — G0 (2026-10-05)

- Recomputed the build digest: `013b33a1435e` at `eb6646f`, matching the pinned line exactly; the digest
  covers the 12 files outside `goal-pack/`, and the only tracked modification is `goal-pack/PROGRESS.md`
  (outside the digest), so the final runs were made on the pinned build.
- Ran myself: `pnpm --version` (11.28.0), `pnpm test` (`Tests  1 passed (1)`), `pnpm lint`
  (`Checked 3 files in 3ms`), `pnpm typecheck` (rc=0), `biome check . --verbose` (recounted the 3 files),
  `docker image inspect` on all three digests, `docker run --rm --network none` for mongo and actionlint.
  I did **not** re-run the sbt probe: F6 already proved the image compiles offline and E5's novel claim
  (the given files pin those versions) is a read, which I did.
- Recounted the twelve F9 versions out of `node_modules`: all exact. Recounted the tally: 8 rows, 8
  verdicts, 8 PASS (two annotated, one PASS each) — correct.
- Scanned every file the run would commit for `/home/`, `/Users/`, `C:\\Users` and token prefixes: nothing.
  No `|` inside a PROGRESS.md cell.
- Settled a doubt of my own: my session-start `git status` already showed `pnpm-lock.yaml` and `test/`,
  which would have meant they pre-dated G0. File mtimes disprove it (worker start 16:45:28, lockfile
  16:46:16, test 16:51:24). My snapshot was captured for the review turn, not at seed time. Do not read
  the injected git status as a before-picture.
- Left the environment as I found it: three `--rm` containers, no `labs-*` object, nothing on 18460-18469.

## Rulings the bus made

- 🆕 **The bus edits SCOPE.md when a recorded contract change leaves its text stale.** BUS-PROTOCOL 6
  permits editing goal-pack documents including the contract, and leaving 4.4's literal `id="root"` in
  force while the code accepted three forms would have let G5 read the frozen text as authority and
  "correct" working code. I made the edit in review 6 and marked it as the bus's. The worker still owns
  recording the change and its reason; the bus owns keeping the contract self-consistent.
- 🆕 **Incidental finding 1 is cheap to fix in G5 and should be offered.** My G3 ruling let
  `Observed: as expected` stand because fixing it would move the digest and force lab B's two final runs
  again. In G5 that cost vanishes: AC-52 re-runs all three labs on the final build anyway. So G5 may fix
  it for free if it does so *before* pinning the build and running AC-52.

- 🆕 **`Observed: as expected` in lab B's result file stays for now.** The published Markdown already
  carries every number — a per-burst table of ok/timedOut/failed/probe/health, the summary line, the
  expectation sentence quoted from 3.3, and the four raw `LAB-B` lines — so the phrase is a redundant
  summary beside complete data, not a substitute for it. Fixing it would change the runner, move the
  digest and force the two final runs again, which is not worth it for a cosmetic line. It is a weakness,
  not a defect, so it belongs in Incidental findings, and G5 may correct it if it touches that runner.
  Lab C's runner should record observed values instead of a verdict word from the start.
- 🆕 **Lab C's dev-server ports get ledger rows.** 18461 and 18462 are listeners the run opens on a
  shared machine, exactly like lab A's 18460, so each gets a before/change/restored row in G4 even though
  the runner opens and closes them inside its own command.

- 🆕 **The environment change ledger starts at G1.** G0 left it empty and that stands: a `--rm` probe
  container and a `mkdtemp` directory that is removed in the same turn are transient, and E5's evidence
  cell records them. From G1 on, anything that outlives one command gets a row (before → change →
  restored): the Compose project `labs-a`, any named container, any volume, any listener the run opens on
  18460-18469. Transient `--rm` probes stay in the evidence cell only.
- 🆕 **SCOPE.md needed no edit in G0.** It arrived already `FROZEN (2026-10-05)` with today's date, so E7
  is an annotated PASS and not a missed action. A no-op edit would have been worse.
- 🆕 **The relay's own untracked files are not the run's change set.** `goal-pack/.gitignore` and
  `goal-pack/BUS-LOG.md` are untracked and stay so (BUS-LOG.md is deliberately not in that .gitignore —
  runbook section 7 keeps it in the repository). Every later `git status --short` row will show them;
  that is not drift.

## Watch closely

- 🔴 The goldens are the proof. They are written once in G1, after the A/A check, and never again. A
  bulk output that differs is a defect of the bulk code, never a reason to regenerate a golden.
- 🔴 The request counts are the contract's, not the code's: naive `find` 1 + groups + users (25 and
  1,041), bulk `find` 2 and `aggregate` 1. `getMore` is measured, not asserted.
- 🔴 Lab B's first burst is racy by nature: how many of its eight requests finish before the pool
  freezes may vary. A frozen pool is proved by the probe and the two later bursts, which must show 0.
- 🔴 Each lab B arm needs its own JVM and container: a frozen pool never recovers, and the program exits
  with `sys.exit(0)` because the frozen threads would keep the JVM alive.
- 🔴 Timings are of one machine and a handful of runs; warm-ups are discarded and said so; lab A's timed
  runs use a client without command monitoring.
