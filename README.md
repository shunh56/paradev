# paradev

**複数の AI エージェントを、複数のブランチで、同時に走らせる CLI ツール。**

Run multiple AI agents across multiple branches, in parallel. Powered by git worktree.

[English](#english) | 日本語

---

Claude Code を使っていて、こう思ったことはありませんか。

> 「3つの機能を同時に開発したいのに、ブランチは1つしかチェックアウトできない」

1つ終わるのを待って、次を始めて、また待つ。直列。遅い。

**AIはもう速い。ボトルネックはワークフローの方だ。**

---

paradev は、対話的に複数ブランチを立ち上げて、それぞれに Claude Code を走らせます。

```
$ paradev

  paradev — Parallel AI Development

? 何をしますか？
❯ 🚀 新しいタスクを開始する
  📋 ブランチ一覧を見る
  📂 ワークツリーに入る
  🧹 ワークツリーを削除する
  📄 tasks.json テンプレートを生成する
  🎬 デモモードで体験する
  👋 終了
```

```
$ paradev list

┌─────────────────────┬──────────────────┬──────────┬────┬────────┐
│ Branch              │ Status           │ Time     │ PR │ Diff   │
├─────────────────────┼──────────────────┼──────────┼────┼────────┤
│ feature/login-fix   │ 🤖 Claude ongoing│ 12m ago  │ -  │ +24/-3 │
│ feature/profile-ui  │ 👀 Review待ち    │ 1h ago   │ -  │ +87/-12│
│ feature/push-notify │ ✅ PR Open       │ 3h ago   │ #42│+134/-8 │
└─────────────────────┴──────────────────┴──────────┴────┴────────┘

? アクション
❯ 📂 ワークツリーに入る
  🤖 Claude を起動する
  📝 PR テンプレートを生成
  ⏹  ブランチを停止する
  🧹 ワークツリーを削除する
  🔄 更新
```

---

## はじめる

```bash
npm install -g paradev
```

### すぐに体験する

```bash
paradev demo
```

テスト用リポジトリの作成から Claude の並列起動まで全自動で行われます。

### 対話式で始める（おすすめ）

```bash
paradev add
```

```
✔ Claude への指示: ログインのバリデーションを修正して
✔ ブランチ名: bugfix/fix                    ← 自動提案。編集もOK
✔ さらにタスクを追加する？ Yes
✔ Claude への指示: プロフィール画面をリファクタリングして
✔ ブランチ名: feature/refactor
✔ さらにタスクを追加する？ No

✔ 個別ターミナルを開きますか？ すべて開く
```

ブランチ名は指示内容から自動提案されます。ターミナルは IDE のタブとして開きます。

### JSON ファイルで始める

```bash
paradev init              # tasks.json テンプレートを生成
# → 編集して...
paradev start tasks.json  # 一括起動
```

### ワークツリーに入る

```bash
paradev go
```

```
? どのブランチに入りますか？
❯ 🤖  feature/login-fix   +24/-3
  👀  feature/profile-ui   +87/-12
  💤  feature/push-notify
```

Claude が既に動いているブランチを選ぶと、新しいターミナルを作らず**既存のターミナルにフォーカスが移ります**。

---

## 仕組み

```
your-app/                        ← main ブランチ (そのまま)
your-app__feature-login-fix/     ← worktree + Claude Code
your-app__feature-profile-ui/    ← worktree + Claude Code
your-app__feature-push-notify/   ← worktree + Claude Code
```

git の [worktree](https://git-scm.com/docs/git-worktree) 機能を使い、1つの `.git` を共有しながら複数ブランチを別ディレクトリに展開します。各ディレクトリで独立した Claude Code が動くので、完全な並列開発が可能です。

---

## コマンド

| コマンド | 説明 |
|---------|------|
| `paradev` | インタラクティブメニュー（↑↓で選択） |
| `paradev demo` | ゼロ設定のデモ体験 |
| `paradev add` | 対話式タスク追加（ブランチ名自動提案） |
| `paradev go [branch]` | ワークツリーに入る（既存ターミナル再利用） |
| `paradev init` | tasks.json テンプレート生成 |
| `paradev start <file>` | JSON / インラインで一括起動 |
| `paradev start -t "branch:task"` | インラインで即起動 |
| `paradev list` | ブランチ状態ダッシュボード |
| `paradev list --interactive` | アクション付きダッシュボード |
| `paradev list --watch` | リアルタイム自動更新 |
| `paradev watch` | Claude 完了時に Mac 通知 |
| `paradev pr <branch>` | PR テンプレート自動生成 |
| `paradev pr <branch> --copy` | PR テンプレートをクリップボードにコピー |
| `paradev stop <branch>` | Claude を停止 → Review待ちに変更 |
| `paradev clean` | マージ済みワークツリーを削除 |
| `paradev clean --all` | 全ワークツリーを削除 |
| `paradev auth` | GitHub Token を設定（任意） |

詳細: [docs/COMMANDS.md](docs/COMMANDS.md)

---

## IDE 対応

Antigravity / Cursor / VS Code / iTerm2 / Terminal.app を**自動検知**します。

- **IDE 内で実行**: ターミナルタブとして開く（ウィンドウ増殖なし）
- **Terminal.app で実行**: ウィンドウをグリッド配置で自動整列
- **Claude 実行中のブランチ**: 既存ターミナルにフォーカス移動（重複作成しない）

---

## 必要なもの

- [Node.js](https://nodejs.org/) >= 18
- [Git](https://git-scm.com/) >= 2.15
- [Claude Code](https://claude.ai/code) CLI
- [GitHub CLI](https://cli.github.com/) (任意 — PR 状態取得用)

---

## ロードマップ

- [x] 並列ワークツリー + Claude 自動起動
- [x] リアルタイム状態ダッシュボード（アクション付き）
- [x] インタラクティブメニュー + 対話式タスク追加
- [x] ブランチ名自動提案（日本語 / 英語対応）
- [x] ワークツリー移動 + 既存ターミナル再利用
- [x] IDE 自動検知（Antigravity / Cursor / VS Code / iTerm2）
- [x] ウィンドウ自動整列
- [x] 完了通知（Mac 通知センター）
- [x] PR テンプレート生成
- [x] GitHub PR ステータス連携
- [x] デモモード
- [ ] Web UI ダッシュボード
- [ ] チーム機能

---

<a id="english"></a>

## English

### The Problem

You're using Claude Code. It's fast. You want to ship 3 features at once.

But git only lets you checkout one branch at a time. So you wait. One finishes, you start the next. Sequential. Slow.

**The AI is already fast. Your workflow is the bottleneck.**

### The Solution

paradev launches multiple git worktrees and runs a separate Claude Code instance in each — all in parallel. No commands to memorize. Just run `paradev` and follow the interactive menu.

```bash
npm install -g paradev
```

```bash
paradev demo     # Try it instantly — creates a test repo + launches 3 Claudes
paradev          # Interactive menu (arrow keys to navigate)
paradev add      # Add tasks interactively (auto-suggests branch names)
paradev go       # Jump into a worktree (reuses existing terminals)
paradev list     # Status dashboard with inline actions
```

### How It Works

Uses git's native [worktree](https://git-scm.com/docs/git-worktree) to check out multiple branches in separate directories, sharing a single `.git`. Each directory gets its own Claude Code process. Fully isolated. Fully parallel.

### Commands

| Command | Description |
|---------|-------------|
| `paradev` | Interactive menu |
| `paradev demo` | Zero-config guided demo |
| `paradev add` | Add tasks interactively (auto-suggests branch names) |
| `paradev go [branch]` | Enter worktree (reuses existing terminals) |
| `paradev init` | Generate tasks.json template |
| `paradev start <file>` | Batch launch from JSON |
| `paradev list` | Status dashboard |
| `paradev list --interactive` | Dashboard with inline actions |
| `paradev list --watch` | Auto-refreshing dashboard |
| `paradev watch` | Notify on Claude completion (Mac notification) |
| `paradev pr <branch>` | Generate PR template |
| `paradev stop <branch>` | Stop Claude process |
| `paradev clean` | Remove worktrees |

Full reference: [docs/COMMANDS.md](docs/COMMANDS.md)

### IDE Support

Auto-detects Antigravity, Cursor, VS Code, iTerm2, and Terminal.app. Opens Claude in IDE terminal tabs instead of separate windows. When a branch already has Claude running, focuses the existing terminal instead of creating a new one.

### Requirements

- [Node.js](https://nodejs.org/) >= 18 / [Git](https://git-scm.com/) >= 2.15 / [Claude Code](https://claude.ai/code) CLI
- [GitHub CLI](https://cli.github.com/) (optional)

---

## License

MIT
