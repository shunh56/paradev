# Branching Strategy

## Branch Structure

```
main          ← 本番 (npm に公開されるコード)
  ↑ PR merge
develop       ← デフォルトブランチ (日々の開発)
  ↑ PR merge
feature/*     ← 機能開発ブランチ
bugfix/*      ← バグ修正ブランチ
```

## Rules

### main
- **直接 push 禁止** (branch protection)
- develop からの PR マージのみ許可
- マージ = リリース (GitHub Actions で npm publish が自動実行)
- 常にリリース可能な状態を維持

### develop
- **デフォルトブランチ** (clone/PR のベース)
- feature/* や bugfix/* からの PR マージ先
- 直接の小さなコミットも許可 (個人開発のため)

### feature/* / bugfix/*
- develop から切って develop に戻す
- 命名例: `feature/web-ui`, `bugfix/diff-stat-fix`

## Flow

```
1. develop から feature/xxx を切る
2. 開発 → develop に PR マージ
3. リリース時: develop → main に PR 作成
4. main にマージ → CI/CD が npm publish 実行
5. GitHub Release が自動作成される
```

## Anti-patterns (やってはいけないこと)

- main に直接 push する
- main から feature ブランチを切る
- develop を経由せず main に PR を出す
- バージョンを上げずに main にマージする (CI が検知して失敗させる)
