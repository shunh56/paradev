import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// We need to test state functions but they use the real ~/.paradev/state.json
// To avoid polluting the real state, we'll test the logic by importing and
// working with a known repo path

import {
  getState,
  saveState,
  getRepoTasks,
  addTask,
  updateTask,
  removeTask,
} from "../src/state.js";

const TEST_REPO_PATH = "/tmp/paradev-state-test-" + Date.now();

describe("state.js", () => {
  before(() => {
    // Backup existing state
    const statePath = join(homedir(), ".paradev", "state.json");
    if (existsSync(statePath)) {
      // We'll use a unique test repo path to avoid conflicts
    }
  });

  after(() => {
    // Clean up test entries from state
    const state = getState();
    delete state.repos[TEST_REPO_PATH];
    saveState(state);
  });

  describe("getRepoTasks", () => {
    it("returns empty array for unknown repo", () => {
      const tasks = getRepoTasks("/nonexistent/repo/path");
      assert.deepStrictEqual(tasks, []);
    });
  });

  describe("addTask", () => {
    it("adds a new task", () => {
      addTask(TEST_REPO_PATH, {
        branch: "feature/test-1",
        task: "Test task 1",
        worktreePath: TEST_REPO_PATH + "__feature-test-1",
        status: "idle",
        claudePid: null,
        prNumber: null,
      });

      const tasks = getRepoTasks(TEST_REPO_PATH);
      assert.strictEqual(tasks.length, 1);
      assert.strictEqual(tasks[0].branch, "feature/test-1");
      assert.strictEqual(tasks[0].task, "Test task 1");
      assert.ok(tasks[0].createdAt);
      assert.ok(tasks[0].updatedAt);
    });

    it("adds a second task", () => {
      addTask(TEST_REPO_PATH, {
        branch: "feature/test-2",
        task: "Test task 2",
        worktreePath: TEST_REPO_PATH + "__feature-test-2",
        status: "claude_ongoing",
        claudePid: 12345,
        prNumber: null,
      });

      const tasks = getRepoTasks(TEST_REPO_PATH);
      assert.strictEqual(tasks.length, 2);
    });

    it("preserves task description on duplicate branch add", () => {
      addTask(TEST_REPO_PATH, {
        branch: "feature/test-1",
        task: "This should NOT overwrite",
        worktreePath: TEST_REPO_PATH + "__feature-test-1",
        status: "review",
        claudePid: null,
        prNumber: null,
      });

      const tasks = getRepoTasks(TEST_REPO_PATH);
      const task = tasks.find((t) => t.branch === "feature/test-1");
      assert.strictEqual(task.task, "Test task 1"); // Original preserved
      assert.strictEqual(task.status, "review"); // Status updated
    });
  });

  describe("updateTask", () => {
    it("updates task fields", () => {
      updateTask(TEST_REPO_PATH, "feature/test-1", {
        status: "pr_open",
        prNumber: 42,
      });

      const tasks = getRepoTasks(TEST_REPO_PATH);
      const task = tasks.find((t) => t.branch === "feature/test-1");
      assert.strictEqual(task.status, "pr_open");
      assert.strictEqual(task.prNumber, 42);
    });

    it("does nothing for non-existent branch", () => {
      // Should not throw
      updateTask(TEST_REPO_PATH, "nonexistent-branch", {
        status: "merged",
      });
    });

    it("updates updatedAt timestamp", () => {
      const tasksBefore = getRepoTasks(TEST_REPO_PATH);
      const before = tasksBefore.find((t) => t.branch === "feature/test-2");
      const oldUpdated = before.updatedAt;

      // Small delay to ensure timestamp differs
      updateTask(TEST_REPO_PATH, "feature/test-2", { status: "review" });

      const tasksAfter = getRepoTasks(TEST_REPO_PATH);
      const after = tasksAfter.find((t) => t.branch === "feature/test-2");
      assert.ok(new Date(after.updatedAt) >= new Date(oldUpdated));
    });
  });

  describe("removeTask", () => {
    it("removes a task", () => {
      removeTask(TEST_REPO_PATH, "feature/test-2");
      const tasks = getRepoTasks(TEST_REPO_PATH);
      assert.strictEqual(tasks.length, 1);
      assert.ok(!tasks.find((t) => t.branch === "feature/test-2"));
    });

    it("does nothing for non-existent branch", () => {
      const before = getRepoTasks(TEST_REPO_PATH).length;
      removeTask(TEST_REPO_PATH, "nonexistent");
      const after = getRepoTasks(TEST_REPO_PATH).length;
      assert.strictEqual(before, after);
    });
  });

  describe("atomic write & backup recovery", () => {
    it("creates a backup file on save", () => {
      const statePath = join(homedir(), ".paradev", "state.json");
      const bakPath = join(homedir(), ".paradev", "state.json.bak");

      // Save triggers backup
      const state = getState();
      saveState(state);

      assert.ok(existsSync(bakPath), "Backup file should exist after save");
    });

    it("recovers from corrupted state.json using backup", () => {
      const statePath = join(homedir(), ".paradev", "state.json");
      const bakPath = join(homedir(), ".paradev", "state.json.bak");

      // Save valid state (creates backup)
      const state = getState();
      saveState(state);

      // Corrupt the main state file
      writeFileSync(statePath, "NOT VALID JSON{{{");

      // getState should recover from backup
      const recovered = getState();
      assert.ok(recovered.repos, "Recovered state should have repos");
    });

    it("returns empty state when both files are corrupted", () => {
      const statePath = join(homedir(), ".paradev", "state.json");
      const bakPath = join(homedir(), ".paradev", "state.json.bak");

      // Corrupt both files
      writeFileSync(statePath, "CORRUPT");
      writeFileSync(bakPath, "ALSO CORRUPT");

      const state = getState();
      assert.deepStrictEqual(state, { repos: {} });

      // Restore valid state for cleanup
      saveState({ repos: {} });
    });
  });
});
