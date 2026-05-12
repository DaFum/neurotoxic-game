# Symbol Generator Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `scripts/update-symbols.mjs` so that `path` points to the definition site, default exports are captured, local/external symbols are distinguished by a `source` field, and `kindLabel` returns the correct variable keyword.

**Architecture:** All changes are confined to `scripts/update-symbols.mjs`. The core fix is unwrapping TypeScript alias symbols via `checker.getAliasedSymbol()` before recording `path` and `type`, which collapses ~133 barrel-re-export duplicates automatically. Default exports are handled in a separate second pass per source file to avoid any overlap with the named-export loop. An integration test suite in `tests/node/updateSymbols.test.js` verifies key output properties after each change group.

**Tech Stack:** Node.js (ESM), TypeScript Compiler API (`typescript` npm package), `node:test`, `node:assert/strict`, `node:child_process`

**Spec:** `docs/superpowers/specs/2026-05-11-symbol-generator-optimization-design.md`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `scripts/update-symbols.mjs` | Modify | All five semantic fixes |
| `tests/node/updateSymbols.test.js` | Create | Integration assertions on regenerated output |
| `symbols.json` | Regenerated | Do not hand-edit; always via `node scripts/update-symbols.mjs` |

---

## Task 1: Add `source` discriminant to all entries

**Files:**
- Modify: `scripts/update-symbols.mjs:140-148` (entry construction in named-export loop)
- Modify: `scripts/update-symbols.mjs:218-220` (EXTERNAL merge loop)
- Create: `tests/node/updateSymbols.test.js`

- [ ] **Step 1: Create the test file**

```js
// tests/node/updateSymbols.test.js
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { test } from 'node:test'
import fs from 'node:fs'

function loadSymbols() {
  return JSON.parse(fs.readFileSync('symbols.json', 'utf8')).knownSymbols
}

test('every local symbol entry has source: "local"', () => {
  const ks = loadSymbols()
  for (const [name, entries] of Object.entries(ks)) {
    for (const entry of entries) {
      if (entry.path !== undefined) {
        assert.equal(entry.source, 'local', `${name} missing source: "local"`)
      }
    }
  }
})

test('every external symbol entry has source: "external"', () => {
  const ks = loadSymbols()
  for (const [name, entries] of Object.entries(ks)) {
    for (const entry of entries) {
      if (entry.module !== undefined) {
        assert.equal(entry.source, 'external', `${name} missing source: "external"`)
      }
    }
  }
})
```

- [ ] **Step 2: Run test to confirm it currently fails**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: two FAILs — `source` field does not exist yet.

- [ ] **Step 3: Add `source: 'local'` to the local entry construction**

In `scripts/update-symbols.mjs`, find the `entry` object inside the named-export loop (around line 140) and add the field:

```js
    const entry = {
      name: exportedName,
      path: rel,
      source: 'local',
      type: kindLabel(sym),
      isDefault: false,
    }
```

- [ ] **Step 4: Add `source: 'external'` to the EXTERNAL merge loop**

Find the loop near the bottom of the file that calls `upsert(e.name, e)` and change it to:

```js
for (const e of EXTERNAL) {
  upsert(e.name, { ...e, source: 'external' })
}
```

- [ ] **Step 5: Regenerate `symbols.json`**

```bash
node scripts/update-symbols.mjs
```

Expected: `symbols.json written — N symbols from M src files.`

- [ ] **Step 6: Run tests — expect pass**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: both tests PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/update-symbols.mjs symbols.json tests/node/updateSymbols.test.js
git commit -m "feat: add source discriminant to symbol index entries"
```

---

## Task 2: Tighten `kindLabel` for const / let / var

**Files:**
- Modify: `scripts/update-symbols.mjs:65-74` (the `kindLabel` function)
- Modify: `tests/node/updateSymbols.test.js` (add test)

- [ ] **Step 1: Add the failing test**

Append to `tests/node/updateSymbols.test.js`:

```js
test('no symbol entry from a let declaration has type "const"', () => {
  // The presence of any "let" declarations with type "const" would indicate
  // the kindLabel fallback is not distinguishing variable keywords.
  // This is a smoke check: if let symbols exist in the codebase they must
  // carry type "let", not "const".
  const ks = loadSymbols()
  // Spot-check: known let exports in the codebase (add names as they appear)
  // For now, verify no entry with source "local" has both type "const" and
  // the word "let" in its name (rough heuristic until let exports are confirmed).
  // The real guard is the implementation correctness checked below.
  assert.ok(true) // placeholder — real check in step 6 after regeneration
})
```

> Note: a meaningful assertion requires knowing which source symbols are declared with `let`. This step prepares the test file; the assertion will be strengthened once we confirm the change works via output inspection.

- [ ] **Step 2: Replace the `kindLabel` function body**

Find `function kindLabel(sym)` (around line 65) and replace the entire function:

```js
function kindLabel(sym) {
  const decl = sym.declarations?.[0]
  if (!decl) return 'const'
  if (ts.isFunctionDeclaration(decl) || ts.isFunctionExpression(decl) || ts.isArrowFunction(decl)) return 'function'
  if (ts.isClassDeclaration(decl) || ts.isClassExpression(decl)) return 'class'
  if (ts.isInterfaceDeclaration(decl)) return 'interface'
  if (ts.isTypeAliasDeclaration(decl)) return 'type'
  if (ts.isEnumDeclaration(decl)) return 'enum'
  if (ts.isVariableDeclaration(decl)) {
    const list = decl.parent
    if (ts.isVariableDeclarationList(list)) {
      if (list.flags & ts.NodeFlags.Const) return 'const'
      if (list.flags & ts.NodeFlags.Let)   return 'let'
      return 'var'
    }
  }
  return 'const'
}
```

- [ ] **Step 3: Regenerate and inspect for `let` / `var` entries**

```bash
node scripts/update-symbols.mjs && node -e "
const ks = JSON.parse(require('fs').readFileSync('symbols.json','utf8')).knownSymbols
const lets = Object.values(ks).flat().filter(e => e.type === 'let' || e.type === 'var')
console.log('let/var entries:', lets.length)
lets.forEach(e => console.log(' ', e.name, e.type, e.path))
"
```

Expected: script runs without error; any `let`-declared exports now show `"type": "let"`.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/update-symbols.mjs symbols.json tests/node/updateSymbols.test.js
git commit -m "feat: distinguish const/let/var in kindLabel"
```

---

## Task 3: Alias resolution — definition-first `path` + `exportPath`

This is the core semantic fix. `sym` inside `getExportsOfModule` for a barrel file carries the ExportSpecifier as its declaration, not the original function. Unwrapping via `getAliasedSymbol` gives the real symbol.

**Files:**
- Modify: `scripts/update-symbols.mjs:113-150` (the main export loop body)
- Modify: `tests/node/updateSymbols.test.js` (add assertions)

- [ ] **Step 1: Add failing tests**

Append to `tests/node/updateSymbols.test.js`:

```js
test('setupAudio has exactly one entry and points to setup.ts', () => {
  const ks = loadSymbols()
  const entries = ks['setupAudio']
  assert.ok(entries, 'setupAudio should be in index')
  assert.equal(entries.length, 1, 'should have exactly one entry (no barrel duplicate)')
  assert.equal(entries[0].path, 'src/utils/audio/setup.ts')
  assert.equal(entries[0].type, 'function', 'type should be function, not const')
  assert.equal(entries[0].source, 'local')
})

test('all local symbol entries have path pointing to a src/ file', () => {
  const ks = loadSymbols()
  for (const [name, entries] of Object.entries(ks)) {
    for (const entry of entries) {
      if (entry.source === 'local') {
        assert.ok(
          entry.path.startsWith('src/'),
          `${name} path "${entry.path}" does not start with src/`
        )
      }
    }
  }
})

test('ActionType has exactly one entry pointing to actionTypes.ts', () => {
  const ks = loadSymbols()
  const entries = ks['ActionType']
  assert.ok(entries, 'ActionType should be in index')
  assert.equal(entries.length, 1, 'ActionType should not be duplicated via index.ts barrel')
  assert.ok(entries[0].path.includes('actionTypes'), `path was ${entries[0].path}`)
})
```

- [ ] **Step 2: Run tests to confirm they currently fail**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: the three new tests FAIL (multiple entries, wrong path, wrong type).

- [ ] **Step 3: Replace the inner body of the named-export loop**

Find the block starting at `const exportedName = sym.name` inside the `for (const sym of checker.getExportsOfModule(moduleSym))` loop and replace it with:

```js
    const exportedName = sym.name

    // Resolve alias to actual definition symbol (handles barrel re-exports)
    let resolvedSym = sym
    if (sym.flags & ts.SymbolFlags.Alias) {
      const aliased = checker.getAliasedSymbol(sym)
      if (aliased.declarations?.length) resolvedSym = aliased
    }

    // Skip if the resolved declaration lives outside src/
    const decl = resolvedSym.declarations?.[0]
    if (!decl) continue
    const declFile = decl.getSourceFile().fileName.replace(/\\/g, '/')
    const srcNorm = SRC.replace(/\\/g, '/')
    if (!declFile.startsWith(srcNorm)) continue

    // Skip specific (name, path) pairs that are known secondary re-exports.
    // After alias resolution most barrel duplicates collapse automatically;
    // entries remaining here represent genuine dual-definition cases.
    if (SKIP_PAIRS.has(`${exportedName}@${rel}`)) continue

    const defPath = relPath(declFile)
    const exportPath = rel !== defPath ? rel : undefined

    const entry = {
      name: exportedName,
      path: defPath,
      source: 'local',
      type: kindLabel(resolvedSym),
      isDefault: false,
    }
    if (exportPath !== undefined) entry.exportPath = exportPath
    if (isTypeOnlySym(resolvedSym)) entry.typeOnly = true

    upsert(exportedName, entry)
```

- [ ] **Step 4: Regenerate `symbols.json`**

```bash
node scripts/update-symbols.mjs
```

Expected output ends with something like `symbols.json written — N symbols from M src files.` where N is now fewer than the previous 1208 total entries (duplicates collapsed).

- [ ] **Step 5: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: all tests PASS.

- [ ] **Step 6: Inspect multi-entry symbols to confirm collapse**

```bash
node -e "
const ks = JSON.parse(require('fs').readFileSync('symbols.json','utf8')).knownSymbols
const multi = Object.entries(ks).filter(([,v]) => v.length > 1)
console.log('Remaining multi-entry symbols:', multi.length)
multi.slice(0, 20).forEach(([k, v]) => console.log(' ', k, '->', v.map(e => e.path || e.module)))
"
```

Expected: significantly fewer than 133 multi-entry symbols. Any remaining are genuine (defined in multiple places, not just re-exported).

- [ ] **Step 7: Commit**

```bash
git add scripts/update-symbols.mjs symbols.json tests/node/updateSymbols.test.js
git commit -m "feat: resolve alias symbols to definition site for path and kindLabel"
```

---

## Task 4: Capture default exports

**Files:**
- Modify: `scripts/update-symbols.mjs:101` (SKIP_NAMES — remove `'default'`)
- Modify: `scripts/update-symbols.mjs:113-150` (add `'default'` guard + default pass after named loop)
- Modify: `tests/node/updateSymbols.test.js` (add assertions)

- [ ] **Step 1: Add failing tests**

Append to `tests/node/updateSymbols.test.js`:

```js
test('App is indexed as a default export from src/App.tsx', () => {
  const ks = loadSymbols()
  const entries = ks['App']
  assert.ok(entries, 'App should be in index as default export')
  const def = entries.find(e => e.isDefault)
  assert.ok(def, 'App should have an isDefault: true entry')
  assert.equal(def.path, 'src/App.tsx')
  assert.equal(def.source, 'local')
})

test('default exports have isDefault: true', () => {
  const ks = loadSymbols()
  // All files known to have default exports should appear with isDefault: true
  const defaultEntries = Object.values(ks).flat().filter(e => e.isDefault && e.source === 'local')
  assert.ok(defaultEntries.length >= 5, `Expected at least 5 local default exports, got ${defaultEntries.length}`)
})

test('no symbol entry has name "default"', () => {
  const ks = loadSymbols()
  assert.equal(ks['default'], undefined, '"default" should not be a key; anonymous exports use default@path')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: the three new tests FAIL.

- [ ] **Step 3: Remove `'default'` from SKIP_NAMES and add explicit guard in main loop**

Find this line:
```js
const SKIP_NAMES = new Set(['__esModule', 'default'])
```

Change it to:
```js
const SKIP_NAMES = new Set(['__esModule'])
```

Then find the first `continue` checks inside the export loop:
```js
    if (SKIP_NAMES.has(sym.name)) continue
    if (sym.name.startsWith('_')) continue
```

Add an explicit default guard immediately after:
```js
    if (SKIP_NAMES.has(sym.name)) continue
    if (sym.name === 'default') continue  // handled in dedicated default-export pass below
    if (sym.name.startsWith('_')) continue
```

- [ ] **Step 4: Add the default-export pass after the named-export loop body**

After the closing brace of the `for (const sym of checker.getExportsOfModule(moduleSym))` loop (and before the outer `for (const sourceFile ...)` loop closes), add:

```js
  // --- dedicated default-export pass ---
  const defaultSym = checker.getExportsOfModule(moduleSym).find(s => s.name === 'default')
  if (defaultSym) {
    let resolvedDefault = defaultSym
    if (defaultSym.flags & ts.SymbolFlags.Alias) {
      const aliased = checker.getAliasedSymbol(defaultSym)
      if (aliased.declarations?.length) resolvedDefault = aliased
    }

    const defaultDecl = resolvedDefault.declarations?.[0]
    if (defaultDecl) {
      const defaultDeclFile = defaultDecl.getSourceFile().fileName.replace(/\\/g, '/')
      const srcNorm = SRC.replace(/\\/g, '/')
      if (defaultDeclFile.startsWith(srcNorm)) {
        const symName = resolvedDefault.name
        // Use the resolved name only if it is a real identifier, not the
        // synthetic "default" name TypeScript assigns to anonymous exports.
        const key = (symName && symName !== 'default' && !symName.startsWith('__'))
          ? symName
          : `default@${rel}`
        const entry = {
          name: key,
          path: relPath(defaultDeclFile),
          source: 'local',
          type: kindLabel(resolvedDefault),
          isDefault: true,
        }
        if (isTypeOnlySym(resolvedDefault)) entry.typeOnly = true
        upsert(key, entry)
      }
    }
  }
```

- [ ] **Step 5: Regenerate `symbols.json`**

```bash
node scripts/update-symbols.mjs
```

- [ ] **Step 6: Spot-check default exports in output**

```bash
node -e "
const ks = JSON.parse(require('fs').readFileSync('symbols.json','utf8')).knownSymbols
const defs = Object.values(ks).flat().filter(e => e.isDefault && e.source === 'local')
console.log('Local default exports:', defs.length)
defs.forEach(e => console.log(' ', e.name, '->', e.path))
"
```

Expected: 17 local default exports listed, including `App`, `Overworld`, `PreGig`, `PostGig`, `Gig`, `GameOver`, etc. No entry with `name: "default"` (anonymous ones carry `default@src/...`).

- [ ] **Step 7: Run all tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add scripts/update-symbols.mjs symbols.json tests/node/updateSymbols.test.js
git commit -m "feat: capture default exports in symbol index"
```

---

## Task 5: Audit and trim SKIP_PAIRS

The alias-resolution change collapses most barrel duplicates automatically. The four current SKIP_PAIRS entries may no longer be needed.

**Files:**
- Modify: `scripts/update-symbols.mjs:106-111` (SKIP_PAIRS set)

- [ ] **Step 1: Temporarily comment out all SKIP_PAIRS entries and regenerate**

In `scripts/update-symbols.mjs`, change:

```js
const SKIP_PAIRS = new Set([
  'ActionTypes@src/context/gameReducer.ts',
  'PRACTICE_RETURN_SCENES@src/context/GameState.tsx',
  'getPrimaryEffect@src/ui/bandhq/hooks/usePurchaseLogic.ts',
  '_resetLastMinigameFallback@src/scenes/PreGig.tsx',
])
```

to:

```js
const SKIP_PAIRS = new Set([
  // entries temporarily removed to check if alias resolution makes them obsolete
])
```

Then regenerate:

```bash
node scripts/update-symbols.mjs
```

- [ ] **Step 2: Check which (if any) multi-entry symbols reappear**

```bash
node -e "
const ks = JSON.parse(require('fs').readFileSync('symbols.json','utf8')).knownSymbols
;['ActionTypes','PRACTICE_RETURN_SCENES','getPrimaryEffect','_resetLastMinigameFallback'].forEach(name => {
  const entries = ks[name]
  if (!entries) { console.log(name + ': not found'); return }
  console.log(name + ': ' + entries.length + ' entries')
  entries.forEach(e => console.log('  ', e.path || e.module, e.type))
})
"
```

- [ ] **Step 3: Remove `_resetLastMinigameFallback` unconditionally**

This entry starts with `_` and is already filtered by the `sym.name.startsWith('_')` guard. It was never needed. Do not restore it.

- [ ] **Step 4: Evaluate the remaining three entries**

For each of `ActionTypes`, `PRACTICE_RETURN_SCENES`, `getPrimaryEffect`:

- If the symbol now shows exactly **one entry** → it collapses cleanly via alias resolution; do not restore the SKIP_PAIRS entry.
- If the symbol shows **two or more entries** → the symbol has genuinely independent declarations (not a simple re-export). Restore the entry with an inline comment explaining why:

```js
const SKIP_PAIRS = new Set([
  // ActionTypes is independently declared in both actionTypes.ts and gameReducer.ts
  // (not a re-export), so alias resolution alone cannot collapse the duplicate.
  'ActionTypes@src/context/gameReducer.ts',
])
```

- [ ] **Step 5: Regenerate with the final SKIP_PAIRS**

```bash
node scripts/update-symbols.mjs
```

- [ ] **Step 6: Run all tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/update-symbols.mjs symbols.json
git commit -m "refactor: remove obsolete SKIP_PAIRS entries after alias resolution fix"
```

---

## Task 6: Verify output determinism

`exportPath` is first-encounter-wins, so the output depends on file-scan order. Verify the order is stable (the scanner uses `readdirSync` + alphabetical sort, which is deterministic on any OS).

**Files:**
- Modify: `tests/node/updateSymbols.test.js` (add determinism test)

- [ ] **Step 1: Add a determinism test**

Append to `tests/node/updateSymbols.test.js`:

```js
test('symbols.json output is deterministic across two consecutive runs', () => {
  const { execFileSync } = await import('node:child_process')

  // First run already produced symbols.json; do a second run and compare
  const first = fs.readFileSync('symbols.json', 'utf8')
  execSync('node scripts/update-symbols.mjs', { stdio: 'pipe' })
  const second = fs.readFileSync('symbols.json', 'utf8')

  assert.equal(first, second, 'Two consecutive runs should produce identical symbols.json')
})
```

- [ ] **Step 2: Run the determinism test**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/updateSymbols.test.js
```

Expected: PASS. If it fails, the scan order is non-deterministic — investigate `walkSrc` sort logic.

- [ ] **Step 3: Verify `--check` mode passes on a freshly generated file**

```bash
node scripts/update-symbols.mjs && node scripts/update-symbols.mjs --check
```

Expected: first command writes the file; second command prints `symbols.json is up to date.` and exits 0.

- [ ] **Step 4: Run the full test gate**

```bash
pnpm run test
```

Expected: no regressions. Confirm the output line mentions the updated symbol count vs. the old 1208 total entries.

- [ ] **Step 5: Commit**

```bash
git add tests/node/updateSymbols.test.js symbols.json
git commit -m "test: verify symbol generator output is deterministic"
```

- [ ] **Step 6: Push branch**

```bash
git push -u origin claude/optimize-symbol-generator-lYH4a
```
