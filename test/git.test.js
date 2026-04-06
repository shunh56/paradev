import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, realpathSync } from "fs";
import {
  getWorktreePath,
  isGitRepo,
  getRepoRoot,
  getRepoName,
  getCurrentBranch,
  branchExists,
  createWorktree,
  removeWorktree,
  listWorktrees,
  getDiffStat,
  validateBranchName,
} from "../src/git.js";

// Test repo setup
const TEST_BASE = realpathSync("/tmp") + "/paradev-test-git-" + Date.now();
const TEST_REPO = TEST_BASE + "/test-repo";

describe("git.js — unit tests", () => {
  describe("getWorktreePath", () => {
    it("replaces slashes with dashes", () => {
      assert.strictEqual(
        getWorktreePath("/tmp/my-app", "feature/login-fix"),
        "/tmp/my-app__feature-login-fix"
      );
    });

    it("handles nested branch names", () => {
      assert.strictEqual(
        getWorktreePath("/tmp/my-app", "feature/auth/google"),
        "/tmp/my-app__feature-auth-google"
      );
    });

    it("handles simple branch names", () => {
      assert.strictEqual(
        getWorktreePath("/tmp/my-app", "hotfix"),
        "/tmp/my-app__hotfix"
      );
    });

    it("places worktree in parent directory as sibling", () => {
      const result = getWorktreePath("/projects/my-app", "feature/x");
      assert.match(result, /^\/projects\/my-app__/);
    });
  });

  describe("validateBranchName", () => {
    it("accepts valid branch names", () => {
      assert.deepStrictEqual(validateBranchName("feature/login-fix"), { valid: true });
      assert.deepStrictEqual(validateBranchName("bugfix/issue-123"), { valid: true });
      assert.deepStrictEqual(validateBranchName("hotfix"), { valid: true });
      assert.deepStrictEqual(validateBranchName("feature/auth/google"), { valid: true });
    });

    it("rejects empty branch names", () => {
      assert.strictEqual(validateBranchName("").valid, false);
      assert.strictEqual(validateBranchName("  ").valid, false);
    });

    it("rejects branch names starting with -", () => {
      const result = validateBranchName("-feature");
      assert.strictEqual(result.valid, false);
      assert.match(result.reason, /start with/);
    });

    it("rejects branch names with spaces", () => {
      const result = validateBranchName("feature login");
      assert.strictEqual(result.valid, false);
      assert.match(result.reason, /spaces/);
    });

    it("rejects branch names with ..", () => {
      const result = validateBranchName("feature..login");
      assert.strictEqual(result.valid, false);
      assert.match(result.reason, /\.\./);
    });

    it("rejects branch names with ~", () => {
      assert.strictEqual(validateBranchName("feature~1").valid, false);
    });

    it("rejects branch names with ^", () => {
      assert.strictEqual(validateBranchName("feature^2").valid, false);
    });

    it("rejects branch names with :", () => {
      assert.strictEqual(validateBranchName("feature:login").valid, false);
    });

    it("rejects branch names with backslash", () => {
      assert.strictEqual(validateBranchName("feature\\login").valid, false);
    });

    it("rejects branch names with @{", () => {
      assert.strictEqual(validateBranchName("feature@{0}").valid, false);
    });

    it("rejects branch names ending with .", () => {
      assert.strictEqual(validateBranchName("feature.").valid, false);
    });

    it("rejects branch names ending with .lock", () => {
      assert.strictEqual(validateBranchName("feature.lock").valid, false);
    });
  });

  describe("getRepoName", () => {
    it("extracts repo name from path", () => {
      assert.strictEqual(getRepoName("/Users/shun/projects/my-app"), "my-app");
    });

    it("handles root path", () => {
      assert.strictEqual(getRepoName("/my-app"), "my-app");
    });
  });
});

describe("git.js — integration tests", () => {
  before(() => {
    mkdirSync(TEST_REPO, { recursive: true });
    execSync("git init", { cwd: TEST_REPO, stdio: "pipe" });
    writeFileSync(TEST_REPO + "/README.md", "# Test\n");
    execSync("git add . && git commit -m 'init'", {
      cwd: TEST_REPO,
      stdio: "pipe",
    });
  });

  after(() => {
    // Clean up worktrees first
    try {
      const wts = listWorktrees(TEST_REPO);
      for (const wt of wts) {
        if (wt.path !== TEST_REPO) {
          try {
            removeWorktree(TEST_REPO, wt.path, true);
          } catch {}
        }
      }
    } catch {}
    execSync(`rm -rf "${TEST_BASE}"`, { stdio: "pipe" });
  });

  describe("isGitRepo", () => {
    it("returns true for git repository", () => {
      assert.strictEqual(isGitRepo(TEST_REPO), true);
    });

    it("returns false for non-git directory", () => {
      assert.strictEqual(isGitRepo("/tmp"), false);
    });

    it("returns false for non-existent directory", () => {
      assert.strictEqual(isGitRepo("/tmp/nonexistent-dir-xyz"), false);
    });
  });

  describe("getRepoRoot", () => {
    it("returns the repo root from repo directory", () => {
      const root = getRepoRoot(TEST_REPO);
      assert.strictEqual(root, TEST_REPO);
    });
  });

  describe("getCurrentBranch", () => {
    it("returns current branch name", () => {
      const branch = getCurrentBranch(TEST_REPO);
      assert.match(branch, /^(main|master)$/);
    });
  });

  describe("branchExists", () => {
    it("returns true for existing branch", () => {
      const current = getCurrentBranch(TEST_REPO);
      assert.strictEqual(branchExists(TEST_REPO, current), true);
    });

    it("returns false for non-existing branch", () => {
      assert.strictEqual(
        branchExists(TEST_REPO, "nonexistent-branch-xyz"),
        false
      );
    });
  });

  describe("createWorktree / removeWorktree", () => {
    const WT_PATH = TEST_BASE + "/test-repo__feature-wt-test";

    it("creates a worktree with new branch", () => {
      createWorktree(TEST_REPO, "feature/wt-test", WT_PATH);
      assert.strictEqual(existsSync(WT_PATH), true);
    });

    it("throws when worktree path already exists", () => {
      assert.throws(
        () => createWorktree(TEST_REPO, "feature/wt-test2", WT_PATH),
        /already exists/
      );
    });

    it("throws when parent directory does not exist", () => {
      assert.throws(
        () =>
          createWorktree(
            TEST_REPO,
            "feature/bad",
            "/nonexistent/path/wt"
          ),
        /Parent directory does not exist/
      );
    });

    it("removes a worktree", () => {
      removeWorktree(TEST_REPO, WT_PATH);
      assert.strictEqual(existsSync(WT_PATH), false);
    });
  });

  describe("listWorktrees", () => {
    it("lists the main worktree", () => {
      const wts = listWorktrees(TEST_REPO);
      assert.ok(wts.length >= 1);
      assert.ok(wts.some((w) => w.path === TEST_REPO));
    });
  });

  describe("getDiffStat", () => {
    it("returns zero diff on clean repo", () => {
      const diff = getDiffStat(TEST_REPO);
      assert.strictEqual(diff.files, 0);
      assert.strictEqual(diff.insertions, 0);
      assert.strictEqual(diff.deletions, 0);
    });

    it("returns diff for worktree with changes", () => {
      const wtPath = TEST_BASE + "/test-repo__feature-diff-test";
      createWorktree(TEST_REPO, "feature/diff-test", wtPath);
      writeFileSync(wtPath + "/new-file.js", "console.log('hello');\n");
      execSync("git add . && git commit -m 'add file'", {
        cwd: wtPath,
        stdio: "pipe",
      });
      const diff = getDiffStat(wtPath);
      assert.ok(diff.files > 0);
      assert.ok(diff.insertions > 0);
      // Cleanup
      removeWorktree(TEST_REPO, wtPath, true);
    });

    it("returns zero for non-existent directory", () => {
      const diff = getDiffStat("/tmp/nonexistent-xyz");
      assert.strictEqual(diff.files, 0);
    });
  });

  describe("getRepoRoot from worktree", () => {
    it("resolves to main repo from worktree directory", () => {
      const wtPath = TEST_BASE + "/test-repo__feature-root-test";
      createWorktree(TEST_REPO, "feature/root-test", wtPath);
      const root = getRepoRoot(wtPath);
      assert.strictEqual(root, TEST_REPO);
      removeWorktree(TEST_REPO, wtPath, true);
    });
  });
});
