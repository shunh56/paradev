# Command Reference

## paradev (引数なし)

インタラクティブメニューを開きます。コマンドを覚える必要はありません。

```bash
paradev
```

```
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

---

## paradev demo

テスト用リポジトリを作成し、3つの Claude を並列起動するデモを体験できます。

```bash
paradev demo
```

初回ユーザー向け。ゼロ設定で paradev の体験ができます。

---

## paradev add

対話式でタスクを追加します。ブランチ名は指示内容から自動提案されます。

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

  2 つのタスクを開始します。

✔ 個別ターミナルを開きますか？
❯ すべて開く
  選んで開く
  開かない（あとで paradev go で入れます）
```

### ブランチ名の自動提案

日本語・英語の指示内容からキーワードを抽出し、ブランチ名を提案します。

| 指示 | 提案されるブランチ名 |
|------|---------------------|
| ログインのバリデーションを修正して | `bugfix/fix` |
| プッシュ通知を実装して | `feature/add` |
| プロフィール画面をリファクタリングして | `feature/refactor` |
| Add Google OAuth login | `feature/add-google-oauth` |

---

## paradev go

ワークツリーを選択して入ります。

```bash
paradev go              # 対話式で選択
paradev go feature/xxx  # 直接指定
```

```
? どのブランチに入りますか？
❯ 🤖  feature/login-fix   +24/-3
  👀  feature/profile-ui   +87/-12
  💤  feature/push-notify
```

### Claude が実行中のブランチを選んだ場合

```
? feature/login-fix で Claude が実行中です
❯ 既存のターミナルに移動する
  新しいターミナルを開く (Claude なし)
  キャンセル
```

新しいターミナルを作らず、既存のターミナルにフォーカスを移します。

---

## paradev init

`tasks.json` のテンプレートを生成します。

```bash
paradev init
```

生成されるファイル:

```json
[
  {
    "branch": "feature/",
    "task": ""
  },
  {
    "branch": "feature/",
    "task": ""
  },
  {
    "branch": "feature/",
    "task": ""
  }
]
```

編集して `paradev start tasks.json` で起動します。

---

## paradev start

JSON ファイルまたはインライン引数からワークツリーを作成し、Claude Code を起動します。

```bash
# JSON ファイルから
paradev start tasks.json

# インラインで
paradev start -t "feature/login:ログインを修正" -t "feature/signup:登録画面を追加"

# worktree だけ作成（Claude は起動しない）
paradev start tasks.json --no-claude
```

### tasks.json format

```json
[
  {
    "branch": "feature/branch-name",
    "task": "Claude への指示内容"
  }
]
```

---

## paradev list

全ブランチの状態をテーブル表示します。

```bash
paradev list                # 一覧表示
paradev list --interactive  # アクション付きダッシュボード
paradev list --watch        # リアルタイム自動更新（5秒間隔）
paradev list --watch -i 3   # 3秒間隔で更新
paradev ls                  # list のエイリアス
```

### アクション付きダッシュボード (`--interactive`)

テーブルの下にアクションメニューが表示されます。

```
? アクション
❯ 📂 ワークツリーに入る
  🤖 Claude を起動する
  📝 PR テンプレートを生成
  ⏹  ブランチを停止する
  🧹 ワークツリーを削除する
  🔄 更新
  ← 戻る
```

### ステータスアイコン

| Status | Meaning |
|--------|---------|
| 🤖 Claude ongoing | Claude Code が稼働中 |
| 👀 Review待ち | Claude 完了 → レビューが必要 |
| ✅ PR Open | GitHub に PR が存在する |
| 💤 Idle | ブランチはあるが停止中 |
| 🎉 Merged | PR マージ済み |

`gh` CLI が認証済みなら、PR ステータスは GitHub から自動取得されます。

---

## paradev watch

Claude プロセスを監視し、完了時に Mac 通知を送ります。

```bash
paradev watch              # 10秒間隔
paradev watch --interval 5 # 5秒間隔
```

全プロセス完了で自動終了します。

---

## paradev pr

ブランチの diff とコミット履歴から PR テンプレートを生成します。

```bash
paradev pr feature/login-fix          # ターミナルに表示
paradev pr feature/login-fix --copy   # クリップボードにコピー
```

テンプレートに含まれる内容:
- タスクの概要
- コミットログ
- 変更ファイル一覧
- diff 統計
- テストプランチェックリスト

---

## paradev stop

Claude プロセスを停止し、ステータスを「Review待ち」に変更します。

```bash
paradev stop feature/login-fix
```

---

## paradev clean

ワークツリーを削除します。

```bash
paradev clean          # マージ済みブランチのみ
paradev clean --all    # 全ワークツリー
paradev clean --force  # 未コミット変更があっても強制削除
```

インタラクティブメニューからの場合は、チェックボックスで個別選択できます。

---

## paradev auth

GitHub Token を設定します（任意）。PR ステータスの取得に使用します。

```bash
paradev auth
```

Token は `~/.paradev/config.json` に保存されます。

---

## IDE 対応

paradev は実行環境を自動検知し、適切な方法でターミナルを開きます。

| 環境 | 動作 |
|------|------|
| **Antigravity** | IDE のターミナルタブに追加 |
| **Cursor** | IDE のターミナルタブに追加 |
| **VS Code** | IDE のターミナルタブに追加 |
| **iTerm2** | 新しいタブに追加 |
| **Terminal.app** | 新しいウィンドウ（グリッド配置で自動整列） |

ターミナルのタブタイトルに `[paradev] branch-name` が設定されます。

---

## 設定ファイル

| ファイル | 用途 |
|---------|------|
| `~/.paradev/state.json` | ブランチ状態とタスク管理 |
| `~/.paradev/config.json` | GitHub Token と設定 |
