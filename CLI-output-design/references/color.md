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
thing* this is (green pass · red fail · yellow warn · cyan accent for current items,
copy targets, links, and next actions); **intensity** says *how much it should grab the eye* within any hue — **bold** to
promote, default as baseline, **dim** to demote. They compose: a **bold-red** headline is the
one error among several red tokens; a **dim-cyan** command can be a secondary copy target; a
**bold-default** heading carries no state at all. Pick a hue for the meaning and an intensity
for the emphasis, separately — and since either can vanish (piped, monochrome, a terminal
with no bold), neither may be the *only* carrier of a state.

Use the **ANSI-16 named colors, not hardcoded hex/truecolor.** Named colors follow the
user's terminal theme (light or dark); a hardcoded `#ff0000` can turn unreadable against
their background. Reach for truecolor only when genuinely necessary and theme-aware.

The default posture is a **strict baseline**: low-decoration, semantic, and script-friendly.
The one explicit exception is an **expressive TTY notice** — a low-frequency, non-blocking
interactive notice may use a light frame, a small text-safe icon, and an underlined URL, but
only when the same information has a clean plain-text fallback.

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
- Give technical tokens one accent color (cyan) only when they are serving an explicit
  semantic role: identified object, current/selected item, copy target, or next action.
- Use **typed emphasis**: outcome numbers use bold/default (plus status color only when the
  number itself carries pass/fail/warn); role-bearing technical tokens use cyan; status
  words use status colors; ordinary prose stays default.

**Don't**

- Rainbow / gradient / decorative coloring with no semantic meaning.
- Full-width colored banners or background fills (a selected row or a diff line are the rare
  exceptions).
- Convey information by color alone (a red `12` vs a green `12`, with nothing else to tell
  them apart).
- Paint a whole multi-line error red — it buries the actionable line.
- Hardcode hex that ignores the user's theme.
- Use cyan as a generic "important" color; it means identified technical object / link /
  selected or action accent, not emphasis.
- Run a global "technical token" highlighter over dense help, tables, or logs. In those
  surfaces, most command names, flags, paths, and IDs should stay default unless their
  semantic role earns emphasis.
- Use underline, italic, or strikethrough as generic emphasis.

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
| green | pass / success / added / created |
| red | fail / error / removed / deleted — **headline only**, not the whole block |
| yellow | warn / attention / deprecation / changed |
| cyan | accent: current/selected item, copy target, next action, emphasized link or technical object |
| (default) | body text and ordinary output — most of the screen |

Severity ladder — visual strength follows command semantics:

| Severity | Color | Shape |
|---|---|---|
| notice | default or dim | `note:` / `hint:`, no warning glyph |
| expressive TTY notice | cyan accent + optional light frame | interactive TTY only; clean plain-text fallback |
| warning | yellow | `⚠ warning:`; command can continue |
| deprecation | yellow | `⚠ deprecated:` plus replacement when known |
| error | red | `✗ error:`; current operation failed or cannot continue |

Emphasis — intensity, **orthogonal to hue**; carries hierarchy, not state:

| Weight | Use | Caveat |
|---|---|---|
| bold | promote: heading, key label, the one outcome-determining number | may render as bright color or be dropped — keep it sparing & redundant |
| (default) | baseline — the bulk of output | — |
| dim / gray | demote: timestamps, hints, metadata, `unchanged` | weakest signal; never the sole mark of a distinction that matters |

Technical-token emphasis is opt-in, not a global scan:

| Token | Style |
|---|---|
| command / flag / env var / config key | cyan only when it is the identified object, copy target, selected item, or next action; otherwise default |
| path / URL | cyan when emphasized as a target or link; keep complete and copyable; do not wrap mid-token |
| function / formula | cyan only when the function or formula is the subject; otherwise default |
| important number | bold default; add status color only when it carries a status |
| explanatory sentence | default text; use structure and labels instead of coloring the whole sentence |

Other SGR attributes are **reserved, not decorative**:

| Attribute | Use | Avoid |
|---|---|---|
| underline | URL fallback / expressive TTY notice URL | generic emphasis or warning |
| reverse | current selected row in a prompt/menu | warning, error, or notice background |
| italic | avoid by default; terminal support is uneven | notes, hints, or "soft" emphasis |
| strikethrough | avoid by default; prefer `old → new` and diff `-`/`+` | deprecation, replacement, or change-plan old values |

**Turn color off** when any of these hold (mechanics in `robustness.md`): `NO_COLOR` is set,
`--no-color` is passed, `TERM=dumb`, stdout is not a TTY (piped or redirected), or the output
is `--json` / machine mode. Also drop frames, underline, OSC 8 hyperlinks, reverse video,
and other SGR attributes. Offer `FORCE_COLOR` for the deliberate-override case. Keep the
*information* identical with color off — decoration only ever accelerates, never carries.

**Pairings** (color is always one of three redundant signals): green+`✓`+word, red+`✗`+word,
yellow+`⚠`+word. See `symbols.md` for the glyph set and `copywriting.md` for canonical
labels (`note:`, `warning:`, `deprecated:`, `error:`).

Sources: clig.dev — "the eye will be drawn to red text, so use it intentionally and
sparingly." Heroku CLI Style Guide — yellow/red reserved for warnings/errors; "too many
contrasting colors … compete for the user's attention"; disable on `--no-color` or non-tty.
