---
name: cli-output-design
description: Use when designing, building, reviewing, or improving a CLI's terminal output so it is accurate, human-usable, agent-usable, and visually clean — covers colors, symbols, status/progress indicators, error messages and copy, layout/wrapping, machine/JSON output for scripts and AI agents, and NO_COLOR / non-TTY / CI adaptation. Not for command/flag structure or interactive wizard design.
version: 0.1.0
---

# CLI Output Design

Good command-line output is **accurate** first, then **usable by the human** reading it,
then **parseable by the script or agent** consuming it, then **visually calm** — in that
priority order. When two pull against each other, the higher lens wins (a prettier layout
never justifies a wrong status).

This is a principles skill plus a pattern cookbook. Adapt it to the CLI in front of you;
don't apply it mechanically. Open the reference that matches what you're rendering.

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
- **stdout is data, stderr is conversation.** Results and machine output go to stdout;
  progress, logs, diagnostics, and notices go to stderr — so a pipe carries only data.
- **Every long operation reaches a visible terminal state** (✓ / ✗). No orphaned spinners.
- **One status vocabulary** across the whole CLI: `running · pass · fail · warn · skip ·
  changed · unchanged`. Never mix `ok` / `done` / `success` for one state.
- **Respect width.** Wrap prose (cap ~100 cols); never wrap paths, URLs, or commands.

## Decision quick-reference

| When you're rendering… | Rule of thumb | Open |
|---|---|---|
| any color / emphasis | semantic ANSI-16, redundant with text, used sparingly | `color.md` |
| checkmarks, spinners, glyphs | fixed semantic set + ASCII fallback, no emoji | `symbols.md` |
| anything that takes time | start → progress → ✓/✗; honest; TTY-only animation | `status-and-progress.md` |
| error / warning / message text | what happened · why · `Next:`; one vocabulary | `copywriting.md` |
| spacing, tables, wrapping, indent | width-aware; whitespace is structure | `layout.md` |
| a known shape (table/tree/diff/log/…) | use the cookbook recipe | `output-patterns.md` |
| `--json` / piped / output for an agent | pure data, stable fields, stdout-only | `agent-readable-output.md` |
| anything in a weird terminal / CI | detect + degrade; correct exit codes | `robustness.md` |

## Red flags

Stop if you're about to:

- make color or emoji the **only** signal of a state
- color decoratively or rainbow with no meaning
- show a progress bar stuck at 99%, or fake progress for an instant operation
- print an error that says only `failed` / `error`, with no cause or next step
- hardcode 80 columns instead of detecting width
- let spinners or ANSI escapes leak into piped / CI / `--json` output
- use Unicode glyphs with no ASCII fallback
- mix `ok` / `done` / `success` / `passed` for one status
- use emoji as default decoration
- put diagnostics or notices on stdout, polluting piped data

## Pre-ship checklist

- [ ] Piped output (`| cat`) is clean — no spinners, no raw escape codes
- [ ] `--json` / machine mode is pure data on stdout — no ANSI, no prose, stable field names
- [ ] `NO_COLOR=1` and `TERM=dumb` still produce readable, complete output
- [ ] Narrow terminal (~40 cols) wraps/truncates without breaking layout
- [ ] ASCII fallback renders when Unicode is unavailable
- [ ] Every error names a cause and a concrete next action
- [ ] Status words come from one consistent vocabulary
- [ ] Exit codes are correct (0 success, non-zero failure, documented)
- [ ] Long operations always reach a visible terminal state (✓ / ✗)
- [ ] Empty results say so helpfully (not a blank screen)

## References

Open the one that matches what you're rendering:

- **`color.md`** — semantic palette, dim/bold hierarchy, when *not* to color, ANSI-16 vs hex
- **`symbols.md`** — glyph vocabulary, ASCII-fallback table, display-width pitfalls, no-emoji stance
- **`status-and-progress.md`** — spinners, progress/download bars, checklists, terminal states, status vocabulary
- **`copywriting.md`** — message accuracy, error structure (what / why / `Next:`), voice, humanized values
- **`layout.md`** — width, wrapping, alignment, tables, whitespace, indentation, truncation
- **`output-patterns.md`** — cookbook: tables, lists, trees, conversation, streaming, diffs, diagnostics, summaries, dry-run, empty states, pagination, logs, notices, content blocks
- **`agent-readable-output.md`** — AI-readable human logs + machine mode (`--json` / pipe), stable enums, schema-as-contract
- **`robustness.md`** — TTY / NO_COLOR / CI detection, graceful degradation, width fallback, exit codes
