import chalk from "chalk";
import { isGitRepo, getRepoRoot } from "../git.js";
import { getRepoTasks, updateTask } from "../state.js";
import { sendNotification } from "../claude.js";

export async function stopCommand(branch) {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.error(chalk.red("Error: Not a git repository"));
    process.exit(1);
  }

  const repoRoot = getRepoRoot(cwd);
  const tasks = getRepoTasks(repoRoot);
  const task = tasks.find((t) => t.branch === branch);

  if (!task) {
    console.error(chalk.red(`Error: Task not found for branch "${branch}"`));
    console.log(chalk.dim("  Run `paradev list` to see active tasks"));
    process.exit(1);
  }

  // Kill the Claude process if running
  if (task.claudePid) {
    try {
      process.kill(task.claudePid, "SIGTERM");
      console.log(chalk.yellow(`  Stopped Claude for ${branch}`));
    } catch {
      // Process already dead
    }
  }

  updateTask(repoRoot, branch, {
    status: "review",
    claudePid: null,
  });

  sendNotification("paradev", `${branch}: Claude stopped → Review待ち`);

  console.log(
    chalk.green(`  ${branch} → 👀 Review待ち`)
  );
}
