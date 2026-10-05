# SCOPE — labs

Status: **FROZEN** (2026-10-05). Becomes AS-BUILT in G5. Changes during the run are recorded first under
"Contract changes" in PROGRESS.md, with the reason; this text is then updated and the change named.

Three small, reproducible experiments rebuilt from the author's practice (`materials/practice.md`):

- **Lab A — report N+1.** Four CSV reports read a MongoDB database one group and one user at a time.
  The same reports rebuilt to read in bulk produce byte-identical files, with the requests counted.
- **Lab B — blocking await.** A pool of three threads freezes when three callers block on work that
  needs the same pool. Four arms side by side: the frozen one, the global pool that compensates, the
  global pool that is not allowed to, and the fixed pool that composes instead of blocking.
- **Lab C — build migration.** The same synthetic React application of 1,000 modules built with
  webpack + Babel and with Rsbuild, measured the same way: cold production builds and dev-server start.

Every number this repository publishes comes from running these labs. No figure of the author's work
appears anywhere in it; the README points to case study 07 for those.

## 1. Rules for the whole repository

### Layout

| Path | Contents | Who writes it |
|---|---|---|
| `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `.gitignore`, `.gitattributes`, `LICENSE` | configuration | given — do not edit |
| `lab-b/build.sbt`, `lab-b/project/build.properties` | lab B's build, pinned to the image (facts F6) | given — do not edit |
| `goal-pack/` | the contract, the ledger, the facts, the protocol | given; the run writes PROGRESS.md, facts from F16, AS-BUILT |
| `lab-a/` | `src/`, `compose.yaml`, `goldens/`, `results/` | the run |
| `lab-b/src/main/scala/`, `lab-b/results/` | the Scala program and its results | the run |
| `lab-c/` | the generator, the two build setups, `results/` (the generated application goes to `lab-c/app/`, which is ignored) | the run |
| `tools/` | the three runners and their shared helpers | the run |
| `test/` | Vitest tests; no test needs Docker or the network | the run |
| `README.md`, `PUBLISHING.md`, `.github/workflows/ci.yml` | G5 | the run |

### Language and style

- TypeScript run by Node 24 directly: ES modules, **erasable syntax only** (no enums, namespaces or
  parameter properties), local imports carry `.ts`, types are imported with `import type`.
- No dependency beyond the given `package.json`. The Scala program uses the standard library and the
  JDK only.
- Paths are built with `node:path`; nothing assumes `/` or a POSIX shell, so the labs run on Windows as
  written (facts F11). A runner that starts Docker passes its arguments as an array, never through a
  shell string. Four rules that the previous run of this portfolio broke on Windows only, found after
  it:
  - a path written into a committed file is relative to the repository and written with `/` on every
    OS (`relative(…).split(sep).join('/')`);
  - a module imported by a path built at run time goes through `pathToFileURL(path).href`: on Windows
    `import('C:\\…')` reads `c:` as a URL scheme and fails;
  - a temporary directory is removed with `rmSync(dir, { recursive: true, force: true, maxRetries: 10 })`
    after the results are written, and a failed removal is printed and never costs a result (on
    Windows a process that has just exited can hold its directory for a moment);
  - a test does not assume where the checkout lives (not under the home directory, not a short path)
    nor a fast process start: a test that starts a process gives it at least 3 s before a timeout, and
    `vitest.config.ts` keeps its `testTimeout` of 30 s.

### Commands

| Command | What it does | Exit codes |
|---|---|---|
| `pnpm lab:a [--size S\|L\|both] [--runs N] [--keep]` | lab A end to end (section 2) | 0 every check holds · 1 a check failed · 2 usage · 3 the environment is missing (Docker, a port) |
| `pnpm lab:a:golden [--size S\|L\|both]` | capture the goldens (section 2.6); refuses when they exist | 0 written · 1 the A/A check failed (nothing written) · 2 usage or goldens exist · 3 environment |
| `pnpm lab:b [--arm <name>]…` | lab B, all four arms unless named (section 3) | 0 every arm as expected · 1 an arm differs · 2 usage · 3 environment |
| `pnpm lab:c [--modules N] [--runs N]` | lab C end to end (section 4) | 0 every build ran and the equivalence holds · 1 otherwise · 2 usage |
| `pnpm test` / `pnpm lint` / `pnpm typecheck` | Vitest / Biome / `tsc --noEmit` | 0 clean |

`--size` defaults to `both`, `--runs` to 3 for lab A and 5 for lab C, `--modules` to 1000. A runner
prints its result table (the Markdown of section 1.4) to stdout and its progress to stderr.

### Result files

Each lab run writes two files into its lab's `results/` directory and replaces files of the same name:
`<UTC date>-<platform>-<arch>.json` and the same name with `.md`, for example
`2026-10-05-linux-x64.json` (`process.platform`, `process.arch`). The JSON holds the machine block and
every raw value; the Markdown holds the machine block and the tables. Result files of the run are
committed; a CI run does not commit its results.

**Machine block**, the same fields in every result, JSON and Markdown alike: `date` (UTC, ISO 8601),
`os` (`os.type()`, `os.release()`), `arch`, `cpu` (the model of `os.cpus()[0]` and the count),
`memoryGiB` (`os.totalmem()`, one decimal), `node`, `docker` (the client version when the lab uses
Docker, else omitted), `commit` (`git rev-parse --short HEAD`, plus `+dirty` when `git status
--porcelain` is not empty).

**Timings.** Every timed lab starts with warm-up runs that are discarded and says how many; then N
measured runs. A table shows the median and the range (minimum–maximum) of the measured runs in
milliseconds, rounded to whole milliseconds; the JSON keeps every run. A median of an even count is the
mean of the middle two. No timing is claimed beyond the machine it was measured on.

### Ports, images, names

| Port (127.0.0.1) | Use |
|---|---|
| 18460 | lab A's MongoDB |
| 18461 | lab C's webpack dev server |
| 18462 | lab C's Rsbuild dev server |
| 18463–18469 | free for the run's own probes |

| Image (always by digest) | Use |
|---|---|
| `mongo@sha256:9854f7139445d766a9523571d6f047530c45547460ffcf8259eb2bf4264632ca` (7.0.43) | lab A |
| `sbtscala/scala-sbt@sha256:eafe9c4c5934377cdf98e4ac6fe4f4b5d7e7dea6377fc9bc423a66c20adbdca0` (sbt 1.13.0, Scala 3.8.4, JDK 21.0.12) | lab B |
| `rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667` | the workflow check of G5 |

Docker objects carry the prefix `labs-` (Compose project `labs-a`); a runner removes what it created
when it ends, also when it fails, except under `--keep`. No image is pulled, tagged or removed by the
run.

## 2. Lab A — report N+1

### 2.1 Data

A deterministic generator, `lab-a/src/data.ts`, writes four collections into a database named
`labs_a_<size>`. Randomness comes from xorshift32 (`x ^= x << 13; x ^= x >>> 17; x ^= x << 5`, unsigned
32-bit) seeded with `20261005`; its first five values are `549423487, 3817879383, 1244534954,
2925042391, 491171478` (computed by the author before the run). The generator draws in the order this
section describes, so the data are the same on every machine.

| Size | Groups | Users per group | Users |
|---|---|---|---|
| S | 4 | 5 | 20 |
| L | 40 | 25 | 1,000 |

- `groups`: `{ _id, code, name }` — `code` is `G001`, `G002`, …; `name` cycles through
  `営業部`, `開発部`, `サポート, 第一`, `企画"室"`, `経理` and appends the group's number, so the names
  exercise both the comma and the quote of the CSV rules (`サポート, 第一3`, `企画"室"4`).
- `users`: `{ _id, code, name, groupId }` — `code` is `U0001`, `U0002`, … in group order, then user
  order; `name` is `利用者` + the user's number.
- `usage_events`: for each user and each day of September 2026, `n = next() % 4`; when `n > 0`, one
  event `{ userId, at, pages: n }` at 09:00 UTC that day plus `next() % 480` minutes.
- `charge_events`: for each user, `k = next() % 4` events, each `{ userId, at, amount }` with
  `amount = (next() % 50 + 1) * 10` (yen) on day `next() % 30 + 1` of September 2026 at 12:00 UTC.
- **Boundary events**, for every user: one usage event with `pages: 7` at exactly
  `2026-09-01T00:00:00.000Z` (inside the window) and one at exactly `2026-10-01T00:00:00.000Z`
  (outside); the same two for charges with `amount: 990`.
- Indexes: `users { groupId: 1, code: 1 }`, `usage_events { userId: 1, at: 1 }`,
  `charge_events { userId: 1, at: 1 }`.

Seeding drops the database first. The generator reports what it wrote (documents per collection).

### 2.2 The reports

The window is `2026-09-01T00:00:00.000Z` ≤ `at` < `2026-10-01T00:00:00.000Z`.

| File | Columns, in order | One row per |
|---|---|---|
| `users-usage.csv` | `group_code,group_name,user_code,user_name,pages,events` | user |
| `groups-usage.csv` | `group_code,group_name,users,pages,events` | group |
| `users-charge.csv` | `group_code,group_name,user_code,user_name,amount,charges` | user |
| `groups-charge.csv` | `group_code,group_name,users,amount,charges` | group |

Rows are ordered by `group_code`, then `user_code`. Every user and every group appears, with `0` when
nothing falls in the window. `events` and `charges` count the documents in the window; `pages` and
`amount` sum them; `users` is the group's number of users.

**CSV bytes.** UTF-8 with a byte-order mark (`EF BB BF`); a header row; `CRLF` after every row
including the last; fields separated by `,`; a field is enclosed in `"` exactly when it contains `,`,
`"`, CR or LF, and a `"` inside it is doubled; integers in plain decimal. Nothing else varies.

### 2.3 Two implementations behind one store

Both implementations talk to a small store interface, `lab-a/src/store.ts`, with a MongoDB
implementation and an in-memory one; the tests use the in-memory one, the lab the MongoDB one. The
store exposes only what the two implementations need: find with an equality filter, an optional `at`
window and a sort; and an aggregation that groups a window's events by `userId`.

**The naive implementation** (`lab-a/src/naive.ts`) does exactly this, for each report:

```
groups = find groups, sorted by code                                  (1 request)
for each group:
  users = find users of the group, sorted by code                     (1 request per group)
  for each user:
    events = find the user's events in the window                     (1 request per user)
    add them up in TypeScript
```

Every request is awaited before the next one is sent.

**The bulk implementation** (`lab-a/src/bulk.ts`) sends three requests at once and folds in memory:

```
in parallel:
  groups = find groups, sorted by code
  users  = find all users, sorted by groupId, code
  totals = aggregate the window's events: $match on at, $group by userId with the sum and the count
fold: for each group by code, its users by code; a user without totals has 0 and 0
```

### 2.4 Counting the requests

A fresh `MongoClient` with `monitorCommands: true` serves exactly one export of one report, and a
listener on `commandStarted` counts by `commandName` (facts F8). The count must be zero when the
export starts, and the lab says so. The expected counts per export:

| Implementation | `find` | `aggregate` | `getMore` |
|---|---|---|---|
| naive | 1 + groups + users (S: 25, L: 1,041) | 0 | 0 |
| bulk | 2 | 1 | measured and reported, not asserted |

Any other command name (other than the driver's handshake and `endSessions`, which are listed but not
counted as requests) fails the check. Timed runs use a client without monitoring.

### 2.5 Timing

For each size, report and implementation: 1 warm-up export, discarded, then `--runs` exports. An
export's time is the wall time from the first request to the CSV bytes being complete in memory;
connecting and writing the file are outside it. The table has one row per report and implementation:
median, range and the request counts of 2.4.

### 2.6 Goldens: captured once, then frozen

`pnpm lab:a:golden` seeds each size, runs the naive implementation twice, and compares the two outputs
of each report byte for byte (the A/A check). Only when all of them are identical does it write
`lab-a/goldens/<size>/<report>.csv` and `lab-a/goldens/SHA256SUMS` (sha256 and path, one line per file,
sorted by path). It refuses when `goldens/` already holds a file. **After G1 the goldens are never
written again**; nothing of the run edits, regenerates or deletes them.

### 2.7 What `pnpm lab:a` checks

For each size: seed; the naive implementation still matches the goldens; the bulk implementation
matches the goldens byte for byte (sha256 and a byte comparison); the request counts of 2.4; then the
timings. It starts the database with Compose and removes it at the end.

### 2.8 The database

`lab-a/compose.yaml`, project `labs-a`, one service `mongo`: the image of section 1 by digest, published
on `127.0.0.1:18460`, data on `tmpfs` (`/data/db`), a healthcheck with `mongosh --quiet --eval
"db.runCommand({ ping: 1 }).ok"`, and the six proxy variables (`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`
and their lower-case forms) set to empty strings, because Docker Desktop passes the PC's proxy settings
into every container. The runner uses `docker compose -p labs-a -f lab-a/compose.yaml up -d --wait`
and, at the end, `down -v`.

## 3. Lab B — blocking await

### 3.1 The program

`lab-b/src/main/scala/Lab.scala`, entry `@main def lab(arm: String)`, standard library and JDK only.

- **A server**: `com.sun.net.httpserver.HttpServer` on `127.0.0.1`, port 0, with its own executor (a
  cached thread pool: the server's threads, never the arm's pool). Two paths:
  - `/work?n=<int>` asks the arm's service for `n * 2` and waits for it on the server thread for at
    most 30 s; 200 with the number, or 503 when it did not come.
  - `/health` answers 200 `ok` on the server thread, touching no pool.
- **The service**, per arm:

| Arm | Pool | `work(n)` |
|---|---|---|
| `fixed-await` | a fixed pool of 3 threads | `Future { Await.result(Future(n * 2)(pool), Duration.Inf) }(pool)` |
| `global-await` | the global pool, defaults | the same code on the global pool |
| `global-noextra` | the global pool, started with `-Dscala.concurrent.context.numThreads=3 -Dscala.concurrent.context.maxThreads=3 -Dscala.concurrent.context.maxExtraThreads=0` | the same code on the global pool |
| `fixed-compose` | a fixed pool of 3 threads | `Future(n)(pool).flatMap(x => Future(x * 2)(pool))(pool)` |

- **A client** in the same JVM with its own executor (`java.net.http.HttpClient`): three bursts of 8,
  20 and 20 concurrent `GET /work`, each request with a 5 s timeout, all requests of a burst released at
  once by a latch; one second's pause between bursts; after each burst one probe `GET /work` (5 s
  timeout) and one `GET /health` (2 s timeout).
- **Output**: one line per burst and one summary line, each `LAB-B ` followed by a JSON object:
  `{"arm":"fixed-await","burst":1,"size":8,"ok":0,"timedOut":8,"failed":0,"probe":"timeout","health":200}`
  and `{"arm":"fixed-await","total":48,"ok":0,"timedOut":48,"failed":0}`. `ok` counts 200 answers,
  `timedOut` requests that hit the 5 s timeout, `failed` anything else; the three add up to the size.
  `probe` is `"ok"` or `"timeout"`; `health` is the status code, or 0 when it did not answer. Then `sys.exit(0)`: the frozen threads would keep the
  JVM alive.

### 3.2 Running it

`pnpm lab:b` runs each arm in its own container and JVM — a frozen pool never recovers (facts F7):

```
docker run --rm --name labs-b-<arm> --network none -v <absolute lab-b>:/src:ro <sbt image by digest> \
  bash -c 'cp -r /src /w && cd /w && sbt -Dsbt.offline=true <arm settings> "run <arm>"'
```

The sources are copied inside the container, so nothing is written to the repository (the image runs
as root; facts F3). `global-noextra` passes its three options through
`"set javaOptions ++= Seq(…)"` before `run` (`fork := true` is in the given `build.sbt`). Each
container gets 300 s; the runner reads the `LAB-B` lines from stdout.

### 3.3 Expected outcomes

From facts F7 and the program above. The runner compares every arm with this table and exits 1 on any
difference, naming it.

| Arm | Burst 1 (8) | Probe after burst 1 | Bursts 2 and 3 (20 + 20) | Probes after them | `/health` |
|---|---|---|---|---|---|
| `fixed-await` | fewer than 8 ok | timeout | 0 ok | timeout | 200 after every burst |
| `global-await` | 8 ok | ok | 40 ok | ok | 200 after every burst |
| `global-noextra` | fewer than 8 ok | timeout | 0 ok | timeout | 200 after every burst |
| `fixed-compose` | 8 ok | ok | 40 ok | ok | 200 after every burst |

The number of the first burst's requests that finished before the pool froze is reported as measured
(it is 0 when the eight start together); a frozen pool is proved by the probe and the two later bursts.

## 4. Lab C — build migration

### 4.1 The application

`lab-c/generate.ts` writes `lab-c/app/` from scratch: `src/components/C0000.tsx` … one file per module,
each a React component for the classic JSX runtime (`import React from 'react'`) that renders a heading
with its own label `m<i>` and a short list, and `src/index.tsx`, which imports every component and
renders them in order with `react-dom/client`. The output depends only on the module count; two
generations of the same count are byte-identical.

### 4.2 The two setups

| | webpack + Babel | Rsbuild |
|---|---|---|
| Config | `lab-c/webpack.ts`, used through webpack's Node API by a build script and a dev script (no CLI) | `lab-c/rsbuild.config.ts`, used through `node node_modules/@rsbuild/core/bin/rsbuild.js` |
| JSX | `babel-loader` with `@babel/preset-react` (`runtime: 'classic'`) and `@babel/preset-typescript` | `pluginReact({ swcReactOptions: { runtime: 'classic' } })` |
| HTML | `html-webpack-plugin`, a page with `<div id="root"></div>` | Rsbuild's page, `html.mountId: 'root'` |
| Production | `mode: 'production'`, output `lab-c/app/dist-webpack` | `rsbuild build`, output `lab-c/app/dist-rsbuild` |
| Dev server | `webpack-dev-server` on 127.0.0.1:18461 | `rsbuild dev` on 127.0.0.1:18462 |

Neither setup enables a persistent cache.

### 4.3 Measurements

- **Cold production build**: for each tool, 1 warm-up then `--runs` builds. Before every build the
  runner removes the tool's output directory and `lab-c/app/node_modules/.cache` if it exists. A
  build's time is the wall time of a child process started as `process.execPath <script or CLI>`, from
  spawn to exit; a non-zero exit fails the lab.
- **Dev-server start**: for each tool, 1 warm-up then `--runs` starts. The time runs from spawn until
  `GET /` answers 200 with `id="root"` in the body **and** the first `<script src>` of that page answers
  200. Requests are tried every 50 ms; 120 s is the limit. The runner then stops the process and waits
  until its port is free again before the next start.

### 4.4 The equivalence check

After the last production build of each tool: every label `m0` … `m<N-1>` occurs in the emitted
JavaScript, and the emitted HTML contains `id="root"` and references an emitted script. The lab fails
when either tool misses one.

## 5. Tests

`pnpm test` needs neither Docker nor the network. At least:

- xorshift32's first values for the seed, and the generator's document counts per size;
- the CSV rules, one case per rule, including the BOM and the final `CRLF`;
- naive and bulk produce identical bytes for every report on the in-memory store, size S;
- the request counting (on a fake client) and its zero-at-start check;
- the median and range rules; the result-file names; the machine block's fields;
- lab B's `LAB-B` line parser and the comparison with the expected-outcome table, including a
  mismatch;
- lab C's generator (determinism, the labels) and the equivalence check, including a missing label.

Every check that can fail is seen failing once, on a planted case, in a test that says it is a control.

## 6. README and the other documents of G5

- `README.md` in Japanese, starting with an English summary of three to five lines, then exactly these
  sections in this order: `## 何を示すか`, `## 背景`, `## 設計`, `## 動かし方`, `## 結果`,
  `## 制約・既知の限界`, `## 作り方`. The last line is exactly:
  `設計・レビュー・検証：So Ryo ／ 実装：AI エージェント（Claude Code）との協働`
  (the signature is the author's, required, and not a person name in the sense of the red lines).
- 背景 links case study 07
  (`https://github.com/MuneAkira6/engineering-case-studies/blob/main/07-other-work.md`) and keeps the two
  lists of `materials/practice.md` section 4: what the practice did, what this repository adds.
- 結果 shows only numbers from the result files the run committed, each table with its machine block.
- `PUBLISHING.md`: a description (English, at most 350 characters, and a Japanese one), topics, and a
  checklist before publishing.
- `.github/workflows/ci.yml` on `ubuntu-24.04`, every `uses:` pinned to a SHA of facts F12 with its
  version as a comment, `permissions: contents: read`: a job for `pnpm install --frozen-lockfile`,
  `pnpm lint`, `pnpm typecheck`, `pnpm test`; and one job per lab at small scale —
  `pnpm lab:a --size S --runs 1`, `pnpm lab:b`, `pnpm lab:c --modules 200 --runs 1`. CI pulls the images
  it needs; that is the only difference from this machine.

## 7. Content rules

- No employer, product, customer, team or person names; no ticket numbers; no figure of the author's
  work — the README points to case study 07.
- No secret anywhere; no absolute path under a home directory in a committed file.
- Never write a token prefix as a literal in code, tests or documents.

## 8. Out of scope

- Optimising beyond the bulk rewrite of 2.3, or tuning either build tool beyond 4.2.
- Any lab on another machine during the run (the author runs them on Windows afterwards).
- Pulling, building or tagging images; any network access other than `pnpm install`.
