# Visual Language

Terminal visual language is a semantic contract. It makes state, focus, trust,
risk, and next action easier to scan, but it must survive without color,
Unicode, animation, borders, or live redraw.

Use this order:

1. Name the semantic role.
2. Preserve the meaning in text.
3. Add a symbol or layout cue when useful.
4. Apply a project theme token.
5. Verify the fallback.

Examples in this file are recipes, not templates. Inline style markers such as
`[green]` or `[cyan+inverse]` describe visual intent; do not print those marker
strings literally unless the target renderer already uses that notation. Prefer
the project's existing theme tokens, renderers, and conventions unless they
violate a hard invariant.

## Contents

- Default Contract
- Semantic Roles
- Status Colors And Symbols
- Tool / Skill Lifecycle Tokens
- Focus / Selection / Input / Disabled / Danger
- Symbols And ASCII Fallback
- Format / Density / Spacing / Borders
- Tables / Code / Diff / Logs
- Agent Chat Visual Roles
- Color Policy / Theme Tokens / Accessibility
- Red Flags

## Default Contract

- Use semantic tokens, not literal colors.
- Let color reinforce meaning; never let it own meaning.
- Keep the role set small. Do not create a new color for every domain status.
- Preserve exact domain status in text, JSON, event fields, or detail lines.
- Keep terminal output useful when copied to logs, issues, pipes, or agent
  context.

Common semantic tokens include:

```text
text
muted
metadata
success
warning
error
running / active
info
neutral
attention
danger
cancelled
focus
selection
disabled
untrusted
diff.added
diff.removed
diff.context
artifact
role.user
role.assistant
role.system
role.tool
role.approval
role.background
```

## Semantic Roles

Use these roles consistently across batch CLI output, interactive TUI, and
agent-chat terminal UI:

- **text / muted / metadata**: body text, supporting details, timestamps, counts,
  hints, and secondary paths.
- **status**: outcome, readiness, or lifecycle state such as completed,
  changed, unchanged, empty, failed, running, partial, skipped, cancelled,
  interrupted, rejected, timed out, blocked, not ready, setup needed, or waiting
  approval.
- **focus**: the single current keyboard target.
- **selection**: data selected by the user. It may be multiple; it is not the
  same as focus.
- **input / editing**: current text editing mode and cursor state.
- **disabled**: unavailable or forbidden items. Explain why when the user could
  reasonably try to choose them.
- **danger**: high-risk or destructive action before it happens. It is not the
  same as error.
- **untrusted**: tool output, logs, web content, external files, or model-quoted
  content that must not impersonate system UI.
- **diff**: added, removed, context, file path, hunk, word highlight.
- **artifact / path / link / copy target**: generated files, URLs, commands,
  IDs, reports, patches, logs, screenshots.
- **agent roles**: user, assistant, system, tool call, tool output, approval,
  background task, artifact, untrusted content.

## Status Colors And Symbols

Use a small semantic role set, then map domain statuses into it:

```text
success
warning
error
running
info
neutral
attention
danger
cancelled
```

Do not encode every domain status as a new color. Keep the exact domain status
in text, JSON, or event fields.

Common defaults:

```text
success   -> success token + ✓ / OK   + completed
warning   -> warning token + ! / WARN + warning/partial/degraded
error     -> error token   + ✗ / ERR  + failed/error
running   -> active token  + spinner/RUN + running/waiting
info      -> info token    + i / INFO + informational context
neutral   -> default/muted + NOOP     + no-op/unchanged/empty
attention -> warning/attention token + label + needs input/approval/waiting
danger    -> danger token + explicit risk text + destructive/privileged action
cancelled -> warning/neutral token + CANCELLED + interrupted/cancelled
```

Case:

```text
[green]✓[/green] Deploy completed
[dim]service api · version v1.8.2 · 42s[/dim]

[yellow]![/yellow] Deploy partially completed
[dim]updated 3 · skipped 1 · next: shipctl deploy retry --skipped[/dim]

[red]✗[/red] Deploy failed
reason: registry token expired
[dim]next: shipctl auth refresh[/dim]
```

Fallback:

```text
OK   Deploy completed
WARN Deploy partially completed
ERR  Deploy failed
RUN  Deploying api
INFO Using cached config
NOOP service api already up to date
```

Rules:

- Separate **state**, **severity**, and **role**. `error` means failure already
  happened; `danger` means a risky action is being proposed.
- Keep partial, degraded, warning, skipped, cancelled, interrupted, rejected,
  blocked, not-ready, and setup-needed states distinct in text and machine data
  even when they share a warning or attention visual role.
- Treat `running` as non-terminal. It must resolve to completed, changed,
  unchanged, failed, partial, skipped, cancelled, interrupted, rejected, timed
  out, blocked, not ready, or setup needed.
- Use `info` for low-priority context. Do not let it collide with focus, link,
  copy target, or brand accent.
- Empty or no-op states are usually neutral, not errors.
- Show outcome and change separately:

```text
[green]✓[/green] Deploy completed
[dim]changed: api · unchanged: worker · skipped: legacy[/dim]
```

## Tool / Skill Lifecycle Tokens

Tool and skill visuals should share semantic state, not a fixed component
template. Map domain lifecycle states into a small token set, then keep the
exact domain state in text, events, or JSON.

Default mapping:

| Domain state | Visual role | Symbol fallback | Human label |
|---|---|---:|---|
| `queued` | muted / neutral | `...` | queued |
| `drafting` | muted / running | `...` | drafting |
| `running` | running / active | `RUN` | running |
| `waiting_approval` | attention | `!` | approval required |
| `backgrounded` | info / muted | `BG` | running in background |
| `completed` | success | `OK` | completed |
| `partial` | warning | `PARTIAL` | partial |
| `failed` | error | `ERR` | failed |
| `skipped` | neutral / warning | `SKIP` | skipped |
| `timed_out` | error / warning | `TIMEOUT` | timed out |
| `interrupted` | warning / neutral | `INT` | interrupted |
| `cancelled` | warning / neutral | `CANCELLED` | cancelled |
| `rejected` | warning / neutral | `DENIED` | rejected |
| `blocked` | attention / warning | `BLOCKED` | blocked |
| `not_ready` | info / warning | `WAIT` | not ready |
| `setup_needed` | attention / warning | `SETUP` | setup needed |
| `unsupported` | disabled / warning | `UNSUPPORTED` | unsupported |
| `disabled` | disabled | `DISABLED` | disabled |
| `missing` / `read_failed` | error | `ERR` | missing / read failed |
| `security_warning` | danger / warning | `WARN` | security warning |

Rules:

- Keep state, role, and severity separate. `waiting_approval` is not failure;
  `danger` is before a risky action; `error` is after something failed.
- Active states use present-tense verbs. Terminal states use past-tense or
  outcome words.
- Running indicators are TTY-only and must resolve to a terminal state.
- A yellow/warning row must still say whether it is `partial`, `skipped`,
  `interrupted`, `rejected`, `blocked`, `not_ready`, `setup_needed`, or
  `cancelled`.
- Skill availability is usually quiet. Show skill state when it affects action:
  setup needed, unsupported platform, disabled skill, missing file, read
  failure, or security warning.
- Long output uses muted detail for counts and inspect path, but not for the
  only failure cause or recovery step.
- Do not encode status by symbol alone. Pair `●`, `✓`, `✗`, spinner, or color
  with text.
- If a product uses role dots, keep dot meaning stable across the transcript:
  dim/active for running, success for completed, error for failed, warning for
  attention-needed.

Case:

```text
[dim]●[/dim] Using Bash (npm test)
  [dim]running · 4.2s · +128 lines[/dim]

[green]●[/green] Used Bash (npm test)
  312 passed · 2 skipped

[red]●[/red] Failed Bash (npm test)
  exit: 1
  reason: 2 tests failed
  next: open ./artifacts/tool-results/tool-19.log

[yellow]●[/yellow] Skill setup needed: deploy-check
  missing: SHIPCTL_TOKEN
  next: shipctl auth login
```

Plain fallback:

```text
RUN  Bash npm test 4.2s +128 lines
OK   Bash npm test 312 passed 2 skipped
ERR  Bash npm test exit=1 reason="2 tests failed"
SETUP skill deploy-check missing=SHIPCTL_TOKEN
```

## Focus / Selection / Input / Disabled / Danger

Never let focus, selection, default, and confirmation collapse into one visual
state.

```text
focus     = the current keyboard target
selection = selected data, bound to stable identity
input     = current editing mode and cursor state
disabled  = unavailable or forbidden item
danger    = high-risk action or destructive impact
```

Case:

```text
[cyan+inverse]▸ [ ] api[/cyan+inverse]
[green]  [✓] worker[/green]
[dim]    [ ] legacy (unsupported)[/dim]

[dim]↑/↓ move · Space toggle · Enter submit · Esc cancel[/dim]
```

Rules:

- There is only one keyboard focus at a time, even in nested panes.
- Focus may use pointer, inverse, background, or accent, but it must be visible
  without relying only on hue.
- Selection uses a checkbox, selected text, or stable selection marker. It must
  not be represented only by background color.
- Selection binds to stable object identity, not visible row number. Filtering,
  sorting, and paging must not change the selected object.
- Input mode owns the keyboard. Hide or rewrite conflicting browse shortcuts
  such as `/`, `q`, number keys, and `Space`.
- Disabled items should be skipped by default. If disabled items can receive
  focus, the purpose is to reveal the reason; primary action must not fire.
- Distinguish unavailable from forbidden:

```text
[dim]legacy (unsupported)[/dim]
[dim]prod (requires admin)[/dim]
```

- Dangerous actions show object, scope, default, and effect. The safe option is
  the default.

```text
[red]⚠ Delete deployment?[/red]
target: api
scope: 3 replicas
default: deny
effect: traffic will stop

[cyan+inverse]▸ Deny[/cyan+inverse]
[red]  Delete[/red]
```

- `Ctrl+C` and `Esc` must not confirm danger.
- Bulk selection plus danger must show count and scope.
- Closing an overlay or pager should restore focus to the previous object.
- Submit failures should preserve the user's selection context.
- Plain-text reading order should remain sensible: label, status, object,
  reason, next action.

## Symbols And ASCII Fallback

Use a small, local symbol set. Pair every symbol with text. Preserve an ASCII
fallback. Avoid emoji by default.

Common defaults:

| Meaning | Unicode | ASCII fallback |
|---|---:|---|
| success | `✓` | `OK` |
| error | `✗` | `ERR` |
| warning / attention | `!` or `⚠` | `WARN` or explicit label |
| running | spinner or `◐` | `RUN` |
| pointer / focus | `▸` | `>` |
| selected checkbox | `[✓]` | `[x]` |
| unselected checkbox | `[ ]` | `[ ]` |
| selected radio | `(●)` optional | `(*)` |
| unselected radio | `(○)` optional | `( )` |
| diff add | `+` | `+` |
| diff remove | `-` | `-` |
| tree branch | `├─` / `└─` | `|-` / `+-` |
| truncation | `…` | `...` |

Rules:

- A symbol can be reused for warning, attention, and approval only with a clear
  label:

```text
[yellow]! warning[/yellow] 2 services skipped
[yellow]approval required[/yellow] delete deployment api
```

- Use bracketed controls for interactive selection when possible:

```text
[x] selected
[ ] unselected
(*) chosen
( ) not chosen
```

- Spinner frames are TTY-only. Do not persist spinner frames into logs, CI,
  pipe output, JSON, or final states.
- Do not put status glyphs into machine fields:

```json
{"status":"completed","ok":true}
```

- Do not rely on exact font detection. If Unicode support is uncertain, fall
  back to ASCII.
- Keep the symbol budget small. Too many icons, weights, and colors destroy
  scanning hierarchy.
- Snapshot Unicode, ASCII, no-color, and narrow-width variants when the output
  is important.

## Format / Density / Spacing / Borders

Format is information structure, not decoration.

- Use single-line output for low-risk, simple results.
- Use multi-line output when the user needs scope, reason, next action, artifact
  path, or audit detail.
- Use tables for homogeneous rows that need comparison.
- Use vertical lists for one object, heterogeneous fields, long text, narrow
  width, or CJK-heavy data.
- Use panels or borders for modal, approval, inspector, focused overlay, or
  isolated untrusted output. Do not wrap ordinary batch output in decorative
  boxes.

Single-line case:

```text
[green]✓[/green] Deploy completed  api  v1.8.2  42s
```

Multi-line case:

```text
[red]✗[/red] Deploy failed
target: api
reason: registry token expired
next:
  shipctl auth refresh
```

Rules:

- Default output should show the decision-critical information. Put full detail
  behind `--verbose`, pager, artifact, or logs.
- Keep field order stable within an output contract.
- Align shallowly. Do not build complex nested tables for visual neatness.
- Never wrap commands, paths, URLs, IDs, or error codes mid-token. Put copy
  targets on their own line when needed.
- Footer hints are not documentation. Show only current mode's active keys.
- Do not stack title, border, bold, color, icon, and blank lines on the same
  content block unless the risk justifies it.
- Disclose sorting, filtering, grouping, and truncation:

```text
[dim]sorted by status · showing 20 of 142 · / filter[/dim]
```

- Dynamic output should keep positions and fields stable across redraws.
- Preserve terminal scrollback for ordinary batch output. Do not clear the
  screen or enter alternate screen unless the surface is an interactive TUI.
- Cursor control and redraw are TTY-only.
- Below the minimum useful width, switch layout or tell the user how to inspect
  the content.
- Use blank lines as structure: none inside tight rows, one between sections,
  never multiple blank lines as decoration.

## Tables / Code / Diff / Logs

These are different containers:

```text
table = homogeneous object comparison
code  = source, config, command, or structured snippet
diff  = change review
log   = time/source/process/diagnostic stream
```

### Tables

Use tables when rows share the same fields and the reader compares across rows.

```text
SERVICE   STATUS    VERSION   AGE
api       ready     v1.8.2    2m
worker    failed    v1.8.1    5m
```

Rules:

- Define column meaning, units, sort order, and truncation behavior.
- Left-align text. Right-align numbers and mixed-unit durations/sizes by the
  right edge.
- Do not put long errors, long paths, nested JSON, or paragraphs in table cells.
  Switch to a vertical detail layout.
- Repeat or preserve headers in pagers and long views.
- Use stable row identity for actions. Visible row numbers are shortcuts, not
  object IDs.
- Empty tables need an empty state, not a blank screen.

### Code

Separate commands from output so users and agents copy the right thing.

```text
command:
  shipctl auth refresh

output:
  Token refreshed
```

Rules:

- Syntax highlighting must not alter text, spacing, quotes, or invisible
  characters.
- Line numbers help locate problems but should not pollute copyable commands.
- Redact secrets before rendering code blocks, snippets, and command previews.

### Diff

Show direction and risk.

```text
proposed change: config.yaml
- replicas: 1
+ replicas: 3
  image: shipctl/api:v1.8.2
```

Rules:

- `+` and `-` carry the primary meaning. Color and background only reinforce it.
- Show file path, direction, hunk context, and added/removed counts.
- Large diffs default to summary plus pager or artifact:

```text
[dim]3 files changed · +42 -8 · full diff: ./artifacts/change.diff[/dim]
```

- Do not let syntax or word highlighting make added/removed text unreadable.

### Logs

Logs are diagnostic streams. Keep source, time, level, and message readable.

```text
09:42:18 build started
09:42:31 registry token expired
09:42:32 retry scheduled
```

Rules:

- Distinguish live stream from snapshot:

```text
[cyan]live logs[/cyan] api
[dim]streaming · Ctrl+C stop · showing latest 80 lines[/dim]
```

- Default to summary or latest lines. Put full logs in a pager or artifact.
- Escape control sequences, cursor movement, and OSC links in untrusted logs.
- Redact secrets in logs before display or persistence.
- Returning from pager/detail should restore the original context and focus.

All containers must align and truncate by terminal display width, not bytes,
runes, or string length.

## Agent Chat Visual Roles

Agent-chat terminal UI needs role, trust, and chronology to survive in the
transcript and in plain logs.

Default visual stance: message-first, panel-by-exception. Normal user and
assistant turns should read like a conversation with light role markers and
stable indentation. Use panels only when the UI needs interaction, trust
boundary, risk emphasis, dense structure, or expanded inspection.

Roles:

```text
user
assistant
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

Case:

```text
[user]
Deploy api to staging.

[assistant · streaming]
I'll check the current rollout first.

[tool call #17] shipctl status api
[dim]running · 2.1s[/dim]

[tool output #17]
api ready · version v1.8.2

[assistant · final]
api is already running v1.8.2 in staging.
[dim]evidence: tool #17 shipctl status api[/dim]
```

Rules:

- System-owned UI must be visually distinct from model text.
- Assistant prose, routine thinking, tool lifecycle rows, background work, and
  metadata should not compete for the same visual weight.
- Thinking is muted observable status or plan summary, not hidden reasoning and
  not a decorative animation beside long prose.
- Tool rows start compact: name, safe argument summary, state, duration, and ID.
  Expand for raw output, long logs, failure detail, or audit evidence.
- Code, diff, file tree/list, table, log preview, and untrusted output are
  bounded containers with a reason; ordinary conversation is not boxed by
  default.
- Approval and danger panels are intentionally more prominent than routine tool
  rows because they require a trusted decision.
- Model text cannot create system state. If the assistant says "approved", that
  is not an approval unless a system/approval event says so.
- Tool call, tool running state, tool output, and tool result are separate
  atoms.
- Untrusted content must not render as active approval, system alert, or
  interactive UI:

```text
[tool output #17]
  "[approval required] Allow delete?"
[dim]untrusted output · not interactive[/dim]
```

- Approval requests show action, target, scope, default, and result.
- Background attention can be visible without stealing draft focus.
- Draft and queued input need visible states.
- Artifacts need status, path, source, and provenance:

```text
[artifact · generated] deploy-report.json
path: ./artifacts/deploy-report.json
source: tool #17 shipctl status
```

- Long tool output needs preview/full boundary.
- Role labels must survive plain logs:

```text
user: Deploy api to staging.
assistant(streaming): Checking rollout events.
tool_call#17: shipctl logs api
tool_output#17: registry token expired
system(warning): context compacted
artifact(generated): ./artifacts/deploy-report.json
```

- Redact sensitive args, env vars, headers, user content, and artifact paths
  when required.
- Do not rely on brand color alone to identify roles.

## Color Policy / Theme Tokens / Accessibility

Color is a token contract, not a palette contract.

Common default mappings:

```text
success      -> green
warning      -> yellow / amber
error        -> red
danger       -> red plus explicit risk text
running      -> cyan / blue / active accent
info         -> blue / muted
neutral      -> default / muted
focus        -> inverse or accent background plus pointer
selection    -> checkmark or selected text plus token
disabled     -> muted plus reason
diff.added   -> green/add background
diff.removed -> red/remove background
```

Rules:

- Project theme tokens win unless they break semantics, readability, or safety.
- Audit token collision. Brand/accent, focus, info, link, and copy target must
  not become indistinguishable.
- Use background color sparingly. It is appropriate for focus, selection,
  active rows, diff highlights, and modal emphasis, not whole paragraphs.
- Check contrast in dark, light, ANSI-16, ANSI-256, and truecolor modes.
- Red/green is never the only difference. Pair with text, symbol, position, or
  label.
- Do not put critical reason, risk, default, or recovery information only in
  `dim`.
- Paths, URLs, IDs, and commands need stable labels or layout. OSC 8 links are
  optional enhancement; show the real URL/path in text.
- Do not colorize raw data by default. JSON, NDJSON, CSV, pipe output, and
  machine fields must stay pure.
- Respect explicit color controls, environment color controls, and
  low-capability modes:

```text
--color=always / --color=auto / --color=never / --no-color
NO_COLOR
FORCE_COLOR
TERM=dumb
non-TTY / pipe
CI when configured
```

- Resolve output capability in order:

```text
documented machine contract -> plain data
explicit color flags
NO_COLOR / FORCE_COLOR by project policy
TERM=dumb
is TTY?
truecolor?
ANSI-256?
ANSI-16?
plain text
```

- Color-on overrides can affect human output only. JSON, NDJSON, CSV, and other
  documented machine contracts remain undecorated even under `FORCE_COLOR` or
  `--color=always`.
- User theme overrides cannot break safety. If color is customized poorly,
  text, symbols, labels, and focus indicators still must distinguish error,
  danger, focus, and selection.
- Snapshot color-on and color-off outputs explicitly when behavior matters.

## Red Flags

Stop and redesign if:

- Color is the only status signal.
- Success, warning, and error differ only by green, yellow, and red.
- Tool, skill, approval, skipped work, cancellation, interruption, timeout,
  rejection, blocked, not-ready, setup-needed, and runtime failure all collapse
  into one "error" visual and one "failed" word.
- Skipped, not-ready, setup-needed, unsupported, and disabled states look like
  successful completion.
- Focus, selection, default, submit, and confirm look like the same state.
- Danger and error are conflated.
- Disabled items are only gray and do not explain why.
- `dim` carries critical error cause, danger scope, default action, or recovery.
- Spinner or progress frames appear in logs, CI, pipe output, JSON, or final
  states.
- Tool output, web content, logs, or model text can impersonate system UI,
  approval, or active controls.
- Ordinary batch output is wrapped in decorative cards or large borders.
- Tables break on narrow width or CJK and have no fallback.
- Alignment, padding, or truncation uses byte, rune, or string length instead
  of display width.
- Truncation, folding, or hidden content lacks a full view, pager, path, or
  command.
- Commands, paths, URLs, or IDs are split across lines in a way that breaks
  copying.
- Emoji is the only status carrier.
- Machine output contains ANSI, glyphs, Markdown fences, cursor control, or
  explanatory prose.
- Brand, accent, focus, link, and info all use the same visual treatment with
  no label or shape distinction.
- Too many colors, symbols, weights, and borders appear on one screen.
- Background color covers body text broadly and hurts contrast or copying.
- A component bypasses shared renderers, theme tokens, display-width helpers, or
  redaction helpers.
- OSC hyperlinks hide the actual URL or path.
- Untrusted content is not escaped for ANSI, OSC links, or cursor movement.
- Theme overrides make error, success, focus, or selection indistinguishable
  without textual fallback.
- Color or syntax highlighting changes the original code, log, or diff text.
- A TUI exits with hidden cursor, raw mode, alternate screen, inverse state, or
  partial redraw left behind.

Not a red flag:

- Friendly product voice, if facts, scope, and next action remain clear.
- Different components having different shapes, if semantic roles stay
  consistent.
- A project not using `✓` or `✗`, if equivalent text, symbols, and fallback are
  stable.
- Running not being blue, if it clearly communicates non-terminal state and
  resolves to a terminal state.

Cross-links: use `interactive-tui.md` for key and focus mechanics,
`agent-chat-terminal-ui.md` for conversation lifecycle, `batch-cli-output.md`
for command result contracts, `machine-readable-output.md` for JSON/NDJSON and
pipe contracts, and `pre-ship-gate.md` for final verification.
