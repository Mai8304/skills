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
| Color and attributes | semantic ANSI-16 palette, technical-token accent, dim/bold hierarchy, underline/italic/strikethrough restraint |
| Symbols | fixed glyph vocabulary, ASCII fallbacks, no-emoji default, width-safe alignment |
| Status and progress | canonical status words, spinners, download bars, nested tasks, checklists, terminal states |
| Copywriting | errors, warnings, deprecations, notes, next steps, humanized values |
| Layout | wrapping, tables, object details, trees, diffs, content blocks, source frames, CJK width |
| Command surfaces | help, usage, bad arguments, unknown command, dry-run, prompts, selection menus |
| Runtime contracts | stdout/stderr split, logs, verbosity, pager behavior, interrupt/cancel, redaction |
| Machine output | `--json`, pipes, CI, NDJSON events, stable schemas and status enums |
| Agent Chat TUI | transcript roles, input draft, cursor/editing, streaming, thinking, tool use, approvals, choices, alerts, timers, background tasks, subagents, artifacts, non-TTY fallbacks |

## Before / after: ordinary CLI

The examples below keep the same semantics wherever possible. A few examples are
**semantic repairs**: the Before output lost required information, and the After restores it.

### 1. Command surfaces: help, bad args, and actionable errors

```text
# Before
Usage: mycli {init,deploy,status,destroy,config,auth,logs,doctor,completion} [options]
Error: invalid
Error: failed

# After
USAGE
  mycli deploy [--env <name>] [--dry-run]

COMMANDS
  init      Create a config file
  deploy    Deploy the current project
  status    Show deployment status

OPTIONS
  --env <name>    Target environment
  --dry-run       Preview changes without applying them

✗ error: missing required flag --env

  Usage:
    mycli deploy --env <name>

  Next:
    mycli deploy --env staging

✗ error: config not found

  Reason: no myapp.toml in this directory
  Next:
    myapp init
```

### 2. Semantic color, attributes, URLs, and deprecations

```text
# Before
Important: run mycli cache clear now
See docs: https://example.com/docs/cache
ERROR: --token is deprecated but command continued
Replacement --auth-token
Removal 2026-09-01
authenticated pass

# After
Run mycli cache clear to remove local cache.
Docs:
  https://example.com/docs/cache

⚠ deprecated: --token is deprecated
  Replacement: --auth-token
  Removal:     2026-09-01

✓ pass authenticated
```

Rules shown here:

- use one technical-token accent for commands, flags, env vars, config keys, paths, URLs,
  functions, and formulas
- underline only links in interactive TTYs; keep raw URLs copyable
- do not use red for deprecations unless the current command fails
- do not use italic, underline, or strikethrough as generic emphasis

### 3. Honest progress, task trees, and summaries

```text
# Before
Downloading model.bin 3.8/5.1 MB 74% 1.2 MB/s eta 1s
Downloaded model.bin 5.1 MB in 4.2s
Deploy build pass 12.4s migrate running schema pass 0.8s seed data running
Ran tests. Some failed. Lots of log output...

# After
model.bin  [████████████░░░░] 74%  3.8/5.1 MB  (1.2 MB/s) eta 1s
✓ pass downloaded model.bin (5.1 MB) in 4.2s

◆ Deploy
  ✓ pass build              12.4s
  ⠙ running migrate
    ✓ pass schema           0.8s
    ⠙ running seed data
  • queued smoke tests

✓ pass 142   ✗ fail 1   ⊘ skip 3        4.2s

  ✗ fail internal/cache: TestEvict/expired
      cache_test.go:88: expected 0 entries, got 1

FAIL  (1 of 146)
```

Progress is only visual when it can be honest. Spinners and bars are TTY-only and must end
in a visible terminal state.

### 4. Data shapes: tables, details, trees, diffs, and content blocks

```text
# Before
+--------+--------------------+--------+
| NUMBER | TITLE              | STATE  |
+--------+--------------------+--------+
| 128    | Fix color fallback | open   |
+--------+--------------------+--------+

ID TITLE AUTHOR BRANCH CHECKS FILES
128 Fix color fallback open zw fix-color->main pass=4 files=6 +128 -34

src/cli/main.go
src/cli/render.go
src/internal/color.go

# After
NUMBER  TITLE                STATE   UPDATED
#128    Fix color fallback   open    2h ago
#127    Bump deps            merged  1d ago

Pull request #128                                  open
  Title     Fix color fallback
  Author    zw
  Branch    fix-color -> main
  Checks    ✓ pass 4
  Files     6 changed  (+128 -34)

src/
├── cli/
│   ├── main.go
│   └── render.go
└── internal/
    └── color.go

src/config.go
@@ -10,6 +10,7 @@
  ctx := context.Background()
- log.Print("start")
+ log.Info("start", "version", v)

note: configuration file created

  mycli config set api.url https://api.example.com

Docs:
  https://example.com/docs/config
```

Use tables for homogeneous rows, key-value blocks for one object, trees only in TTYs, and
line-oriented fallbacks for pipes.

### 5. Diagnostics, dry-run, prompts, and cancellation

```text
# Before
error E0382 borrow of moved value cfg
src/main.go line 14 column 9
line 12 load(cfg) moved cfg
line 14 print(cfg) used after move
help clone cfg before load
fail 3 errors warn 1

Plan add web
Plan change api image 1.2 to 1.3
Plan destroy none
Use --apply to execute

Delete stuff? y/n
Pick features:
> auth
> billing

# After
error[E0382]: borrow of moved value: cfg
   ┌─ src/main.go:14:9
12 │   load(cfg)
   │        --- value moved here
14 │   print(cfg)
   │         ^^^ value used after move
   = help: clone cfg before load()

fail 3 errors · warn 1

Plan: 2 to add · 1 to change · 0 to destroy

  + service "web"        will be created
  ~ service "api"        image  1.2 -> 1.3

Run with --apply to execute.

This will delete 3 buckets and 1 database — cannot be undone:
  - s3://logs-prod
  - s3://logs-staging
  - rds: analytics-primary

Continue?  [y/N]

? Select features   space toggle · enter confirm · esc cancel
❯ [x] auth
  [ ] billing
  [x] analytics
  2 selected

■ cancelled: upload interrupted by user
  Restored terminal state
  Exit code: 130
```

Dangerous actions preview their blast radius, default to No, and have a non-interactive
path. Prompt shape communicates cardinality: confirmation, single-select, or multi-select.

### 6. Runtime contracts: logs, pager, machine mode, CJK, redaction

```text
# Before
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

# After
{
  "schema_version": "1",
  "ok": false,
  "duration_ms": 412,
  "checks": [
    {
      "name": "config_file",
      "status": "fail",
      "message": "not configured",
      "next_steps": [
        { "command": "mycli config init", "reason": "create config" }
      ]
    }
  ]
}

NAME        STATUS
配置文件    missing
gateway     pass

✓ pass connected
  token: [redacted]

NO_COLOR fallback:
pass connected
token: [redacted]

Pager:
  TTY       use pager only for long output; show position and quit hint
  pipe/CI   no pager, no prompts, stream full rows
```

Machine output is a contract. It must not contain ANSI, spinners, prose, hidden prompts, or
unstable field names.

## Before / after: Agent Chat TUI

Agent Chat is not ordinary command output. It has live input, transcript roles, assistant
streaming, thinking summaries, tool calls, choices, approvals, background work, artifacts,
and machine-event fallbacks. The skill defines reusable atoms, not a product-specific full
layout.

### 1. Transcript roles and input composer

```text
# Before
User: how do I reset the cache?
Bot: Run mycli cache clear.
You: explain this er█
You: explain this error and suggest the smallest fix

# After
▌ You
  How do I reset the cache?

▌ Assistant
  Run mycli cache clear.

❯ You  explain this error and suggest the smallest fix

Submitted transcript:
▌ You
  explain this error and suggest the smallest fix
```

The live draft is not transcript history. Cursor movement, deletion, suggestions, and IME
composition are input UI until the user submits.

### 2. Multiline paste, suggestions, file mentions, and CJK

```text
# Before
❯ You review this function:
func cacheKey(user string) string {
Assistant: I can help with that...

You: /re
Assistant: did you mean /review?

# After
❯ You  review this function:
        ```go
        func cacheKey(user string) string {
          return strings.ToLower(user)
        }
        ```

IME/CJK:
  compose first, submit only final text, align by display width

❯ You  /re
  /review   review selected files
  /reset    clear conversation state

❯ You  review @src/render.go

Submitted transcript:
review @src/render.go
```

Suggestions are atoms. They do not become transcript until accepted.

### 3. Assistant streaming and thinking

```text
# Before
thinking thinking thinking
I found the failing test in internal/cache.
thinking
The smallest fix is to clear expired entries before counting.
I am thinking step by step about every hidden inference...

# After
◐ thinking

▌ Assistant
  I found the failing test in internal/cache.
  The smallest fix is to clear expired entries before counting.

◐ thinking
∴ thinking  inspected 4 files; running tests next
✓ thinking  pass  8s
```

Never expose hidden chain-of-thought. Show concise summaries of observable work.

### 4. Tools, subagents, and artifacts

```text
# Before
Running shell: go test ./internal/cache
exit 1 after 2.3s
cache_test.go:88: expected 0 entries, got 1
raw output mixed into assistant prose

agent researcher running
task inspect parser edge cases
agent researcher pass in 1m12s
found 3 relevant files

Assistant:
Here is the CSV:
id,name,status
1,api,pass
2,cache,warn
... 10,000 more rows ...

# After
◐ ⚙ shell  running
  ⎿ command: go test ./internal/cache

✗ ⚙ shell  fail  2.3s
  ⎿ exit: 1
  ⎿ output: cache_test.go:88: expected 0 entries, got 1

◐ agent researcher  running
  ⎿ task: inspect parser edge cases

✓ agent researcher  pass  1m12s
  ⎿ found: 3 relevant files

▌ Assistant
  Generated checks.csv with 10,002 rows.
  Preview: 2 rows shown, 10,000 hidden.

artifact: checks.csv
machine: {"type":"artifact.created","name":"checks.csv","rows":10002}
```

Tool output is bounded, labeled, and has terminal state. Subagents summarize; they do not
dump a second full transcript into the main chat.

### 5. Choices, approvals, alerts, timers, and cancellation

```text
# Before
DELETE EVERYTHING? y/n
approval: no
approval: yes
approval: stopped
approval: changed
WARNING output too long
ERROR command failed exit 2
WAIT retrying in 30 seconds
LATER task sync-42 queued

# After
approval required
  title: Delete stale branches
  risk: high
  changes: 12 branches
  next: approve with y, deny with n

Approve? [y/N]

{"type":"approval.result","decision":"approve","request_id":"a1"}
{"type":"approval.result","decision":"deny","request_id":"a2"}
{"type":"approval.result","decision":"cancel","request_id":"a3"}
{"type":"approval.result","decision":"edit","request_id":"a4"}

⚠ warning: tool output truncated to 200 lines
✗ error: command failed with exit 2
timer: retrying in 30s
background: task queued · id=sync-42

■ cancelled by user
  turn: current
  cursor: restored
  exit: 130
```

Approvals are decision atoms. `approve`, `deny`, `cancel`, and `edit` remain distinct in
human output and machine events.

### 6. Non-TTY and NDJSON event mode

```text
# Before
\x1b[?25lAssistant thinking\r
\x1b[36mTool shell running go test ./internal/cache\x1b[0m
Tool shell fail exit=1 duration_ms=2300
failing test is internal/cache TestEvict/expired
Thinking...
{"tool":"shell"}
Done!
Partial assistant prose...

# After: plain fallback
Assistant: thinking started
Tool shell: running command="go test ./internal/cache"
Tool shell: fail exit=1 duration_ms=2300
Assistant: failing test is internal/cache TestEvict/expired

# After: NDJSON
{"type":"turn.start","role":"user","message":"Find the failing test."}
{"type":"thinking.start","status":"running"}
{"type":"tool.start","tool_name":"shell","call_id":"c1","status":"running"}
{"type":"tool.end","tool_name":"shell","call_id":"c1","status":"fail","exit_code":1}
{"type":"message.delta","role":"assistant","text":"I found one failing test"}
{"type":"turn.end","role":"assistant","status":"pass"}
```

Off-TTY output removes live UI, cursor tricks, frames, animation, hidden role state, and
raw ANSI. Machine streams use stable event types.

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

- `color.md`: semantic palette, attributes, technical-token accent, theme safety
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
- URLs remain copyable; OSC 8 and underline are only enhancements.
- `NO_COLOR=1`, `TERM=dumb`, CI, narrow width, and ASCII fallback still convey the same facts.
- CJK and wide characters align by display width.
- Destructive actions preview scope, default to No, and have non-interactive flags.
- Agent Chat live UI has plain and NDJSON fallbacks.
