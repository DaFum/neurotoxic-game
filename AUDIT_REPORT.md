# Neurotoxic Codebase Audit Report — Remaining Items

Original audit had ~95 findings. Items that have been processed (fixed,
merged, integrated, or verified non-issue) have been removed from this file.
Items that were intentionally skipped retain a one-line reason.

## 4. DEAD / UNREACHABLE CODE

### LOW

- **LOW** `src/schemas/crisis.json` — header says authoritative validation
  is `validateCrisisEvent` in `eventValidator`; no code consumes the JSON
  schema directly. **SKIPPED**: the JSON schema is documentary and
  `validateCrisisEvent` now runs at startup via the §1 integration of
  `validateGameEvent`. Leaving the schema as a developer reference is
  consistent with that role; deletion would lose the human-readable doc.
- **LOW** `src/utils/imageGen.ts:4` — hardcoded API key (gitleaks-allowed).
  **NOTE ONLY** per original audit.

## 5. MISSING INTEGRATION

### LOW

- **LOW** `GAME_PHASES.PRACTICE` is not in `SCENES_WITHOUT_HUD` in
  `App.tsx:23-33`. **CONFIRMED INTENTIONAL**: practice mode mirrors a gig
  session (HUD-on) — same treatment as `GAME_PHASES.GIG`, which is also
  outside the set. No change needed.

## 6. NOTES

All HIGH-severity findings from the original audit have been processed.
The original §6 ("Headline metrics", "Top-priority fixes", "Highest-leverage
cleanup batches", "Audit confidence notes") is omitted from this trimmed
report — see the PR history on `claude/integrate-audit-report-MhGWV` for
the implementation timeline and per-commit rationale.
