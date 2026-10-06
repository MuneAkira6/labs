
## Bus seeded (2026-10-05 16:45:28)

- session: `e6e3d223-3c4c-46f4-94a7-edc5d1ebfc48`
- model: opus[1m]

## G0 — review #1 (2026-10-05 17:00:35)

**Verdict: PASS** (bus context: 89966 tokens)

G0 is accepted. Start G1 — lab A, part 1: the generator, the CSV writer and its controls, the store,
the compose file, the naive reports and their request counts, the A/A check, and the goldens.

Read goal-pack/SCOPE.md sections 2.1-2.8 and 5 again before you write code. The contract decides every
expectation; never read one out of your own code.

WHAT G0 ALREADY SETTLED — cite it, do not re-measure it
- Node v24.19.0, pnpm 11.28.0 in the repository root, Docker 28.1.1, Compose 2.35.1.
- pnpm install is done. mongodb 7.7.0 is installed, as are every other F9 version and biome 2.5.15,
  typescript 7.0.2, vitest 5.0.3. Install nothing; `pnpm install` is the run's only network access and it
  has already happened.
- The three images resolve by digest (mongo id 1b70d5bf141c, sbt 82a8897dcd92, actionlint 7ef0d156288b)
  and run offline. Never pull, tag or remove an image.
- Ports 18460-18469 were free and no `labs-*` Docker object existed when G1 began; `/tmp` held no
  `labs-*` entry.
- The given files are byte-identical to HEAD, including `.gitattributes` (`lab-a/goldens/** -text` plus a
  global `eol=lf`, so the goldens' CRLF and BOM survive Git) and `.gitignore` (`lab-c/app/`,
  `lab-b/target/`). `vitest.config.ts` already sets `testTimeout: 30_000` and
  `include: ['test/**/*.test.ts']`. Do not edit any of them.
- Baseline on eb6646f + 013b33a1435e: `pnpm test` → `Tests  1 passed (1)`, `pnpm lint` →
  `Checked 3 files in 3ms`, `pnpm typecheck` → rc=0.

FIX FIRST — a defect G0 left behind, and it is yours to fix (red line 6)
`test/xorshift32.test.ts` lines 6-14 write the xorshift32 recurrence out inline instead of importing it.
It therefore pins the contract against its own copy and would not notice a divergent generator. When you
write `lab-a/src/data.ts`, export the generator from there, make that test import it, and delete the
inline function so exactly one implementation of the recurrence exists in the repository. AC-1 must pin
all five contract values (549423487, 3817879383, 1244534954, 2925042391, 491171478) against the real
generator, not against a local copy. If you leave two copies, AC-1 does not hold.

A TRAP YOU WILL HIT ON AC-4, AND THE WAY THROUGH IT
AC-4 wants the in-memory and the MongoDB stores proved to answer alike "against a running labs-a", but
SCOPE.md section 5 says `pnpm test` needs neither Docker nor the network, and `vitest.config.ts` is a
given file whose `include` is `test/**/*.test.ts`. So a file named `test/<x>.test.ts` that needs MongoDB
would drag Docker into `pnpm test` and would also break G5's CI test job, which runs without a database.
Put the parity check somewhere `pnpm test` does not pick up: either under `tools/`, reachable from the
lab A runner, or as a file under `test/` whose name does not end in `.test.ts` and which you run with
`node` directly. Either way it must still lint and typecheck (`biome.json` includes `tools/**/*.ts` and
`test/**/*.ts`; `tsconfig.json` includes both directories). Then prove the separation: with no `labs-a`
container running, `pnpm test` still exits 0. Quote that in AC-4's evidence.

ORDER THE WORK SO THE IRREVERSIBLE STEP COMES LAST
AC-10 writes the goldens, and after this goal nothing may ever edit, regenerate or delete them. Every
doubt about the data and the CSV bytes has to be gone before you run `pnpm lab:a:golden`. Work in this
order: AC-1, AC-2, AC-3 (all three need no Docker), then AC-5 (compose up/down, your first container),
AC-4, AC-6, AC-7, AC-8, AC-9 — and only then AC-10, AC-11, AC-12. If the generator or the CSV writer is
wrong when the goldens are captured, G2 will prove the bulk output differs from them and the only
legitimate remedy left will be a recorded contract change. Do not reach AC-10 with an open question.

WHAT I EXPECT TO SEE PER ROW, WHERE THE CONTRACT IS EASY TO MISREAD
- AC-2: the boundary events add exactly two documents per user to usage_events and two to charge_events,
  and they consume no randomness, so the drawing order of 2.1 stays as written: groups, then users, then
  usage_events (every user x all 30 days of September 2026), then charge_events, then the boundary events.
  Note in your evidence that the twice-equal sha256 of a canonical dump proves determinism only, not
  conformance to that order; the order is a read against SCOPE.md 2.1, like AC-6.
- AC-7: the expected naive `find` count is the contract's arithmetic, 1 + groups + users, so 1+4+20 = 25
  on S and 1+40+1000 = 1041 on L, the same for all four reports because the naive shape queries every
  user's events even for the two group reports. `aggregate` 0 and `getMore` 0. State why getMore is 0 —
  every naive result set (40 groups, 25 users of a group, one user's events) fits inside the driver's
  101-document first batch. Keep that reasoning: in G2 the bulk `find` of all 1,000 users on L will not
  fit one batch, and SCOPE.md 2.4 therefore measures bulk's getMore instead of asserting it. A getMore
  of 0 from a bulk run on L would be the surprising result, not a comforting one.
- AC-8: the event at 2026-09-01T00:00:00.000Z is inside the window and the one at
  2026-10-01T00:00:00.000Z is outside, so every user's `pages` carries exactly one +7 and every user's
  `amount` exactly one +990 from the boundary events. Show that arithmetic on one row of S.
- AC-11: derive the two quoted names rather than reading them off your output. The cycle is 営業部,
  開発部, サポート, 第一, 企画"室", 経理 with the group's number appended, so G003 is `サポート, 第一3`
  and G004 is `企画"室"4`, which in the CSV read `"サポート, 第一3"` and `"企画""室""4"`. 経理 first
  appears at group 5 and so exists only in size L. If your goldens disagree with that derivation, the
  generator is wrong, not the derivation.
- AC-3: one test per rule of 2.2 with a control per rule, and each control must say in its name that it
  is a control. The gate cannot tell a control from a test; I will read them.

RUNNING THE CONTROLS (AC-10's refusal, AC-12's A/A difference)
Plant every control in a scratch copy under the OS temp directory created with
`mkdtempSync(join(tmpdir(), 'labs-g1-...-'))`, never in the repository, and remove it with
`rmSync(dir, { recursive: true, force: true, maxRetries: 10 })`. A scratch copy needs node_modules: copy
the sources and symlink `node_modules` back to the repository's rather than duplicating it. Two
sequencing points. First, AC-12's copy must start with an empty `lab-a/goldens/`, or `lab:a:golden` will
refuse with exit 2 before it ever reaches the A/A check — deleting the goldens inside a scratch copy is
correct and is not a breach of the freeze, which binds the repository. Second, a scratch run needs
MongoDB on 18460 under the same Compose project, so bring the repository's `labs-a` down first and run
one lab at a time, never two, never in the background. AC-10's exit codes are the contract's: 0 written,
1 the A/A check failed and nothing written, 2 usage or the goldens already exist, 3 environment.
`pnpm lab:a:golden` is `node tools/lab-a.ts --golden` in the given package.json, so the runner must
accept `--golden` alongside `--size` and still honour those four codes.

SCOPE NOTE SO YOU DO NOT OVERBUILD
`pnpm lab:a` cannot satisfy SCOPE.md 2.7 at the end of G1, because the bulk implementation is G2's. That
is expected and is not contract drift; G1's four checks do not ask `pnpm lab:a` to exit 0. Build the
naive path, the request counting and the golden capture. Do not claim any G2 row.

ENVIRONMENT LEDGER — MY RULING, IN FORCE FROM THIS GOAL
Give the "Environment change ledger" table a row for anything that outlives a single command: the
Compose project `labs-a` and the listener it opens on 18460, each with before, change and restored. A
`--rm` probe container or a temp directory removed in the same turn stays in the row's evidence cell and
needs no ledger row. End the goal with no `labs-*` Docker object, nothing on 18460-18469 and no `labs-*`
entry in the OS temp directory, and quote those three checks.

FACTS FILE
Append an entry from F16 on for anything you measure that a decision rests on — the generator's document
counts per size, and lab A's getMore behaviour are the likely candidates. F1-F15 are never edited; a
measurement that overturns one gets a Superseded box beneath it. Cite the entry id in the row that
depends on it.

FINISHING
Sixteen rows: AC-1 to AC-12 plus the four G1 checks. Close at least one row end to end per turn and
write it to PROGRESS.md before you report. When the code is done and before the final verification,
write `Build under test: <commit> + deliverables <digest>` under the G1 heading using the brief's two
commands, and make the two final runs on that build; if anything outside `goal-pack/` changes
afterwards, write a new line and run them again. I recompute that digest, so it must match. Then the
tally line. End every turn on a PROGRESS line, and `PROGRESS: G1 COMPLETE` when all sixteen rows carry a
verdict. If something cannot be verified, BLOCKED with what is missing beats a rounded-up PASS — the
goldens are the one thing in this goal that cannot be taken back.

## G1 — review #2 (2026-10-05 17:26:11)

**Verdict: PASS** (bus context: 150830 tokens)

G1 is accepted, and the goldens are now frozen for good. Start G2 — lab A, part 2: the bulk reports,
byte equality with the goldens, the request counts, the timings, the exit codes with their controls, and
the result files. Sixteen rows: AC-13 to AC-24 and the four G2 checks.

ONE CORRECTION TO MAKE FIRST, IN THE G1 CHECKS ROW
That row says the 27 tests are "the 8 CSV rules with their 10 controls in test/csv.test.ts and the 7
generator checks with their 2 controls in test/data.test.ts". I recounted: `test/csv.test.ts` holds 19
`it()` of which 10 are controls, and `test/data.test.ts` holds 8 of which 2 are controls. The total 27 is
right and I reproduced it twice; only the split is wrong. Fix that sentence and leave the verdict as it
is. From now on, count a decomposition before you write it.

WHAT I PROVED FOR YOU, WHICH CHANGES HOW YOU READ A DIFFERENCE
I rebuilt all eight goldens from SCOPE.md 2.1-2.2 with my own code, importing nothing of yours, and every
digest matched, as did both sizes' document counts and the five seed values. The goldens are therefore
known correct against the contract, not just internally consistent. If a bulk output differs from a
golden by one byte, that is a defect in `lab-a/src/bulk.ts` and nothing else: do not reread the contract
looking for an excuse, do not touch a golden, and do not propose a contract change. Fix the bulk fold.
The eight digests you may cite rather than re-derive: S/users-usage 38ddc64162c34f87, S/groups-usage
dc6cc2273d5371fe, S/users-charge d7ee2db547f175e9, S/groups-charge 2c6a354e20ab2364, L/users-usage
c26ff21b03306954, L/groups-usage e46fde13d029aaba, L/users-charge 524031bf281f918b, L/groups-charge
d2e1d543d354602a. I also counted the naive shape myself (25 on S, 1041 on L, × 4 reports, 0 aggregates),
so AC-7 needs no revisiting.

AC-13 AND AC-18 — THE BULK SHAPE AND ITS COUNTS
2.3 says the bulk implementation sends its three requests *at once* and folds in memory: find groups
sorted by code, find all users sorted by groupId then code, and one aggregate with `$match` on `at` and
`$group` by `userId` carrying the sum and the count. That is the exact opposite of naive's shape, so
AC-13 must quote a real concurrent dispatch, not three sequential awaits that merely look tidy. The
counts of 2.4 are `find` 2 and `aggregate` 1 per export, on both sizes, for all four reports.
`getMore` is **measured and reported, never asserted** — leave it out of the expected object rather than
setting it to 0, which `ExpectedCounts` already supports. Expect it to be non-zero on L: the find of all
1,000 users cannot fit the driver's 101-document first batch. A `getMore` of 0 on L would mean the bulk
implementation is not reading every user, so treat that as a finding and not as a clean result. Do not
predict the number; print it.
While you are there, make the runner print the whole `listed` tally for every export, not only the
counted requests. `NON_REQUEST_COMMANDS` allow-lists nine names and F17 records that only `endSessions`
was ever seen here, so an unexpected command that happens to be on that list would currently be swallowed
in silence. Printing `listed` makes it visible without changing what the check asserts.

THE FOLD, WHERE THE BYTES WILL DIFFER IF THEY DIFFER
A user with no events in the window gets 0 and 0, and every user and every group still appears; rows go
by group_code then user_code; the group reports' `users` column is the group's full membership, not the
number of users that had events. The aggregate returns nothing for an empty user, so the fold must supply
the zeros rather than skip the row. That, and integer formatting, are where a one-byte difference will
come from.

AC-20 AND AC-21 — THE TIMINGS, AND THE TRAP IN THEM
2.4's last line: timed runs use a client **without** command monitoring. The counting client and the
timing client are different clients; if you time the monitored one the numbers are not the contract's.
One warm-up per report and implementation, discarded, and you must say so in the table. `--runs` is 3 by
default for lab A. An export's time runs from the first request to the CSV bytes being complete in
memory: connecting and writing the file are outside it. Report the median and the minimum-maximum range
in whole milliseconds, the median of an even count being the mean of the middle two, with every raw run
kept in the JSON. Each table carries its machine block. Claim nothing beyond this machine and these runs —
a row asks for the measurement, and whatever it is, it is the result. If bulk is not faster on S, write
that down; it is a finding, not a failure.

AC-23 — THE RESULT FILES, WHICH DO NOT EXIST YET
`grep 'results' tools/lab-a.ts` matches nothing and `lab-a/` has no `results/`, so `pnpm lab:a` is not
yet conformant with 2.7 even though it exits 0. SCOPE.md 1.4 says every lab run writes two files, so the
writing belongs inside `pnpm lab:a`, not in a separate command. Both files are
`lab-a/results/<UTC date>-linux-x64.json` and `.md`, replacing any file of the same name; the JSON holds
the machine block and every raw value, the Markdown the machine block and the tables. The machine block's
fields are fixed by 1.4: `date`, `os` from `os.type()` and `os.release()`, `arch`, `cpu` as the model of
`os.cpus()[0]` with the count, `memoryGiB` to one decimal, `node`, `docker` (the client version, since
this lab uses Docker), and `commit`. Note what `commit` will be: `git status --porcelain` is not empty
during this run, so it must read `eb6646f+dirty`, not `eb6646f`. Write it as the contract says rather
than as it would look nicer. These two files join the change set and will be committed, so no absolute
path under a home directory may appear in them, and any path you do write is repository-relative with `/`
separators.

AC-22 AND AC-19 — THE THREE EXIT CODES AND THE COUNTING CONTROL
Exit 0 on the repository. Exit 1 from a scratch copy under `/tmp/labs-g2-…` with one golden byte changed —
in the copy, never in the repository, and afterwards show `sha256sum -c lab-a/goldens/SHA256SUMS` still
OK for all eight here. Exit 3 when 18460 is taken: open that listener yourself, from the run's own
process, and never go near a listener that is not yours; 18463-18469 are free if you need another. For
AC-19, plant an extra query in a scratch copy and show it appears in the count and fails the check; the
repository's own `bulk.ts` must then show a grep count of 0 for whatever you planted, as you did with
`aaNonce` in AC-12. Every control says in its own line that it is a control.

HOUSEKEEPING THAT ALREADY WORKS — KEEP IT
Give the Compose project and the 18460 listener their ledger rows again, as rows 1 and 2 did. Scratch
copies keep the `labs-` prefix and are removed with `rmSync(dir, { recursive: true, force: true,
maxRetries: 10 })`. One lab at a time, nothing in the background, each long command awaited with one
blocking call. `pnpm test` must stay Docker-free — keep any new MongoDB-dependent check out of
`test/**/*.test.ts`, as `tools/store-parity.ts` does. End the goal with no `labs-*` Docker object,
nothing on 18460-18469, and no `labs-*` entry in the OS temp directory, and quote those checks. The G2
checks also want `git diff --stat -- lab-a/goldens` empty and `sha256sum -c` passing: that is the row
that proves the freeze held, so run it last, after all the controls.

Append facts from F18 on for anything you measure that a decision rests on — bulk's `getMore` on both
sizes is the obvious one. F1-F15 are never edited. Cite the entry id in the row that depends on it.
When the code is done and before the final verification, write
`Build under test: <commit> + deliverables <digest>` under the G2 heading with the brief's two commands,
and make the two final runs on it; I recompute that digest. Then the tally. End every turn on a PROGRESS
line, and `PROGRESS: G2 COMPLETE` when all sixteen rows carry a verdict. BLOCKED with what is missing
still beats a rounded-up PASS.

## G2 — review #3 (2026-10-05 17:41:37)

**Verdict: REJECT** (bus context: 184818 tokens)

G2 is not accepted yet. One thing is wrong and it is not the measurement: three rows quote a result file
that no longer exists. Fix only that. Do not re-run the lab, do not re-measure, do not touch the goldens
or any source file.

THE ROOT CAUSE, SO YOU FIX THE RIGHT THING
`pnpm lab:a` rewrites `lab-a/results/2026-10-05-linux-x64.json` and `.md` on every run, and AC-24 made
you run it twice, so run 2 owns the committed files. You re-pinned the build digest after that final run
but left AC-20, AC-21 and AC-23 quoting run 1. I recounted all sixteen timing entries in the committed
JSON against their `runsMs`: every median, minimum and maximum is exact, the warm-ups are properly kept
in `warmupMs` and excluded. The artifact is good. Only the quotations are stale.

STEPS, IN ORDER
1. Read `lab-a/results/2026-10-05-linux-x64.json` and `.md` as they are on disk now. Everything you
   quote must come from those two files and nowhere else.
2. AC-23: replace the machine block with the committed one — `"date":"2026-10-05T08:32:13.248Z"` with the
   other seven fields as they stand (`os` Linux 5.4.0-216-generic, `arch` x64, the Xeon E-2146G x 12,
   `memoryGiB` 46.9, `node` v24.19.0, `commit` eb6646f+dirty, `docker` 28.1.1). Replace the raw array
   with one that is actually in the committed JSON, keeping its `warmupMs` beside it. Correct the byte
   sizes: the JSON is 15609 bytes and the Markdown 3051, not 15611 and 3055. Keep the rest of the row —
   the top-level keys, the 16/16/16 record counts, the `memoryGiB` note against F1 and the
   no-home-path check are all still true.
3. AC-20: replace the L table with the committed Markdown's L table — naive users-usage 424 range
   408–441, groups-usage 424 range 421–437, users-charge 325 range 321–325, groups-charge 327 range
   319–335; bulk users-usage 26 range 26–26, groups-usage 25 range 25–26, users-charge 7 range 6–7,
   groups-charge 6 range 6–6. The request columns do not change (naive 1041, 0, 0 and bulk 2, 1, 2).
   Quote the machine block of step 2, and keep the preamble about warm-ups, the timing definition and
   the unmonitored client, which is unchanged and correct.
4. AC-21: replace the S table with the committed one — naive users-usage 12 range 12–13, groups-usage 12
   range 12–12, users-charge 10 range 9–10, groups-charge 9 range 9–9; bulk 1 range 1–1 for all four,
   with 2, 1, 0. **Keep your resolution caveat**: every bulk median on S is still 1 ms, so it still must
   not be read as a ratio. That caveat was the right instinct and it survives the re-quote.
5. AC-24: this row is correct as written and its side-by-side medians are what let me diagnose the
   problem, so keep them. Add one clause saying which run the committed files hold — run 2 — so a reader
   knows why the other rows show run 2's numbers.
6. Leave every other row alone. AC-13 to AC-19 and AC-22 all hold and I verified the substance of each
   myself; changing them would only risk breaking something that works.
7. Recompute `git ls-files -c -o --exclude-standard -z -- . ':!goal-pack' | sort -z | xargs -0 -r
   sha256sum | sha256sum | cut -c1-12`. It must still read `896a8d224cd1`, because editing PROGRESS.md
   cannot change a digest that excludes `goal-pack/`. Say in your report that you checked and that the
   pinned line still stands, so nobody wonders whether the build moved.
8. Run `pnpm test`, `pnpm lint` and `pnpm typecheck` once more and quote them, and show
   `sha256sum -c lab-a/goldens/SHA256SUMS` still OK, so the edit is provably document-only.

COMPLETION CRITERION
Every number, date, digest and byte size quoted in AC-20, AC-21 and AC-23 appears verbatim in
`lab-a/results/2026-10-05-linux-x64.json` or `.md` as they exist at the end of the turn; the goldens
still verify; the digest still reads `896a8d224cd1`; the tally line is unchanged at 16 rows and 16 PASS,
because no verdict changes — the evidence behind three of them does.

TURN BUDGET
Two turns. This is editing three cells of a document against a file already on disk; it needs no
container, no port and no scratch copy.

THE WAY OUT IF I AM WRONG
If you find that the committed files are not run 2 after all, or that some number I listed above is not
in them, do not run the lab again to force agreement — that would just create a run 3 and the same
problem. Write `PROGRESS: G2 BLOCKED` naming the file, the row and the two values that disagree, and I
will rule on it. Evidence decides this, not my say-so: if you can show the quotations do match the
committed files, show me and I will change the verdict.

CARRY THIS INTO G3 AND G4
Lab B and lab C write result files the same way, and both goals ask for a second run. So treat the
result-file rows like the build pin: write them, or rewrite them, after the final run of the goal, and
never from an earlier one. That single habit removes this whole class of problem.

## G2 — review #4 (2026-10-05 17:47:38)

**Verdict: PASS** (bus context: 204461 tokens)

G2 is accepted. Start G3 — lab B: the Scala program, the four arms each in its own container and JVM,
the runner and its comparison with the expected outcomes, and the result files. Twelve rows, AC-25 to
AC-36, plus the four G3 checks.

READ SCOPE.md 3.1 TO 3.3 AND facts F6 AND F7 BEFORE WRITING ANY SCALA
The expected-outcome table of 3.3 is the contract. Build the program to the specification and compare
against that table; never read an expectation out of the behaviour you happen to observe.

WHAT IS ALREADY SETTLED — CITE IT, DO NOT REDO IT
- G0 read the given build files and I verified them myself: `lab-b/build.sbt` line 3
  `scalaVersion := "3.8.4"` and line 6 `fork := true`; `lab-b/project/build.properties` line 1
  `sbt.version=1.13.0`. They are given files: never edit them. AC-25 still has to show
  `git diff --stat -- lab-b/build.sbt lab-b/project` empty, which is one command.
- The sbt image is on the machine by digest (id `82a8897dcd92`), runs as root, and F6 proved it compiles
  and runs a standard-library Scala 3.8.4 program with no network at all, a first run costing about 8 s.
  Nothing is pulled, tagged or removed.
- `lab-b/` currently holds only those two given files and no `target/`. Keep it that way: the sources are
  copied inside the container precisely so that root cannot write into the repository.

THE CONTRACT POINT MOST LIKELY TO BE READ WRONG
3.3 says burst 1 of `fixed-await` and `global-noextra` is "fewer than 8 ok", not zero. How many of the
eight requests finish before the pool freezes is racy by nature and may vary from run to run, so the
runner must compare `< 8` and report the number as measured. What proves a frozen pool is the probe
timing out and bursts 2 and 3 showing 0 ok, together with `/health` still answering 200 after every
burst — the server's own cached pool is untouched by the arm's pool, and that contrast is the whole
point of the lab. If you ever find yourself asserting a specific count for burst 1, you have hardened a
race into a contract.

THE OTHER THINGS THE CONTRACT FIXES EXACTLY
- The server: `com.sun.net.httpserver.HttpServer` on 127.0.0.1 port 0 with its own cached thread pool,
  never the arm's pool. `/work?n=<int>` asks for `n * 2` and waits on the server thread at most 30 s,
  answering 200 with the number or 503; `/health` answers 200 `ok` touching no pool.
- The four services exactly as the table of 3.1 writes them, including that `global-noextra` is the same
  code as `global-await` and differs only by the three JVM options.
- The client: one JVM, its own executor, three bursts of 8, 20 and 20 released together by a latch, 5 s
  per request, one second between bursts, then one probe `GET /work` at 5 s and one `GET /health` at 2 s
  after each burst.
- The output: one `LAB-B ` line per burst and one summary line, each followed by a JSON object with
  exactly the keys of 3.1 — `arm`, `burst`, `size`, `ok`, `timedOut`, `failed`, `probe`, `health` for a
  burst and `arm`, `total`, `ok`, `timedOut`, `failed` for the summary. `ok` plus `timedOut` plus
  `failed` must equal the size, and the total is 48. Then `sys.exit(0)`, because the frozen threads
  would otherwise keep the JVM alive.
- Each arm in its own container and JVM: `docker run --rm --name labs-b-<arm> --network none -v <absolute
  lab-b>:/src:ro <sbt image by digest> bash -c 'cp -r /src /w && cd /w && sbt -Dsbt.offline=true <arm
  settings> "run <arm>"'`, 300 s per container, the `LAB-B` lines read from stdout. `global-noextra`
  passes its three `-Dscala.concurrent.context.*` options through `"set javaOptions ++= Seq(…)"` before
  `run`. The runner passes its arguments as an array, never as a shell string; the inner `bash -c` is one
  argument, which is what the contract prescribes. The `-v` path is computed at run time and is fine as
  an absolute path, but no absolute path under a home directory may end up in a result file.
- `--network none` is not optional and a network would be a red line. Lab B needs no port of
  18460-18469 at all, since the server binds port 0 inside an isolated container; run the port check
  anyway for the goal's closing row.

THE DISCIPLINE THAT COST G2 A CYCLE — APPLY IT HERE
AC-36 makes you run `pnpm lab:b` twice, and each run replaces the result files of the same name. So
write AC-35's row, or rewrite it, only after the goal's final run, and quote from the file that is on
disk at the end. Quote it in the form the file actually has: if you write the JSON pretty-printed, the
row must show the pretty-printed lines. Verify with `grep -F` against the file itself, never against a
re-serialised copy. Where a Markdown table row has to go into a PROGRESS.md cell, re-render it with
commas as you did in G2 — that is correct and F14 requires it — and say that the numbers match rather
than claiming a string match that cannot exist. Lab B has no timings, so there is no warm-up discipline
and no median or range here: AC-35 wants the machine block, a table per arm and the raw `LAB-B` lines.
The machine block still carries `docker`, and `commit` is still `eb6646f+dirty`.

CONTROLS
AC-34 is the one control: in a scratch copy under `/tmp/labs-g3-…`, flip the expected table for one arm,
run `pnpm lab:b --arm global-await`, and show it exits 1 and names the difference. Plant it in the copy
only, show a grep count of 0 for whatever you planted in the repository's own runner, and remove the
copy with `rmSync(dir, { recursive: true, force: true, maxRetries: 10 })`. `pnpm test` must gain the
`LAB-B` line parser and the comparison with the expected-outcome table including a mismatch, and must
still need neither Docker nor the network — hold to the standard `test/csv.test.ts` set, where each
control asserts the specific message rather than a non-empty result. Quote the new test count; it was 54
across 5 files on this build.

PACING AND HOUSEKEEPING
One arm at a time if a full `pnpm lab:b` gets slow: `pnpm lab:b --arm <name>` runs one, and every command
stays under ten minutes with one blocking call. The `labs-b-<arm>` containers are `--rm` and transient,
so they need no environment-ledger row — record them in the evidence cell, as my G0 ruling says — but a
container you ever create without `--rm` does need a row. End the goal with no `labs-b-*` container, no
`target/` anywhere under `lab-b/`, `git status --short lab-b` showing only the program and the results,
nothing on 18460-18469 and no `labs-*` entry in the OS temp directory, and quote those checks.

Append facts from F19 on for anything you measure that a decision rests on — how many of burst 1's eight
requests completed in each frozen arm is the obvious candidate, since it is the number the contract
deliberately leaves open. F1-F15 are never edited. When the code is done and before the final
verification, write `Build under test: <commit> + deliverables <digest>` under the G3 heading and make the
two final runs on it; I recompute that digest. Then the tally. End every turn on a PROGRESS line, and
`PROGRESS: G3 COMPLETE` when all sixteen rows carry a verdict. If an arm will not behave as 3.3 says,
do not adjust the table to fit it: report `PROGRESS: G3 BLOCKED` with the arm's `LAB-B` lines and let me
rule.

## G3 — review #5 (2026-10-05 18:11:11)

**Verdict: PASS** (bus context: 243251 tokens)

G3 is accepted. Start G4 — lab C: the generator, the two build setups, the equivalence check, the cold
production builds and the dev-server starts, and the result files. Thirteen rows: AC-37 to AC-45 plus the
four G4 checks.

FIRST, ONE LINE OF BOOKKEEPING FROM G3
Add a row to the "Incidental findings" table in PROGRESS.md for the `Observed: as expected` line that
lab B's runner writes into its result file: the finding, where it is (`tools/lab-b.ts`, the per-arm
section of the Markdown), and the note that the file already publishes every number beside it, that
fixing it would move the digest and force both final runs again, and that G5 may correct it if it touches
that runner. I have ruled it a weakness rather than a defect, so it is recorded and not fixed — but it
must be recorded, because your message to me is not part of the repository and G5 has to see it. Lab C's
runner should record observed values rather than a verdict word from the start, as you proposed.

WHAT IS ALREADY SETTLED — CITE IT, DO NOT RE-INVESTIGATE
- Both toolchains are installed and the versions are F9's exactly: webpack 5.111.1, webpack-dev-server
  6.0.0, html-webpack-plugin 5.6.8, babel-loader 10.1.1, @babel/core 8.0.6, both presets 8.0.1,
  @rsbuild/core 2.2.11, @rsbuild/plugin-react 2.1.1, react and react-dom 18.3.1. Install nothing.
- F10 sized the lab on this machine: about 5 s for one webpack build of 1,000 modules and about 0.4 s for
  Rsbuild. That is one build each and is not a measurement — it only tells you the lab is feasible. Do
  not quote it as a result or let it shape what you expect to find.
- `lab-c/app/` is already excluded everywhere: `.gitignore` line 5 ignores it (G0 confirmed with
  `git check-ignore`), `biome.json` has `!lab-c/app`, and `tsconfig.json` excludes it. The G4 check can
  cite that and show the three still hold rather than re-deriving them.
- Ports 18461 and 18462 were free at the start of the run and are assigned to the two dev servers.

THE TRAP THAT WILL BITE YOU IN THE MACHINE BLOCK
SCOPE.md 1.4 says `docker` carries the client version "when the lab uses Docker, **else omitted**". Lab A
and lab B both use Docker and both include it. **Lab C uses no Docker, so its machine block must omit the
field entirely** — not an empty string, not null, absent. `commit` is still `eb6646f+dirty` while the tree
is dirty. Both of lab C's tables carry the machine block, and AC-44 is the row where I will check the
omission.

THE MEASUREMENT DEFINITIONS, WHICH ARE EXACT IN 4.3
- Cold production build: before every build, remove that tool's output directory and
  `lab-c/app/node_modules/.cache` if it exists; quote the removal in the code, as AC-41 asks. A build's
  time is the wall time of a child process started as `process.execPath <script or CLI>`, from spawn to
  exit, and a non-zero exit fails the lab.
- Dev-server start: timed from spawn until `GET /` answers 200 with `id="root"` in the body **and** the
  first `<script src>` of that page also answers 200. Both conditions, not either. Try every 50 ms and
  give up at 120 s. Then stop the process and wait until the port is free before the next start.
- `--runs` defaults to **5** for lab C, not 3 as for lab A, so AC-41 and AC-42 each want one discarded
  warm-up and five measured runs per tool. Say the warm-up was discarded. Median and range in whole
  milliseconds, every raw run kept in the JSON, and the even-count rule still implemented and tested even
  though five runs is odd.
- Bind both dev servers to 127.0.0.1 explicitly on 18461 and 18462; do not rely on a default host, which
  may be `0.0.0.0` and would publish them beyond the loopback.

RISKS WORTH PLANNING FOR
The two tools emit different HTML, so the readiness check must locate the first `<script src>` in both
Rsbuild's page and html-webpack-plugin's. Write it to read the page it is given rather than a shape you
assume; if the page cannot be parsed exactly, fail with an error that names what was missing — do not
guess and do not fall back to "it answered 200, good enough", because that would silently weaken the
definition the row is about. Neither setup enables a persistent cache, and tuning either tool beyond 4.2
is out of scope: you are measuring two configurations, not optimising them. Remember the portability
rules — `node:path` throughout, a module imported by a path built at run time goes through
`pathToFileURL(path).href`, and any path written into a committed file is repository-relative with `/`.

THE EQUIVALENCE CHECK AND ITS CONTROL
AC-40: after the last production build of each tool, every label `m0` … `m999` must occur in the emitted
JavaScript, and the emitted HTML must contain `id="root"` and reference an emitted script; the lab fails
if either tool misses one. The control removes one label from a build's output in a scratch copy under
`/tmp/labs-g4-…` and shows the check failing **and naming the label** — naming it is part of the row, so
assert the message, not just the failure. Plant it in the copy only, show a grep count of 0 for the
marker in the repository, and remove the copy with `rmSync(dir, { recursive: true, force: true,
maxRetries: 10 })`. The generator's own tests (determinism, the labels, a missing label) belong in
`pnpm test`, which stays free of Docker and the network.

THE RESULT-FILE DISCIPLINE, FOR THE THIRD TIME
AC-45 runs `pnpm lab:c` twice and each run replaces the files of the same name, so write AC-44's row —
or rewrite it — only after the goal's final run, quote the file in the form it actually has on disk, and
verify with `grep -F` against the file itself. Where a Markdown table row must go into a PROGRESS.md
cell, re-render it with commas and say the numbers match, as you did in AC-35; that is correct and F14
requires it. AC-45 puts both runs' medians side by side and claims nothing beyond them. You have handled
this cleanly twice now; keep it.

HOUSEKEEPING AND MY RULING ON THE LEDGER
Give the Environment change ledger a row for each of 18461 and 18462 — before, change, restored — the
same treatment lab A's 18460 got. They are listeners the run opens on a shared machine, even though the
runner opens and closes them inside its own command. AC-43 then wants proof that after every start the
process is gone and the port free before the next, and that nothing listens on either port at the end;
the G4 check additionally wants `pgrep -fa` for the dev servers to print nothing. Pick a `pgrep` pattern
specific enough to match only a dev server — mine matched the worker's own prompt text this review and
told me nothing. End the goal with nothing on 18460-18469, no process of the run, no `labs-*` entry in
the OS temp directory, `lab-c/app/` still ignored by Git, Biome and tsc, and the change set limited to
the deliverables and the ledger.

Append facts from F20 on for anything a decision rests on — the readiness definition's behaviour on each
tool is the likely candidate. F1-F15 are never edited. Quote the new test count; it was 72 across 6
files on this build. When the code is done and before the final verification, write
`Build under test: <commit> + deliverables <digest>` under the G4 heading and make the two final runs on
it; I recompute that digest. Then the tally. End every turn on a PROGRESS line, and
`PROGRESS: G4 COMPLETE` when all thirteen rows carry a verdict. A timing you did not hope for is still
the result; if a tool will not build or a dev server will not come up, report
`PROGRESS: G4 BLOCKED` with the output and let me rule rather than weakening a definition to get a green.

## G4 — review #6 (2026-10-05 18:32:07)

**Verdict: PASS** (bus context: 269640 tokens)

G4 is accepted. Start G5, the last goal: README.md, the CI workflow, PUBLISHING.md, the three labs end to
end once more, and SCOPE.md rewritten as AS-BUILT. Seven rows, AC-46 to AC-52, plus the six closing
conditions.

WHAT I CHANGED WHILE REVIEWING, SO YOU ARE NOT SURPRISED
I edited `goal-pack/SCOPE.md` section 4.4 myself. Your contract-change entry was correct and complete,
but the contract's own text still carried the old literal `id="root"`, and SCOPE.md's header says the
text is updated once a change is recorded. 4.4 now reads "mounts the application on `root`" and carries a
boxed note naming the change, facts F20 and F21, and the fact that I reproduced all four `minify`
variants independently. Treat the edited 4.4 as the contract. Your AS-BUILT rewrite must carry this
change as a named difference from the frozen text — it is the run's only contract change.

THE BIGGEST TRAP IN THIS GOAL, AND IT IS NEW
AC-52 runs `pnpm lab:a`, `pnpm lab:b` and `pnpm lab:c` end to end once more. **Every one of those runs
replaces its result file**, and AC-48 requires 結果 to quote only the committed result files. So the
README's numbers are not safe until after AC-52. Order the goal this way: finish all the code and
documents, pin the build, run AC-52's three labs, and only then write or correct every number in 結果,
verifying each with `grep -F` against the file that exists at the end. If a median shifts by a
millisecond between now and then, the README must move with it. This is the fourth time this pattern has
come up and the first time it reaches a published document, so it is the one thing I will check hardest.

THE NUMBERS AS THEY STAND NOW — EXPECT THEM TO MOVE SLIGHTLY
Lab A on L: naive medians 424, 424, 325, 327 ms and bulk 26, 25, 7, 6 ms; on S naive 12, 12, 10, 9 ms and
bulk 1 ms throughout. Requests: naive `find` 1041 on L and 25 on S with no aggregates and no `getMore`;
bulk `find` 2 and `aggregate` 1 on both sizes with `getMore` 0 on S and 2 on L. Lab B: 48 ok with every
probe ok for `global-await` and `fixed-compose`, 0 ok with every probe a timeout for `fixed-await` and
`global-noextra`, `/health` 200 in all twelve bursts. Lab C with 1,000 modules: cold builds 4287 ms
webpack against 350 ms Rsbuild, dev-server starts 2474 ms against 438 ms, equivalence 1000 of 1000 labels
for both. Each table in 結果 carries its own machine block, and lab C's omits `docker` while lab A's and
lab B's carry it.

AN OFFER THAT COSTS YOU NOTHING NOW
In G3 I let `Observed: as expected` stand in lab B's result file because fixing it would have moved the
digest and forced both final runs again. In G5 that cost disappears: AC-52 re-runs lab B anyway. So if
you want to make the runner record what it observed instead of a verdict word, do it **before** you pin
the build and run AC-52, and it is free. This is optional. Either way, update incidental finding 1 — mark
it fixed, or carry it into the Handover section as an open item.

WHAT THE DOCUMENTS MUST CONTAIN
- README.md in Japanese, opening with an English summary of three to five lines, then exactly these
  seven sections in this order: `## 何を示すか`, `## 背景`, `## 設計`, `## 動かし方`, `## 結果`,
  `## 制約・既知の限界`, `## 作り方`. Prove it with `grep -n '^## '`. The last line must be exactly
  `設計・レビュー・検証：So Ryo ／ 実装：AI エージェント（Claude Code）との協働` — quote `tail -n 1`.
- 背景 links case study 07 at the URL in SCOPE.md 6 and keeps both lists of `materials/practice.md`
  section 4: what the practice did, and what this repository adds. Read that file again before writing;
  every claim about the author's practice must be traceable to it, and **no figure about the author's
  work may appear anywhere in the repository** — AC-47 wants a search for the practice's own numbers
  coming back empty. The signature line is the author's and is not a person name in the sense of the red
  lines; nothing else names an employer, product, customer, team or person.
- 制約・既知の限界 must name at least the single machine, the timing spread, the image lab B needs, and
  what CI runs smaller. Add three things only this run knows: that lab A's S medians all land on 1 ms for
  bulk and must not be read as a ratio; that lab B's burst 1 is a race whose count the contract
  deliberately leaves open at "fewer than 8", measured 0 here every time; and the 4.4 contract change,
  since a reader who checks the webpack page will find `id=root` and deserves to know why.
- 動かし方 gives one command per lab and its prerequisites. Read the Japanese back as an engineer in
  Japan would — the README is the first thing anyone sees.
- PUBLISHING.md: an English description of at most 350 characters, with its length quoted, a Japanese
  one, the topics and the pre-publication checklist. `git diff --stat -- LICENSE` must be empty.
- `.github/workflows/ci.yml` on `ubuntu-24.04` with `permissions: contents: read`, every `uses:` pinned
  to a SHA of facts F12 with its version as a comment, and no `corepack enable`. One job for
  `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and one job per lab at
  small scale: `pnpm lab:a --size S --runs 1`, `pnpm lab:b`, `pnpm lab:c --modules 200 --runs 1`. A CI
  run does not commit its results. Check it with the actionlint command of F15, by digest and offline,
  and quote the command and its output. Remember you cannot reach GitHub: take the SHAs from F12 and do
  not look anything up.

THE CLOSING CONDITIONS
Rewrite SCOPE.md as AS-BUILT with every difference from the frozen contract named and reasoned — the 4.4
change is the only one recorded, so if you find another, record it before you write it in. Give the change
list and one proposed commit message per goal, G0 to G5; the runbook already suggests wording for each
and your messages should describe what the change actually does. Then show that nothing temporary is left,
that no `labs-*` Docker object, no listener on 18460-18469 and no `labs-*` temp directory survives, that
`sha256sum -c lab-a/goldens/SHA256SUMS` still passes with AC-10's digests, and that no verdict anywhere
in PROGRESS.md is unexplained. Fill the Handover section: each item a fact, its impact and the decision
needed. The human does the leak scan and reads the README top to bottom after you, so leave it in a state
worth reading.

Append facts from F22 on for anything a decision rests on. F1-F15 are never edited. Quote the new test
count; it was 90 across 7 files with 40 controls on `b7365a62d6c4`. Pin
`Build under test: <commit> + deliverables <digest>` under the G5 heading before the final verification
and after any fix to lab B's runner, run AC-52 on that build, then write the numbers and the tally. End
every turn on a PROGRESS line, and `PROGRESS: G5 COMPLETE` when all thirteen rows carry a verdict. If a
lab fails on the final build, that is a real result: report `PROGRESS: G5 BLOCKED` with the output rather
than re-running until it passes.

## G5 — review #7 (2026-10-06 09:56:03)

**Verdict: DONE** (bus context: 305676 tokens)

All six goals are accepted: 82 rows, 82 PASS, no empty verdicts, one recorded contract change, and every
number the repository publishes recomputed from the result files it commits — G2 was rejected once for
quoting a result file its own second run had overwritten, and fixed.

What is left, all of it yours:
1. Commit. The run never commits and the branch is `main`, so branch first if you want the history
   separated; one proposed message per goal is in PROGRESS.md under "Change list and proposed commit
   messages". Check each against the change it describes.
2. Decide the two handover questions that affect the published bytes: whether to keep both dated result
   sets or prune the 10-05 one (pruning orphans the files G2, G3 and G4's ledger rows quote), and whether
   to re-run the three labs after the first commit so the result files stop reading `eb6646f+dirty`.
3. Do the two checks only you can: the leak scan, and the README top to bottom as a Japanese reader.
   Re-measure PUBLISHING.md's English description if you edit it — it is 349 of 350 characters.
4. Read BUS-REVIEWS.md against the rubber-stamp audit of runbook section 6 before the final commit; the
   G2 rejection and its re-review are the two entries worth weighing.
5. Expect to iterate on the first CI run: the workflow is actionlint-clean and SHA-pinned but has never
   executed, and its lab jobs pull images this machine never pulls.
6. Then disarm: `rm goal-pack/.relay-on goal-pack/.gate-on`, and keep PROGRESS.md, BUS-LOG.md,
   BUS-REVIEWS.md and BUS-MEMORY.md in the repository as the run's evidence.
7. The Windows re-run and the results beside the Linux ones remain out of this run's scope, as the
   runbook's section 7 says.
