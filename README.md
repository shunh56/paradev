# paradev

**AI agents can't share a branch. Now they don't have to.**

---

You're using Claude Code. It's fast. You want to ship 3 features at once.

But git only lets you checkout one branch at a time.

So you wait. One branch finishes. You start the next. Then the next. Sequential. Slow.

**You already have the AI. You just don't have the workflow.**

---

paradev fixes this. One command. Multiple branches. Multiple Claude instances. All running in parallel.

```
$ paradev start tasks.json

  paradev — Starting 3 parallel task(s)

  Creating worktree: feature/login-fix    ... done
  Creating worktree: feature/profile-ui   ... done
  Creating worktree: feature/push-notify  ... done
  Launching Claude: feature/login-fix     ... done
  Launching Claude: feature/profile-ui    ... done
  Launching Claude: feature/push-notify   ... done

  All tasks started!
```

```
$ paradev list

┌─────────────────────┬──────────────────┬──────────┬────┬────────┐
│ Branch              │ Status           │ Time     │ PR │ Diff   │
├─────────────────────┼──────────────────┼──────────┼────┼────────┤
│ feature/login-fix   │ 🤖 Claude ongoing│ 12m ago  │ -  │ +24/-3 │
│ feature/profile-ui  │ 👀 Review待ち    │ 1h ago   │ -  │ +87/-12│
│ feature/push-notify │ ✅ PR Open       │ 3h ago   │ #42│+134/-8 │
└─────────────────────┴──────────────────┴──────────┴────┴────────┘
```

---

## Get Started

```bash
npm install -g paradev
```

### 1. Define your tasks

```json
[
  { "branch": "feature/login-fix", "task": "Fix login validation" },
  { "branch": "feature/profile-ui", "task": "Refactor profile page" },
  { "branch": "feature/push-notify", "task": "Implement push notifications" }
]
```

### 2. Launch

```bash
paradev start tasks.json
```

That's it. Each branch gets its own [git worktree](https://git-scm.com/docs/git-worktree) and its own Claude Code instance.

### 3. Monitor

```bash
paradev list          # See all branches and their status
paradev watch         # Get notified when Claude finishes
```

---

## How It Works

```
your-app/                        ← main branch (untouched)
your-app__feature-login-fix/     ← worktree + Claude Code
your-app__feature-profile-ui/    ← worktree + Claude Code
your-app__feature-push-notify/   ← worktree + Claude Code
```

paradev uses git's native [worktree](https://git-scm.com/docs/git-worktree) feature to check out multiple branches simultaneously in separate directories — all sharing a single `.git`. Each directory gets its own Claude Code process. Fully isolated. Fully parallel.

---

## Commands

| Command | What it does |
|---------|-------------|
| `paradev start <file>` | Create worktrees + launch Claude from a JSON file |
| `paradev start -t "branch:task"` | Quick inline start |
| `paradev list` | Show branch status, PR state, diff stats |
| `paradev watch` | Notify you when Claude finishes (Mac notification) |
| `paradev pr <branch>` | Generate a PR template from diff & commits |
| `paradev stop <branch>` | Stop a Claude process |
| `paradev clean` | Remove merged worktrees |

Full command reference: [docs/COMMANDS.md](docs/COMMANDS.md)

---

## Requirements

- [Node.js](https://nodejs.org/) >= 18
- [Git](https://git-scm.com/) >= 2.15
- [Claude Code](https://claude.ai/code) CLI
- [GitHub CLI](https://cli.github.com/) (optional — for PR status)

---

## Roadmap

- [x] Parallel worktree + Claude launch
- [x] Real-time status dashboard (`paradev list`)
- [x] Completion notifications (`paradev watch`)
- [x] PR template generation (`paradev pr`)
- [x] GitHub PR status sync
- [ ] Web UI dashboard
- [ ] Team collaboration features

---

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
