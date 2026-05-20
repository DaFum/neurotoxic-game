# src/data/chatter - Agent Instructions

- Avoid broad fallback chatter in `GIG`; it can mask missing scene-specific conditions.
- Locale duplicate keys can silently shadow text. Run duplicate-key detection when touching locale JSON.
- `CHATTER_DB` entries must never use `weight: 0` — `tests/node/chatterWeights.test.js` rejects them (dead in the weighted picker). To disable a line, remove it or gate it with a `condition`.
- EN `chatter.json` strings must not leak `{{var}}` or `${var}` placeholders, raw scene names (`ANY`/`OVERWORLD`/…), or duplicate "at At" segments. When a template takes a venue placeholder, do NOT prepend "at" — venue names already contain it. Regex-scanned by `tests/node/chatterLocalization.test.js`.
