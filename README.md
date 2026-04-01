# paradev

**Claude Code × git worktree で、複数機能を同時並列開発するCLIツール**

```
┌────────────────────┬──────────────────┬──────────┬────┬────────┐
│ Branch             │ Status           │ Time     │ PR │ Diff   │
├────────────────────┼──────────────────┼──────────┼────┼────────┤
│ feature/login-fix  │ 🤖 Claude ongoing│ 12m ago  │ -  │ +24/-3 │
│ feature/profile-ui │ 👀 Review待ち    │ 1h ago   │ -  │ +87/-12│
│ feature/push-notify│ ✅ PR Open       │ 3h ago   │ #42│+134/-8 │
└────────────────────┴──────────────────┴──────────┴────┴────────┘
```

---

## What is paradev?

1つのリポジトリで**複数のブランチを同時に開発**したいと思ったことはありませんか？

- バグ修正しながら新機能も作りたい
- AIに任せている間に別の作業を進めたい
- PRレビュー待ちの間に次の機能を始めたい

paradev は **git worktree の作成 → Claude Code の自動起動 → 状態管理** を1コマンドで行います。

```
Before:  ターミナルを行き来して、手動でworktree作って、claudeを起動して...
After:   paradev start tasks.json → 全部自動
```

---

## Quick Start

### Install

```bash
npm install -g paradev
```

### 1. タスクファイルを作る

```json
[
  { "branch": "feature/login-fix", "task": "ログイン画面のバリデーションを修正して" },
  { "branch": "feature/profile-ui", "task": "プロフィール画面をリファクタリングして" },
  { "branch": "feature/push-notify", "task": "プッシュ通知の購読処理を実装して" }
]
```

### 2. 起動する

```bash
paradev start tasks.json
```

これだけで:
- **git worktree** が自動作成される
- 各ワークツリーで **Claude Code が自動起動**される
- 状態管理が始まる

### 3. 状態を確認する

```bash
paradev list
```

---

## Commands

| Command | Description |
|---------|-------------|
| `paradev start <file>` | JSONファイルからworktreeを作成しClaude Codeを起動 |
| `paradev start -t "branch:task"` | インラインでタスクを指定して起動 |
| `paradev list` | 全ブランチの状態をテーブル表示 |
| `paradev stop <branch>` | 指定ブランチのClaudeを停止 |
| `paradev clean` | マージ済みブランチのworktreeを削除 |
| `paradev clean --all` | 全worktreeを削除 |
| `paradev auth` | GitHub Token を設定 (任意) |

---

## How It Works

```
my-app/                   ← 元のリポジトリ (main)
my-app__feature-login-fix/    ← worktree + Claude Code
my-app__feature-profile-ui/   ← worktree + Claude Code
my-app__feature-push-notify/  ← worktree + Claude Code
```

paradev は git の **worktree** 機能を使い、1つの `.git` を共有しながら複数のディレクトリに別々のブランチを展開します。各ディレクトリで独立した Claude Code プロセスが動くため、**完全な並列開発**が可能です。

### ブランチの状態

| Status | Meaning |
|--------|---------|
| 🤖 Claude ongoing | Claude Code が稼働中 |
| 👀 Review待ち | Claude完了 → レビューが必要 |
| ✅ PR Open | GitHub に PR が存在する |
| 💤 Idle | ブランチはあるが停止中 |
| 🎉 Merged | PR マージ済み |

---

## Options

### `paradev start`

```bash
# JSONファイルから起動
paradev start tasks.json

# インラインで1つずつ指定
paradev start -t "feature/login:ログインを修正" -t "feature/signup:登録画面を追加"

# worktreeだけ作成 (Claude Codeは起動しない)
paradev start tasks.json --no-claude
```

### tasks.json format

```json
[
  {
    "branch": "feature/func-name",
    "task": "Claudeへの指示内容"
  }
]
```

---

## Requirements

- **Node.js** >= 18
- **Git** >= 2.15 (worktree support)
- **Claude Code** CLI (`claude` command)

---

## Configuration

```bash
# GitHub Token を設定すると PR 状態が確認できる (任意)
paradev auth
```

設定ファイル: `~/.paradev/config.json`

---

## Roadmap

- [x] `start` - worktree作成 + Claude Code自動起動
- [x] `list` - ブランチ状態のテーブル表示
- [x] `stop` / `clean` - プロセス停止・worktree削除
- [ ] Claude完了時のMac通知
- [ ] `paradev pr` - PRテンプレート生成
- [ ] GitHub PR状態の自動取得
- [ ] Web UIダッシュボード

---

## License

MIT
