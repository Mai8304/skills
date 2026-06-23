# Symbols

**Lenses:** Beautiful and Human-usable; Accurate when a glyph names a state (then it is
never the only carrier).

## Principle

A small, fixed set of **semantic Unicode glyphs** makes status scannable — but each glyph
only ever **supplements text**, never replaces it (a screen reader, a `grep`, and a
minimal terminal all need the word). Keep the set tiny and consistent: one success mark,
one failure mark, one warning mark, one skip mark, across the whole CLI.

**No emoji by default.** Emoji render at inconsistent widths (most are width-2 and break
column alignment), look different on every terminal/font, and read as toy-ish for a
productized CLI. (clig.dev *permits* judicious emoji — "Pictures can be better than words"
— but also warns it's "easy to overdo it and make your program … feel like a toy"; this
skill takes the conservative line and reserves emoji for explicit opt-in.)

## Do / Don't

**Do**

- Use one glyph per meaning from the table below, and pair it with a word (`✓ pass`).
- Stick to **width-1 BMP glyphs** so columns stay aligned.
- Provide an **ASCII fallback** for every glyph (see `robustness.md` for when it kicks in).
- Use at most **one leading status glyph per line**; use `─` dividers only at section breaks.

**Don't**

- Let a glyph be the sole carrier of meaning (color-blind, piped, and `grep` users lose it).
- Mix success marks (`✓` here, `✔` there, `√` elsewhere) within one CLI.
- Decorate densely — a wall of glyphs becomes noise, not signal.
- Use emoji as default decoration.
- Use the emoji-presentation form of a glyph (it silently becomes width-2).

## Variation-selector gotcha

`✓` (U+2713) and `✗` (U+2717) are plain text glyphs. The "heavy" check `✔` (U+2714) may
render as a wide **emoji** (`✔️`) if a system applies emoji presentation. Force text
presentation with VS15 (`✔︎`) or just use `✓`/`✗`. The rule: **stick to width-1 BMP code
points**, and test alignment in a real terminal.

## Real example

**`gh auth status`** (captured 2026-06-11) uses a green **`✓`** as the logged-in marker,
immediately followed by the account text — `✓ Logged in to github.com account …`. The glyph
adds scannability; the sentence still reads with the glyph stripped. That is the whole
contract: symbol + color + word, any one removable.

A checklist in Unicode and its ASCII fallback (same information either way):

```
Unicode              ASCII fallback
  ✓ Node version       [OK]   Node version
  ⚠ Disk space         [WARN] Disk space
  ✗ Auth token         [FAIL] Auth token
  ⊘ Optional cache      [SKIP] Optional cache
```

## Cheat-sheet

| Unicode | Meaning | ASCII fallback |
|---|---|---|
| `✓` | pass / completed terminal state | `[OK]` |
| `✗` | fail / blocked | `[FAIL]` |
| `⚠` | warn / warning | `[WARN]` |
| `⊘` | skip / intentionally not run | `[SKIP]` |
| `→` | next / transition | `->` |
| `•` | neutral bullet | `-` |
| `◆` | section / phase | `#` |
| `▌` | transcript / callout left gutter | `|` |
| `✦` | optional expressive TTY notice icon | omit |
| `·` | compact inline separator | `;` |
| `…` | truncation | `...` |
| `⠙` | spinner frame (TTY only) | `[working]` (static) |
| `─` | divider (sparingly) | `-` |

**Spinner frames** (indeterminate, TTY only): `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏`. On completion,
**replace the spinner in place with the terminal state** (`✓`/`✗`) — never persist a
spinner frame into a log or JSON. (See `status-and-progress.md`.)

**Selection & prompt glyphs** — shape encodes cardinality (round = pick one, square = pick
many); the cursor is separate from the selection state (see `output-patterns.md`):

| Unicode | Meaning | ASCII fallback |
|---|---|---|
| `❯` | cursor / current row | `>` |
| `●` / `○` | radio selected / unselected (single-select) | `(•)` / `( )` |
| `[x]` / `[ ]` | checkbox checked / unchecked (multi-select) | `[x]` / `[ ]` |
| `■` | cancelled end-cap | `[cancelled]` |
| `↑` / `↓` | move up / down hint | `up` / `down` |
| `←` | back hint | `back` |

**Agent-chat optional glyphs** — use only inside an interactive agent-chat TUI, and only
with a stable label/status word. They are atoms, not a required full layout (see
`agent-chat-tui.md`):

| Unicode | Meaning | ASCII fallback |
|---|---|---|
| `⚙` | tool-use marker before a tool name | `tool:` |
| `◐` `◒` `◑` `◓` | lightweight thinking/tool spinner frames (TTY only) | `[running]` |
| `⎿` | child detail: args, output, result, nested event | `->` |
| `∴` | reasoning/thinking summary marker | `thinking:` |

Avoid emoji-presentation variants such as `⚙️`; if a terminal renders any of these wider
than one cell, fall back to ASCII for aligned views. On completion, replace spinner frames
with terminal state glyphs (`✓`/`✗`) or a plain status word.

**Display width:** these and all glyphs assume width-1 cells. Data you render (table cells,
tree labels, prompt options) may contain **double-width** CJK or emoji — align and truncate
by *display width*, not character count. See `layout.md` and `robustness.md`.

Cross-links: `color.md` for the color each glyph pairs with, `copywriting.md` for the word,
`robustness.md` for when ASCII fallback / no-Unicode mode applies.
