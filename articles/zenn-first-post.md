## はじめに

2025年、コードを書く速度は劇的に変わった。

Claude Code、GitHub Copilot、Cursor。AIがコードを書く時代が来た。機能の実装を依頼すれば、数分で動くコードが返ってくる。テストも書いてくれる。リファクタリングも提案してくれる。

でも、ふと気づいた。

**コードを書く速度は10倍以上になったのに、開発全体の速度は10倍にはなっていない。**

なぜか。ボトルネックが「コードを書く」から「ワークフロー」に移っただけだった。

---

## AIがいるのに、なぜ遅いのか

ある日の自分の開発風景を振り返ってみた。

```
09:00  feature/login-fix ブランチを切る
09:01  Claude Code に「ログインのバリデーションを修正して」と指示
09:03  Claude が作業中... 待つ
09:15  完了。レビューする。コミット。PR作成。
09:20  feature/profile-ui ブランチを切る
09:21  Claude Code に「プロフィール画面をリファクタリングして」と指示
09:23  Claude が作業中... また待つ
09:40  完了。レビュー。コミット。PR。
09:45  feature/push-notify ブランチを切る
       ...
```

お気づきだろうか。

**Claude が作業している間、自分は何もしていない。**

もっと正確に言うと、Claude に次の作業を振りたいのに振れない。なぜなら、1つのローカル環境では1つのブランチしかチェックアウトできないから。

Claude の処理能力が余っている。自分の時間も余っている。なのに直列でしか進められない。

これは「AIが遅い」のではない。**ワークフローがAIの速度に追いついていない**のだ。

---

## 「並列開発」という概念

プログラマなら誰でも知っている。シングルスレッドよりマルチスレッドの方が速い。

サーバーサイドでは当たり前にやっている並列処理を、なぜ開発ワークフローではやっていないのか。

理想はこうだ。

```
09:00  3つのブランチを同時に立ち上げる
09:01  3つの Claude Code が同時に作業開始
09:15  全部完了。3つのPRをレビューするだけ。
```

45分かかっていた作業が15分で終わる。3倍速。しかもこの間、自分は別の作業ができる。

でも、これを実現するには問題がある。

---

## git の制約と git worktree

git は強力なツールだが、1つの作業ディレクトリには1つのブランチしかチェックアウトできない。これは git の根本的な設計だ。

ただし、あまり知られていない機能がある。**git worktree** だ。

```bash
git worktree add ../my-app__feature-login feature/login
git worktree add ../my-app__feature-profile feature/profile
```

git worktree を使うと、1つの `.git` を共有しながら、複数のディレクトリに別々のブランチを展開できる。`git clone` のように重複した `.git` を持つ必要がない。軽量で高速。

```
my-app/                    ← main ブランチ (元のリポジトリ)
my-app__feature-login/     ← feature/login ブランチ
my-app__feature-profile/   ← feature/profile ブランチ
```

各ディレクトリは完全に独立している。片方で `npm install` しても、もう片方には影響しない。それぞれで別のターミナルを開いて、別の Claude Code を走らせることができる。

**理論上は、これで並列開発ができる。**

ただし、実際にやってみるとわかるが、毎回手動でこれをやるのは面倒だ。

---

## 手動の限界

git worktree を使った並列開発を手動でやると、こうなる。

```bash
# ブランチ1
git worktree add -b feature/login ../my-app__feature-login
cd ../my-app__feature-login
claude "ログインのバリデーションを修正して"

# ブランチ2 (別のターミナルで)
git worktree add -b feature/profile ../my-app__feature-profile
cd ../my-app__feature-profile
claude "プロフィール画面をリファクタリングして"

# ブランチ3 (さらに別のターミナルで)
git worktree add -b feature/push ../my-app__feature-push
cd ../my-app__feature-push
claude "プッシュ通知を実装して"
```

3ブランチで15行のコマンド。5ブランチなら25行。しかも、各ブランチの状態を確認するには、それぞれのターミナルを見に行かなければならない。

- どのブランチの Claude が終わったのか？
- どのブランチでPRを出したのか？
- どのブランチがまだ作業中なのか？

**これは人間が管理するべきではない。**

---

## paradev を作った

だから作った。

[**paradev**](https://github.com/shunh56/paradev) — 複数の AI エージェントを、複数のブランチで、同時に走らせる CLI ツール。

:::message
paradev を使うには [Claude Code](https://claude.ai/code) CLI がインストールされている必要があります。Claude Code は Anthropic のサブスクリプション（Max プラン等）が必要です。
:::

```bash
npm install -g paradev
```

使い方は単純だ。

### 1. タスクを JSON で定義する

```json
[
  {
    "branch": "feature/login-fix",
    "task": "ログインのバリデーションを修正して"
  },
  {
    "branch": "feature/profile-ui",
    "task": "プロフィール画面をリファクタリングして"
  },
  {
    "branch": "feature/push-notify",
    "task": "プッシュ通知の購読処理を実装して"
  }
]
```

### 2. 1コマンドで起動する

```bash
paradev start tasks.json
```

```
  paradev — Starting 3 parallel task(s)

  Creating worktree: feature/login-fix    ... done
  Creating worktree: feature/profile-ui   ... done
  Creating worktree: feature/push-notify  ... done
  Launching Claude: feature/login-fix     ... done
  Launching Claude: feature/profile-ui    ... done
  Launching Claude: feature/push-notify   ... done

  All tasks started!
```

これだけで3つのことが起きる。

1. **git worktree** が自動で3つ作られる
2. 各ワークツリーで **Claude Code** が自動起動する
3. 状態管理が始まる

:::message
worktree は元のリポジトリと `.git` を共有しますが、ディレクトリは独立しています。`node_modules` などの依存関係は各ワークツリーごとに `npm install` が必要です。Claude Code に「まず依存関係をインストールしてから実装して」と指示すれば、この手順も含めて自動化できます。
:::

### 3. 状態を確認する

```bash
paradev list
```

```
┌─────────────────────┬──────────────────┬──────────┬────┬────────┐
│ Branch              │ Status           │ Time     │ PR │ Diff   │
├─────────────────────┼──────────────────┼──────────┼────┼────────┤
│ feature/login-fix   │ 🤖 Claude ongoing│ 12m ago  │ -  │ +24/-3 │
│ feature/profile-ui  │ 👀 Review待ち    │ 1h ago   │ -  │ +87/-12│
│ feature/push-notify │ ✅ PR Open       │ 3h ago   │ #42│+134/-8 │
└─────────────────────┴──────────────────┴──────────┴────┴────────┘
```

各ブランチの状態が一目でわかる。

| ステータス        | 意味                              |
| ----------------- | --------------------------------- |
| 🤖 Claude ongoing | Claude Code が作業中              |
| 👀 Review待ち     | Claude 完了。人間のレビューが必要 |
| ✅ PR Open        | GitHub に PR が存在する           |
| 💤 Idle           | ブランチはあるが停止中            |
| 🎉 Merged         | PR マージ済み                     |

Claude が終わったら Mac の通知で知らせてくれる。

```bash
paradev watch
```

PR テンプレートも自動生成できる。

```bash
paradev pr feature/login-fix --copy  # クリップボードにコピー
```

---

## 技術的な設計判断

paradev を作る上で、いくつかの設計判断を行った。

### なぜ CLI なのか

Web UI やデスクトップアプリという選択肢もあった。でも、ターゲットは「Claude Code を毎日使っている開発者」だ。彼らは既にターミナルで作業している。新しいアプリを開かせるのは余計な摩擦になる。

**ユーザーが既にいる場所で動くこと。** これが最優先だった。

### なぜ JSON なのか

タスクの入力形式はいくつか検討した。

- YAML: 人間に読みやすいが、構造が曖昧になりやすい
- CLI引数: 1〜2タスクならいいが、5タスクになると破綻する
- JSON: 構造が明確。プログラマなら誰でも書ける。コピペしやすい

結論として、JSONファイルとインライン引数の両方に対応した。

```bash
# ファイルから (3つ以上のタスク向き)
paradev start tasks.json

# インラインで (1〜2タスクの時)
paradev start -t "feature/login:ログインを修正して"
```

### なぜ状態を `~/.paradev/` に保存するのか

リポジトリの `.git/` や プロジェクトディレクトリ内に状態を保存する選択肢もあった。でも、それだと `.gitignore` の管理が必要になるし、チームメンバーに不要なファイルが見える。

paradev はリポジトリに一切ファイルを追加しない。**非侵入的**であることを重視した。

### worktree の命名規則

```
{リポジトリ名}__{ブランチ名 (/ を - に置換)}
```

例: `my-app__feature-login-fix`

リポジトリの隣（兄弟ディレクトリ）に配置する。中に配置すると `.gitignore` が必要になるし、IDE が混乱する。

:::message alert
worktree はリポジトリの親ディレクトリに作成されます。親ディレクトリへの書き込み権限があることを確認してください。`paradev clean` で不要になったワークツリーを削除できます。
:::

---

## 作って気づいたこと

### git worktree は過小評価されている

git worktree は Git 2.5 (2015年) から存在する機能だが、知らない開発者が多い。自分も最近まで知らなかった。

AI エージェント時代になって初めて、この機能の真価が見えてきた。AI を並列で走らせるインフラとして、worktree は完璧にフィットする。

### 「AIを待つ時間」は新しい種類のムダ

従来の開発では、「ビルドを待つ時間」が問題だった。CI が5分回るのを待つ。コンパイルが終わるのを待つ。

AI 時代では、「AIが作業するのを待つ時間」が新しいボトルネックになっている。でも、ビルド待ちと違って、この待ち時間には**別のAIに別の作業を振れる**可能性がある。paradev はそこを突いている。

### 開発のパラダイムが変わりつつある

従来: 人間がコードを書く。1ファイルずつ。1機能ずつ。

現在: AIがコードを書く。人間はレビューする。でもまだ直列。

未来: **AIが並列でコードを書く。人間は指揮する。**

paradev は、この「未来」の最初のステップだと思っている。

---

## 現在の機能と今後

### 実装済み

- `paradev start` — worktree 作成 + Claude Code 自動起動
- `paradev list` — 全ブランチの状態ダッシュボード (GitHub PR 連携)
- `paradev watch` — Claude 完了時の Mac 通知
- `paradev pr` — PR テンプレート自動生成
- `paradev stop` / `clean` — プロセス停止・worktree 削除

### ロードマップ

- Web UI ダッシュボード (ブラウザでリアルタイム確認)
- チーム機能 (誰がどのブランチを担当しているか)
- コスト可視化 (ブランチごとの AI 使用量)
- 競合検知 (同じファイルを触っているブランチの警告)

---

## 試してみる

```bash
npm install -g paradev
```

任意の git リポジトリで以下を実行するだけ。

```bash
paradev start -t "feature/test:READMEを改善して"
```

GitHub: https://github.com/shunh56/paradev
npm: https://www.npmjs.com/package/paradev

---

## おわりに

AI はコードを書く速度を変えた。でも、開発ワークフローはまだ追いついていない。

paradev は「AI を並列で走らせる」という、シンプルだけど誰もやっていなかったことをやるツールだ。git worktree という既存の枯れた技術と、Claude Code という最新の AI を組み合わせただけ。でも、この組み合わせが生む体験は、一度味わうと戻れない。

フィードバック、Issue、PR、何でも歓迎です。

一緒に開発ワークフローの未来を作りましょう。
