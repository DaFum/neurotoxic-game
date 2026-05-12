#!/usr/bin/env node
/**
 * Rebuilds symbols.json from the TypeScript compiler API.
 *
 * For each .ts/.tsx/.js/.jsx file under src/, uses checker.getExportsOfModule()
 * so that export * re-exports are fully resolved.
 *
 * External-module entries (react, i18next, etc.) are written from a static
 * allowlist at the bottom of this file and are never overwritten by the scan.
 *
 * Usage:
 *   node scripts/update-symbols.mjs          # full rebuild
 *   node scripts/update-symbols.mjs --check  # exit 1 if output would change
 */

import fs from 'fs'
import path from 'path'
import ts from 'typescript'

const ROOT = path.resolve('.')
const SRC  = path.join(ROOT, 'src')
const OUT  = path.join(ROOT, 'symbols.json')
const CHECK = process.argv.includes('--check')

// ---------------------------------------------------------------------------
// 1. Collect src files (including .d.ts for src/types)
// ---------------------------------------------------------------------------
function walkSrc(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) { walkSrc(full, out); continue }
    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

const srcFiles = walkSrc(SRC)

// ---------------------------------------------------------------------------
// 2. Build program
// ---------------------------------------------------------------------------
let program, checker
try {
  program = ts.createProgram(srcFiles, {
    allowJs: true,
    checkJs: false,
    noEmit: true,
    skipLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.Preserve,
  })
  checker = program.getTypeChecker()
} catch (err) {
  console.error(`update-symbols: ts.createProgram failed — ${err instanceof Error ? err.message : err}`)
  process.exit(1)
}

function relPath(abs) {
  return abs.replace(/\\/g, '/').replace(ROOT.replace(/\\/g, '/') + '/', '')
}

// Determine the declaration kind label from a symbol's declarations
function kindLabel(sym) {
  const decl = sym.declarations?.[0]
  if (!decl) return 'const'
  if (ts.isFunctionDeclaration(decl) || ts.isFunctionExpression(decl) || ts.isArrowFunction(decl)) return 'function'
  if (ts.isClassDeclaration(decl) || ts.isClassExpression(decl)) return 'class'
  if (ts.isInterfaceDeclaration(decl)) return 'interface'
  if (ts.isTypeAliasDeclaration(decl)) return 'type'
  if (ts.isEnumDeclaration(decl)) return 'enum'
  if (ts.isVariableDeclaration(decl) || ts.isBindingElement(decl)) {
    // Walk up to the VariableDeclarationList to read the keyword flags.
    // BindingElement covers destructured exports (e.g. export let { a } = obj).
    let list = decl.parent
    while (list && !ts.isVariableDeclarationList(list)) list = list.parent
    if (list) {
      if (list.flags & ts.NodeFlags.Const) return 'const'
      if (list.flags & ts.NodeFlags.Let)   return 'let'
      return 'var'
    }
  }
  return 'const'
}

function isTypeOnlySym(sym) {
  const flags = sym.flags
  return !!(flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.TypeParameter))
}

// Unwrap alias chains to the final non-alias symbol.
// Single getAliasedSymbol calls only resolve one hop; multi-layer barrels
// require looping until the symbol carries its own declaration.
function resolveAlias(checker, sym) {
  const seen = new Set()
  let cur = sym
  while (cur.flags & ts.SymbolFlags.Alias) {
    if (seen.has(cur)) break  // cycle guard
    seen.add(cur)
    const next = checker.getAliasedSymbol(cur)
    if (!next.declarations?.length) break  // no declarations — stop here
    cur = next
  }
  return cur
}

// ---------------------------------------------------------------------------
// 3. Walk each source file and collect its exports
// ---------------------------------------------------------------------------
/** @type {Record<string, object[]>} */
const knownSymbols = {}
/** @type {Record<string, Set<string>>} */
const knownSignatures = {}

function upsert(name, entry) {
  if (!knownSymbols[name]) {
    knownSymbols[name] = []
    knownSignatures[name] = new Set()
  }
  const sig = JSON.stringify({ path: entry.path ?? null, module: entry.module ?? null, isDefault: entry.isDefault })
  if (!knownSignatures[name].has(sig)) {
    knownSignatures[name].add(sig)
    knownSymbols[name].push(entry)
  }
}

const SKIP_NAMES = new Set(['__esModule'])

// Specific (name, path) pairs to exclude: re-exports from secondary/compat files
// where the symbol is already indexed from its canonical source.
// Format: 'symbolName@src/relative/path.ts'
// After alias resolution improvements, all known duplicates now collapse automatically.
const SKIP_PAIRS = new Set()

for (const sourceFile of program.getSourceFiles()) {
  const fp = sourceFile.fileName.replace(/\\/g, '/')
  if (!fp.startsWith(SRC.replace(/\\/g, '/'))) continue
  if (sourceFile.isDeclarationFile && !sourceFile.fileName.includes(SRC)) continue

  const rel = relPath(sourceFile.fileName)
  const moduleSym = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSym) continue

  // getExportsOfModule resolves export * re-exports transitively
  const moduleExports = checker.getExportsOfModule(moduleSym)
  for (const sym of moduleExports) {
    if (SKIP_NAMES.has(sym.name)) continue
    if (sym.name === 'default') continue  // handled in dedicated default-export pass below

    // Exclude underscore-prefixed test/internal helpers
    if (sym.name.startsWith('_')) continue

    const exportedName = sym.name

    // Resolve alias chain to actual definition symbol (handles multi-hop barrels)
    const resolvedSym = resolveAlias(checker, sym)

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
  }

  // --- dedicated default-export pass ---
  const defaultSym = moduleExports.find(s => s.name === 'default')
  if (defaultSym) {
    const resolvedDefault = resolveAlias(checker, defaultSym)

    const defaultDecl = resolvedDefault.declarations?.[0]
    if (defaultDecl) {
      const defaultDeclFile = defaultDecl.getSourceFile().fileName.replace(/\\/g, '/')
      const srcNorm = SRC.replace(/\\/g, '/')
      if (defaultDeclFile.startsWith(srcNorm)) {
        const symName = resolvedDefault.name
        // Use the resolved name only if it is a real identifier, not the
        // synthetic "default" name TypeScript assigns to anonymous exports.
        // For `export default function Foo()`, the symbol name stays 'default'
        // but the declaration carries the real name — fall back to that.
        const declName = /** @type {any} */ (defaultDecl).name?.text
        const defPath = relPath(defaultDeclFile)
        // Anchor anonymous fallback key to the definition file, not the scan
        // file, so re-exporting barrels don't produce multiple identities.
        const key = (symName && symName !== 'default' && !symName.startsWith('__'))
          ? symName
          : (declName && declName !== 'default' && !declName.startsWith('__'))
            ? declName
            : `default@${defPath}`
        const exportPath = rel !== defPath ? rel : undefined
        const entry = {
          name: key,
          path: defPath,
          source: 'local',
          type: kindLabel(resolvedDefault),
          isDefault: true,
        }
        if (exportPath !== undefined) entry.exportPath = exportPath
        if (isTypeOnlySym(resolvedDefault)) entry.typeOnly = true
        upsert(key, entry)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Merge static external-module allowlist
// ---------------------------------------------------------------------------
/** @type {Array<{name: string, module: string, isDefault: boolean, typeOnly?: boolean, isNamespace?: boolean}>} */
const EXTERNAL = [
  // React
  { name: 'React',                     module: 'react',          isDefault: true },
  { name: 'useState',                  module: 'react',          isDefault: false },
  { name: 'useEffect',                 module: 'react',          isDefault: false },
  { name: 'useRef',                    module: 'react',          isDefault: false },
  { name: 'useCallback',               module: 'react',          isDefault: false },
  { name: 'useMemo',                   module: 'react',          isDefault: false },
  { name: 'useReducer',                module: 'react',          isDefault: false },
  { name: 'useContext',                module: 'react',          isDefault: false },
  { name: 'useLayoutEffect',           module: 'react',          isDefault: false },
  { name: 'createContext',             module: 'react',          isDefault: false },
  { name: 'Suspense',                  module: 'react',          isDefault: false },
  { name: 'Fragment',                  module: 'react',          isDefault: false },
  { name: 'ReactNode',                 module: 'react',          isDefault: false, typeOnly: true },
  { name: 'ReactElement',              module: 'react',          isDefault: false, typeOnly: true },
  { name: 'FC',                        module: 'react',          isDefault: false, typeOnly: true },
  { name: 'ComponentType',             module: 'react',          isDefault: false, typeOnly: true },
  { name: 'RefObject',                 module: 'react',          isDefault: false, typeOnly: true },
  { name: 'MutableRefObject',          module: 'react',          isDefault: false, typeOnly: true },
  { name: 'Dispatch',                  module: 'react',          isDefault: false, typeOnly: true },
  { name: 'MouseEvent',                module: 'react',          isDefault: false, typeOnly: true },
  { name: 'KeyboardEvent',             module: 'react',          isDefault: false, typeOnly: true },
  { name: 'PointerEvent',              module: 'react',          isDefault: false, typeOnly: true },
  { name: 'ChangeEvent',               module: 'react',          isDefault: false, typeOnly: true },
  { name: 'SyntheticEvent',            module: 'react',          isDefault: false, typeOnly: true },
  { name: 'ErrorInfo',                 module: 'react',          isDefault: false, typeOnly: true },
  { name: 'HTMLAttributes',            module: 'react',          isDefault: false, typeOnly: true },
  { name: 'SVGProps',                  module: 'react',          isDefault: false, typeOnly: true },
  { name: 'MouseEventHandler',         module: 'react',          isDefault: false, typeOnly: true },
  { name: 'ComponentPropsWithoutRef',  module: 'react',          isDefault: false, typeOnly: true },
  // i18next
  { name: 'TFunction',                 module: 'i18next',        isDefault: false, typeOnly: true },
  // react-i18next
  { name: 'useTranslation',            module: 'react-i18next',  isDefault: false },
  { name: 'Trans',                     module: 'react-i18next',  isDefault: false },
  // framer-motion
  { name: 'motion',                    module: 'framer-motion',  isDefault: false },
  { name: 'AnimatePresence',           module: 'framer-motion',  isDefault: false },
  { name: 'Variants',                  module: 'framer-motion',  isDefault: false, typeOnly: true },
  { name: 'HTMLMotionProps',           module: 'framer-motion',  isDefault: false, typeOnly: true },
  { name: 'Transition',                module: 'framer-motion',  isDefault: false, typeOnly: true },
  // Tone.js
  { name: 'Tone',                      module: 'tone',           isDefault: false, isNamespace: true },
  // @tonejs/midi
  { name: 'ToneJsMidi',                module: '@tonejs/midi',   isDefault: false, isNamespace: true },
  // pixi.js
  { name: 'PIXI',                      module: 'pixi.js',        isDefault: false, isNamespace: true },
  // vitest
  { name: 'describe',  module: 'vitest', isDefault: false },
  { name: 'it',        module: 'vitest', isDefault: false },
  { name: 'test',      module: 'vitest', isDefault: false },
  { name: 'expect',    module: 'vitest', isDefault: false },
  { name: 'vi',        module: 'vitest', isDefault: false },
  { name: 'beforeEach', module: 'vitest', isDefault: false },
  { name: 'afterEach',  module: 'vitest', isDefault: false },
  { name: 'beforeAll',  module: 'vitest', isDefault: false },
  { name: 'afterAll',   module: 'vitest', isDefault: false },
  // node:assert
  { name: 'assert',    module: 'node:assert/strict', isDefault: true },
]

for (const e of EXTERNAL) {
  upsert(e.name, { ...e, source: 'external' })
}

// ---------------------------------------------------------------------------
// 5. Write or check
// ---------------------------------------------------------------------------
const output = JSON.stringify({ knownSymbols }, null, 2)

if (CHECK) {
  const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''
  if (existing === output) {
    console.log('symbols.json is up to date.')
    process.exit(0)
  }
  console.error('symbols.json is out of date. Run: node scripts/update-symbols.mjs')
  process.exit(1)
}

fs.writeFileSync(OUT, output)
console.log(`symbols.json written — ${Object.keys(knownSymbols).length} symbols from ${srcFiles.length} src files.`)
