#!/usr/bin/env node

import { Command } from "commander";
import { startCommand } from "../src/commands/start.js";
import { listCommand } from "../src/commands/list.js";
import { stopCommand } from "../src/commands/stop.js";
import { cleanCommand } from "../src/commands/clean.js";
import { authCommand } from "../src/commands/auth.js";
import { watchCommand } from "../src/commands/watch.js";
import { prCommand } from "../src/commands/pr.js";

const program = new Command();

program
  .name("paradev")
  .description("Parallel development with Claude Code × git worktree")
  .version("0.1.0");

program
  .command("start")
  .description("Start parallel development from a tasks JSON file or inline tasks")
  .argument("[file]", "Path to tasks.json file")
  .option("-t, --task <tasks...>", "Inline tasks in format 'branch:description'")
  .option("--no-claude", "Create worktrees without launching Claude")
  .action(startCommand);

program
  .command("list")
  .alias("ls")
  .description("List all active branches and their status")
  .action(listCommand);

program
  .command("stop")
  .description("Stop Claude process for a branch")
  .argument("<branch>", "Branch name to stop")
  .action(stopCommand);

program
  .command("clean")
  .description("Remove worktrees for merged branches")
  .option("--all", "Remove all paradev worktrees")
  .option("--force", "Force removal even if there are changes")
  .action(cleanCommand);

program
  .command("watch")
  .description("Monitor Claude processes and notify on completion")
  .option("-i, --interval <seconds>", "Check interval in seconds", "10")
  .action(watchCommand);

program
  .command("pr")
  .description("Generate a PR template for a branch")
  .argument("<branch>", "Branch name")
  .option("-c, --copy", "Copy to clipboard instead of printing")
  .action(prCommand);

program
  .command("auth")
  .description("Configure GitHub token (optional)")
  .action(authCommand);

program.parse();
