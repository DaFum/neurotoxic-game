# Using `symbols.json` as an Agent Navigation Index

`symbols.json` is the fastest first stop when you need to understand exported project APIs without opening every source file. It is generated from the TypeScript compiler API by `scripts/update-symbols.mjs`; do not edit it manually.

Use it before reading source when the task is about:

- calling or mocking an exported function, hook, or component
- changing a signature and finding affected callers
- constructing typed fixtures or state objects
- locating the exact block to edit
- understanding the intent documented in JSDoc/TSDoc

The index lives under `knownSymbols`. Each symbol maps to one or more entries because a symbol may be defined in one file and re-exported through another.

The generator intentionally skips `*.test.*`, `*.spec.*`, and `*.stories.*` files. Treat the graph as production/API context first; search tests separately when the task is about coverage, fixtures, or Storybook usage.

## 1. Start With Impact Analysis

Use `dependencies` and `usedBy` before changing an exported symbol.

Example: `calculateGigFinancials` in `src/utils/economyEngine.ts` exposes its direct local dependencies:

- `calculateBarCut`
- `calculateEffectiveTicketPrice`
- `calculateGigExpenses`
- `calculateGuarantee`
- `calculateMerchIncome`
- `calculateSponsorshipBonuses`
- `calculateTicketIncome`
- `calculateVenueSplit`
- `calculateZealotryEffects`
- `clamp0to100`
- `finiteNumberOr`

It also exposes `usedBy`, currently including `src/utils/postGigUtils.ts`.

Agent workflow:

1. Read the target symbol entry.
2. Use `dependencies` to understand internal behavior that may also need adjustment.
3. Use `usedBy` to identify callers/importers that may break.
4. Open only the files that are actually relevant to the change.

This is especially useful for shared types. `AssetModifiers` shows importers such as `usePreGigLogic`, `assetSelectors`, `economyEngine`, `postGigUtils`, and `travelUtils`. If a modifier field changes, start from those files instead of doing a blind repo-wide search.

## 2. Use Types Before Creating Data

For interfaces and object-like type aliases, use `properties` to construct valid objects.

Example: `BandMember` in `src/types/band.d.ts` lists required and optional fields. Optional fields such as `baseStats`, `charisma`, `equipment`, and `id` are marked with `"optional": true`. Required fields such as `mood`, `relationships`, `stamina`, and `traits` are marked with `"optional": false`.

Agent workflow:

1. Look up the type before writing a fixture, reducer payload, or mock.
2. Fill every property where `optional` is `false`.
3. Preserve the exact TypeScript type string from `type`.
4. For union type aliases, inspect `variants`. Primitive/string-literal aliases intentionally omit prototype properties, while mixed unions expose object branches through `variants`.

Example: `RhythmSetlistEntry` has a primitive `string` variant and an object variant with optional fields such as `id`, `duration`, `sourceMid`, and `sourceOgg`.

Dictionary-like shapes expose index signatures as synthetic properties such as `[key: string]` or `[key: number]`. Example: `GigModifiers` lists the fixed modifier flags and also `[key: string]: boolean`, so extra keyed modifier flags must still be boolean.

Type strings are normalized for agent readability. A property such as `assets` on `GameState` is shown as `LongTermAsset[]`, not `import("./assets").LongTermAsset[]`.

## 3. Compose React Safely

Use `isComponent`, `isHook`, `parameters`, and `returnType` before wiring UI.

Example: `ActionButton` is marked as a component. Its parameter type shows that it expects `children`, accepts an optional `variant`, and inherits standard button attributes through an `Omit<... 'ref'>` type. That is enough to compose it safely without opening the component file first.

Other useful component examples:

- `Tooltip` requires `children: ReactElement`, `content: ReactNode`, optional `className`, and optional `position: 'top' | 'bottom'`.
- `AnimatedDivider` accepts optional `width`, `transition`, and `className`.

Components wrapped in `memo`, `React.memo`, `forwardRef`, or `React.forwardRef` expose the inner render function signature. That means destructured prop names and forwarded `ref` parameters are visible in `parameters`, which is usually more useful than the wrapper's call signature.

Agent workflow:

1. Check whether the symbol has `isComponent` or `isHook`.
2. Read the extracted parameter type as the props contract.
3. Use `usedBy` to find established usage patterns when the props are complex.
4. Open source only if behavior or rendering details matter.

## 4. Edit Precise Code Ranges

Use `lineStart`, `lineEnd`, `columnStart`, and `columnEnd` for surgical edits.

Example: `applyTraitUnlocks` is located in `src/utils/traitUtils.ts` from line 164 to line 285. It also lists dependencies such as `getSafeUUID`, `hasTrait`, and `normalizeTraitMap`, and callers including reducers plus `questRewards`.

Agent workflow:

1. Use the position fields to open the exact function or type declaration.
2. Keep edits within that range unless callers or dependencies require updates.
3. When replacing a full implementation, target only the indexed declaration block.
4. Re-run `pnpm run symbols:update` after changing exported declarations or JSDoc.

This reduces accidental file damage from broad search/replace edits.

## 5. Read JSDoc for Intent

Use `jsDoc.summary` and `jsDoc.tags` to understand architectural intent.

Examples:

- `calculateGigFinancials`: "Calculates the full financial breakdown of a gig with Fame Scaling and Hype bonuses."
- `clampPlayerMoney`: "Clamps player money to a safe, non-negative integer."
- `applyTraitUnlocks`: documents that it applies unlocked traits immutably, avoids duplicates, and returns updated `{ band, toasts }`.

Agent workflow:

1. Read `jsDoc` before changing behavior.
2. Treat `@param`, `@returns`, and `@throws` tags as part of the contract.
3. If your change alters the contract, update source JSDoc and regenerate `symbols.json`.

## 6. Know The Limits

`symbols.json` is an index, not a replacement for source review.

- `dependencies` are direct local calls, constructor calls, and JSX tag references found in the declaration body; they are not a full runtime graph.
- `usedBy` tracks imports, including type-only imports. It does not prove that a value is executed at runtime.
- Test, spec, and story files are excluded from the index to reduce noise. Use direct search when you need test-only or Storybook references.
- `returnType` and property `type` strings come from TypeScript. For very complex inferred objects, opening source may still be necessary.
- External allowlist entries exist for common libraries, but enriched metadata is focused on local `src/` symbols.

Use the index to reduce search space and avoid unnecessary file reads. Use source files for final behavioral changes and verification.

## 7. Keep The Index Current

After changing exported APIs, type shapes, import relations, local calls, React metadata, or JSDoc under `src/`, run:

```bash
pnpm run symbols:update
pnpm run symbols:check
```

Schema changes belong in `tests/node/updateSymbols.test.js`.
