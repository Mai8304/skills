# Layout

**Lenses:** Human-usable and Beautiful — layout is where most perceived quality comes from.

## Principle

Whitespace is **structure**, not filler. A reader scans top-down, so **lead with the
result/state**, group related lines into blocks, and let alignment and spacing — not boxes
and rules — carry the shape. Respect the terminal: wrap prose to the width, but never wrap
the things a user needs to copy.

## Do / Don't

**Do**

- Use section blocks for multi-step output; a `◆`/heading line then 2-space-indented detail.
- Separate major sections with exactly **one blank line**; keep tight checklists un-spaced.
- Use **key-value summaries** for metadata/config (aligned label column).
- **Wrap prose to the terminal width but cap at ~100 columns** (long lines are tiring); put
  recovery in an explicit `Next:` block rather than a paragraph.
- Give long paths / URLs / commands **their own line, indented** — keep them copy-paste-able.
- Use a **hanging indent**: wrapped continuation aligns under the content, not the bullet.
- Detect width at runtime (cross-link `robustness.md`); leave a small right margin.

**Don't**

- Hardcode 80 columns, or fill output to the very last column (ugly reflow on resize).
- Draw full `+----+` ASCII grids or boxes (noisy; break on resize/copy).
- Wrap an identifier, path, URL, or command mid-token.
- Leave trailing whitespace, or pad piped / simple output with leading or trailing blank
  lines (block edges are TTY-only — see Vertical rhythm & edges).

## Vertical rhythm & edges

Blank lines encode **grouping distance** — spend them as signal, not filler:

- **0 blank lines** — same group: checklist rows, key-value rows, a tight list.
- **1 blank line** — related but distinct sections; also **before a summary / verdict line**
  (the summary is its own section).
- **2+ blank lines** — reads as a hard "new topic" break; avoid inside one command's output,
  and never emit more than one consecutive blank line.

A leading or trailing blank line is **decoration**, so the block's edges are
channel-dependent:

- **Data / simple / piped output** — no leading blank; end with exactly one `\n`. A blank
  line in a pipe is data pollution.
- **Interactive multi-section "ceremony" output** (installers, doctor checks, wizards) — one
  leading + one trailing blank, so the block reads as a card set off from the shell prompt.
  **TTY only** — strip it when piped or `--json` (cross-link `robustness.md`).

## Tables vs key-value

- **Table** only for *homogeneous* rows (many items, same fields). Borderless, space-
  separated columns; header bold or dim; numbers right-aligned. Provide a narrow fallback
  (see `output-patterns.md` §tables).
- **Key-value / "describe"** for *one* object's fields. Aligned `label  value` block.
- If a "table" has one row, it's a key-value block — use that.

## Real examples

**`gh --help`** (captured 2026-06-11) — sectioned (`USAGE`, `CORE COMMANDS`, `ADDITIONAL
COMMANDS`) with an aligned two-column `name:  description` list. Scannable because the
column lines up and sections are separated by blank lines.

**`lark-cli --help`** (captured) — clean `USAGE` / `EXAMPLES` / `AI AGENT SKILLS` /
`COMMUNITY` sections, examples indented, URLs aligned. Contrast the common anti-pattern: a
help that dumps a 40-item `{init,build,test,deploy,…}` brace blob on one line is an
unscannable wall; the sectioned form — each command on its own line with a hanging-indented
description — is what reads.

A doctor-style block and its narrow-terminal fallback:

```
◆ Checking workspace                 # ~80 cols

  ✓ CLI version      1.0.51
  ✗ Config file      not configured

  Next:
    mycli config init
```

```
◆ Checking workspace                 # ~40 cols — value drops to its own line
  ✓ CLI version
      1.0.51
  ✗ Config file
      not configured
```

## Alignment

Align on the **edge the eye compares**, and keep the gap between columns constant:

- **Text / labels → left** — you scan down the start of words.
- **Pure numbers → right**, aligned on the decimal point — you compare place value.
- **Mixed-unit values** (`1.2s`, `3m 04s`, `2h`; `1.2 MB`, `940 KB`) **→ right edge.** There's
  no decimal to align, so stack the right edge and magnitudes still line up — don't force a
  decimal alignment that doesn't exist (humanized values in `copywriting.md`).
- **Columns are separated by ≥ 2 spaces, constant down the whole block.** A single or ragged
  gap is the main reason output "looks misaligned."

Two label shapes look alike but align differently:

- **Aligned label column** (describe / checklist) — label left, **no colon**, value column
  starts at `max(label width) + 2`; the alignment already does what a colon would.
- **Inline prefix label** (`Next:` · `Reason:` · `note:`) — colon-terminated, introduces a
  block; **not** part of any column, so it isn't padded.

When a value is too long, **hang it under the value column** if that column is wide enough to
keep; **drop it to its own indented line** only when the terminal is too narrow for a stable
column (the narrow doctor-block fallback above). Align value columns **locally within a
section** — don't force one global column across unrelated blocks (it balloons the gap and
ties unrelated content together).

## Measure display width, not character count

Alignment, padding, and truncation must be computed in **display columns**, not bytes or
runes. **CJK ideographs, full-width punctuation, and most emoji occupy two columns**; a
grapheme cluster (e.g. an emoji with a modifier) is one unit. Counting characters instead
silently breaks every aligned shape the moment a cell holds Chinese/Japanese/Korean text:

```
# Wrong — padded by rune count, so the CJK rows run long
NAME      STATUS
配置文件      missing
gateway   pass

# Right — padded by display width (each 中文 char = 2 cols)
NAME        STATUS
配置文件    missing
gateway     pass
```

Use a width-aware function (`wcwidth` / east-asian-width) for column padding and for
`…`-truncation, so a cell never overruns or under-fills its column. (Mechanics in
`robustness.md`.)

## Cheat-sheet

- **Indent** child detail by 2 spaces per level; keep nesting shallow.
- **Spacing:** one blank between sections (& before a summary), none in a tight list, never
  2+; block edges (leading/trailing blank) are TTY-only.
- **Width:** detect at runtime; wrap prose, cap ~100; never wrap identifiers/paths/URLs.
- **Display width:** pad/align/truncate by display columns (CJK & emoji = 2), not char count.
- **Tables:** borderless, homogeneous data only, numbers right-aligned, narrow fallback.
- **Truncate** with `…`, keeping it meaningful — paths in the middle: `src/…/main.go`.
- **Align:** on the compared edge — labels left, pure numbers on the decimal, mixed units on
  the right edge; columns ≥ 2 spaces apart, constant. See Alignment.

Cross-links: `output-patterns.md` for full table/tree/list recipes, `robustness.md` for
width detection, `symbols.md` for `◆`/`…`.
