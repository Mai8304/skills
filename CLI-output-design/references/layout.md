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
- Pad trailing whitespace; end output with exactly one newline.

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

## Measure display width, not character count

Alignment, padding, and truncation must be computed in **display columns**, not bytes or
runes. **CJK ideographs, full-width punctuation, and most emoji occupy two columns**; a
grapheme cluster (e.g. an emoji with a modifier) is one unit. Counting characters instead
silently breaks every aligned shape the moment a cell holds Chinese/Japanese/Korean text:

```
# Wrong — padded by rune count, so the CJK rows run long
NAME      STATUS
配置文件      missing
gateway   ok

# Right — padded by display width (each 中文 char = 2 cols)
NAME        STATUS
配置文件    missing
gateway     ok
```

Use a width-aware function (`wcwidth` / east-asian-width) for column padding and for
`…`-truncation, so a cell never overruns or under-fills its column. (Mechanics in
`robustness.md`.)

## Cheat-sheet

- **Indent** child detail by 2 spaces per level; keep nesting shallow.
- **Spacing:** one blank line between sections; none inside a tight list.
- **Width:** detect at runtime; wrap prose, cap ~100; never wrap identifiers/paths/URLs.
- **Display width:** pad/align/truncate by display columns (CJK & emoji = 2), not char count.
- **Tables:** borderless, homogeneous data only, numbers right-aligned, narrow fallback.
- **Truncate** with `…`, keeping it meaningful — paths in the middle: `src/…/main.go`.
- Numeric columns: right-align, align decimal points (values themselves in `copywriting.md`).

Cross-links: `output-patterns.md` for full table/tree/list recipes, `robustness.md` for
width detection, `symbols.md` for `◆`/`…`.
