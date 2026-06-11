# Output Patterns

**Lenses:** Human-usable and Beautiful per pattern; Agent-usable for every pattern's
piped / non-TTY behavior. A cookbook of composite shapes built from the atoms
(`color.md`, `symbols.md`, `layout.md`, `status-and-progress.md`). Each recipe gives the
shape, a TTY example, and the piped/narrow/agent degradation. Open the one you're rendering.

## Data display shapes

### Tables

For *homogeneous* rows only. **Borderless** — space-separated columns, no `+--+` grid
(noisy, breaks on resize/copy). Header bold/dim; text left-aligned, numbers right-aligned;
over-long cells truncate with `…` and **never wrap-break the grid**.

```
NUMBER  TITLE                STATE   UPDATED
#128    Fix color fallback   open    2h ago
#127    Bump deps            merged  1d ago
```

**Narrow fallback:** when columns don't fit, collapse each row into a key-value **record
block** (à la `gh`), rather than dropping columns silently. **Piped →** TSV or `--json`,
not the pretty table, so `cut`/`awk`/`jq` work. (Heroku's `cli.table` renders a borderless,
grep-parseable table with a single `─────` header rule.)

### Object detail / "describe" view

```
Pull request #128                                  open
  Title     Fix color fallback on dumb terminals
  Author    zhuangwei
  Branch    fix-color → main
  Checks    ✓ 4 passed
  Files     6 changed  (+128 −34)
```

For *one* object's fields (contrast Tables, which are many homogeneous rows). Aligned
`label  value`, grouped into sections (blank line between groups) for large objects;
headline = identity + status; long values hang-indent under the value column. **Piped /
`--json` →** the structured object. (See `layout.md` tables-vs-key-value.)

### Lists

Unordered `•`/`-`, indent 2, **hanging indent** on wrap; ordered `1.` right-aligned.
Key-value lists: label dim/bold, aligned colon/columns. Nest +2 per level; stay shallow.

### File tree

```
src/
├── cli/
│   ├── main.go
│   └── render.go
└── internal/
    └── color.go
```

Connectors `├── └── │`; ASCII fallback `|--`, `` `-- ``, `|`. Directories cyan/bold + a
trailing `/`. Truncate large trees (`… and 42 more`). **Piped →** one plain path per line,
not the tree art.

### Code / diff

```
src/main.go
@@ -10,6 +10,7 @@
   ctx := context.Background()
-  log.Print("start")
+  log.Info("start", "v", v)
```

The `+`/`-` prefixes **carry the meaning; color only reinforces** (never red/green alone).
File name bold; hunk header `@@` dim/cyan; context lines dim; line numbers in a dim gutter.
Agent "edit applied" summary: `✓ Edited src/main.go (+12 −3)`, diff optional/expandable.
**Piped →** raw unified diff (patch-compatible, no color); large diffs truncate/paginate.

### Content blocks

- **Code block:** preserve content verbatim (soft-wrap with an indicator, never reflow);
  syntax-highlight on TTY only; separate with a left bar or indent — **no full box**; keep
  the copyable region clean (no line numbers mixed in, or use OSC).
- **Callout / quote:** left color bar `▌` + a colored label (`note:` / `warning:` / `tip:`);
  blockquote = dim `│` + dim text. No boxes — they break on resize/copy.
- **Markdown:** headings bold, inline code cyan, links via OSC 8 hyperlinks (fallback: text
  + dim URL).

### Pagination & pager

**Page into `$PAGER` only when stdout is a TTY** (like `git` → `less -FIRX`), respecting
`--no-pager`; piped / non-TTY → stream raw, no pager, no prompts. For inherently long lists,
**truncate with a tail hint**: `… and 42 more (use --all)`; provide `--all`/`--limit`; never
silently drop rows. Never page machine output; restore terminal state if the pager is killed.

## Operation lifecycle & outcomes

### Progress

Determinate bar with percent/absolute/rate/eta; indeterminate spinner only when total is
unknown; multi-item → live region collapsing to a summary; ~10–20 fps; replace the bar with
`✓`/`✗`. **Piped →** discrete milestone lines, no `\r`. (Full detail in
`status-and-progress.md`.)

### Checklist

```
◆ Checking environment
  ✓ Node version     v24.11.1
  ⚠ Disk space       2.1 GB free
  ✗ Auth token       missing

3 passed · 1 warning · 1 failed
```

Section header `◆`; items indent 2; value column aligned; running items show a spinner that
resolves to `✓`/`✗`; end with a summary line.

### Diagnostics (with source frames)

```
error[E0382]: borrow of moved value: `cfg`
   ┌─ src/main.go:14:9
12 │   load(cfg)
   │        --- value moved here
14 │   print(cfg)
   │         ^^^ value used after move
   = help: clone `cfg` before load()

3 errors · 1 warning
```

Severity headline (+ optional code), a **code frame** with `^^^`/`---` caret span, dim
line-number gutter, and a `= help:` remedy. Group by file, errors before warnings, end with
a count, **exit non-zero**. **Piped / non-TTY →** one parseable line per diagnostic:
`path:line:col: level: message` (the `rustc`/`gcc` convention an editor or agent can read).
Distinct from a single error's wording (`copywriting.md`).

### Result & test summaries

```
✓ 142 passed   ✗ 1 failed   ⊘ 3 skipped        4.2s

  ✗ internal/cache: TestEvict/expired
      cache_test.go:88: expected 0 entries, got 1

FAIL  (1 of 146)
```

A one-line tally (counts + color + symbol), then **only the failures expanded** (location +
assertion delta), then a verdict line, with timing. **Exit code matches the verdict.**
Quiet → tally only; **piped →** stable tally line or `--json`. The canonical "end well" block.

### Dry-run / change-plan preview

```
Plan: 2 to add · 1 to change · 0 to destroy

  + service "web"        will be created
  ~ service "api"        image  1.2 → 1.3

Run with --apply to execute.
```

`+`/`~`/`-` prefixes (add/change/destroy), aligned, with a **count header**; show
`old → new` for changes. **"No changes" is a first-class state** (`No changes. Everything is
up to date.`). Before a mutating apply, show this summary + blast radius, then confirm; default
to the safe path. **Piped / `--json` →** the structured change set.

### Empty states

```
No open pull requests.

  Create one with:  gh pr create
```

**Never emit a blank result.** One plain sentence naming the emptiness + an optional
next-step; distinguish "nothing matches" from "not set up yet" (point the latter at setup).
**Piped / `--json` →** an empty array / zero rows, **not** the human sentence; exit `0`
(empty isn't an error unless the contract says so).

## Streaming & conversation

### Conversation (chat / agent CLIs)

```
▌ You
  How do I reset the cache?

▌ Assistant
  Run `mycli cache clear`.
```

**Left gutter bar `▌` + a colored role name** distinguishes turns (user cyan / assistant
default / system+tool dim); role is carried by label + color, not indentation alone. Tool
calls/results render as a distinct dim, collapsible block. Reads like a transcript — minimal
decoration.

### Streaming output

Spinner ("thinking") before the first token, then stream incrementally. Already-printed text
can't be re-wrapped — commit wrap decisions as you go, or redraw the current line. Hide the
cursor during animation and restore on exit; **clean Ctrl-C** (restore cursor, newline,
flush, no lost data). **Streaming markdown:** render plain text while streaming, then
re-render a block (code fence, table) **in place once it closes**. **Piped / non-TTY →** raw
text stream, no cursor tricks, periodic flush.

## Notices & logs

### Logs & verbosity tiers

```
14:02:11  INFO   server listening   addr=:8080
14:02:11  WARN   slow disk          latency=412ms
14:02:12  ERROR  upstream timeout   url=…/sync
```

Leveled lines: dim timestamp, **aligned fixed-width level** (color per level), message, then
dim `key=value` context. One level vocabulary. **Verbosity contract:** `-q` = warnings+errors
only; default = normal; `-v`/`-vv` = add debug/trace; quiet still shows errors. Note: leveled
labels belong to this verbose/daemon surface — clig.dev says *don't* prefix normal output
with `ERR`/`WARN` by default. Logs → **stderr**; **piped →** no color, stable format (or
`--log-format=json`).

### Notices & banners

```
A new version of mycli is available: 1.2.0 → 1.3.0
Run `mycli upgrade` to update.
```

Non-blocking, on **stderr**, visually quiet (dim), never interrupting the primary result on
stdout. Show once / rate-limited; respect an opt-out env var. Deprecation warnings name
what's deprecated, the replacement, and the removal timeline. **Never** let a notice pollute
piped / `--json` stdout.
