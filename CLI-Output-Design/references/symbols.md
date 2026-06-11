# Symbols

**Lenses:** Beautiful and Human-usable; Accurate when a glyph names a state (then it is
never the only carrier).

## Principle

A small, fixed set of **semantic Unicode glyphs** makes status scannable — but each glyph
only ever **supplements text**, never replaces it (a screen reader, a `grep`, and a
minimal terminal all need the word). Keep the set tiny and consistent: one success mark,
one failure mark, one warning mark, across the whole CLI.

**No emoji by default.** Emoji render at inconsistent widths (most are width-2 and break
column alignment), look different on every terminal/font, and read as toy-ish for a
productized CLI. (clig.dev *permits* judicious emoji — "Pictures can be better than words"
— but also warns it's "easy to overdo it and make your program … feel like a toy"; this
skill takes the conservative line and reserves emoji for explicit opt-in.)

## Do / Don't

**Do**

- Use one glyph per meaning from the table below, and pair it with a word (`✓ passed`).
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
```

## Cheat-sheet

| Unicode | Meaning | ASCII fallback |
|---|---|---|
| `✓` | pass / done | `[OK]` |
| `✗` | fail / blocked | `[FAIL]` |
| `⚠` | warning | `[WARN]` |
| `→` | next / transition | `->` |
| `•` | neutral bullet | `-` |
| `◆` | section / phase | `#` |
| `…` | truncation | `...` |
| `⠙` | spinner frame (TTY only) | `[working]` (static) |
| `─` | divider (sparingly) | `-` |

**Spinner frames** (indeterminate, TTY only): `⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏`. On completion,
**replace the spinner in place with the terminal state** (`✓`/`✗`) — never persist a
spinner frame into a log or JSON. (See `status-and-progress.md`.)

Cross-links: `color.md` for the color each glyph pairs with, `copywriting.md` for the word,
`robustness.md` for when ASCII fallback / no-Unicode mode applies.
