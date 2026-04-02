import chalk from "chalk";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { select, confirm } from "../interactive.js";
import { setTerminalTitle } from "../interactive.js";
import { isGitRepo, getRepoRoot, getDiffStat } from "../git.js";
import { getRepoTasks, updateTask } from "../state.js";
import { isClaudeRunning, launchClaudeInTerminal } from "../claude.js";

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
    // Interactive selection
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
    console.error(chalk.red(`  Error: Worktree not found at ${task.worktreePath}`));
    return;
  }

  // Ask about Claude
  let launchClaude = false;
  if (task.status !== "claude_ongoing") {
    try {
      launchClaude = await confirm({
        message: "Claude Code を起動しますか？",
        default: true,
      });
    } catch {
      return;
    }
  }

  if (launchClaude) {
    console.log();
    console.log(chalk.dim(`  Launching Claude in ${task.branch} ...`));
    try {
      const pid = launchClaudeInTerminal(task.worktreePath, task.task, task.branch);
      updateTask(repoRoot, task.branch, { status: "claude_ongoing", claudePid: pid });
      console.log(chalk.green(`  ✓ Claude started in new terminal`));
    } catch {
      console.log(chalk.yellow("  Could not launch Claude"));
    }
  } else {
    // Open a new terminal at the worktree path
    console.log();
    console.log(chalk.dim(`  Opening terminal in ${task.branch} ...`));
    try {
      openTerminalAt(task.worktreePath, task.branch);
      console.log(chalk.green(`  ✓ Terminal opened`));
    } catch {
      // Fallback: just print the path
      console.log();
      console.log(chalk.bold(`  cd ${task.worktreePath}`));
      console.log(chalk.dim("  ↑ Copy this to navigate to the worktree"));
    }
  }
  console.log();
}

function openTerminalAt(worktreePath, branchName) {
  const escapedPath = worktreePath.replace(/'/g, "'\\''");
  const title = `[paradev] ${branchName}`;
  const escapedTitle = title.replace(/'/g, "'\\''");

  const script = `
    tell application "Terminal"
      activate
      do script "printf '\\\\e]0;${escapedTitle}\\\\a' && cd '${escapedPath}' && echo '\\n  📂 paradev worktree: ${branchName}\\n'"
    end tell
  `;

  execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
    stdio: "pipe",
  });
}
