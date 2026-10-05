You are the worker for labs. First read goal-pack/goal-brief.md completely, then goal-pack/SCOPE.md,
goal-pack/facts.md, goal-pack/materials/practice.md and goal-pack/PROGRESS.md.

This goal is G0: the toolchain, the images and the ports re-measured, the given files read, and the
contract frozen. Work inside this repository and the OS temp directory only.

1. Record in the Environment table of PROGRESS.md, each with its command and output: `node --version`,
   `pnpm --version` (in the repository root, so packageManager decides), `docker --version` and
   `docker compose version --short`. Compare them with facts F2.
2. Run `pnpm install` without changing pnpm-workspace.yaml. Record the result, how long it took and the
   installed versions of the toolchains (compare with F9).
3. Inspect the three images of SCOPE.md section 1 by digest with `docker image inspect`, and run each
   once with `--network none`: `mongod --version` for MongoDB, `java -version` for the sbt image, and
   `-version` for actionlint. Quote the lines (F3, F15).
4. Run the port check of fact F4, and list Docker containers, volumes and networks whose names start
   with `labs-` (expected: none). Quote both.
5. Quote the given `lab-b/build.sbt` and `lab-b/project/build.properties`. Then, from a scratch copy in
   the OS temp directory, compile and run a standard-library hello world in the sbt image as F6 does,
   but with the sources copied inside the container (`-v <scratch>:/src:ro` and
   `cp -r /src /w && cd /w && sbt -Dsbt.offline=true run`), in a container named `labs-g0-probe` with
   `--rm` and `--network none`. Quote its output and its time; remove the scratch copy.
6. Write a first Vitest test in `test/` (for example, xorshift32's first value for the seed of SCOPE.md
   2.1), and run `pnpm test`, `pnpm lint` and `pnpm typecheck`; quote their last lines, including
   Biome's file count.
7. Mark SCOPE.md as FROZEN with today's date, changing nothing else in it.
8. Quote `git status --short`.

Judge every G0 row in PROGRESS.md with the output you quote. End every turn on a progress line such as
`PROGRESS: G0 ac_done=2/8 pass=2 fail=0 blocked=0 deferred=0`, and when every G0 row has a verdict and
the tally line is written, end with `PROGRESS: G0 COMPLETE`.
