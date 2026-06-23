# Robustness

**Lenses:** cross-cutting — Accurate, Agent-usable, and Human-usable all depend on output
surviving whatever environment it lands in.

## Principle

**Detect the channel before you decorate, then degrade gracefully.** The same command runs
in an interactive terminal, a pipe, a CI log, a dumb terminal, and a 40-column window — and
must stay correct and readable in all of them. Color, animation, Unicode, OSC 8 links,
underline, reverse video, and framed notices are *enhancements layered on top of* output
that is already complete in plain ASCII text.

Exit codes are part of the output contract: a script or agent reads them before it reads a
word.

## Do / Don't

**Do**

- Check **`isatty`** on stdout (and stderr) before enabling color, spinners, or animation.
- Honor, in order: explicit `--no-color` / `--color`, then `NO_COLOR` (off) and
  `FORCE_COLOR` (on), then `TERM=dumb` (off), then non-TTY (off).
- Detect **CI** (e.g. the `CI` env var) and default to plain, non-animated output.
- Strip all styling attributes when decoration is off: color, bold/dim, underline, reverse,
  OSC 8 hyperlinks, cursor tricks, and notice frames.
- **Detect terminal width** at runtime; fall back to a sane default (e.g. 80) only when it
  is genuinely undetectable — never hardcode it as the assumption.
- Provide an **ASCII fallback** for every Unicode glyph when the locale/terminal can't render it.
- **Measure display width** (`wcwidth` / east-asian-width) for any alignment or truncation —
  CJK and most emoji render as **two columns**. (Layout rules in `layout.md`.)
- **Flush at meaningful points.** When stdout isn't a TTY it is *block-buffered*, so
  unflushed progress or results look hung and then arrive in a burst — flush per line/record,
  or line-buffer.
- Clean up on interrupt: restore the cursor, print a newline, flush, on Ctrl-C (exit `130`).

**Don't**

- Emit ANSI escapes or spinners to a pipe / file / CI log.
- Render expressive TTY notices (frames, underlined URLs, OSC 8 links, icon-dependent
  headings) outside an interactive terminal.
- Assume 80 columns, a UTF-8 terminal, or single-width characters.
- **Block on stdin to prompt when there's no TTY** (CI / pipe / agent) — use a flag or a
  default, or fail with a clear message; never deadlock.
- Exit `0` on failure, or reuse one exit code for unrelated failures.

## Real examples

**`git status | cat`** (captured 2026-06-11) — piping strips all color automatically:

```
On branch worktree-cli-output-design
nothing to commit, working tree clean
```

The same command in a terminal shows colored branch/paths; piped, it degrades to clean
plain text with identical information. **`NO_COLOR=1 gh pr list`** (captured) likewise
produces un-styled output. Both are TTY/`NO_COLOR` detection doing its job.

## Cheat-sheet

**Detection checklist** (run before decorating):

```
isatty(stdout)?        no  → no color, no spinner, no animation, no interactive prompt
isatty(stderr)?        no  → no styled progress, logs, diagnostics, or notices
NO_COLOR set?          yes → no color
FORCE_COLOR set?       yes → color even when piped (deliberate override)
TERM=dumb?             yes → no color, no cursor tricks
CI set?                yes → plain, non-animated, never prompt (use flags/defaults)
COLUMNS / ioctl width  → wrap to it; fall back to 80 only if undetectable
locale not UTF-8?      → ASCII fallback glyphs
text has CJK / emoji?  → measure by display width (2 cols), not char count
stdout not a TTY?      → block-buffered: flush per line/record so it doesn't look hung
```

**Decoration fallback:** when decoration is off, keep the same facts and ordering but remove
the presentation layer. An expressive notice becomes plain lines; an OSC 8 hyperlink becomes
a complete raw URL; reverse-selected menu rows fall back to a pointer (`>`); Unicode glyphs
fall back to the ASCII table in `symbols.md`.

**Exit codes** (keep the set small and documented):

| Code | Meaning |
|---|---|
| `0` | success |
| `1` | runtime failure |
| `2` | usage / bad arguments |
| `130` | interrupted (SIGINT / Ctrl-C) |

Document any others your CLI defines; never overload one code for unrelated failures.

Sources: clig.dev — disable color when "not in a terminal or the user requested it," no
animation off-TTY, pager only on a terminal. Heroku — disable on `--no-color`,
`COLOR=false`, or non-tty.

Cross-links: `color.md` (palette + off-conditions), `symbols.md` (ASCII fallback table),
`agent-readable-output.md` (stdout/stderr split, machine mode), `status-and-progress.md`
(TTY-only animation).
