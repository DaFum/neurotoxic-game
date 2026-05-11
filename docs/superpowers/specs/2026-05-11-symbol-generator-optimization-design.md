# Symbol Generator Optimization — Design Spec

**Date:** 2026-05-11  
**File:** `scripts/update-symbols.mjs`  
**Output:** `symbols.json`

---

## Problem

`symbols.json` is used as a navigational index of the codebase. Five semantic problems make it unreliable for that purpose:

1. `path` points to the scanned export surface (barrel/re-exporter), not the definition site.
2. Default exports are silently dropped; the index is incomplete.
3. Local and external symbols share the same schema with no discriminant field.
4. `kindLabel` returns `'const'` for all variable declarations regardless of `const`/`let`/`var`.
5. `SKIP_PAIRS` is a hand-maintained workaround for a structural bug, not a real solution.

---

## Root Cause

The scanner iterates every source file and calls `checker.getExportsOfModule()`. For barrel files like `audioEngine.ts` that re-export via `export { setupAudio } from './setup'`, the symbol's `declarations[0]` is the `ExportSpecifier` node in the barrel — not the function declaration in `setup.ts`. As a result:

- `path` is set to the scanning file (the barrel), not the definition file.
- `kindLabel` sees an ExportSpecifier and falls through to `'const'`.
- The same symbol is inserted once per export surface → duplicate entries.

---

## Design

### Section 1 — `path` → definition-first, `exportPath` for re-exports

**Change:** before computing `path` or calling `kindLabel`, check whether the symbol is an alias:

```js
let resolvedSym = sym
if (sym.flags & ts.SymbolFlags.Alias) {
  const aliased = checker.getAliasedSymbol(sym)
  // defensive fallback: only use aliased if it has declarations
  if (aliased.declarations?.length) resolvedSym = aliased
}

const decl = resolvedSym.declarations?.[0]
if (!decl) continue
const declFile = decl.getSourceFile().fileName.replace(/\\/g, '/')
if (!declFile.startsWith(SRC)) continue

const defPath = relPath(declFile)
const exportPath = rel !== defPath ? rel : undefined
```

- `path` is set to `defPath` (the definition file, always).
- `kindLabel` is called with `resolvedSym` (accurate type, not ExportSpecifier fallback).
- `exportPath` is set only when the scanning file differs from the definition file. It is excluded from the dedup signature, so the first encounter wins. **`exportPath` is a hint, not a canonical value** — if a symbol is re-exported from multiple barrels, whichever barrel is scanned first is recorded.

**Dedup signature** stays `{ path, isDefault }` (no `exportPath`). All re-export encounters hash to the same signature and are dropped after the first.

**Expected effect:** ~133 multi-entry symbols collapse to single entries. `kindLabel` is accurate for re-exported functions/classes.

---

### Section 2 — Default exports

**Change:** remove `'default'` from `SKIP_NAMES`. After the named-export loop for each source file, run an explicit pass for `'default'`:

1. Look up the `default` export symbol via `checker.getExportsOfModule`.
2. Resolve through `getAliasedSymbol` to get the real symbol.
3. Determine the key: use the resolved symbol's `name` if it is a real identifier (not `'default'`, not empty, not an internal transient name). Fall back to `default@${rel}`.
4. Record the entry with `isDefault: true`.

**Dedup signature** includes `isDefault`, so a symbol named `App` exported as a named export and as a default export in different files can coexist without collision.

**Example outputs:**
```json
{ "name": "App",              "path": "src/App.tsx",          "type": "function", "source": "local", "isDefault": true }
{ "name": "default@src/i18n.ts", "path": "src/i18n.ts",      "type": "const",    "source": "local", "isDefault": true }
```

---

### Section 3 — `source: "local" | "external"` discriminant

**Change:** add `source` to every entry.

- All entries produced by the source-file scan get `source: 'local'`.
- All entries in the static `EXTERNAL` array get `source: 'external'`.

`source` is **not** part of the dedup signature (it is always constant for a given entry origin). Consumers can branch on `source` instead of testing for the presence of `path` vs `module`.

---

### Section 4 — `kindLabel` — const / let / var distinction

**Change:** in the catch-all branch of `kindLabel`, check whether the declaration is a `VariableDeclaration`. If so, inspect the parent `VariableDeclarationList` flags:

```js
if (ts.isVariableDeclaration(decl)) {
  const list = decl.parent
  if (ts.isVariableDeclarationList(list)) {
    if (list.flags & ts.NodeFlags.Const) return 'const'
    if (list.flags & ts.NodeFlags.Let)   return 'let'
    return 'var'
  }
}
return 'const'  // non-variable declarations that match no explicit case
```

The final `'const'` fallback is kept only for non-variable nodes that don't match function/class/interface/type/enum. For actual variable declarations, the keyword is always determined precisely.

---

### Section 5 — SKIP_PAIRS audit

After the alias-unwrapping fix, regenerate `symbols.json` and audit the four current entries:

| Entry | Expected outcome |
|---|---|
| `ActionTypes@src/context/gameReducer.ts` | Likely drops automatically — verify |
| `PRACTICE_RETURN_SCENES@src/context/GameState.tsx` | Likely drops automatically — verify |
| `getPrimaryEffect@src/ui/bandhq/hooks/usePurchaseLogic.ts` | Likely drops automatically — verify |
| `_resetLastMinigameFallback@src/scenes/PreGig.tsx` | Remove unconditionally: already filtered by `sym.name.startsWith('_')` guard |

Any SKIP_PAIRS entry that survives must have an inline comment explaining why alias resolution does not collapse it (e.g., the symbol has two independent definitions, not a re-export relationship).

---

## Schema after this change

Local symbol entry:
```json
{
  "name": "setupAudio",
  "path": "src/utils/audio/setup.ts",
  "exportPath": "src/utils/audio/audioEngine.ts",
  "source": "local",
  "type": "function",
  "isDefault": false
}
```

External symbol entry:
```json
{
  "name": "useState",
  "module": "react",
  "source": "external",
  "type": "const",
  "isDefault": false
}
```

Default export entry (named):
```json
{
  "name": "App",
  "path": "src/App.tsx",
  "source": "local",
  "type": "function",
  "isDefault": true
}
```

Default export entry (anonymous fallback):
```json
{
  "name": "default@src/i18n.ts",
  "path": "src/i18n.ts",
  "source": "local",
  "type": "const",
  "isDefault": true
}
```

---

## What this does not change

- `--check` mode behavior is unchanged.
- The static `EXTERNAL` allowlist is unchanged (entries, not the `source` field addition).
- No schema versioning or top-level restructure (that is Approach C, deferred).
- No `valueShape` sub-classification for const initializers (Approach B, deferred).

---

## Out of scope

- Splitting `knownSymbols` into `localSymbols` / `externalSymbols` (Approach C).
- `valueShape` field for object-literal vs call-expression classification (Approach B).
- Automated discovery of the EXTERNAL allowlist from `package.json` dependencies.
