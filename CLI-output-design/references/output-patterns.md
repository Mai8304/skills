# Output Patterns

**Lenses:** Human-usable and Beautiful per pattern; Agent-usable for every pattern's
piped / non-TTY behavior. A cookbook of composite shapes built from the atoms
(`color.md`, `symbols.md`, `layout.md`, `status-and-progress.md`). Each recipe gives the
shape, a TTY example, and the piped/narrow/agent degradation. Open the one you're rendering.

## Table of contents

- Command surfaces: help/usage, argument errors
- Good / bad reference cases
- Data display shapes: tables, object detail, lists, file trees, code/diff, content blocks, pagination
- Operation lifecycle & outcomes: progress, nested tasks, checklists, diagnostics, summaries, dry-runs, empty states
- Streaming & conversation: base chat transcript, streaming output
- Notices & logs: verbosity, notices, expressive TTY notices
- Prompts & selection: confirmation, single-select, multi-select, cancellation

## Command surfaces

### Help / usage

Help output is a command surface, not a data result. Print help to stdout and exit `0`.
It is a discovery surface: the reader is scanning structure, not evaluating state.
Structure it into sections; avoid one-line brace blobs that require horizontal scanning.
Use aligned two-column command/flag lists and short examples.

Good:

```text
USAGE
  mycli deploy [--env <name>] [--dry-run]

COMMANDS
  init      Create a config file
  deploy    Deploy the current project
  status    Show deployment status

OPTIONS
  --env <name>    Target environment
  --dry-run       Preview changes without applying them

EXAMPLES
  mycli deploy --env staging
  mycli deploy --env prod --dry-run
```

Bad:

```text
Usage: mycli {init,deploy,status,destroy,config,auth,logs,doctor,completion} [options]
```

Rules: prefer sectioning, alignment, hanging indent, and bold headings. Do not
automatically color every command name, flag, or binary name. Accent only explicit
copy targets such as example commands or `Next:` commands, and only on a TTY. Keep URLs
and commands complete and copyable. Piped help is the same plain text, without color or
pager. Long help may page only when stdout is a TTY.

### Usage and argument errors

Bad arguments are diagnostics. Print to stderr, exit `2`, and show only the relevant usage
slice plus the concrete next step.

Good:

```text
✗ error: missing required flag `--env`

  Usage:
    mycli deploy --env <name>

  Next:
    mycli deploy --env staging
```

Unknown command:

```text
✗ error: unknown command `deply`

  Did you mean:
    mycli deploy

  Next:
    mycli --help
```

Bad:

```text
Error: invalid
```

Do not dump full help after every usage error; it hides the fix. `--json` usage errors use
a structured error object on stdout only when the command's machine contract says errors
are represented in JSON; otherwise keep diagnostics on stderr and exit `2`.

## Good / bad reference cases

Use these as quick comparison anchors before choosing a detailed recipe:

| Surface | Good | Bad |
|---|---|---|
| help / usage | sectioned `USAGE`, commands, options, examples | one-line `{cmd1,cmd2,...}` blob |
| bad arguments | `✗ error:` + focused `Usage:` + `Next:` + exit `2` | `Error: invalid` with no fix |
| table | borderless aligned columns, narrow record fallback | `+---+` grid that breaks on resize |
| file tree | tree only on TTY; piped output is one path per line | tree art emitted into pipes |
| progress | honest bar/spinner that resolves to `✓`/`✗` | fake 99% bar or orphaned spinner |
| diagnostic | source frame + help + non-zero exit | stack trace or `failed` alone |
| dry-run | count header + `+`/`~`/`-` prefixes + safe apply path | destructive apply with no preview |
| prompt | blast radius before `[y/N]`; non-TTY flag path | blocks CI waiting for stdin |
| notice | quiet stderr line; expressive frame only in TTY | framed banner in CI / `--json` |
| machine mode | pure JSON/NDJSON on stdout | prose, ANSI, or spinners mixed into JSON |

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
  Checks    ✓ pass 4
  Files     6 changed  (+128 -34)
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
Agent "edit applied" summary: `✓ Edited src/main.go (+12 -3)`, diff optional/expandable.
**Piped →** raw unified diff (patch-compatible, no color); large diffs truncate/paginate.

### Content blocks

- **Code block:** preserve content verbatim (soft-wrap with an indicator, never reflow);
  syntax-highlight on TTY only; separate with a left bar or indent — **no full box**; keep
  the copyable region clean (no line numbers mixed in, or use OSC).
- **Callout / quote:** left color bar `▌` + a colored label (`note:` / `warning:` / `tip:`);
  blockquote = dim `│` + dim text. No boxes — they break on resize/copy.
- **Markdown:** headings bold, inline code cyan. Links may use OSC 8 on an interactive TTY,
  but the fallback is a complete, copyable raw URL (often on its own line), not a hidden
  label that disappears in logs.

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

### Nested task progress

For multi-stage work (builds, deploy pipelines, monorepo task graphs) — a tree of tasks,
each with its own spinner → `✓`/`✗`, parents rolling up child status:

```
◆ Deploy
  ✓ build              12.4s
  ⠙ migrate
    ✓ schema           0.8s
    ⠙ seed data
  • smoke tests        queued
```

Indent children by 2; a parent shows `✓` only when **all** children pass, `✗` if any fail
(and surfaces which one). In-progress nodes spin; not-yet-started nodes are dim `•` with a
phase label such as `queued` (not a terminal status). On a narrow terminal or non-TTY,
flatten to sequential `parent → child` milestone lines (no live tree). Cross-link
`status-and-progress.md`.

### Checklist

```
◆ Checking environment
  ✓ Node version     v24.11.1
  ⚠ Disk space       2.1 GB free
  ✗ Auth token       missing

pass 3 · warn 1 · fail 1
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
✓ pass 142   ✗ fail 1   ⊘ skip 3        4.2s

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

`+`/`~`/`-` prefixes (add/change/destroy), aligned, with a **count header**; color only
reinforces the prefix (`+` green, `~` yellow, `-` red). Show `old → new` for changes; prefer
that over strikethrough. **"No changes" is a first-class state** (`No changes. Everything is
up to date.`). Before a mutating apply, show this summary + blast radius, then confirm (see
`Confirmation & destructive actions`); default to the safe path. **Piped / `--json` →** the
structured change set.

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
decoration. For full agent-chat TUI states — input draft, cursor/selection behavior,
thinking, tool use/results, approvals, choices, background tasks, and subagents — open
`agent-chat-tui.md`; this section is only the base transcript pattern.

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

Non-blocking, on **stderr**, visually quiet (default/dim), never interrupting the primary
result on stdout. Show once / rate-limited; respect an opt-out env var. Deprecation
warnings are yellow, not red unless the command fails; they name what's deprecated, the
replacement, and the removal timeline when known. **Never** let a notice pollute piped /
`--json` stdout.

**Expressive TTY notice** — for low-frequency, non-blocking interactive notices such as an
available update. It is the only notice shape that may use a light frame, a small text-safe
icon, and an underlined URL:

```
┌──────────────────────────────────────────────────────────────┐
│ ✦ Update available!  0.135.0 → 0.141.0                       │
│ Run npm install -g @openai/codex to update.                  │
│                                                              │
│ See full release notes:                                      │
│ https://github.com/openai/codex/releases/latest              │
└──────────────────────────────────────────────────────────────┘
```

Keep it to one light frame and a few lines; no nested boxes, thick borders, background
fills, or emoji. The URL remains complete and copyable; OSC 8 clickability is only an
enhancement. **Piped / CI / `NO_COLOR` / `TERM=dumb` / `--json` →** no frame, no underline,
no OSC 8, no icon dependency:

```
Update available: 0.135.0 -> 0.141.0
Run npm install -g @openai/codex to update.
Release notes: https://github.com/openai/codex/releases/latest
```

## Prompts & selection

The *rendering* and *state* of interactive prompts — not the input-handling mechanics. The
cross-cutting rule comes first: **a prompt must never block on stdin in a non-TTY / CI /
`--json` context.** Detect it and use a flag, a default, or fail clearly (`use --yes /
--region=… in non-interactive mode`). And always distinguish a user **cancel** (Ctrl-C →
restore the terminal, exit `130`) from a **"No" answer** (a valid choice → exit `0`) — scripts
and agents read the exit code to tell "aborted" from "declined."

### Confirmation & destructive actions

Show the **blast radius before the question**, default destructive prompts to **No**, and
offer a flag to skip:

```
This will delete 3 buckets and 1 database — cannot be undone:
  - s3://logs-prod
  - s3://logs-staging
  - rds: analytics-primary

Continue?  [y/N]
```

`[y/N]` capitalizes the **default** (here No). Low-stakes prompts may default to Yes (`[Y/n]`).
`--yes`/`-y` skips it; in non-TTY/CI, **don't hang** — require `--yes` or fail. (The change
set itself is the `Dry-run / change-plan preview` pattern above.)

### Single-select (pick one)

**Shape encodes cardinality — round = pick one.** Use either a pointer-only highlight *or* a
radio `●`/`○` as the cursor, never both on the same row:

```
? Pick a region    ↑/↓ move · / filter · enter select · esc cancel
  us-east-1
❯ us-west-2
  eu-west-1
  … 8 more ↓
```

Long lists scroll in a viewport with a "N more" hint plus **type-to-filter**; wrap around at
the ends. On confirm, **collapse to one line**: `✓ Region · us-west-2`. ASCII pointer `>`;
radio fallback `(•)`/`( )`. Reverse video is allowed only for the current row in a prompt
or menu; it is not an alert or emphasis style.

### Multi-select (pick any)

**Square = pick many**, carried by two *independent* signals — the cursor `❯` (where you are)
and the checkbox `[x]`/`[ ]` (what's toggled):

```
? Select features   space toggle · a all · enter confirm · esc cancel
❯ [x] auth
  [ ] billing
  [x] analytics
  2 selected
```

Show the selected count; offer toggle-all. Collapse on confirm: `✓ Features · auth, analytics`.
Non-TTY → take repeatable flags (`--feature auth --feature analytics`). (Known variant:
Inquirer.js renders checkboxes with circles `◉/◯`; this skill uses **squares** so the shape
still signals "pick many.")

### Controls & cancellation (shared)

A dim, concise hint line lists **only the keys this prompt actually uses**, lowercase and
`·`-separated: `↑/↓ move` · `enter select` · `space toggle` (multi) · `/ filter` (long lists)
· `esc back` (multi-step) · `ctrl-c quit`. Support `j`/`k` silently. In a multi-step flow,
show progress (`Step 2 of 4`) or a breadcrumb, and **`esc`/`←` returns to the previous step
with its answer restored**. Give `esc` one meaning (back *or* cancel) and keep it consistent.
ASCII fallback for navigation hints uses words (`up/down move`, `back`). On cancel, restore
the cursor and terminal, print a quiet `■ Cancelled.` (or nothing), and exit `130`.
