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

## Before / after

What the guidance changes, shown in the output itself.

**An error** — name the cause and the next move, don't just say `failed`:

```
# Before
Error: failed

# After
✗ Config not found

  Reason: no myapp.toml in this directory
  Next:
    myapp init
```

**Progress** — honest, and it always reaches a terminal state:

```
# Before
processing... done          (or a bar stuck at 99%, or a spinner that never resolves)

# After
⠙ Building…        →        ✓ Built 142 files in 4.2s
```

**Machine mode** (`mycli check --json | jq`) — stdout carries only data; color, spinners,
and logs move to stderr:

```
# Before  — prose + styling leak into the pipe
Checking… {ok:false, "Status":"FAILED"}  ✗ done

# After   — pure, stable, parseable
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
    ├── output-patterns.md         # the 17-pattern cookbook (below)
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
- **Lifecycle & outcomes** — progress · checklists · diagnostics (with source frames) ·
  result / test summaries · dry-run / change previews · empty states
- **Streaming & conversation** — chat / agent transcripts · streaming output
- **Notices & logs** — leveled logs & verbosity tiers · version / deprecation notices

## When to use it

The skill activates on its own whenever you're shaping terminal output. Typical moments:

- **Designing a new CLI** — deciding how output should look and behave from the start.
- **Reviewing or polishing** an existing CLI's output, against the pre-ship checklist.
- **Adding `--json` / machine mode** that scripts and agents can rely on.
- **Fixing degradation bugs** — color leaking into pipes, broken `NO_COLOR`, mojibake,
  hardcoded width.
- **Building an agent or chat CLI** where logs must read well for both humans and machines.
