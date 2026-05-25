---
name: i18n-consistency-checker
description: Diff en/ and de/ locale JSON files to surface missing or mismatched translation keys
user-invocable: false
---

For each namespace JSON in public/locales/en/, compare its keys against the corresponding public/locales/de/ file. Report:

1. Keys present in EN but missing in DE
2. Keys present in DE but missing in EN
3. Any keys with identical values in both locales (likely un-translated copy-pastes)

Use flat key traversal (dot-notation for nested objects). Output a concise diff summary grouped by namespace file.

If all namespaces are in sync, confirm that and note the count of verified keys per namespace.
