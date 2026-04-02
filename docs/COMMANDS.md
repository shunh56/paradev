# Command Reference

## paradev start

Create worktrees and launch Claude Code for parallel development.

```bash
# From a JSON file
paradev start tasks.json

# Inline tasks
paradev start -t "feature/login:Fix login validation" -t "feature/signup:Add signup page"

# Create worktrees only (no Claude)
paradev start tasks.json --no-claude
```

### tasks.json format

```json
[
  {
    "branch": "feature/branch-name",
    "task": "Description of what Claude should do"
  }
]
```

---

## paradev list

Show all active branches with their status, elapsed time, PR state, and diff stats.

```bash
paradev list
paradev ls        # alias
```

### Status icons

| Status | Meaning |
|--------|---------|
| 🤖 Claude ongoing | Claude Code is running |
| 👀 Review待ち | Claude finished — needs your review |
| ✅ PR Open | Pull request is open on GitHub |
| 💤 Idle | Branch exists but nothing is running |
| 🎉 Merged | PR has been merged |

If `gh` CLI is authenticated, PR status is fetched automatically from GitHub.

---

## paradev watch

Monitor Claude processes and get notified when they complete.

```bash
paradev watch              # Check every 10 seconds
paradev watch --interval 5 # Check every 5 seconds
```

Sends a Mac notification when a Claude process finishes. Exits automatically when all processes are complete.

---

## paradev pr

Generate a PR template from a branch's diff and commit history.

```bash
paradev pr feature/login-fix          # Print to terminal
paradev pr feature/login-fix --copy   # Copy to clipboard
```

The template includes:
- Task summary
- Commit log
- Changed files list
- Diff stats
- Test plan checklist

---

## paradev stop

Stop a Claude process and mark the branch as "Review待ち".

```bash
paradev stop feature/login-fix
```

---

## paradev clean

Remove worktree directories.

```bash
paradev clean          # Remove merged branches only
paradev clean --all    # Remove all paradev worktrees
paradev clean --force  # Force removal even with uncommitted changes
```

---

## paradev auth

Configure a GitHub token for PR status features (optional).

```bash
paradev auth
```

Token is stored at `~/.paradev/config.json`.

---

## Configuration

All state is stored locally:

| File | Purpose |
|------|---------|
| `~/.paradev/state.json` | Branch status and task tracking |
| `~/.paradev/config.json` | GitHub token and settings |
