# paradev Architecture

## What is paradev

Claude Code × git worktree で複数機能を同時並列開発する CLI ツール。
`npm install -g paradev` でインストール。

## Tech Stack

- **Runtime**: Node.js >= 18 (ESM)
- **CLI framework**: Commander.js
- **Output**: chalk (colors) + cli-table3 (tables)
- **State**: JSON file at `~/.paradev/state.json`
- **Config**: JSON file at `~/.paradev/config.json`
- **CI/CD**: GitHub Actions → npm publish
- **Registry**: npm (https://www.npmjs.com/package/paradev)
- **Repository**: https://github.com/shunh56/paradev

## Directory Structure

```
paradev/
├── .github/workflows/
│   └── publish.yml          # main push → npm publish
├── .claude/
│   ├── ARCHITECTURE.md      # この文書
│   ├── BRANCHING.md         # ブランチ戦略
│   ├── CICD.md              # CI/CD パイプライン設計
│   └── RELEASE.md           # リリースプロセス
├── bin/
│   └── paradev.js           # CLI エントリポイント (#!/usr/bin/env node)
├── src/
│   ├── commands/
│   │   ├── start.js         # paradev start — worktree作成 + Claude起動
│   │   ├── list.js          # paradev list — ブランチ状態テーブル表示
│   │   ├── stop.js          # paradev stop — Claude停止
│   │   ├── clean.js         # paradev clean — worktree削除
│   │   ├── watch.js         # paradev watch — Claude完了監視 + 通知
│   │   ├── pr.js            # paradev pr — PRテンプレ生成
│   │   └── auth.js          # paradev auth — GitHub Token設定
│   ├── config.js            # ~/.paradev/config.json 管理
│   ├── state.js             # ~/.paradev/state.json 状態管理
│   ├── git.js               # git worktree 操作
│   ├── github.js            # GitHub PR 状態取得 (gh CLI)
│   └── claude.js            # Claude Code 起動・プロセス監視・通知
├── test/                    # テスト (node:test)
├── package.json
└── README.md
```

## Commands

| Command | File | Description |
|---------|------|-------------|
| `paradev start <file>` | commands/start.js | JSON から worktree + Claude 起動 |
| `paradev start -t "b:task"` | commands/start.js | インラインでタスク指定 |
| `paradev list` | commands/list.js | 状態テーブル + GitHub PR 取得 |
| `paradev stop <branch>` | commands/stop.js | Claude 停止 → Review待ち |
| `paradev watch` | commands/watch.js | プロセス監視 + Mac 通知 |
| `paradev pr <branch>` | commands/pr.js | PR テンプレ生成 |
| `paradev clean` | commands/clean.js | worktree 削除 |
| `paradev auth` | commands/auth.js | GitHub Token 設定 |

## State Management

State は `~/.paradev/state.json` に保存。リポジトリごとにタスクを管理。

```json
{
  "repos": {
    "/absolute/path/to/repo": {
      "tasks": [
        {
          "branch": "feature/xxx",
          "task": "タスクの説明",
          "worktreePath": "/path/to/repo__feature-xxx",
          "status": "idle|claude_ongoing|review|pr_open|merged",
          "claudePid": null,
          "createdAt": "ISO8601",
          "updatedAt": "ISO8601",
          "prNumber": null
        }
      ]
    }
  }
}
```

### Status Flow

```
idle → claude_ongoing → review → pr_open → merged
         (Claude起動)    (Claude完了)  (PR作成)   (マージ)
```

## Worktree Naming

```
{repo_name}__{branch_name_with_slashes_replaced_by_dashes}

例: my-app__feature-login-fix
```

配置: リポジトリの親ディレクトリ (兄弟ディレクトリ)

## Key Design Decisions

1. **ローカルファースト**: GitHub API は任意。オフラインでも動く
2. **CLI ファースト**: Web UI は将来の Pro 機能
3. **非侵入的**: .git を汚さない。状態は ~/.paradev/ に保存
4. **技術スタック非依存**: Flutter/React/Rails 等に依存しない

## npm Account

- Username: `shune.io`
- Email: `shune.io.dev@gmail.com`
- 2FA: Security Key (macbookpro)
- Recovery codes: `~/.secrets/npm-recovery-codes.txt` (残り3個)
- publish 時は recovery code を OTP として使用
