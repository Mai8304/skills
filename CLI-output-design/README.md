# CLI Output Design

> A general-purpose agent skill for designing terminal output that is accurate first,
> human-usable second, script/agent-usable third, and visually calm last.

**English** · [中文](./README.zh.md) · Version `1.0.3`

This skill is for the surface of a CLI: what the terminal prints, how it uses color and
symbols, how it handles progress and errors, how it degrades in pipes and CI, and how an
agent-chat TUI renders conversation, thinking, tools, choices, approvals, background work,
and machine events.

It does not design command names, flags, business logic, or input-handling internals.

## Install

```bash
npx skills add Mai8304/skills -s CLI-output-design -g -y
```

Manual install:

```bash
git clone https://github.com/Mai8304/skills
cp -r skills/CLI-output-design ~/.codex/skills/cli-output-design
```

Then ask your agent to use `cli-output-design` when designing, building, reviewing, or
improving CLI output.

## Default stance

The baseline is strict:

- **semantic over decorative**: color, symbols, spacing, and text all carry meaning
- **low decoration**: no emoji by default, no rainbow output, no frames around ordinary data
- **scriptable first**: `stdout` is data; `stderr` is conversation; `--json` is pure data
- **TTY-aware**: animation, cursor tricks, underlined links, and frames are interactive-only
- **theme-safe**: use ANSI-16 semantic roles; respect light/dark terminals, `NO_COLOR`, CI,
  `TERM=dumb`, narrow width, CJK/wide characters, and ASCII fallback

There is one explicit exception: **expressive TTY notices**. Low-frequency interactive
notices, such as update notices, may use a light frame, a small icon, and underlined/raw
URLs. They must degrade to plain lines outside an interactive TTY.

## Core decision model

Before choosing color or emphasis, use this order:

```text
reader task -> output shape -> semantic role -> channel constraints
```

- **Reader task**: discover, inspect, act, or converse.
- **Output shape**: help, table, detail, progress, error, prompt, transcript, log, or diff.
- **Semantic role**: state, current/selected item, next action, copy target, secondary, or body.
- **Channel constraints**: TTY, pipe, `--json`, CI, `NO_COLOR`, `TERM=dumb`, and width.

The practical rule is: layout first, semantic color second, token color never automatic.
Help, usage, and command catalogues stay mostly plain and rely on structure. Tables and
lists may color state, current/default rows, and exceptions. Status, doctor, update, and
install flows use color for outcomes, warnings, failures, and next actions.

Commands, flags, paths, URLs, env vars, and config keys get cyan only when they are the
identified object, selected/current item, copy target, or next action.

## Four lenses

Every output decision is judged in this order:

1. **Accurate**: never lie about state, progress, counts, risk, or cause.
2. **Human-usable**: show the result, blocker, and next action at a glance.
3. **Agent-usable**: keep logs and machine modes parseable by scripts and AI agents.
4. **Beautiful**: use calm hierarchy, semantic color, stable symbols, and whitespace.

When these conflict, the earlier lens wins. A pretty layout never justifies a wrong state.

## What the skill covers

| Area | Coverage |
|---|---|
| Color and attributes | semantic ANSI-16 palette, opt-in technical-object accent, dim/bold hierarchy, underline/italic/strikethrough restraint |
| Symbols | fixed glyph vocabulary, ASCII fallbacks, no-emoji default, width-safe alignment |
| Status and progress | canonical status words, spinners, download bars, nested tasks, checklists, terminal states |
| Copywriting | errors, warnings, deprecations, notes, next steps, humanized values |
| Layout | wrapping, tables, object details, trees, diffs, content blocks, source frames, CJK width |
| Command surfaces | help, usage, bad arguments, unknown command, dry-run, prompts, selection menus |
| Runtime contracts | stdout/stderr split, logs, verbosity, pager behavior, interrupt/cancel, redaction |
| Machine output | `--json`, pipes, CI, NDJSON events, stable schemas and status enums |
| Agent Chat TUI | transcript roles, input draft, cursor/editing, streaming, thinking, tool use, approvals, choices, alerts, timers, background tasks, subagents, artifacts, non-TTY fallbacks |

## Before / after: ordinary CLI

The README shows a few representative cases. The PNG gallery after these examples carries
the full 24-case visual reference. In the examples below, `Before` and `After` are split;
`After` is rendered as a 1024px PNG so semantic colors remain visible in README renderers.

### 1. Errors That Guide

**Before**

```text
Error: invalid
Error: failed
```

**After**

![After: Errors That Guide](./assets/readme-after/ordinary-errors-after.png?v=readable-20260623)

### 2. Semantic Color, Progress, and Result State

**Before**

```text
Important: run mycli cache clear now
See docs: https://example.com/docs/cache

Downloading model.bin 3.8/5.1 MB 74% 1.2 MB/s eta 1s
Downloaded model.bin 5.1 MB in 4.2s
Ran tests. Some failed. Lots of log output...
```

**After**

![After: Semantic Color, Progress, and Result State](./assets/readme-after/ordinary-progress-after.png?v=readable-20260623)

### 3. Data Shapes and Diagnostics

**Before**

```text
+--------+--------------------+--------+
| NUMBER | TITLE              | STATE  |
+--------+--------------------+--------+
| 128    | Fix color fallback | open   |
+--------+--------------------+--------+

ID TITLE AUTHOR BRANCH CHECKS FILES
128 Fix color fallback open zw fix-color->main pass=4 files=6 +128 -34

error E0382 borrow of moved value cfg
src/main.go line 14 column 9
line 12 load(cfg) moved cfg
line 14 print(cfg) used after move
```

**After**

![After: Data Shapes and Diagnostics](./assets/readme-after/ordinary-data-after.png?v=readable-20260623)

### 4. Runtime Contracts and Redaction

**Before**

```text
Checking...
{
  "schema_version": "1",
  "ok": false,
  "duration_ms": 412,
  "checks": [
    {
      "name": "config_file",
      "status": "\x1b[31mfail\x1b[0m",
      "message": "not configured",
      "next_steps": [
        { "command": "mycli config init", "reason": "create config" }
      ]
    }
  ]
}
Run mycli init to fix this!

NAME      STATUS
配置文件      missing
gateway   pass

connected with token sk-live-123456
```

**After**

![After: Runtime Contracts and Redaction](./assets/readme-after/ordinary-runtime-after.png?v=readable-20260623)

### More Ordinary CLI Cases

The full 1024px gallery covers 24 ordinary CLI atoms: help, bad arguments, errors,
role-bearing technical-object accent, progress, tables, object details, file trees, diffs,
content blocks, nested tasks, diagnostics, summaries, dry-run previews, empty states, logs,
expressive notices, prompts, machine mode, CJK width, pager behavior, deprecations,
interruption, theme adaptation, and redaction.

![Ordinary CLI Before / After](./assets/ordinary-cli-before-after.png?v=readable-20260623)

## Before / after: Agent Chat TUI

Agent Chat is not ordinary command output. It has live input, transcript roles, assistant
streaming, thinking summaries, tool calls, choices, approvals, background work, artifacts,
and machine-event fallbacks. The skill defines reusable atoms, not a product-specific full
layout.

The README shows representative cases first; the full gallery follows as more information.

### 1. Transcript roles and input composer

**Before**

```text
User: how do I reset the cache?
Bot: Run mycli cache clear.
You: explain this er█
You: explain this error and suggest the smallest fix
```

**After**

![After: Transcript roles and input composer](./assets/readme-after/agent-transcript-after.png?v=readable-20260623)

The live draft is not transcript history. Cursor movement, deletion, suggestions, and IME
composition are input UI until the user submits.

### 2. Thinking and Tool Use

**Before**

```text
thinking thinking thinking
Running shell: go test ./internal/cache
exit 1 after 2.3s
cache_test.go:88: expected 0 entries, got 1
raw output mixed into assistant prose
```

**After**

![After: Thinking and Tool Use](./assets/readme-after/agent-tool-after.png?v=readable-20260623)

Never expose hidden chain-of-thought. Show concise observable summaries and bounded tool
results with terminal state.

### 3. Approvals, Background Work, and Artifacts

**Before**

```text
DELETE EVERYTHING? y/n
approval: no
approval: yes
approval: stopped
approval: changed
WARNING output too long
ERROR command failed exit 2
WAIT retrying in 30 seconds
LATER task sync-42 queued
```

**After**

![After: Approvals, Background Work, and Artifacts](./assets/readme-after/agent-approval-after.png?v=readable-20260623)

Approvals are decision atoms. Large artifacts get summaries and stable references, not full
data dumps in the transcript.

### 4. Non-TTY and NDJSON Event Mode

**Before**

```text
\x1b[?25lAssistant thinking\r
\x1b[36mTool shell running go test ./internal/cache\x1b[0m
Tool shell fail exit=1 duration_ms=2300
Thinking...
{"tool":"shell"}
Done!
Partial assistant prose...
```

**After**

![After: Non-TTY and NDJSON Event Mode](./assets/readme-after/agent-events-after.png?v=readable-20260623)

Off-TTY output removes live UI, cursor tricks, frames, animation, hidden role state, and
raw ANSI. Machine streams use stable event types.

### More Agent Chat TUI Cases

The full 1024px gallery covers 16 Agent Chat cards: transcript roles, input draft, multiline
paste, IME/CJK composition, assistant streaming, thinking summaries, tool use, tool
results, choices, approvals, alerts, timers, background tasks, subagents, theme adaptation,
suggestions, file mentions, cancellation, approval outcomes, artifacts, plain non-TTY
fallback, and NDJSON event mode.

![Agent Chat TUI Before / After](./assets/agent-chat-tui-before-after.png?v=readable-20260623)

## Skill contents

```text
CLI-output-design/
├── SKILL.md
└── references/
    ├── color.md
    ├── symbols.md
    ├── status-and-progress.md
    ├── copywriting.md
    ├── layout.md
    ├── output-patterns.md
    ├── agent-chat-tui.md
    ├── agent-readable-output.md
    └── robustness.md
```

`SKILL.md` is the short spine. Reference files are loaded only when relevant.

## Reference map

- `color.md`: semantic palette, attributes, opt-in technical-object accent, theme safety
- `symbols.md`: glyph vocabulary, ASCII fallbacks, display-width pitfalls
- `status-and-progress.md`: spinners, bars, checklists, status vocabulary
- `copywriting.md`: notes, warnings, deprecations, errors, next steps
- `layout.md`: width, alignment, wrapping, tables, key-value blocks
- `output-patterns.md`: help, usage, errors, tables, trees, diffs, diagnostics, prompts,
  pagination, logs, notices, dry-run, empty states
- `agent-chat-tui.md`: chat transcript atoms, input draft, thinking, tools, choices,
  approvals, background tasks, subagents, artifacts, non-TTY/NDJSON fallback
- `agent-readable-output.md`: stable JSON and AI-readable logs
- `robustness.md`: `isatty`, `NO_COLOR`, CI, `TERM=dumb`, exit codes, interrupts

## Pre-ship checklist

- Piped output has no raw ANSI, spinner frames, cursor codes, or decorative blank edges.
- `--json` is pure stdout data with stable field names and status enums.
- Status words come from one vocabulary: `running`, `pass`, `fail`, `warn`, `skip`,
  `changed`, `unchanged`.
- Every long operation reaches a visible terminal state.
- Every error names cause and next action.
- Deprecations are yellow warnings with replacement when known.
- Technical tokens use accent only when they are the identified object, selected item,
  copy target, or next action.
- URLs remain copyable; OSC 8 and underline are only enhancements.
- `NO_COLOR=1`, `TERM=dumb`, CI, narrow width, and ASCII fallback still convey the same facts.
- CJK and wide characters align by display width.
- Destructive actions preview scope, default to No, and have non-interactive flags.
- Agent Chat live UI has plain and NDJSON fallbacks.
