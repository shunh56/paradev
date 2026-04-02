import chalk from "chalk";
import { input, confirm, select, checkbox } from "../interactive.js";
import { suggestBranchName } from "../interactive.js";
import {
  isGitRepo,
  getRepoRoot,
  createWorktree,
  getWorktreePath,
} from "../git.js";
import { addTask } from "../state.js";
import { launchClaudeInTerminal } from "../claude.js";

export async function addCommand() {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.error(chalk.red("  Error: Not a git repository"));
    return;
  }

  const repoRoot = getRepoRoot(cwd);
  const tasks = [];

  console.log();
  console.log(chalk.bold("  新しいタスクを追加"));
  console.log(chalk.dim("  (完了したら「追加しない」を選択)"));
  console.log();

  while (true) {
    let taskDesc;
    try {
      taskDesc = await input({
        message: "Claude への指示:",
        validate: (v) => (v.trim() ? true : "指示を入力してください"),
      });
    } catch {
      break;
    }

    const suggested = suggestBranchName(taskDesc);

    let branch;
    try {
      branch = await input({
        message: "ブランチ名:",
        default: suggested,
        validate: (v) => (v.trim() ? true : "ブランチ名を入力してください"),
      });
    } catch {
      break;
    }

    tasks.push({ branch: branch.trim(), task: taskDesc.trim() });

    console.log(chalk.green(`  ✓ ${branch}`));

    let addMore;
    try {
      addMore = await confirm({
        message: "さらにタスクを追加する？",
        default: false,
      });
    } catch {
      break;
    }

    if (!addMore) break;
  }

  if (tasks.length === 0) {
    console.log(chalk.dim("  キャンセルしました。"));
    return;
  }

  console.log();
  console.log(
    chalk.bold(`  ${tasks.length} つのタスクを開始します。`)
  );
  console.log();

  // Ask about opening terminals
  let terminalMode = "all";
  try {
    terminalMode = await select({
      message: "個別ターミナルを開きますか？",
      choices: [
        { name: "すべて開く", value: "all" },
        { name: "選んで開く", value: "select" },
        { name: "開かない（あとで paradev go で入れます）", value: "none" },
      ],
    });
  } catch {
    return;
  }

  let openBranches = new Set();
  if (terminalMode === "all") {
    openBranches = new Set(tasks.map((t) => t.branch));
  } else if (terminalMode === "select") {
    try {
      const selected = await checkbox({
        message: "どのタスクのターミナルを開きますか？",
        choices: tasks.map((t) => ({
          name: `${t.branch} — ${t.task}`,
          value: t.branch,
          checked: true,
        })),
      });
      openBranches = new Set(selected);
    } catch {
      return;
    }
  }

  console.log();

  // Create worktrees and launch Claude
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

    // Launch Claude in terminal if selected
    let claudePid = null;
    if (openBranches.has(task.branch)) {
      try {
        process.stdout.write(
          chalk.dim(`  Launching Claude: ${task.branch} ... `)
        );
        claudePid = launchClaudeInTerminal(worktreePath, task.task, task.branch);
        console.log(chalk.green("done"));
      } catch (e) {
        console.log(chalk.yellow("skipped"));
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
  console.log(chalk.dim("  Run `paradev list` or `paradev` to check status"));
  console.log();
}
