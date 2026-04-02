# CI/CD Pipeline

## Overview

```
Trigger: push to main branch
Pipeline: GitHub Actions

┌─────────────────────────────────────────────┐
│  main branch に push/merge                   │
│                                              │
│  ① Checkout                                  │
│  ② Node.js setup (v22)                       │
│  ③ npm ci (依存関係インストール)               │
│  ④ Version check (npm registry と比較)        │
│     → 同じなら skip (publish しない)           │
│  ⑤ npm test                                  │
│     → 失敗なら停止 (publish しない)            │
│  ⑥ npm publish --provenance                  │
│     → NPM_TOKEN secret を使用                 │
│  ⑦ GitHub Release 作成 (tag があれば)          │
│                                              │
│  通知: 成功/失敗を Actions のログで確認         │
└─────────────────────────────────────────────┘
```

## Workflow File

`.github/workflows/publish.yml`

## Secrets

| Secret | 用途 | 設定場所 |
|--------|------|---------|
| `NPM_TOKEN` | npm publish 認証 | GitHub repo Settings > Secrets |

## Trigger 条件

- `push` to `main` branch のみ
- develop への push では CI は走らない (将来 test workflow を別途追加可能)

## Version Check の仕組み

```bash
# npm registry の最新バージョンを取得
PUBLISHED=$(npm view paradev version 2>/dev/null || echo "0.0.0")
# package.json のバージョンを取得
CURRENT=$(node -p "require('./package.json').version")
# 同じなら publish をスキップ
if [ "$PUBLISHED" = "$CURRENT" ]; then
  echo "Version unchanged, skipping publish"
  exit 0
fi
```

これにより:
- バージョンを上げずに main にマージしても publish は走らない
- 同じバージョンの二重 publish を防ぐ
- README 修正だけのマージでも安全

## Anti-patterns

| やってはいけないこと | 理由 | 対策 |
|---------------------|------|------|
| NPM_TOKEN をコードに含める | 漏洩リスク | GitHub Secrets のみ |
| テストなしで publish | 壊れたパッケージが配信される | CI でテスト必須化 |
| main branch protection なし | 誤 push で意図しない publish | branch protection 設定 |
| token の期限管理をしない | 突然 publish 失敗 | カレンダーにリマインダー |
| `--force` で npm publish | 既存ユーザーに影響 | 常に新バージョンで publish |

## 将来の拡張

- [ ] develop branch への push で test のみ実行する workflow
- [ ] PR に対する自動テスト workflow
- [ ] Changelog 自動生成
- [ ] Slack/Discord 通知
