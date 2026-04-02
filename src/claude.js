import { spawn, execSync } from "child_process";
import { platform } from "os";
import { openTerminal, focusTerminal, detectEnvironment } from "./terminal.js";

export function launchClaude(worktreePath, task) {
  return launchClaudeInTerminal(worktreePath, task, null);
}

export function launchClaudeInTerminal(worktreePath, task, branchName) {
  const escapedTask = task.replace(/'/g, "'\\''").replace(/"/g, '\\"');
  const command = `claude '${escapedTask}'`;
  const env = detectEnvironment();
  return openTerminal(worktreePath, command, branchName, env);
}

export function focusClaudeTerminal(branchName) {
  const env = detectEnvironment();
  return focusTerminal(branchName, env);
}

export function isClaudeRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function sendNotification(title, message) {
  const os = platform();
  if (os === "darwin") {
    try {
      const escapedTitle = title.replace(/"/g, '\\"');
      const escapedMsg = message.replace(/"/g, '\\"');
      execSync(
        `osascript -e 'display notification "${escapedMsg}" with title "${escapedTitle}"'`,
        { stdio: "pipe" }
      );
    } catch {
      // Notification failed silently
    }
  }
  process.stdout.write("\x07");
}
