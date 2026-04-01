import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { ensureParadevDir, PARADEV_DIR } from "./config.js";

const STATE_PATH = join(PARADEV_DIR, "state.json");

/**
 * State schema:
 * {
 *   "repos": {
 *     "/absolute/path/to/repo": {
 *       "tasks": [
 *         {
 *           "branch": "feature/login-fix",
 *           "task": "ログインのバリデーションを修正",
 *           "worktreePath": "/path/to/repo__login-fix",
 *           "status": "claude_ongoing" | "review" | "pr_open" | "idle" | "merged",
 *           "claudePid": 12345 | null,
 *           "createdAt": "2025-01-01T00:00:00Z",
 *           "updatedAt": "2025-01-01T00:00:00Z",
 *           "prNumber": null | 42
 *         }
 *       ]
 *     }
 *   }
 * }
 */

export function getState() {
  ensureParadevDir();
  if (!existsSync(STATE_PATH)) {
    return { repos: {} };
  }
  return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
}

export function saveState(state) {
  ensureParadevDir();
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function getRepoTasks(repoPath) {
  const state = getState();
  return state.repos[repoPath]?.tasks || [];
}

export function addTask(repoPath, task) {
  const state = getState();
  if (!state.repos[repoPath]) {
    state.repos[repoPath] = { tasks: [] };
  }

  const existing = state.repos[repoPath].tasks.findIndex(
    (t) => t.branch === task.branch
  );
  if (existing >= 0) {
    state.repos[repoPath].tasks[existing] = {
      ...state.repos[repoPath].tasks[existing],
      ...task,
      updatedAt: new Date().toISOString(),
    };
  } else {
    state.repos[repoPath].tasks.push({
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveState(state);
}

export function updateTask(repoPath, branch, updates) {
  const state = getState();
  const tasks = state.repos[repoPath]?.tasks || [];
  const idx = tasks.findIndex((t) => t.branch === branch);
  if (idx >= 0) {
    tasks[idx] = {
      ...tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveState(state);
  }
}

export function removeTask(repoPath, branch) {
  const state = getState();
  const tasks = state.repos[repoPath]?.tasks || [];
  state.repos[repoPath].tasks = tasks.filter((t) => t.branch !== branch);
  saveState(state);
}
