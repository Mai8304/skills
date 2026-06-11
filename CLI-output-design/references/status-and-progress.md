# Status & Progress

**Lenses:** Accurate first (progress must not lie), then Human-usable and Beautiful.

## Principle

Every operation that takes more than a moment shows a clear arc: **start → progress →
terminal state** (`✓` or `✗`). No operation ends on a silent spinner. clig.dev: print
something in **<100 ms** ("if you're making a network request, print something before you
do it so it doesn't hang and look broken"), and "show progress if something takes a long
time."

Progress must be **honest**:

- **Determinate** (you know the total) → a bar with a real percentage.
- **Indeterminate** (total unknown) → a spinner with a label. Never fake a percentage you
  don't have, and never let a bar sit at 99% waiting.

Animation is a **TTY-only** affordance. When stdout isn't a terminal, drop the animation
(see `robustness.md`).

## Do / Don't

**Do**

- Replace the spinner/bar **in place** with the terminal state on completion (`✓ Built in 4.2s`).
- Use a spinner only when the total is genuinely unknown.
- Show the useful numbers: percent, absolute (`3.4/5.1 MB`), rate, and ETA — trailing
  segments dimmed.
- Throttle redraws to ~10–20 fps so the line doesn't flicker or burn CPU.
- For piped / non-TTY output, **collapse to discrete milestone lines** (`Downloading…`,
  `Downloaded 5.1 MB`), no `\r` animation.

**Don't**

- Leave an orphaned spinner with no resolved state.
- Show a progress bar stuck at 99%, or animate progress for an instant operation.
- Invent a percentage when you only know "in progress."
- Interleave concurrent progress lines confusingly (clig.dev warns on this) — give each its
  own line or a single aggregate.

## Real examples

**Heroku action pattern** (Heroku CLI Style Guide) — a spinner on a tty that resolves to a
word, printed on **stderr** because it's "out-of-band information on a running task":

```
$ heroku maintenance:on --app myapp
Enabling maintenance mode for ⬢ myapp... done
```

**Determinate download** (convention, e.g. `cargo`/`npm`/`docker pull` layer bars):

```
[████████████░░░░] 74%  3.8/5.1 MB  ⟨1.2 MB/s⟩ eta 1s
```

**Indeterminate step**, and its piped collapse:

```
⠙ Resolving dependencies…           # TTY: spinner
Resolving dependencies…             # piped: one static line, then a milestone line
```

On completion the live line becomes `✓ Resolved 142 packages` (or `✗ …` on failure).

## Cheat-sheet

**Status vocabulary** — one set across the whole CLI; never substitute synonyms:

```
running   pass   fail   warn   skip   changed   unchanged
```

(`ok`/`done`/`success`/`passed` are *not* alternates for these — pick the canonical word.)

**Determinate vs indeterminate:** total known → bar with real %; total unknown → spinner +
label. Multi-item work → one live line per item, collapsing to a one-line summary; degrade
to sequential lines off-TTY.

**Spinner frames** (TTY only): `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏`; ASCII fallback `[working]` (static).
Always resolve to `✓`/`✗`.

**Routing:** progress is conversation, not data — send it to **stderr** so stdout stays
clean for results/pipes (see `agent-readable-output.md`). TTY detection and degradation
live in `robustness.md`; the glyphs in `symbols.md`.
