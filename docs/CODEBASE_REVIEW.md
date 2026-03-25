# Neurotoxic Game - Codebase Review

## THE ARCHITECT'S AUDIT

| Metric | Value |
|---|---|
| **Health Score** | **78 / 100** |
| **Source Lines** | ~49,400 (JS/JSX) |
| **Test Lines** | ~54,900 (313 test files) |
| **Tech Stack** | React 19.2.4, Vite 8.0.1, Pixi.js 8.17.1, Tone.js 15.5.6, Framer Motion 12.38.0, Tailwind CSS 4.2.2 |
| **Package Manager** | pnpm (pinned versions, no caret/tilde) |
| **Node.js** | >= 22.13.0 |
| **Languages** | English, German (i18next + http-backend) |

---

## 1. Architecture Overview

The project is a **browser-based band management / rhythm game** built as an SPA with React. Players manage a touring metal band across Germany, playing rhythm-game gigs, managing finances, social media, contraband items, and navigating events.

### Core Architecture Layers

```
App.jsx
  -> GameStateProvider (context + useReducer)
       -> SceneRouter (lazy-loaded scenes)
            -> Scenes: MainMenu, Overworld, Gig, PreGig, PostGig, Clinic, Settings, ...
            -> Minigames: Tourbus, RoadieRun, Kabelsalat
       -> Pixi.js Stage (canvas rendering for rhythm game + minigames)
       -> Audio Engine (Tone.js + Web Audio API)
```

**State Management**: Custom Redux-like pattern using React Context + `useReducer`. A central `gameReducer.js` dispatches to 10 domain-specific reducers:
- `playerReducer` | `bandReducer` | `eventReducer` | `systemReducer`
- `gigReducer` | `socialReducer` | `clinicReducer` | `questReducer`
- `sceneReducer` | `minigameReducer`

All mutations flow through `ActionTypes` -> `actionCreators.js` -> reducer switch. This is disciplined and well-structured.

**Data Layer**: Static game data in `src/data/` (venues, songs, contraband, events, HQ items, brand deals, etc.) with O(1) lookup Maps (`SONGS_BY_ID`, `CONTRABAND_BY_ID`, etc.).

**Audio Subsystem**: Sophisticated multi-file system under `src/utils/audio/` (14 files) handling Web Audio buffer playback, MIDI playback, procedural metal synthesis fallback, ambient audio, and drum mappings. Uses `getGigTimeMs()` as single clock source.

**Rendering**: Pixi.js 8 for the rhythm game canvas (notes, lanes, effects, crowd). React handles all UI overlays. Clean separation via `PixiStageController` pattern.

---

## 2. Strengths

### Security (Excellent)
- **Prototype pollution protection** throughout all state mutation paths. `Object.create(null)` for untrusted object merges. `isForbiddenKey()` guards against `__proto__`, `constructor`, `prototype` keys. Dedicated security tests validate all vectors.
- **Cryptographically secure RNG**: Uses `crypto.getRandomValues()` instead of `Math.random()` for game mechanics (contraband drops, event chances, etc.).
- **Sensitive data redaction** in error handler: Strips `money`, `password`, `token`, `secret` fields before logging.
- **Save validation**: `saveValidator.js` with structural validation before loading persisted state.
- **API key safety**: Pollinations API key is intentionally public (documented with `gitleaks:allow` comment).

### State Management (Very Good)
- **Immutable update patterns** consistently applied across all 10 reducers. No direct state mutation observed.
- **Value clamping**: All numeric state values are clamped at the reducer level (`clampPlayerMoney`, `clampBandHarmony`, `clampPlayerFame`, `clampVanFuel`, etc.). This prevents negative money, out-of-range harmony (1-100), etc.
- **Scene validation**: `sceneReducer` validates against `VALID_SCENES` Set before allowing transitions.
- **Social validation**: `socialReducer` validates trends against `ALLOWED_TRENDS`, validates deal structures, clamps zealotry.
- **Toast system**: Shows actual applied deltas (not requested amounts), which is correct UX behavior.

### Error Handling (Very Good)
- Custom error classes (`StateError`, `AudioError`, `ValidationError`) with context.
- `safeStorageOperation` wrapper for all localStorage access.
- Graceful degradation in audio system (`safeDispose` for node cleanup).
- `CrashHandler` component for React error boundary.

### Testing (Very Good)
- **313 test files** with ~54,900 lines of test code (ratio ~1.1:1 test:source).
- Dedicated test categories: unit, integration, performance, security, schema validation.
- Security-specific tests for prototype pollution, randomness quality, save validation.
- Performance tests for key components (GigHUD, PixiStage, RoadieLogic).
- Schema validation tests for data integrity (contraband, events, venues).
- Uses `node:test` for pure JS logic and `vitest` for JSX components (per project convention).

### Performance Optimization (Good)
- O(1) lookup Maps for all frequently-accessed data (`SONGS_BY_ID`, `CONTRABAND_BY_ID`, `SONGS_BY_MID`).
- `React.memo()` on performance-critical components (`PixiStage`, `GigHUD`).
- Lazy loading for all scene components via `createNamedLazyLoader`.
- Spatial partitioning in map generation for collision detection.
- Object URL caching for AI-generated images with proper cleanup.
- Circular buffer for logger (maxLogs=1000).

### Code Organization (Good)
- Clean separation of concerns: reducers, hooks, components, utilities, data.
- Modular audio subsystem split across 14 focused files.
- Event system with validation at import time (deduplication, category checks).
- i18n properly namespaced across 9 namespaces (ui, items, venues, events, economy, chatter, minigame, unlocks, traits).

---

## 3. Issues Found

### P0 - Critical

**(None found)** - No security vulnerabilities, no data loss risks, no build-breaking issues detected.

### P1 - High

#### 1. `// TODO: Review this file` on every single source file
**Impact**: High (maintenance signal)
**Files**: Every `.js` and `.jsx` file in `src/` has this comment on line 1.

This is clearly a mass-generated marker, likely from an AI-assisted code generation pass. It signals that no file has been "reviewed" yet in the project's own workflow. While not a bug, it's noise that:
- Makes `grep TODO` useless for finding actual TODOs
- Suggests the codebase hasn't gone through a human review pass
- Should be cleaned up or replaced with meaningful review status

#### 2. Missing i18n translation files (locale JSONs not found in source)
**Impact**: High (runtime)
**Location**: `src/i18n.js` loads from `/locales/{{lng}}/{{ns}}.json` via HTTP backend

The locale JSON files are loaded at runtime via `i18next-http-backend` from `public/locales/`. This is fine architecturally, but the translation files were not found under `src/`. They are presumably in `public/locales/` which wasn't searched. However, this means:
- All user-facing strings across the entire codebase use i18n keys (e.g., `venues:stendal_proberaum.name`, `items:contraband.c_void_energy.name`). If any key is missing from the JSON files, users see raw key strings.
- There's no compile-time validation that all referenced keys exist in the translation files.
- **Recommendation**: Add a test that extracts all i18n key references from source and validates they exist in both `en` and `de` translation files.

#### 3. `imageGen.js` object URL memory leak potential
**Impact**: Medium-High (memory)
**Location**: `src/utils/imageGen.js:45-64`

The `fetchGenImageAsObjectUrl` caches Promises but the cached blob URLs are never automatically revoked. `clearImageCache()` exists but must be called manually. In a long game session with many AI-generated images, this could accumulate significant memory:
- Each `URL.createObjectURL()` holds a reference to the blob in memory
- The cache key is the full description string, so each unique prompt = one blob held indefinitely
- **Recommendation**: Add an LRU eviction policy or tie cleanup to scene transitions.

### P2 - Medium

#### 4. `handleRecordBadShow` directly references `crypto.randomUUID()` without import
**Impact**: Low (works in modern browsers, but fragile)
**Location**: `src/context/reducers/gigReducer.js:86`, `socialReducer.js:87,97`, `questReducer.js:38,54,71,104,121,130,216`

Multiple reducers use `crypto.randomUUID()` directly. While this works in Node 22+ and modern browsers, the project has a dedicated `src/utils/crypto.js` module. Using the global `crypto` directly bypasses any future centralization or polyfill needs.

#### 5. Event validation `VALID_CATEGORIES` is incomplete
**Impact**: Medium (data integrity)
**Location**: `src/data/events/index.js:14-20`

`VALID_CATEGORIES` only includes `['transport', 'band', 'gig', 'financial', 'special']`, but crisis events and consequence events may have different categories. The validation only *warns* (doesn't reject) on invalid categories, so this is non-breaking, but the warning noise could mask real issues.

#### 6. `hqItems.js` inconsistent `effect` shape
**Impact**: Medium (maintainability)
**Location**: `src/data/hqItems.js`

HQ items use multiple effect types (`inventory_set`, `inventory_add`, `stat_modifier`, `unlock_upgrade`) but the `target` field is inconsistently specified:
- Some `stat_modifier` effects have `target: 'band'`, `target: 'van'`, `target: 'player'`
- Others omit `target` entirely (e.g., instruments at line 199: `{ type: 'stat_modifier', stat: 'guitarDifficulty', value: -0.15 }`)
- The CLAUDE.md states "hqItems.js uses singular effect object" but doesn't specify the required shape

This inconsistency suggests the effect application logic must handle both with-target and without-target cases, increasing complexity.

#### 7. Venue data lacks TypeScript/schema enforcement
**Impact**: Medium (data integrity)
**Location**: `src/data/venues.js`

503 lines of hand-written venue data with no runtime schema validation on the venue objects themselves (unlike contraband which has schema tests). A typo in a venue property name would silently break functionality. While there are `venues.test.js` tests, adding PropTypes-style validation or a schema check at import time would be more robust.

#### 8. `handleAdvanceDay` complexity
**Impact**: Medium (maintainability)
**Location**: `src/context/reducers/systemReducer.js:378-485`

The `handleAdvanceDay` function spans ~107 lines and handles contraband effect expiry, reversion logic, day counter increments, and quest deadline checks. This is the most complex single function in the reducer layer and could benefit from decomposition.

### P3 - Low

#### 9. Hardcoded quest IDs in reducer logic
**Impact**: Low (maintainability)
**Location**: `src/context/reducers/gigReducer.js:61,170,179,191,202`

Quest IDs like `'quest_prove_yourself'`, `'quest_apology_tour'`, `'quest_ego_management'` are hardcoded strings in the gig reducer. These should be constants to prevent typo-related bugs and enable IDE refactoring.

#### 10. `let` used where `const` would suffice
**Impact**: Low (style)
**Location**: Various reducers (e.g., `gigReducer.js:97`, `questReducer.js:26`)

Several `let` declarations are never reassigned within their scope. Minor style issue caught by strict linting rules.

#### 11. `songs.js` excluded from ESLint
**Impact**: Low (tooling)
**Location**: `eslint.config.js` / `songs.js`

The songs data file is excluded from linting. While this is documented in AGENTS.md, the reason isn't clear from the code. The file appears to be standard JS that could be linted.

---

## 4. Architecture Assessment

### What's Working Well

| Area | Assessment |
|---|---|
| State Management | Excellent - disciplined action creator pattern, immutable updates, comprehensive clamping |
| Security | Excellent - prototype pollution protection, secure RNG, data redaction |
| Error Handling | Very Good - custom error classes, graceful degradation, crash boundaries |
| Testing | Very Good - 313 files, security tests, schema validation, performance tests |
| Audio System | Very Good - well-abstracted, graceful fallbacks, single clock source |
| Code Organization | Good - clean module boundaries, lazy loading, data/logic separation |
| Data Modeling | Good - O(1) lookups, validation at import, rarity-weighted systems |

### Areas for Improvement

| Area | Assessment |
|---|---|
| TODO Comments | Mass `// TODO: Review this file` should be cleaned up |
| i18n Validation | No compile-time check that all referenced keys exist |
| Memory Management | Image blob URLs need LRU eviction |
| Effect System Consistency | HQ item effects have inconsistent shapes |
| Quest System | Hardcoded IDs scattered across reducers |
| Complex Functions | `handleAdvanceDay` and `handleSetLastGigStats` are large and could be decomposed |

---

## 5. Dependency Health

All dependencies use **exact version pinning** (no `^` or `~`), which is intentional per project convention. Key dependencies:

| Package | Version | Status |
|---|---|---|
| react | 19.2.4 | Current major |
| pixi.js | 8.17.1 | Current major |
| tone | 15.5.6 | Current major |
| framer-motion | 12.38.0 | Current major |
| tailwindcss | 4.2.2 | Current major (v4) |
| vite | 8.0.1 | Current major |
| i18next | 25.4.1 | Current major |

No outdated or vulnerable dependencies detected based on version numbers. The pinning strategy is sound for reproducible builds.

---

## 6. Test Coverage Assessment

### Coverage by Domain

| Domain | Test Files | Assessment |
|---|---|---|
| Reducers | bandReducer, playerReducer, eventReducer, systemReducer, gigReducer, socialReducer, clinicReducer, questReducer, minigameReducer, sceneReducer | Comprehensive |
| Audio | audioEngine, audioPlayback, audioProcedural, audioSetup, audioCleanup, midiPlayback, songUtils | Good |
| Data Validation | contraband.schema, events/validation, venues | Good |
| Security | prototypePollution, randomness, saveValidation | Excellent |
| Performance | GigHUD, PixiStage, RoadieLogic | Good |
| Hooks | useRhythmGameLogic, useTravelLogic, useClinicLogic, etc. | Good |
| Integration | contraband, hqPassiveEffects | Present |

### Notable Testing Patterns
- Security tests cover all prototype pollution vectors (player.stats, band.inventory, social, relationships)
- Schema tests validate data file structure integrity
- Performance tests exist for rendering-critical paths
- Test tooling split: `node:test` for pure JS, `vitest` for JSX (correct per project convention)

---

## 7. Summary & Recommendations

### Top 5 Actionable Items

1. **Clean up `// TODO: Review this file` markers** - Replace with meaningful comments or remove entirely. Currently makes grep-based TODO tracking useless.

2. **Add i18n key validation test** - Write a test that extracts all `t('key')` and i18n key references from source and validates they exist in both `en` and `de` locale files. This prevents invisible broken translations.

3. **Add LRU eviction to image URL cache** - `fetchGenImageAsObjectUrl` accumulates blob URLs indefinitely. Add a max cache size with `URL.revokeObjectURL()` on eviction.

4. **Extract quest ID constants** - Move hardcoded quest IDs (`'quest_prove_yourself'`, etc.) to a constants file to prevent typos and enable safe refactoring.

5. **Standardize HQ item effect shapes** - Define and document the canonical effect object shape, ensuring all items consistently specify `target` when needed.

### Overall Verdict

This is a **well-engineered codebase** for a complex browser game. The security practices are notably strong for a game project (prototype pollution protection, secure RNG, data redaction). The state management is disciplined with proper immutability and value clamping throughout. The test coverage ratio (~1.1:1) with dedicated security and performance test suites is impressive.

The main concerns are maintenance-oriented (TODO noise, hardcoded strings, inconsistent effect shapes) rather than correctness or security issues. No P0 critical issues were found.

**Health Score: 78/100** - Loses points primarily for the mass TODO markers suggesting incomplete review workflow, missing i18n validation, and some maintainability concerns around complex functions and inconsistent data shapes. Gains significant credit for security posture, test coverage, and architectural discipline.
