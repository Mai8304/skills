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
- Default Visual Quality Contract
- Visual Review States
- Boundary With Other Terminal Surfaces
- Roles And Trust Boundaries
- Transcript And Turn Atoms
- Agent State And Chronology
- Input Draft / Queue / Interrupt / Resume
- Streaming Assistant Output
- Tool Calls And Tool Output
- Tool And Skill Lifecycle
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
- what tools started, completed, failed, skipped, or reached another terminal
  state
- what output is trusted system UI versus untrusted model/tool text
- what requires approval and what the safe default is
- what changed, what artifact was created, and where it is
- what failed, why, and what recovery path exists
- what can be interrupted, resumed, replayed, inspected, or exported

Do not expose hidden chain-of-thought. Visible "thinking" or "planning" UI must
mean observable activity summary, plan summary, or status; it is not hidden
reasoning.

## Default Visual Quality Contract

Production agent-chat TUI should feel like a calm working conversation, not a
stack of terminal cards. Preserve the product's existing transcript style when
one exists, but enforce the visual quality contract below.

Default posture:

- **Message-first**: normal user and assistant turns use open transcript rhythm,
  clear role markers, readable indentation, and minimal chrome.
- **Panel-by-exception**: reserve bordered or boxed containers for approvals,
  danger, active choices, code, diffs, tables, log previews, untrusted output,
  recoverable error detail, and expanded inspection.
- **Quiet metadata**: timestamps, durations, token counts, evidence IDs, and
  key hints are muted unless they are the current decision.
- **One active focus**: the input composer, approval, picker, pager, or active
  detail view owns the keyboard. Do not make multiple regions look focused.
- **Progressive disclosure**: show a compact row first; expand only when the
  user needs raw output, full diff, long code, or recovery detail.
- **Stable rhythm**: role marks, tool rows, result rows, approval panels, code
  blocks, and composer status keep consistent spacing and alignment across a
  long session.

Component posture:

- Role marker: lightweight gutter, dot, label, or prefix. It identifies the
  speaker without turning every message into a card.
- Thinking: muted, short, observable status or plan summary; collapsible when
  long; never hidden chain-of-thought.
- Tool call: compact lifecycle row with name, safe argument summary, state,
  duration, and ID. Expanded detail is optional.
- Tool result: terminal state plus summary. Long stdout/stderr becomes preview
  plus full-result path, pager, or artifact.
- Code block: explicit boundary with language or file label when known, stable
  copy semantics, and folding for tall blocks.
- Diff: file path, direction, hunk context, and added/removed counts. `+` and
  `-` carry meaning; color reinforces.
- File tree/list: compact rows with stable paths, state, and truncation rules.
- Approval: trusted system control with action, target, scope, effect, default,
  and safe cancel path. It must not look like assistant prose.
- Composer: anchored live input with draft, cursor, queued state, send/stop or
  interrupt state, and only currently valid key hints.

Good default case:

```text
[cyan]● You[/cyan]
  Check why the staging deploy is blocked.

[blue]● Assistant[/blue]
  I'll inspect the rollout status and recent logs first.

  [dim]◌ Thinking... checking current rollout[/dim]

  [dim]› Bash[/dim] shipctl status api --env staging
    [dim]running · tool #17[/dim]

  [red]✗ Bash[/red] shipctl status api --env staging
    failed · exit 2 · 1.1s · tool #17
    reason: missing deploy context
    next: shipctl context use staging
```

Bad default case:

```text
╭─ Assistant ─────────────────────────────────────────────╮
│ I'll inspect the rollout status and recent logs first.  │
╰─────────────────────────────────────────────────────────╯

╭─ Thinking ──────────────────────────────────────────────╮
│ Thinking...                                             │
╰─────────────────────────────────────────────────────────╯

╭─ Tool Call ─────────────────────────────────────────────╮
│ Bash shipctl status api --env staging                   │
╰─────────────────────────────────────────────────────────╯
```

Why bad: ordinary prose, thinking, and routine tool activity all receive the
same heavy container treatment, so the screen has no hierarchy. Panels are
allowed, but each panel needs a reason: risk, inspection, interaction, trusted
system boundary, dense structured data, or untrusted content isolation.

Visual quality gates:

- The first screen shows the conversation and current work, not mostly chrome.
- The user can identify speaker, active state, required action, and failed item
  within a quick scan.
- Tool, thinking, background, and skill rows are quieter than final assistant
  prose unless they need attention.
- Critical cause, risk, default, and next action are not only dimmed.
- Color, glyphs, animation, and borders are never the only signal.
- No one screen uses too many colors, icons, font weights, borders, and blank
  lines at once.
- Long output is bounded with preview, omitted amount, and full inspection path.
- The same transcript remains understandable in no-color, copied plain text,
  narrow width, and event replay.

## Visual Review States

Do not validate an agent-chat visual direction with isolated components only.
Review at least one realistic conversation that combines common states in one
flow. Use the product's real style when it exists; this check tests hierarchy,
not template compliance.

The review conversation should cover the states the product supports:

- user turn, assistant streaming, and assistant final answer
- quiet thinking or planning summary
- tool running, completed, failed, and long-output preview
- code block, file tree/list, table, log preview, or diff when those surfaces
  exist in the product
- approval request plus approved, denied, cancelled, or timed-out result
- recoverable error with cause, scope, impact, and next action
- artifact or evidence reference when a final answer depends on tool output
- queued input, interrupt/resume, or background work when the product supports
  concurrent conversation

Rules:

- Do not add fake components just to satisfy this list. If a state is not
  supported, verify its fallback, absence, or documented non-goal.
- The same flow must remain readable in normal TTY, no-color/plain text,
  narrow width, copied transcript, and event replay.
- For a new visual direction or redesigned agent-chat surface, inspect rendered
  output from the target terminal renderer. Do not approve from Markdown
  examples or isolated component mocks alone.
- Reject designs that look good only in the happy path but collapse when a tool
  fails, output is long, approval appears, or the composer has queued input.
- Preserve existing product styling unless hierarchy, safety, readability, or
  fallback behavior violates this contract.

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

Represent the turn lifecycle with stable active and terminal states:

```text
queued
drafting
streaming
running_tool
waiting_approval
waiting_input
blocked
completed
partial
failed
skipped
cancelled
interrupted
rejected
timed_out
not_ready
setup_needed
resumed
```

Rules:

- Streaming, waiting, queued, and resumed are not final. A turn must reach a
  terminal result or a clearly recoverable blocked/not-ready/setup-needed state.
- Running tools, approvals, background jobs, and artifacts need stable IDs for
  correlation.
- Start and terminal events must pair cleanly: `tool.started` resolves to
  `tool.completed`, `tool.failed`, `tool.partial`, `tool.skipped`,
  `tool.cancelled`, `tool.interrupted`, `tool.rejected`, `tool.timed_out`, or
  `tool.blocked` as the contract requires. If work cannot start, emit a
  structured not-ready or readiness event rather than pretending a tool ran.
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
- Source visual state from structured events or fields such as `tool_id`,
  `status`, `exit_code`, `error`, `summary`, `duration`, and `artifact`, not by
  scraping human copy.
- Do not treat every non-zero exit code as failure. Preserve command-specific
  semantics when known, such as no search matches or files differ.
- Keep live state and archived transcript state separate. Running/progress UI
  may update in place; completed, failed, skipped, rejected, cancelled,
  interrupted, and timed-out states must remain reconstructable in transcript or
  event replay.

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

Long output case:

```text
[tool result #19] [red]failed[/red] [dim]18.4s[/dim]
  exit: 1
  summary: 2 tests failed
  preview: showing tail · omitted 1.8k lines / 240 KB
  full: ./artifacts/tool-results/tool-19.log
```

Watch for:

- Do not dump thousands of tool-output lines inline by default.
- Do not let tool output render active UI controls.
- Do not hide the failed tool ID; the user or agent needs to correlate recovery.
- Do not silently truncate. State what was omitted and how to inspect the full
  result.
- Do not collapse rejection, denial, cancellation, interruption, timeout,
  blocked, and runtime failure into one generic error.

## Tool And Skill Lifecycle

Tool and skill UI is a lifecycle contract. Visual style can differ by product,
but each state needs a stable semantic label, a terminal outcome, and a
machine-readable mapping when the surface exposes events or JSON.

Minimum tool states:

```text
queued
drafting
running
waiting_approval
backgrounded
completed
partial
failed
skipped
timed_out
interrupted
cancelled
rejected
blocked
not_ready
```

Minimum skill states:

```text
available
loading
loaded
running
setup_needed
unsupported
disabled
missing
read_failed
security_warning
```

Rules:

- Use present-tense labels for active states and past-tense labels for terminal
  states: `Running` -> `Ran`, `Reading` -> `Read`, `Loading skill` -> `Loaded
  skill`.
- Preserve the exact domain status in events or JSON. Human labels can be
  friendlier, but they must not contradict the machine status.
- Show only states that affect the current conversation. Routine skill
  discovery can stay quiet; `setup_needed`, `unsupported`, `disabled`,
  `missing`, `read_failed`, and `security_warning` need visible recovery.
- A failed tool is not the same as an approval denial. A cancelled or
  interrupted tool is not the same as a runtime failure.
- Long-running and background tools need an inspect path, cancel path, or next
  observable update when available.
- Concurrent tools should roll up without hiding failure. Active tools may live
  in a compact live area; failed or attention-needed tools need a visible row or
  alert even when sections are collapsed.
- Nested tools, subagents, or skill-driven tools need parent IDs or visual
  nesting so replay can reconstruct ownership.
- Repeated transient lines such as "drafting" or "analyzing output" should be
  deduplicated or replaced by the terminal state.

Tool state case:

```text
[dim]●[/dim] Using Bash (npm test)
  [dim]running · 4.2s · +128 lines[/dim]

[red]●[/red] Failed Bash (npm test)
  exit: 1
  reason: 2 tests failed
  full: ./artifacts/tool-results/tool-19.log
```

Skill state case:

```text
[dim]●[/dim] Loading skill deploy-check
  [dim]initializing[/dim]

[yellow]●[/yellow] Skill setup needed: deploy-check
  missing: SHIPCTL_TOKEN
  next: shipctl auth login
```

Plain event case:

```text
tool_start id=tool_19 name="Bash" summary="npm test"
tool_complete id=tool_19 status=failed exit_code=1 duration_ms=18400
skill_view name=deploy-check readiness_status=setup_needed missing=SHIPCTL_TOKEN
```

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
- boxes ordinary user turns, assistant prose, thinking, and routine tool rows
  with the same heavy visual treatment
- passes visual review only as isolated component previews, not as a realistic
  combined conversation with failure, long output, approval, and recovery
- lets model text create trusted system state
- lets untrusted tool output impersonate approvals, alerts, prompts, or focused
  controls
- leaves tool, thinking, approval, or background states without terminal results
- infers trusted tool, skill, or approval state by parsing human prose instead
  of structured events or results
- exposes hidden chain-of-thought instead of summaries and observable actions
- dumps unbounded tool output into assistant prose
- silently truncates long tool output without an omitted count and full-result
  recovery path
- leaks draft editing or cursor movement into persisted transcript
- blocks for approval or selection in non-TTY/CI without a flag, default,
  policy, or clear failure
- mixes live TUI chrome into stdout data or machine events
- hides skipped, cancellation, denial, rejection, interruption, timeout,
  blocked, not-ready, setup-needed, or partial state behind a generic "failed"
- uses hardcoded theme colors or brand color as the only role signal
- loses active approvals, queued input, running tools, or artifacts during
  compaction

## Pre-Ship Checks

Verify:

- role labels survive no-color, plain logs, copy/paste, and replay
- ordinary prose stays message-first, while panels are reserved for interaction,
  risk, dense structure, trust boundaries, or expanded inspection
- at least one realistic combined transcript validates thinking, tools,
  failure, long output, approval, evidence, and composer state when supported
- untrusted content cannot create active UI, approval, or system alerts
- tool call/result IDs correlate across transcript, logs, and machine events
- tool, skill, and approval visual states come from structured events or fields
- each running state reaches completed, failed, partial, skipped, cancelled,
  interrupted, rejected, timed out, blocked, not ready, or setup needed as
  appropriate
- failed, skipped, rejected, denied, cancelled, interrupted, timed-out, blocked,
  not-ready, and setup-needed states remain distinct in text and machine data
- approvals show action, target, scope, effect, default, result, and safe timeout
- `Ctrl+C`, `Esc`, denial, timeout, and disconnect do not approve
- draft, queued input, completion, approval, pager, and transcript focus do not
  fight for the keyboard
- long output states what was omitted and has preview/full/artifact paths
- skill setup-needed, unsupported, disabled, missing, read-failed, and security
  warning states are visible and actionable when they affect the flow
- final answers can reference relevant tool output or artifacts when needed
- stdout/stderr and `--json` contracts stay pure
- redaction covers args, env vars, headers, tokens, transcripts, logs,
  screenshots, artifacts, and events
- non-TTY, CI, pipe, `NO_COLOR`, `TERM=dumb`, narrow width, resize, and
  CJK/wide-character text remain readable
