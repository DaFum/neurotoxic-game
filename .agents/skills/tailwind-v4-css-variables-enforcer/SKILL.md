---
name: tailwind-v4-css-variables-enforcer
description: enforce Tailwind CSS v4 syntax and project-specific CSS variables. Trigger when writing styles, reviewing UI code, or fixing design inconsistencies.
---

# Tailwind v4 Enforcer

Ensure all styles use the correct Tailwind v4 syntax and design tokens.

## Rules

1.  **Syntax**: Use `bg-(--variable)` instead of `bg-[var(--variable)]`.
2.  **Colors**:
    - **NEVER** use hex codes (`#000`, `#ff00ff`).
    - **NEVER** use default palette (`bg-red-500`, `text-blue-200`).
    - **ALWAYS** use project variables defined in `index.css` (e.g., `--toxic-green`, `--void-black`).
3.  **Imports**: Use `@import "tailwindcss"`. No `@tailwind` directives.

## Workflow

1.  **Scan for Violations**
    - Grep for `#` (hex codes).
    - Grep for `rgb(`, `hsl(`.
    - Grep for `bg-[var(`.

2.  **Map to Tokens**
    - `#000000` -> `var(--void-black)`
    - `#00ff00` -> `var(--toxic-green)`
    - `#ff00ff` -> `var(--mood-pink)`

3.  **Fix Syntax**
    - `w-[var(--width)]` -> `w-(--width)`
    - `bg-[var(--color)]` -> `bg-(--color)`

## Example

**Input**: "Style this button."

**Bad**:

```jsx
<button className="bg-red-500 text-white rounded p-2">
```

**Good**:

```jsx
<button className="bg-(--mood-pink) text-(--void-black) rounded-none p-2 border-2 border-(--void-black)">
```

**Output**:
"Converted styles to v4 syntax. Replaced `red-500` with `--mood-pink`."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
