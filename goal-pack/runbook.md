# Runbook — labs

<!-- For the human operator. The worker never needs this file. This run goes to a Linux host with its
     own CLAUDE_CONFIG_DIR and GOALBUS_ENV_FILE, launched with setsid nohup (see goal-bus-kit's
     examples/toy-run/README.md). -->

## 0. Before arming

- [ ] You created the branch yourself (no mechanical guard exists for this) and `git status` is clean.
- [ ] Both selftests are green **on the machine that will run the hooks** (the installer runs them):
      `bash .claude/hooks/evidence-gate.sh --selftest`, then `bash .claude/hooks/goal-bus.sh --selftest`.
- [ ] `.claude/settings.local.json` has the permissions and hooks from `settings.hooks.json`, and
      `bash .claude/hooks/goal-bus.sh --status` reports the relay hook timeout as ok.
- [ ] **The review limit is raised for this run**, in the installed copy only: `REVIEW_TIMEOUT` 2700 in
      `.claude/hooks/bus.config.sh` (or `GOALBUS_REVIEW_TIMEOUT=2700` in the launch environment) and the
      relay hook's `timeout` 3480 in `.claude/settings.local.json` (it must exceed
      2700 + 2 × 300 + 60). A review that re-runs the labs can pass the default 29 minutes; the previous
      run of this machine lost one that way.
- [ ] Nothing else uses the same environment: no other armed pack in any working tree or on any
      machine, and nobody testing by hand. Check again right before launch.
- [ ] Caps are calibrated: one run (6 goals, about 7 reviews, 82 rows) is below WAKE_LIMIT / TURN_LIMIT.
- [ ] On a shared host: the run has its own `CLAUDE_CONFIG_DIR`, so the account's MCP servers, skills
      and memory stay out. The CLI authenticates with an environment token, so set `GOALBUS_ENV_FILE`
      (see `bus.config.sh`) and prove it with one real call made from an environment that lacks the
      token.
- [ ] Ports 18460–18469 are free (F4) and no Docker object `labs-*` exists.

## 1. Seed the bus

```bash
bash .claude/hooks/goal-bus.sh --seed      # starts a session that reads the pack, records its id
```

## 2. Arm and launch

```bash
touch goal-pack/.gate-on goal-pack/.relay-on
bash .claude/hooks/bin/start-worker.sh --file goal-pack/g0-instructions.md   # add --detach to background it
```

## 3. Watch

```bash
bash .claude/hooks/bin/watch.sh            # events only; it never reads transcripts for protocol text
bash .claude/hooks/goal-bus.sh --status    # where the run is, what was actually reviewed, cost
```

## 4. The goals

### G0 — toolchain, the images and ports re-measured, the contract frozen
- Instructions for the worker: `goal-pack/g0-instructions.md`
- After the bus's PASS, check yourself: nothing was installed outside the repository; no image was
  pulled (`docker image ls` unchanged). · Commit: `Install the skeleton and freeze the contract`

### G1 — lab A, part 1
- Step for the bus to adapt into instructions: the generator, the CSV writer and its controls, the
  store, the compose file, the naive reports and their request counts, the A/A check, the goldens.
- Check yourself: open two goldens in a spreadsheet and in `xxd`; the quoted names round-trip.
  · Commit: `Add lab A's data, CSV writer, naive reports and the goldens they produced`

### G2 — lab A, part 2
- Step for the bus to adapt into instructions: the bulk reports, byte equality with the goldens, the
  request counts, the timings, the exit codes with their controls, the result files.
- Check yourself: `sha256sum -c lab-a/goldens/SHA256SUMS`; the result file's raw timings give its
  medians. · Commit: `Add lab A's bulk reports, proved byte-identical, with requests and timings`

### G3 — lab B
- Step for the bus to adapt into instructions: the Scala program, the four arms in their own
  containers, the runner and its comparison with the expected outcomes, the result files.
- Check yourself: `git status --short lab-b` shows no `target/`; read one frozen arm's lines.
  · Commit: `Add lab B: a pool of three that freezes under blocking await, beside three that do not`

### G4 — lab C
- Step for the bus to adapt into instructions: the generator, the two setups, the equivalence check,
  the cold builds and the dev-server starts, the result files.
- Check yourself: no dev server left running; both tables have their machine block.
  · Commit: `Add lab C: one synthetic app built with webpack and Babel and with Rsbuild, measured alike`

### G5 — README, CI and closing
- Step for the bus to adapt into instructions: the README in the seven sections with the signature,
  the CI, PUBLISHING.md, the three labs once more, SCOPE.md → AS-BUILT.
- Check yourself: the leak scan (human only), then the README top to bottom.
  · Commit: `Add the README, CI and publishing notes`

## 5. When the relay stops

| Situation | What you see | What to do |
|---|---|---|
| Usage limit | BUS-LOG: "stopped by a usage or rate limit" | wait for the reset, then `start-worker.sh --resume <worker-id> "continue"`; never retry in a loop |
| A review cut off by the time limit | BUS-LOG: "waking the bus failed", rc=124 | raise the review limit if it was too low, then resume the worker with an instruction to re-report the boundary; record it as an intervention |
| ESCALATE | a systemMessage and a BUS-LOG entry | write the ruling into BUS-MEMORY.md, then `goal-bus.sh --notify "<ruling>"`, then resume the worker with `--next` |
| Planned pause | `.relay-paused` exists | when ready: `start-worker.sh --resume <worker-id> --file goal-pack/.next-step` |
| Lost or unparsed verdict | BUS-LOG "UNPARSED" or a failed wake-up | `goal-bus.sh --recover`, then hand the NEXT block to the worker; do not pay for the review twice |
| Crash or stale lock | `--status` shows the lock taken | make sure nothing is half-written, `goal-bus.sh --reset`, resume |
| Turn cap or reject cap | a systemMessage | read BUS-LOG; split the goal or change the approach rather than raising the cap |
| The worker ended silently | `watch.sh` prints `[ended]` or `[stall?]` | read the end of `goal-pack/.worker-output`; resume with a corrective instruction |

Never retype the command that wakes the bus: `--notify` is the one way to talk to it.

## 6. Rubber-stamp audit (the one hole no mechanism closes)

Read `BUS-REVIEWS.md` after the first PASS, after every high-risk goal and before the final commit.
Treat a verdict as suspect when two or more of these hold:

1. no first-person verification (I read, I ran, I queried);
2. every fact traces back to the worker's own report;
3. a PASS without any caveat, risk, debt or new question;
4. a REJECT without ordered steps, a completion criterion, a turn budget or a way out;
5. the same instructions as last time, nothing adapted to what was found;
6. the worker's counts or lists accepted without a recount;
7. BLOCKED versus DEFERRED never questioned;
8. no context figure or environment state, so the verdict cannot be tied to a moment.

## 7. After the run

- Commit, checking every commit message against the change it describes.
- Disarm: `rm goal-pack/.relay-on goal-pack/.gate-on`
- Keep BUS-LOG.md, BUS-REVIEWS.md, BUS-MEMORY.md, BUS-HANDOFF.md and PROGRESS.md in the repository;
  they are the evidence that makes the run auditable later. Keep `lab-c/app/` out of git.
- What the run cannot do, done by the human: the three labs on Windows (Docker Desktop for A and B),
  the results added beside the Linux ones; the README's results and limits updated, recorded under
  "Changes after the run" in SCOPE.md.
