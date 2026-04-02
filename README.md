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

paradev は、1コマンドで複数ブランチを立ち上げて、それぞれに Claude Code を走らせます。

```
$ paradev start tasks.json

  paradev — Starting 3 parallel task(s)

  Creating worktree: feature/login-fix    ... done
  Creating worktree: feature/profile-ui   ... done
  Creating worktree: feature/push-notify  ... done
  Launching Claude: feature/login-fix     ... done
  Launching Claude: feature/profile-ui    ... done
  Launching Claude: feature/push-notify   ... done

  All tasks started!
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
```

---

## はじめる

```bash
npm install -g paradev
```

### すぐに体験する

```bash
paradev demo    # テスト用リポジトリで並列開発を体験
```

### 対話式で始める

```bash
paradev         # インタラクティブメニューが開く
paradev add     # 対話的にタスクを追加（ブランチ名も自動提案）
```

### JSON ファイルで始める

```bash
paradev init              # tasks.json テンプレートを生成
# → 編集して...
paradev start tasks.json  # 一括起動
```

各ブランチに [git worktree](https://git-scm.com/docs/git-worktree) が作られ、それぞれで Claude Code が動き出します。Antigravity / Cursor / VS Code のターミナルタブに追加されます。

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
| `paradev` | インタラクティブメニュー |
| `paradev demo` | ゼロ設定のデモ体験 |
| `paradev add` | 対話式タスク追加（ブランチ名自動提案） |
| `paradev go` | ワークツリーに入る（既存ターミナル再利用） |
| `paradev init` | tasks.json テンプレート生成 |
| `paradev start <file>` | JSON から一括起動 |
| `paradev list` | ブランチ状態ダッシュボード（アクション付き） |
| `paradev watch` | Claude 完了時に Mac 通知 |
| `paradev pr <branch>` | PR テンプレート自動生成 |
| `paradev stop <branch>` | Claude を停止 |
| `paradev clean` | ワークツリーを削除 |

詳細: [docs/COMMANDS.md](docs/COMMANDS.md)

### IDE 対応

Antigravity / Cursor / VS Code / iTerm2 / Terminal.app を自動検知し、IDE のターミナルタブとして開きます。

---

## 必要なもの

- [Node.js](https://nodejs.org/) >= 18
- [Git](https://git-scm.com/) >= 2.15
- [Claude Code](https://claude.ai/code) CLI
- [GitHub CLI](https://cli.github.com/) (任意 — PR 状態取得用)

---

## ロードマップ

- [x] 並列ワークツリー + Claude 自動起動
- [x] リアルタイム状態ダッシュボード
- [x] 完了通知
- [x] PR テンプレート生成
- [x] GitHub PR ステータス連携
- [x] インタラクティブメニュー + 対話式タスク追加
- [x] IDE 自動検知（Antigravity / Cursor / VS Code）
- [x] ターミナル再利用 + ウィンドウ整列
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

paradev launches multiple git worktrees and runs a separate Claude Code instance in each — all in parallel.

```bash
npm install -g paradev
```

```json
[
  { "branch": "feature/auth", "task": "Add Google OAuth login" },
  { "branch": "feature/profile", "task": "Refactor profile page" }
]
```

```bash
paradev demo               # Try it instantly with a test repo
paradev                    # Interactive menu
paradev add                # Add tasks interactively (auto-suggests branch names)
paradev go                 # Jump into a worktree (reuses existing terminals)
paradev list               # Dashboard with inline actions
```

### How It Works

Uses git's native [worktree](https://git-scm.com/docs/git-worktree) to check out multiple branches in separate directories, sharing a single `.git`. Each directory gets its own Claude Code process. Fully isolated. Fully parallel.

### Commands

| Command | Description |
|---------|-------------|
| `paradev` | Interactive menu |
| `paradev demo` | Zero-config guided demo |
| `paradev add` | Add tasks interactively |
| `paradev go` | Enter worktree (reuses existing terminals) |
| `paradev list` | Dashboard with inline actions |
| `paradev start <file>` | Batch launch from JSON |
| `paradev pr <branch>` | Generate PR template |
| `paradev clean` | Remove worktrees |

Full reference: [docs/COMMANDS.md](docs/COMMANDS.md)

### IDE Support

Auto-detects Antigravity, Cursor, VS Code, iTerm2, and Terminal.app. Opens Claude in IDE terminal tabs instead of separate windows.

### Requirements

- [Node.js](https://nodejs.org/) >= 18 / [Git](https://git-scm.com/) >= 2.15 / [Claude Code](https://claude.ai/code) CLI
- [GitHub CLI](https://cli.github.com/) (optional)

---

## License

MIT
