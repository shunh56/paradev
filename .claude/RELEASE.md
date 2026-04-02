# Release Process & Versioning

## Semantic Versioning (semver)

```
MAJOR.MINOR.PATCH
  │     │     └── バグ修正 (後方互換あり)
  │     └──────── 新機能追加 (後方互換あり)
  └────────────── 破壊的変更 (後方互換なし)
```

### 現在のフェーズ: 0.x (初期開発)

```
0.x.x の間は:
  - MINOR = 新機能 or 破壊的変更
  - PATCH = バグ修正
  - 1.0.0 は "安定版" として公開する時に上げる
```

## Version Bump コマンド

```bash
# develop ブランチで実行
npm version patch   # 0.1.1 → 0.1.2 (バグ修正)
npm version minor   # 0.1.2 → 0.2.0 (新機能)
npm version major   # 0.2.0 → 1.0.0 (破壊的変更 / 安定版リリース)
```

`npm version` は以下を自動で行う:
1. `package.json` の version を更新
2. `package-lock.json` の version を更新
3. git commit を作成 (`vX.Y.Z`)
4. git tag を作成 (`vX.Y.Z`)

## Release Flow (詳細)

```
1. develop から feature/xxx ブランチを切る
   │
2. feature/xxx で開発
   │
3. feature/xxx → develop へ PR 作成 → マージ
   │
4. develop で npm version patch/minor/major を実行
   │  → package.json 更新 + commit + tag 作成
   │
5. git push && git push --tags
   │
6. develop → main へ PR 作成
   │  PR タイトル例: "Release v0.2.0"
   │
7. PR マージ
   │
8. GitHub Actions 自動実行:
   │  ├── バージョン検証 (npm registry と比較)
   │  ├── テスト実行
   │  ├── npm publish
   │  └── GitHub Release 作成 (tag ベース)
   │
9. 完了
```

## コマンドで表すと

```bash
# 1. feature ブランチを切る
git checkout develop
git checkout -b feature/xxx

# 2. 開発する
# ...

# 3. develop へ PR マージ
git push -u origin feature/xxx
gh pr create --base develop --head feature/xxx --title "Add xxx"
gh pr merge <number> --merge

# 4. バージョンを上げる
git checkout develop && git pull
npm version patch   # or minor / major

# 5. push
git push && git push --tags

# 6. main へ PR マージ → npm auto-publish
gh pr create --base main --head develop --title "Release vX.Y.Z"
gh pr merge <number> --merge
```

## 異常系

### npm publish が失敗した場合
- GitHub Actions がエラーで停止
- main のコードは更新済みだが npm には未反映
- 対処: Actions を手動で re-run するか、patch version を上げて再マージ

### バージョンを上げ忘れた場合
- CI がバージョン検証で検知 → publish をスキップ
- npm に同じバージョンは二重 publish できない (npm が 403 を返す)
- 対処: develop でバージョンを上げて再マージ

### テストが失敗した場合
- CI がテスト段階で停止 → publish は実行されない
- 対処: develop でテストを修正して再マージ

## npm Token 管理

- GitHub Secrets に `NPM_TOKEN` として格納
- Granular Access Token (Read and Write, All packages)
- token の有効期限を管理すること (期限切れで publish 失敗する)
- 期限が切れたら npm で再発行 → GitHub Secrets を更新
