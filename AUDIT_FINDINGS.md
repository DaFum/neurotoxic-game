# Neurotoxic — Code-Quality Audit Findings

Scope: `src/` (production code). Tests inspected only to classify whether an "orphan" is test-covered API surface vs. a true orphan. No files were modified.

**Method note on rigor:** Orphan analysis started from the `symbols.json` dependency graph (`usedBy`), then every candidate was re-verified against live source with ripgrep (occurrence counts *including* the defining file, to separate genuinely-unused exports from same-file-only and dynamically-imported ones). Lazy-loaded scenes (`React.lazy`) and same-file `Props` interfaces were confirmed as **not** orphans. Duplicates/inconsistencies/dead-code were cross-checked by three independent verification passes.

---

## 0. Summary / triage

| Cat | Severity | Headline |
|-----|----------|----------|
| 5 Missing integration | **HIGH** | 13 quest-event producers are fully built but never emitted *and* no quest listens for them — an entire branch of the quest-trigger system is inert. |
| 3 Inconsistency | **HIGH** | `clinicReducer` heal/donate use `?? 0` on persisted `member.stamina`/`mood`, which does **not** strip `NaN` → stale-save heals silently become no-ops (the exact bug CLAUDE.md warns about). |
| 1 Duplicate | **HIGH** | `finiteNumberOr`/`isFiniteNumber` re-cloned inline in 3 reducers despite the explicit single-source rule. |
| 1 Duplicate | **MED** | Prototype-pollution key set (`__proto__/constructor/prototype`) maintained in 4+ independent copies. |
| 5 Missing integration | **MED** | Rarity-weighted contraband-drop helpers and `safeStorage` get/set helpers are built + tested but never wired into the app. |
| 3 Inconsistency | **MED** | Hardcoded `€` baked into ~48 locale event strings instead of `{{amount}}`. |
| 2 Orphan | **MED** | 13 quest producers + 2 unused types + 5 unused quest-id constants. |
| 4 Dead code | — | **None found.** |
| Tooling | **MED** | `symbols.json` contains 4 phantom shadow entries; `symbols:check` reports "up to date" anyway. |

---

## 1. DUPLICATES

### HIGH

**1.1 `finiteNumberOr` / `isFiniteNumber` re-implemented inline (RE-IMPLEMENTED util)** — **MERGE**
Canonical: `src/utils/finiteNumber.ts:8` (`finiteNumberOr`), `:11` (`isFiniteNumber`), re-exported via `src/utils/gameStateUtils.ts:14`. CLAUDE.md explicitly forbids reintroducing private copies or bare `typeof v === 'number'` narrowings.
- `src/context/reducers/bandReducer.ts:28-29` — `isSafeNumber = (v): v is number => typeof v === 'number' && Number.isFinite(v)` is a byte-for-byte clone of `isFiniteNumber`; this file *already imports* `finiteNumberOr` (line 12).
- `src/context/reducers/systemReducer.ts:141-142` (`finiteOptionalNumber`) and `:378-379` (`normalizeCoordinate`) — both inline `typeof v === 'number' && Number.isFinite(v) ? v : <fb>`; the second is exactly `finiteNumberOr(value, 0)`. File already imports `finiteNumberOr` (line 36).
- `src/context/reducers/playerReducer.ts:31-37` and `:40-43` — inline finite-ternary twice (for `money`, `fame`); direct `finiteNumberOr` candidates.

### MED

**1.2 Prototype-pollution key set defined 4+ times (NEAR duplicate)** — **MERGE**
Canonical: `src/utils/objectUtils.ts:3` `FORBIDDEN_KEYS` + `isForbiddenKey` (`:8`).
- `src/context/actionCreators.ts:177` — `HOSTILE_KEYS = new Set(['__proto__','constructor','prototype'])` (identical).
- `src/context/reducers/assetSanitizers.ts:119` — `HOSTILE_KEYS = ['__proto__','constructor','prototype']` (array form).
- `src/utils/saveValidator.ts:107` — `BANNED_KEYS = new Set([...])` (identical).
- Inline literal triples also at `src/utils/eventEngine.ts:134`, `src/utils/errorHandler.ts:210`. Security-critical list duplicated; extending it risks missing a copy.

**1.3 `clampCondition` re-implements `clamp0to100` (RE-IMPLEMENTED util)** — **MERGE**
- `src/context/reducers/assetSanitizers.ts:134-137` `clampCondition` (NaN→0, clamp 0..100) duplicates `src/utils/gameStateUtils.ts:196` `clamp0to100` (also `clampVanCondition` at `:328`). File already imports from gameStateUtils.

### LOW

**1.4 Two deterministic string-hash functions (NEAR duplicate)** — **KEEP (awareness only)**
- `src/utils/stringUtils.ts:9` `hashString` (DJB-ish, signed) vs `src/utils/mapGenerator.ts:111` `hashCityKey` (FNV-1a, unsigned). Overlapping intent but different algorithms/output domains; unifying would change determinism-sensitive map output. Do not merge.

**Verified NOT duplicated** (recorded to pre-empt rework): `formatCurrency`/`formatNumber` (single source `numberUtils.ts`), `getPixiColorFromToken` (single def `stageRenderUtils.ts:43`), `BRAND_COLOR_HEX` (single source), `mulberry32` vs `secureRandom` (intentionally distinct).

---

## 2. ORPHANED / UNINTEGRATED CODE

All entries below were verified to **exist in current source** and appear **exactly once** in `src/` (definition only). Items marked *(tested)* have a test file but no production call site — public-API-shaped orphans rather than accidental ones.

### MED — Unused quest-event producers (13)
All in `src/quests/producers/`, all exported, none imported anywhere in `src/`, and (see §5) none of their event types are listened for by any quest. **INTEGRATE or DELETE.**

| Symbol | Location | Event type emitted |
|--------|----------|--------------------|
| `createAssetRiskTriggeredQuestEvent` | `assetQuestEvents.ts:56` | `asset.riskTriggered` |
| `createAssetRiskResolvedQuestEvent` | `assetQuestEvents.ts:72` | `asset.riskResolved` |
| `createBrandDealFailedQuestEvent` | `brandQuestEvents.ts:31` | `brand.dealFailed` |
| `createBrandTrustChangedQuestEvent` | `brandQuestEvents.ts:45` | `brand.trustChanged` |
| `createMoneyEarnedQuestEvent` | `economyQuestEvents.ts:3` | `economy.moneyEarned` |
| `createItemCollectedQuestEvent` | `itemQuestEvents.ts:3` | `item.collected` |
| `createItemCraftedQuestEvent` | `itemQuestEvents.ts:27` | `item.crafted` |
| `createItemDeliveredQuestEvent` | `itemQuestEvents.ts:41` | `item.delivered` |
| `createMinigamePerfectQuestEvent` | `minigameQuestEvents.ts:23` | `minigame.perfect` |
| `createStoryFlagAddedQuestEvent` | `storyQuestEvents.ts:3` | `story.flagAdded` |
| `createVenueReputationChangedQuestEvent` | `venueQuestEvents.ts:37` | `venue.reputationChanged` |
| `createVenueBlacklistedQuestEvent` | `venueQuestEvents.ts:73` | `venue.blacklisted` |
| `createVenueUnblacklistedQuestEvent` | `venueQuestEvents.ts:87` | `venue.unblacklisted` |

> Note: `createSocialPostResolvedQuestEvent` and `createFollowersGainedQuestEvent` (same dir) are **not** orphans despite empty `usedBy` — they are invoked internally by `createSocialPostQuestEvents` (`socialQuestEvents.ts:105`), which `usePostGigHandlers.ts:223` calls. (False-positive caught during verification.)

### MED — Unused type exports — **DELETE**
- `BrandColorName` — `src/utils/brandColors.ts:24` (exported alias, never referenced).
- `CatalogEffect` — `src/types/components.d.ts:401` (never referenced; `CatalogInputEffect` on the next line is also unreferenced cross-file).

### LOW — Unused named quest-id constants — **FIX (use them) or DELETE**
`src/data/questsConstants.ts:6-10`: `QUEST_PICK_OF_DESTINY`, `QUEST_VIRAL_DANCE`, `QUEST_SPONSOR_DEMAND`, `QUEST_HARMONY_PROJECT`, `QUEST_LOCAL_LEGEND`. The constants are never imported; the **string values** (`'quest_pick_of_destiny'`, …) are hardcoded directly in `src/data/events/quests.ts` and `src/data/questRegistry.ts`. The sibling constants in the same file (`QUEST_PROVE_YOURSELF`/`APOLOGY_TOUR`/`EGO_MANAGEMENT`) *are* imported — so this is also an internal inconsistency (see §3). Either route the side-quest IDs through the constants or remove the dead constants.

### LOW — Tested helpers with no production call site — **INTEGRATE or DELETE**
- `clearCache` — `src/utils/unlockManager.ts:21` *(tested)* — never called in `src/`.
- `getSafeStorageItem` — `src/utils/storage.ts:58` *(tested)* — never called in `src/`.
- `setSafeStorageItem` — `src/utils/storage.ts:105` *(tested)* — never called in `src/`.
- `pickRarity` — `src/utils/contrabandUtils.ts:68` *(tested)* — never called in `src/`.
- `pickRandomContrabandByRarity` — `src/utils/contrabandUtils.ts:94` *(tested)* — never called in `src/`. (See §5.2.)

> The economy calculators flagged by the graph as cross-file-unused (`calculateTicketIncome`, `calculateGigExpenses`, `calculateBarCut`, `calculateGuarantee`, `calculateVenueSplit`, `calculateSponsorshipBonuses`, `calculateMerchIncome`, `calculateFuelCost` in `economyEngine.ts`) are **not** orphans — each has a node test and is used internally by the engine. They are legitimate (over-)exported internal helpers, not dead.

---

## 3. INCONSISTENCIES

### 3.1 State clamps — `?? 0` fails to strip `NaN` on persisted stats

CLAUDE.md: arithmetic-then-clamp must wrap the persisted addend with `finiteNumberOr(value, fallback)`, because `?? 0` does not strip `NaN` (NaN isn't nullish) and the clamp short-circuits `NaN → 0`, silently discarding the bonus. Correct sibling: `bandReducer.ts:447,450` (`clampMemberStamina(finiteNumberOr(m[key],0) + itemValue, …)`).

- **HIGH** — `src/context/reducers/clinicReducer.ts:150-157` (`handleClinicHeal`): `prevStamina = member.stamina ?? 0`, `prevMood = member.mood ?? 0`, then `clampMemberStamina/Mood(prev + gain)`. A stale `NaN` stat collapses the heal to a no-op and mis-reports the applied-delta toast. **FIX:** `finiteNumberOr(member.stamina, 0)` / `finiteNumberOr(member.mood, 0)`.
- **HIGH** — `src/context/reducers/clinicReducer.ts:234-239` (`handleBloodBankDonate`): `prevStamina = member.stamina ?? 0` → same flaw; corrupts `totalStaminaLost`. **FIX:** `finiteNumberOr(member.stamina, 0)`.
- **MED** — `src/context/reducers/minigameReducer.ts:110-111`: `clampMemberStamina(hitMember.stamina - penalty, hitMember.staminaMax)` uses raw persisted addends with no guard at all — weaker than every sibling. **FIX:** wrap both with `finiteNumberOr`.
- **LOW** — `src/context/reducers/minigameReducer.ts:309-310`: `clampBandHarmony(state.band.harmony - stress)` / `clampPlayerMoney(state.player.money + reward)` use raw persisted addends, whereas `socialReducer.ts:334-336` guards the same fields with `Number(state.player.fame) || 0`. Inconsistent treatment of identical persisted fields.

> Cleared (safe): `playerReducer.ts:32-33,40` and `systemReducer.ts:733` use bare `typeof` then a re-validating clamp (`clampPlayerFame`), so finiteness is re-enforced — not bugs.

### 3.2 Payload sanitization

- **LOW** — `src/context/reducers/minigameReducer.ts:343-345`: `typeof voidResonance === 'number' ? voidResonance : 0` (and `purgesUsed`, `hijacksOverridden`) lets `NaN`/`Infinity` through. CLAUDE.md mandates `Number.isFinite(v)`. **FIX:** `Number.isFinite(...)` / `finiteNumberOr(...)`.
- **LOW** — `src/utils/postGigUtils.ts:274,277`: mood/stamina deltas gated with bare `typeof === 'number'`, so an `Infinity` delta survives to the clamp. **FIX:** gate with `Number.isFinite`.
- **Cleared:** No `fame`/`fameLevel` pairing violations — all drop/write sites keep the pair consistent (`actionCreators.ts:128-129`, `playerReducer.ts:44-45`, `socialReducer.ts:351-352,453-454`, `tradeReducer.ts:82-83`, `clinicReducer.ts:101-102`, `systemReducer.ts:739-740`).

### 3.3 i18n

- **Cleared:** EN/DE key parity is **clean** across all 10 namespaces (assets, chatter, economy, events, items, minigame, traits, ui, unlocks, venues) — zero one-sided keys.
- **MED** — Hardcoded `€` baked into ~48 user-facing strings in `public/locales/{en,de}/events.json` (e.g. `atm_fee_trap.opt1.label:29`, `gear_theft.opt1.label:319`) and `items.json:99`. CLAUDE.md wants bare `{{amount}}` so amounts localize. **FIX:** convert to `{{amount}}` interpolation, or document them as intentionally-static flavor.
- **LOW** — `events.json` `police_contraband.opt1.label` writes `-€200` (symbol-first) while every sibling uses trailing `-200€`. Normalize.

### 3.4 Colors — **Cleared**
No hardcoded hex/`0x` colors in `.ts/.tsx`. All brand hex lives in `src/index.css` tokens and `src/utils/brandColors.ts`. No invented aliases (`--color-void-black` etc. are defined tokens).

### 3.5 `||` vs `??` — **Cleared**
All `||` fallbacks found are post-`Number()` (`Number(x) || 0`), which CLAUDE.md exempts. The real stat issue is `??` failing to strip `NaN` (covered in §3.1), not `||` discarding valid falsy values.

### 3.6 Toast currency — **Cleared**
Every `formatCurrency(...)` call across `src/` passes the language argument. No English-baking risk found.

---

## 4. DEAD / UNREACHABLE CODE

**None found.** Verified mechanically (ESLint `no-unreachable`, `no-constant-condition`, `no-constant-binary-expression` — zero violations) and by reading:
- The reducer is a TypeScript-exhaustive `reducerMap` keyed by `ActionTypes.*` (`gameReducer.ts:130-195`), so a removed action type fails type-check rather than rotting. The only string-`switch` (`bandReducer.ts:584`) has cases matching `BAND_ACTIONS` exactly; no orphan cases.
- All `GAME_PHASES.*` have both a `SceneRouter.tsx` case and a `changeScene(...)` dispatcher (incl. `PRACTICE`, `PRE_GIG_MINIGAME`, `ASSETS`, `CLINIC`, `CREDITS`).
- All 6 `effect.type` cases in `useEventSystem.ts:42` have emitters.
- Cleared as **not** dead: `EventModal.tsx:48` `option.disabled || false` (normalization), `catalogEffectUtils.ts:107` `default:` (defensive throw), all `import.meta.env.DEV` blocks (build-time-true), `LEGACY_UPGRADES` (feeds live `getUnifiedUpgradeCatalog()`).

---

## 5. MISSING INTEGRATION (primary interest)

### 5.1 HIGH — Quest-event trigger system has 13 inert event types
The quest engine emits events via `QuestEvents.emit(...)` from reducers/hooks and matches them through `progressRules.match` (see `src/data/AGENTS.md`). The producers in §2 are fully implemented and typed, but:
1. **No reducer or hook calls them** (verified: 0 imports outside their own files), and
2. **No quest in `src/data/questRegistry.ts` listens for their event types** (verified: `asset.riskTriggered`, `asset.riskResolved`, `brand.dealFailed`, `brand.trustChanged`, `economy.moneyEarned`, `item.collected`, `item.crafted`, `item.delivered`, `minigame.perfect`, `story.flagAdded`, `venue.blacklisted`, `venue.unblacklisted`, `venue.reputationChanged` → all return zero matches in `data/`, `domain/`, `quests/`).

So an entire class of quest triggers (asset-risk, brand-trust, money-earned, item collection/crafting/delivery, perfect-minigame, story-flag, venue-reputation/blacklist) can never fire. By contrast, the *wired* producers (`createGigCompletedQuestEvent`, `createMinigameCompletedQuestEvent`, `createSocialPostQuestEvents`, `createTravelCompletedQuestEvent`, social loyalty/controversy/trend, asset acquired/repaired/module-installed, etc.) are dispatched from their reducers. **Action: INTEGRATE** — emit each event from the relevant reducer (e.g. `economy.moneyEarned` from the income path in `economyEngine`/postGig; `item.collected/crafted/delivered` from item flows; `venue.*` from `gigReducer`/blacklist logic) **and** add matching quest rules — **or DELETE** the producers if the design dropped these triggers.

### 5.2 MED — Rarity-weighted contraband drops built but not used
`src/utils/contrabandUtils.ts` ships a complete rarity-weighted drop path — `pickRarity` (`:68`), `pickRandomContrabandByRarity` (`:94`), `BUST_CHANCE_BY_RARITY` (`:16`), plus `MAX_DROP_CHANCE`/`LUCK_MOD_PER_POINT` — all test-covered. But the live consumer `minigameReducer.ts` calls the **flat** `pickRandomContraband` and `computeDropChance`, never the rarity-weighted variant. The rarity subsystem is effectively dormant. **Action: INTEGRATE** (route drops through `pickRandomContrabandByRarity`) **or DELETE** the unused half.

### 5.3 MED — `safeStorage` get/set helpers not adopted
`getSafeStorageItem`/`setSafeStorageItem` (`src/utils/storage.ts`) are built + tested but never called; meanwhile `unlockManager.ts`, `usePersistence`, and `AudioManager` touch `localStorage` directly. Either adopt the safe helpers project-wide (their intended role) or remove them. **Action: INTEGRATE or DELETE.**

---

## 6. Tooling anomaly (bonus)

**MED** — `symbols.json` contains 4 **phantom shadow entries** that do not exist as real exports: `BASE_SPEED`, `MAX_SPEED`, `SPAWN_RATE_MS`, `TARGET_DISTANCE`, each recorded at the *same line* as the real `TOURBUS_*` constant it was truncated from (`src/hooks/minigames/minigameConstants.ts:10-13`). The index generator double-records these symbols with a prefix-stripped name. Critically, `pnpm run symbols:check` reports **"symbols.json is up to date"** — so the drift is invisible to the gate, yet AGENTS.md instructs agents to consult `symbols.json.knownSymbols` *before* opening source. An agent looking up `BASE_SPEED` would be pointed at a non-existent symbol. **Action: FIX** the generator (`scripts/update-symbols.mjs`) so it records only the real exported identifier, and regenerate.

---

### Appendix — verification commands
- Orphans: derived from `symbols.json` `usedBy`, then `rg -w -c <name> src/` (counting the defining file) to drop same-file-only and lazy-imported false positives; existence re-checked with `rg "export (const|function|type|interface) <name>"`.
- Quest integration: `rg -l "<event.type>" src/data src/domain src/quests` (excluding `quests/producers`) returned zero for all 13.
- Dead action types: reducer `ActionTypes.*` set vs `actionTypes.ts` definitions (`comm -23`) → empty diff.
