# Color

**Lenses:** Beautiful and Human-usable first; Accurate when color encodes a state — and
then it must never be the *only* carrier of that state.

## Principle

Color is a **semantic layer, not decoration**. It speeds scanning by mapping a small, fixed
set of meanings (success, failure, warning, accent, secondary) onto a small, fixed set of
colors — and it stays **redundant with text or a symbol**, so the output still works in a
pipe, on a monochrome terminal, or for a colorblind reader. The eye is drawn to color, so
treat it as a spotlight: if everything is colored, nothing stands out.

Color works on **two independent channels** — keep them separate. **Hue** says *what kind of
thing* this is (green pass · red fail · yellow warn · cyan accent for commands / paths / URLs
/ flags); **intensity** says *how much it should grab the eye* within any hue — **bold** to
promote, default as baseline, **dim** to demote. They compose: a **bold-red** headline is the
one error among several red tokens; a **dim-cyan** path is a secondary command; a
**bold-default** heading carries no state at all. Pick a hue for the meaning and an intensity
for the emphasis, separately — and since either can vanish (piped, monochrome, a terminal
with no bold), neither may be the *only* carrier of a state.

Use the **ANSI-16 named colors, not hardcoded hex/truecolor.** Named colors follow the
user's terminal theme (light or dark); a hardcoded `#ff0000` can turn unreadable against
their background. Reach for truecolor only when genuinely necessary and theme-aware.

## Do / Don't

**Do**

- Map color to meaning from the hue table below, and pair every colored token with text or a
  symbol — color *accelerates* reading, it never *carries* the only copy of the meaning.
- Use `dim`/gray to demote secondary information (timestamps, hints, metadata, `unchanged`),
  building hierarchy without color noise. But `dim` (faint) is the **weakest** signal — many
  terminals render it like default — so never let it *alone* mark a distinction that matters.
- Use `bold` to promote — headings, key labels, and the **single outcome-determining
  number** (the failure count, or the total when all pass), not every number. Like color,
  bold is **sparing** (if everything is bold, nothing is) and **redundant** (a terminal may
  render it as bright color, or drop it).
- In an error block, color the **headline** red — leave the body default so the one line
  that matters stays findable.
- Give commands, paths, URLs, and flags one accent color (cyan), distinct from status colors.

**Don't**

- Rainbow / gradient / decorative coloring with no semantic meaning.
- Full-width colored banners or background fills (a selected row or a diff line are the rare
  exceptions).
- Convey information by color alone (a red `12` vs a green `12`, with nothing else to tell
  them apart).
- Paint a whole multi-line error red — it buries the actionable line.
- Hardcode hex that ignores the user's theme.

## Real examples

**`git -c color.ui=always status`** (captured 2026-06-11) — modified and untracked paths in
**red**, staged paths in **green**, the branch name plain, hints dimmed. Piping strips all
of it; `git status | cat` →

```
On branch worktree-cli-output-design
nothing to commit, working tree clean
```

Same information, zero ANSI — the color was redundant, so nothing is lost. (The TTY
detection that does this lives in `robustness.md`.)

**`gh auth status`** (captured 2026-06-11) — a **green ✓** marks the logged-in account, the
token is dimmed and masked (`gho_********`), and secondary lines (protocol, scopes) are gray.
Color + symbol + text all carry "logged in," so the line still reads on a monochrome terminal.

## Cheat-sheet

Hue — ANSI-16 named, semantic *state* (always one of three redundant signals):

| Hue | Meaning |
|---|---|
| green | pass / success / added |
| red | fail / error / removed — **headline only**, not the whole block |
| yellow | warn / attention / changed |
| cyan | accent: command, path, URL, flag, selected item |
| (default) | body text and ordinary output — most of the screen |

Emphasis — intensity, **orthogonal to hue**; carries hierarchy, not state:

| Weight | Use | Caveat |
|---|---|---|
| bold | promote: heading, key label, the one outcome-determining number | may render as bright color or be dropped — keep it sparing & redundant |
| (default) | baseline — the bulk of output | — |
| dim / gray | demote: timestamps, hints, metadata, `unchanged` | weakest signal; never the sole mark of a distinction that matters |

Other SGR attributes — avoid by default: reserve **underline** for the OSC-8 hyperlink-text
fallback and **reverse** for a selected row; skip **italic** (it competes with `dim` and
degrades unevenly).

**Turn color off** when any of these hold (mechanics in `robustness.md`): `NO_COLOR` is set,
`--no-color` is passed, `TERM=dumb`, stdout is not a TTY (piped or redirected), or the output
is `--json` / machine mode. Offer `FORCE_COLOR` for the deliberate-override case. Keep the
*information* identical with color off — color only ever accelerates, never carries.

**Pairings** (color is always one of three redundant signals): green+`✓`+word, red+`✗`+word,
yellow+`⚠`+word. See `symbols.md` for the glyph set and `copywriting.md` for the words.

Sources: clig.dev — "the eye will be drawn to red text, so use it intentionally and
sparingly." Heroku CLI Style Guide — yellow/red reserved for warnings/errors; "too many
contrasting colors … compete for the user's attention"; disable on `--no-color` or non-tty.
