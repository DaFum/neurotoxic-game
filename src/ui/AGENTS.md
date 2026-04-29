# src/ui - Agent Instructions

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
