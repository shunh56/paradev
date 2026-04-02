import { execSync } from "child_process";

export function isGhAvailable() {
  try {
    execSync("gh --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function getRemoteRepo(repoRoot) {
  try {
    const url = execSync("git remote get-url origin", {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    // Parse owner/repo from various URL formats
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    const match =
      url.match(/github\.com[:/]([^/]+\/[^/.]+)/) ||
      url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function getPRsForBranches(repoRoot, branches) {
  if (!isGhAvailable()) return {};

  const repo = getRemoteRepo(repoRoot);
  if (!repo) return {};

  const result = {};

  try {
    // Fetch all open PRs at once
    const output = execSync(
      `gh pr list --repo "${repo}" --state all --limit 50 --json number,headRefName,state,url`,
      {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 10000,
      }
    ).trim();

    const prs = JSON.parse(output || "[]");

    for (const branch of branches) {
      const pr = prs.find((p) => p.headRefName === branch);
      if (pr) {
        result[branch] = {
          number: pr.number,
          state: pr.state, // "OPEN" | "CLOSED" | "MERGED"
          url: pr.url,
        };
      }
    }
  } catch {
    // gh CLI failed — return empty, don't break the flow
  }

  return result;
}
