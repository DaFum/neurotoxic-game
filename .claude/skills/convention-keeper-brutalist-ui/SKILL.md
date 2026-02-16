---
name: convention-keeper-brutalist-ui
description: enforce brutalist UI design system. Trigger when creating or modifying UI components. Checks for correct colors, borders, shadows, and Tailwind v4 usage.
---

# Brutalist UI Convention Keeper

Enforce the strict "Brutalist" design system across the application.

## Core Rules

1.  **No Rounded Corners**: `rounded-none` always.
2.  **Thick Borders**: `border-2` or `border-4`.
3.  **Hard Shadows**: `shadow-[4px_4px_0px_var(--toxic-green)]`. No soft blurs.
4.  **Uppercasing**: Headers and buttons are typically `uppercase`.
5.  **Colors**: Use CSS variables via Tailwind v4 syntax.
    *   `bg-(--void-black)`
    *   `text-(--toxic-green)`
    *   `border-(--neon-pink)`

## Workflow

1.  **Check Styling**
    Inspect the component's class names.
    *   *Bad*: `rounded-lg`, `shadow-md`, `bg-black`, `text-[#00ff00]`
    *   *Good*: `rounded-none`, `shadow-none`, `bg-(--void-black)`, `text-(--toxic-green)`

2.  **Verify Components**
    Use shared components from `src/ui/shared/` instead of rebuilding primitives.
    *   `GlitchButton`
    *   `Panel` (if exists)

3.  **Review Imports**
    Order: React -> Third-party -> Internal -> Assets.

## Tailwind v4 Syntax

*   **Variables**: Use parentheses `bg-(--var-name)` instead of `bg-[var(--var-name)]`.
*   **Arbitrary Values**: `w-[500px]` is allowed but prefer spacing scale.

## Example

**Input**: "Create a modal for the settings."

**Incorrect Output**:
```jsx
<div className="rounded-xl shadow-lg bg-gray-900 p-4">
  <h2 className="text-xl font-bold">Settings</h2>
</div>
```

**Correct Output**:
```jsx
<div className="border-2 border-(--neon-pink) bg-(--void-black) p-4 shadow-[4px_4px_0px_var(--neon-pink)]">
  <h2 className="text-2xl uppercase tracking-widest text-(--neon-pink)">Settings</h2>
</div>
```
