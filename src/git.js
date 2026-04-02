import { execSync } from "child_process";
import { basename, dirname, join, resolve } from "path";
import { existsSync } from "fs";

export function isGitRepo(dir) {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: dir,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

export function getRepoRoot(dir) {
  const toplevel = execSync("git rev-parse --show-toplevel", {
    cwd: dir,
    encoding: "utf-8",
  }).trim();

  // If inside a worktree, resolve to the main repository path
  try {
    const gitCommonDir = execSync("git rev-parse --git-common-dir", {
      cwd: dir,
      encoding: "utf-8",
    }).trim();
    // If git-common-dir differs from git-dir, we're in a worktree
    const gitDir = execSync("git rev-parse --git-dir", {
      cwd: dir,
      encoding: "utf-8",
    }).trim();
    if (gitCommonDir !== gitDir) {
      // gitCommonDir points to main repo's .git directory
      const mainGitDir = resolve(toplevel, gitCommonDir);
      return dirname(mainGitDir);
    }
  } catch {
    // Fallback to toplevel
  }
  return toplevel;
}

export function getRepoName(repoRoot) {
  return basename(repoRoot);
}

export function getCurrentBranch(dir) {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    cwd: dir,
    encoding: "utf-8",
  }).trim();
}

export function branchExists(dir, branch) {
  try {
    execSync(`git rev-parse --verify ${branch}`, {
      cwd: dir,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

export function createWorktree(repoRoot, branch, worktreePath) {
  const parentDir = dirname(worktreePath);
  if (!existsSync(parentDir)) {
    throw new Error(`Parent directory does not exist: ${parentDir}`);
  }

  if (existsSync(worktreePath)) {
    throw new Error(`Worktree path already exists: ${worktreePath}`);
  }

  if (branchExists(repoRoot, branch)) {
    execSync(`git worktree add "${worktreePath}" "${branch}"`, {
      cwd: repoRoot,
      stdio: "pipe",
    });
  } else {
    execSync(`git worktree add -b "${branch}" "${worktreePath}"`, {
      cwd: repoRoot,
      stdio: "pipe",
    });
  }
}

export function removeWorktree(repoRoot, worktreePath, force = false) {
  const forceFlag = force ? " --force" : "";
  execSync(`git worktree remove "${worktreePath}"${forceFlag}`, {
    cwd: repoRoot,
    stdio: "pipe",
  });
}

export function listWorktrees(repoRoot) {
  const output = execSync("git worktree list --porcelain", {
    cwd: repoRoot,
    encoding: "utf-8",
  });

  const worktrees = [];
  let current = {};

  for (const line of output.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current.path) worktrees.push(current);
      current = { path: line.replace("worktree ", "") };
    } else if (line.startsWith("branch ")) {
      current.branch = line.replace("branch refs/heads/", "");
    } else if (line === "bare") {
      current.bare = true;
    } else if (line === "detached") {
      current.detached = true;
    }
  }
  if (current.path) worktrees.push(current);

  return worktrees;
}

export function getWorktreePath(repoRoot, branch) {
  const repoName = getRepoName(repoRoot);
  const parentDir = dirname(repoRoot);
  const safeBranch = branch.replace(/\//g, "-");
  return join(parentDir, `${repoName}__${safeBranch}`);
}

export function getDiffStat(dir) {
  // Try diff against main/master branch (committed + uncommitted changes)
  const bases = ["main", "master"];
  for (const base of bases) {
    try {
      const output = execSync(`git diff --stat ${base}...HEAD`, {
        cwd: dir,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return parseDiffStat(output);
    } catch {
      // base branch doesn't exist, try next
    }
  }
  // Fallback: diff against HEAD (uncommitted changes only)
  try {
    const output = execSync("git diff --stat HEAD", {
      cwd: dir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return parseDiffStat(output);
  } catch {
    return { files: 0, insertions: 0, deletions: 0 };
  }
}

function parseDiffStat(output) {
  const lines = output.trim().split("\n");
  const summary = lines[lines.length - 1] || "";
  const insertions = summary.match(/(\d+) insertion/);
  const deletions = summary.match(/(\d+) deletion/);
  const files = summary.match(/(\d+) file/);
  return {
    files: files ? parseInt(files[1]) : 0,
    insertions: insertions ? parseInt(insertions[1]) : 0,
    deletions: deletions ? parseInt(deletions[1]) : 0,
  };
}
