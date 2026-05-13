# src/ui - Agent Instructions

## Scope

Applies to `src/ui/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Use i18n keys for visible UI text and update EN/DE together.
- Use CSS variables for colors and Tailwind v4 token syntax for non-color tokens.
- Design UI extensions with `contentClassName` forwarding to ensure compliance with Brutalist flexbox layouts.
- Keep shared UI contracts imported from `src/types/**`; do not create component-local type clones.
- Include `t` in dependencies for callbacks/effects that use it.
- Compose consumer event handlers when wrapping controls.

## Gotchas

- Wrapper components must forward relevant event handlers, refs-as-props, ARIA attributes, and disabled/focus behavior.
- Do not pass non-string values into `t(...)`; fallback to explicit unknown-item keys for malformed labels.
