# tests/node - Agent Instructions

- `run-node-tests.mjs` accepts `--shard=<index>/<total>` (1-based) to split the discovered file list into deterministic shards (sorted round-robin); CI runs the node tier as a shard matrix. Combine with the heavy flags, e.g. `pnpm run test:node -- --shard=1/2`. Ignored when specific test files are passed.
- `updateSymbols.test.js` pins the generated `symbols.json` schema. When changing symbol metadata, cover enriched fields there: signatures, `properties`/union `variants`, JSDoc tags, `dependencies`/`usedBy`, positions, React metadata, and export details.
- Travel/location assertions need both legacy and canonical venue ID cases.
- Load/reset tests verify whitelist sanitization, not raw spread assumptions.
- Keep `songsData.test.js` on transform edge cases and `songs-real.test.js` on production-dataset contracts; real-dataset assertions include `song.id` in failure messages.
- `mapGenerator.test.js` imports `getCityKeyFromVenueId` directly; assert prefix extraction (including the empty-string case for IDs with no underscore) alongside `cityStates` population and key-to-venue-prefix alignment.
- `economyEngine.test.js` `calculateMerchIncome` tests must cover custom `context.merchPrices` — verify non-default prices change revenue vs default, and identical prices produce identical revenue.
- Split-runner commands must stay Windows-shell portable.

## Expedition

- Adding or removing an `rng()` call in `buildExpeditionMap` shifts the seeded stream and changes **every route on every seed**. Fixtures must derive node ids, reward ids and route steps from the built map — never pin `exp_3_0`, `reward_route_merch_crate`, or a literal inventory delta. Assert the invariant (`<definition>::<source>` id keying, "the walked path reaches a gig node"), not the generated value.
- `walkTo` follows the first outgoing edge of each layer. A node on another branch is not on that path, so pick target nodes from the walk rather than from `map.meta` order.
- Underground and Rival are weighted placement categories, not guarantees. Assert offer _rates_ across many seeds; only a `forcedRival` profile is absolute. "Every seed has both" is the pre-G5 assumption and must not come back.
- A route-rare fixture needs a seed whose route actually carries one — not every seed does. Search for a rare-bearing path instead of hand-writing a ledger entry, or the load sanitizer legitimately drops it.

## Long-Term Assets

- RNG-sensitive asset tests construct `dayRngStream` arrays explicitly so the test can pin which assets trigger risk events.
- Tests that mutate `MODULE_REGISTRY` / `CHASSIS_CONFIG` / `MODULE_PROMPTS` (e.g., `assetReducer.test.js`, `assetActionCreators.test.js`, `assetGoldenPath.test.js`) MUST snapshot the original values (`structuredClone`) at file scope and restore via `after(...)` — these are module-scoped mutable maps shared across the test process, so mutations leak between sibling test files without a teardown.
- Prompt-key membership checks use `Object.hasOwn(MODULE_PROMPTS, m.imagePromptKey)` — not `assert.ok(MODULE_PROMPTS[key], ...)`. The truthy form fails on valid but falsy values, and `Object.hasOwn` is the project convention for untrusted property checks.
- `LOAN_PROFILES` invariants are pinned via `assert.deepEqual(Object.keys(LOAN_PROFILES).sort(), [...expected])` — an additive change to the registry must update the asserted set so silently-added profiles can't ship unannounced.
- Crowdfund tick fixtures need `materializedAssetId` + `materializedSlotIds` once a section plan populates `CHASSIS_CONFIG[kind].legit[tier].slots`; the tick reads slot ids 1:1 from the campaign and pre-Plan-2 fixtures may otherwise crash on `undefined.0`.
