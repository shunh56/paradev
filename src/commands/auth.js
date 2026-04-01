import { createInterface } from "readline";
import chalk from "chalk";
import { getConfig, saveConfig } from "../config.js";

export async function authCommand() {
  const config = getConfig();

  if (config.githubToken) {
    const masked =
      config.githubToken.substring(0, 8) +
      "..." +
      config.githubToken.substring(config.githubToken.length - 4);
    console.log();
    console.log(chalk.dim(`  Current token: ${masked}`));
    console.log();
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const token = await new Promise((resolve) => {
    rl.question(
      chalk.bold("  GitHub Token (Enter to skip): "),
      (answer) => {
        rl.close();
        resolve(answer.trim());
      }
    );
  });

  if (token) {
    saveConfig({ ...config, githubToken: token });
    console.log(chalk.green("  Token saved to ~/.paradev/config.json"));
  } else if (config.githubToken) {
    console.log(chalk.dim("  Token unchanged."));
  } else {
    console.log(chalk.dim("  Skipped. PR status features will be limited."));
  }
}
