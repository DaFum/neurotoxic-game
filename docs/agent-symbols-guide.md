# Using `symbols.json` as an Agent Navigation Index

`symbols.json` is the fastest first stop when you need to understand exported project APIs without opening every source file. It is generated from the TypeScript compiler API by `scripts/update-symbols.mjs`; do not edit it manually.

Use it before reading source when the task is about:

- calling or mocking an exported function, hook, or component
- changing a signature and finding affected callers
- constructing typed fixtures or state objects
- locating the exact block to edit
- understanding the intent documented in JSDoc/TSDoc

The document is `{ meta, files, knownSymbols }`.

- `meta` describes the schema, points back to this guide through `guidePath`, and includes `sourceHash`, a stable SHA-256 over indexed source and reference files.
- `files` is a file-level navigation index keyed by relative path. Each entry lists exported symbols, imported names, React components, and hooks in that file.
- `knownSymbols` is the primary symbol index. Each symbol maps to one or more entries because a symbol may be defined in one file and re-exported through another.

The generator intentionally skips `*.test.*`, `*.spec.*`, and `*.stories.*` files when collecting exported symbols. It still scans those files as reference-only inputs for `usedByTests` and `files[path].imports`, so test imports are visible without polluting the production/API export graph.

## 1. Check Freshness First

Use `meta.sourceHash`, `meta.sourceFiles`, `meta.referenceFiles`, and `meta.indexedFiles` to understand what the generated file covers. `meta.guidePath` should point to `docs/agent-symbols-guide.md`; if a future schema moves the guide, follow that field instead of guessing.

Agent workflow:

1. Read `meta.schemaVersion` and `meta.guidePath`.
2. If source files changed in the working tree, run `pnpm run symbols:check`.
3. If the check fails, run `pnpm run symbols:update` before relying on the index.

`sourceHash` is deterministic. It is intentionally not a timestamp, so `--check` can stay stable across repeated runs.

## 2. Start With Impact Analysis

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

It also exposes `usedBy`, currently including production importers such as `src/utils/postGigUtils.ts`. Test, spec, and story imports are kept separate in `usedByTests`.

When the target is a same-file helper, check `referencedByLocal`. Example: `calculateBarCut` can show that it is directly referenced by `calculateGigFinancials` in `src/utils/economyEngine.ts`. That gives an inverse same-file view that `usedBy` cannot provide, because no import occurs inside one file.

Agent workflow:

1. Read the target symbol entry.
2. Use `dependencies` to understand internal behavior that may also need adjustment.
3. Use `usedBy` to identify production callers/importers that may break.
4. Use `usedByTests` to find direct test coverage or test-only usage patterns.
5. Use `referencedByLocal` to find same-file exported callers.
6. Open only the files that are actually relevant to the change.

This is especially useful for shared types. `AssetModifiers` shows importers such as `usePreGigLogic`, `assetSelectors`, `economyEngine`, `postGigUtils`, and `travelUtils`. If a modifier field changes, start from those files instead of doing a blind repo-wide search.

## 3. Use The File Index

Use `files[path]` when the question starts with a file rather than a symbol.

Example: `files["src/domain/questRewards.ts"]` lists:

- `exports`: exported declarations such as `applyQuestRewards`, `getQuestRewards`, and `QuestRewardResult`
- `imports`: imported names such as `GameState`, `QuestReward`, `formatCurrency`, and `i18n`
- `components`: React components declared in the file
- `hooks`: React hooks declared in the file

Agent workflow:

1. Start from `files[path]` when a user names a file.
2. Use `exports` to jump into `knownSymbols` for exact line ranges and type data.
3. Use `imports` to spot likely collaborators before opening the file.
4. Use `components` and `hooks` to identify React entry points quickly.

The file index is intentionally shallow. It helps decide what to open next; source files remain the authority for behavior.

## 4. Use Types Before Creating Data

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

## 5. Compose React Safely

Use `isComponent`, `isHook`, `parameters`, and `returnType` before wiring UI.

Example: `ActionButton` is marked as a component. Its parameter type shows that it expects `children`, accepts an optional `variant`, and inherits standard button attributes through an `Omit<... 'ref'>` type. The raw parameter `name` is a multi-line destructuring pattern, but the same parameter also carries `bindingKind: "objectPattern"` and `destructuredNames` such as `children`, `onClick`, `ref`, and `rest`. Use those structured fields instead of parsing the raw text.

Other useful component examples:

- `Tooltip` requires `children: ReactElement`, `content: ReactNode`, optional `className`, and optional `position: 'top' | 'bottom'`.
- `AnimatedDivider` accepts optional `width`, `transition`, and `className`.

Components wrapped in `memo`, `React.memo`, `forwardRef`, or `React.forwardRef` expose the inner render function signature. That means destructured prop names and forwarded `ref` parameters are visible in `parameters`, which is usually more useful than the wrapper's call signature.

Agent workflow:

1. Check whether the symbol has `isComponent` or `isHook`.
2. Read the extracted parameter type as the props contract.
3. For destructured parameters, use `bindingKind` and `destructuredNames` for machine-readable names.
4. Use `usedBy` for production usage patterns and `usedByTests` for test examples.
5. Open source only if behavior or rendering details matter.

## 6. Edit Precise Code Ranges

Use `lineStart`, `lineEnd`, `columnStart`, and `columnEnd` for surgical edits.

Example: `applyTraitUnlocks` is located in `src/utils/traitUtils.ts` from line 164 to line 285. It also lists dependencies such as `getSafeUUID`, `hasTrait`, and `normalizeTraitMap`, and callers including reducers plus `questRewards`.

Agent workflow:

1. Use the position fields to open the exact function or type declaration.
2. Keep edits within that range unless callers or dependencies require updates.
3. When replacing a full implementation, target only the indexed declaration block.
4. Re-run `pnpm run symbols:update` after changing exported declarations or JSDoc.

This reduces accidental file damage from broad search/replace edits.

## 7. Read JSDoc for Intent

Use `jsDoc.summary` and `jsDoc.tags` to understand architectural intent.

Examples:

- `calculateGigFinancials`: "Calculates the full financial breakdown of a gig with Fame Scaling and Hype bonuses."
- `clampPlayerMoney`: "Clamps player money to a safe, non-negative integer."
- `applyTraitUnlocks`: documents that it applies unlocked traits immutably, avoids duplicates, and returns updated `{ band, toasts }`.

Agent workflow:

1. Read `jsDoc` before changing behavior.
2. Treat `@param`, `@returns`, and `@throws` tags as part of the contract.
3. If your change alters the contract, update source JSDoc and regenerate `symbols.json`.

## 8. Resolve Aliases, Constants, Generics, and Heritage

These fields let the index answer more questions before you open a file.

**Aliased re-exports.** When a module re-exports under a different name
(`export { TOURBUS_BASE_SPEED as BASE_SPEED }`), the entry's key is the exported
alias but `path:lineStart` points at the original declaration. Such entries carry
`isAlias: true` and `localName` (the real identifier). Example: `BASE_SPEED`
resolves to `localName: "TOURBUS_BASE_SPEED"` in
`src/hooks/minigames/minigameConstants.ts`, re-exported through
`exportPath: src/hooks/minigames/useTourbusLogic.ts`. Jump using `localName`, not
the key.

**Literal constants.** Primitive `const` exports carry their `value` (number,
string, boolean, or null), so you can read thresholds and tuning knobs without
opening source — e.g. `BASE_SPEED` has `value: 0.05`. Object literal `const`
exports omit their full value but expose sorted top-level `literalKeys`.
Example: `MODIFIER_COSTS` exposes keys such as `catering`, `guestlist`,
`merch`, `promo`, and `soundcheck`. Use `literalKeys` for orientation; open
source when nested values or computed expressions matter.

**Generics.** `typeParameters` lists declared generic parameters as written, e.g.
`Action` has `["TType extends ActionType", "TPayload = undefined"]`. Use it to
instantiate generic helpers and types correctly.

**Async/generator.** Functions declared `async` carry `async: true`; generators
carry `generator: true`. Await accordingly.

**Heritage.** Interfaces and classes expose `extends` and `implements` arrays
(e.g. `ActiveQuestState` extends `UnknownRecord`). Follow these to find inherited
members before constructing objects.

**Deprecation.** Declarations with an `@deprecated` JSDoc tag carry
`deprecated: true`; prefer non-deprecated alternatives.

## 9. Read The `meta` Block

`meta` is deterministic (no timestamps) and includes `schemaVersion`,
`guidePath`, `sourceHash`, symbol/file counts, `aliasedReexports`, and
`fieldGuide` — a one-line description of every entry field. When you encounter
an unfamiliar field, read `meta.fieldGuide[field]` rather than guessing.

## 10. Know The Limits

`symbols.json` is an index, not a replacement for source review.

- `dependencies` are direct local calls, constructor calls, JSX tag references, and bare value references found in the declaration body; they are not a full runtime graph.
- `referencedByLocal` is the same-file inverse of exported declaration references (calls, JSX, dispatch-table membership, bare reads). For a yes/no "is this used anywhere in its own file (including from module-private helpers)?" signal, use the `referencedInFile` boolean instead.
- `referencedBy` is the cross-file inverse for references that are NOT module imports, which `usedBy` cannot see. Two cases produce it: (1) ambient `.d.ts` types used as a field/payload type in another declaration file, where the name is in scope via `export *` rather than an `import` (e.g. `CharacterProfile`/`CompleteTravelMinigamePayload` referenced by `GameState`/`GameAction` in `src/types/game.d.ts`); (2) namespace-member access (`import * as ns; ns.foo()`), where the import binds `ns`, not `foo`. Type-only exports are frequently consumed exclusively through `referencedBy`.
- `usedBy` tracks production imports, including type-only imports and resolved dynamic `import()` calls (the latter carry `dynamic: true`). It does not prove that a value is executed at runtime.
- Orphan check: a symbol is only truly unreferenced when it has none of `usedBy`, `usedByTests`, `referencedBy`, `referencedByLocal`, or `referencedInFile`. An empty `usedBy` alone is not evidence of dead code (the symbol may be used same-file, cross-file without an import, or only by tests).
- `usedByTests` tracks test, spec, and story imports separately. It helps find coverage and examples, but direct search is still useful for dynamic access or mocked module shapes.
- `files[path].imports` lists imported names, not full module specifiers or runtime dependency edges.
- `literalKeys` lists only top-level keys from object literal `const` exports. It intentionally omits full object values, nested shapes, spreads, and computed keys.
- `returnType` and property `type` strings come from TypeScript. For very complex inferred objects, opening source may still be necessary.
- External allowlist entries exist for common libraries, but enriched metadata is focused on local `src/` symbols.

Use the index to reduce search space and avoid unnecessary file reads. Use source files for final behavioral changes and verification.

## 11. Keep The Index Current

After changing exported APIs, type shapes, import relations, local calls, React metadata, or JSDoc under `src/`, run:

```bash
pnpm run symbols:update
pnpm run symbols:check
```

Schema changes belong in `tests/node/updateSymbols.test.js`.
