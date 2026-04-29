# src/ui - Agent Instructions

## Purpose and Limits

UI agents maintain presentation behavior under the Scope below: localized visible text, tokenized styling, shared prop contracts, and composed event handlers. They must not introduce unlocalized copy, hardcoded colors, component-local type clones, or wrappers that swallow consumer handlers/PropTypes arguments. Use this guide for shared UI and UI-adjacent changes; use scene or reducer docs when state transitions or gameplay logic are the primary concern.

## Scope

Applies to `src/ui/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Use i18n keys for visible UI text and update EN/DE together.
- Use CSS variables for colors and Tailwind v4 token syntax for non-color tokens.
- Keep shared UI contracts imported from `src/types/**`; do not create component-local type clones.
- Include `t` in dependencies for callbacks/effects that use it.
- Compose consumer event handlers when wrapping controls.

## Gotchas

- PropTypes wrappers must forward the full validator argument list, including the secret, to preserve actionable dev warnings.
- Do not pass non-string values into `t(...)`; fallback to explicit unknown-item keys for malformed labels.
