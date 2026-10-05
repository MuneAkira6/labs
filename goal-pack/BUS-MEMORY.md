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

## Doubts to re-check

## The worker's habits

## Proven along the way — later goals may cite

## What the bus verified itself

## Rulings the bus made

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
