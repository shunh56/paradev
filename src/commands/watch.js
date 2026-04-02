import chalk from "chalk";
import { isGitRepo, getRepoRoot } from "../git.js";
import { getRepoTasks, updateTask } from "../state.js";
import { isClaudeRunning, sendNotification } from "../claude.js";

export async function watchCommand(options) {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.error(chalk.red("Error: Not a git repository"));
    process.exit(1);
  }

  const repoRoot = getRepoRoot(cwd);
  const interval = (options.interval || 10) * 1000;

  console.log();
  console.log(
    chalk.bold("  paradev watch — Monitoring Claude processes...")
  );
  console.log(chalk.dim(`  Checking every ${interval / 1000}s. Ctrl+C to stop.`));
  console.log();

  const notified = new Set();

  const check = () => {
    const tasks = getRepoTasks(repoRoot);
    let activeCount = 0;

    for (const task of tasks) {
      if (task.status === "claude_ongoing") {
        if (!isClaudeRunning(task.claudePid)) {
          // Claude just finished
          updateTask(repoRoot, task.branch, {
            status: "review",
            claudePid: null,
          });

          if (!notified.has(task.branch)) {
            notified.add(task.branch);
            const now = new Date().toLocaleTimeString();
            console.log(
              chalk.green(`  [${now}] ${task.branch}: Claude completed`)
            );
            sendNotification(
              "paradev",
              `${task.branch}: Claude completed`
            );
          }
        } else {
          activeCount++;
        }
      }
    }

    if (activeCount === 0 && tasks.some((t) => t.status !== "idle")) {
      console.log();
      console.log(chalk.green("  All Claude processes completed."));
      console.log();
      process.exit(0);
    }
  };

  // Initial check
  check();

  // Poll
  setInterval(check, interval);
}
