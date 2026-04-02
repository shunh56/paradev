import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, realpathSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import { confirm, select } from "../interactive.js";
import { createWorktree, getWorktreePath, getRepoName } from "../git.js";
import { addTask } from "../state.js";
import { launchClaudeInTerminal } from "../claude.js";

// Use realpathSync to resolve /tmp → /private/tmp on macOS
const DEMO_PATH_RAW = "/tmp/paradev-demo";
let DEMO_PATH = DEMO_PATH_RAW;

export async function demoCommand() {
  console.log();
  console.log(chalk.bold("  paradev デモモード 🎬"));
  console.log();
  console.log(
    chalk.dim(
      "  テスト用リポジトリを作成し、3つの機能を並列開発する体験ができます。"
    )
  );
  console.log();

  let proceed;
  try {
    proceed = await confirm({
      message: "デモを開始しますか？",
      default: true,
    });
  } catch {
    return;
  }

  if (!proceed) return;

  // Clean up old demo if exists
  if (existsSync(DEMO_PATH)) {
    try {
      // Remove worktrees first
      const worktrees = [
        `${DEMO_PATH}__feature-add-todo`,
        `${DEMO_PATH}__feature-list-todo`,
        `${DEMO_PATH}__feature-delete-todo`,
      ];
      for (const wt of worktrees) {
        if (existsSync(wt)) {
          execSync(`git worktree remove "${wt}" --force`, {
            cwd: DEMO_PATH,
            stdio: "pipe",
          });
        }
      }
    } catch {
      // ignore
    }
    execSync(`rm -rf "${DEMO_PATH}"`, { stdio: "pipe" });
  }

  console.log();

  // Step 1: Create test repo
  process.stdout.write(chalk.dim("  [1/4] テストリポジトリを作成中 ... "));
  mkdirSync(DEMO_PATH, { recursive: true });
  execSync("git init", { cwd: DEMO_PATH, stdio: "pipe" });
  writeFileSync(
    join(DEMO_PATH, "package.json"),
    JSON.stringify({ name: "todo-app", version: "1.0.0", type: "module" }, null, 2)
  );
  writeFileSync(join(DEMO_PATH, "README.md"), "# Todo App\n\nA simple todo app.\n");
  execSync("git add . && git commit -m 'initial commit'", {
    cwd: DEMO_PATH,
    stdio: "pipe",
  });
  // Resolve symlinks (macOS: /tmp → /private/tmp)
  DEMO_PATH = realpathSync(DEMO_PATH);
  console.log(chalk.green("done"));

  // Step 2: Define tasks
  process.stdout.write(chalk.dim("  [2/4] 3つのタスクを定義中 ... "));
  const tasks = [
    {
      branch: "feature/add-todo",
      task: "add.js に addTodo 関数を実装して。引数は todos 配列と text 文字列。新しい todo オブジェクトを追加して返す。",
    },
    {
      branch: "feature/list-todo",
      task: "list.js に listTodos 関数を実装して。todos 配列を受け取り、番号付きで表示する。",
    },
    {
      branch: "feature/delete-todo",
      task: "delete.js に deleteTodo 関数を実装して。todos 配列と id を受け取り、該当する todo を削除して返す。",
    },
  ];
  console.log(chalk.green("done"));

  // Step 3: Create worktrees
  process.stdout.write(chalk.dim("  [3/4] ワークツリーを作成中 ... "));
  for (const task of tasks) {
    const worktreePath = getWorktreePath(DEMO_PATH, task.branch);
    try {
      createWorktree(DEMO_PATH, task.branch, worktreePath);
    } catch {
      // already exists
    }
    addTask(DEMO_PATH, {
      branch: task.branch,
      task: task.task,
      worktreePath,
      status: "idle",
      claudePid: null,
      prNumber: null,
    });
  }
  console.log(chalk.green("done"));

  // Step 4: Ask about Claude
  let launchMode;
  try {
    launchMode = await select({
      message: "Claude Code を起動しますか？",
      choices: [
        { name: "すべて起動する（3つのターミナルが開きます）", value: "all" },
        { name: "起動しない（手動で確認する）", value: "none" },
      ],
    });
  } catch {
    return;
  }

  if (launchMode === "all") {
    process.stdout.write(chalk.dim("  [4/4] Claude Code を起動中 ... "));
    for (const task of tasks) {
      const worktreePath = getWorktreePath(DEMO_PATH, task.branch);
      try {
        const pid = launchClaudeInTerminal(worktreePath, task.task, task.branch);
        addTask(DEMO_PATH, {
          branch: task.branch,
          status: "claude_ongoing",
          claudePid: pid,
        });
      } catch {
        // Claude not available
      }
    }
    console.log(chalk.green("done"));
  } else {
    console.log(chalk.dim("  [4/4] スキップ"));
  }

  console.log();
  console.log(chalk.green("  🎉 デモ環境の準備が完了しました！"));
  console.log();
  console.log(chalk.dim("  デモリポジトリ: " + DEMO_PATH));
  console.log();
  console.log(chalk.dim("  次のステップ:"));
  console.log(chalk.dim(`    cd ${DEMO_PATH}`));
  console.log(chalk.dim("    paradev list     # 状態を確認"));
  console.log(chalk.dim("    paradev go       # ワークツリーに入る"));
  console.log(chalk.dim("    paradev          # ダッシュボードを開く"));
  console.log();
  console.log(chalk.dim("  後片付け:"));
  console.log(chalk.dim(`    cd ${DEMO_PATH} && paradev clean --all`));
  console.log(chalk.dim(`    rm -rf ${DEMO_PATH}`));
  console.log();
}
