import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import chalk from "chalk";
import { isGitRepo } from "../git.js";

export async function initCommand() {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.error(chalk.red("  Error: Not a git repository"));
    return;
  }

  const filePath = resolve(cwd, "tasks.json");

  if (existsSync(filePath)) {
    console.log();
    console.log(chalk.yellow("  tasks.json already exists."));
    console.log(chalk.dim("  Edit it and run `paradev start tasks.json`"));
    console.log();
    return;
  }

  const template = [
    {
      branch: "feature/",
      task: "",
    },
    {
      branch: "feature/",
      task: "",
    },
    {
      branch: "feature/",
      task: "",
    },
  ];

  writeFileSync(filePath, JSON.stringify(template, null, 2) + "\n");

  console.log();
  console.log(chalk.green("  ✓ tasks.json を生成しました"));
  console.log();
  console.log(chalk.dim("  次のステップ:"));
  console.log(chalk.dim("  1. tasks.json を編集してブランチ名とタスクを入力"));
  console.log(chalk.dim("  2. paradev start tasks.json を実行"));
  console.log();
  console.log(chalk.dim("  または `paradev add` で対話的にタスクを追加できます"));
  console.log();
}
