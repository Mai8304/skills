# Agent Chat TUI

**Lenses:** Accurate first, then Human-usable, Agent-usable, and Beautiful. This file covers
interactive agent-chat terminal UIs: transcripts, user drafts, streaming assistant output,
thinking summaries, tool use/results, choices, approvals, background tasks, and subagents.

## Scope

Agent Chat is a TUI surface, not ordinary command output. Still, it follows the same CLI
contract:

- stdout/data and stderr/conversation boundaries still matter when the chat emits files,
  command results, logs, or machine events.
- TTY affordances are optional enhancements: animation, cursor control, frames, underlines,
  reverse video, OSC 8 links, and live redraws disappear outside an interactive TTY.
- The reusable layer is **atomic**. Define role, state, tool, choice, and result atoms first;
  full status bars, approval cards, or product-specific layouts are examples only.
- Home-grown or product-specific agent UIs may be useful references, but this skill is
  generic. Do not bake one product's status bar, wording, or approval card into the rule.

## Table of contents

- Theme and terminal boundary
- Channel routing
- Atom model
- Role and transcript atoms
- User input atoms
- Assistant output atoms
- Thinking atoms
- Tool-use atoms
- Choice and approval atoms
- Alert, timer, and background atoms
- Subagent atoms
- Reference compositions
- Good / bad cases
- Non-TTY and machine events
- Red flags

## Theme and terminal boundary

Use ANSI-16 named colors so the user's terminal theme controls contrast. Do not assume a
dark background; avoid hardcoded hex colors, background fills, and low-contrast dim-only
states. Every role/state must survive with color disabled.

Default theme mapping:

| Atom | TTY style | Fallback |
|---|---|---|
| user role / current input accent | cyan label or gutter | `You:` |
| assistant role | default text, optional bold label | `Assistant:` |
| system / tool metadata | dim/default label | `System:` / `Tool:` |
| tool name / command / path / URL / function / formula | cyan technical token | raw copyable token |
| warning / deprecation | yellow + `⚠` + word | `warning:` / `deprecated:` |
| error / blocked | red headline + `✗` + word | `error:` / `blocked:` |
| selected row | reverse video or pointer, not both if noisy | `>` |

Underline is reserved for URL fallback in expressive TTY notices. Italic and strikethrough
are avoided by default. Prefer `old -> new`, diff prefixes, or explicit labels over
strikethrough.

## Channel routing

Agent-chat TUIs often combine conversation, progress, tool output, and final data. Keep the
channels explicit:

| Surface | Interactive TTY | Piped / non-TTY | `--json` / event mode |
|---|---|---|---|
| transcript turns | terminal screen / transcript lane | plain transcript lines only when transcript is the requested output | structured `turn.*` / `message.*` events |
| user draft, cursor, selection | live TUI only | omitted | omitted |
| thinking / tool progress / notices | stderr or redraw region | stderr milestone lines | event objects on stdout if in the JSON stream |
| final assistant answer | transcript lane; `--print` may also use stdout | stdout only when the command's contract is "print the answer" | `message.delta` / `turn.end` events |
| tool stdout/stderr preview | child detail block with bounded preview | stderr unless it is the command's explicit data result | bounded fields or referenced artifact IDs |
| artifacts / data result | file path or stdout per command contract | stdout or file, never mixed with progress | JSON fields / artifact references |

If stdout is reserved for a data result or machine events, route conversation and progress to
stderr. If the product is a one-shot chat command whose documented result is plain assistant
text, stdout may carry the final answer, but live TUI chrome, tool progress, and notices must
stay off stdout.

## Atom model

Each visible atom has four parts:

1. **Kind:** role, state, tool, result, choice, alert, timer, subagent.
2. **Label:** stable text that survives copying and logs (`Tool`, `thinking`, `warning`).
3. **Optional glyph/color:** accelerates scanning in interactive TTY.
4. **Fallback:** ASCII/plain text with the same information.

Use the canonical status vocabulary where it fits: `running · pass · fail · warn · skip ·
changed · unchanged`. Product labels may wrap these, but the underlying state should stay
stable for logs and machine events.

## Role and transcript atoms

Base transcript shape:

```text
▌ You
  How do I reset the cache?

▌ Assistant
  Run `mycli cache clear`.
```

Rules:

- The role label carries the turn identity; color and gutter are redundant enhancements.
- Use hanging indent for multiline turns. Do not prefix every assistant line with a noisy
  marker.
- Keep user-submitted content exact. Do not recolor code, paths, or quotes in a way that
  changes copy/paste semantics.
- Tool and system turns are visually distinct but quieter than human/assistant turns.
- Persisted transcripts should use plain labels, not ANSI styling or cursor-control output.

## User input atoms

The draft composer is live UI, not transcript history.

- Show a clear prompt/cursor anchor such as `❯` or `>` plus an optional role label.
- Let the terminal's native cursor and selection do the work. Do not invent a fake cursor in
  persisted logs.
- Deletion, editing, history navigation, and paste update the draft in place; they should not
  leave partial lines in the transcript.
- Multiline input uses continuation indentation under the draft, preserving code blocks and
  pasted text.
- Soft-wrapped visual lines are not submitted newlines. Hard newlines are explicit user
  input, usually `shift-enter`, `alt-enter`, or a paste containing line breaks.
- Use bracketed paste when available so pasted multiline code lands as one edit operation,
  not a burst of accidental submits.
- Respect IME/CJK composition: do not treat intermediate composition text as submitted input,
  and measure the final draft by display width.
- Native terminal selection should select visible text without copying hidden ANSI or cursor
  bytes. If the TUI provides custom selection, persisted logs still use plain text.
- Autocomplete, slash commands, file mentions, and history suggestions are suggestion atoms;
  they must be visually secondary and disappear from the submitted transcript unless chosen.
- Submitted input collapses into a transcript turn with the `You` label.
- Passwords, secrets, tokens, and credentials are redacted before they enter transcript,
  logs, screenshots, or machine events.

Example draft:

```text
❯ You  summarize src/cache.go and include edge cases
```

After submit:

```text
▌ You
  summarize src/cache.go and include edge cases
```

## Assistant output atoms

Assistant output streams as readable prose with minimal chrome.

- Before the first token, show a TTY-only thinking/running atom if latency would otherwise
  look broken.
- Once tokens stream, stop the spinner or move it to a quiet status line. Do not animate
  beside long prose.
- Already-printed text cannot be safely rewrapped unless the TUI owns a redraw region.
- Closed code fences, tables, and diffs may be re-rendered in place in a TTY; non-TTY output
  streams plain text exactly once.
- On interruption, restore cursor state, print a newline if needed, and mark cancellation or
  partial output truthfully.

## Thinking atoms

Thinking UI means "the agent is working"; it must not imply access to hidden chain of
thought. If the product exposes reasoning summaries, label them as summaries.

Recommended atoms:

```text
▸ USER.md might be in the memory store but not as a regular file. Let me check from my memory. I know it says:
│  - 老家在厦门（福建省）
│  - 喜欢吃北京烤鸭
│  - 喜欢香港迪士尼乐园
│  - 目前在北京
│
│  Let me check memory to see how USER.md is stored.
```

Rules:

- `▸` marks an expanded thinking block in interactive agent-chat surfaces. Continuation
  lines use `│` so the block reads as a single intermediate state and aligns with the
  transcript gutter.
- `◐ ◒ ◑ ◓` remain valid for compact live thinking indicators before an expanded thinking
  block or while waiting for the first visible token. Braille spinner frames from
  `symbols.md` remain valid for ordinary progress.
- Use `thinking`, `planning`, `waiting`, or `streaming` only when those states are true.
- Collapse long internal activity into bounded visible thinking blocks. Keep them readable,
  wrap by display width, and avoid `⎿` child-result styling for thinking prose.
- Do not reveal hidden chain-of-thought. Show summaries, plans, and observable actions.
- Off-TTY, use discrete events: `thinking: started`, `thinking: inspected 4 files`,
  `thinking: pass`.

## Tool-use atoms

Tool use has a start, optional details, a terminal state, and a bounded result preview.

```text
◐ ⚙ read_file  running
  ⎿ path: src/cache.go

✓ ⚙ read_file  pass  42ms
  ⎿ 184 lines
```

Rules:

- `⚙ name` marks tool use; the tool name is a technical token, usually cyan in a TTY.
- Arguments/results use child detail atoms (`⎿`) with stable labels: `path`, `args`,
  `stdout`, `stderr`, `result`, `exit`, `duration`.
- Show bounded previews for large output and a clear truncation count.
- Terminal state replaces the spinner: `✓ pass`, `✗ fail`, `⚠ warn`, `⊘ skip`.
- Do not stream raw command output into the same visual lane as assistant prose. Keep a
  child block or collapsible region so the transcript remains scannable.
- Tool calls that mutate state should surface preview/approval atoms before execution when
  the product contract requires it.

## Choice and approval atoms

Choices reuse prompt rules from `output-patterns.md`: shape encodes cardinality, and
non-TTY must have a flag/default/failure path.

Single choice:

```text
? Choose a model    ↑/↓ move · enter select · esc cancel
❯ fast
  balanced
  thorough
```

Approval/change proposal atoms should be key-value lines, not a required boxed template:

```text
approval required
  title: Update cache invalidation
  risk: medium
  changes: 2 files
  validation: go test ./internal/cache

Approve? [y/N]
```

Rules:

- Default risky or destructive choices to No.
- Keep `approve`, `deny`, `cancel`, and `edit` distinct in machine events. Exit codes express
  the process outcome: `cancel` / Ctrl-C normally exits `130`; malformed input exits `2`;
  approval denied or edit requested may still exit `0` when it is a valid user choice and no
  operation failed.
- Use stable labels (`title`, `risk`, `changes`, `validation`, `next`) so logs remain
  readable by humans and agents.
- A light frame is allowed only as an expressive TTY notice or product-specific composition,
  not as the reusable requirement.

## Alert, timer, and background atoms

Alerts follow `color.md` and `copywriting.md`. Agent-chat surfaces should keep them in the
transcript lane unless they are truly global TUI chrome.

```text
⚠ warning: tool output truncated to 200 lines
✗ error: command failed with exit 2
timer: retrying in 30s
background: task queued · id=sync-42
```

Rules:

- Warning means the conversation can continue; error means the current operation failed or
  cannot continue.
- Timer/background atoms include the next observable time or handle when known.
- Do not use alarming decoration for routine queued work.
- Scheduled or background work must have a durable identifier in logs or machine events.

## Subagent atoms

Subagents are nested actors with their own lifecycle, not a second full transcript dumped
inline by default.

```text
◐ agent researcher  running
  ⎿ task: inspect parser edge cases

✓ agent researcher  pass  1m12s
  ⎿ found 3 relevant files
```

Rules:

- Show delegation, status, and returned summary. Expand inner details only on demand.
- Preserve parent/child relation with indentation or a `parent_id` in machine events.
- Do not expose hidden reasoning from subagents; summarize observable work and outputs.
- A failed subagent does not automatically mean the whole turn failed; roll up accurately.

## Reference compositions

These are examples of atoms combined into useful shapes. They are not normative templates.

Minimal streaming turn:

```text
▌ You
  Find the failing test and propose the smallest fix.

▌ Assistant
  ▸ Inspecting the failing test output and checking the smallest affected package.
  I found one failing test in `internal/cache`.
```

Tool call with bounded preview:

```text
◐ ⚙ shell  running
  ⎿ command: go test ./internal/cache

✗ ⚙ shell  fail  2.3s
  ⎿ exit: 1
  ⎿ cache_test.go:88: expected 0 entries, got 1
```

Background handoff:

```text
background: task queued · id=nightly-index
timer: next check at 23:00
```

## Good / bad cases

### Input draft

Good:

```text
❯ You  explain this error and suggest the smallest fix
```

Submitted transcript:

```text
▌ You
  explain this error and suggest the smallest fix
```

Bad:

```text
You: explain this er█
You: explain this error and suggest the smallest fix
```

Why bad: draft cursor motion leaked into transcript history.

### Multiline paste

Good:

```text
❯ You  review this function:
        ```go
        func cacheKey(user string) string {
          return strings.ToLower(user)
        }
        ```
```

Bad:

```text
❯ You  review this function:
func cacheKey(user string) string {
Assistant: I can help with that...
```

Why bad: paste was interpreted as submits before the user finished the draft.

### Thinking

Good:

```text
▸ USER.md might be in the memory store but not as a regular file. Let me check from my memory. I know it says:
│  - 老家在厦门（福建省）
│  - 喜欢吃北京烤鸭
│  - 喜欢香港迪士尼乐园
│  - 目前在北京
│
│  Let me check memory to see how USER.md is stored.
```

Bad:

```text
I am now thinking step by step about every hidden inference...
```

Why bad: it exposes hidden reasoning instead of summaries and observable actions.

### Tool use

Good:

```text
◐ ⚙ shell  running
  ⎿ command: go test ./internal/cache

✗ ⚙ shell  fail  2.3s
  ⎿ exit: 1
  ⎿ output: cache_test.go:88: expected 0 entries, got 1
```

Bad:

```text
Running shell...
<2,000 unbounded lines of raw output mixed into assistant prose>
```

Why bad: no stable labels, no bounded preview, and tool output pollutes the answer lane.

### Approval

Good:

```text
approval required
  title: Delete stale branches
  risk: high
  changes: 12 branches
  next: approve with y, deny with n

Approve? [y/N]
```

Bad:

```text
DELETE EVERYTHING? y/n
```

Why bad: no blast radius, no default clarity, no stable fields for a log or agent.

### Non-TTY

Good:

```text
Assistant: thinking started
Tool shell: running command="go test ./internal/cache"
Tool shell: fail exit=1 duration_ms=2300
Assistant: failing test is internal/cache TestEvict/expired
```

Bad:

```text
\x1b[?25l◐ ⚙ shell\r◓ ⚙ shell\r...
```

Why bad: cursor controls and spinner residue leaked into a log.

## Non-TTY and machine events

Off-TTY, CI, `TERM=dumb`, `NO_COLOR`, and `--json` remove live UI. Emit plain lines or
structured events with the same information.

Plain fallback:

```text
You: Find the failing test.
Assistant: thinking started
Tool shell: running command="go test ./internal/cache"
Tool shell: fail exit=1 duration_ms=2300
Assistant: I found one failing test in internal/cache.
```

For streaming machine mode, prefer NDJSON with stable event types:

```json
{"type":"turn.start","role":"user","message":"Find the failing test."}
{"type":"thinking.start","status":"running"}
{"type":"tool.start","tool_name":"shell","call_id":"c1","status":"running"}
{"type":"tool.end","tool_name":"shell","call_id":"c1","status":"fail","exit_code":1,"duration_ms":2300}
{"type":"message.delta","role":"assistant","text":"I found one failing test"}
{"type":"turn.end","role":"assistant","status":"pass"}
```

Useful common fields: `type`, `schema_version`, `role`, `status`, `message`, `text`,
`tool_name`, `call_id`, `parent_id`, `duration_ms`, `exit_code`, `items`, `next_steps`.
No ANSI, frames, cursor-control bytes, hidden OSC links, or spinner residue.

## Red flags

Stop if you're about to:

- require a full product-specific status bar/card as the generic Agent Chat design
- make color, glyph, indentation, or animation the only carrier of role/state
- leave thinking/tool spinners unresolved in the transcript
- show hidden chain-of-thought instead of summaries and observable actions
- let draft editing, deletion, or cursor motion leak into persisted logs
- hide a URL behind OSC 8 with no raw URL fallback
- dump unbounded tool output into assistant prose
- block for approval or selection in non-TTY/CI without a flag/default/failure path
- use hardcoded dark-theme colors that fail in light terminals
