import chalk from "chalk";
import { existsSync } from "fs";
import { isGitRepo, getRepoRoot, removeWorktree } from "../git.js";
import { getRepoTasks, removeTask } from "../state.js";

export async function cleanCommand(options) {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.error(chalk.red("Error: Not a git repository"));
    process.exit(1);
  }

  const repoRoot = getRepoRoot(cwd);
  const tasks = getRepoTasks(repoRoot);

  if (tasks.length === 0) {
    console.log(chalk.dim("  No tasks to clean."));
    return;
  }

  const toClean = options.all
    ? tasks
    : tasks.filter((t) => t.status === "merged");

  if (toClean.length === 0) {
    console.log(chalk.dim("  No merged branches to clean."));
    console.log(chalk.dim("  Use --all to remove all worktrees."));
    return;
  }

  console.log();
  for (const task of toClean) {
    process.stdout.write(
      chalk.dim(`  Removing worktree: ${task.branch} ... `)
    );

    try {
      if (existsSync(task.worktreePath)) {
        removeWorktree(repoRoot, task.worktreePath, options.force || false);
      }
      removeTask(repoRoot, task.branch);
      console.log(chalk.green("done"));
    } catch (e) {
      console.log(chalk.red("failed"));
      console.error(chalk.red(`    ${e.message}`));
      if (!options.force) {
        console.log(chalk.dim("    Use --force to force removal"));
      }
    }
  }
  console.log();
}
