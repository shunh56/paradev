import chalk from "chalk";
import { select } from "../interactive.js";
import { isGitRepo, getRepoRoot } from "../git.js";
import { getRepoTasks } from "../state.js";
import { addCommand } from "./add.js";
import { listInteractiveCommand } from "./listInteractive.js";
import { goCommand } from "./go.js";
import { cleanCommand } from "./clean.js";
import { initCommand } from "./init.js";
import { demoCommand } from "./demo.js";

export async function menuCommand() {
  console.log();
  console.log(chalk.bold("  paradev") + chalk.dim(" — Parallel AI Development"));
  console.log();

  const cwd = process.cwd();
  const inRepo = isGitRepo(cwd);

  let hasTasks = false;
  if (inRepo) {
    const repoRoot = getRepoRoot(cwd);
    const tasks = getRepoTasks(repoRoot);
    hasTasks = tasks.length > 0;
  }

  const choices = [];

  if (inRepo) {
    choices.push({
      name: "🚀 新しいタスクを開始する",
      value: "add",
    });
    if (hasTasks) {
      choices.push({
        name: "📋 ブランチ一覧を見る",
        value: "list",
      });
      choices.push({
        name: "📂 ワークツリーに入る",
        value: "go",
      });
      choices.push({
        name: "🧹 ワークツリーを削除する",
        value: "clean",
      });
    }
    choices.push({
      name: "📄 tasks.json テンプレートを生成する",
      value: "init",
    });
  }

  choices.push({
    name: "🎬 デモモードで体験する",
    value: "demo",
  });

  choices.push({
    name: "👋 終了",
    value: "exit",
  });

  try {
    const action = await select({
      message: "何をしますか？",
      choices,
    });

    switch (action) {
      case "add":
        await addCommand();
        break;
      case "list":
        await listInteractiveCommand();
        break;
      case "go":
        await goCommand();
        break;
      case "clean":
        await cleanCommand({ all: false, force: false, interactive: true });
        break;
      case "init":
        await initCommand();
        break;
      case "demo":
        await demoCommand();
        break;
      case "exit":
        break;
    }
  } catch {
    // User pressed Ctrl+C
  }
}
