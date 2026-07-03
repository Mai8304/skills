# Interactive TUI

Use this for terminal components that own keyboard interaction: prompts,
pickers, multi-select, table/list browsers, forms, pagers, code/log views, diff
reviews, approvals, completion menus, and live progress views.

Interactive TUI design starts with an interaction contract. Visual styling is a
layer on top of focus, selection, input, submit, confirm, cancel, fallback, and
terminal cleanup.

Examples in this file are recipes, not templates. Style markers such as
`[green]`, `[cyan+inverse]`, or `[dim]` describe visual intent; do not print
those strings literally unless the target renderer already uses that notation.
Prefer the project's existing TUI components, renderers, theme tokens, and key
conventions unless they violate a hard invariant.

## Contents

- Default Contract
- Interaction Contract
- Key Semantics
- Component Recipes
- Cross-Cutting Rules
- Terminal Capability Fallbacks
- Terminal Cleanup
- Red Flags
- Pre-Ship Checks

## Default Contract

- Define the interaction contract before styling.
- Keep focus, selection, input, default, submit, confirm, cancel, disabled, and
  danger separate in state and rendering.
- Keep the TUI keyboard-first. Mouse support can enhance, but cannot be the only
  path.
- Show only the key hints that are valid in the current mode.
- Preserve existing component behavior unless it violates a non-negotiable
  terminal contract.
- Use shared components, renderers, display-width helpers, and theme tokens
  instead of one-off ANSI, padding, glyph, or cursor-control code.
- Route visual color, symbol, border, spacing, and density decisions to
  `visual-language.md`.
- Provide a non-interactive path for non-TTY, CI, pipes, scripts, and agents.
- Restore terminal state on submit, cancel, error, timeout, interrupt, and crash.

Good TUI components answer these questions before they render:

```text
What owns the keyboard?
What is focused?
What data is selected?
What action will Enter perform?
What cancels or goes back?
What is disabled and why?
What is dangerous and what is the safe default?
What happens in non-TTY or --json mode?
What terminal state is left behind on exit?
```

## Interaction Contract

Use one vocabulary across interactive components:

```text
focus     = the single current keyboard target
selection = chosen data, bound to stable object identity
input     = text/editing mode that owns text keys
default   = preselected safe choice or fallback behavior
submit    = commit a non-dangerous selection/input
confirm   = explicit approval for high-risk or destructive work
cancel    = abandon the current layer or interrupt the flow
back      = return to the previous layer while preserving prior state
disabled  = visible but unavailable/forbidden item
danger    = high-risk action before it happens
```

Rules:

- Keep one active focus, including nested panes, popovers, and overlays.
- Keep focus and selection independent. Focus is where the cursor is; selection
  is what the user has chosen.
- Bind selection to stable IDs, not visible row numbers, indexes, or positions.
  Filtering, sorting, paging, and async refresh must not silently change the
  selected object.
- Treat input mode as a separate keyboard owner. Text entry must not trigger
  browse shortcuts such as `q`, `/`, number quick-picks, or `Space toggle`.
- Distinguish submit from confirm. `Enter` can submit a safe choice; dangerous
  work needs an explicit confirmation contract.
- Distinguish cancel from a valid negative answer. `Ctrl+C` is interruption; a
  focused `No` or `Deny` choice is a normal answer.
- Preserve user context after validation errors, failed submits, closed pagers,
  closed detail panes, and cancelled overlays.
- Make disabled state useful. Skip disabled items by default, or allow focus
  only to reveal the reason; never fire the primary action for disabled rows.

Case:

```text
? Select services
[cyan+inverse]▸ [ ] api[/cyan+inverse]       [dim]ready[/dim]
[green]  [✓] worker[/green]     [dim]selected[/dim]
[dim]  [ ] legacy[/dim]     [dim]unsupported runtime[/dim]

[dim]2 selected · ↑/↓ move · Space toggle · Enter submit · Esc cancel[/dim]
```

This is good because focus, selection, disabled state, count, and keys are
separate. It is not a mandate to use this exact pointer, checkbox, or ordering.

## Key Semantics

Use stable, ordinary terminal key meanings unless the local product has a
documented convention.

| Key | Default meaning |
|---|---|
| `Enter` | Primary action on the focused item; accept selection or submit when safe |
| `Space` | Toggle selection, page, or pause only when the current component visibly supports it |
| `Esc` | Back one layer; otherwise cancel or close the current overlay |
| `Ctrl+C` | Strongest cancel/interrupt; restore terminal; never confirm danger |
| `q` | Close only in non-text browsing, pager, or overlay modes |
| `Tab` / `Shift+Tab` | Move field, button, or pane focus when the component supports it |
| `↑/↓` | Move vertical focus or history, depending on mode |
| `←/→` | Move horizontal focus, expand/collapse, or cursor, depending on mode |
| `PageUp` / `PageDown` | Page long lists or content when implemented |
| `/` | Enter filter/search mode only when visible in the current hint |
| number keys | Quick-pick only when visible numbers are shown |

Rules:

- Footer hints must match the active mode exactly. Do not list keys that are not
  wired.
- Support `j/k` or `Ctrl+N/Ctrl+P` silently when useful, but do not advertise
  them unless the product convention expects it.
- If a key changes meaning in input mode, rewrite the hint. For example, `q`
  closes a pager, but inserts `q` in text input.
- Do not make `Esc` mean both "go back" and "cancel everything" in the same
  layer. If a multi-step flow uses `Esc` for back, show `Ctrl+C quit`.
- Numeric quick-picks must be visually numbered and stable for the visible
  viewport. They must not bind to hidden filtered rows.
- Dangerous confirmation must not be reachable by accidental `Ctrl+C`, `Esc`, or
  an invisible default.

Good mode-specific hints:

```text
[dim]↑/↓ move · / filter · Enter select · Esc cancel[/dim]
[dim]type to filter · Enter accept · Esc clear filter · Ctrl+C cancel[/dim]
[dim]Space toggle · a all · Enter submit · Esc cancel[/dim]
[dim]PageDown next · / search · q close[/dim]
```

## Component Recipes

Use each recipe as a checklist: intent, state, keys, visual roles, fallback, and
exit state. Adapt layout and voice to the product in front of you.

### Picker / Single Select

Use for choosing exactly one item from a bounded set.

Contract:

- Focus identifies the current candidate.
- Selection is either the focused item at submit time or a separately shown
  selected item, depending on local convention.
- Cardinality must be obvious. Pointer-only, radio-only, or a focused row are
  all acceptable; avoid mixing redundant signals that imply different meanings.
- Long lists need filtering, paging, or search.
- Submit collapses to a stable result summary.

Case:

```text
? Target environment
  [dim]↑/↓ move · / filter · Enter select · Esc cancel[/dim]

[cyan+inverse]▸ staging[/cyan+inverse]     [dim]recommended[/dim]
  production      [dim]requires approval[/dim]
  preview
  [dim]... 8 more[/dim]
```

Collapsed result:

```text
[green]✓[/green] Environment: staging
```

Non-TTY:

```text
ERR missing --env in non-interactive mode
next: shipctl deploy --env staging
```

Watch for:

- Do not block CI waiting for a picker.
- Do not use row numbers as the stored selection.
- If production is disabled or approval-gated, show why before submit.

### Multi Select

Use for selecting zero or more items from a bounded set.

Contract:

- Focus and checked state are independent.
- The selected count is visible.
- Minimum and maximum selection rules are visible when they constrain submit.
- Toggle-all, range select, or filtering are optional; only show their keys when
  implemented.
- Submit failures preserve checked items and focus.

Case:

```text
? Services to restart
  [dim]Space toggle · a all · Enter submit · Esc cancel[/dim]

[cyan+inverse]▸ [ ] api[/cyan+inverse]        [dim]2 replicas[/dim]
[green]  [✓] worker[/green]     [dim]1 replica[/dim]
[green]  [✓] cron[/green]       [dim]paused[/dim]
[dim]  [ ] legacy[/dim]     [dim]unsupported runtime[/dim]

[dim]2 selected[/dim]
```

Validation case:

```text
[yellow]![/yellow] Select at least one service
[dim]Space toggle · Enter submit · Esc cancel[/dim]
```

Non-TTY:

```text
shipctl restart --service worker --service cron
```

Watch for:

- Do not represent selection with color only.
- Do not allow disabled rows to toggle silently.
- Do not make filtering drop checked items without an explicit "selected hidden"
  signal.

### Table / List Browser

Use for browsing many records, optionally opening detail, selecting rows,
filtering, sorting, or acting on a focused record.

Contract:

- Each row has a stable identity.
- Focus marks the current row; selection marks chosen rows only if multi-action
  is supported.
- The primary action for `Enter` is visible: open, choose, expand, or act.
- Columns collapse or open a detail pane when width is narrow.
- Sorting and filtering preserve selected IDs and show active criteria.

Case:

```text
? Deployments
[dim]/ filter · s sort · Enter open · Space select · Esc close[/dim]

NAME       VERSION   STATE       UPDATED
[cyan+inverse]▸ api[/cyan+inverse]       v1.8.2    [green]completed[/green]   2m ago
  worker    v1.8.2    [yellow]degraded[/yellow]    4m ago
[green]✓ cron[/green]      v1.7.9    skipped     1h ago

[dim]filter: none · sort: updated desc · 1 selected[/dim]
```

Narrow fallback:

```text
[cyan+inverse]▸ api[/cyan+inverse]
  version  v1.8.2
  state    completed
  updated  2m ago
```

Watch for:

- Do not rely on fixed-width ASCII grids that break on resize.
- Do not hide important columns without a detail path.
- Do not let async refresh move focus to a different object without telling the
  user.

### Form / Text Input

Use for entering structured values, search terms, filters, or multi-step
answers.

Contract:

- Text input owns text keys.
- Field focus, cursor position, validation, and submit action are visible.
- Validation errors appear next to the field or in a stable summary.
- Secrets are masked and excluded from logs, transcripts, and screenshots.
- Existing answers are restored when navigating back.

Case:

```text
Configure target

Name
[cyan+inverse]api-prod|[/cyan+inverse]

Region
  us-west-2

[dim]Tab next · Shift+Tab previous · Enter submit · Esc back · Ctrl+C cancel[/dim]
```

Validation case:

```text
Name
[cyan+inverse]api prod|[/cyan+inverse]
[red]✗[/red] Use letters, numbers, hyphen, or underscore

[dim]fix value · Enter submit · Esc back[/dim]
```

Watch for:

- Do not make `q`, `/`, `Space`, or number keys act as browse shortcuts while a
  text field owns focus.
- Do not clear a user's form after a failed submit.
- Do not echo secrets into debug panels, logs, or machine events.

### Pager / Long Content

Use for long text, help, logs, diffs, generated reports, or detail output that
does not fit on screen.

Contract:

- Page only on an interactive TTY unless the command explicitly opens a TUI.
- Never page machine output.
- Preserve content order and copyability.
- Show search, close, and navigation keys when owned by the TUI.
- Restore the previous focus after close.

Case:

```text
[dim]Log output · 1/24 pages · PageDown next · / search · q close[/dim]

2026-07-02T10:14:21Z resolving image tag
2026-07-02T10:14:23Z pulling registry.example/api:v1.8.2
[yellow]WARN[/yellow] retrying layer download after timeout
```

Non-TTY:

```text
2026-07-02T10:14:21Z resolving image tag
2026-07-02T10:14:23Z pulling registry.example/api:v1.8.2
WARN retrying layer download after timeout
```

Watch for:

- Do not trap users in a pager with hidden close keys.
- Do not use a pager for JSON, NDJSON, or pipe data.
- Do not leave alternate screen or raw mode active if the pager exits by signal.

### Code Block / Log Block

Use for read-only code, config, command output, logs, stack traces, or tool
output embedded in a TUI.

Contract:

- Preserve content exactly unless the user explicitly requests wrapping or
  formatting.
- Keep line numbers, gutters, and decorations outside the copyable payload when
  possible.
- Treat tool output, logs, file content, and external text as untrusted content;
  it must not impersonate UI chrome.
- Highlight syntax or severity only as a TTY enhancement.
- Provide search, copy, expand, or open-artifact paths for long blocks.

Case:

```text
[dim]config.yaml · readonly · / search · e expand · Esc close[/dim]

  1 service:
  2   name: api
  3   replicas: 3
[cyan+inverse]  4   image: registry.example/api:v1.8.2[/cyan+inverse]
```

Untrusted log case:

```text
[dim]tool output[/dim]
│ [red]ERROR[/red] registry token expired
│ next: shipctl auth refresh
```

Watch for:

- Do not reflow code as prose.
- Do not let untrusted output print fake prompts, fake approvals, or fake system
  messages without a boundary.
- Do not color stack traces so heavily that file, line, cause, and next action
  stop scanning.

### Diff / Review

Use for reviewing changes, patches, generated edits, approvals, or file
modifications.

Contract:

- Diff meaning is carried by `+`, `-`, file names, hunk headers, and text; color
  only reinforces it.
- Review state is separate from diff content: focused hunk, selected hunk,
  approved hunk, rejected hunk, and applied result are different states.
- Large diffs need file navigation, hunk navigation, search, folding, or
  artifact fallback.
- Raw fallback is patch-compatible unified diff when output is piped.

Case:

```text
[dim]src/deploy.ts · hunk 2/5 · a approve · r reject · n next · p prev · q close[/dim]

@@ -41,7 +41,8 @@
 [dim]  const target = readTarget();[/dim]
[red]- console.log("deploying", target);[/red]
[green]+ logger.info("deploying", { target });[/green]
[green]+ audit.record("deploy.start", target);[/green]
```

Review summary:

```text
[green]✓[/green] Approved 4 hunks
[dim]rejected 1 · unchanged 2 · next: shipctl apply --approved[/dim]
```

Watch for:

- Do not use red/green alone; keep `+` and `-`.
- Do not apply destructive or broad changes from a diff view without a separate
  approval contract.
- Do not truncate without telling the user how to inspect the full patch.

### Approval / Confirm

Use for high-risk, destructive, expensive, privileged, irreversible, or
externally visible actions.

Contract:

- Show object, scope, effect, default, and safe cancel path before the choices.
- Safe choice is the default.
- `Ctrl+C` and `Esc` never confirm.
- Bulk actions show counts and representative affected objects.
- Typed confirmation is appropriate when accidental activation would be costly.
- Non-TTY requires an explicit flag, config, policy decision, or structured
  failure.

Case:

```text
[red]⚠ Delete release?[/red]
target: api v1.8.2
scope: 3 environments
effect: rollback metadata and artifacts will be removed
default: deny

[cyan+inverse]▸ Deny[/cyan+inverse]
  Delete release

[dim]Enter choose · Esc cancel · Ctrl+C interrupt[/dim]
```

Typed confirmation case:

```text
[red]⚠ Destroy workspace?[/red]
target: staging-api
effect: files and remote state will be deleted

Type [bold]staging-api[/bold] to confirm:
[cyan+inverse]|[/cyan+inverse]

[dim]Enter confirm typed value · Esc cancel[/dim]
```

Non-TTY:

```text
ERR delete requires explicit confirmation in non-interactive mode
next: shipctl release delete api --version v1.8.2 --yes
```

Watch for:

- Do not hide the blast radius below the prompt.
- Do not make a dangerous action the implicit default.
- Do not treat a declined action as a crash. A normal "No" can exit `0` when no
  failure occurred; an interrupt exits `130`.

### Completion / Command Menu

Use for command palettes, mention menus, slash commands, shell-like completion,
model/tool pickers, or contextual suggestions.

Contract:

- The user's draft/input remains visible and editable.
- Suggestions are not committed until accepted.
- Focused suggestion, selected suggestion, and inserted text are distinct.
- Loading, empty, error, disabled, and permission-gated states have visible
  messages.
- Groups and sources are visible when they affect trust or meaning.

Case:

```text
Run: deploy --env sta|

[dim]completions · ↑/↓ move · Tab insert · Enter run · Esc close[/dim]
[cyan+inverse]▸ staging[/cyan+inverse]       [dim]environment[/dim]
  staging-eu    [dim]environment[/dim]
  status        [dim]command[/dim]
```

Empty case:

```text
Run: deploy --env zz|

[yellow]![/yellow] No matches
[dim]Esc close · keep typing[/dim]
```

Watch for:

- Do not let suggestions overwrite user text without a visible accept action.
- Do not run a command when the user expected insertion.
- Do not keep stale suggestions after the input changes.

### Status / Live Progress

Use for live work inside an interactive TUI: task graphs, background jobs,
downloads, tool calls, indexing, tests, or long-running operations.

Contract:

- Running is non-terminal. Every live item resolves to completed, failed,
  partial, skipped, cancelled, timed out, blocked, changed, or unchanged.
- Progress is honest. Use a bar only when total is known; use a spinner or
  status label when total is unknown.
- Redraw at a bounded rate and avoid flicker.
- Preserve focus if the user can act while work continues.
- Show stale, retrying, queued, and blocked states explicitly.
- Non-TTY collapses to milestone lines, not cursor redraw.

Case:

```text
Deploy
  [green]✓[/green] build             12.4s
  [blue]◐[/blue] migrate            running
    [green]✓[/green] schema          0.8s
    [blue]◐[/blue] seed data        running
  [dim]•[/dim] smoke tests          queued

[dim]Ctrl+C cancel · v details[/dim]
```

Terminal state:

```text
[yellow]![/yellow] Deploy partially completed
[dim]completed: build, migrate · skipped: smoke tests · next: shipctl deploy resume[/dim]
```

Watch for:

- Do not leave an orphaned spinner.
- Do not fake percentages.
- Do not interleave live progress with JSON, NDJSON, or stdout data.

## Cross-Cutting Rules

### Modes And Ownership

- Give keyboard ownership to one layer at a time: base view, modal, overlay,
  pager, prompt, input, filter, completion, or approval.
- Show the active layer through focus and hint text.
- Block or queue background key events when an overlay is open.
- Restore focus to the prior object when closing overlay, pager, detail, filter,
  or completion.

### Async Updates

- Keep selections stable across refresh by ID.
- If a focused object disappears, show a clear transition such as "removed" or
  move focus to the nearest stable object with a notice.
- Mark stale data when actions are based on a prior snapshot.
- Disable actions that are no longer valid and explain why.
- Avoid racing submit against refresh; revalidate before applying.

### Empty, Loading, Error, And Disabled States

- Empty states say what is empty and what the user can do next.
- Loading states show what is loading and whether the user can cancel.
- Error states name cause, scope, impact, and recovery.
- Disabled rows either skip focus or reveal a reason.

Case:

```text
[yellow]![/yellow] No services match "cache"
[dim]clear filter: Esc · create: shipctl service create cache[/dim]
```

### Layout, Width, And Density

- Measure display width, not bytes or rune count.
- Support resize. Recompute column widths, wrapping, truncation, and viewport
  height on `SIGWINCH` or equivalent resize events.
- Prefer dense, stable layouts for operational tools. Avoid decorative boxes
  that consume space without improving scanning.
- Keep controls in stable places so live updates do not move buttons under the
  user's cursor or focus.
- Truncate with visible markers and an expand path; do not silently drop data.

### Trust, Redaction, And Copyability

- Redact secrets in input echo, logs, snapshots, transcripts, debug bundles, and
  machine events.
- Keep generated commands, paths, URLs, IDs, and artifact locations copyable.
- Bound untrusted content with a visible label, gutter, quote bar, or panel
  role so it cannot impersonate the TUI.
- Avoid OSC 8-only links; include raw fallback URLs when links matter.

### Style Consistency

- Reuse existing theme tokens for focus, selection, success, warning, error,
  running, disabled, danger, metadata, and untrusted content.
- Reuse existing components for prompt, table, diff, pager, progress, and
  approval when available.
- Update shared helpers or conventions when a change affects multiple TUI
  surfaces.
- Preserve local product density and voice unless it violates readability,
  safety, channel, or accessibility constraints.

## Terminal Capability Fallbacks

- Non-TTY, CI, pipe, and `--json` must not enter interactive mode without an
  explicit contract.
- `NO_COLOR`, `--no-color`, `TERM=dumb`, unsupported Unicode, and narrow width
  must preserve meaning, state, and available next actions.
- Color off means remove styling attributes, not remove information.
- Unicode off means use ASCII symbols and text labels.
- Narrow width means collapse columns, open a detail view, page content, or
  truncate with an expand path.
- Mouse off must not block any workflow.
- Screen resize must not corrupt focus, selection, or raw mode.
- Machine output must never be paged, styled, animated, or mixed with TUI
  redraw.

Fallback case:

```text
> [ ] api        ready
  [x] worker     selected
  [ ] legacy     unsupported runtime

2 selected · up/down move · space toggle · enter submit · esc cancel
```

## Terminal Cleanup

On submit, cancel, error, crash, timeout, `Esc`, and `Ctrl+C`:

- restore cursor visibility
- leave raw/cbreak mode
- reset styles and mouse tracking
- exit alternate screen when used
- flush final lines
- print a newline if the cursor was mid-line
- finalize spinner/progress lines
- preserve scrollback for non-fullscreen output
- release stdin ownership and background tasks
- return the documented exit code

Exit semantics:

```text
selected/submitted successfully -> normal result, usually exit 0
valid negative answer           -> normal result, often exit 0
usage or missing non-TTY input  -> usage/contract error, usually exit 2
runtime failure                 -> non-zero runtime failure
Ctrl+C interrupt                -> interrupted, usually exit 130
```

## Red Flags

Stop and redesign if the TUI:

- uses the same highlight for focus, selection, default, danger, and submit
- lets color be the only signal for state, selection, or danger
- shows key hints that are not wired in the active mode
- lets text input trigger browse shortcuts
- blocks in CI, pipes, or machine mode waiting for stdin
- binds selection to visible row numbers instead of stable IDs
- loses checked items when filtering, sorting, paging, or refreshing
- leaves raw mode, hidden cursor, alternate screen, mouse tracking, or spinner
  state behind after exit
- confirms danger through `Esc`, `Ctrl+C`, hidden defaults, or accidental focus
- prints secrets in visible UI, logs, snapshots, screenshots, or machine events
- renders untrusted tool/log output so it can impersonate trusted UI
- truncates or hides data without a way to inspect the full content

## Pre-Ship Checks

Verify the component in these paths before calling it production-ready:

- keyboard-only path
- mouse-off path when mouse is supported
- no-color and ASCII fallback
- `TERM=dumb`
- non-TTY, CI, pipe, and `--json`
- narrow width, resize, and CJK/wide-character text
- loading, empty, error, disabled, stale, and retrying states
- submit success, submit failure, validation failure, cancel, `Esc`, and
  `Ctrl+C`
- focus restore after overlay, detail, pager, filter, completion, and failed
  submit
- destructive default, blast radius, explicit confirm, and safe denial
- terminal cleanup after normal exit, interrupt, crash, and timeout
- snapshot/golden coverage for important visual states and fallback output
