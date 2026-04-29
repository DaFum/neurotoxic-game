# src/data/chatter - Agent Instructions

## Agent Purpose & Limitations

Agents in `src/data/chatter/**` maintain deterministic chatter metadata, scene targeting, and i18n key coverage. They are not a substitute for human narrative review, must not perform privileged operations, and may miss tone or hallucination risks without locale checks. Use this file for chatter data changes; use broader event or UI docs for runtime behavior.

## Scope

Applies to `src/data/chatter/**`.

## Rules

- Chatter entries must use namespaced i18n keys and have EN/DE translations.
- Default scenes are `MENU`, `OVERWORLD`, `PREGIG`, and `POSTGIG`; add explicit conditions for `GIG`.
- Keep condition functions deterministic and explicitly typed when they inspect `GameState`.

## Gotchas

- Avoid broad fallback chatter in `GIG`; it can mask missing scene-specific conditions.
- Locale duplicate keys can silently shadow text. Run duplicate-key detection when touching locale JSON.
