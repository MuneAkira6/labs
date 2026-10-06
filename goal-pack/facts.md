# Facts — labs

Everything below was measured before the run, on the machine the run uses unless an entry says
otherwise. Each entry gives the date, the exact command, the output as printed (cuts are marked), what
follows from it and the decisions that depend on it. The run appends its own entries from F16 on, in
the same form; a measurement that overturns an entry gets a "Superseded" box under it, and the entry's
text is never edited. Absolute paths under the home directory are written as `~`.

### F1: The machine

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Command: `echo "$(lsb_release -ds) / $(uname -r) / $(nproc) x $(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | sed 's/^ //') / $(free -g | awk '/Mem:/{print $2}') GiB"`
- Output:

```
Ubuntu 20.04.6 LTS / 5.4.0-216-generic / 12 x Intel(R) Xeon(R) E-2146G CPU @ 3.50GHz / 46 GiB
```

- What follows: every result file names this machine in the same terms (SCOPE.md, "Machine block").
- Decisions that depend on it: the machine block; nothing is tuned to it.

### F2: Node, pnpm, Docker and Compose

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Command: `echo "node $(node --version) / pnpm $(pnpm --version) / docker $(docker --version | cut -d' ' -f3 | tr -d ,) / compose $(docker compose version --short)"`, run in the home directory (no `package.json` there)
- Output:

```
node v24.19.0 / pnpm 11.22.0 / docker 28.1.1 / compose 2.35.1
```

- What follows: the global pnpm is 11.22.0. Inside a directory whose `package.json` says
  `"packageManager": "pnpm@11.28.0"`, pnpm switches to 11.28.0 by itself (the earlier runs on this
  machine recorded it); corepack is not enabled and stays so. Node runs `.ts` files directly
  (erasable syntax only).
- Decisions that depend on it: `packageManager` in the given `package.json`; the red line on tool
  setup.

### F3: The two images already on the machine, by digest

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Commands:
  - `docker image inspect mongo:7 --format 'mongo:7 {{index .RepoDigests 0}}'`
  - `docker run --rm --network none mongo:7 mongod --version | head -1`
  - `docker image inspect sbtscala/scala-sbt:eclipse-temurin-21.0.12_8_1.13.0_3.8.4 --format '{{.Id}} {{index .RepoDigests 0}} {{.Size}}'`
  - `docker run --rm --network none sbtscala/scala-sbt:eclipse-temurin-21.0.12_8_1.13.0_3.8.4 bash -c 'id -un; java -version 2>&1 | head -1; nproc'`
- Output:

```
mongo:7 mongo@sha256:9854f7139445d766a9523571d6f047530c45547460ffcf8259eb2bf4264632ca
db version v7.0.43
sha256:82a8897dcd9209333bff86e7aa4e57317260cd024a348ba52d0a109bcd12a6fa sbtscala/scala-sbt@sha256:eafe9c4c5934377cdf98e4ac6fe4f4b5d7e7dea6377fc9bc423a66c20adbdca0 1007582915
root
openjdk version "21.0.12" 2026-07-21 LTS
12
```

- What follows: both images are used by digest only. The sbt image runs as root with JDK 21.0.12 and
  sees all 12 CPUs.
- Decisions that depend on it: the image references in SCOPE.md and in every compose file and runner;
  lab B copies its sources inside the container instead of writing to a bind mount (files root creates
  there could not be removed by the run).

### F4: The ports of the labs are free

- Measured on: 2026-10-05 10:58 / last re-measured: 2026-10-05
- Command: `ss -ltnH | awk '{print $4}' | sed 's/.*://' | awk '$1>=18460 && $1<=18469'`
- Output: nothing (no listener in 18460–18469).
- What follows: the labs may use 18460–18469 on 127.0.0.1. Other runs on this machine used other
  ranges; nothing of theirs is touched.
- Decisions that depend on it: the port table of SCOPE.md.

### F5: The proxy is set and bypasses the loopback

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Commands (the proxy values themselves are never printed):
  - `echo "HTTP_PROXY set: $([ -n "${HTTP_PROXY:-}" ] && echo yes || echo no); HTTPS_PROXY set: $([ -n "${HTTPS_PROXY:-}" ] && echo yes || echo no)"`
  - `echo "NO_PROXY=${NO_PROXY:-<unset>}"`
  - `echo "NODE_USE_ENV_PROXY=${NODE_USE_ENV_PROXY:-<unset>}"`
  - a Node one-liner that serves `ok` on 127.0.0.1:18468 and reads it back with `fetch`
- Output (the `NO_PROXY` line is cut after its loopback entries; the rest of it is not quoted here):

```
HTTP_PROXY set: yes; HTTPS_PROXY set: yes
NO_PROXY=localhost,127.0.0.1,::1,…
NODE_USE_ENV_PROXY=<unset>
node fetch to 127.0.0.1:18468 -> ok
```

- What follows: `pnpm install` goes through the proxy; Node's `fetch` to 127.0.0.1 goes direct. The
  proxy variables are never unset, printed or written into a file.
- Decisions that depend on it: the runners talk to 127.0.0.1 only; nothing of the labs needs the
  network once installed.

### F6: The sbt image compiles and runs Scala 3 offline

- Measured on: 2026-10-05 10:58 / last re-measured: 2026-10-05
- Setup: a scratch directory with `project/build.properties` = `sbt.version=1.13.0`, `build.sbt` =
  `scalaVersion := "3.8.4"` and `fork := true`, and one source file that uses the standard library only.
- Command, once per argument: `docker run --rm --network none -v "$T:/w" -w /w <image by digest> sbt -Dsbt.offline=true "run <arg>"`
- Output (the program's own lines and the elapsed time of each `docker run`):

```
== arm global: rc=0 in 8s
[info] global: completed 2,4,6
== arm fixed: rc=0 in 8s
[info] fixed: no answer within 5 s (pool exhausted)
```

- What follows: with no network at all, the image already holds sbt 1.13.0 and everything Scala 3.8.4
  needs to compile and run a standard-library program. A first run costs about 8 s.
- Decisions that depend on it: lab B uses the standard library only, `--network none` and
  `-Dsbt.offline=true`; its `build.sbt` and `build.properties` are given and pin these versions.

### F7: The four arms of lab B behave as the practice describes

- Measured on: 2026-10-05 11:00 / last re-measured: 2026-10-05
- Program: three callers at once on a pool of three threads. A blocking arm runs
  `Future { Await.result(Future(i * 2), Duration.Inf) }` for i = 1..3; the composing arm runs
  `Future(i).flatMap(x => Future(x * 2))`. The caller waits 5 s for all three, on the global pool.
- Command, once per arm: as F6, with `sbt -Dsbt.offline=true ["set javaOptions ++= Seq(…)"] "run <arm>"`
- Output:

```
== fixed-await : rc=0 in 14s — fixed-await: no answer within 5 s (pool exhausted)
== global-await : rc=0 in 4s — global-await: completed 2,4,6
== global-noextra (-Dscala.concurrent.context.numThreads=3 -Dscala.concurrent.context.maxThreads=3 -Dscala.concurrent.context.maxExtraThreads=0): rc=0 in 10s — global-noextra: no answer within 5 s (pool exhausted)
== fixed-compose : rc=0 in 4s — fixed-compose: completed 2,4,6
```

- What follows: a fixed pool of three freezes as soon as three callers block on it; the global pool
  does not, because it adds threads for blocking code; the same global pool freezes when it is limited
  to three threads and may add none; composing instead of blocking does not freeze. Each arm needs its
  own JVM: a frozen pool never recovers.
- Decisions that depend on it: the arms, the JVM options and the expected outcomes of lab B
  (SCOPE.md).

### F8: The MongoDB driver reports every command it sends

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Setup: `mongo:7` (F3) on 127.0.0.1:18469; `mongodb` 7.7.0 (F9); a client created with
  `{ monitorCommands: true }` and a listener on `commandStarted` that counts by `commandName`.
- Commands: insert 100 documents with one `insertMany`, then 10 × `find({ user }).toArray()`, then one
  `aggregate([{ $group: … }]).toArray()`.
- Output:

```
commandStarted by name: {"insert":1,"find":10,"aggregate":1}
```

- What follows: the driver's own events count the requests exactly; no server profiler is needed.
  A result that does not fit the first batch adds `getMore` commands, which these sizes did not need.
- Decisions that depend on it: lab A's request counting (SCOPE.md, "Counting the requests").

### F9: Both build toolchains install under the supply-chain rules

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Setup: a scratch directory with `"packageManager": "pnpm@11.28.0"` and a `pnpm-workspace.yaml` of
  `minimumReleaseAge: 4320`, `strictDepBuilds: true`, `allowBuilds: {}`.
- Command: `pnpm add -D mongodb webpack webpack-dev-server html-webpack-plugin babel-loader @babel/core @babel/preset-react @babel/preset-typescript @rsbuild/core @rsbuild/plugin-react react@18 react-dom@18`
- Output (the summary lines):

```
== pnpm add: rc=0 in 10s
+ @babel/core 8.0.6 + @babel/preset-react 8.0.1 + @babel/preset-typescript 8.0.1 + @rsbuild/core 2.2.11 + @rsbuild/plugin-react 2.1.1 + babel-loader 10.1.1 + html-webpack-plugin 5.6.8 + mongodb 7.7.0 + react 18.3.1 (19.3.0 is available) + react-dom 18.3.1 (19.3.0 is available) + webpack 5.111.1 + webpack-dev-server 6.0.0
```

- What follows: no package of either toolchain needs a build script, so `allowBuilds` stays empty. The
  same set installed on the Windows PC in 11.5 s with the same versions (F11).
- Decisions that depend on it: the given `package.json` and `pnpm-workspace.yaml`.

### F10: One cold build of 1,000 synthetic modules, on this machine

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Setup: 1,000 generated `.tsx` modules, each a small React component written for the classic JSX
  runtime (`import React from 'react'`), and an entry that imports and renders all of them. webpack:
  `mode: 'production'`, `babel-loader` with `@babel/preset-react` (`runtime: 'classic'`) and
  `@babel/preset-typescript`, `html-webpack-plugin`, driven from a Node script through webpack's API.
  Rsbuild: `pluginReact({ swcReactOptions: { runtime: 'classic' } })`, through
  `node node_modules/@rsbuild/core/bin/rsbuild.js build`.
- Output, one build each:

```
webpack: 5030 ms
rsbuild: rc=0 410 ms wall; built in 0.19s
```

- What follows: both toolchains build the same synthetic app here. The webpack figure is the time
  inside the Node process; the Rsbuild figure is the wall time of the whole process and its own report.
  One build each is not a measurement; it only sizes the lab (SCOPE.md fixes how lab C measures).
- Decisions that depend on it: lab C's default module count and number of runs.

### F11: The same probe of lab C on the Windows PC

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Measured by: the author, on Windows 11 (Git Bash, Node v24.15.0, pnpm 11.28.0 through
  `packageManager`), with the same setup as F9 and F10
- Output, two builds each:

```
webpack 6668 ms, 2 assets
rsbuild rc=0 689 ms
webpack 6820 ms, 2 assets
rsbuild rc=0 640 ms
ready   built in 0.23s
```

- What follows: the lab is portable as written; the author re-runs it on Windows after the run.
- Decisions that depend on it: no platform-specific code in lab C; paths built with `node:path`.

### F12: The GitHub Actions the workflow may use, resolved to commits

- Measured on: 2026-10-01 / last re-measured: 2026-10-01
- Measured by: the author, from the Windows PC, with GitHub's REST API (`/releases/latest`, then
  `/git/ref/tags/<tag>`, dereferencing annotated tags) — for another repository of this portfolio
- Output:

```
actions/checkout           v7.0.1   3d3c42e5aac5ba805825da76410c181273ba90b1 (commit)
actions/setup-node         v7.0.0   820762786026740c76f36085b0efc47a31fe5020 (commit)
pnpm/action-setup          v6.1.0   ea17c68df8912ef543352723c149a84f56e3d413 (tag)
actions/upload-artifact    v7.0.1   043fb46d1a93c77aae656e7c1c64a875d1fc6a0a (commit)
```

- What follows: every `uses:` of this repository's workflow is one of these SHAs with the version as a
  comment. The run cannot reach GitHub and does not look them up.
- Decisions that depend on it: `.github/workflows/ci.yml`.

### F13: The relay installed for this run

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Command: `bash tests/run-all.sh` in a fresh `git archive` of goal-bus-kit at `bce56e8` (the clone at
  `~/portfolio-runs/goal-bus-kit` that the run installs from), on this machine, with `GOALBUS_AWK=gawk`
  (27 s) and then `GOALBUS_AWK=mawk` (26 s)
- Output (the summary lines of each):

```
selftest: 171 passed, 0 failed, 0 skipped
selftest: 35 passed, 0 failed, 0 skipped
templates: 28 passed, 0 failed
quickstart: 14 passed, 0 failed
launch: 9 passed, 0 failed
lesson coverage: all 30 lessons are guarded (160 labelled cases)
run-all: every suite passed (awk: gawk)
```

  (the same lines with `awk: mawk`)
- What follows: the hooks of this run are the kit at `bce56e8`. Its state files are `.relay-on`,
  `.gate-on`, `.bus-sid`, `.relay-state`; its per-goal status lines read `G1 rows without a verdict: N`.
- Decisions that depend on it: the runtime facts of BUS-PROTOCOL.md; the review time limit of this
  run (runbook.md).

### F14: The ledger cannot carry a pipe

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Measured by: reading the kit's table parser (`hooks/lib/tables.awk`): an unescaped `|` splits a cell.
- What follows: never write `|` inside a cell of PROGRESS.md; write "or", or escape it as `\|`.
- Decisions that depend on it: the brief's rule on PROGRESS.md.

### F15: A pinned actionlint is on the machine

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Command: `docker image inspect rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667 --format '{{index .RepoDigests 0}}'`
- Output:

```
rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667
```

- What follows: the workflow can be checked here without the network:
  `docker run --rm --network none -v "$PWD:/repo" -w /repo <that image> -no-color .github/workflows/ci.yml`.
  The image is shared and is only run, never pulled or removed.
- Decisions that depend on it: G5's workflow row.

### F16: What the generator of SCOPE.md 2.1 writes, per collection and size

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Measured by: the run (G1), on this machine
- Command: `node -e '…import("./lab-a/src/data.ts")…'` printing `countsOf(generate(size))` and the
  sha256 of `canonicalDump(generate(size))` twice for each size
- Output:

```
S counts: {"groups":4,"users":20,"usage_events":487,"charge_events":78}
S canonical dump sha256 run 1: 1e7821bd311a6fac3af5db3e67388ce605c97dcf4b400632bdb010a5dd7e4cfd
S canonical dump sha256 run 2: 1e7821bd311a6fac3af5db3e67388ce605c97dcf4b400632bdb010a5dd7e4cfd
L counts: {"groups":40,"users":1000,"usage_events":24546,"charge_events":3460}
L canonical dump sha256 run 1: f24280cf9c5e3eb9a2c93f35dcd474f700e8c2afb3f09c5a14bdbdaca85130f7
L canonical dump sha256 run 2: f24280cf9c5e3eb9a2c93f35dcd474f700e8c2afb3f09c5a14bdbdaca85130f7
```

- What follows: `groups` and `users` are the contract's own shape table (4 and 20, 40 and 1,000). The
  two event counts are drawn, so they are a measurement, not a contract value. They decompose: of the
  487 usage events of S, 40 are the boundary events (2 per user × 20 users) and 447 are drawn over
  20 users × 30 days = 600 day slots, which is the ~3/4 of slots with `next() % 4 > 0`; of the 78
  charge events, 40 are boundary events and 38 are drawn over 20 users with `k = next() % 4` (mean 1.5,
  so about 30 expected). On L: 24,546 = 2,000 boundary + 22,546 of 30,000 slots, and 3,460 = 2,000
  boundary + 1,460 drawn over 1,000 users. One reading of 2.1 is fixed here and shows in these numbers:
  `next() % 480` is drawn **inside** the `when n > 0` clause, so a day with no event consumes one draw,
  not two. Both sizes reproduce bit for bit across two generations.
- Decisions that depend on it: the pinned counts of `test/data.test.ts` (AC-2); the goldens of AC-10,
  which are built from exactly this data.

### F17: What a monitored client lists during one naive export, and why `getMore` is 0

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Measured by: the run (G1), on this machine, against `labs-a` (SCOPE.md 2.8) with `mongodb` 7.7.0
- Commands: one `MongoClient(uri, { monitorCommands: true })` with the counter of
  `lab-a/src/counting.ts` attached, printing its tallies after `connect()`, after one naive export of
  `users-usage` on size S, and after `close()`; and, separately, the largest result set the naive shape
  asks for on size L, computed from the generator
- Output:

```
after connect, listed: {} requests: {} total: 0
after one export, listed: {"find":25} requests: {"find":25}
after close, listed: {"find":25,"endSessions":1} requests: {"find":25}
L: largest naive result set — groups 40 users per group 25, max usage events per user in window 30 max charge events per user in window 4
```

- What follows: with this driver the handshake emits no `commandStarted` event at all, so "zero at the
  start of the export" is literally zero, not "zero requests among a handful of listed names".
  `endSessions` arrives only when the client closes, after the export is complete; it is listed and not
  counted, exactly as 2.4 says. The allow-list `NON_REQUEST_COMMANDS` in `lab-a/src/counting.ts` is
  therefore wider than what this machine emits: only `endSessions` of it was ever seen.
  `getMore` is 0 for the naive shape because every result set it asks for fits inside the driver's
  101-document first batch: at most 40 groups, 25 users per group, 30 usage events and 4 charge events
  per user in the window. This reasoning does not carry to the bulk shape of G2: its `find` of all
  1,000 users on size L cannot fit one batch, which is why 2.4 measures bulk's `getMore` and does not
  assert it — a bulk `getMore` of 0 on L would be the surprising result.
- Decisions that depend on it: the `getMore: 0` assertion for naive (AC-7); the zero-at-start check of
  the runner; reading bulk's `getMore` as a measurement in G2 (AC-18).

### F18: Bulk's `getMore` on both sizes, and where the two on L come from

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Measured by: the run (G2), on this machine, against `labs-a` with `mongodb` 7.7.0
- Commands: `pnpm lab:a`, whose counting client now reports the whole `listed` tally per export; then,
  for the decomposition, one fresh monitored client per request of the bulk shape on size L, each
  running that request alone
- Output:

```
requests S/users-usage bulk: listed {"find":2,"aggregate":1} counted {"find":2,"aggregate":1} expected {"find":2,"aggregate":1}
requests L/users-usage bulk: listed {"find":2,"aggregate":1,"getMore":2} counted {"find":2,"aggregate":1,"getMore":2} expected {"find":2,"aggregate":1}
L find groups sorted by code: 40 documents, listed {"find":1}
L find all 1000 users sorted by groupId, code: 1000 documents, listed {"find":1,"getMore":1}
L aggregate usage_events by userId over the window: 1000 documents, listed {"aggregate":1,"getMore":1}
```

  (the other three reports of each size printed the same counts as the one quoted; `find` is 2 and
  `aggregate` 1 everywhere)

- What follows: bulk's `getMore` is 0 on size S and 2 on size L, for all four reports. On S nothing
  exceeds the driver's 101-document first batch: 4 groups, 20 users, 20 aggregated users. On L the two
  `getMore` are one each from the two requests whose result set is 1,000 documents — the find of all
  users and the aggregation by `userId` — while the find of the 40 groups needs none. So the non-zero
  `getMore` is the evidence that the bulk shape really reads every user in one request; a `getMore` of
  0 on L would mean it does not. This is why 2.4 measures bulk's `getMore` and does not assert it, and
  the runner leaves it out of the expected object rather than setting it to 0.
- Decisions that depend on it: AC-18, which reports these counts rather than asserting them; the
  `ExpectedCounts` of `lab-a/src/counting.ts`, whose `getMore` is optional for exactly this reason.
  It does not overturn F17, which asserted `getMore` 0 for the naive shape only.

### F19: How many of burst 1's eight requests complete in the two frozen arms

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Measured by: the run (G3), on this machine, each arm in its own container and JVM with
  `--network none`
- Commands: `pnpm lab:b` three times in all, plus one single-arm `docker run` per arm while the program
  was being built; the number asked for is the `ok` field of the `burst":1` line
- Output (the burst-1 lines of the two frozen arms, identical in every observation):

```
LAB-B {"arm":"fixed-await","burst":1,"size":8,"ok":0,"timedOut":8,"failed":0,"probe":"timeout","health":200}
LAB-B {"arm":"global-noextra","burst":1,"size":8,"ok":0,"timedOut":8,"failed":0,"probe":"timeout","health":200}
```

- What follows: on this machine, with the eight requests released together by a latch, the count is 0
  every time — four observations per arm, never anything but 0. SCOPE.md 3.3 nevertheless says "fewer
  than 8 ok" rather than 0, and that is right: the number depends on whether any of the eight outer
  futures reaches its `Await.result` before the three pool threads are all occupied, which is a race.
  The runner therefore compares `burst1.ok < 8` and reports the number as measured; it does not assert
  0. Asserting 0 would harden this machine's scheduling into the contract and would make the lab fail
  on a slower or busier machine for no good reason. What proves the pool is frozen is not this number
  but the probe timing out and bursts 2 and 3 scoring 0 ok, while `/health` still answers 200 after
  every burst — the server's own cached pool being untouched by the arm's pool.
- Decisions that depend on it: the `{ kind: 'fewerThan', than: 8 }` form in
  `tools/lab-b-outcomes.ts` and its test that accepts 0, 1, 2 and 7 alike (AC-29, AC-31, AC-34).

### F20: html-webpack-plugin 5.6.8 strips attribute quotes in production, whatever `minify` says

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Measured by: the run (G4), on this machine, with the installed `html-webpack-plugin` 5.6.8 and
  `webpack` 5.111.1 of facts F9
- Setup: a scratch webpack build in the OS temp directory whose `HtmlWebpackPlugin` is given the page
  of SCOPE.md 4.2, `…<body><div id="root"></div></body>…`, built six ways
- Output (whether the emitted `index.html` holds the literal `id="root"`):

```
minify-false         id="root" present: false | <!doctype html><html lang=en><head><meta charset=utf-8>…
keep-quotes          id="root" present: false | <!doctype html><html lang=en><head><meta charset=utf-8>…
minify-true-default  id="root" present: false | <!doctype html><html lang=en><head><meta charset=utf-8>…
production + template file                 id="root": false  <!doctype html><html lang=en>…
development + templateContent              id="root": true   <!doctype html><html lang="en"><head><meta charset="utf-8">…
production + templateContent + minify:{}   id="root": false  <!doctype html><html lang=en>…
```

  (`keep-quotes` is `minify: { removeAttributeQuotes: false, collapseWhitespace: true }`)

- What follows: in `mode: 'production'` this plugin emits `<div id=root></div>`, and the documented
  `minify` switch does not affect it — `false`, `true`, `{}` and an explicit
  `removeAttributeQuotes: false` all give the same bytes, and a template file behaves like
  `templateContent`. In `mode: 'development'` the quotes survive, so the stripping is tied to the mode.
  The plugin did receive the option: a probe of the constructed config printed `options.minify: false`.
  Two consequences. First, lab C's dev-server readiness check is unaffected, because
  `webpack-dev-server` runs the development configuration and its page holds `id="root"`. Second, the
  production page of the webpack arm cannot hold the literal `id="root"` that SCOPE.md 4.4 asks for,
  while Rsbuild's page does hold it. Nothing in 4.2 may be tuned to change this and the plugin version
  is pinned by F9, so the contract's literal expectation is the thing that has to give: recorded as the
  run's one contract change, with the check asking that the page mount on `root` in either quoting form.
  The weaker reading was not adopted: a page without a root mount still fails, and the control proves it.
- Decisions that depend on it: the contract change recorded in PROGRESS.md; `mountsOnRoot` in
  `tools/lab-c-equivalence.ts` and its control; AC-40.

### F21: The dev-server readiness definition of 4.3 on each tool

- Measured on: 2026-10-05 / last re-measured: 2026-10-05
- Measured by: the run (G4), on this machine, 1,000 generated modules, 6 starts per tool
- Setup: the readiness check of SCOPE.md 4.3 — `GET /` answering 200 with `id="root"` in the body
  **and** the first `<script src>` of that page also answering 200, tried every 50 ms with a 120 s
  limit
- Output (the first script each tool's dev page offered, and whether the port came back free):

```
webpack port 18461 - port free after 6 of 6 stops; first script main.js
rsbuild port 18462 - port free after 6 of 6 stops; first script /static/js/lib-react.js
```

- What follows: both conditions are reachable on both tools with the literal `id="root"`, so 4.3 needs
  no relaxation at all — the contract change of this run is confined to 4.4. The reason is in F20: the
  quote-stripping of html-webpack-plugin happens in `mode: 'production'`, and `webpack-dev-server`
  serves the development configuration, whose page keeps `id="root"`. The two tools do differ in the
  page they serve, which is why the check reads the page it is given: webpack's first script is the
  relative `main.js`, Rsbuild's is the absolute `/static/js/lib-react.js`, and Rsbuild's page carries
  two scripts where webpack's carries one. Both are resolved against `http://127.0.0.1:<port>/` before
  being fetched. No start ever needed a second attempt at a stage, and the 120 s limit was never
  approached: the slowest measured start was webpack at about 2.5 s.
- Decisions that depend on it: the readiness check of `tools/lab-c.ts` keeps 4.3's literal
  `id="root"` while the production equivalence check of 4.4 accepts the unquoted form (AC-42, AC-43);
  `firstScriptSrc` reads quoted and unquoted `src` attributes and relative and absolute paths alike.

### F22: A run on a new UTC date adds a result set rather than replacing one

- Measured on: 2026-10-06 / last re-measured: 2026-10-06
- Measured by: the run (G5), on this machine
- Command: `pnpm lab:a`, `pnpm lab:b` and `pnpm lab:c` for AC-52, then `ls` of the three result
  directories
- Output:

```
lab-a/results/:
2026-10-05-linux-x64.json  2026-10-05-linux-x64.md  2026-10-06-linux-x64.json  2026-10-06-linux-x64.md
lab-b/results/:
2026-10-05-linux-x64.json  2026-10-05-linux-x64.md  2026-10-06-linux-x64.json  2026-10-06-linux-x64.md
lab-c/results/:
2026-10-05-linux-x64.json  2026-10-05-linux-x64.md  2026-10-06-linux-x64.json  2026-10-06-linux-x64.md
```

- What follows: the name of a result file is `<UTC date>-<platform>-<arch>` and a run "replaces files
  of the same name" (SCOPE.md 1.4), so a run that happens on a later UTC date adds a pair instead of
  replacing one. G5's final runs crossed midnight UTC — lab A's block is dated
  `2026-10-06T00:38:25.011Z` — so each lab now carries two sets from the same commit and the same
  deliverables. Both sets are real runs of the same build. Neither is pruned: the `2026-10-06` set is
  what the README's 結果 quotes, and the `2026-10-05` set is what the G2, G3 and G4 ledger rows quote,
  so deleting it would leave those rows pointing at files that no longer exist — which is the defect
  the bus rejected G2 for in the first place.
- Decisions that depend on it: the README quotes the `2026-10-06` set and says so; AS-BUILT difference
  4 records the behaviour against 1.4; handover item 2 leaves the human the choice of pruning before
  publishing.
