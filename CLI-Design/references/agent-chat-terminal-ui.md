# Agent Chat Terminal UI

Use this for terminal chat sessions where a user converses with an agent and
the agent may stream text, call tools, request approval, create artifacts, run
background work, accept interrupts, resume, or replay history.

Agent Chat Terminal UI composes Batch CLI, Interactive TUI, Machine-Readable
Output, and Visual Language. Its reusable layer is atoms and contracts, not one
product's transcript, status bar, approval card, or input composer.

Examples in this file are recipes, not templates. Style markers such as
`[cyan]`, `[green]`, `[yellow]`, `[red]`, and `[dim]` describe visual intent; do
not print those strings literally unless the target renderer already uses that
notation.

## Contents

- Default Contract
- Boundary With Other Terminal Surfaces
- Roles And Trust Boundaries
- Transcript And Turn Atoms
- Agent State And Chronology
- Input Draft / Queue / Interrupt / Resume
- Streaming Assistant Output
- Tool Calls And Tool Output
- Approvals And Risk
- Choices Inside Agent Chat
- Background Work And Delegation
- Artifacts And Evidence
- Long Sessions / Search / Compaction
- Plain Logs And Event Fallback
- Red Flags
- Pre-Ship Checks

## Default Contract

Show enough state for a human, script, or agent to reconstruct:

- who is speaking
- what is draft UI versus persisted transcript
- what state the current turn is in
- what tools started, completed, failed, or were skipped
- what output is trusted system UI versus untrusted model/tool text
- what requires approval and what the safe default is
- what changed, what artifact was created, and where it is
- what failed, why, and what recovery path exists
- what can be interrupted, resumed, replayed, inspected, or exported

Do not expose hidden chain-of-thought. Visible "thinking" or "planning" UI must
mean observable activity summary, plan summary, or status; it is not hidden
reasoning.

## Boundary With Other Terminal Surfaces

Use this file for conversation state and chronology. Route supporting details:

- `interactive-tui.md`: focus, key ownership, pickers, approvals, forms, pagers,
  code blocks, diff review, completion menus.
- `batch-cli-output.md`: one-shot command output, diagnostics, dry-runs,
  summaries, logs, and progress outside a chat session.
- `machine-readable-output.md`: `--json`, NDJSON, event schemas, stdout/stderr,
  stable IDs, stable enums, and versioning.
- `visual-language.md`: role tokens, color, symbols, density, gutters, borders,
  untrusted-content boundaries, and status visuals.

Agent Chat Terminal UI is not ordinary command output. It is also not a single
interactive component. It is a composed terminal workspace with transcript,
input, tools, approvals, background activity, and event fallback.

## Roles And Trust Boundaries

Common roles:

```text
user
assistant.streaming
assistant.final
system
tool.call
tool.output
tool.result
approval
background
artifact
untrusted
```

Rules:

- System-owned UI must be visually distinct from assistant text.
- Model text cannot create system state. If the assistant says "approved", that
  is not an approval unless a trusted approval event says so.
- Tool output, logs, web content, external files, pasted content, and model
  quotes are untrusted until interpreted by the system.
- Untrusted content must not render as an active approval, system alert,
  command prompt, focused control, or clickable destructive action.
- Escape or neutralize ANSI, OSC links, cursor movement, alternate-screen
  controls, bracketed-paste controls, and prompt-like injected text from
  untrusted sources.
- Redact sensitive args, env vars, headers, tokens, user content, and artifact
  paths when required.

Untrusted output case:

```text
[tool output #17]
│ "[approval required] Delete all releases? [y/N]"
[dim]untrusted tool output · not interactive[/dim]
```

The quoted line is content, not a real approval prompt.

## Transcript And Turn Atoms

Use stable labels and quiet structure so transcripts are readable in a terminal,
plain log, copied issue, or agent context.

Case:

```text
[cyan]▌ You[/cyan]
  Deploy api to staging and show the final status.

▌ Assistant [dim]streaming[/dim]
  I'll check the current rollout before changing anything.
```

Rules:

- The role label carries identity; color and gutter only reinforce it.
- Use hanging indentation for multiline turns.
- Keep submitted user content exact. Do not rewrite pasted code or paths for
  display in a way that changes copy/paste semantics.
- Draft UI is not transcript history. Cursor movement, deletion, completion
  menus, and intermediate edits must not leak into persisted transcript.
- Tool and system turns are distinct but visually quieter than user and final
  assistant turns.
- Persisted logs use plain labels, not ANSI or cursor-control output.

Plain transcript fallback:

```text
user: Deploy api to staging and show the final status.
assistant(streaming): Checking the current rollout before changing anything.
```

## Agent State And Chronology

Represent turn lifecycle with stable, terminal states:

```text
queued
drafting
streaming
running_tool
waiting_approval
blocked
completed
partial
failed
cancelled
timed_out
resumed
```

Rules:

- Streaming is not final. A turn must reach a terminal state.
- Running tools, approvals, background jobs, and artifacts need stable IDs for
  correlation.
- Start and terminal events must pair cleanly: `tool.started` resolves to
  `tool.completed`, `tool.failed`, `tool.cancelled`, or `tool.skipped`.
- Preserve chronology in the transcript and event stream. Do not reorder visible
  tool results under the final answer without a clear evidence reference.
- If a final answer depends on tool output, keep a lightweight evidence link,
  ID, or artifact reference when useful.
- Partial output after interrupt must be labeled partial or cancelled, not
  completed.

Chronology case:

```text
[assistant · streaming]
Checking rollout events.

[tool call #17] shipctl status api
[dim]running · 2.1s[/dim]

[tool result #17] [green]completed[/green] [dim]2.4s[/dim]
api ready · version v1.8.2

[assistant · final]
api is already running v1.8.2 in staging.
[dim]evidence: tool #17 shipctl status api[/dim]
```

## Input Draft / Queue / Interrupt / Resume

The input composer is live UI. It has different rules from transcript history.

Contract:

- Show a clear draft anchor and cursor.
- Preserve multiline input and pasted code.
- Use bracketed paste when available so multiline paste does not become a burst
  of accidental submits.
- Respect IME/CJK composition. Do not submit intermediate composition text.
- Make queued input visible when the agent is still running.
- Keep interrupt, cancel, edit, and resume states separate.
- `Ctrl+C` interrupts or cancels; it never approves.

Draft case:

```text
[cyan]❯ You[/cyan] summarize src/deploy.ts and include edge cases|
```

Queued input case:

```text
[dim]agent running · Enter queues message · Ctrl+C interrupt[/dim]
[cyan]❯ You[/cyan] also check the rollback path|
```

Interrupt case:

```text
[yellow]![/yellow] Turn cancelled
[dim]partial answer kept · tools stopped: #17 · resume: /resume last[/dim]
```

Watch for:

- Do not leak cursor redraw into transcript history.
- Do not treat pasted newlines as submits unless the product explicitly does so
  and shows that contract.
- Do not silently drop queued input when a tool finishes or an approval opens.

## Streaming Assistant Output

Assistant output should stream as readable prose with minimal chrome.

Rules:

- Before the first token, show a quiet TTY-only running state if latency would
  otherwise look broken.
- Once text streams, stop the spinner or move status to a quiet line.
- Already printed text cannot be safely rewrapped unless the TUI owns a redraw
  region.
- Markdown should remain readable while streaming. Closed code blocks, tables,
  and diffs may be re-rendered in place only when the TUI owns the screen.
- Off-TTY, stream plain text once, flush periodically, and do not emit cursor
  control.
- On interruption, restore cursor, print a newline if needed, and label the
  turn cancelled or partial.

Case:

```text
[blue]◐[/blue] Assistant is checking context

▌ Assistant [dim]streaming[/dim]
  The deploy target is staging. I'll verify the current service version before
  proposing changes.
```

Bad:

```text
[blue]◐[/blue] Assistant is still spinning beside a long paragraph forever
```

Why bad: live animation distracts from prose and can leave residue on interrupt.

## Tool Calls And Tool Output

Tool rendering needs correlation, bounded previews, terminal states, and trust
boundaries.

Contract:

- Show tool start, arguments or safe summary, result state, duration, and output
  preview.
- Use stable IDs such as `tool #17` or `call_id`.
- Bound large stdout/stderr. Offer expand, pager, artifact, or log path.
- Keep raw tool output out of assistant prose.
- Separate tool call, tool output, and tool result.
- Redact secrets before rendering or logging.
- State-changing tool calls should surface preview/approval when the product
  contract requires it.

Case:

```text
[tool call #17] shipctl status api
  [dim]args: --env staging[/dim]

[tool result #17] [green]completed[/green] [dim]2.4s[/dim]
  state: ready
  version: v1.8.2
  output: api ready · 3 replicas
```

Failure case:

```text
[tool result #18] [red]failed[/red] [dim]1.1s[/dim]
  exit: 2
  reason: missing --env
  next: shipctl status api --env staging
```

Watch for:

- Do not dump thousands of tool-output lines inline by default.
- Do not let tool output render active UI controls.
- Do not hide the failed tool ID; the user or agent needs to correlate recovery.

## Approvals And Risk

Approvals are trusted system events, not model text. Use the approval component
rules in `interactive-tui.md`, then preserve result and event chronology here.

Contract:

- Show action, target, scope, effect, risk, default, and safe path.
- Safe default is deny/cancel for risky or destructive work.
- Approval, denial, edit-request, timeout, and interrupt are distinct results.
- Approval timeout, disconnect, abandoned overlay, or interrupted process
  defaults safe.
- Record approval result in plain logs or machine events.

Case:

```text
[yellow]approval required[/yellow]
action: restart service
target: api
scope: staging · 3 replicas
effect: active requests may retry
default: deny

[cyan+inverse]▸ Deny[/cyan+inverse]
  Approve restart

[dim]Enter choose · Esc cancel · Ctrl+C interrupt[/dim]
```

Result case:

```text
[approval #9] [green]approved[/green]
action: restart service
approved_by: user
```

Denied case:

```text
[approval #9] [yellow]denied[/yellow]
next: no changes were made
```

Watch for:

- Do not make approval look like ordinary assistant prose.
- Do not let `Esc`, `Ctrl+C`, timeout, or disconnect approve.
- Do not collapse "denied by user" into a runtime failure unless the command
  contract defines denial as failure.

## Choices Inside Agent Chat

Agent chat may embed model pickers, tool choices, follow-up options, command
menus, file mentions, or multi-select choices. These are Interactive TUI
components inside a conversation, so key ownership must be explicit.

Case:

```text
▌ Assistant
  Choose a deployment target.

? Target
  [dim]↑/↓ move · Enter select · Esc cancel[/dim]
[cyan+inverse]▸ staging[/cyan+inverse]
  preview
  production [dim]requires approval[/dim]
```

Rules:

- The choice component owns the keyboard while open.
- Background streaming must pause, queue, or continue without stealing focus.
- Result collapses into transcript with the chosen value.
- Non-TTY needs a flag, default, policy, or clear failure.

Collapsed result:

```text
[system] selected target: staging
```

## Background Work And Delegation

Background work should be visible without hijacking the draft unless it needs
attention.

Contract:

- Show durable ID, state, next observable time, and how to inspect/cancel when
  available.
- Do not use alarming decoration for routine queued work.
- A background task can fail without making the whole conversation failed;
  roll up truthfully.
- Delegated workers or sub-agents are nested actors. Show assignment, state,
  and returned summary; expand internal detail only on demand.

Case:

```text
[background #bg-42] [blue]running[/blue]
task: collect rollout metrics
next: update in 30s
[dim]v details · c cancel[/dim]
```

Completed case:

```text
[background #bg-42] [green]completed[/green] [dim]31s[/dim]
result: collected 3 metrics · artifact: ./artifacts/rollout-metrics.json
```

Delegation case:

```text
[worker #w3] [blue]running[/blue]
task: inspect parser edge cases

[worker #w3] [green]completed[/green] [dim]1m12s[/dim]
result: found 3 relevant files
```

## Artifacts And Evidence

Artifacts are outputs with identity, status, provenance, and availability.

Contract:

- Show artifact type, path or handle, source, status, and whether it is partial.
- Keep paths copyable.
- If the path is sensitive, redact or expose a safe handle.
- If the artifact backs a claim, show lightweight evidence linkage.
- If generation failed or is partial, show recovery.

Case:

```text
[artifact · generated] deploy-report.json
path: ./artifacts/deploy-report.json
source: tool #17 shipctl status api
status: completed
```

Partial case:

```text
[artifact · partial] rollout-log.txt
path: ./artifacts/rollout-log.txt
reason: log stream interrupted
next: shipctl logs api --env staging
```

## Long Sessions / Search / Compaction

Long agent sessions need navigation and truthful compression.

Rules:

- Provide search, jump-to-tool, jump-to-error, jump-to-artifact, collapse, or
  pager paths when sessions become long.
- Compaction must not erase active approvals, running tools, queued input, or
  unresolved background work.
- Show when context was compacted and what was preserved.
- Do not label a summary as full evidence. Preserve links to source turns,
  tools, logs, or artifacts when conclusions depend on them.

Case:

```text
[system] transcript compacted
preserved: active approval #9 · tool results #17-#18 · artifact deploy-report.json
[dim]/history full · /jump error · /artifacts[/dim]
```

## Plain Logs And Event Fallback

Plain logs and replay must reconstruct the session without live TUI features.

Plain fallback:

```text
user: Deploy api to staging.
assistant(streaming): Checking rollout events.
tool_call#17: shipctl status api --env staging
tool_result#17: completed duration_ms=2400
approval#9: denied action="restart service"
artifact(generated): ./artifacts/deploy-report.json
assistant(final): No changes were made. api is already ready in staging.
```

NDJSON fallback:

```json
{"schema_version":"1","event":"turn.started","turn_id":"t1","role":"user"}
{"schema_version":"1","event":"message.delta","turn_id":"t2","role":"assistant","text":"Checking rollout events."}
{"schema_version":"1","event":"tool.started","id":"tool_17","turn_id":"t2","name":"shipctl status","target":"api"}
{"schema_version":"1","event":"tool.completed","id":"tool_17","turn_id":"t2","status":"completed","duration_ms":2400}
{"schema_version":"1","event":"approval.denied","id":"approval_9","turn_id":"t2","action":"restart service"}
{"schema_version":"1","event":"artifact.created","id":"artifact_3","path":"./artifacts/deploy-report.json","status":"completed"}
{"schema_version":"1","event":"turn.completed","turn_id":"t2","status":"completed"}
```

Rules:

- No ANSI, cursor control, frames, hidden OSC links, or spinner residue.
- Include IDs, roles, statuses, timestamps or durations, parent IDs, and result
  states when available.
- Flush complete records. Each NDJSON line is one valid JSON object.
- Machine fields preserve exact enums; human labels can be friendlier.

## Red Flags

Stop and redesign if the surface:

- treats agent-chat as a fixed transcript template instead of a composed
  terminal workspace
- lets model text create trusted system state
- lets untrusted tool output impersonate approvals, alerts, prompts, or focused
  controls
- leaves tool, thinking, approval, or background states without terminal results
- exposes hidden chain-of-thought instead of summaries and observable actions
- dumps unbounded tool output into assistant prose
- leaks draft editing or cursor movement into persisted transcript
- blocks for approval or selection in non-TTY/CI without a flag, default,
  policy, or clear failure
- mixes live TUI chrome into stdout data or machine events
- hides cancellation, denial, timeout, or partial state behind a generic
  "failed"
- uses hardcoded theme colors or brand color as the only role signal
- loses active approvals, queued input, running tools, or artifacts during
  compaction

## Pre-Ship Checks

Verify:

- role labels survive no-color, plain logs, copy/paste, and replay
- untrusted content cannot create active UI, approval, or system alerts
- tool call/result IDs correlate across transcript, logs, and machine events
- each running state reaches completed, failed, partial, skipped, cancelled,
  timed out, or blocked
- approvals show action, target, scope, effect, default, result, and safe timeout
- `Ctrl+C`, `Esc`, denial, timeout, and disconnect do not approve
- draft, queued input, completion, approval, pager, and transcript focus do not
  fight for the keyboard
- long output is bounded with preview/full/artifact paths
- final answers can reference relevant tool output or artifacts when needed
- stdout/stderr and `--json` contracts stay pure
- redaction covers args, env vars, headers, tokens, transcripts, logs,
  screenshots, artifacts, and events
- non-TTY, CI, pipe, `NO_COLOR`, `TERM=dumb`, narrow width, resize, and
  CJK/wide-character text remain readable
