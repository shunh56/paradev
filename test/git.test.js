import { describe, it } from "node:test";
import assert from "node:assert";
import { getWorktreePath } from "../src/git.js";

describe("getWorktreePath", () => {
  it("replaces slashes with dashes", () => {
    const result = getWorktreePath("/tmp/my-app", "feature/login-fix");
    assert.strictEqual(result, "/tmp/my-app__feature-login-fix");
  });

  it("handles nested branch names", () => {
    const result = getWorktreePath("/tmp/my-app", "feature/auth/google");
    assert.strictEqual(result, "/tmp/my-app__feature-auth-google");
  });

  it("handles simple branch names", () => {
    const result = getWorktreePath("/tmp/my-app", "hotfix");
    assert.strictEqual(result, "/tmp/my-app__hotfix");
  });
});
