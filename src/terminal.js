import { spawn, execSync } from "child_process";
import { platform } from "os";

/**
 * Detect the current terminal environment
 * Returns: "antigravity" | "cursor" | "vscode" | "terminal" | "iterm" | "unknown"
 */
export function detectEnvironment() {
  // Antigravity sets ANTIGRAVITY_* env vars but TERM_PROGRAM=vscode
  if (process.env.ANTIGRAVITY_CLI_ALIAS || process.env.ANTIGRAVITY_EDITOR_READY) {
    return "antigravity";
  }
  // Cursor sets CURSOR_CHANNEL or CURSOR_TRACE_DIR
  if (process.env.CURSOR_CHANNEL || process.env.CURSOR_TRACE_DIR) {
    return "cursor";
  }
  // VS Code sets TERM_PROGRAM=vscode
  if (process.env.TERM_PROGRAM === "vscode") {
    return "vscode";
  }
  // iTerm2
  if (process.env.TERM_PROGRAM === "iTerm.app") {
    return "iterm";
  }
  // Terminal.app
  if (process.env.TERM_PROGRAM === "Apple_Terminal") {
    return "terminal";
  }
  return "unknown";
}

/**
 * Get the IDE app name for AppleScript
 */
function getIdeAppName(env) {
  if (env === "antigravity") return "Antigravity";
  if (env === "cursor") return "Cursor";
  if (env === "vscode") return "Code";
  return null;
}

/**
 * Open a terminal with a command in the appropriate environment
 * Returns: process pid or null
 */
export function openTerminal(worktreePath, command, branchName, env) {
  const os = platform();
  if (os !== "darwin") {
    return openFallback(worktreePath, command);
  }

  if (!env) env = detectEnvironment();

  switch (env) {
    case "antigravity":
    case "cursor":
    case "vscode":
      return openInIdeTerminal(worktreePath, command, branchName, env);
    case "iterm":
      return openInIterm(worktreePath, command, branchName);
    case "terminal":
    default:
      return openInTerminalApp(worktreePath, command, branchName);
  }
}

/**
 * Open a new terminal tab in VS Code / Cursor
 */
function openInIdeTerminal(worktreePath, command, branchName, env) {
  const escapedPath = worktreePath.replace(/'/g, "'\\''");
  const escapedCmd = command.replace(/'/g, "'\\''").replace(/"/g, '\\"');
  const title = `[paradev] ${branchName || "task"}`;

  const appName = getIdeAppName(env);

  const script = `
    tell application "${appName}"
      activate
    end tell
    delay 0.3
    tell application "System Events"
      tell process "${appName}"
        -- Open new terminal: Ctrl+Shift+\`
        key code 50 using {control down, shift down}
        delay 0.5
        -- Type the command
        keystroke "printf '\\\\e]0;${title}\\\\a' && cd '${escapedPath}' && ${escapedCmd}"
        delay 0.1
        -- Press Enter
        key code 36
      end tell
    end tell
  `;

  const proc = spawn("osascript", ["-e", script], {
    stdio: "ignore",
    detached: true,
  });
  proc.unref();
  return proc.pid;
}

/**
 * Open a new tab in iTerm2
 */
function openInIterm(worktreePath, command, branchName) {
  const escapedPath = worktreePath.replace(/'/g, "'\\''");
  const escapedCmd = command.replace(/'/g, "'\\''").replace(/"/g, '\\"');
  const title = `[paradev] ${branchName || "task"}`;

  const script = `
    tell application "iTerm2"
      activate
      tell current window
        create tab with default profile
        tell current session
          write text "printf '\\\\e]0;${title}\\\\a' && cd '${escapedPath}' && ${escapedCmd}"
        end tell
      end tell
    end tell
  `;

  const proc = spawn("osascript", ["-e", script], {
    stdio: "ignore",
    detached: true,
  });
  proc.unref();
  return proc.pid;
}

/**
 * Open a new window in Terminal.app with tiling
 */
function openInTerminalApp(worktreePath, command, branchName) {
  const escapedPath = worktreePath.replace(/'/g, "'\\''");
  const escapedCmd = command.replace(/'/g, "'\\''").replace(/"/g, '\\"');
  const title = `[paradev] ${branchName || "task"}`;

  const script = `
    tell application "Terminal"
      activate
      do script "printf '\\\\e]0;${title}\\\\a' && cd '${escapedPath}' && ${escapedCmd}"
    end tell
  `;

  const proc = spawn("osascript", ["-e", script], {
    stdio: "ignore",
    detached: true,
  });
  proc.unref();
  return proc.pid;
}

/**
 * Arrange Terminal.app windows in a grid
 */
export function arrangeTerminalWindows(count) {
  if (platform() !== "darwin") return;

  try {
    // Get screen size
    const screenInfo = execSync(
      `osascript -e 'tell application "Finder" to get bounds of window of desktop'`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    const [, , screenW, screenH] = screenInfo.split(", ").map(Number);

    // Calculate grid layout
    const cols = count <= 2 ? count : count <= 4 ? 2 : 3;
    const rows = Math.ceil(count / cols);
    const w = Math.floor(screenW / cols);
    const h = Math.floor(screenH / rows);

    const script = `
      tell application "Terminal"
        set windowList to windows
        set i to 0
        repeat with w in windowList
          if name of w contains "[paradev]" then
            set col to i mod ${cols}
            set row to (i div ${cols})
            set bounds of w to {col * ${w}, row * ${h}, (col + 1) * ${w}, (row + 1) * ${h}}
            set i to i + 1
          end if
        end repeat
      end tell
    `;

    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      stdio: "pipe",
    });
  } catch {
    // Arrangement failed silently
  }
}

/**
 * Focus on an existing terminal by branch name
 */
export function focusTerminal(branchName, env) {
  if (platform() !== "darwin") return false;
  if (!env) env = detectEnvironment();

  const title = `[paradev] ${branchName}`;

  try {
    if (env === "antigravity" || env === "cursor" || env === "vscode") {
      const appName = getIdeAppName(env);
      // Try to find and focus the terminal tab with matching title
      const script = `
        tell application "${appName}"
          activate
        end tell
        tell application "System Events"
          tell process "${appName}"
            -- Search through terminal tabs is not directly possible via AppleScript
            -- Instead, we activate the app and let the user find the tab
          end tell
        end tell
      `;
      execSync(`osascript -e '${script}'`, { stdio: "pipe" });
      return true;
    } else {
      // Terminal.app: find window by name and bring to front
      const script = `
        tell application "Terminal"
          activate
          set windowList to windows
          repeat with w in windowList
            if name of w contains "${title}" then
              set frontmost of w to true
              return true
            end if
          end repeat
          return false
        end tell
      `;
      const result = execSync(`osascript -e '${script}'`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      return result === "true";
    }
  } catch {
    return false;
  }
}

function openFallback(worktreePath, command) {
  const proc = spawn("sh", ["-c", `cd "${worktreePath}" && ${command}`], {
    stdio: "ignore",
    detached: true,
    shell: true,
  });
  proc.unref();
  return proc.pid;
}
