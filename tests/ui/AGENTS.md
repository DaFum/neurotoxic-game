# tests/ui - Agent Instructions

## Scope

Applies to `tests/ui/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Use Vitest and React Testing Library patterns consistent with neighboring UI tests.
- Validate rendered behavior and wiring, not reducer internals already covered in node tests.
- Keep mock props aligned with shared type contracts and prop optionality.
- Use typed helper builders for repeated render setups.

## Gotchas

- If PropTypes optionality changes, add fallback behavior coverage for missing props.
- Menu redesigns need assertions that legacy actions remain reachable.
- Kabelsalat tests must assert timeout-loss and fully wired win paths call `changeScene('GIG')`.
- Minigame completion overlays need fallback-timer and unmount-cleanup coverage.
