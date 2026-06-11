---
name: site-to-design
description: Use when a user wants to generate, extract, audit, or refine a Google DESIGN.md file from one or more ordinary public website URLs rather than from a Stitch project.
---

# Site to DESIGN.md

## Overview

Generate a Google `DESIGN.md` from public web pages by collecting browser evidence first, then synthesizing conservative design tokens and prose that pass the official `@google/design.md` checks.

This is the URL/Playwright path. Use the separate `design-md` skill when the source is a Google Stitch project.

## Required Workflow

1. **Gather pages**
   - Use the user-provided URL list as the source of truth.
   - If only one URL is given and the user asked for a site-wide system, add up to 3 same-origin representative links only when they are discoverable without login.
   - Do not bypass paywalls, captchas, or authentication. Ask for screenshots or HTML when pages are blocked.

2. **Collect evidence with Playwright**
   - Prefer system Chrome: `channel: "chrome"`.
   - Use desktop and mobile viewports unless the user asks otherwise.
   - Use `scripts/extract-url-design-evidence.js` when possible.
   - Create evidence in a temporary or task-local folder. The normal final response should only link to `DESIGN.md`; expose evidence files only when the user asks.

3. **Extract and cluster**
   - Prefer real CSS variables and computed styles over inferred values.
   - Cluster colors, typography, spacing, radii, shadows, image treatments, and component candidates.
   - Distinguish **confirmed** facts from **inferred** design rationale. See `references/synthesis-guidelines.md`.

4. **Write `DESIGN.md`**
   - Include YAML front matter with `version`, `name`, optional `description`, `colors`, `typography`, `rounded`, `spacing`, and `components`.
   - Include Markdown sections in official order: `Overview`, `Colors`, `Typography`, `Layout`, `Elevation & Depth`, `Shapes`, `Components`, `Do's and Don'ts`.
   - Read `references/design-md-spec-notes.md` before writing or repairing the file.

5. **Validate and repair**
   - Run:
     ```bash
     npx @google/design.md lint DESIGN.md --format=json
     npx @google/design.md export --format tailwind DESIGN.md >/tmp/design-md-tailwind.json
     npx @google/design.md export --format dtcg DESIGN.md >/tmp/design-md-dtcg.json
     ```
   - Repair schema errors and broken token references before finishing.
   - Do not change extracted brand colors merely to silence contrast warnings. Report real values; mention accessibility warnings only when relevant.

## Evidence Script

Run from a project or scratch directory that has Playwright installed:

```bash
npm install --save-dev @playwright/test --ignore-scripts
node ~/.codex/skills/site-to-design/scripts/extract-url-design-evidence.js \
  --out .design-md-evidence \
  --channel chrome \
  https://example.com
```

The script writes `evidence.json` and screenshots under `--out`. If screenshots should not be retained, pass `--no-screenshots`.

## YAML Guardrails

- Use `components`, never `component`, in token paths.
- Component YAML supports only: `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`.
- Put unsupported details such as `shadow`, `borderColor`, `gap`, `imageRadius`, hover transitions, and responsive behavior in Markdown prose.
- Token references must use `{path.to.token}` and point at existing YAML values.
- Keep `colors.primary` defined for every generated design system.

## Output Policy

Default final response:

- Link to the generated `DESIGN.md`.
- Include lint summary and note if export checks passed.
- Do not surface screenshots, HTML snapshots, or evidence JSON unless the user requested them.

If evidence is requested, link the exact artifact files and explain which observations are confirmed vs inferred.
