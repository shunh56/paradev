import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import chalk from "chalk";
import {
  isGitRepo,
  getRepoRoot,
  createWorktree,
  getWorktreePath,
} from "../git.js";
import { addTask } from "../state.js";
import { launchClaude } from "../claude.js";

export async function startCommand(file, options) {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.error(chalk.red("Error: Not a git repository"));
    process.exit(1);
  }

  const repoRoot = getRepoRoot(cwd);
  let tasks = [];

  // Parse tasks from file or inline options
  if (file) {
    const filePath = resolve(cwd, file);
    if (!existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }
    try {
      const content = readFileSync(filePath, "utf-8");
      tasks = JSON.parse(content);
    } catch (e) {
      console.error(chalk.red(`Error: Invalid JSON in ${filePath}`));
      console.error(e.message);
      process.exit(1);
    }
  } else if (options.task) {
    // Parse inline tasks: "branch:description"
    tasks = options.task.map((t) => {
      const colonIdx = t.indexOf(":");
      if (colonIdx === -1) {
        console.error(
          chalk.red(
            `Error: Invalid task format "${t}". Use "branch:description"`
          )
        );
        process.exit(1);
      }
      return {
        branch: t.substring(0, colonIdx).trim(),
        task: t.substring(colonIdx + 1).trim(),
      };
    });
  } else {
    console.error(
      chalk.red("Error: Provide a tasks.json file or use --task flag")
    );
    console.log();
    console.log(chalk.dim("Usage:"));
    console.log(chalk.dim('  paradev start tasks.json'));
    console.log(
      chalk.dim(
        '  paradev start --task "feature/login:ログイン画面を修正"'
      )
    );
    process.exit(1);
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.error(chalk.red("Error: No tasks found"));
    process.exit(1);
  }

  // Validate tasks
  for (const task of tasks) {
    if (!task.branch || !task.task) {
      console.error(
        chalk.red(
          'Error: Each task must have "branch" and "task" fields'
        )
      );
      process.exit(1);
    }
  }

  console.log();
  console.log(
    chalk.bold(`  paradev — Starting ${tasks.length} parallel task(s)`)
  );
  console.log();

  for (const task of tasks) {
    const worktreePath = getWorktreePath(repoRoot, task.branch);

    // Create worktree
    try {
      process.stdout.write(
        chalk.dim(`  Creating worktree: ${task.branch} ... `)
      );
      createWorktree(repoRoot, task.branch, worktreePath);
      console.log(chalk.green("done"));
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log(chalk.yellow("already exists"));
      } else {
        console.log(chalk.red("failed"));
        console.error(chalk.red(`    ${e.message}`));
        continue;
      }
    }

    // Launch Claude (unless --no-claude)
    let claudePid = null;
    if (options.claude !== false) {
      try {
        process.stdout.write(
          chalk.dim(`  Launching Claude: ${task.branch} ... `)
        );
        claudePid = launchClaude(worktreePath, task.task);
        console.log(chalk.green("done"));
      } catch (e) {
        console.log(chalk.yellow("skipped (claude not found?)"));
      }
    }

    // Save state
    addTask(repoRoot, {
      branch: task.branch,
      task: task.task,
      worktreePath,
      status: claudePid ? "claude_ongoing" : "idle",
      claudePid,
      prNumber: null,
    });
  }

  console.log();
  console.log(chalk.green("  All tasks started!"));
  console.log(chalk.dim("  Run `paradev list` to check status"));
  console.log();
}
