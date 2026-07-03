# CLI-Design

**English** · [中文](./README.zh.md) · Version `2.0.0`

Design, build, review, and improve production-grade CLI and terminal TUI
surfaces. This README is an orientation document; executable skill instructions
live in [SKILL.md](./SKILL.md).

## Purpose

CLI/TUI output is a terminal contract, not just visual polish. It must tell a
human, script, or agent what happened, what matters, what to do next, and what
data contract machines can rely on.

The skill covers terminal surfaces only:

- Batch CLI output
- Interactive TUI components
- Agent Chat Terminal UI
- Machine-readable output
- Visual language for terminal surfaces
- Production pre-ship checks

It does not design command/flag APIs or low-level terminal input loops.

## Default Stance

Use this priority order:

1. **Accurate**: render true state, exact counts, real causes, terminal states,
   and honest uncertainty.
2. **Human-usable**: make the result, blocker, next action, and recovery path
   easy to scan.
3. **Agent/script-usable**: keep stdout/stderr, schemas, status words, events,
   and exit codes stable.
4. **Visually calm**: use layout, spacing, symbols, and color to clarify
   meaning, not decorate.

This is not a universal CLI template. Preserve a product's existing terminal
style unless it violates a hard contract.

## When To Use

Use this skill for:

- command results, help/usage, argument errors, diagnostics, and recovery copy
- status, progress, spinners, logs, summaries, and dry-runs
- tables, lists, trees, code blocks, diffs, pagers, and artifacts
- prompts, pickers, multi-select, forms, approvals, and confirmations
- agent-chat terminal transcripts, tools, approvals, artifacts, background work,
  interrupts, replay, and event fallback
- `--json`, NDJSON, pipe/plain output, stdout/stderr, exit codes, schema
  versioning, and stable enums
- `NO_COLOR`, `FORCE_COLOR`, `TERM=dumb`, CI, non-TTY, pipe, narrow width,
  Unicode fallback, and CJK/wide-character alignment

Do not use it as a fixed output template. Use it to choose the correct surface
family, contract, fallback, and validation gate.

## Surface Router

Open the smallest useful reference set:

| Surface or decision | Read |
|---|---|
| Batch command output, help/usage, errors, progress, logs, tables, dry-runs, destructive previews, pipe/CI behavior | [references/batch-cli-output.md](./references/batch-cli-output.md) |
| Interactive terminal components, focus/selection/input modes, prompts, pickers, tables, pagers, code/log/diff views, approvals, completion menus | [references/interactive-tui.md](./references/interactive-tui.md) |
| Agent-chat terminal transcripts, roles, streaming/final states, tools, approvals, background tasks, artifacts, interrupts, replay/log fallback | [references/agent-chat-terminal-ui.md](./references/agent-chat-terminal-ui.md) |
| `--json`, NDJSON, pipe/plain output, stdout/stderr/exit-code contracts, schemas, versioning, structured errors | [references/machine-readable-output.md](./references/machine-readable-output.md) |
| Visual semantics, theme tokens, status colors/symbols, focus/selection/input/disabled/danger, density, borders, table/code/diff/log visuals | [references/visual-language.md](./references/visual-language.md) |
| Final production checks, stop-ship conditions, terminal robustness, security/trust/redaction, snapshot/golden test matrix | [references/pre-ship-gate.md](./references/pre-ship-gate.md) |

## Core Contracts

Hard invariants:

- Detect the channel before decorating.
- stdout is data; stderr is conversation.
- Machine modes are pure data, even under `FORCE_COLOR` or `--color=always`.
- Interactive prompts have non-TTY paths.
- Long operations reach truthful terminal states.
- Errors include cause, scope, impact, and recovery when knowable.
- Destructive actions preview impact and default safe.
- Meaning survives without color, glyphs, animation, or live redraw.
- Alignment uses display width, not byte or rune count.
- Secrets stay redacted.

## Representative Cases

Examples are recipes, not templates. Style markers like `[green]` or
`[cyan+inverse]` describe visual intent; they are not literal output unless the
renderer uses that notation.

### Batch CLI Output

Weak:

```text
Success!
Everything completed beautifully.
```

Production-grade:

```text
[green]OK[/green] Deploy completed
service: api
version: v1.8.2
pods: 3 ready
duration: 42s
```

Failure:

```text
[red]ERR[/red] Deploy failed
target: api
reason: registry token expired
impact: rollout did not start
next:
  shipctl auth refresh
```

### Interactive TUI

```text
? Services to restart
  [dim]Space toggle · a all · Enter submit · Esc cancel[/dim]

[cyan+inverse]▸ [ ] api[/cyan+inverse]        [dim]2 replicas[/dim]
[green]  [✓] worker[/green]     [dim]1 replica[/dim]
[dim]  [ ] legacy[/dim]     [dim]unsupported runtime[/dim]

[dim]1 selected[/dim]
```

This keeps focus, selection, disabled reason, key hints, and count separate.

### Agent Chat Terminal UI

```text
[cyan]▌ You[/cyan]
  Deploy api to staging and show the final status.

▌ Assistant [dim]streaming[/dim]
  I'll check the current rollout first.

[tool call #17] shipctl status api
[dim]running · 2.1s[/dim]

[tool result #17] [green]completed[/green] [dim]2.4s[/dim]
api ready · version v1.8.2

▌ Assistant [dim]final[/dim]
  api is already running v1.8.2 in staging.
[dim]evidence: tool #17 shipctl status api[/dim]
```

Agent Chat Terminal UI is a composed workspace: transcript, draft, tool state,
approval, artifact, background work, and event fallback. It is not an ordinary
command-output template.

### Machine-Readable Output

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
  "error": {
    "code": "registry_auth_expired",
    "message": "Registry token expired",
    "retryable": true,
    "next_steps": [
      {
        "kind": "command",
        "command": "shipctl auth refresh",
        "reason": "refresh registry credentials"
      }
    ]
  }
}
```

No ANSI, prose wrappers, spinner frames, Markdown fences, or decorative blank
lines belong in machine output.

## Skill Structure

```text
CLI-Design/
├── SKILL.md
└── references/
    ├── batch-cli-output.md
    ├── interactive-tui.md
    ├── agent-chat-terminal-ui.md
    ├── machine-readable-output.md
    ├── visual-language.md
    └── pre-ship-gate.md
```

`SKILL.md` is the router and hard-contract layer. The reference files carry the
surface-specific detail.

## References

- `batch-cli-output.md`: command results, help/usage, errors, progress, logs,
  tables, dry-runs, destructive previews, pipe/CI behavior.
- `interactive-tui.md`: keyboard-owned terminal components, focus, selection,
  input modes, key hints, pickers, forms, pagers, diffs, approvals, completion,
  live progress.
- `agent-chat-terminal-ui.md`: terminal chat transcripts, user draft, assistant
  states, tools, approvals, artifacts, background work, interrupts, replay,
  event fallback.
- `machine-readable-output.md`: JSON, NDJSON, pipe/plain output, stdout/stderr,
  exit codes, schemas, stable enums, structured errors, versioning.
- `visual-language.md`: semantic roles, theme tokens, status colors/symbols,
  focus/selection/input/disabled/danger, tables, code, diff, logs, accessibility.
- `pre-ship-gate.md`: production checks, stop-ship conditions, robustness,
  redaction, trust boundaries, snapshot/golden matrix.

## Validation

Run the skill validator after edits:

```bash
python3 /Users/zhuangwei/.codex/skills/.system/skill-creator/scripts/quick_validate.py ./CLI-Design
```

Recommended forward-test cases:

- Review a CLI error and JSON output for channel/status/exit-code agreement.
- Design a multi-select TUI with dangerous confirmation and non-TTY fallback.
- Design an agent-chat terminal surface with tool, approval, artifact, and
  replay states.

## Notes For Maintainers

- Keep `SKILL.md` short. Add detailed guidance to one of the six references.
- Do not add a seventh reference unless a new surface family appears.
- Do not reintroduce README image galleries or fixed visual templates.
- Keep examples neutral; avoid product-specific cases.
- Treat examples as recipes for information, state, fallback, and contracts, not
  as mandatory layouts.
