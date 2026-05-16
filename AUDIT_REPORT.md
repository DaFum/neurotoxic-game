# Neurotoxic Codebase Audit Report — Remaining Items

Original audit had ~95 findings. Items that have been processed (fixed,
merged, integrated, or verified non-issue) have been removed from this file.
Items that were intentionally skipped retain a one-line reason.

## 1. DUPLICATES

### MED

- **MED** `src/utils/eventEngine.ts:91` vs `src/utils/gameStateUtils.ts:412`
  — `EventDelta` defined twice with divergent shapes. **SKIPPED** for now:
  shapes have meaningful structural divergence (required vs optional fields,
  divergent nested types) reflecting each module's invariants; merging risks
  behavior changes and exceeds the minimal-change scope of recent batches.
  Re-attempt with a dedicated PR that explicitly reconciles the two
  contracts.

## 2. ORPHANS / UNINTEGRATED CODE

### MED

- **MED** Locale `ui.json`: ~160 likely-unused keys (after excluding
  dynamically indexed `featureList.*`). Confirmed unused samples:
  `ui:milestones.high_harmony.reward`, `ui:arrival.harmonyTooLowToPerform`,
  `ui:brutalist.glitchPlaceholder`, `ui:button.sign`, `ui:bandhq.money`,
  `ui:bandhq.funds`, plus `chatter_labels.*`, stale `chatter.*` (msg1-3,
  random1), `rewards.*`, `terminal.*`, `leaderboard.*`, etc. Action:
  **DELETE** from EN+DE in lockstep. **PENDING**: needs careful per-key
  verification to avoid removing dynamically-indexed keys.

## 3. INCONSISTENCIES

### MED

- **MED** Remaining currency/format inconsistencies — toast-strings in
  `usePostGigHandlers.ts:166,257-258,330` and `useTravelLogic.ts:670,725,
  739,774,798,825` use `€` inside i18n template strings (`{{amount}}€`).
  These flow through `t()` so locale strings own sign/glyph placement, but
  they don't share the locale-aware `formatCurrency` formatter. **SKIPPED**
  with reason: changing the i18n template surface requires coordinated
  edits to `public/locales/{en,de}/*.json` and is broader than a typed code
  fix — best done in a dedicated locale-key PR alongside the §2 stale-key
  purge.

## 4. DEAD / UNREACHABLE CODE

### MED

- **MED** `src/types/migration-stubs.d.ts` — file name and contents suggest
  a completed migration. **SKIPPED**: the file still declares the `process`
  global and the `*.svg` module shim, both needed for Vite/`node:test`
  dual-compatibility. Contents are live; only the name is misleading.
  Consider renaming to `ambient.d.ts` in a follow-up.
- **MED** `src/hooks/minigames/minigameConstants.ts:7-8` — `GRID_WIDTH` /
  `GRID_HEIGHT` aliases superseded by `ROADIE_*` names. **SKIPPED**: tests
  in `tests/node/minigamesConstants.test.js` and
  `tests/ui/useRoadieLogic.test.jsx` import the aliases; removal requires
  test updates that exceed the minimal-change scope of recent batches.

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
