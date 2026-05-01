# src/scenes/credits - Agent Instructions

## Scope

Applies to `src/scenes/credits/**`.

## Agent purpose

Credits agents maintain static credits presentation: composing header/entry/footer blocks, preserving deterministic ordering, and keeping copy/layout changes scoped to credit components.

## Limitations

- No async fetches or randomized credit ordering.
- No route-level scene state logic inside credit row components.
- Follow parent `src/scenes/AGENTS.md` for scene routing and i18n requirements.

## When to use

Use this scope when editing credit copy/layout or header/entry/footer composition. Use parent scene guidance when changing scene transitions, callback wiring, or cross-scene routing behavior.

## Gotchas

- Credit rows are rendered via dedicated entry/header/footer components; keep ordering/layout concerns in those components instead of introducing route-level state logic.
- Keep credits static and deterministic; avoid async fetches or randomized order that can break snapshot-style UI tests.
