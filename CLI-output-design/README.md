# CLI Output Design

**Language / 语言:** English | [中文](./README.zh.md)

Make command-line output clear, trustworthy, and easy to act on.

This skill helps you design, review, or improve what a CLI prints in the terminal. It focuses
on the user's experience: they should quickly understand what happened, what changed, what is
still running, what failed, and what to do next.

It is useful for product CLIs, developer tools, agents, deployment tools, test runners,
diagnostic commands, and any terminal workflow where confusing output slows people down.

## How to Use

### 1. Install

Install this directory from GitHub:

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --url https://github.com/Mai8304/skills/tree/main/CLI-output-design
```

Restart your agent environment after installation so the new capability can be discovered.

### 2. Ask for Output Design Help

Use it when you are creating or improving terminal output:

```text
Use $cli-output-design to review this command output and make it easier to understand.
```

You can also provide a screenshot, copied terminal text, or a description of the command:

```text
Use $cli-output-design to redesign the output for a deploy command.
It should show progress, changed resources, failures, and the next action clearly.
```

### 3. Share the User Situation

The best results come from a little context:

- Who is reading the output: first-time users, daily operators, developers, support teams, or agents.
- Where it appears: interactive terminal, CI log, redirected file, JSON mode, or a narrow window.
- What the user needs to decide after reading it.
- Which outputs are most important: success, failure, progress, empty state, warning, or summary.

## What This Skill Helps With

- **Clear status:** make running, passed, failed, warning, skipped, changed, and unchanged states easy to scan.
- **Progress that feels reliable:** show long-running work without fake percentages or stuck spinners.
- **Helpful errors:** explain what happened, why it matters, and the next action.
- **Readable layouts:** organize tables, summaries, checklists, logs, diffs, and result blocks.
- **Calm visual design:** use color and symbols only when they add meaning, not decoration.
- **Copy-friendly output:** keep commands, URLs, file paths, and IDs easy to copy.
- **Automation-friendly output:** keep `--json`, pipes, and CI logs clean and predictable.
- **Accessible fallbacks:** support no color, plain text, ASCII-only terminals, and narrow screens.

## Default Output

When used on a CLI design task, the skill can produce:

- A revised terminal output example.
- A before-and-after comparison.
- Suggested wording for success, warning, error, and empty states.
- A compact status vocabulary for the whole CLI.
- Guidance for progress indicators, tables, logs, and summaries.
- Recommendations for `stdout`, `stderr`, `--json`, and non-interactive environments.
- A pre-ship checklist for checking the output before release.

The goal is not to make the terminal look fancy. The goal is to make the CLI feel dependable:
accurate first, easy to read second, automation-friendly third, and visually calm throughout.

## Experience Principles

### Lead with the result

Users should not have to read a wall of logs to know whether the command worked. Put the
result, blocker, or current state where it can be seen immediately.

### Make failure actionable

Good errors do not stop at "failed." They name the cause and give a concrete next step.

```text
✗ Config file not found

  Reason: the command needs a local config before it can deploy.
  Next:
    mycli config init
```

### Keep output useful without decoration

Color, symbols, and animation should help people scan faster, but the same information must
still be available without them. This matters in pipes, CI logs, screen readers, and terminals
that do not support color or Unicode.

### Treat machine output as a product surface

If users or agents rely on `--json`, keep it stable, clean, and free of prose, spinners, and
ANSI styling. Human progress and diagnostics should not pollute data streams.

## Good Fit

Use this skill for:

- Designing the first version of a command's output.
- Reviewing confusing or noisy CLI output.
- Improving error messages and next-step guidance.
- Making progress indicators honest and complete.
- Preparing output for CI, scripts, or AI agents.
- Creating a consistent style across a CLI product.

This skill is not about choosing command names, flags, or interactive wizard flows. It focuses
on what the command prints after the user runs it.

## Pre-Ship Questions

Before shipping CLI output, check:

- Can a user tell the result in a few seconds?
- Does every failure include a cause and a next action?
- Is the same status vocabulary used everywhere?
- Are progress indicators honest and resolved to a final state?
- Does piped output stay clean?
- Is `--json` valid data only?
- Does the output still work with `NO_COLOR`, `TERM=dumb`, CI, and narrow terminals?
