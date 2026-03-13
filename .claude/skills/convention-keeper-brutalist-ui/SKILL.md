---
name: convention-keeper-brutalist-ui
description: enforce brutalist UI design system. Trigger when creating or modifying UI components. Checks for correct colors, borders, shadows, and Tailwind v4 usage.
---

# Brutalist UI Convention Keeper

Enforce the strict "Brutalist" design system across the application.

## Core Rules

1.  **No Rounded Corners**: `rounded-none` always.
2.  **Thick Borders**: `border-2` or `border-4`.
3.  **Hard Shadows**: `shadow-[4px_4px_0px_var(--color-toxic-green)]`. No soft blurs.
4.  **Uppercasing**: Headers and buttons are typically `uppercase`.
5.  **Colors**: Use `@theme` native token utilities from `src/index.css`.
    - `bg-void-black`
    - `text-toxic-green`
    - `border-blood-red` (for borders) or `var(--color-toxic-green)` (for inline shadows)

## Workflow

1.  **Check Styling**
    Inspect the component's class names.
    - _Bad_: `rounded-lg`, `shadow-md`, `bg-black`, `text-[#00ff00]`
    - _Good_: `rounded-none`, `shadow-none`, `bg-void-black`, `text-toxic-green`

2.  **Verify Components**
    Use shared components from `src/ui/shared/` instead of rebuilding primitives.
    - `GlitchButton`
    - `Panel` (if exists)

3.  **Review Imports**
    Order: React -> Third-party -> Internal -> Assets.

## Tailwind v4 Syntax

- **Color Tokens**: Colors registered in `@theme` use native utilities: `bg-void-black`, `text-toxic-green`. Do NOT use `bg-[var(--var-name)]`.
- **Non-Color Tokens**: Non-color tokens in `@theme` that don't match a Tailwind namespace (z-index `--z-*`, etc.) still require arbitrary value syntax: `z-(--z-crt)`.
- **Arbitrary Values**: `w-[500px]` is allowed but prefer spacing scale.

## Example

**Input**: "Create a modal for the settings."

**Incorrect Output**:

```jsx
<div className='rounded-xl shadow-lg bg-gray-900 p-4'>
  <h2 className='text-xl font-bold'>Settings</h2>
</div>
```

**Correct Output**:

```jsx
<div className='border-2 border-blood-red bg-void-black p-4 shadow-[4px_4px_0px_var(--color-blood-red)]'>
  <h2 className='text-2xl uppercase tracking-widest text-blood-red'>
    Settings
  </h2>
</div>
```

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
