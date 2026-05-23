# Neurotoxic Game Codebase Audit Report

## 1. DUPLICATES

*(No high-priority duplicates found within scope.)*

## 2. ORPHANED / UNINTEGRATED SYMBOLS

*(All originally reported orphans were either false positives or safely integrated internally within their respective modules.)*

## 3. INCONSISTENCIES

*(No actionable inconsistencies found. Previous findings regarding fallthrough, colors, and falsy preservation were either intentional, already fixed, or explicitly allowed by the project's logic and guidelines.)*

## 4. DEAD / UNREACHABLE

### Unreachable Reducer Exports (Exported for Tests)
**Severity:** LOW
**Locations:**
- `src/context/reducers/questReducer.ts:72` - `handleFailQuests`
- `src/context/reducers/bandReducer.ts:16` - `handleUpdateBand`
- `src/context/reducers/bandReducer.ts:62` - `handleUnlockTrait`
- `src/context/reducers/bandReducer.ts:78` - `handleConsumeItem`
- `src/context/reducers/bandReducer.ts:101` - `handleUseContraband`
- `src/context/reducers/bandReducer.ts:124` - `handleToggleNeuroDecimator`
**Description:** These reducer handlers are exported but only used internally within their own module's switch statement (or not at all for `handleFailQuests`). However, they are used by `tests/node/bandReducer.test.js` and `bandReducer.contraband.test.js` - this is the "exported for tests" pattern.
**Recommended Action:** Leave alone.

## 5. MISSING INTEGRATION

*(No actionable missing integrations found. Previous findings regarding Contraband, Roadie minigame, and Gig effects were false positives as they are properly integrated into the runtime paths.)*
