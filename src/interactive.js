import { select, input, confirm, checkbox } from "@inquirer/prompts";
import chalk from "chalk";

export { select, input, confirm, checkbox };

export function suggestBranchName(taskDescription) {
  const text = taskDescription.toLowerCase().trim();

  // Japanese keyword mapping
  const keywords = [
    [/追加|作成|新規|実装|作って/, "add"],
    [/修正|直して|fix|バグ/, "fix"],
    [/削除|消して|remove/, "remove"],
    [/変更|更新|アップデート|改善/, "update"],
    [/リファクタ|整理|きれいに/, "refactor"],
    [/テスト|試験/, "test"],
    [/設定|config|セットアップ/, "config"],
    [/表示|一覧|リスト|見/, "view"],
    [/認証|ログイン|auth/, "auth"],
    [/通知|notify|push/, "notify"],
    [/UI|デザイン|画面|レイアウト/, "ui"],
    [/API|エンドポイント/, "api"],
  ];

  let prefix = "feature";
  let slug = "";

  for (const [pattern, name] of keywords) {
    if (pattern.test(text)) {
      slug = name;
      if (/修正|直して|fix|バグ/.test(text)) prefix = "bugfix";
      break;
    }
  }

  // Extract English words if present
  const englishWords = text.match(/[a-zA-Z]{3,}/g);
  if (englishWords && englishWords.length > 0) {
    slug = englishWords
      .slice(0, 3)
      .join("-")
      .toLowerCase();
  }

  if (!slug) {
    // Fallback: use timestamp
    slug = `task-${Date.now().toString(36).slice(-4)}`;
  }

  return `${prefix}/${slug}`;
}

export function setTerminalTitle(title) {
  // Set terminal tab title (works in Terminal.app, iTerm2, etc.)
  process.stdout.write(`\x1b]0;${title}\x07`);
}
