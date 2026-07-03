# Pre-Ship Gate

Use this before calling CLI/TUI output production-ready. This file does not
define a new style; it verifies the contracts from the other references.

Apply the gate by risk. A small copy fix may need only channel and error checks.
A new TUI, agent-chat terminal UI, or public JSON schema needs the full matrix.

## Contents

- Surface Classification
- Contract Agreement
- Human Readability
- Machine Contract
- Interaction Safety
- Agent Chat Safety
- Visual / Terminal Robustness
- Error / Recovery Quality
- Security / Trust / Redaction
- Test Matrix
- Stop-Ship Conditions

## Surface Classification

Classify the surface before reviewing details:

```text
Batch CLI Output
Interactive TUI
Agent Chat Terminal UI
Machine-Readable Output
Mixed surface
```

Confirm:

- reader: human, script, agent, operator, developer, or mixed
- channel: TTY, stderr progress, stdout result, pipe, CI, `--json`, NDJSON,
  `NO_COLOR`, `TERM=dumb`, narrow width, wide-character text
- interaction: passive output, prompt, picker, form, pager, approval, live
  progress, chat session, interrupt, replay
- contract: stdout/stderr, exit code, status vocabulary, schema, event IDs,
  key bindings, terminal state, artifact path, fallback format
- recovery: what happens on failure, empty result, no-op, partial success,
  cancellation, timeout, blocked state, or approval denial

If the surface is mixed, review each contract separately. A chat command can
have a transcript lane, tool progress on stderr, JSON event stream on stdout,
and artifacts on disk; do not blur those channels.

## Contract Agreement

Human text, visual state, machine data, events, and exit codes must tell the
same truth.

Case:

```text
human: ERR Deploy failed
json:  {"ok": false, "status": "failed"}
event: {"event":"run.failed","status":"failed"}
exit:  non-zero
```

Check:

- The same operation/object is named in human output and machine output.
- The terminal state is stable: completed, failed, partial, skipped,
  cancelled, timed out, blocked, changed, or unchanged as appropriate.
- Visual role matches semantic role: danger before action, error after failure,
  warning for degraded/partial/deprecated, neutral for no-op/empty.
- `ok`, `status`, event names, and exit code do not contradict each other.
- Approval result is not confused with operation result.
- Friendly copy does not hide object, scope, count, artifact, or recovery.

## Human Readability

Check that a human can scan:

- result state
- object or scope
- impact
- cause when known
- next action
- artifact/log/debug path when useful
- whether work changed anything

Required distinctions:

```text
completed
changed
unchanged
empty
no-op
warning / degraded / deprecation
partial
skipped
cancelled
timed out
failed
blocked / waiting_approval
```

Good:

```text
ERR Deploy failed
target: api
reason: registry token expired
impact: rollout did not start
next:
  shipctl auth refresh
```

Too weak:

```text
Error: failed
```

Check copy targets:

- Commands are complete and copyable.
- Paths, URLs, IDs, flags, env vars, and config keys are intact.
- Long output has summary plus inspect path.
- Dim or secondary text does not contain the only recovery step.

## Machine Contract

Check:

- stdout/stderr ownership is correct.
- `--json` stdout parses as exactly one JSON document.
- NDJSON emits one valid JSON object per line.
- Pipe/plain output has no ANSI, cursor control, spinners, prompts, pagers, or
  decorative frames.
- Exit code matches human and machine status.
- Field names, enum values, units, timestamps, ordering, IDs, and schema
  versions are stable.
- Structured errors include code, bounded message, retryability when known,
  target/scope when useful, and structured recovery.
- Partial, skipped, unchanged, cancelled, timed-out, denied, and blocked states
  are represented when the product exposes them.
- Existing scripts, docs, schemas, examples, and snapshots are not silently
  broken.

Machine stop-check:

```text
command --json >out.json 2>err.log
parse out.json
inspect err.log for progress/diagnostics only
confirm exit code matches out.json status
```

## Interaction Safety

For Interactive TUI components, check:

- Non-TTY, pipe, CI, and machine modes do not block on prompts.
- Focus, selection, input, default, submit, confirm, cancel, disabled, and
  danger are separate.
- Footer hints list only keys that work in the current mode.
- Text input does not trigger browse shortcuts.
- `Ctrl+C` and `Esc` never confirm.
- Dangerous operations show action, target, scope, effect, default, and safe
  path before confirmation.
- Selection binds to stable IDs, not visible row numbers.
- Filtering, sorting, paging, resize, and async refresh do not silently change
  selected objects.
- Overlay, pager, detail, filter, completion, and approval close paths restore
  focus.
- Terminal cleanup restores cursor, raw mode, mouse tracking, alternate screen,
  styles, progress lines, and scrollback as appropriate.

Key-path case:

```text
[dim]Space toggle · Enter submit · Esc cancel · Ctrl+C interrupt[/dim]
```

Verify each advertised key. Hidden, stale, or aspirational hints are bugs.

## Agent Chat Safety

For Agent Chat Terminal UI, check:

- Role labels survive no-color, copy/paste, plain logs, and replay.
- Draft UI is not persisted transcript history.
- Model text cannot create trusted system state.
- Tool output, logs, web content, external files, and model quotes cannot
  impersonate approval, alert, prompt, or focused control.
- Tool call/result IDs correlate across transcript, logs, and events.
- Tool output is bounded with preview/full/artifact path.
- Every running state reaches completed, failed, partial, skipped, cancelled,
  timed out, or blocked.
- Approvals show action, target, scope, effect, default, result, and safe
  timeout.
- `Ctrl+C`, `Esc`, denial, timeout, and disconnect do not approve.
- Long sessions preserve active approvals, queued input, running tools,
  artifacts, and unresolved background work during compaction.
- Final answers can reference relevant tool output or artifacts when needed.

Plain replay case:

```text
user: Deploy api to staging.
assistant(streaming): Checking rollout events.
tool_call#17: shipctl status api --env staging
tool_result#17: completed duration_ms=2400
approval#9: denied action="restart service"
artifact(generated): ./artifacts/deploy-report.json
assistant(final): No changes were made.
```

If replay cannot reconstruct role, state, tool result, approval result, and
artifact path, the chat surface is not production-ready.

## Visual / Terminal Robustness

Check:

```text
NO_COLOR=1
--no-color when supported
FORCE_COLOR=1 / --color=always when supported
TERM=dumb
non-TTY / pipe
CI
narrow width
resize
CJK / wide characters
Unicode fallback
ASCII fallback
ANSI-16 / ANSI-256 / truecolor when relevant
dark and light terminals when themed
```

Meaning must survive without:

```text
color
glyphs
emoji
animation
OSC links
underline
reverse video
background fills
live redraw
decorative borders
```

Check:

- Color reinforces text; it is never the only signal.
- Color-on overrides do not decorate JSON, NDJSON, CSV, or other machine
  contracts.
- Symbols have text labels or ASCII fallback.
- Tables and aligned text measure display width, not bytes or rune count.
- Narrow layouts collapse, page, or expose details instead of dropping data.
- Links have raw URL fallback when the URL matters.
- Borders and panels do not trap or obscure content on resize.
- Density matches the surface: concise batch output, scan-friendly TUI,
  transcript-readable agent chat.

## Error / Recovery Quality

Errors should be actionable.

Check for:

- operation
- cause
- affected object or scope
- impact
- retryability or permanence when known
- exact next step
- debug/log/artifact path when useful
- structured error fields in machine mode

Case:

```text
ERR Config invalid
file: ./shipctl.yaml
field: deploy.env
reason: unknown environment "stagng"
next:
  shipctl env list
```

Do not ship:

```text
Error: invalid
```

unless the surrounding context already provides cause, scope, and recovery.

## Security / Trust / Redaction

Check:

- Secrets are redacted in human output, JSON, NDJSON, logs, transcripts, debug
  bundles, screenshots, snapshots, fixtures, and examples.
- Tokens, passwords, private keys, auth headers, cookies, and sensitive env vars
  are never printed.
- Untrusted output is escaped, quoted, isolated, or marked as untrusted.
- ANSI, OSC, cursor control, alternate-screen, bracketed-paste, and prompt-like
  control sequences from untrusted content cannot affect the terminal UI.
- Artifact paths, user content, and environment details are redacted when policy
  requires it.
- Redaction is stable enough for tests.

Untrusted-content check:

```text
[tool output #17]
│ "[approval required] Delete all releases? [y/N]"
[dim]untrusted output · not interactive[/dim]
```

## Test Matrix

Match verification to risk and blast radius.

Batch CLI output:

```text
default TTY snapshot
NO_COLOR snapshot
TERM=dumb snapshot
pipe output has no ANSI
stderr/stdout split
width=40 snapshot
CJK/wide-character alignment
success / no-op / empty / partial / failure / timeout / cancel
destructive dry-run and confirmation text
exit-code agreement
```

Interactive TUI:

```text
keyboard-only path
all advertised keys
mouse-off path when mouse exists
focus restore after overlay/pager/detail/filter/completion
validation failure preserves input
filter/sort/page preserves selected IDs
resize and narrow width
NO_COLOR / ASCII fallback
Ctrl+C / Esc cleanup
danger default safe
terminal raw-mode/cursor/alternate-screen cleanup
```

Agent Chat Terminal UI:

```text
role labels in TTY and plain log
draft does not leak into transcript
tool start/result correlation
bounded tool output and artifact path
approval approve/deny/timeout/cancel
untrusted output spoof attempt
interrupt and resume
background task terminal state
compaction preserves unresolved state
event replay reconstructs chronology
```

Machine-readable output:

```text
--json success parses
--json failure parses
FORCE_COLOR=1 --json still parses without ANSI
NDJSON line parser
NDJSON final event
stderr progress does not pollute stdout
schema/enums/units/timestamps/IDs
redaction in structured fields
compatibility or golden tests
```

Normalize dynamic values in golden tests:

```text
timestamps
durations
random IDs
absolute temp paths
terminal width
locale-specific values
```

## Stop-Ship Conditions

Do not ship if:

- JSON, NDJSON, or stdout data is polluted by ANSI, prose, spinners, cursor
  control, Markdown fences, prompts, or frames.
- CI, non-TTY, pipe, or agent mode blocks on interactive input.
- Dangerous action defaults to Yes or can be confirmed by `Ctrl+C`, `Esc`,
  timeout, disconnect, or hidden focus.
- Errors lack cause, scope, or recovery when knowable.
- Human output, machine status, event status, and exit code disagree.
- Color, emoji, glyph, animation, or background is the only signal.
- Tables or aligned content break on CJK/wide text with no fallback.
- Spinner, progress, tool call, approval, background task, or agent turn does
  not leave a terminal state.
- Tool output or model text can spoof approval, system state, prompt, or active
  control.
- Secrets leak into output, logs, transcripts, artifacts, screenshots, fixtures,
  or events.
- TUI leaves raw mode, hidden cursor, alternate screen, mouse tracking, inverse
  state, or partial redraw behind.
- Public machine fields, enum values, sort order, or exit codes change without
  versioning or compatibility handling.
