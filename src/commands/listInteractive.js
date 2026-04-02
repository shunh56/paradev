import chalk from "chalk";
import Table from "cli-table3";
import { select } from "../interactive.js";
import {
  isGitRepo,
  getRepoRoot,
  getDiffStat,
} from "../git.js";
import { getRepoTasks, updateTask } from "../state.js";
import { isClaudeRunning } from "../claude.js";
import { getPRsForBranches } from "../github.js";
import { goCommand } from "./go.js";
import { stopCommand } from "./stop.js";
import { prCommand } from "./pr.js";
import { cleanCommand } from "./clean.js";

const STATUS_DISPLAY = {
  claude_ongoing: { icon: "\u{1F916}", label: "Claude ongoing", color: "cyan" },
  review: { icon: "\u{1F440}", label: "Review\u5F85\u3061", color: "yellow" },
  pr_open: { icon: "\u2705", label: "PR Open", color: "green" },
  idle: { icon: "\u{1F4A4}", label: "Idle", color: "gray" },
  merged: { icon: "\u{1F389}", label: "Merged", color: "magenta" },
};

function formatElapsed(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function renderTable(tasks) {
  const table = new Table({
    head: [
      chalk.bold("Branch"),
      chalk.bold("Status"),
      chalk.bold("Time"),
      chalk.bold("PR"),
      chalk.bold("Diff"),
    ],
    style: { head: [], border: ["dim"] },
    chars: {
      top: "\u2500", "top-mid": "\u252C", "top-left": "\u250C", "top-right": "\u2510",
      bottom: "\u2500", "bottom-mid": "\u2534", "bottom-left": "\u2514", "bottom-right": "\u2518",
      left: "\u2502", "left-mid": "\u251C", mid: "\u2500", "mid-mid": "\u253C",
      right: "\u2502", "right-mid": "\u2524", middle: "\u2502",
    },
  });

  for (const task of tasks) {
    const statusInfo = STATUS_DISPLAY[task.status] || STATUS_DISPLAY.idle;
    const statusStr = `${statusInfo.icon}  ${statusInfo.label}`;
    const elapsed = formatElapsed(task.createdAt);
    const prStr = task.prNumber ? `#${task.prNumber}` : "-";

    const diff = getDiffStat(task.worktreePath);
    const diffStr =
      diff.files > 0
        ? chalk.green(`+${diff.insertions}`) + chalk.dim("/") + chalk.red(`-${diff.deletions}`)
        : chalk.dim("-");

    table.push([
      chalk[statusInfo.color](task.branch),
      statusStr,
      chalk.dim(elapsed),
      chalk.dim(prStr),
      diffStr,
    ]);
  }

  console.log();
  console.log(table.toString());
  console.log();
}

export async function listInteractiveCommand() {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.error(chalk.red("  Error: Not a git repository"));
    return;
  }

  const repoRoot = getRepoRoot(cwd);

  while (true) {
    const tasks = getRepoTasks(repoRoot);

    if (tasks.length === 0) {
      console.log();
      console.log(chalk.dim("  No active tasks. Run `paradev add` to begin."));
      console.log();
      return;
    }

    // Update Claude process status
    for (const task of tasks) {
      if (task.status === "claude_ongoing" && !isClaudeRunning(task.claudePid)) {
        updateTask(repoRoot, task.branch, { status: "review", claudePid: null });
        task.status = "review";
        task.claudePid = null;
      }
    }

    // Fetch GitHub PR status
    const branches = tasks.map((t) => t.branch);
    const prMap = getPRsForBranches(repoRoot, branches);
    for (const task of tasks) {
      const pr = prMap[task.branch];
      if (pr) {
        const newStatus =
          pr.state === "MERGED" ? "merged" : pr.state === "OPEN" ? "pr_open" : task.status;
        if (task.prNumber !== pr.number || task.status !== newStatus) {
          updateTask(repoRoot, task.branch, { prNumber: pr.number, status: newStatus });
          task.prNumber = pr.number;
          task.status = newStatus;
        }
      }
    }

    renderTable(tasks);

    // Action menu
    let action;
    try {
      action = await select({
        message: "アクション",
        choices: [
          { name: "📂 ワークツリーに入る", value: "go" },
          { name: "🤖 Claude を起動する", value: "claude" },
          { name: "📝 PR テンプレートを生成", value: "pr" },
          { name: "⏹  ブランチを停止する", value: "stop" },
          { name: "🧹 ワークツリーを削除する", value: "clean" },
          { name: "🔄 更新", value: "refresh" },
          { name: "← 戻る", value: "back" },
        ],
      });
    } catch {
      return;
    }

    if (action === "back") return;
    if (action === "refresh") continue;

    // Select branch for the action
    if (action === "go") {
      await goCommand();
      continue;
    }

    if (action === "clean") {
      await cleanCommand({ all: false, force: false, interactive: true });
      continue;
    }

    // For stop, pr, claude — select a branch
    let selectedBranch;
    try {
      selectedBranch = await select({
        message: "対象のブランチ:",
        choices: [
          ...tasks.map((t) => {
            const icon = STATUS_DISPLAY[t.status]?.icon || "💤";
            return { name: `${icon}  ${t.branch}`, value: t.branch };
          }),
          { name: "← 戻る", value: "__back__" },
        ],
      });
    } catch {
      return;
    }

    if (selectedBranch === "__back__") continue;

    if (action === "stop") {
      await stopCommand(selectedBranch);
    } else if (action === "pr") {
      await prCommand(selectedBranch, {});
    } else if (action === "claude") {
      await goCommand(selectedBranch);
    }
  }
}
