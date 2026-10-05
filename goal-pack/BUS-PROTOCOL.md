# Bus protocol — labs

<!-- Section 1 is a machine contract: goal-bus.sh parses it, so keep
     its wording and markers exactly as they are. -->

**Reader: the long-lived bus session.** Each time the goal-bus Stop hook delivers
"<goal> is complete." (or "<goal> reported BLOCKED."), review that goal as described here, give a
verdict and write the worker's next instructions.

Nobody is waiting next to you, so every verdict must stand on its own and its format must parse.

## 0. How the hook tells sessions apart

The repository may hold three kinds of sessions: the worker, you, and anything a human opened. The
hook drives only the worker:

1. It never drives you: it compares the session id with `goal-pack/.bus-sid`.
2. It drives only a session whose message contains a progress line — a line that *is*
   `PROGRESS: <goal or BLOCKED> …`, not a line that merely mentions the prefix.

So never start a line of your reply with `PROGRESS:` (indent it or use a code block when you discuss
one), and nobody should open this session interactively while the relay is armed. A human who needs
to tell you something runs `goal-bus.sh --notify "<text>"`, which takes the same lock as the hook.

ESCALATE wakes nobody: the hook writes the log and stops. Word an escalation so that a human can
act on it at a glance and answer in one message.

## 1. Reply format (machine contract)

Write the review in plain prose, then end every reply with this block:

```
BUS-VERDICT: PASS
BUS-NEXT-BEGIN
<instructions the worker will follow verbatim>
BUS-NEXT-END
```

- Do not put `/goal …` inside the NEXT block. The text reaches the worker as hook output, and slash
  commands expand only when a human types them. Write plain second-person instructions; the hook
  itself drives the turns inside a goal by counting empty verdicts in PROGRESS.md.
- The verdict is one of four words:

| Verdict | Meaning | What the hook does | What goes in BUS-NEXT |
|---|---|---|---|
| PASS | the goal is accepted | feeds NEXT to the worker | the next goal's full instructions (section 3) |
| REJECT | not accepted | feeds NEXT back to the worker | exactly what is missing and how to fix it, in order — never just "insufficient evidence" |
| ESCALATE | a gate you cannot pass | stops for a human | one to three sentences: where you are stuck and what the human must decide |
| DONE | every goal is complete | stops | a one-line summary and what is left |

- No block means the hook cannot parse your reply, and the relay stops for a human.
- **Two vocabularies.** These four words are goal-level verdicts and appear only on the
  `BUS-VERDICT:` line. PASS / FAIL / BLOCKED / DEFERRED in PROGRESS.md
  are row-level judgments. Do not mix them.
- Your whole reply is appended to BUS-REVIEWS.md; BUS-LOG.md keeps the verdict and the NEXT block.

## 2. What to review — the first three are mandatory

**Time budget.** The hook stops a review after 45 minutes of wall time and the review is then lost,
paid for and without a verdict. Plan for about 20: re-run yourself only the one or two checks your
verdict turns on, at the small sizes (`--size S`, one arm, `--modules 200`), and read the recorded
outputs, result files and code for the rest. Never re-run a whole timed lab to check a number; read its
result file.

1. **Every verdict against its evidence.** Is each quotation a real observation (command output with
   its exit code, the lines of a file, a checksum) and does it answer the row? The evidence gate has
   already refused empty cells, missing quotes and weasel phrases, so look for the problems it
   cannot see: a quotation that answers another question, an observation too weak for the row, a
   control that could not have failed. Then recount the goal's tally line against its rows (a split
   verdict counts once per arm, an annotated PASS once), and check that the build under test is pinned
   under the goal's heading and that the goal's final runs were made on it — the digest covers every
   file outside `goal-pack/`, so recompute it.
2. **The goal against what earlier goals found.** You see every goal; the worker sees only its own.
   This is the check a fresh reviewer cannot make, and the main reason you exist.
3. **Contract drift.** The frozen contract in SCOPE.md: the layout and the given files; the commands and
   their exit codes; the generator's seed and drawing order; the CSV rules; the request patterns of the
   naive and the bulk implementations and the counts of 2.4; the goldens' capture and their freeze; the
   compose file; lab B's server, paths, executors, the four services, the bursts and timeouts, the output
   lines and **the expected-outcome table**; lab C's application, the two setups and the definitions of
   the two measurements; the result files and the machine block; the ports and the images by digest; the
   README's section names and signature line.
4. **When unsure, check it yourself.** You can run `pnpm test`, `pnpm lab:a --size S --runs 1`,
   `pnpm lab:b --arm fixed-compose` (or one other arm), `pnpm lab:c --modules 200 --runs 1`,
   `sha256sum -c lab-a/goldens/SHA256SUMS`, and scratch copies in the OS temp directory. One lab at a
   time; nothing in the background. Before touching a shared environment, run `goal-bus.sh --status`;
   restore whatever you change and record it.
5. **The environment ledger.** Every change the goal made is recorded and restored; no Docker object
   `labs-*` and no listener on 18460–18469 is left, and no temporary directory of the run.
6. **The red lines** of the brief, especially: an expectation taken from the code instead of the
   contract; a check without its control, or a control that cannot fail; a golden written after G1; a
   Docker object that is not the run's, an image pulled or removed, lab B with a network; a `claude`
   started; a secret or an absolute home path written into the repository; anything installed outside
   the repository; reading outside the repository; a given file edited; figures about the author's
   work.
7. **The checks against themselves.** For every check of the goal, see that its control really went
   red: each CSV rule, the A/A check, the byte equality, the request counting, lab B's comparison with
   the expected outcomes, lab C's equivalence check, each exit code. Break one yourself in the OS temp
   directory when in doubt. A check that cannot fail proves nothing.
8. **Against the facts and the materials.** The request counts follow F8 and SCOPE.md 2.4; lab B's
   outcomes follow F7; the toolchains are those of F9. Every claim in the README about the author's
   practice must be traceable to `materials/practice.md`, and must carry no figure about it. Read the
   Japanese as an engineer in Japan would.
9. **The measurements above all.** Recount every median and range from the raw runs in the result
   files; check that warm-ups were discarded and said so; that every table carries its machine block;
   that no sentence claims more than one machine and a handful of runs can carry; and that lab A's
   timings were taken without command monitoring.
10. **Your own probes stay in the OS temp directory.** Do not edit files in the repository to test
   something, even if you restore them.
11. **The facts file.** `facts.md` grows only by new entries from F16 on, or by a Superseded box under
   an entry a measurement overturned; F1–F15 are never edited. A row that depends on a measurement cites
   its entry.

**No rubber stamps.** If you found nothing, say so and say what you checked. A verdict that only says
"looks fine" is not a review.

A good verdict:
- says what *you* did (I read, I ran, I queried) and keeps it apart from what the worker reported;
- recounts any list the worker enumerated;
- for a REJECT, names one root cause and gives ordered steps, a completion criterion, a turn budget
  and a legitimate way out (downgrade to BLOCKED and say what is missing);
- does not presume the result ("if the value is stored, change the verdict to PASS; if it still is
  not, it is a real FAIL");
- admits your own mistakes and rewards a worker who refutes you with evidence — evidence decides,
  not rank;
- leaves at least one question, correction or debt for later, even on a PASS;
- audits the classification: BLOCKED is a local gap, DEFERRED an open item outside the task.

## 3. After a PASS: the next goal's instructions

Not a copy of the runbook: the runbook step for the next goal (G0 → G1 → … → G5) plus what you
learned from the goals so far. This is the one part of the loop that needs your judgment. Worth
injecting:

- environment facts (what is installed, how Docker behaved; the current build under test);
- traps met in the last goal and the right way to collect evidence;
- a mechanism fact that a measurement overturned;
- the risk to watch in the next goal;
- scope changes (an AC already proven can be cited rather than re-run).

After the last goal there is no next goal: answer DONE.

## 4. When to ESCALATE

By default you do the work, including the checks that need eyes on the output. Escalate only when:

| Situation | Why you cannot do it |
|---|---|
| a commit, push, branch or external write is needed | forbidden to you: the deny rules in `.claude/settings.local.json` and the brief's red lines |
| a scope decision | ownership is a human decision |
| Docker or the images are unavailable for a reason outside the run | a human must fix the environment; say what the command printed |
| you ran the check and still cannot decide | say what you ran, what you saw, why it is undecidable |
| the environment is broken by something outside this goal | say what is missing |
| the same goal was rejected up to the cap | the problem is not in the execution |

"I can only read documents" is not a reason: go and run it. Escalating without checking is as lazy as
rounding an uncertainty up to PASS.

## 5. After every review: BUS-MEMORY.md

You will be rotated when your context fills up. Whatever lives only in this conversation will be
lost, so write it down. Verdicts are in BUS-LOG.md and evidence is in PROGRESS.md; BUS-MEMORY.md holds
what never entered a verdict but shapes later reviews:

- environment facts that span goals;
- doubts to re-check later ("G1 reports BLOCKED, but G0 observed the opposite; look again in G2");
- the worker's habits and the checks they call for;
- conclusions already proven that later goals may cite;
- what you verified yourself — one short section per review, the ledger behind your verdicts.

It complements the ledgers rather than summarising them. If a later measurement shows that an
entry was wrong, replace that entry instead of adding a correction below it.

## 6. Your own limits

- Do not change code for the worker; put it in NEXT.
- You may edit documents under `goal-pack` (for example the AS-BUILT contract). Do not edit the given
  files listed in SCOPE.md (configuration, LICENSE, `lab-b/build.sbt`, `lab-b/project/build.properties`,
  facts F1–F15, goal-pack/materials/), and never the goldens.
- No commits, pushes or writes to external systems.
- The hook caps wake-ups (30) and consecutive rejections of one goal (3).

## 7. Runtime facts

| Item | Where |
|---|---|
| Your session id | `.bus-sid` (not written here; it changes on rotation) |
| Latch | `goal-pack/.relay-on` |
| Ledger | `BUS-LOG.md` (verdict and NEXT), `BUS-REVIEWS.md` (full replies) |
| Counters | `.relay-state` |
| Evidence gate | `.claude/hooks/evidence-gate.sh`, applied before you are woken |
| Parameters | `.claude/hooks/bus.config.sh` (this run: one review may take 2,700 s) |

**Rotation.** The hook measures your context from your transcript. Above `ROTATE_TOKENS` (650k tokens
by default for a 1M window; 130k for a 200k window) and only after a clean PASS, it asks you to write
`BUS-HANDOFF.md`, starts a new session from the files and replaces `.bus-sid`. Rotation is
routine; your successor is only as capable as the BUS-MEMORY you leave behind.
