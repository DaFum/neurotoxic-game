# src/data/chatter - Agent Instructions

## Data

- Avoid broad fallback chatter in `GIG`; it can mask missing scene-specific conditions.
- `CHATTER_DB` entries must never use `weight: 0` — `tests/node/chatterWeights.test.js` rejects them (dead in the weighted picker). To disable a line, remove it or gate it with a `condition`.

## Locale JSON

- Locale duplicate keys silently shadow earlier text. When modifying locale JSON, run duplicate-key detection; if duplicates are reported, merge or remove them so each key appears once.
- EN `chatter.json` is regex-scanned by `tests/node/chatterLocalization.test.js`; strings must not contain:
  1. unresolved `{{var}}` or `${var}` placeholders;
  2. raw scene names such as `ANY`, `OVERWORLD`, `PREGIG`, `GIG`, or `POSTGIG`;
  3. duplicate "at At" segments.
- When an EN chatter template takes a venue placeholder, do NOT prepend "at" — venue names already contain it.
- DE `chatter.json` must keep key parity with EN; `tests/node/chatterLocalization.test.js` checks this.
