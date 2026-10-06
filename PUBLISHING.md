# PUBLISHING — labs

Everything a reader needs before this repository is made public.

## Description (English, for the repository's About field)

> Three experiments rebuilt from practice and run for real: a CSV report reading MongoDB one user at
> a time, rewritten to read in bulk and proved byte-identical with its requests counted; a pool of
> three threads that freezes under blocking await, beside three that do not; and one React app built
> with webpack + Babel and with Rsbuild, measured alike.

## Description (Japanese)

> 実務から作り直して実際に動かした三つの小さな実験。利用者ごとに 1 回ずつ MongoDB を読むレポートを
> 一括読み出しに書き換え、出力がバイト単位で同一であることと要求回数の減少を示す。3 スレッドの専用
> プールがブロッキング待機で停止する様子を、停止しない三つの対照と並べる。同じ React アプリを
> webpack + Babel と Rsbuild で建て、同じ条件で計測する。

## Topics

`mongodb`, `nodejs`, `typescript`, `scala`, `webpack`, `rsbuild`, `docker`, `performance`,
`reproducibility`, `golden-files`

## Checklist before publishing

- [ ] `pnpm install --frozen-lockfile`, then `pnpm lint`, `pnpm typecheck` and `pnpm test` all pass.
- [ ] The three labs run end to end: `pnpm lab:a`, `pnpm lab:b`, `pnpm lab:c`, each exiting 0.
- [ ] `sha256sum -c lab-a/goldens/SHA256SUMS` passes; the goldens are unchanged since they were
      captured.
- [ ] Every number in the README's 結果 appears in a committed file under `lab-a/results/`,
      `lab-b/results/` or `lab-c/results/`, and each table carries its machine block.
- [ ] No employer, product, customer, team or person name anywhere, and no ticket number. The
      signature line of the README is the author's own and stays.
- [ ] No figure from the author's practice anywhere; 背景 points to case study 07 for those.
- [ ] No secret, token or credential in any file, and no absolute path under a home directory in a
      committed file.
- [ ] `lab-c/app/` is not committed: `git status --short` shows it nowhere, and `.gitignore` covers it.
- [ ] No `lab-b/target/` and no `node_modules/` is committed.
- [ ] `.github/workflows/ci.yml` pins every `uses:` to a commit SHA with its version as a comment, and
      `permissions: contents: read` is set.
- [ ] `LICENSE` is unchanged.
- [ ] The results were re-run on a second machine if one is available, and the README says which
      machine each table came from.
