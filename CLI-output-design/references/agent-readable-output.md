# Agent-Readable Output

**Lenses:** Agent-usable (primary) and Accurate. This is the pillar that makes output
consumable by a script or an AI agent without sacrificing the human reading the same logs.

## Principle

Two facets, both matter:

1. **AI-readable human output.** Even the normal, human-facing stream should use **stable
   labels, clear sections, concrete commands, and unambiguous status words**, so an agent
   reading the logs can infer the next action. clig.dev: "Human-readable output is
   paramount. Humans come first, machines second" — agent-readability is a *property of
   good human output*, not a separate dialect.
2. **A real machine mode.** When `--json` is passed, or stdout is piped/non-TTY, emit
   **pure, stable, parseable data** — no color, no spinners, no prose. clig.dev: "Display
   output as formatted JSON if `--json` is passed"; offer `--plain` for tabular grep/awk
   use.

The hinge for both: **stdout is data, stderr is conversation.** Anything machine-readable
goes to stdout; progress, logs, and diagnostics go to stderr, so a pipe carries only data.

## Do / Don't

**Do**

- In machine mode, put **only the document on stdout** — no ANSI, no spinner residue, no
  surrounding explanation.
- Use **stable field names and status enums**; agents key off them.
- Express next actions as **structured data**: `next_steps` as an array of `{command, reason}`,
  not a sentence.
- Route human progress/diagnostics to **stderr** whenever stdout is reserved for data.
- Pretty-print JSON (2-space) by default; syntax-highlight only on a TTY (`color.md`,
  `robustness.md`).

**Don't**

- Leak color, spinners, or log prose into `--json` / piped stdout.
- Dump internal objects — design the contract; expose stable fields, not your struct.
- Rename or reorder fields casually; treat the schema as a contract.
- Mix several status vocabularies (`agent-readable` reuses the one canonical set).

## Real example — agent-friendly human log

`gh auth status` (captured 2026-06-11) reads cleanly for a human *and* an agent: stable
label + unambiguous state — `✓ Logged in to github.com account Mai8304` — an agent can
parse "logged in" without a JSON mode at all. That is the goal for the default stream.

## Machine contract (`--json`)

Pretty, 2-space, stdout-only, no styling. Common fields:

```json
{
  "schema_version": "1",
  "ok": false,
  "duration_ms": 412,
  "checks": [
    {
      "name": "config_file",
      "status": "fail",
      "message": "not configured",
      "next_steps": [
        { "command": "mycli config init", "reason": "create a local config" }
      ]
    }
  ],
  "warnings": [],
  "errors": ["config_file: not configured"]
}
```

## Cheat-sheet

**Recommended common fields:** `schema_version` · `ok` · `status` · `message` · `hint` ·
`next_steps` · `checks` · `warnings` · `errors` · `duration_ms`.

**Status enums:** per-check `pass | fail | warn | skip`; operation-level success is the
boolean `ok`. (Human status words come from the same family — see `copywriting.md` /
`status-and-progress.md`.)

**Rules of thumb:**

- `stdout` = data, `stderr` = human (progress, logs, notices, diagnostics).
- `--json` → only valid JSON on stdout; large/streaming sets → **NDJSON** (one object per line).
- `schema_version` for public/complex contracts; keep fields stable across releases.
- Numbers stay numbers; don't stringify. `null`/`false` are real values, not omissions.

Cross-links: `robustness.md` (TTY detection, exit codes), `color.md` (TTY-only JSON
highlight), `output-patterns.md` (per-pattern piped/`--json` behavior).
