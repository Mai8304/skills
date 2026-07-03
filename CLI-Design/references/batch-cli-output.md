# Batch CLI Output

Use this for command results, help/usage, validation errors, progress, tables,
lists, logs, dry-runs, destructive previews, empty states, non-TTY, pipes, CI,
and command-level stdout/stderr/exit-code behavior.

Batch CLI output is a command state report:

```text
command -> run -> result/error/summary -> exit
```

Design the output contract before the layout. This file defines contracts and
recipes, not one universal command-output template.

## Contents

- Default Contract
- Result States
- Errors And Recovery
- Help / Usage / Validation
- Progress And Long Operations
- Tables / Lists / Logs / Artifacts
- Plans / Dry-Runs / Destructive Previews
- Verbosity / Non-TTY / CI / Pipe
- Red Flags

## Default Contract

Before rendering, decide:

- **Reader**: human, script, agent, operator, developer, or mixed.
- **Channel**: TTY, stderr progress, stdout result, pipe, CI, `--json`, NDJSON,
  `NO_COLOR`, `TERM=dumb`, narrow width, wide-character text.
- **Contract**: stdout/stderr ownership, exit code, status vocabulary, schema or
  fields, artifact path, fallback format.
- **Recovery**: what the reader should do on failure, empty result, no-op,
  partial success, cancellation, timeout, or approval required.

Default priorities:

1. Render true state: exact object, count, duration, cause, and uncertainty.
2. Make the outcome and next action easy to scan.
3. Keep stdout/stderr, exit codes, machine fields, and status terms stable.
4. Use visual treatment only after the contract is clear.

Preserve nearby command output and shared renderers unless they violate a hard
invariant. For JSON, NDJSON, event streams, and stable machine enums, use
`machine-readable-output.md`.

## Result States

Represent the outcome without forcing every command into one shape.

Common states:

```text
completed
changed
unchanged
no-op / no_op
empty
warning / degraded
deprecation
partial
skipped
cancelled
timed out / timed_out
failed
blocked / waiting_approval
```

Separate outcome from impact:

```text
OK Deploy completed
changed: api
unchanged: worker
skipped: legacy
duration: 42s
```

Success can be quiet, but state-changing success must say what changed. Friendly
voice is allowed after the facts are clear; it must not replace object, scope,
counts, artifacts, or recovery.

Good:

```text
OK Deploy completed
service: api
version: v1.8.2
pods: 3 ready
duration: 42s
```

Too weak for production:

```text
Success!
Everything completed beautifully.
```

No-op and empty states are usually neutral, not errors:

```text
No services found
next:
  shipctl service create
```

If the user requested a specific object and it is missing, that may be an error:

```text
ERR Service not found
target: api
next:
  shipctl service list
```

Warnings, deprecations, degraded states, and partial success are not generic
errors. They share an attention/warning visual role, but the text should preserve
the exact condition and recovery.

```text
WARN Deprecated flag
flag: --cluster
use instead:
  shipctl deploy api --context staging
removal: v3.0
```

Cancellation and timeout need explicit terminal states:

```text
CANCELLED Deploy interrupted
result: no changes applied

ERR Deploy timed out
waited: 120s
next:
  shipctl deploy status api
```

Human status, machine status, and exit code must agree. Define the exit contract
for success, runtime failure, usage error, partial success, cancellation, and
timeout when the CLI exposes those distinctions.

```text
human: ERR Deploy failed
json:  {"ok": false, "status": "failed"}
exit:  non-zero
```

## Errors And Recovery

Errors should let a human, script, or agent locate the problem and choose the
next action.

Include when knowable:

- operation
- cause
- affected object or scope
- impact
- retryability or permanence
- exact next step
- debug/log path when useful

Case:

```text
ERR Deploy failed
target: api
reason: registry token expired
impact: rollout did not start
next:
  shipctl auth refresh
debug:
  shipctl deploy logs api
```

Rules:

- Do not print `failed`, `error`, or `something went wrong` alone.
- Do not dump a raw stack trace as the whole message.
- Put exact commands under `next:` or a copyable command line.
- Keep critical cause and recovery out of dim/secondary-only text.
- Usage errors normally go to stderr and exit with usage-error status such as
  code `2`.
- Runtime failures should exit non-zero and agree with human and machine output.

Unexpected internal errors may include bug-report or trace guidance, but still
start with user-facing operation/cause/impact when possible.

## Help / Usage / Validation

Help is a discovery surface. Print normal help to stdout and exit `0`.

Prefer task-oriented sections:

```text
USAGE
  shipctl deploy --env <name> [--dry-run]

COMMANDS
  deploy    Deploy a service
  status    Show rollout status
  logs      Show service logs

OPTIONS
  --env <name>    Target environment
  --dry-run       Preview changes without applying

EXAMPLES
  shipctl deploy api --env staging
  shipctl deploy api --env prod --dry-run
```

For invalid input, show the invalid value, the relevant usage slice, and a
concrete correction. Do not dump full help after every usage error.

```text
ERR Missing required flag
flag: --env
usage:
  shipctl deploy <service> --env <name>
next:
  shipctl deploy api --env staging
```

Validation should preserve copy targets such as commands, flags, env vars,
config keys, paths, URLs, and IDs. Do not wrap them mid-token.

## Progress And Long Operations

Progress is conversation, not result data. Route it to stderr when stdout is
reserved for results or machine data.

Use progress only for real waiting:

- determinate total known: progress bar with true percentage/counts
- indeterminate total unknown: spinner or milestone line, no fake percentage
- multi-step work: phase/checklist summary with truthful roll-up

TTY case:

```text
RUN Deploying api
phase: building image
elapsed: 24s
```

Completion must leave a terminal state:

```text
OK Deploy completed
service: api
duration: 42s
```

Failure must replace the live state:

```text
ERR Deploy failed
reason: registry token expired
next:
  shipctl auth refresh
```

Rules:

- Print something quickly for slow network or remote work so the command does
  not look hung.
- Unknown totals must not fake 99% progress.
- Spinners, bars, and redraw are TTY-only.
- Non-TTY/CI uses discrete milestone lines, no cursor movement.
- Concurrent progress needs stable identities or an aggregate; do not interleave
  anonymous live lines.
- `Ctrl+C`, timeout, and crash paths must finalize output and restore terminal
  state.

## Tables / Lists / Logs / Artifacts

Use the container that matches the data:

```text
table = compare homogeneous rows
list = scan varied items
detail = describe one object
log = diagnose process/time/source
artifact = point to generated durable output
```

Table case:

```text
SERVICE   STATUS    VERSION   AGE
api       ready     v1.8.2    2m
worker    failed    v1.8.1    5m
```

Rules:

- Use tables only for homogeneous rows.
- Define column meaning, units, order, and truncation.
- Left-align text; right-align numbers and durations/sizes by right edge.
- Switch to vertical records for narrow width, long fields, or CJK-heavy data.
- Do not put long errors, long paths, nested JSON, or paragraphs in table cells.
- Disclose sorting, filtering, truncation, and row counts.

Detail fallback:

```text
worker
  status: failed
  reason: registry token expired
  next:
    shipctl auth refresh
```

Logs:

```text
09:42:18 build started
09:42:31 registry token expired
09:42:32 retry scheduled
```

Rules:

- Default output should not dump huge logs.
- Show summary or latest relevant lines, then provide full log path/command.
- Distinguish live stream from snapshot.
- Escape control characters and OSC links from untrusted logs.
- Redact secrets before rendering or persisting.

Artifacts:

```text
OK Report generated
path: ./artifacts/deploy-report.json
open:
  shipctl report view ./artifacts/deploy-report.json
```

Rules:

- Paths and URLs must be complete and copyable.
- OSC hyperlinks are optional enhancement; plain text must still show the real
  path or URL.
- If output is truncated, folded, or summarized, provide full view through
  pager, artifact, logs, or command.

## Plans / Dry-Runs / Destructive Previews

Dry-runs and plans explain intended changes before state changes.

```text
Plan: 2 to add · 1 to change · 0 to delete

  + service web        will be created
  ~ service api        image v1.8.1 -> v1.8.2

Run with --apply to execute.
```

Destructive previews show action, target, scope, blast radius, default, and
non-interactive path when available:

```text
Delete deployment?
target: api
scope: 3 replicas
default: deny
effect: traffic will stop

Run with --yes to confirm non-interactively.
```

Rules:

- Destructive actions default safe.
- `Ctrl+C`, `Esc`, timeout, disconnect, and abandoned prompt do not confirm.
- Show whether changes are proposed, already applied, or failed midway.
- Machine-safe previews should be structured data, not prose parsing.

## Verbosity / Non-TTY / CI / Pipe

Verbosity is a contract:

```text
--quiet     only necessary result or machine data
default     outcome plus decision-critical details
--verbose   steps, diagnostics, non-secret paths, extra context
--debug     trace/debug detail with secrets redacted
```

Channel rules:

- Non-TTY must not block on prompts.
- CI should avoid animation and interactive prompts by default.
- Pipe output should be clean and useful.
- `--json` and NDJSON are pure machine contracts; see
  `machine-readable-output.md`.
- `NO_COLOR`, `TERM=dumb`, no Unicode, and narrow width should retain facts and
  ordering.
- Flush meaningful lines/records in non-TTY modes so long operations do not look
  hung.

Units and time:

- Human durations: consistent compact form such as `42s`, `3m 04s`.
- Machine durations: numeric field such as `duration_ms`.
- Event timestamps: RFC3339 or documented equivalent.
- Counts should include units and pluralization where useful.

## Red Flags

Stop and redesign if:

- stdout data is polluted by diagnostics, progress, ANSI, prose wrappers, or
  cursor control.
- `--json` emits anything except valid data.
- CI or pipe mode waits for interactive input.
- Success output does not say what succeeded when state changed.
- Failure lacks cause, scope, or recovery when knowable.
- A warning, partial success, cancelled state, timeout, no-op, and empty result
  all look the same.
- A destructive command can proceed without visible blast radius and safe
  default.
- Progress can end on an orphaned spinner or fake percentage.
- Large logs/diffs/tables are silently truncated.
- Paths, URLs, commands, or IDs are broken across lines.
- CJK/wide-character table alignment is computed by bytes, runes, or string
  length instead of display width.
- Secrets appear in logs, artifacts, debug output, snapshots, or machine data.

Cross-links: use `visual-language.md` for visual semantics, `machine-readable-output.md`
for data contracts, `interactive-tui.md` for prompts and approvals, and
`pre-ship-gate.md` before shipping.
