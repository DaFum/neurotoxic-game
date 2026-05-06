# src/data/chatter - Agent Instructions

## Scope

Applies to `src/data/chatter/**`.

## Rules

- Chatter entries must use namespaced i18n keys and have EN/DE translations.
- Default scenes are `MENU`, `OVERWORLD`, `PREGIG`, and `POSTGIG`; add explicit conditions for `GIG`.
- Keep condition functions deterministic and explicitly typed when they inspect `GameState`.

## Gotchas

- Avoid broad fallback chatter in `GIG`; it can mask missing scene-specific conditions.
- Locale duplicate keys can silently shadow text. Run duplicate-key detection when touching locale JSON.
