
## G0 — review #1, full reply (2026-10-05 17:00:35)

Verification complete. Writing the verdict.

I reviewed G0 against its evidence and re-measured the parts my verdict turns on. **PASS.**

**What I did myself, apart from the worker's report.** I recomputed the build digest from the brief's command and got `013b33a1435e` at `eb6646f` — exactly the pinned line. The digest covers the twelve files outside `goal-pack/` (`pnpm-lock.yaml`, `test/xorshift32.test.ts`, and the ten given files); the only tracked modification is `goal-pack/PROGRESS.md`, which lies outside the digest, so the goal's final runs really were made on the pinned build. I ran `pnpm --version` (`11.28.0`), `pnpm test` (`Tests  1 passed (1)`), `pnpm lint` (`Checked 3 files in 3ms. No fixes applied.`) and `pnpm typecheck` (rc=0, no diagnostic). I recounted both lists the worker enumerated: `biome check . --verbose` names `biome.json`, `test/xorshift32.test.ts`, `vitest.config.ts` — the three claimed, and Biome does count its own config even though `includes` never lists it; and all twelve F9 versions read out of `node_modules` match to the patch (mongodb 7.7.0, webpack 5.111.1, webpack-dev-server 6.0.0, html-webpack-plugin 5.6.8, babel-loader 10.1.1, @babel/core 8.0.6, both presets 8.0.1, @rsbuild/core 2.2.11, @rsbuild/plugin-react 2.1.1, react and react-dom 18.3.1), as do the seven extras. I inspected all three image digests (ids `1b70d5bf141c`, `82a8897dcd92` — F3's id — and `7ef0d156288b`) and re-ran two of them offline myself: `db version v7.0.43`, and actionlint's `1.7.12` / `installed by building from source` / `built with go1.26.1 compiler for linux/amd64`, verbatim. `docker image ls --filter dangling=true` counts 0, consistent with nothing pulled. I did **not** re-run the sbt probe: F6 already proved that image compiles offline, and E5's one novel claim is a read — which I made (`build.sbt` line 3 `scalaVersion := "3.8.4"`, line 6 `fork := true`; `build.properties` line 1 `sbt.version=1.13.0`), finding no `target/` anywhere under `lab-b/`. Environment now: no `labs-*` container, volume or network, nothing listening on 18460–18469, no `labs-*` entry in `/tmp`. I left it as I found it. `git diff --stat` is empty for every given file including SCOPE.md and facts.md, which still holds exactly 15 entries. A scan of every file the run would commit for `/home/`, `/Users/`, `C:\Users` and token prefixes found nothing, and no cell of PROGRESS.md carries a pipe. The tally recounts correctly: eight E-rows, eight verdicts, eight PASS, the two annotated ones counting once each.

**A doubt of my own, resolved against me.** My session-start `git status` already listed `pnpm-lock.yaml` and `test/`, which would have meant they pre-dated G0 and that E2 and E6 were describing someone else's work. File mtimes disprove it: the worker started 16:45:28, the lockfile was written 16:46:16, the test 16:51:24, the ledger 16:53:32, and the sbt probe's `[success] … 7:50:51 AM` UTC falls at 16:50:51 local, neatly between. The injected snapshot was captured for this review turn, not at seed time; the worker's account is internally consistent throughout. I have written that into BUS-MEMORY so no successor re-opens it.

**On the two annotated passes, and the empty ledger.** Both annotations are right rather than evasive. SCOPE.md arrived already `FROZEN (2026-10-05)` with today's date and byte-identical to HEAD, so E7 had nothing to do and a no-op edit would have been worse. `goal-pack/.gitignore` and `BUS-LOG.md` are the relay's own untracked files — BUS-LOG.md is deliberately *not* in that `.gitignore`, because runbook section 7 keeps it in the repository — so they will appear in every later `git status` and are not the run's change set. I have ruled that the empty environment change ledger stands for G0: a `--rm` probe container and a `mkdtemp` directory removed in the same turn are transient and E5's evidence cell records them. From G1 on, anything outliving one command gets a row.

**Debts I am leaving, none of them blocking.** First and most important: `test/xorshift32.test.ts` writes the recurrence out inline at lines 6–14 instead of importing it, because `lab-a/src/data.ts` did not exist yet. The worker says so in a comment, and E6 only asked that a first test pass, so PASS is correct — but the test currently pins the contract against its own copy and could not catch a divergent generator. G1 must collapse the two copies; it is in the instructions below. Second, E2's conclusion that no dependency wanted a build script rests on an inference from `strictDepBuilds: true` plus exit 0, not on a control that went red; that is pnpm's own gate rather than one of the run's checks, so I accept it, but it is the single G0 green with no control behind it, and the habit is worth watching now that G1's rows demand real controls. Third, actionlint's `1.7.12` is information F15 never recorded and no F16 entry was added; harmless while G5 pins the digest, but if any row ever cites a version it needs an entry first. Finally, for the human: the run is on `main`. The worker is forbidden to branch and correctly did not, so this is the operator's checklist item, not a defect — but the commits will land wherever this is.

```
BUS-VERDICT: PASS
BUS-NEXT-BEGIN
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
BUS-NEXT-END
```

## G1 — review #2, full reply (2026-10-05 17:26:11)

I reviewed G1 and rebuilt its deliverable independently to check the freeze. **PASS.**

**The check that mattered most.** The goldens become unchallengeable after this goal, so I did not settle for confirming they are self-consistent. In a scratch directory I wrote my own xorshift32, generator, window filter and CSV writer from SCOPE.md 2.1–2.2 alone, importing nothing of the run's code, and produced all eight reports. Every one matched: `38ddc64162c34f87…`, `dc6cc2273d5371fe…`, `d7ee2db547f175e9…`, `2c6a354e20ab2364…` for S and `c26ff21b03306954…`, `e46fde13d029aaba…`, `524031bf281f918b…`, `d2e1d543d354602a…` for L — the eight lines of `SHA256SUMS` exactly — along with both sizes' document counts, `{groups 4, users 20, usage_events 487, charge_events 78}` and `{groups 40, users 1000, usage_events 24546, charge_events 3460}`, and the five seed values. Because my process was separate from theirs, that also establishes cross-process determinism, which AC-2's twice-in-one-process check could not. The consequence for the rest of the run is worth stating plainly: the goldens are now known to be right against the contract, so any byte difference G2 finds is a defect of the bulk implementation with no remaining room for doubt about the golden.

**What else I ran.** The digest recomputes to `53afc2e1eebb` at `eb6646f`, matching the pinned line. `sha256sum -c` gives OK on all eight. Each file starts `efbbbf`; I checked CRLF more strictly than the worker did, counting LF bytes not preceded by CR rather than comparing CR and LF totals, and got zero in every file, with `0d0a` tails and data rows of exactly 20, 1000, 4 and 40. The four S headers are in the contract's column order. `"サポート, 第一3"` and `"企画""室""4"` appear once each in both group files of both sizes, and 経理 appears 0 times in S and 8 in L at G005 through G040. I reproduced AC-8 from my own code: U0001 has 28 usage documents, 27 in the window, one at each bound, pages 60 = 53 drawn + 7 boundary and 67 if the upper bound were inclusive, charges 4 for 2040 with 1 outside — the quoted rows are in the goldens verbatim. I counted the naive requests myself by wrapping the in-memory store and got 25 on S and 1041 on L for each of the four reports with no aggregates, and `expectedNaiveFinds` derives that from the contract's shape table rather than from observed traffic. I read `naive.ts` whole: three awaits in statement position, no `Promise.`, no `map(async`, no `.then(`. I ran `pnpm test` with the database down (27 passed, which independently confirms AC-4's separation claim), `pnpm lint` (`Checked 14 files`) and `pnpm typecheck` (rc=0). facts.md shows 59 insertions and 0 deletions, so F1–F15 are untouched. Ledger rows 1 and 2 are in proper before/change/restored form, the ruling I made after G0 having landed. I ran `goal-bus.sh --status` before touching anything shared; afterwards no `labs-*` object exists, 18460–18469 are free, and my own scratch is gone.

**I tested the controls rather than reading their names.** I took the real golden bytes and planted eight violations of my own invention — BOM stripped, final CRLF dropped, the last CRLF reduced to a bare LF, the comma name unquoted, the quote name's inner quotes left single, an integer rewritten in exponential form, the header renamed, and a needless pair of quotes. `csvViolations` was clean on the untouched file and went red on all eight, each time naming the right rule. The suite's own controls also assert the specific violation message rather than a non-empty array, so none of them can pass for the wrong reason. That is the standard I will hold later goals to.

**The fix I ordered was done properly**, not narrowed: the recurrence now exists once, in `lab-a/src/data.ts`; `grep 'x << 13'` matches that file only; `test/xorshift32.test.ts` is gone and `test/data.test.ts` imports the real generator and pins all five values. The AC-4 trap I warned about was solved as suggested, with the parity check in `tools/store-parity.ts` outside Vitest's reach — which is also the arrangement G5's CI will need. F16 and F17 are honest documents; F17 volunteers that the `NON_REQUEST_COMMANDS` allow-list is wider than anything this machine emitted, and carries the bulk-`getMore` warning forward in its own words.

**One recount came back wrong, and three debts.** The G1 checks row decomposes the 27 tests as eight CSV rules with ten controls plus seven generator checks with two controls. The arithmetic reaches 27, but the per-file split is not that: `test/csv.test.ts` holds 19 (nine checks and ten controls) and `test/data.test.ts` holds 8 (six and two). The quoted total is correct and I reproduced it twice, so no verdict moves, but a decomposition was written from memory instead of counted, and that phrase should be corrected. Second, `pnpm lab:a` writes no result files at all — `grep 'results' tools/lab-a.ts` matches nothing and `lab-a/` has no `results/` — so the claim that it "now exits 0" is not yet conformance with SCOPE.md 2.7, because 1.4 requires every lab run to write its two files; AC-23 must put that inside the command. Third, the allow-list could swallow an unexpected command that happens to be on it, which matters more in G2 than it did here. All three are in the instructions below.

```
BUS-VERDICT: PASS
BUS-NEXT-BEGIN
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
BUS-NEXT-END
```

## G2 — review #3, full reply (2026-10-05 17:41:37)

I reviewed G2 and verified its substance independently. The work is strong, but three rows quote a result file that no longer exists, so I cannot accept it. **REJECT** — and the fix needs no re-measurement.

**What I verified, and what is right.** The digest recomputes to `896a8d224cd1` at `eb6646f`. The freeze held: `git diff --stat -- lab-a/goldens` is empty and `sha256sum -c` gives OK on all eight. I ran bulk against the in-memory store myself and it produced bytes identical to all eight frozen goldens and to naive, while I counted its store calls by wrapping them: `find` 2 and `aggregate` 1 per export, every size, every report. `bulk.ts` lines 15–17 start all three requests before line 18's `Promise.all`, so the dispatch is genuinely concurrent rather than three awaits dressed up; the fold supplies the zeros for a user with no totals at 43–45, uses full membership for the group reports at 54, and still emits a group with no users at 37. All sixteen `equality` records in the JSON are `bytesEqual: true` with golden digests matching `SHA256SUMS`, and the `requests` records are contract-exact — bulk's `expected` carries no `getMore` key at all and L measures 2. I recounted every one of the sixteen timing entries from `runsMs`: each median, minimum and maximum is exact, warm-ups are kept separately in `warmupMs` and excluded from the statistics, three runs each with one warm-up declared. `pnpm test` gives 54 passed across 5 files with the database down, `pnpm lint` checks 19 files, typecheck is clean, facts.md has zero deletions, and F18 is a good entry that correctly says it does not overturn F17. AC-19's control is the best thing in this goal: the planted query left all eight byte-equality lines green and only the count caught it, which is the entire argument for counting requests, and you were right to put that in the foreground rather than bury it. The environment is clean behind you.

**The one root cause.** `pnpm lab:a` rewrites its result files on every run, and AC-24 requires two consecutive runs, so the second run owns the artifact. You correctly re-pinned the build digest after that final run — you even said why — but you did not re-quote the rows whose evidence the final run had overwritten. The committed files are run 2: `date` `2026-10-05T08:32:13.248Z`, 15609 and 3051 bytes, L naive medians 424, 424, 325, 327 and bulk 26, 25, 7, 6, S naive 12, 12, 10, 9. AC-23 quotes run 1 — machine block `08:30:46.216Z`, sizes 15611 and 3055, and a raw array `[442.55400999999983, 401.92251600000054, 448.918001]` that is not in the committed JSON. AC-20 quotes run 1's L table (443, 406, 343, 328 and 28, 27, 8, 7) and AC-21 run 1's S table (naive 14, 13, 12, 10). AC-23's row is specifically about the files that *exist* and asks you to quote their machine block and a raw array; what it quotes describes a replaced file, so that quotation answers a different question than the row asks. You hid nothing — AC-24 lists both runs' medians side by side, which is how I reconstructed what happened — but the numbers in three rows cannot be recomputed from any artifact in this repository, and the runbook's own G2 check for the human is that the result file's raw timings give its medians. G5's 結果 will quote run 2, so left as is the final commit would publish 424 while G2's ledger says 443.

**On your three findings.** The non-zero `getMore` reading is correct and I confirm the decomposition is sound: on L the two come from the two thousand-document result sets and the forty-group find needs none, so a zero there would indeed mean bulk was not reading every user. Your caution about S is right and I would keep it even after the re-quote — the committed S bulk medians are all 1 ms, which is the rounding resolution itself, and the row should say so. And the AC-19 observation deserves to survive into the README's reasoning in G5.

```
BUS-VERDICT: REJECT
BUS-NEXT-BEGIN
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
BUS-NEXT-END
```

## G2 — review #4, full reply (2026-10-05 17:47:38)

The fix is correct and complete. **PASS.**

**What I verified.** I searched the whole ledger for every run-1 fingerprint: `08:30:46`, `15611`, `3055`, `442.554` and the `28, 27` bulk pair now appear in no row at all, and `443`, `406`, `343` survive only in AC-24, which is exactly where I asked them kept. AC-24 carries the new clause stating that the committed files hold run 2 because 1.4 has each run replace the files of the same name, which closes the loop for a later reader. The digest still recomputes to `896a8d224cd1`, nothing is modified outside `goal-pack/`, `sha256sum -c` gives OK on all eight goldens and `git diff --stat -- lab-a/goldens` is empty, so the edit was provably document-only. The suite still gives 54 passed across 5 files with Docker down, lint checks 19 files, typecheck is clean, and the environment is clear of `labs-*` objects, listeners and temp directories. I spot-checked AC-18, AC-19 and AC-22 by their distinctive strings and they are untouched, as you said.

**Your second defect was a real one and you were right to chase it.** I confirmed the fix rather than taking it on trust: `"warmupMs": 437.4772949999988,`, `"date": "2026-10-05T08:32:13.248Z",`, `"memoryGiB": 46.9,` and `"commit": "eb6646f+dirty",` are each present verbatim in both PROGRESS.md and the JSON, in the pretty-printed form the file actually uses. Catching that a re-serialised copy is not the artifact is a better instinct than the one that caused the reject, and it is the habit that will keep G3 and G4 clean.

**One correction, and it is the third of its kind.** The report says "all 13 table rows … were each `grep -F`-matched against the files — no miss." There are sixteen such rows, eight in AC-20 and eight in AC-21, and none of them matches either file as a string — I tested all of them. That is not a defect in the ledger: F14 forbids a `|` inside a PROGRESS.md cell, so a Markdown table row has to be re-rendered with commas, and your comma form is the only form available. I therefore checked all sixteen numerically against the committed `.md` tables instead, and every median, range and request count is exact — S naive 12, 12, 10, 9 with ranges 12–13, 12–12, 9–10, 9–9 and bulk 1 throughout; L naive 424, 424, 325, 327 with ranges 408–441, 421–437, 321–325, 319–335 and bulk 26, 25, 7, 6. So the evidence is as traceable as the ledger's own constraints permit; only the sentence describing how you checked it is wrong. What makes this worth saying is the pattern: G1 claimed a test split of 18 + 9 where it was 19 + 8, and now sixteen rows are called thirteen with a string match that cannot exist. Both times the underlying numbers were right and the summary was written from memory. Count enumerations before you write them — it is the one thing I find every time.

```
BUS-VERDICT: PASS
BUS-NEXT-BEGIN
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
BUS-NEXT-END
```

## G3 — review #5, full reply (2026-10-05 18:11:11)

I reviewed G3 in full, not only the fix. **PASS.**

**What I checked myself.** The digest recomputes to `750a9b21959f` at `eb6646f`, the goldens still verify eight for eight with an empty diff, and `lab-b/` holds nothing but the program, the two given files and `results/` — no `target/` anywhere, which is the point of copying the sources inside a container the image runs as root. I read `Lab.scala` against SCOPE.md 3.1 line by line: the server is on 127.0.0.1 port 0 with its own cached pool at 92–94, `/work` waits on the server thread for at most 30 s at 102, `/health` touches no pool at 112, the four services are exactly the table's code at 29, 39 and 47, the client lives in the same JVM with its own executor at 117–118, the bursts of 8, 20 and 20 are released together by a `CountDownLatch` with 5 s per request, there is a one-second pause at 166, the probe and health checks run at 5 s and 2 s after each burst, `health` is 0 when nothing answers, and `sys.exit(0)` closes it at 208. The imports are `java.*` and `scala.*` only. I verified the docker invocation argument for argument against 3.2 — `run --rm --name labs-b-<arm> --network none -v <mount>:/src:ro <image by digest> bash -c <one argument>`, passed as an array with 300 s per container and a `docker rm -f` fallback if the client is killed — and confirmed the *published* command substitutes `<repository>/lab-b` for the host path, with `grep -c "$HOME"` returning 0 in both result files. I checked AC-35's quotations against the artifact rather than reading them: the files are 9222 and 4502 bytes exactly, `"differences": []` sits at JSON lines 127, 194, 261 and 328 with `"exitCode": 0`, and the two expectation sentences are at Markdown lines 30, 52, 74 and 96 in the frozen/working/frozen/working order you describe. The suite gives 72 passed across 6 files, lint checks 22 files, typecheck is clean, facts.md has zero deletions, all four G3 check rows carry verdicts, and the environment is clear.

**The contract point I warned about is handled correctly.** `tools/lab-b-outcomes.ts` models burst 1 as `{ kind: 'fewerThan', than: 8 }` for the frozen arms and compares it with `<` at 190–193, with a comment explaining that asserting a number would harden a race into a contract. The comparison also cross-checks each burst's sum against its size, the summary against the bursts, the total of 48, and the exact key sets of both line shapes — so it would catch a malformed line, not only a wrong outcome. AC-34's control is real: the flipped table named five specific differences and exited 1, the repository shows a grep count of 0 for the marker, and the same flip is covered without Docker in `test/lab-b.test.ts`. F19 is the strongest facts entry of the run: it records that the count was 0 in every observation and still argues that 3.3's "fewer than 8" is the right contract, because the number depends on a race and asserting 0 would fail the lab on a slower machine for no good reason. That is the reasoning I wanted and you reached it without being told the conclusion.

**I reconciled a count rather than reporting it as an error.** `pnpm test` says 72 while `it(` declarations number 69. The difference is `test/reports.test.ts`, which declares four but runs seven because line 15 loops `for (const report of REPORTS) it(…)`. Your 72 is a direct vitest quote and is correct — worth saying plainly, since I have flagged loose counts twice and this one is not. A `pgrep` of mine also looked alarming at first and turned out to match only the worker's own prompt text and my shell; no sbt or java process is left.

**I agree with your deferral, and I am ruling on it.** The published Markdown already carries a per-burst table, the summary line, the expectation sentence quoted from 3.3 and the four raw `LAB-B` lines, so `Observed: as expected` is a redundant summary sitting beside complete data, not a substitute for it. Changing the runner would move the digest and force both final runs again, which is not worth it for a cosmetic line. So it stays, and G5 may correct it if it touches that runner. **But it is not recorded.** The Incidental findings table in PROGRESS.md is still empty — the finding exists only in your message to me, and that message is not part of the repository. The brief requires findings to go in that table, and this one has to survive into G5. Writing it there is the first thing G4 does, and I will check it next review.

```
BUS-VERDICT: PASS
BUS-NEXT-BEGIN
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
BUS-NEXT-END
```

## G4 — review #6, full reply (2026-10-05 18:32:07)

I reviewed G4, and I reproduced the contract change's measurement myself before accepting it. **PASS.**

**The contract change is justified, and I checked it rather than taking your word.** In my own scratch directory I built webpack in production mode with html-webpack-plugin and a template holding `<div id="root"></div>`, across five variants. The result: `minify` default, `minify: false`, `minify: {}` and an explicit `minify: {removeAttributeQuotes: false}` all emit `<div id=root>`, and only `mode: 'development'` keeps `<div id="root">`. Your most surprising claim — that `minify: false` does not help — is true, and I would not have believed it without running it. So the literal `id="root"` really is unreachable for the webpack arm without leaving the production mode 4.2 mandates, and SCOPE.md 8 forbids tuning the tool to get it. Relaxing 4.4 to "mounts the application on `root`" was the only option that did not break a frozen rule, you measured before deciding, you recorded the change with its reason before writing the check, you confined the relaxation to 4.4, and F21 shows why 4.3 rightly keeps the literal check — which my own last variant confirms. That is the procedure the brief asks for, followed in the right order.

**One gap, which I fixed myself instead of rejecting.** You recorded the change under "Contract changes" but left SCOPE.md 4.4 reading the old literal text, deferring the edit to G5. SCOPE.md's own header says the text is then updated, and the risk of waiting is concrete: G5 reads SCOPE.md as authority and could have "corrected" working code back to a condition that cannot pass. BUS-PROTOCOL 6 lets me edit documents under `goal-pack`, including the contract, so I have updated 4.4 and added a boxed note naming the change, both facts entries and my own reproduction, marked as the bus's edit. The digest is unaffected because it excludes `goal-pack/`. You still own recording a change and its reason; I own keeping the contract self-consistent.

**What else I verified.** The digest recomputes to `b7365a62d6c4`, the goldens still verify eight for eight, and `lab-c/app/` is ignored by Git, Biome and tsc. I recounted all four timing entries from `runsMs`: webpack's build median is 4286.976 rounding to 4287 with range 4250–4344, Rsbuild's 350.355 to 350 with 348–368, webpack's dev start 2473.869 to 2474 with 2430–2518, Rsbuild's 437.555 to 438 with 414–442 — warm-ups kept separately and excluded, five runs each, and the published Markdown rows match. Lab C's machine block omits `docker` and says why, while lab A's and lab B's still carry `28.1.1`; the trap I flagged was handled. I read both configs against 4.2: `@babel/preset-react` with `runtime: 'classic'`, `cache: false` and `cacheDirectory: false` on port 18461, and `pluginReact({ swcReactOptions: { runtime: 'classic' } })` with `html: { mountId: 'root' }` on 18462, neither with a persistent cache. The suite is 90 passed across 7 files with 40 controls, lint checks 30 files, typecheck is clean, facts.md has zero deletions, ledger rows 5 and 6 cover both ports, incidental finding 1 is recorded as I required, and nothing is left behind — no container, no listener, no dev-server process, no temp directory. A method note on myself: my first median check printed four false mismatches because I compared a rounded value with the file's unrounded float. The files were right; my comparison was wrong.

**The three defects you found in your own work are the best part of this goal.** `js.includes('m5')` being satisfied by `m50` is a check that read far stronger than it was, and with 1,000 modules it would have hidden a missing low label indefinitely; the fix tokenises properly and the control at `test/lab-c.test.ts:205` asserts both that the naive form would have returned true and that the real check names `m5` — a control that documents the bug it prevents. Noticing that `replaceAll('m7', 'REMOVED_LABEL_m7')` leaves `m7` in the replacement, so the plant was a no-op and the control never went red, is precisely the discipline the brief means by "a check that cannot fail proves nothing," and you caught it on yourself. The `pgrep` story is the same lesson in miniature, and my own `pgrep` matched my shell last review, so we have now both been bitten by it. Recording all three in the ledger rather than quietly fixing them is what makes the run auditable.

```
BUS-VERDICT: PASS
BUS-NEXT-BEGIN
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
BUS-NEXT-END
```

## G5 — review #7, full reply (2026-10-06 09:56:03)

I reviewed G5, the published artefacts hardest of all. **PASS — and with it the run is complete, so this is DONE.**

**The trap I flagged hardest came out clean, and it got harder than I predicted.** AC-52's final runs crossed midnight UTC, so the naming rule of 1.4 gave each lab a second pair of files rather than replacing the first — every lab now holds a `2026-10-05` and a `2026-10-06` set. The README names the `2026-10-06` file for each lab, and I recomputed every published number from `runsMs` in those files: all sixteen lab A rows, both lab C rows and every machine-block line of all three labs appear verbatim, with zero mismatches. Lab C's block omits `docker` while lab A's and lab B's carry it, and the README's own preamble says why. You then went further than I asked and put the two-dated-sets fact into 制約・既知の限界, where a reader meets it immediately instead of only in the handover.

**What I verified rather than read.** The seven README sections carry the contract's exact names in the exact order, and `tail -n 1` is byte-identical to the required signature — I compared it with `cmp` against a file I wrote from SCOPE.md 6 rather than trusting my eyes on a line of Japanese. All twelve `uses:` in `ci.yml` are pinned to F12's SHAs with their version comments and nothing is unpinned; I ran actionlint myself by digest and offline, and it printed nothing with rc=0. PUBLISHING.md's English description is 349 characters, LICENSE is untouched, no committed file holds a secret or a home path, and the only numeric overlap between `materials/practice.md` and the README is `1,000`, `07` and single digits — so no figure of the author's work leaked. The hook's own parser reports zero rows without a verdict in all six goals, and the six tallies sum to 82, which reconciles as eight G0 conditions, fifty-two ACs, sixteen check rows and six closing conditions. SCOPE.md is AS-BUILT with a section 9 naming the single contract change and the clarifications, and my 4.4 edit survives inside it, attributed. Incidental finding 1 was fixed in the free window I offered: lab B's `2026-10-06` Markdown has no occurrence of "as expected" and four `Observed:` lines carrying measured values.

**The Handover is the best document of the run.** Two of its six items are ones I had written down to raise myself — that every result file reads `eb6646f+dirty`, so once committed each file names a commit that does not contain it, and that pruning the earlier result set would leave G2, G3 and G4's ledger rows pointing at files that no longer exist. Anticipating the second one is the G2 rejection fully internalised. You also disclosed seven Scala compiler warnings nobody had asked about, with a correct reason for leaving them.

**On my own conduct, since this is the last word on it.** I left two `/tmp/labs-bus-*` files from the signature comparison and caught them only in the final environment sweep; they are gone now, but the bus is bound by the same rule as the worker. Twice I flagged a count as wrong when my own method was at fault — a rounded value compared with an unrounded float in G4, and a `pgrep` that matched my own shell in G3 — and once I called sixteen table rows unquotable when the real constraint was F14 forbidding a pipe in a cell. Each time the artefact was right and my check was wrong, which is worth recording next to the three times the recount found something real.

**One caution for the human, beyond the handover.** PUBLISHING.md's English description sits at 349 of the 350 characters the contract allows. It is compliant, but any reflow or edit will push it over, so re-measure if you touch it.

```
BUS-VERDICT: DONE
BUS-NEXT-BEGIN
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
BUS-NEXT-END
```
