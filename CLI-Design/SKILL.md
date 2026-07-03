---
name: cli-design
description: Design, build, review, or improve production-grade CLI and terminal TUI output and interaction surfaces. Use for command output, help/usage, errors and recovery copy, status/progress, logs, tables/trees/diffs, prompts and selection menus, destructive confirmations, agent-chat TUI transcripts and intermediate states, machine/JSON/NDJSON output for scripts or agents, stdout/stderr and exit-code contracts, CJK/wide-character layout, NO_COLOR, non-TTY, TERM=dumb, pipe, and CI behavior. Covers how terminal surfaces look, read, degrade, communicate state, and expose interaction contracts; not command/flag API design or low-level terminal input implementation.
---

# CLI-Design

Production CLI/TUI output is a state communication system. It must tell a human,
script, or agent what happened, what matters, what can be done next, and what contract
machines can rely on.

Use this priority order:

1. **Accurate** - render true state, exact counts, real causes, correct terminal states,
   and honest uncertainty.
2. **Human-usable** - make the result, blocker, next action, and recovery path easy to
   scan.
3. **Agent/script-usable** - keep stdout/stderr, schemas, status words, events, and exit
   codes stable enough for automation.
4. **Visually calm** - use layout, spacing, symbols, and color to clarify meaning, not to
   decorate.

## Not A Template

This skill defines output contracts and decision checks, not a universal CLI house style.
Do not force every command into the same layout, frame, table, color palette, or message
template.

Preserve the product's existing terminal conventions unless they violate a non-negotiable
contract. Treat examples in the references as recipes: use them to preserve information,
state, fallback behavior, and channel contracts; adapt layout density, ordering, and voice to
the CLI/TUI in front of you.

## Before Designing The Surface

Decide these before choosing color, symbols, table shape, copy, or TUI chrome:

- **Reader**: human, script, AI agent, operator, developer, or mixed audience?
- **Surface**: command result, help, usage error, diagnostic, progress, prompt, menu, log,
  table, tree, diff, transcript, tool state, approval, or background task?
- **Interaction**: passive output, confirmation, single-select, multi-select, wizard,
  interrupt, approval, or live agent session?
- **Channel**: interactive TTY, pipe, `--json`, NDJSON events, CI, `NO_COLOR`,
  `TERM=dumb`, narrow width, or wide-character text?
- **Contract**: status vocabulary, stdout/stderr ownership, fields/events, exit code,
  key bindings, terminal state, artifact path, or fallback format?
- **Recovery**: what should the human, script, or agent do when this fails, blocks, is
  empty, is canceled, or needs approval?

Layout comes before color. Semantic roles come before visual styling. Technical tokens
such as commands, flags, paths, URLs, env vars, and config keys get emphasis only when they
are the identified object, selected item, copy target, current operation, or next action.

## Surface Families

Classify the terminal surface before choosing layout, color, symbols, copy, or
interaction. The families share invariants, but they do not share one template.

### Batch CLI Output

Use this family for command results, help/usage, argument errors, diagnostics,
progress, tables, lists, logs, summaries, dry-runs, destructive previews, empty
states, pipes, and CI behavior.

```text
command -> run -> result/error/summary -> exit
```

Design for clear result state, recoverable diagnostics, correct stdout/stderr
behavior, stable exit codes, non-TTY safety, and useful pipe behavior.

### Interactive TUI

Use this family for terminal components that own keyboard interaction: prompts,
pickers, multi-select, forms, table/list browsers, pagers, code/log blocks,
diff reviews, approvals, completion menus, and live progress views.

Design the interaction contract before styling: focus, selection, input mode,
submit, confirm, cancel, disabled state, danger, key hints, fallback, and exit
state.

### Agent Chat Terminal UI

Use this family for terminal chat transcripts, user drafts, assistant streaming
and final states, tool calls/results, choices, approvals, background tasks,
artifacts, interrupts, queues, replay, and event/log fallbacks.

```text
user message -> agent state -> tool/approval/background work -> response/task state
```

Design from atoms first: role, turn, draft, state, tool, result, choice,
approval, alert, timer, background task, and artifact. Do not bake one product's
status bar, approval card, or transcript layout into a reusable rule.

### Machine-Readable Output

Use this family for `--json`, NDJSON, pipe/plain contracts, stdout/stderr,
exit-code behavior, schemas, versioning, stable enums, structured errors, and
agent/script consumption.

Design it as pure data. Human-friendly labels can make default logs easier for
agents to read, but the machine contract must be parseable, stable, and free of
ANSI, cursor control, prose wrappers, and decoration.

## Non-Negotiable Contracts

- **Detect the channel before decorating.** Check TTY/non-TTY conditions and honor
  explicit color flags, `NO_COLOR`, `FORCE_COLOR`, `TERM=dumb`, CI, width, and
  Unicode support. Machine modes stay pure even when color is forced.
- **stdout is data; stderr is conversation.** Results and machine output go to stdout.
  Progress, notices, diagnostics, and logs go to stderr unless the command explicitly
  documents a different contract.
- **Machine modes are pure data.** `--json`, NDJSON, and pipe-oriented modes must not mix
  ANSI, spinners, cursor control, prose, frames, or decorative blank lines into the data
  stream.
- **Interactive prompts have non-TTY paths.** Do not block CI, pipes, or agents waiting
  for stdin. Provide flags, defaults, or explicit failure.
- **Long operations reach terminal states.** Every spinner, progress bar, checklist, tool
  call, background task, or agent state resolves to completed, failed, partial, skipped,
  cancelled, timed out, blocked, changed, or unchanged as appropriate.
- **Errors are diagnosable and recoverable.** Name the failed operation, real cause when
  known, affected object or scope, impact, and a concrete next step.
- **Destructive actions preview impact and default to No.** Show the blast radius, provide
  an explicit confirmation path, and offer a non-interactive flag such as `--yes` when
  appropriate.
- **Meaning survives without color, glyphs, animation, or live redraw.** Color and symbols
  reinforce text; they are never the only signal.
- **Alignment uses display width.** CJK and other wide characters must align by terminal
  column width, not byte, rune, or character count.
- **Secrets stay redacted.** Do not leak credentials, tokens, private data, or sensitive
  arguments in logs, transcripts, debug output, screenshots, fixtures, or machine events.

Use a small UI semantic role set, then map domain and machine states into it. Do not create a
new color or symbol for every domain status.

```text
UI roles: success, warning, error, running, info, neutral, attention, cancelled
Domain states: completed, changed, unchanged, no_op, empty, failed, partial, degraded, skipped, cancelled, timed_out, blocked, waiting_approval
Machine fields: preserve exact enums in JSON, NDJSON, events, logs, and schemas
```

Keep exact domain status in text or machine fields. Avoid mixing `ok`, `done`, `success`, and
`passed` as alternate labels for the same state inside one output contract.

## Style Consistency

Unify semantics, not surface shapes.

Before changing or adding output, inspect nearby command output, TUI components, snapshot or
golden tests, README examples, docs, shared renderers, prompt components, table helpers,
theme/color helpers, JSON schemas, event schemas, and exit-code conventions.

Prefer existing shared renderers and components over ad hoc ANSI, padding, glyph, prompt,
table, or transcript code. If a change affects multiple commands or agent-chat atoms,
update the shared helper, schema, tests, and docs instead of creating a one-off style.

For small local changes, preserve the existing product style. For a new CLI, large TUI, or
multi-command redesign, consider creating or updating a lightweight project convention such
as `docs/cli-output-style.md`; do not require one for every task.

## Surface Router

Open the reference that matches the surface you are designing:

| Surface or decision | Open |
|---|---|
| Batch command output, help/usage, errors, progress, logs, tables, dry-runs, destructive previews, pipe/CI behavior | `references/batch-cli-output.md` |
| Interactive terminal components, focus/selection/input modes, key hints, prompts, pickers, tables, pagers, code/log/diff views, approvals, completion menus | `references/interactive-tui.md` |
| Agent-chat terminal transcripts, roles, streaming/final states, tools, approvals, background tasks, artifacts, interrupts, replay/log fallback | `references/agent-chat-terminal-ui.md` |
| `--json`, NDJSON, pipe/plain output, stdout/stderr/exit-code contracts, schemas, versioning, stable machine enums, structured errors | `references/machine-readable-output.md` |
| Visual semantics, theme tokens, status colors/symbols, focus/selection/input/disabled/danger, density, borders, table/code/diff/log visuals, agent-chat visual roles | `references/visual-language.md` |
| Final production checks, stop-ship conditions, terminal robustness, security/trust/redaction, snapshot/golden test matrix | `references/pre-ship-gate.md` |

When a surface spans multiple concerns, read the smallest useful set. Example: a destructive
interactive prompt may need `interactive-tui.md`, `visual-language.md`, and
`pre-ship-gate.md`; an agent-chat approval with machine events may need
`agent-chat-terminal-ui.md` and `machine-readable-output.md`.

## Pattern Discipline

Use patterns as contracts, not molds.

- A table pattern means homogeneous rows, clear columns, narrow fallback, and machine output;
  it does not require one fixed table style.
- An error pattern means cause, scope, impact, and recovery; labels such as `Reason:` and
  `Next:` are useful when they improve scanning, not mandatory everywhere.
- A progress pattern means honest lifecycle and terminal state; it does not require a
  spinner for quick work or a fake percentage for unknown totals.
- A prompt pattern means clear choice, default, cancellation, and non-TTY behavior; it does
  not define low-level event-loop or terminal input implementation.
- An agent-chat pattern means visible atoms and event/log fallback; it does not prescribe a
  product-specific transcript layout.

## Red Flags

Stop and redesign if you are about to:

- decorate before deciding the output channel
- let color, emoji, or animation carry the only meaning
- pollute stdout data with diagnostics, prose, ANSI, spinners, or cursor control
- block in CI, pipes, or agent mode waiting for interactive input
- show progress that cannot reach a truthful terminal state
- print `failed` or `error` without cause, scope, or recovery
- align by byte/rune count instead of display width
- create a one-off visual style when a shared renderer or convention exists
- force an agent-chat TUI into an ordinary command-output template
- expose secrets in logs, transcripts, debug output, or machine events

## Pre-Ship Gate

Before calling terminal output production-ready, verify:

- Piped output is clean and useful.
- Machine mode is pure, documented data with stable field names and enums.
- `NO_COLOR=1`, `TERM=dumb`, non-TTY, CI, narrow width, and Unicode fallback remain readable.
- Errors identify cause, scope, impact, and recovery.
- Progress, tools, background tasks, and subagents reach terminal states.
- Prompts and approvals have non-interactive paths and safe defaults.
- Status words, colors, symbols, key labels, exit codes, and schemas are consistent with the
  product.
- CJK/wide-character text aligns by display width.
- Agent-chat states have plain log or event fallbacks with no hidden role/state information.
