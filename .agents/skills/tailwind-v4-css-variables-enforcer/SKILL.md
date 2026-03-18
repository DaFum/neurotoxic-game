---
name: tailwind-v4-css-variables-enforcer
description: enforce Tailwind CSS v4 syntax and project-specific CSS variables. Trigger when writing styles, reviewing UI code, or fixing design inconsistencies. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Enforce Tailwind v4 token usage, variable correctness, and forbidden pattern detection.
---
# Tailwind v4 Enforcer

Ensure all styles use the correct Tailwind v4 syntax and design tokens.

## Rules

1.  **Syntax**: Colors are registered in `src/index.css` inside `@theme` with the `--color-` prefix and consumed as native Tailwind utilities (`bg-void-black`, `text-toxic-green`, `border-blood-red/60`). Do NOT use `bg-[var(--variable)]`. Non-color tokens in `@theme` that don't match a Tailwind namespace (z-index `--z-*`, etc.) still require the arbitrary value syntax: `z-(--z-crt)`.
2.  **Colors**:
    - **NEVER** use hex codes (`#000`, `#ff00ff`).
    - **NEVER** use default palette (`bg-red-500`, `text-blue-200`).
    - **ALWAYS** use `@theme` color tokens defined in `src/index.css` (e.g., `bg-void-black`, `text-toxic-green`).
    - In inline `var()` references (style attributes, SVG props), use the `--color-` prefix: `var(--color-toxic-green)`.
3.  **Imports**: Use `@import "tailwindcss"`. No `@tailwind` directives.

## Workflow

1.  **Scan for Violations**
    - Search for `#` (hex codes) in className strings.
    - Look for `rgb(`, `hsl(` in className strings.
    - Check for `bg-[var(` (old bracket syntax).
    - Detect `bg-(--color-` or `text-(--color-` patterns (should be native tokens, not arbitrary values).

2.  **Map to Tokens**
    - `#000000` -> `bg-void-black` / `var(--color-void-black)`
    - `#00ff00` -> `text-toxic-green` / `var(--color-toxic-green)`
    - `#ff00ff` -> `text-mood-pink` / `var(--color-mood-pink)`

3.  **Fix Syntax**
    - `bg-[var(--void-black)]` -> `bg-void-black`
    - `bg-(--void-black)` -> `bg-void-black`
    - `text-(--toxic-green)` -> `text-toxic-green`
    - `w-[var(--width)]` -> `w-(--width)` (non-color arbitrary values unchanged)

## Example

**Input**: "Style this button."

**Bad**:

```jsx
<button className="bg-red-500 text-white rounded p-2">
```

**Good**:

```jsx
<button className="bg-mood-pink text-void-black rounded-none p-2 border-2 border-void-black">
```

**Output**:
"Converted styles to @theme token syntax. Replaced `red-500` with `mood-pink` token."


_Skill sync: compatible with React 19.2.4 / Vite 8.0.0 baseline as of 2026-03-18._
