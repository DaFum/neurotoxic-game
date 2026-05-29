# public/locales - Agent Instructions

- Keep EN and DE locale JSON keys in parity for any changed namespace.
- `i18next` runs with `keySeparator: false`; dot-delimited lookups must be flat JSON keys such as `"milestones.survive_1_week"`, not nested objects, unless the caller explicitly reads an object.
- Locale keys may be looked up dynamically; search the codebase for a prefix before deleting apparently-unused keys. Known dynamic prefixes: `chatter_labels.${scene}` in `src/components/ChatterOverlay.tsx`, `bandhq.${balanceKey}` in `src/ui/bandhq/CatalogTab.tsx`, and `featureList.*` from config arrays.
- Currency templates use a bare `{{amount}}` placeholder. Format the value before dispatch/render with `formatCurrency(value, i18n.language, signDisplay)`; do not hardcode `€` in locale JSON.
