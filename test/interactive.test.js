import { describe, it } from "node:test";
import assert from "node:assert";
import { suggestBranchName } from "../src/interactive.js";

describe("suggestBranchName", () => {
  it("detects fix/bugfix from Japanese", () => {
    const result = suggestBranchName("ログインのバリデーションを修正して");
    assert.strictEqual(result, "bugfix/fix");
  });

  it("detects add from Japanese", () => {
    const result = suggestBranchName("プッシュ通知を実装して");
    assert.strictEqual(result, "feature/add");
  });

  it("detects refactor from Japanese", () => {
    const result = suggestBranchName("プロフィール画面をリファクタリングして");
    assert.strictEqual(result, "feature/refactor");
  });

  it("extracts English words", () => {
    const result = suggestBranchName("Add Google OAuth login");
    assert.match(result, /^feature\//);
    assert.match(result, /google/i);
  });

  it("generates fallback for unknown input", () => {
    const result = suggestBranchName("あいうえお");
    assert.match(result, /^feature\/task-/);
  });
});
