import { spawn, execSync } from "child_process";
import { platform } from "os";

export function launchClaude(worktreePath, task) {
  // Launch claude in a new terminal window with the task as initial prompt
  const os = platform();

  if (os === "darwin") {
    return launchClaudeMac(worktreePath, task);
  } else {
    return launchClaudeFallback(worktreePath, task);
  }
}

function launchClaudeMac(worktreePath, task) {
  // Use osascript to open a new Terminal.app window
  const escapedPath = worktreePath.replace(/'/g, "'\\''");
  const escapedTask = task.replace(/'/g, "'\\''").replace(/"/g, '\\"');

  const script = `
    tell application "Terminal"
      activate
      do script "cd '${escapedPath}' && claude '${escapedTask}'"
    end tell
  `;

  const proc = spawn("osascript", ["-e", script], {
    stdio: "ignore",
    detached: true,
  });
  proc.unref();

  return proc.pid;
}

function launchClaudeFallback(worktreePath, task) {
  // Fallback: launch claude as a background process
  const proc = spawn("claude", [task], {
    cwd: worktreePath,
    stdio: "ignore",
    detached: true,
    shell: true,
  });
  proc.unref();

  return proc.pid;
}

export function isClaudeRunning(pid) {
  if (!pid) return false;
  try {
    // Signal 0 doesn't kill the process, just checks if it exists
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
  // Terminal bell
  process.stdout.write("\x07");
}
