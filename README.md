# paradev

**AIエージェントは、1つのブランチを共有できない。だから並列で動かす。**

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

### 1. タスクを定義する

```json
[
  { "branch": "feature/login-fix", "task": "ログインのバリデーションを修正して" },
  { "branch": "feature/profile-ui", "task": "プロフィール画面をリファクタリングして" },
  { "branch": "feature/push-notify", "task": "プッシュ通知の購読処理を実装して" }
]
```

### 2. 起動する

```bash
paradev start tasks.json
```

これだけ。各ブランチに [git worktree](https://git-scm.com/docs/git-worktree) が作られ、それぞれで Claude Code が動き出します。

### 3. 確認する

```bash
paradev list          # 全ブランチの状態を一覧表示
paradev watch         # Claude が終わったら通知を受け取る
```

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
| `paradev start <file>` | JSON からワークツリー作成 + Claude 起動 |
| `paradev start -t "branch:task"` | インラインで即起動 |
| `paradev list` | ブランチ状態・PR・diff を一覧表示 |
| `paradev watch` | Claude 完了時に Mac 通知 |
| `paradev pr <branch>` | PR テンプレートを自動生成 |
| `paradev stop <branch>` | Claude を停止 |
| `paradev clean` | マージ済みワークツリーを削除 |

詳細: [docs/COMMANDS.md](docs/COMMANDS.md)

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
- [ ] Web UI ダッシュボード
- [ ] チーム機能

---

## License

MIT
