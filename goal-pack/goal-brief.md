# Goal brief — labs

> This file is the worker's only entry point. Read all of it before you start.
> Contract: [SCOPE.md](SCOPE.md). Facts: [facts.md](facts.md). Ledger: [PROGRESS.md](PROGRESS.md).
> Human manual: [runbook.md](runbook.md). Source material: [materials/practice.md](materials/practice.md).

## Mission

Build three small experiments from the author's practice and run them for real: a report that reads a
database one user at a time, rebuilt to read in bulk and proved byte-identical, with its requests
counted; a pool of three threads that freezes when its callers block on it, set beside the pools that
do not; and the same React application built with webpack + Babel and with Rsbuild, measured the same
way. Every number the repository publishes comes from these runs.

| Goal | Scope | In one line |
|---|---|---|
| G0 | skeleton | toolchain, the images and ports re-measured, the given files read, the contract frozen |
| G1 | lab A, part 1 | the generator, the CSV writer, the store, the naive reports, the A/A check, the goldens frozen |
| G2 | lab A, part 2 | the bulk reports, byte equality with the goldens, the requests counted, the timings |
| G3 | lab B | the Scala program, the four arms in their own JVMs, the expected outcomes, the runner |
| G4 | lab C | the generator, the two build setups, the equivalence check, cold builds and dev-server starts |
| G5 | finish | README, CI, PUBLISHING.md, the three labs once more, the contract → AS-BUILT |

Every row is already listed in PROGRESS.md. Do not add or remove rows; to change a plan, write the
reason in PROGRESS.md first.

## Required reading

| Resource | Why |
|---|---|
| [SCOPE.md](SCOPE.md) | the only authority for the layout, the commands and exit codes, the data, the formats, the request counts, the expected outcomes, the ports and the images |
| [facts.md](facts.md) | what was measured before the run, with the commands; you append yours from F16 on |
| [materials/practice.md](materials/practice.md) | the practice behind each lab, and everything you may say about it |
| [PROGRESS.md](PROGRESS.md) | the rows you judge |

## Facts already verified — use them, do not re-investigate

Each has its entry in [facts.md](facts.md) with the command and the output.

- **F1, F2**: Ubuntu 20.04.6, 12 CPUs, 46 GiB. Node `v24.19.0`; inside the repository pnpm is `11.28.0`
  (the global one is 11.22.0 and switches itself; corepack is not enabled here and stays so). Node runs
  `.ts` directly: erasable syntax only, local imports carry `.ts`, types use `import type`.
- **F3**: `mongo:7` (7.0.43) and the sbt image (sbt 1.13.0, Scala 3.8.4, JDK 21.0.12, runs as root) are
  on the machine; use them **by digest only**, never pull, tag or remove an image.
- **F4**: ports 18460–18469 are free; SCOPE.md assigns them.
- **F5**: the proxy variables are set and bypass 127.0.0.1; `pnpm install` goes through the proxy.
- **F6, F7**: the sbt image compiles and runs a standard-library Scala 3 program with no network; the
  four arms of lab B behave as SCOPE.md 3.3 expects, each in its own JVM.
- **F8**: the MongoDB driver's `commandStarted` events count the requests exactly.
- **F9–F11**: both build toolchains install with no build script; one build of 1,000 modules took about
  5 s with webpack and under half a second with Rsbuild here, and both work on the author's Windows PC.
- **F12**: the Actions' SHAs. **F13**: the relay of this run is goal-bus-kit `bce56e8`. **F14**: never
  put a `|` inside a cell of PROGRESS.md. **F15**: actionlint by digest, offline.

Rules of this machine, not measurements:

- The proxy comes from environment variables: **never unset or print them.**
- **Never start `claude`.** Nothing in this repository needs the CLI; the bus above you is the only
  session that reviews.
- Docker is used only as SCOPE.md describes: the Compose project `labs-a`, the containers
  `labs-b-<arm>`, the read-only checks of G0 and G5, and scratch containers of your own named `labs-…`
  with `--rm`. Never touch a container, volume, network or image that is not yours; `docker ps` shows
  other users' containers on this machine, and they stay as they are.

## Facts you measure

When you measure something a decision depends on (a request count, a timing definition, a behaviour of
a tool), append it to facts.md as a new entry from F16 on, in the form of the entries above it: the
date, the exact command, the output as printed (no secret, no absolute path under the home directory;
say what you cut), what follows, and the decisions that depend on it. Quote the id in the PROGRESS row.
When a measurement contradicts an entry, add a "Superseded" box under that entry — never edit its text —
and record it under "Contract changes" if the contract depended on it.

## How to build this repository

- **The contract decides expectations, never the code.** A test expects what SCOPE.md says — the request
  counts of 2.4 and the outcomes of 3.3 above all. If the code disagrees, the code is wrong, unless the
  run proves the contract wrong — then it is a contract change, recorded with its reason first.
- **The goldens are the proof, so they are captured once.** G1 writes them after the A/A check; from then
  on nothing edits, regenerates or deletes them. A bulk output that differs is a defect of the bulk
  implementation, never a reason to touch a golden.
- **Nothing is guessed.** An input that cannot be read exactly is an error that names it.
- **Controls before greens.** Every check is seen to fail on a planted violation, in a real run: each CSV
  rule, the A/A check, the byte equality, the request counting, the expected-outcome comparison of lab B,
  the equivalence check of lab C, the exit codes. Plant them in scratch copies in the OS temp directory,
  never in the repository. A control says it is one.
- **Measure, do not explain.** A timing is reported with its machine block, its warm-up and its runs. Do
  not explain a number you did not measure, and do not compare machines.
- **Two runs agree.** A count, an outcome or an output's bytes are quoted from two consecutive runs.

## Definition of done for each goal

1. **Read first.** Read the current state before changing a file.
2. **It runs.** `pnpm test`, `pnpm lint` and `pnpm typecheck` pass, and each goal's own commands as its
   rows require; paste the output.
3. **The build under test is pinned.** Once the goal's code is done and before its final verification,
   write one line under the goal's heading in PROGRESS.md:
   `Build under test: <commit> + deliverables <digest>`, with the commit from `git rev-parse --short HEAD`
   and the digest from
   `git ls-files -c -o --exclude-standard -z -- . ':!goal-pack' | sort -z | xargs -0 -r sha256sum | sha256sum | cut -c1-12`.
   The digest covers every file outside `goal-pack/`, so anyone can recompute it afterwards. The goal's
   two final runs are made on that build; if anything changes after them, write the new line and run
   them again.
4. **Every row has a verdict** from the table below; nothing is left unexplained.
5. **The tally is written.** Under the goal's last table, one line:
   `Tally: <n> rows · <m> verdicts (PASS a · FAIL b · BLOCKED c · DEFERRED d)`. A split verdict counts
   once per arm, so m can exceed n; an annotated PASS counts as one PASS.
6. **PROGRESS.md first, report second.**
7. **Leave nothing behind.** Temporary files go to the OS temp directory and are removed; no Docker object
   `labs-*` and no listener on 18460–18469 is left when the goal ends.

### Verdicts

| Verdict | Meaning | Required |
|---|---|---|
| PASS | you observed what the row describes | quote the observation (command output with the exit code, the lines of a file with their numbers) |
| FAIL | the observation contradicts the row | `expected "<X>" / actual "<Y>"`; if you cannot write that, it is not a FAIL |
| BLOCKED | you could not verify it | say what is missing; a result that needed the environment fixed by hand is BLOCKED too |
| DEFERRED | it depends on an open decision | name the decision |

Two forms are allowed:

- **Annotated PASS**: `PASS (note: <the condition>)` when it passed under a condition; the note stays in
  the row.
- **Split verdict**: when a row has two paths and only one could be verified, write both, verified arm
  first, for example `PASS (S) / BLOCKED (L)`, with the evidence of each arm in the evidence cell. Do not
  split a row just to avoid a FAIL.

The auxiliary words (N/A, INFO, INCONCLUSIVE) are not verdicts in this ledger; use them only inside the
evidence. "Works as expected", "no issues" and "looks fine" count as unverified. When in doubt, BLOCKED —
never round an uncertainty up to PASS. A timing you did not hope for is not a FAIL of the row: the row
asks for the measurement, and the measurement is the result.

### The evidence gate is mechanical

`.claude/hooks/evidence-gate.sh` runs at the end of every turn while `goal-pack/.gate-on` exists. It
blocks the turn when a PASS has empty evidence, a weasel phrase or no quotation mark; when a FAIL is not
"expected / actual"; when a BLOCKED or DEFERRED gives no reason; or when a verdict word is unknown. It
reads the file, not the conversation: **never invent a quotation to pass it.** After 5 blocks in a row it
lets the turn end to avoid a loop; say so plainly in your report. Never put a `|` inside a table cell of
PROGRESS.md: it splits the cell.

### Run things one at a time

One lab at a time, never two together, never in the background. Wait for a long command with one
blocking call (`timeout` up to 600000 ms on the Bash tool); keep every single command under ten minutes
and split a longer one (`pnpm lab:b --arm <name>` runs one arm).

## Red lines — stop and report if you are about to cross one

1. Do not create, switch or modify branches.
2. Do not commit or push; the human commits after the run.
3. **Read and write only inside this repository and the OS temp directory.** Do not open, list or search
   anything else on this machine — not the home directory, not other repositories, not other users'
   containers. The OS temp directory is shared with other users: every file or directory you create
   there carries the prefix `labs-` (`mkdtempSync(join(tmpdir(), 'labs-…-'))`), a check for leftovers
   lists `labs-*` only, and an entry without that prefix is never opened, read or removed, not even to
   find out whose it is. In the previous run of this portfolio the worker opened such files to identify
   them, and their names reached the ledger.
4. **Never start `claude`**, and never change the CLI or its configuration.
5. No secret in any file of the repository. Do not unset or print the proxy variables or any token.
6. Do not fix unrelated problems; record them under "Incidental findings". A defect **your own change**
   introduced is not unrelated: fix it in the same goal.
7. Do not edit the given files listed in SCOPE.md 1 — and after G1, never the goldens.
8. Network: only `pnpm install`. Nothing else reaches the network: no `curl` to the internet, no
   `docker pull`, no `npm view`, no `git fetch`. Lab B runs with `--network none`. No `sudo`.
   **Nothing that installs or enables a tool outside this repository**: no `corepack enable`, no
   `npm install -g`, no `pnpm add -g`, no `apt`, no downloaded binaries. The Node installation and Docker
   on this machine are shared. A CI workflow may contain setup steps; they run on CI only. Here, verify
   only the project's own commands.
9. Docker only as the rules above say: by digest, objects named `labs-*`, and nothing of anyone else.
10. No employer, product, customer, team or person names; no figures about the author's work. The
    README's signature line is required and is not a person name in this sense; the generator's
    fictional names are fine.

### There is a bus above you

While `goal-pack/.relay-on` exists, every turn you end meets the goal-bus Stop hook:
- **Inside a goal** it sends you back ("Continue Gn: N row(s)…"). The hook reads PROGRESS.md, not the
  conversation: a table where every row has a verdict is the only way out.
- **When you print `PROGRESS: <goal> COMPLETE`** it checks the table and the evidence, then wakes the
  bus. The bus answers PASS (the next goal's instructions) or REJECT (what to fix).
- **The bus sees every earlier goal** and re-runs checks itself. An invented quotation will not survive
  it; BLOCKED will.

## Turn rhythm and progress protocol

- Each turn closes at least one row end to end, including writing it to PROGRESS.md.
- End the turn with: `PROGRESS: <goal> ac_done=X/Y pass=a fail=c blocked=d deferred=e`
- When every row of the goal has a verdict and PROGRESS.md is written: `PROGRESS: <goal> COMPLETE`
- When you are blocked: `PROGRESS: <goal> BLOCKED <reason>` — goal name first.
- The numbers must match PROGRESS.md.

**A turn must end on one of these lines. This is not formatting; it is what keeps the chain alive.**
The hooks run only when a turn ends, and they recognise you and your boundary by this line. End on
anything else and nobody is woken: your process ends and the chain stops silently. It follows that
starting a long task in the background and ending the turn throws its result away, and that a long task
is awaited with **one blocking call**, anchored on its output.

## After context compaction

1. Read PROGRESS.md and take the next empty verdict of the current goal.
2. If this brief is no longer in your context, read it again, completely, then SCOPE.md.
3. Check that SCOPE.md still says FROZEN (or AS-BUILT after G5).
4. Check that nothing of yours is still running (no Docker object `labs-*`, no listener on
   18460–18469), and run `pnpm test` once before going on.
