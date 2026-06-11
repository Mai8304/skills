# DESIGN.md Spec Notes

Use this note when generating or repairing Google `DESIGN.md` files.

## File Shape

`DESIGN.md` has two parts:

1. YAML front matter for machine-readable tokens.
2. Markdown body for human and agent-facing rationale.

Minimum useful front matter:

```yaml
---
version: alpha
name: Brand Name
description: "Source and scope."
colors:
  primary: "#000000"
typography:
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 8px
spacing:
  md: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    height: "48px"
---
```

## Token Groups

- `colors`: map of token name to SRGB hex string beginning with `#`.
- `typography`: map to objects with `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, optional `letterSpacing`, `fontFeature`, `fontVariation`.
- `rounded`: named dimensions such as `4px`, `8px`, `9999px`.
- `spacing`: named dimensions or unitless numbers.
- `components`: component token objects.

Valid component sub-tokens are only:

```text
backgroundColor
textColor
typography
rounded
padding
size
height
width
```

Keep other implementation details in Markdown prose.

## Section Order

Use `##` headings in this order when relevant:

1. `Overview`
2. `Colors`
3. `Typography`
4. `Layout`
5. `Elevation & Depth` or `Elevation`
6. `Shapes`
7. `Components`
8. `Do's and Don'ts`

Unknown sections may be preserved, but keep the core sections in order.

## Common Lint Failures

- Missing YAML front matter.
- `components` written as `component`.
- Broken references such as `{colors.accent}` with no matching YAML token.
- Unsupported component sub-tokens like `borderColor`, `shadow`, `gap`, `imageRadius`.
- Colors not written as hex.
- Typography dimensions missing `px`, `em`, or `rem` where a dimension is required.

Contrast warnings are quality findings. In extraction mode, keep the observed brand color and document the warning instead of changing brand identity.
