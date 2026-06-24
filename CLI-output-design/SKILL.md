---
name: cli-output-design
description: Use when designing, building, reviewing, or improving a CLI's terminal output so it is accurate, human-usable, agent-usable, and visually clean — colors, symbols, status/progress indicators, error messages and copy, layout/wrapping, tables/trees/diffs and other output patterns, prompt and selection-menu rendering (y/n, single, multi), agent-chat TUI transcript and intermediate-state rendering (thinking, tool use, tool results, choices, background tasks, subagents), CJK/wide-character alignment, machine/JSON output for scripts and AI agents, and NO_COLOR / non-TTY / CI adaptation. Covers how prompts and wizards look, not the input-handling mechanics; not for command/flag structure design.
metadata:
  version: 1.0.3
---

# CLI Output Design

Good command-line output is **accurate** first, then **usable by the human** reading it,
then **parseable by the script or agent** consuming it, then **visually calm** — in that
priority order. When two pull against each other, the higher lens wins (a prettier layout
never justifies a wrong status).

This is a principles skill plus a pattern cookbook. Adapt it to the CLI in front of you;
don't apply it mechanically. Open the reference that matches what you're rendering.

## Core decision model

Use this order before choosing color or emphasis:

```text
reader task -> output shape -> semantic role -> channel constraints
```

- **Reader task**: discover, inspect, act, or converse.
- **Output shape**: help, table, detail, progress, error, prompt, transcript, log, diff,
  and similar surfaces.
- **Semantic role**: state, current/selected, next action/copy target, secondary, or body.
- **Channel constraints**: TTY, pipe, `--json`, CI, `NO_COLOR`, `TERM=dumb`, and width.

Layout comes first. Semantic color comes second. Token color is never automatic.

## The four lenses

Judge every output decision through these, in priority order:

1. **Accurate** — say only true things, precisely. Honest status; no fake or
   forever-stuck progress; exact counts; never prettify or lie about state; errors name
   the real cause. *If you can't render the true state, show "unknown" — never a
   comforting guess.*
2. **Human-usable** — the reader sees the result, the blocker, and the next step at a
   glance. *Lead with the state/result; put recovery in an explicit `Next:` block, not
   buried in prose.*
3. **Agent-usable** — the human stream **and** the machine mode are parseable by a script
   or AI agent. *Use a fixed status vocabulary and stable labels so an agent can infer the
   next action from logs; keep machine mode (`--json` / piped / non-TTY) free of color,
   spinners, and prose.*
4. **Beautiful** — the surface feels calm and intentional. *Color and symbols are semantic
   and restrained; whitespace carries structure; no emoji by default.*

## Operating rules

- **Detect the channel before you decorate.** Check `isatty`; honor `NO_COLOR`,
  `--no-color`, `TERM=dumb`, and CI. Degrade gracefully: color → plain, Unicode → ASCII,
  animated → static. (→ `robustness.md`)
- **Color semantic roles, not token types.** Commands, flags, paths, URLs, env vars, and
  config keys get accent only when they are the identified object, current/selected item,
  copy target, or next action — never because a global scanner recognized the token.
- **stdout is data, stderr is conversation.** Results and machine output go to stdout;
  progress, logs, diagnostics, and notices go to stderr — so a pipe carries only data.
- **Every long operation reaches a visible terminal state** (✓ / ✗). No orphaned spinners.
- **One status vocabulary** across the whole CLI: `running · pass · fail · warn · skip ·
  changed · unchanged`. Use these for status labels, columns, events, and machine enums;
  don't use `ok` / `done` / `success` / `passed` as alternate state names.
- **Respect width.** Wrap prose (cap ~100 cols); never wrap paths, URLs, or commands; measure
  alignment and truncation by *display width* (CJK and most emoji are 2 columns), not characters.

## Decision quick-reference

| When you're rendering… | Rule of thumb | Open |
|---|---|---|
| any color / emphasis | semantic ANSI-16, typed emphasis, redundant with text | `color.md` |
| update / non-blocking TTY notice | optional light frame only in interactive TTY, plain fallback | `output-patterns.md` |
| checkmarks, spinners, glyphs | fixed semantic set + ASCII fallback, no emoji | `symbols.md` |
| anything that takes time | start → progress → ✓/✗; honest; TTY-only animation | `status-and-progress.md` |
| notice / warning / deprecation / error text | short by default; expand with `Reason:` / `Next:` when needed | `copywriting.md` |
| spacing, tables, wrapping, indent | width-aware; whitespace is structure | `layout.md` |
| help / usage / argument error | sectioned help; bad args show usage slice + exit `2` | `output-patterns.md` |
| a known shape (table/tree/diff/log/…) | use the cookbook recipe | `output-patterns.md` |
| a prompt / confirmation / menu | shape = cardinality; never block in non-TTY | `output-patterns.md` |
| an agent-chat TUI transcript | atom-first: roles, input draft, thinking, tool use, results, choices, background/subagent states | `agent-chat-tui.md` |
| `--json` / piped / output for an agent | pure data, stable fields, stdout-only | `agent-readable-output.md` |
| anything in a weird terminal / CI | detect + degrade; correct exit codes | `robustness.md` |

## Red flags

Stop if you're about to:

- make color or emoji the **only** signal of a state
- color decoratively or rainbow with no meaning
- color every command, flag, path, URL, or env var just because it is a technical token
- use cyan as a generic "important" color instead of a semantic accent
- render deprecations in red unless the current command fails
- use underline, italic, or strikethrough as generic emphasis
- show a progress bar stuck at 99%, or fake progress for an instant operation
- print an error that says only `failed` / `error`, with no cause or next step
- hardcode 80 columns instead of detecting width
- let spinners or ANSI escapes leak into piped / CI / `--json` output
- use Unicode glyphs with no ASCII fallback
- mix `ok` / `done` / `success` / `passed` as status labels for one state
- use emoji as default decoration
- put diagnostics or notices on stdout, polluting piped data
- show framed / underlined / OSC-8 expressive notices outside an interactive TTY
- make a product-specific agent-chat status bar, approval card, or full layout the reusable rule instead of defining smaller atoms
- emit decorative leading / trailing blank lines into piped / `--json` output (block edges are TTY-only)
- align columns by character/byte count instead of display width (breaks on CJK/emoji)
- run a destructive action without previewing what it affects or defaulting to "No"
- block on stdin to prompt when there's no TTY (deadlocks CI, pipes, and agents)

## Pre-ship checklist

- [ ] Piped output (`| cat`) is clean — no spinners, no raw escape codes
- [ ] `--json` / machine mode is pure data on stdout — no ANSI, no prose, stable field names
- [ ] Leading/trailing blank lines appear only in interactive TTY output — piped/`--json` has none, and output ends with exactly one newline
- [ ] `NO_COLOR=1` and `TERM=dumb` still produce readable, complete output
- [ ] Expressive TTY notices degrade to plain lines — no frames, OSC 8 links, or underline
- [ ] Narrow terminal (~40 cols) wraps/truncates without breaking layout
- [ ] ASCII fallback renders when Unicode is unavailable
- [ ] Every error names a cause and a concrete next action
- [ ] Status words come from one consistent vocabulary
- [ ] Deprecations are yellow with a replacement when known; red is reserved for current failure
- [ ] Technical tokens use accent only when they are the identified object, selected item, copy target, or next action
- [ ] Exit codes are correct (0 success, non-zero failure, documented)
- [ ] Long operations always reach a visible terminal state (✓ / ✗)
- [ ] Empty results say so helpfully (not a blank screen)
- [ ] Output with CJK / wide characters stays aligned (measured by display width)
- [ ] Destructive actions preview their blast radius, default to No, and offer `--yes`
- [ ] Prompts have a non-interactive path (flags/defaults) and never block in CI / pipes / agents
- [ ] Help, usage, unknown-command, and bad-argument output have clear templates and correct exit codes
- [ ] Agent-chat TUI states have non-TTY fallbacks — no cursor tricks, frames, animation, or hidden role/state information in logs

## References

Open the one that matches what you're rendering:

- **`color.md`** — semantic palette, typed emphasis, dim/bold hierarchy, ANSI-16 vs hex
- **`symbols.md`** — glyph vocabulary, ASCII-fallback table, display-width pitfalls, no-emoji stance
- **`status-and-progress.md`** — spinners, progress/download bars, checklists, terminal states, status vocabulary
- **`copywriting.md`** — message accuracy, severity templates, error structure, voice, humanized values
- **`layout.md`** — width, wrapping, alignment, tables, whitespace, indentation, truncation
- **`output-patterns.md`** — cookbook: help/usage, argument errors, tables, lists, trees, conversation, streaming, diffs, diagnostics, summaries, dry-run, empty states, pagination, logs, notices, content blocks
- **`agent-chat-tui.md`** — agent-chat TUI atoms: roles, input draft, streaming, thinking, tool use/results, choices, approvals, background tasks, subagents, and machine-event fallbacks
- **`agent-readable-output.md`** — AI-readable human logs + machine mode (`--json` / pipe), stable enums, schema-as-contract
- **`robustness.md`** — TTY / NO_COLOR / CI detection, graceful degradation, width fallback, exit codes
