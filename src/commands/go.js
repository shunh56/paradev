import chalk from "chalk";
import { existsSync } from "fs";
import { select, confirm } from "../interactive.js";
import { isGitRepo, getRepoRoot, getDiffStat } from "../git.js";
import { getRepoTasks, updateTask } from "../state.js";
import {
  isClaudeRunning,
  launchClaudeInTerminal,
  focusClaudeTerminal,
} from "../claude.js";
import { openTerminal, detectEnvironment } from "../terminal.js";

const STATUS_ICONS = {
  claude_ongoing: "🤖",
  review: "👀",
  pr_open: "✅",
  idle: "💤",
  merged: "🎉",
};

export async function goCommand(branch) {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.error(chalk.red("  Error: Not a git repository"));
    return;
  }

  const repoRoot = getRepoRoot(cwd);
  const tasks = getRepoTasks(repoRoot);

  if (tasks.length === 0) {
    console.log(chalk.dim("  No active tasks. Run `paradev add` to begin."));
    return;
  }

  // Update Claude status
  for (const task of tasks) {
    if (task.status === "claude_ongoing" && !isClaudeRunning(task.claudePid)) {
      updateTask(repoRoot, task.branch, { status: "review", claudePid: null });
      task.status = "review";
    }
  }

  // If branch specified directly, use it
  let selectedBranch = branch;

  if (!selectedBranch) {
    const choices = tasks.map((t) => {
      const icon = STATUS_ICONS[t.status] || "💤";
      const diff = getDiffStat(t.worktreePath);
      const diffStr =
        diff.files > 0 ? `+${diff.insertions}/-${diff.deletions}` : "";
      return {
        name: `${icon}  ${t.branch}  ${chalk.dim(diffStr)}`,
        value: t.branch,
      };
    });

    try {
      selectedBranch = await select({
        message: "どのブランチに入りますか？",
        choices,
      });
    } catch {
      return;
    }
  }

  const task = tasks.find((t) => t.branch === selectedBranch);
  if (!task) {
    console.error(chalk.red(`  Error: Branch "${selectedBranch}" not found`));
    return;
  }

  if (!existsSync(task.worktreePath)) {
    console.error(
      chalk.red(`  Error: Worktree not found at ${task.worktreePath}`)
    );
    return;
  }

  const env = detectEnvironment();

  // If Claude is already running, offer to focus the existing terminal
  if (task.status === "claude_ongoing" && isClaudeRunning(task.claudePid)) {
    let action;
    try {
      action = await select({
        message: `${task.branch} で Claude が実行中です`,
        choices: [
          { name: "既存のターミナルに移動する", value: "focus" },
          { name: "新しいターミナルを開く (Claude なし)", value: "new" },
          { name: "キャンセル", value: "cancel" },
        ],
      });
    } catch {
      return;
    }

    if (action === "cancel") return;

    if (action === "focus") {
      console.log(chalk.dim(`  → ${task.branch} のターミナルにフォーカス中...`));
      const focused = focusClaudeTerminal(task.branch);
      if (focused) {
        console.log(chalk.green(`  ✓ ターミナルに移動しました`));
      } else {
        console.log(
          chalk.yellow(`  ターミナルが見つかりません。新しく開きます...`)
        );
        openTerminalAt(task.worktreePath, task.branch, env);
      }
      console.log();
      return;
    }

    if (action === "new") {
      openTerminalAt(task.worktreePath, task.branch, env);
      console.log();
      return;
    }
  }

  // Not running — ask about Claude
  let launchClaude = false;
  try {
    launchClaude = await confirm({
      message: "Claude Code を起動しますか？",
      default: true,
    });
  } catch {
    return;
  }

  if (launchClaude) {
    console.log();
    console.log(chalk.dim(`  Launching Claude in ${task.branch} ...`));
    try {
      const pid = launchClaudeInTerminal(
        task.worktreePath,
        task.task,
        task.branch
      );
      updateTask(repoRoot, task.branch, {
        status: "claude_ongoing",
        claudePid: pid,
      });
      console.log(chalk.green(`  ✓ Claude started in new terminal`));
    } catch {
      console.log(chalk.yellow("  Could not launch Claude"));
    }
  } else {
    openTerminalAt(task.worktreePath, task.branch, env);
  }
  console.log();
}

function openTerminalAt(worktreePath, branchName, env) {
  console.log();
  console.log(chalk.dim(`  Opening terminal in ${branchName} ...`));
  const envLabel =
    env === "antigravity"
      ? "Antigravity"
      : env === "cursor"
        ? "Cursor"
        : env === "vscode"
          ? "VS Code"
          : "Terminal";
  try {
    openTerminal(
      worktreePath,
      `echo '  📂 [paradev] ${branchName}'`,
      branchName,
      env
    );
    console.log(chalk.green(`  ✓ ${envLabel} にターミナルを開きました`));
  } catch {
    console.log();
    console.log(chalk.bold(`  cd ${worktreePath}`));
    console.log(chalk.dim("  ↑ Copy this to navigate to the worktree"));
  }
}
