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
