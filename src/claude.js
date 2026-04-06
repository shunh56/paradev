import { spawn, execSync } from "child_process";
import { platform } from "os";
import { readFileSync } from "fs";
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

export function getProcessName(pid) {
  try {
    const os = platform();
    if (os === "darwin") {
      return execSync(`ps -p ${pid} -o comm=`, { stdio: "pipe" })
        .toString()
        .trim();
    } else if (os === "linux") {
      return readFileSync(`/proc/${pid}/comm`, "utf-8").trim();
    }
  } catch {
    return null;
  }
  return null;
}

export function isClaudeRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
  } catch {
    return false;
  }
  // Process exists — verify it's actually a Claude/Node process
  const name = getProcessName(pid);
  if (name === null) {
    // Couldn't verify process name; fall back to original behavior
    return true;
  }
  const lowerName = name.toLowerCase();
  return lowerName.includes("claude") || lowerName.includes("node");
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
