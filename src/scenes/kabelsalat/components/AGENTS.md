# src/scenes/kabelsalat/components - Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Keep plug/socket props aligned with kabelsalat state contracts.
- Visible labels and overlay text require i18n keys.
- Avoid widening socket or plug IDs to generic strings.

## Gotchas

- Component-only tests are insufficient for end flow; preserve scene-routing coverage when changing controls.
