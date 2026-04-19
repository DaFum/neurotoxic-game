# src/assets — Agent Instructions

## Scope

Applies to `src/assets/**`.

## Asset Rules

- Keep asset references stable and consistent with loaders/import maps.
- Do not change asset naming/paths casually; test fixtures and loaders may depend on exact paths.
- Prefer additive asset updates over replacing/removing existing files in migration PRs.

## Migration Rules

- If asset path conventions change, update all loaders/tests in the same PR.

## Nested TypeScript Hinweise

- Asset-Metadaten nur mit engen Typen erweitern; keine untypisierten Zusatzfelder in Loader-Pfaden einschleusen.
- Bei Pfad-/Schema-Änderungen Typen der Import-Maps und zugehörige Tests in derselben Änderung anpassen.
