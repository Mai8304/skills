# CLI Output Design

> A Claude skill that makes any CLI's terminal output **accurate, human-usable,
> agent-usable, and beautiful** — color, symbols, status & progress, errors, layout,
> machine/JSON output, and graceful degradation for pipes, `NO_COLOR`, and CI.

**English** · [中文](./README.zh.md)

---

## Why

Most CLIs are written one `print` at a time, and it shows: a bar stuck at 99%,
`Error: failed` with no cause, ANSI escape codes leaking into a pipe, `--json` mixed with
human prose, a table that shatters on a narrow terminal. The output looks improvised
because it is.

This skill hands an AI agent (or you, pairing with one) a compact, opinionated playbook
for terminal output — distilled from how the best CLIs actually behave and from sources
like [clig.dev](https://clig.dev) and the Heroku CLI Style Guide. The result: output that
is **correct first, readable by a human second, parseable by a script or agent third, and
calm to look at fourth.** It is pure guidance — no library, no dependency, no runtime.

## Quick install

**With the `skills` CLI** (recommended for collections):

```bash
npx skills add Mai8304/skills -s CLI-output-design -g -y
```

**Manually** (works anywhere an agent reads skills):

```bash
git clone https://github.com/Mai8304/skills
cp -r skills/CLI-output-design ~/.claude/skills/cli-output-design
```

Once the folder sits under `~/.claude/skills/` (global) or your project's `.claude/skills/`,
the agent picks it up automatically and activates it whenever you ask it to design, build,
review, or improve CLI output.

## How it works

Behind "make it look good," the skill hands the agent a concrete system for **each layer of
output** — so a download, a file listing, a chat turn, and an error all come out of one
coherent design instead of ad-hoc `print`s. Every decision is weighed through four lenses
(accurate → human-usable → agent-usable → beautiful, detailed below) and delivered through
seven systems:

| System | What it gives the agent |
|---|---|
| **Semantic color** | Color = meaning, never decoration: green = success, red = error, yellow = warn, cyan = command/path, dim = secondary. ANSI-16 so it follows the user's light/dark theme, always paired with text, and auto-off in pipes / `NO_COLOR` / CI. |
| **A fixed symbol set** | One vocabulary — `✓ ✗ ⚠ → • ◆ …` plus a braille spinner `⠙` — each with an ASCII fallback (`[OK] [FAIL] [WARN]`). No emoji by default; width-stable so columns never break. |
| **Honest status & progress** | Every long task runs start → progress → `✓`/`✗`; downloads show bar + size + rate + ETA; spinners appear only on a TTY and always resolve. No bar stuck at 99%. |
| **Copy that guides** | Errors state *what happened · why · what to do next*; one status vocabulary (`pass / fail / warn / skip …`); humanized durations and sizes (`1.2 MB`, `4.2s`). |
| **Width-aware layout** | Tables, file trees, lists, and key-value blocks that align, wrap, and fall back gracefully on a narrow terminal; identifiers and URLs are never wrapped. |
| **A machine & agent contract** | `stdout` = data, `stderr` = conversation; `--json` is pure, stable, and parseable; status words stay stable so an AI agent can read the next action straight from the logs. |
| **A pattern cookbook** | Recipes for every shape you actually render — downloads, trees, conversations, diffs, tables, diagnostics, logs, dry-runs, empty states, prompts & selection menus, nested task trees… (see the cookbook below). |

The agent always reads the short `SKILL.md` spine, then pulls in only the reference for what
it's rendering — so each scenario gets the right treatment without loading the whole book.

## Before / after

The same information, rendered ad-hoc vs. through the skill. The `diff`-highlighted blocks
are **actually colored on GitHub** (green = success, red = error/removed); elsewhere the
symbols and structure stand in for color (yellow = warn, cyan = command/path, dim = secondary).

**Error & guidance** — name the cause and the next move:

```
# Before
Error: failed

# After
✗ Config not found

  Reason: no myapp.toml in this directory
  Next:
    myapp init
```

**Download** — honest progress that resolves, and degrades when piped:

```
# Before
Downloading... done.

# After — interactive
⬇ model.bin   [██████████░░░░]  72%   3.6/5.0 GB   18 MB/s   eta 1m20s
✓ Downloaded model.bin (5.0 GB) in 4m41s

# After — piped / CI (no animation, just milestones)
downloading model.bin (5.0 GB)
downloaded model.bin in 4m41s
```

**File listing → tree** — structure you can scan:

```
# Before
src/cli/main.go
src/cli/render.go
src/internal/color.go

# After
.
├── src/
│   ├── cli/
│   │   ├── main.go
│   │   └── render.go
│   └── internal/
│       └── color.go
└── README.md
```

**Health check** — symbols + alignment + a summary line (green/red real below):

```diff
  ◆ Checking environment

+ ✓ Node version     v24.11.1
+ ✓ Lockfile         in sync
  ⚠ Disk space       2.1 GB free
- ✗ Auth token       missing

  3 passed · 1 warning · 1 failed
```

**Conversation** (agent / chat CLI) — turns you can tell apart:

```
# Before
You: how do I reset the cache?
Bot: Run mycli cache clear.

# After
▌ You
  How do I reset the cache?

▌ Assistant
  Run `mycli cache clear`.
```

**Table** — borderless, aligned, grep-friendly:

```
# Before — ASCII grid: noisy, brittle on resize
+--------+--------------------+--------+
| NUMBER | TITLE              | STATE  |
+--------+--------------------+--------+
| 128    | Fix color fallback | open   |
+--------+--------------------+--------+

# After
NUMBER  TITLE                STATE   UPDATED
#128    Fix color fallback   open    2h ago
#127    Bump deps            merged  1d ago
```

**Code & diffs** — `+`/`-` carry the meaning, color reinforces (real colors below):

```diff
@@ src/config.go @@
- log.Print("start")
+ log.Info("start", "version", v)
```

**Machine mode** (`mycli check --json | jq`) — pure data on stdout; progress moved to stderr:

```json
{
  "ok": false,
  "checks": [
    { "name": "config", "status": "fail",
      "next_steps": [ { "command": "myapp init", "reason": "create a config" } ] }
  ]
}
```

## Core principles

Every output decision is judged through four lenses, **in priority order** — when two
conflict, the higher one wins (a prettier layout never justifies a wrong status):

1. **Accurate** — say only true things. Honest status, no fake or stuck progress, errors
   name the real cause.
2. **Human-usable** — the reader sees the result, the blocker, and the next step at a glance.
3. **Agent-usable** — the human log *and* the machine mode are parseable by a script or AI
   agent.
4. **Beautiful** — calm and intentional: semantic color, restrained symbols, whitespace as
   structure.

## What's inside

```
CLI-output-design/
├── SKILL.md                       # the spine: 4 lenses, operating rules,
│                                  #   decision table, red flags, pre-ship checklist
└── references/                    # load-on-demand deep dives
    ├── color.md                   # semantic ANSI-16 palette, when not to color
    ├── symbols.md                 # glyph set + ASCII fallback, no-emoji stance
    ├── status-and-progress.md     # spinners, bars, checklists, terminal states
    ├── copywriting.md             # error = what / why / Next; voice; humanized values
    ├── layout.md                  # width, wrapping, alignment, tables, whitespace
    ├── output-patterns.md         # the pattern cookbook (below)
    ├── agent-readable-output.md   # AI-readable logs + the --json contract
    └── robustness.md              # TTY / NO_COLOR / CI detection, exit codes
```

`SKILL.md` is short and always read; each reference loads only when its topic is in play
(progressive disclosure), so the skill stays cheap until you need the depth.

## The pattern cookbook

`output-patterns.md` is one recipe per shape — structure, a TTY example, and the
piped/narrow/agent degradation — in four groups:

- **Data shapes** — tables · lists · file trees · object / `describe` views · code & diffs ·
  content blocks · pagination
- **Lifecycle & outcomes** — progress · nested task trees · checklists · diagnostics (with
  source frames) · result / test summaries · dry-run / change previews · empty states
- **Streaming & conversation** — chat / agent transcripts · streaming output
- **Notices & logs** — leveled logs & verbosity tiers · version / deprecation notices
- **Prompts & selection** — confirmation & destructive actions (y/N) · single-select (radio) ·
  multi-select (checkbox) · controls, navigation & cancellation

## When to use it

The skill activates on its own whenever you're shaping terminal output. Typical moments:

- **Designing a new CLI** — deciding how output should look and behave from the start.
- **Reviewing or polishing** an existing CLI's output, against the pre-ship checklist.
- **Adding `--json` / machine mode** that scripts and agents can rely on.
- **Fixing degradation bugs** — color leaking into pipes, broken `NO_COLOR`, mojibake,
  hardcoded width.
- **Building an agent or chat CLI** where logs must read well for both humans and machines.
