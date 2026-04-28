# src/hooks/rhythmGame — Agent Instructions

## Scope

Applies to `src/hooks/rhythmGame/**`.

## Rhythm Hook Rules

- Keep hooks orchestration-focused; timing/math helpers should live in `src/utils/rhythmGameLoopUtils.ts`.
- Preserve audio clock consistency with shared audio engine time sources.

## Domain Gotchas

- Sparse note/frame arrays must be guarded under `noUncheckedIndexedAccess` (`if (!note) continue`) instead of assuming dense indexing.
- Score/accuracy math must preserve valid zero values (`0`) using nullish coalescing (`??`) rather than truthy checks.

## Recent Findings (2026-04)

- Many rhythm regressions come from duplicate timing fallback logic split across hooks/utilities; centralize fallback behavior and keep hook wrappers thin.
