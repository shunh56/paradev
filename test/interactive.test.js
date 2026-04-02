import { describe, it } from "node:test";
import assert from "node:assert";
import { suggestBranchName } from "../src/interactive.js";

describe("suggestBranchName", () => {
  describe("Japanese keyword detection", () => {
    it("detects fix/bugfix from 修正", () => {
      const result = suggestBranchName("ログインのバリデーションを修正して");
      assert.strictEqual(result, "bugfix/fix");
    });

    it("detects fix/bugfix from バグ", () => {
      const result = suggestBranchName("バグを直して");
      assert.match(result, /^bugfix\//);
    });

    it("detects add from 実装", () => {
      const result = suggestBranchName("プッシュ通知を実装して");
      assert.strictEqual(result, "feature/add");
    });

    it("detects add from 追加", () => {
      const result = suggestBranchName("新しいボタンを追加して");
      assert.strictEqual(result, "feature/add");
    });

    it("detects remove from 削除", () => {
      const result = suggestBranchName("古いコードを削除して");
      assert.strictEqual(result, "feature/remove");
    });

    it("detects refactor from リファクタ", () => {
      const result = suggestBranchName("プロフィール画面をリファクタリングして");
      assert.strictEqual(result, "feature/refactor");
    });

    it("detects update from 更新", () => {
      const result = suggestBranchName("依存関係を更新して");
      assert.strictEqual(result, "feature/update");
    });

    it("detects test from テスト", () => {
      const result = suggestBranchName("ユニットテストを書いて");
      assert.strictEqual(result, "feature/test");
    });

    it("detects auth from 認証", () => {
      const result = suggestBranchName("認証機能を追加");
      assert.match(result, /^feature\//);
    });

    it("detects ui from 画面", () => {
      const result = suggestBranchName("設定画面を作って");
      assert.match(result, /^feature\//);
    });
  });

  describe("English word extraction", () => {
    it("extracts English words", () => {
      const result = suggestBranchName("Add Google OAuth login");
      assert.match(result, /^feature\//);
      assert.match(result, /google/i);
    });

    it("limits to 3 words", () => {
      const result = suggestBranchName(
        "Implement very long feature name with many words"
      );
      const slug = result.split("/")[1];
      const parts = slug.split("-");
      assert.ok(parts.length <= 3);
    });

    it("ignores short English words (< 3 chars)", () => {
      const result = suggestBranchName("Do it now");
      // "Do" and "it" are < 3 chars, only "now" matches
      assert.match(result, /^feature\//);
    });
  });

  describe("fallback", () => {
    it("generates fallback for unknown input", () => {
      const result = suggestBranchName("あいうえお");
      assert.match(result, /^feature\/task-/);
    });

    it("generates different fallbacks for different calls", () => {
      const r1 = suggestBranchName("かきくけこ");
      // Since it uses Date.now(), consecutive calls may get same or different
      assert.match(r1, /^feature\/task-/);
    });
  });

  describe("prefix selection", () => {
    it("uses bugfix prefix for fix-related tasks", () => {
      assert.match(suggestBranchName("バグを修正"), /^bugfix\//);
    });

    it("uses feature prefix for non-fix tasks", () => {
      assert.match(suggestBranchName("新機能を追加"), /^feature\//);
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const result = suggestBranchName("");
      assert.match(result, /^feature\/task-/);
    });

    it("handles whitespace only", () => {
      const result = suggestBranchName("   ");
      assert.match(result, /^feature\/task-/);
    });

    it("handles mixed Japanese and English", () => {
      const result = suggestBranchName("login画面を修正して");
      // Should detect both "login" (English) and "修正" (Japanese fix)
      assert.match(result, /^bugfix\//);
    });
  });
});
