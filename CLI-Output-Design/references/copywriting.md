# Copywriting

**Lenses:** Accurate and Human-usable; Agent-usable too, because stable wording is what an
agent reads off the logs.

## Principle

Say specific, true things. The most important rule is for failure: **an error states what
happened, why, and how to fix it** — and the remedy goes in an explicit `Next:` block, not
buried in a sentence. clig.dev: "Catch errors and rewrite them for humans … guiding them
in the right direction," and "put the most important information at the end of the output."

Voice is calm and instructional: the program is a competent guide, not a panicking servant.
Don't apologize — instruct.

## Do / Don't

**Do**

- Name the concrete thing: *which* file, *which* value, *which* command.
- Give every error a cause and a next action. If the error is unexpected, add debug/
  traceback info and how to file a bug (clig.dev).
- Be brief on success; **if you change state, tell the user what changed** (clig.dev).
- Keep tense and the status vocabulary consistent across the whole CLI.
- Lower-case, concise messages without trailing periods for short status lines (Heroku style).

**Don't**

- Ship vague text: `failed`, `done`, `error`, `something went wrong`.
- Dump jargon or a raw stack trace as the whole message.
- Apologize ("Sorry, …") instead of explaining and instructing.
- Mix synonyms (`ok`/`done`/`success`) for one status — see the vocabulary below.

## Real example — rewrite a bad error

Captured (`gh pr list` outside a repo, 2026-06-11):

```
failed to run git: fatal: not a git repository (or any of the parent directories): .git
```

It names *what* failed but offers no *why-it-matters* or *next step*. Rewritten to the
template:

```
✗ Not a git repository

  Reason: gh needs a repo to list pull requests, and the current
          directory isn't inside one.
  Next:
    cd into a cloned repo, or run  gh repo clone <owner>/<repo>
```

`gh auth status` (captured) is the positive case: it states the live fact precisely —
`✓ Logged in to github.com account Mai8304` — concrete account, no fluff.

## Cheat-sheet

**Error / message template** (contextual — default to the one-liner; expand only when there
is a concrete remedy):

```
one-liner:   ✗ error: <what failed, concretely>

with remedy: ✗ <what failed, concretely>

               Reason: <why>
               Next:
                 <exact command or action>
```

Severity prefixes, all three signals redundant (color in `color.md`, glyphs in `symbols.md`):

```
✗ error: …      (red)        ⚠ warning: …   (yellow)
✓ <message>     (green; success is brief, usually no label word)
→ …             (in progress)              note: …   (dim)
```

**Status vocabulary** — one canonical set, shared with `status-and-progress.md`:

```
running   pass   fail   warn   skip   changed   unchanged
```

**Humanized values** (consistency matters more than precision):

- durations `1.2s`, `3m 04s`, `2h` — not `124.3s`
- relative time `2h ago`, `3 days ago`, `just now` (expose the absolute in `--json`)
- byte sizes `1.2 MB`, `940 KB` — pick decimal or binary and document it
- counts: separators for large numbers (`1,284`); pluralize correctly (`1 file`, `2 files`)

(Alignment of these columns lives in `layout.md`; structured equivalents in
`agent-readable-output.md`.)
