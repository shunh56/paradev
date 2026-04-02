import { execSync } from "child_process";
import { existsSync } from "fs";
import chalk from "chalk";
import { isGitRepo, getRepoRoot, getWorktreePath } from "../git.js";
import { getRepoTasks } from "../state.js";

export async function prCommand(branch, options) {
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

  const worktreePath = task.worktreePath;

  if (!existsSync(worktreePath)) {
    console.error(chalk.red(`Error: Worktree not found at ${worktreePath}`));
    process.exit(1);
  }

  // Get diff stats
  let diffStat = "";
  try {
    diffStat = execSync("git diff --stat main...HEAD", {
      cwd: worktreePath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    try {
      diffStat = execSync("git diff --stat HEAD~1...HEAD", {
        cwd: worktreePath,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      diffStat = "(no diff available)";
    }
  }

  // Get commit log
  let commitLog = "";
  try {
    commitLog = execSync(
      'git log main..HEAD --pretty=format:"- %s" --no-merges',
      {
        cwd: worktreePath,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    ).trim();
  } catch {
    commitLog = "(no commits)";
  }

  // Get changed files list
  let changedFiles = "";
  try {
    changedFiles = execSync("git diff --name-only main...HEAD", {
      cwd: worktreePath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    changedFiles = "";
  }

  const branchShort = branch.replace("feature/", "").replace(/-/g, " ");

  const template = `## Summary

${task.task}

## Changes

${commitLog || "- (describe changes here)"}

## Changed Files

\`\`\`
${changedFiles || "(no files changed yet)"}
\`\`\`

## Diff Stats

\`\`\`
${diffStat}
\`\`\`

## Test Plan

- [ ] Manual testing completed
- [ ] Existing tests pass
- [ ] New tests added (if applicable)
`;

  if (options.copy) {
    // Copy to clipboard
    try {
      const proc = execSync("pbcopy", {
        input: template,
        stdio: ["pipe", "pipe", "pipe"],
      });
      console.log();
      console.log(chalk.green("  PR template copied to clipboard!"));
      console.log();
    } catch {
      // Fallback: just print
      console.log(template);
    }
  } else {
    // Print to stdout
    console.log();
    console.log(chalk.bold(`  PR Template: ${branch}`));
    console.log(chalk.dim("  ─".repeat(30)));
    console.log();
    console.log(template);
    console.log(chalk.dim("  ─".repeat(30)));
    console.log(chalk.dim("  Use --copy to copy to clipboard"));
    console.log();
  }
}
