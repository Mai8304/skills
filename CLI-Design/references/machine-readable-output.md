# Machine-Readable Output

Use this for `--json`, NDJSON, pipe/plain output, stdout/stderr, exit codes,
schemas, versioning, stable enums, structured errors, and agent/script
consumption.

Machine-readable output is a data contract. It is not decorated human output,
not a Markdown transcript, and not an internal struct dump.

## Contents

- Default Contract
- Channel And Exit Contract
- JSON Document Mode
- NDJSON Event Stream Mode
- Pipe / Plain Text Mode
- Schema Design
- Status And Enum Discipline
- Errors / Warnings / Recovery
- Correlation / Time / Units / Ordering
- Security / Redaction / Trust
- Human Output Relationship
- Compatibility And Versioning
- Red Flags
- Pre-Ship Checks

## Default Contract

- stdout is data.
- stderr is conversation: progress, diagnostics, notices, logs, and human
  explanations.
- Machine modes contain only parseable data.
- Do not mix ANSI, spinners, cursor control, prose, Markdown fences, frames,
  banners, prompts, or decorative blank lines into data streams.
- Ignore color-on overrides such as `FORCE_COLOR` or `--color=always` for
  documented machine contracts.
- Use language encoders and structured APIs. Do not hand-build JSON strings.
- Define the contract before exposing it. Scripts and agents will depend on
  field names, enum values, ordering, IDs, and exit codes.
- Preserve enough structure for an agent to locate cause, scope, impact, and
  recovery without parsing prose.

## Channel And Exit Contract

Human output, machine output, and exit codes must agree.

```text
human: ERR Deploy failed
json:  {"ok": false, "status": "failed"}
exit:  non-zero
```

Define exit semantics for the CLI instead of relying on accidents. Keep the set
small and documented.

Common meanings:

```text
0     command completed under the documented contract
1     runtime failure
2     usage / bad arguments / missing required non-interactive input
130   interrupted by Ctrl+C / SIGINT
```

When the product distinguishes partial success, cancellation, timeout, blocked
state, or approval denial, define operation `status`, approval result, `ok`,
and exit code separately. Do not hide them behind a generic failure when scripts
need the distinction.

Examples:

```text
status: completed   ok: true   exit: 0
status: unchanged   ok: true   exit: 0
status: partial     ok: false  exit: non-zero unless contract says partial is acceptable
status: failed      ok: false  exit: non-zero
status: cancelled        ok: false  exit: 130 for interrupt
approval_result: denied  operation status by contract; never pretend work was applied
```

Rules:

- If `--json` is accepted, stdout should remain valid JSON even on command
  failure whenever the command can produce the structured error envelope.
- Progress and human diagnostics still go to stderr in machine mode.
- If parsing flags fails before machine mode is known, a usage error on stderr
  is acceptable; keep the behavior documented and tested.
- Do not print a human "Success!" line before or after JSON.
- Do not emit cursor redraw, spinner frames, or log lines on stdout in machine
  mode.

## JSON Document Mode

Use one JSON document for bounded command results.

Good:

```json
{
  "schema_version": "1",
  "ok": false,
  "status": "failed",
  "operation": "deploy",
  "target": {
    "service": "api",
    "environment": "staging"
  },
  "duration_ms": 4120,
  "error": {
    "code": "registry_auth_expired",
    "message": "Registry token expired",
    "retryable": true,
    "scope": "registry.example",
    "next_steps": [
      {
        "command": "shipctl auth refresh",
        "reason": "refresh registry credentials"
      }
    ]
  },
  "warnings": []
}
```

Bad:

```text
Deploying api...
{
  "status": "failed"
}
Try logging in again.
```

Why bad: stdout is no longer parseable as one JSON document.

Rules:

- Pretty-printing can be the default for humans reading JSON, but the bytes must
  still be plain JSON. Syntax highlighting is TTY-only and must be disabled in
  machine/pipe mode unless the user explicitly requested color.
- Expose stable public fields, not internal structs.
- Use arrays for lists even when the current result has one item.
- Use objects for nested concepts such as target, error, artifact, approval, and
  metrics.
- Keep numbers as numbers and booleans as booleans. Do not stringify counts,
  durations, byte sizes, or flags.
- Use `null` only when "known empty value" is meaningful. Omission means a field
  is not present or not part of the contract.

## NDJSON Event Stream Mode

Use NDJSON for long-running, streaming, incremental, or agent-chat event output.
Each line is one complete JSON object. The stream is append-only and flushes
complete records.

Case:

```jsonl
{"schema_version":"1","event":"run.started","run_id":"run_42","operation":"deploy","target":"api","ts":"2026-07-02T09:42:18Z"}
{"schema_version":"1","event":"tool.started","run_id":"run_42","id":"tool_17","name":"shipctl status","target":"api","seq":2}
{"schema_version":"1","event":"tool.completed","run_id":"run_42","id":"tool_17","status":"completed","duration_ms":2100,"seq":3}
{"schema_version":"1","event":"run.completed","run_id":"run_42","status":"completed","duration_ms":4120,"seq":4}
```

Rules:

- Each line must parse independently as JSON.
- Define event names, ordering, sequence behavior, IDs, timestamps, and terminal
  events.
- Include a final event for every run unless the process is interrupted before
  it can flush.
- Pair start and terminal events: `*.started` resolves to `*.completed`,
  `*.failed`, `*.cancelled`, `*.skipped`, or `*.timed_out`.
- Use stable IDs and parent IDs for tools, approvals, background work,
  sub-operations, and artifacts.
- Do not rewrite or delete prior events. Emit a new event that changes state.
- Flush after meaningful events so consumers do not see a hung stream.
- Put progress logs on stderr unless progress itself is part of the documented
  event stream.

Interrupted stream case:

```jsonl
{"schema_version":"1","event":"run.started","run_id":"run_42","operation":"deploy"}
{"schema_version":"1","event":"tool.started","run_id":"run_42","id":"tool_17","name":"shipctl status"}
{"schema_version":"1","event":"run.cancelled","run_id":"run_42","status":"cancelled","reason":"interrupted"}
```

## Pipe / Plain Text Mode

Plain pipe output should be stable and useful for shell tools. It is not the
same as the pretty TTY layout.

Rules:

- Use one record per line when possible.
- Prefer plain paths, IDs, names, or TSV-like rows for pipe-oriented commands.
- Do not emit ANSI, tree art, cursor control, spinners, tables with decorative
  borders, prompts, or pagers into pipes.
- Keep ordering deterministic or document the sort.
- Provide explicit flags for fields or formats when the command supports them;
  do not require parsing a pretty table.
- For hierarchical or rich data, prefer `--json` over inventing ad hoc text.

Case:

```text
api	staging	completed	v1.8.2
worker	staging	unchanged	v1.8.2
cron	staging	skipped	v1.7.9
```

If tabs or CSV are public contracts, document escaping, headers, delimiters, and
field order. If not, prefer JSON for automation.

## Schema Design

Design schemas around public meaning:

```text
schema_version
ok
status
operation
target
items
counts
warnings
error
next_steps
artifacts
duration_ms
```

Rules:

- Use consistent naming style across the CLI or TUI event system.
- Keep public fields stable even if internal package/type names change.
- Include `schema_version` for public, complex, streaming, or long-lived
  contracts.
- Include `operation` and `target` when errors or artifacts need context.
- Include `counts` for summaries instead of making agents count display rows.
- Include `artifacts` with path/handle, type, status, source, and partial state.
- Use bounded `message` fields for human-readable summaries; do not require
  parsing them for state.
- Make `next_steps` structured when recovery matters.

Structured `next_steps`:

```json
[
  {
    "kind": "command",
    "command": "shipctl auth refresh",
    "reason": "refresh registry credentials"
  },
  {
    "kind": "docs",
    "url": "https://example.invalid/docs/auth",
    "reason": "review token setup"
  }
]
```

## Status And Enum Discipline

Use a small, stable machine vocabulary. Do not mix synonyms inside one contract.

Common terminal statuses:

```text
completed
failed
partial
degraded
skipped
unchanged
changed
cancelled
timed_out
blocked
waiting_approval
```

Rules:

- Preserve exact machine enums in JSON, NDJSON, schemas, and tests.
- Human labels can be friendlier, but they must map cleanly to machine values.
- Do not alternate between `success`, `ok`, `done`, `completed`, and `passed`
  as machine states.
- Keep severity separate from state. `warning` is a severity; `degraded`,
  `partial`, and `waiting_approval` are states.
- Keep approval result separate from operation result: `approved`, `denied`,
  `expired`, `cancelled`.
- Keep `ok` boolean separate from `status`. `ok` is convenient; `status`
  explains what happened.

## Errors / Warnings / Recovery

Use stable structured errors:

```json
{
  "code": "registry_auth_expired",
  "message": "Registry token expired",
  "retryable": true,
  "target": "registry.example",
  "scope": "deploy api to staging",
  "details": {
    "provider": "registry.example"
  },
  "next_steps": [
    {
      "kind": "command",
      "command": "shipctl auth refresh",
      "reason": "refresh registry credentials"
    }
  ]
}
```

Rules:

- `code` is stable and machine-oriented.
- `message` is human-readable and bounded.
- `details` are structured and safe to parse.
- `next_steps` are structured when the command knows a recovery path.
- `warnings` are separate from `error`; do not bury degraded or deprecated
  behavior in prose.
- Partial success should identify completed, failed, skipped, and unchanged
  subsets when possible.

Partial case:

```json
{
  "schema_version": "1",
  "ok": false,
  "status": "partial",
  "operation": "deploy",
  "counts": {
    "completed": 2,
    "failed": 1,
    "skipped": 1
  },
  "items": [
    {"name": "api", "status": "completed"},
    {"name": "worker", "status": "failed", "error_code": "health_check_failed"},
    {"name": "cron", "status": "skipped", "reason": "disabled"}
  ]
}
```

## Correlation / Time / Units / Ordering

Rules:

- Use stable IDs: `id`, `run_id`, `operation_id`, `tool_id`, `approval_id`,
  `artifact_id`, or the local equivalent.
- Use parent IDs for nested work.
- Use RFC3339 timestamps when wall-clock time matters.
- Use numeric durations with units in the field name, such as `duration_ms`.
- Use numeric sizes with units in the field name, such as `bytes`.
- Define whether ordering is chronological, user-specified, sorted, or
  unspecified.
- Include sequence numbers in event streams when consumers need strict order.
- Avoid locale-dependent numbers, dates, or booleans in machine fields.

## Security / Redaction / Trust

Machine output often lands in logs, CI artifacts, issue trackers, and agent
context. Treat it as durable.

Rules:

- Redact secrets in JSON, NDJSON, logs, debug bundles, snapshots, fixtures, and
  examples.
- Never expose tokens, passwords, private keys, auth headers, session cookies,
  or sensitive env vars.
- Mark untrusted content as data. Do not let it become a trusted event,
  approval, or system message.
- Escape strings through the encoder; never concatenate untrusted text into JSON
  manually.
- Keep redaction stable enough that tests can assert it.

Case:

```json
{
  "error": {
    "code": "request_failed",
    "message": "Request failed",
    "details": {
      "authorization": "[REDACTED]"
    }
  }
}
```

## Human Output Relationship

Default human output should still be agent-readable: stable labels, clear
status words, concrete objects, copyable commands, and recovery paths.

But the real machine contract is pure data.

Good pairing:

```text
human: WARN Deprecated flag
json:  {"warnings":[{"code":"deprecated_flag","flag":"--cluster","replacement":"--context"}]}
```

Rules:

- Human labels do not have to match JSON field names exactly, but the meaning
  must agree.
- Do not make agents parse colored TTY tables when JSON exists.
- Do not add fields to JSON only because they look nice in human output.
- Keep stdout/stderr behavior identical across human and machine modes unless
  the command documents a different contract.

## Compatibility And Versioning

Treat public machine output like an API.

Rules:

- Additive fields are usually safe.
- Removing, renaming, changing type, changing enum meaning, or changing sort
  order can break scripts and agents.
- Use `schema_version` for breaking changes or long-lived contracts.
- Keep deprecated fields during a transition when practical.
- Document deprecations in structured warnings when they affect consumers.
- Golden tests or schema tests should pin important output contracts.

Compatibility case:

```json
{
  "schema_version": "1",
  "status": "completed",
  "warnings": [
    {
      "code": "field_deprecated",
      "field": "service_name",
      "replacement": "target.service",
      "removal_version": "3"
    }
  ]
}
```

## Red Flags

Stop and redesign if the output:

- prints any non-JSON byte before or after a JSON document
- mixes spinners, ANSI, cursor control, logs, prompts, or prose into stdout data
- makes scripts parse a pretty TTY table when a schema is needed
- dumps internal structs as public JSON
- uses unstable enum synonyms for the same state
- changes field names, types, sort order, or enum meanings without versioning
- hides partial, skipped, cancelled, timed-out, or denied states behind
  `failed`
- encodes numbers, booleans, timestamps, or durations as locale-formatted prose
- emits NDJSON lines that are partial JSON or multiple objects per line
- loses IDs needed to correlate tools, approvals, background work, or artifacts
- leaks secrets into JSON, NDJSON, fixtures, snapshots, or debug output

## Pre-Ship Checks

Verify:

- `--json` stdout parses as exactly one JSON document for success and failure
- NDJSON emits one valid JSON object per line and flushes complete records
- stderr contains progress/diagnostics without polluting stdout data
- exit code, human status, JSON `ok`, and JSON `status` agree
- schemas, field names, enum values, units, timestamps, ordering, and IDs are
  documented or tested
- no ANSI, cursor control, spinner frames, prompts, Markdown fences, or prose
  wrappers appear in machine data
- partial, skipped, unchanged, cancelled, timed-out, denied, and blocked states
  are represented when the CLI exposes them
- structured errors include stable code, message, retryability when known,
  scope/target when useful, and structured recovery
- redaction covers secrets in output, logs, snapshots, fixtures, and examples
- compatibility/golden tests cover public machine contracts
