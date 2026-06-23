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

The README shows a few representative cases. The PNG gallery after these examples carries
the full 24-case visual reference. In the examples below, `Before` and `After` are split so
the improved output can use real semantic color in README-rendered HTML.

### 1. Errors That Guide

**Before**

```text
Error: invalid
Error: failed
```

**After**

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto"><span style="color:#e67875">✗ error:</span> missing required flag <span style="color:#8bcac3">--env</span>

  <span style="color:#777d80">Usage:</span>
    <span style="color:#8bcac3">mycli deploy --env &lt;name&gt;</span>

  <span style="color:#777d80">Next:</span>
    <span style="color:#8bcac3">mycli deploy --env staging</span>

<span style="color:#e67875">✗ error:</span> config not found

  <span style="color:#777d80">Reason:</span> no <span style="color:#8bcac3">myapp.toml</span> in this directory
  <span style="color:#777d80">Next:</span>
    <span style="color:#8bcac3">myapp init</span></pre>

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto">Run <span style="color:#8bcac3">mycli cache clear</span> to remove local cache.
Docs:
  <span style="color:#8bcac3">https://example.com/docs/cache</span>

<span style="color:#8bcac3">model.bin</span>  [<span style="color:#8ecf8a">████████████</span><span style="color:#777d80">░░░░</span>] 74%  3.8/5.1 MB  (1.2 MB/s) eta 1s
<span style="color:#8ecf8a">✓ pass</span> downloaded <span style="color:#8bcac3">model.bin</span> (5.1 MB) in 4.2s

<span style="color:#8ecf8a">✓ pass 142</span>   <span style="color:#e67875">✗ fail 1</span>   <span style="color:#777d80">⊘ skip 3</span>        4.2s
  <span style="color:#e67875">✗ fail</span> internal/cache: TestEvict/expired
      cache_test.go:88: expected 0 entries, got 1</pre>

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto"><span style="color:#777d80">NUMBER  TITLE                STATE   UPDATED</span>
#128    Fix color fallback   open    2h ago
#127    Bump deps            merged  1d ago

Pull request <span style="color:#8bcac3">#128</span>                                  open
  Title     Fix color fallback
  Author    zw
  Branch    <span style="color:#8bcac3">fix-color</span> -> <span style="color:#8bcac3">main</span>
  Checks    <span style="color:#8ecf8a">✓ pass</span> 4
  Files     6 changed (+128 -34)

<span style="color:#e67875">error[E0382]:</span> borrow of moved value: <span style="color:#8bcac3">cfg</span>
   <span style="color:#777d80">┌─ src/main.go:14:9</span>
12 │   load(cfg)
   │        <span style="color:#e5c069">--- value moved here</span>
14 │   print(cfg)
   │         <span style="color:#e67875">^^^ value used after move</span>
   = help: clone <span style="color:#8bcac3">cfg</span> before load()</pre>

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto">{
  "schema_version": "1",
  "ok": false,
  "duration_ms": 412,
  "checks": [
    {
      "name": "config_file",
      "status": "<span style="color:#e67875">fail</span>",
      "message": "not configured",
      "next_steps": [
        { "command": "mycli config init", "reason": "create config" }
      ]
    }
  ]
}

<span style="color:#777d80">NAME        STATUS</span>
配置文件    <span style="color:#e5c069">missing</span>
gateway     <span style="color:#8ecf8a">pass</span>

<span style="color:#8ecf8a">✓ pass</span> connected
  token: <span style="color:#777d80">[redacted]</span>

<span style="color:#777d80">NO_COLOR fallback:</span>
pass connected
token: [redacted]
</pre>

### More Ordinary CLI Cases

The full 2K gallery covers 24 ordinary CLI atoms: help, bad arguments, errors,
technical-token emphasis, progress, tables, object details, file trees, diffs, content
blocks, nested tasks, diagnostics, summaries, dry-run previews, empty states, logs,
expressive notices, prompts, machine mode, CJK width, pager behavior, deprecations,
interruption, theme adaptation, and redaction.

![Ordinary CLI Before / After](./assets/ordinary-cli-before-after.png)

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto"><span style="color:#8bcac3">▌ You</span>
  How do I reset the cache?

<span style="color:#f4f1ea">▌ Assistant</span>
  Run <span style="color:#8bcac3">mycli cache clear</span>.

<span style="color:#8bcac3">❯ You</span>  explain this error and suggest the smallest fix

<span style="color:#777d80">Submitted transcript:</span>
<span style="color:#8bcac3">▌ You</span>
  explain this error and suggest the smallest fix
</pre>

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto"><span style="color:#8bcac3">◐ thinking</span>
<span style="color:#777d80">∴ thinking</span> inspected 4 files; running tests next
<span style="color:#8ecf8a">✓ thinking pass</span> 8s

<span style="color:#8bcac3">◐ ⚙ shell</span> running
  <span style="color:#777d80">⎿ command:</span> <span style="color:#8bcac3">go test ./internal/cache</span>

<span style="color:#e67875">✗ ⚙ shell</span> fail 2.3s
  <span style="color:#777d80">⎿ exit:</span> 1
  <span style="color:#777d80">⎿ output:</span> cache_test.go:88: expected 0 entries, got 1</pre>

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto">approval required
  title: Delete stale branches
  risk: <span style="color:#e5c069">high</span>
  changes: 12 branches
  next: approve with y, deny with n

Approve? [y/N]

<span style="color:#e5c069">⚠ warning:</span> tool output truncated to 200 lines
<span style="color:#e67875">✗ error:</span> command failed with exit 2
timer: retrying in 30s
background: task queued · id=<span style="color:#8bcac3">sync-42</span>

<span style="color:#f4f1ea">▌ Assistant</span>
  Generated <span style="color:#8bcac3">checks.csv</span> with 10,002 rows.
  Preview: 2 rows shown, 10,000 hidden.
<span style="color:#777d80">artifact:</span> checks.csv</pre>

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

<pre style="background:#101214;color:#f4f1ea;padding:16px;border-radius:8px;overflow-x:auto">Assistant: thinking started
Tool shell: running command=<span style="color:#8bcac3">"go test ./internal/cache"</span>
Tool shell: fail exit=1 duration_ms=2300
Assistant: failing test is internal/cache TestEvict/expired

{"type":"turn.start","role":"user","message":"Find the failing test."}
{"type":"thinking.start","status":"running"}
{"type":"tool.start","tool_name":"shell","call_id":"c1","status":"running"}
{"type":"tool.end","tool_name":"shell","call_id":"c1","status":"fail","exit_code":1}
{"type":"turn.end","role":"assistant","status":"pass"}</pre>

Off-TTY output removes live UI, cursor tricks, frames, animation, hidden role state, and
raw ANSI. Machine streams use stable event types.

### More Agent Chat TUI Cases

The full 2K gallery covers 16 Agent Chat cards: transcript roles, input draft, multiline
paste, IME/CJK composition, assistant streaming, thinking summaries, tool use, tool
results, choices, approvals, alerts, timers, background tasks, subagents, theme adaptation,
suggestions, file mentions, cancellation, approval outcomes, artifacts, plain non-TTY
fallback, and NDJSON event mode.

![Agent Chat TUI Before / After](./assets/agent-chat-tui-before-after.png)

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
