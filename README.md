# labs

Three small experiments, rebuilt from the author's practice and actually run on one machine. CSV
reports that read MongoDB one group and one user at a time are rewritten to read in bulk, and the two
are proved byte-identical against frozen goldens while their requests are counted. A pool of three
threads is made to freeze under blocking await, beside three pools that do not. One synthetic React
app of 1,000 modules is built with webpack + Babel and with Rsbuild. Every number below is measured.

## 何を示すか

- **Lab A — レポートの N+1。** 4 種類の CSV レポートを、グループごと・利用者ごとに 1 回ずつ読む素朴な
  実装と、3 つの要求にまとめる一括実装の両方で出力します。両者の出力が**バイト単位で同一**であること
  を、最初に 1 度だけ採取して凍結した金型と照合して示し、1 回の出力あたりのデータベース要求回数を
  名前別に数えます。
- **Lab B — ブロッキング待機。** 3 スレッドの専用プールの上で、ある処理が同じプールで動く処理の完了を
  無期限に待つと何が起きるかを、4 つの対照で並べて示します。凍ったプールの隣で、プールに触れない
  `/health` が 200 を返し続けることも同時に示します。
- **Lab C — ビルドの移行。** 同じ 1,000 モジュールの React アプリを webpack + Babel と Rsbuild で
  建て、冷えた本番ビルドと開発サーバーの起動を同じ定義で計測します。出力が等価であること（全ラベルの
  存在、マウント先、スクリプト参照）も毎回確かめます。

機械に依存しない量（要求回数、成否、ラベルの一致）と、機械に依存する量（時間）は分けて示します。

## 背景

この 3 つは、筆者が実務で扱った小さな成果を、公開できる形に作り直したものです。実務そのものの数値は
ここには書きません。数値は事例集の
[事例 07](https://github.com/MuneAkira6/engineering-case-studies/blob/main/07-other-work.md)
にだけあり、この README はそこを指すだけにとどめます。

実務で実施した点と、このリポジトリで追加した点は次のとおりです。

| | 実務で実施した点 | このリポジトリで追加した点 |
|---|---|---|
| A | 一括読み出しへの書き換え、金型による証明（A/A、生バイト比較、凍結）、要求回数の計測 | 合成データ（固定の乱数種）、4 種類のレポートの素朴版と一括版の並置、要求回数の名前別の内訳、規模を変えた計測 |
| B | 原因の特定、Future の合成への書き換え、バーストによる確認、ForkJoin の補償による反証 | 4 つの対照（固定プール＋待機、共有プール＋待機、補償なしの共有プール＋待機、固定プール＋合成）を同じ条件で並べること、別の口が応答し続けることの確認 |
| C | 移行そのもの、移行後の 1 回の計測 | 合成した 1,000 モジュールのアプリ、同じ条件での前後の計測（冷えた本番ビルドと開発サーバーの起動）、繰り返しと中央値 |

## 設計

- **Lab A。** 決定論的な生成器（xorshift32、固定の種 20261005）が 4 つのコレクションを 2 つの規模
  — S は 4 グループ 20 名、L は 40 グループ 1,000 名 — で書きます。素朴実装と一括実装は同じ小さな
  ストア抽象の上に載り、テストはメモリ実装、ラボは MongoDB 実装を使います。CSV は BOM つき UTF-8、
  全行 CRLF 終端、カンマ・引用符・改行を含む欄だけを引用符で囲む、という規則をバイト単位で守ります。
  要求回数は、1 回の出力だけを担当する専用クライアントの `commandStarted` を名前別に数えます。
- **Lab B。** `Lab.scala` は標準ライブラリと JDK だけで書かれ、`com.sun.net.httpserver` のサーバー、
  アーム固有のサービス、同じ JVM 内のクライアントを持ちます。アームごとに**別のコンテナと別の JVM**
  で走ります。凍ったプールは二度と回復しないためです。
- **Lab C。** 生成器が 1,000 個の `.tsx` コンポーネントと、それらを順に描画するエントリを書きます。
  webpack は Node API 経由（CLI なし）、Rsbuild は同梱 CLI 経由で、どちらも永続キャッシュなしです。

## 動かし方

前提は Node 24 以上と pnpm（`packageManager` が選びます）です。Lab A と Lab B は Docker を使い、
Lab C は使いません。Lab A は 127.0.0.1:18460、Lab C は 18461 と 18462 を使います。

```bash
pnpm install

pnpm lab:a                      # Lab A：Compose で MongoDB を起こし、両実装を金型と照合し、計測する
pnpm lab:b                      # Lab B：4 つのアームをそれぞれ自分のコンテナと JVM で走らせる
pnpm lab:c                      # Lab C：1,000 モジュールを生成し、2 つのビルドを計測する

pnpm test && pnpm lint && pnpm typecheck
```

`pnpm lab:a --size S --runs 1`、`pnpm lab:b --arm global-await`、`pnpm lab:c --modules 200 --runs 1`
のように小さく動かせます。`pnpm test` は Docker もネットワークも必要としません。金型は
`pnpm lab:a:golden` が 1 度だけ採取したもので、既に存在する場合は終了コード 2 で拒否します。

## 結果

以下はすべて、このリポジトリが commit した結果ファイルの数値です。各表に、その計測の機械ブロックを
添えます。Lab C は Docker を使わないため、その機械ブロックには `docker` の行がありません。

### Lab A — レポートの N+1（`lab-a/results/2026-10-06-linux-x64.md`）

- date: 2026-10-06T00:38:25.011Z
- os: Linux 5.4.0-216-generic
- arch: x64
- cpu: Intel(R) Xeon(R) E-2146G CPU @ 3.50GHz x 12
- memoryGiB: 46.9
- node: v24.19.0
- docker: 28.1.1
- commit: eb6646f+dirty

出力の等価性：S と L の 4 レポート × 2 実装、計 16 本すべてが金型とバイト単位で一致しました。

規模 L（1 回の捨てる暖機のあと 3 回計測、中央値と範囲、ミリ秒）：

| レポート | 実装 | 中央値 | 範囲 | find | aggregate | getMore |
|---|---|---|---|---|---|---|
| users-usage | naive | 442 | 439–449 | 1041 | 0 | 0 |
| groups-usage | naive | 447 | 432–450 | 1041 | 0 | 0 |
| users-charge | naive | 338 | 309–359 | 1041 | 0 | 0 |
| groups-charge | naive | 332 | 324–338 | 1041 | 0 | 0 |
| users-usage | bulk | 26 | 26–26 | 2 | 1 | 2 |
| groups-usage | bulk | 25 | 25–25 | 2 | 1 | 2 |
| users-charge | bulk | 7 | 6–8 | 2 | 1 | 2 |
| groups-charge | bulk | 6 | 6–8 | 2 | 1 | 2 |

規模 S：

| レポート | 実装 | 中央値 | 範囲 | find | aggregate | getMore |
|---|---|---|---|---|---|---|
| users-usage | naive | 14 | 14–14 | 25 | 0 | 0 |
| groups-usage | naive | 13 | 12–13 | 25 | 0 | 0 |
| users-charge | naive | 12 | 12–13 | 25 | 0 | 0 |
| groups-charge | naive | 11 | 11–11 | 25 | 0 | 0 |
| users-usage | bulk | 1 | 1–2 | 2 | 1 | 0 |
| groups-usage | bulk | 1 | 1–1 | 2 | 1 | 0 |
| users-charge | bulk | 1 | 1–1 | 2 | 1 | 0 |
| groups-charge | bulk | 1 | 1–1 | 2 | 1 | 0 |

要求回数は機械に依存しません。素朴実装は 1 + グループ数 + 利用者数、すなわち S で 25、L で 1,041 の
`find` を 1 出力ごとに送ります。一括実装はどちらの規模でも `find` 2 回と `aggregate` 1 回です。
L の `getMore` 2 回は、1,000 件の利用者一覧と 1,000 件の集計がドライバの初回バッチ（101 件）に
収まらないために出るもので、一括実装が本当に全利用者を 1 回で読んでいることの裏づけです。

### Lab B — ブロッキング待機（`lab-b/results/2026-10-06-linux-x64.md`）

- date: 2026-10-06T00:40:40.921Z
- os: Linux 5.4.0-216-generic
- arch: x64
- cpu: Intel(R) Xeon(R) E-2146G CPU @ 3.50GHz x 12
- memoryGiB: 46.9
- node: v24.19.0
- docker: 28.1.1
- commit: eb6646f+dirty

8、20、20 の 3 バースト（計 48 要求）、各要求 5 秒のタイムアウト。バーストのあとに単発の
`GET /work` と `GET /health` を 1 回ずつ。

| アーム | バースト 1 | バースト 2・3 合計 | 3 回の probe | 3 回の /health |
|---|---|---|---|---|
| fixed-await | 0 ok | 0 ok | timeout, timeout, timeout | 200, 200, 200 |
| global-await | 8 ok | 40 ok | ok, ok, ok | 200, 200, 200 |
| global-noextra | 0 ok | 0 ok | timeout, timeout, timeout | 200, 200, 200 |
| fixed-compose | 8 ok | 40 ok | ok, ok, ok | 200, 200, 200 |

同じコードが、3 スレッドの固定プールでは凍り、既定の共有プールでは凍らず、3 スレッドに制限して
補償スレッドを禁じた共有プールでは再び凍ります。ブロッキング待機を Future の合成に置き換えた
`fixed-compose` は、プールの大きさを変えないまま 48 件すべてに応答します。4 つのアームすべてで、
プールに触れない `/health` は 3 回とも 200 を返しました。

### Lab C — ビルドの移行（`lab-c/results/2026-10-06-linux-x64.md`）

- date: 2026-10-06T00:41:33.763Z
- os: Linux 5.4.0-216-generic
- arch: x64
- cpu: Intel(R) Xeon(R) E-2146G CPU @ 3.50GHz x 12
- memoryGiB: 46.9
- node: v24.19.0
- commit: eb6646f+dirty

1,000 モジュール。1 回の捨てる暖機のあと 5 回計測、中央値と範囲、ミリ秒。

| 計測 | webpack + Babel | Rsbuild |
|---|---|---|
| 冷えた本番ビルド | 4296（4226–4416） | 359（347–385） |
| 開発サーバーの起動 | 2522（2425–2539） | 434（420–451） |

等価性の確認：両ツールとも 1,000 個のラベルすべてが出力 JavaScript に現れ、HTML は `root` に
マウントし、出力されたスクリプトを参照していました（webpack 3 ファイル、Rsbuild 4 ファイル）。

## 制約・既知の限界

- **1 台の機械の 1 回の実行です。** すべての数値は上記の機械ブロックの Linux ホストのものです。
  他の機械との比較はしていません。筆者の Windows PC での再実行は、この実行のあとに別途行います。
- **時間のばらつき。** 中央値と範囲（最小–最大）だけを示し、平均も標準偏差も比も主張しません。
  Lab A は 3 回、Lab C は 5 回の計測です。
- **規模 S の一括実装は計測の分解能の端にあります。** 4 レポートとも中央値が 1 ms に丸まり、範囲も
  1–1 か 1–2 です。S の中央値どうしを比として読んではいけません。両実装の差が意味を持つのは L の
  ほうです。
- **Lab B のバースト 1 の件数は競合です。** 8 件が同時に放たれてからプールが埋まるまでに何件が
  完了するかは走るたびに変わりうるため、契約は「8 未満」とだけ定め、実測値をそのまま報告します。
  この機械では毎回 0 でしたが、0 を期待値として固定はしていません。プールが凍っていることの証拠は
  この数ではなく、probe のタイムアウトと、バースト 2・3 の 0 ok です。
- **Lab B には sbt イメージが要ります。** `sbtscala/scala-sbt`（sbt 1.13.0 / Scala 3.8.4 / JDK
  21.0.12）をダイジェスト指定で使い、各アームは `--network none` で走ります。イメージがない機械では
  Lab B は動きません。Lab A の MongoDB も同様にダイジェスト指定です。
- **webpack の本番 HTML は `id=root`（引用符なし）です。** html-webpack-plugin 5.6.8 は本番モードで
  属性の引用符を落とし、`minify` を `false` にしても `{}` にしても
  `removeAttributeQuotes: false` にしても変わりません。そのため等価性の判定は「`root` に
  マウントしていること」とし、`id="root"` と `id=root` の双方を受け入れます。意味は変えておらず、
  別の id にマウントするページは今も失敗します。開発サーバー側の判定は `id="root"` のままです。
- **CI は小さく走ります。** `pnpm lab:a --size S --runs 1`、`pnpm lab:b`、
  `pnpm lab:c --modules 200 --runs 1` です。CI は結果ファイルを commit しません。したがって
  公開されている数値は CI のものではなく、上記の機械のものです。
- **結果ファイルは 1 日に 1 つの名前です。** 名前が `<UTC 日付>-<platform>-<arch>` のため、この実行は
  日付をまたいだぶん、各ラボに 2 組（10-05 と 10-06）の結果が残っています。README が引くのは最後の
  実行である 10-06 の組です。

## 作り方

契約を先に固定し、そのあとで実装しました。`goal-pack/SCOPE.md` がレイアウト、コマンドと終了コード、
データ、CSV のバイト規則、要求回数、Lab B の期待結果、ポートとイメージを定めます。テストが期待する
のは契約であって、実装の振る舞いではありません。

証明の作り方として、次を守りました。

- **金型は 1 度だけ採取して凍結する。** 採取の前に同じ実装を 2 回流して出力が一致すること（A/A）を
  確かめ、以後は誰も金型を書き換えません。一括実装の出力が金型と 1 バイトでも違えば、それは一括
  実装の欠陥です。
- **緑を主張する前に、赤を見る。** CSV の規則、A/A、バイト一致、要求回数、Lab B の期待結果との照合、
  Lab C の等価性、終了コードのそれぞれについて、わざと壊した対照を作って実際に失敗することを見て
  います。対照はテスト名に `control:` と書いてあり、本番のコードではなく OS の一時ディレクトリに
  作った複製に仕込みます。
- **測るだけで、説明しない。** 測っていない数は書きません。計測には捨てる暖機を伴い、中央値と範囲を
  機械ブロックとともに示します。

実装は、契約・進捗台帳・事実ファイルを持つゴールパックに沿って、無人で回る方式で進めました。各ゴール
の各行には判定と、その根拠となる実際の出力が残っています（`goal-pack/PROGRESS.md`）。計測した事実は
`goal-pack/facts.md` に、契約を変えた 1 件はその理由とともに台帳に記録してあります。

設計・レビュー・検証：So Ryo ／ 実装：AI エージェント（Claude Code）との協働
