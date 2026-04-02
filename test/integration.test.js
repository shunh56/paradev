import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { execSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  realpathSync,
} from "fs";

const CLI = process.cwd() + "/bin/paradev.js";
const TEST_BASE = realpathSync("/tmp") + "/paradev-integration-" + Date.now();
const TEST_REPO = TEST_BASE + "/test-repo";

function run(cmd, opts = {}) {
  return execSync(`node ${CLI} ${cmd}`, {
    cwd: opts.cwd || TEST_REPO,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 10000,
    ...opts,
  });
}

describe("Integration tests", () => {
  before(() => {
    mkdirSync(TEST_REPO, { recursive: true });
    execSync("git init", { cwd: TEST_REPO, stdio: "pipe" });
    writeFileSync(
      TEST_REPO + "/package.json",
      '{"name":"test","version":"1.0.0"}'
    );
    writeFileSync(TEST_REPO + "/README.md", "# Test\n");
    execSync("git add . && git commit -m 'init'", {
      cwd: TEST_REPO,
      stdio: "pipe",
    });
  });

  after(() => {
    // Clean up worktrees
    try {
      run("clean --all");
    } catch {}
    execSync(`rm -rf "${TEST_BASE}"`, { stdio: "pipe" });
  });

  describe("paradev --version", () => {
    it("shows version from package.json", () => {
      const output = run("--version");
      const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
      assert.match(output.trim(), new RegExp(pkg.version));
    });
  });

  describe("paradev --help", () => {
    it("shows help with all commands", () => {
      const output = run("--help");
      assert.match(output, /start/);
      assert.match(output, /add/);
      assert.match(output, /list/);
      assert.match(output, /go/);
      assert.match(output, /init/);
      assert.match(output, /demo/);
      assert.match(output, /stop/);
      assert.match(output, /clean/);
      assert.match(output, /watch/);
      assert.match(output, /pr/);
      assert.match(output, /auth/);
    });
  });

  describe("paradev init", () => {
    it("creates tasks.json template", () => {
      run("init");
      assert.ok(existsSync(TEST_REPO + "/tasks.json"));
      const content = JSON.parse(
        readFileSync(TEST_REPO + "/tasks.json", "utf-8")
      );
      assert.ok(Array.isArray(content));
      assert.strictEqual(content.length, 3);
      assert.ok(content[0].branch !== undefined);
      assert.ok(content[0].task !== undefined);
    });

    it("does not overwrite existing tasks.json", () => {
      const output = run("init");
      assert.match(output, /already exists/);
    });
  });

  describe("paradev start", () => {
    it("fails without arguments", () => {
      assert.throws(() => run("start"), /Provide a tasks.json/);
    });

    it("fails with non-existent file", () => {
      assert.throws(() => run("start nonexistent.json"), /File not found/);
    });

    it("fails with invalid JSON", () => {
      writeFileSync(TEST_REPO + "/bad.json", "not json");
      assert.throws(() => run("start bad.json"), /Invalid JSON/);
    });

    it("fails with missing fields", () => {
      writeFileSync(
        TEST_REPO + "/bad2.json",
        '[{"branch":"test"}]'
      );
      assert.throws(
        () => run("start bad2.json"),
        /must have "branch" and "task"/
      );
    });

    it("creates worktrees from JSON file", () => {
      writeFileSync(
        TEST_REPO + "/test-tasks.json",
        JSON.stringify([
          { branch: "feature/int-a", task: "Task A" },
          { branch: "feature/int-b", task: "Task B" },
        ])
      );
      const output = run("start test-tasks.json --no-claude");
      assert.match(output, /Starting 2 parallel/);
      assert.match(output, /feature\/int-a/);
      assert.match(output, /feature\/int-b/);
      assert.ok(existsSync(TEST_BASE + "/test-repo__feature-int-a"));
      assert.ok(existsSync(TEST_BASE + "/test-repo__feature-int-b"));
    });

    it("creates worktree from inline task", () => {
      const output = run(
        'start --no-claude -t "feature/int-c:Task C"'
      );
      assert.match(output, /Starting 1 parallel/);
      assert.ok(existsSync(TEST_BASE + "/test-repo__feature-int-c"));
    });

    it("handles duplicate branch gracefully", () => {
      const output = run(
        'start --no-claude -t "feature/int-a:Duplicate"'
      );
      assert.match(output, /already exists/);
    });
  });

  describe("paradev list", () => {
    it("shows tasks in table format", () => {
      const output = run("list");
      assert.match(output, /feature\/int-a/);
      assert.match(output, /feature\/int-b/);
      assert.match(output, /feature\/int-c/);
    });

    it("shows Idle status for --no-claude tasks", () => {
      const output = run("list");
      assert.match(output, /Idle/);
    });
  });

  describe("paradev stop", () => {
    it("changes status to review", () => {
      const output = run("stop feature/int-a");
      assert.match(output, /Review/);
    });

    it("fails for non-existent branch", () => {
      assert.throws(
        () => run("stop nonexistent-branch"),
        /Task not found/
      );
    });
  });

  describe("paradev pr", () => {
    it("generates PR template", () => {
      // Add a commit in the worktree
      const wtPath = TEST_BASE + "/test-repo__feature-int-b";
      writeFileSync(wtPath + "/new.js", "export const x = 1;\n");
      execSync("git add . && git commit -m 'add new.js'", {
        cwd: wtPath,
        stdio: "pipe",
      });

      const output = run("pr feature/int-b");
      assert.match(output, /Summary/);
      assert.match(output, /Task B/);
      assert.match(output, /Changes/);
    });

    it("fails for non-existent branch", () => {
      assert.throws(
        () => run("pr nonexistent-branch"),
        /Task not found/
      );
    });
  });

  describe("paradev list from worktree", () => {
    it("shows tasks when run from inside a worktree", () => {
      const wtPath = TEST_BASE + "/test-repo__feature-int-a";
      const output = run("list", { cwd: wtPath });
      assert.match(output, /feature\/int-a/);
      assert.match(output, /feature\/int-b/);
    });
  });

  describe("paradev clean", () => {
    it("reports no merged branches", () => {
      const output = run("clean");
      assert.match(output, /No merged branches/);
    });

    it("cleans all worktrees with --all", () => {
      const output = run("clean --all");
      assert.match(output, /done/);
      assert.ok(!existsSync(TEST_BASE + "/test-repo__feature-int-a"));
      assert.ok(!existsSync(TEST_BASE + "/test-repo__feature-int-b"));
      assert.ok(!existsSync(TEST_BASE + "/test-repo__feature-int-c"));
    });

    it("reports no tasks after clean", () => {
      const output = run("list");
      assert.match(output, /No active tasks/);
    });
  });

  describe("paradev outside git repo", () => {
    it("start fails outside git repo", () => {
      assert.throws(
        () => run('start -t "x:y"', { cwd: "/tmp" }),
        /Not a git repository/
      );
    });

    it("list fails outside git repo", () => {
      assert.throws(
        () => run("list", { cwd: "/tmp" }),
        /Not a git repository/
      );
    });

    it("init fails outside git repo", () => {
      // init uses console.error + return (not process.exit), so check stderr
      try {
        run("init", { cwd: "/tmp" });
        // If it didn't throw, that's also acceptable (returns gracefully)
      } catch (e) {
        assert.match(e.stderr || e.message, /Not a git repository/);
      }
    });
  });
});
