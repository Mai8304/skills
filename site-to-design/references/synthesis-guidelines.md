# URL-to-DESIGN Synthesis Guidelines

Use this note when turning browser evidence into `DESIGN.md` prose and tokens.

## Evidence Priority

1. CSS variables exposed by the site.
2. Computed styles on visible, repeated components.
3. Screenshots across desktop and mobile.
4. DOM structure and semantic labels.
5. Design inference from repeated patterns.
6. External brand knowledge, only if clearly marked as not captured.

## Confirmed vs Inferred

Write confirmed facts as direct rules:

- "Primary buttons use `{colors.primary}` with 48px height."
- "The top navigation uses a white surface and bottom hairline."

Write inference as rationale:

- "The system appears to rely on photography for visual weight."
- "This suggests a marketplace density strategy rather than an editorial layout."

Do not present uncaptured products, states, or sub-brands as confirmed.

## Clustering Heuristics

- Map high-frequency brand colors to semantic tokens: `primary`, `canvas`, `ink`, `muted`, `hairline`, `surface-soft`, `error`.
- Use extracted CSS variable names when they are clear; normalize verbose internal names to shorter semantic names.
- Merge typography into 9-15 useful levels: display, title, body, label, caption, micro.
- Merge radius values into named scale tokens: `tiny`, `sm`, `md`, `lg`, `xl`, `pill`, `full`.
- Merge spacing into a practical scale; keep both micro and section values when visible.
- Treat shadows as prose unless the official schema grows an elevation token group.
- For components, put only official sub-tokens in YAML and describe detailed behavior in Markdown.

## Component Coverage

Look for:

- Top navigation and mobile navigation.
- Primary, secondary, text, icon, and pill buttons.
- Search bars and segmented filters.
- Cards, badges, list rows, media grids, and image treatments.
- Inputs, selects, date pickers, steppers, and form validation.
- Footer, legal bands, language/currency controls.
- Modals, drawers, sheets, scrims, and dropdowns.

Skip a component or mark it as a gap when it was not visible in captured pages.

## Writing Style

- Be precise with hex values and dimensions.
- Explain purpose and role, not just appearance.
- Avoid generic names like "blue" or "rounded"; use semantic names tied to function.
- Keep speculation out of YAML.
- Include a short source note when the document was generated from a limited URL set.
