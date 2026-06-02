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
const SRC = path.join(ROOT, 'src')
const OUT = path.join(ROOT, 'symbols.json')
const CHECK = process.argv.includes('--check')

function normalizePath(fileName) {
  return fileName.replace(/\\/g, '/')
}

const ROOT_NORM = normalizePath(ROOT)
const SRC_NORM = normalizePath(SRC)
const SRC_PREFIX = `${SRC_NORM}/`

/** Returns true only for files genuinely inside src/ (not src-generated/ etc.) */
function isUnderSrc(fileName) {
  const f = normalizePath(fileName)
  return f === SRC_NORM || f.startsWith(SRC_PREFIX)
}

// ---------------------------------------------------------------------------
// 1. Collect src files (including .d.ts for src/types)
// ---------------------------------------------------------------------------
const SOURCE_FILE_RE = /\.(ts|tsx|js|jsx)$/
const IGNORED_SOURCE_FILE_RE = /\.(test|spec|stories)\.(ts|tsx|js|jsx)$/

function walkSrc(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkSrc(full, out)
      continue
    }
    if (
      SOURCE_FILE_RE.test(entry.name) &&
      !IGNORED_SOURCE_FILE_RE.test(entry.name)
    ) {
      out.push(full)
    }
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
    jsx: ts.JsxEmit.Preserve
  })
  checker = program.getTypeChecker()
} catch (err) {
  console.error(
    `update-symbols: ts.createProgram failed — ${err instanceof Error ? err.message : err}`
  )
  process.exit(1)
}

function relPath(abs) {
  const normalized = normalizePath(abs)
  const rootPrefix = `${ROOT_NORM}/`
  return normalized.startsWith(rootPrefix)
    ? normalized.slice(rootPrefix.length)
    : normalized
}

// Determine the declaration kind label from a symbol's declarations
function kindLabel(sym) {
  const decl = sym.declarations?.[0]
  if (!decl) return 'const'
  if (
    ts.isFunctionDeclaration(decl) ||
    ts.isFunctionExpression(decl) ||
    ts.isArrowFunction(decl)
  )
    return 'function'
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
      if (list.flags & ts.NodeFlags.Let) return 'let'
      return 'var'
    }
  }
  return 'const'
}

function isTypeOnlySym(sym) {
  const flags = sym.flags
  return !!(
    flags &
    (ts.SymbolFlags.Interface |
      ts.SymbolFlags.TypeAlias |
      ts.SymbolFlags.TypeParameter)
  )
}

// Detects `export type { Foo }` — the type-only flag lives on the ExportSpecifier
// or ExportDeclaration node and is lost after alias resolution.
function isTypeOnlyExport(sym) {
  return !!sym.declarations?.some(
    decl =>
      (ts.isExportSpecifier(decl) && decl.isTypeOnly) ||
      (ts.isExportDeclaration(decl) && decl.isTypeOnly)
  )
}

// Unwrap alias chains to the final non-alias symbol.
// Single getAliasedSymbol calls only resolve one hop; multi-layer barrels
// require looping until the symbol carries its own declaration.
function resolveAlias(checker, sym) {
  const seen = new Set()
  let cur = sym
  while (cur.flags & ts.SymbolFlags.Alias) {
    if (seen.has(cur)) break // cycle guard
    seen.add(cur)
    const next = checker.getAliasedSymbol(cur)
    if (!next.declarations?.length) break // no declarations — stop here
    cur = next
  }
  return cur
}

const TYPE_FORMAT_FLAGS =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  ts.TypeFormatFlags.OmitParameterModifiers |
  ts.TypeFormatFlags.WriteArrowStyleSignature

function declarationKey(decl) {
  return `${relPath(decl.getSourceFile().fileName)}:${decl.pos}:${decl.end}`
}

function addToMapSet(map, key, value) {
  if (!map.has(key)) map.set(key, new Set())
  map.get(key).add(value)
}

function withoutUndefined(type) {
  if (!type.isUnion()) return type
  const narrowed = type.types.filter(
    part => !(part.flags & ts.TypeFlags.Undefined)
  )
  if (narrowed.length === type.types.length) return type
  if (narrowed.length === 1) return narrowed[0]
  return checker.getUnionType(narrowed, ts.UnionReduction.None)
}

function typeString(type, node, optional = false) {
  const printableType = optional ? withoutUndefined(type) : type
  return checker
    .typeToString(printableType, node, TYPE_FORMAT_FLAGS)
    .replace(/import\(["'][^"']+["']\)\./g, '')
}

function declarationLocation(decl) {
  const sourceFile = decl.getSourceFile()
  const start = sourceFile.getLineAndCharacterOfPosition(
    decl.getStart(sourceFile)
  )
  const end = sourceFile.getLineAndCharacterOfPosition(decl.getEnd())
  return {
    lineStart: start.line + 1,
    lineEnd: end.line + 1,
    columnStart: start.character + 1,
    columnEnd: end.character + 1
  }
}

function jsDocText(comment) {
  if (typeof comment === 'string') return comment
  if (Array.isArray(comment)) {
    return comment
      .map(part => (typeof part.text === 'string' ? part.text : ''))
      .join('')
  }
  return ''
}

function normalizeDocText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function jsDocHosts(decl) {
  const hosts = [decl]
  if (ts.isVariableDeclaration(decl)) {
    let parent = decl.parent
    while (parent && !ts.isVariableStatement(parent)) parent = parent.parent
    if (parent) hosts.push(parent)
  }
  if (ts.isBindingElement(decl)) {
    let parent = decl.parent
    while (parent && !ts.isVariableStatement(parent)) parent = parent.parent
    if (parent) hosts.push(parent)
  }
  return hosts
}

function serializeJsDoc(decl) {
  const docs = jsDocHosts(decl).flatMap(host => host.jsDoc ?? [])
  if (docs.length === 0) return undefined

  const summary = normalizeDocText(
    docs
      .map(doc => jsDocText(doc.comment))
      .filter(Boolean)
      .join(' ')
  )
  const tags = docs.flatMap(doc =>
    Array.from(doc.tags ?? [], tag => {
      const entry = { name: tag.tagName.getText(decl.getSourceFile()) }
      if ('name' in tag && tag.name) entry.target = tag.name.getText()
      const text = normalizeDocText(jsDocText(tag.comment))
      if (text) entry.text = text
      return entry
    })
  )

  const result = {}
  if (summary) result.summary = summary
  if (tags.length > 0) result.tags = tags
  return Object.keys(result).length > 0 ? result : undefined
}

function isReactHocExpression(expression) {
  return (
    (ts.isIdentifier(expression) &&
      (expression.text === 'memo' || expression.text === 'forwardRef')) ||
    (ts.isPropertyAccessExpression(expression) &&
      (expression.name.text === 'memo' ||
        expression.name.text === 'forwardRef'))
  )
}

function unwrapReactHocInitializer(initializer) {
  let current = initializer
  while (
    ts.isCallExpression(current) &&
    current.arguments.length > 0 &&
    isReactHocExpression(current.expression)
  ) {
    current = current.arguments[0]
  }
  return current
}

function callableDeclaration(decl) {
  if (
    ts.isFunctionDeclaration(decl) ||
    ts.isFunctionExpression(decl) ||
    ts.isArrowFunction(decl) ||
    ts.isMethodDeclaration(decl)
  ) {
    return decl
  }
  if (ts.isVariableDeclaration(decl) && decl.initializer) {
    const initializer = unwrapReactHocInitializer(decl.initializer)
    if (
      ts.isFunctionExpression(initializer) ||
      ts.isArrowFunction(initializer)
    ) {
      return initializer
    }
  }
  return undefined
}

function serializeSignature(sym, decl) {
  const callable = callableDeclaration(decl)
  const signature =
    (callable ? checker.getSignatureFromDeclaration(callable) : undefined) ??
    checker.getTypeOfSymbolAtLocation(sym, decl).getCallSignatures()[0]
  if (!signature) return undefined

  const parameterDecls = callable?.parameters ?? []
  return {
    parameters: signature.getParameters().map((param, index) => {
      const paramDecl = param.valueDeclaration ?? parameterDecls[index]
      const optional = !!(
        param.flags & ts.SymbolFlags.Optional ||
        paramDecl?.questionToken ||
        paramDecl?.initializer
      )
      const name =
        paramDecl && ts.isParameter(paramDecl)
          ? paramDecl.name.getText(paramDecl.getSourceFile())
          : param.name
      return {
        name,
        optional,
        rest: !!paramDecl?.dotDotDotToken,
        type: typeString(
          checker.getTypeOfSymbolAtLocation(param, paramDecl ?? decl),
          paramDecl ?? decl,
          optional
        )
      }
    }),
    returnType: typeString(signature.getReturnType(), callable ?? decl, false)
  }
}

function hasReadonlyModifier(decl) {
  return !!decl.modifiers?.some(
    modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword
  )
}

function typeMayHaveObjectProperties(type) {
  if (type.flags & ts.TypeFlags.Object) return true
  if (type.flags & (ts.TypeFlags.Union | ts.TypeFlags.Intersection)) {
    return type.types?.some(typeMayHaveObjectProperties) ?? false
  }
  return false
}

function typeNodeMayHaveObjectProperties(node) {
  if (ts.isTypeLiteralNode(node) || ts.isMappedTypeNode(node)) return true
  if (ts.isParenthesizedTypeNode(node)) {
    return typeNodeMayHaveObjectProperties(node.type)
  }
  if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
    return node.types.some(typeNodeMayHaveObjectProperties)
  }
  if (
    ts.isTypeReferenceNode(node) ||
    ts.isIndexedAccessTypeNode(node) ||
    ts.isConditionalTypeNode(node)
  ) {
    return typeMayHaveObjectProperties(checker.getTypeFromTypeNode(node))
  }
  return false
}

function shouldSerializeTypeAliasProperties(decl) {
  return (
    ts.isInterfaceDeclaration(decl) ||
    (ts.isTypeAliasDeclaration(decl) &&
      typeNodeMayHaveObjectProperties(decl.type))
  )
}

function propertyDeclaration(property) {
  return property.valueDeclaration ?? property.declarations?.[0]
}

function serializeProperty(property, fallbackNode) {
  const propertyDecl = propertyDeclaration(property)
  if (!propertyDecl || !isUnderSrc(propertyDecl.getSourceFile().fileName)) {
    return undefined
  }

  const optional = !!(
    property.flags & ts.SymbolFlags.Optional || propertyDecl.questionToken
  )
  const entry = {
    name: property.name,
    optional,
    type: typeString(
      checker.getTypeOfSymbolAtLocation(property, propertyDecl),
      propertyDecl ?? fallbackNode,
      optional
    )
  }
  if (hasReadonlyModifier(propertyDecl)) entry.readonly = true
  const jsDoc = serializeJsDoc(propertyDecl)
  if (jsDoc) entry.jsDoc = jsDoc
  return entry
}

function shouldSerializeIndexSignatures(type) {
  return !!(
    type.flags & ts.TypeFlags.Object &&
    !checker.isArrayType(type) &&
    !checker.isTupleType(type)
  )
}

function serializePropertiesFromType(type, node) {
  const properties = checker
    .getPropertiesOfType(type)
    .map(property => serializeProperty(property, node))
    .filter(Boolean)

  if (shouldSerializeIndexSignatures(type)) {
    const stringIndexType = type.getStringIndexType()
    if (stringIndexType) {
      properties.push({
        name: '[key: string]',
        optional: false,
        type: typeString(stringIndexType, node, false)
      })
    }

    const numberIndexType = type.getNumberIndexType()
    if (numberIndexType) {
      properties.push({
        name: '[key: number]',
        optional: false,
        type: typeString(numberIndexType, node, false)
      })
    }
  }

  if (properties.length === 0) return undefined
  return properties.sort((a, b) => a.name.localeCompare(b.name))
}

function serializeProperties(decl) {
  if (!shouldSerializeTypeAliasProperties(decl)) return undefined

  return serializePropertiesFromType(checker.getTypeAtLocation(decl), decl)
}

function unionVariantTypeNodes(node) {
  if (ts.isParenthesizedTypeNode(node)) return unionVariantTypeNodes(node.type)
  return ts.isUnionTypeNode(node) ? Array.from(node.types) : undefined
}

function variantKind(type) {
  if (type.flags & ts.TypeFlags.Null) return 'null'
  if (type.flags & ts.TypeFlags.Undefined) return 'undefined'
  if (
    type.flags &
    (ts.TypeFlags.StringLiteral |
      ts.TypeFlags.NumberLiteral |
      ts.TypeFlags.BooleanLiteral |
      ts.TypeFlags.BigIntLiteral |
      ts.TypeFlags.EnumLiteral)
  ) {
    return 'literal'
  }
  if (
    type.flags &
    (ts.TypeFlags.StringLike |
      ts.TypeFlags.NumberLike |
      ts.TypeFlags.BooleanLike |
      ts.TypeFlags.BigIntLike |
      ts.TypeFlags.ESSymbolLike)
  ) {
    return 'primitive'
  }
  if (type.flags & ts.TypeFlags.Object) return 'object'
  return 'other'
}

function serializeVariants(decl) {
  if (!ts.isTypeAliasDeclaration(decl)) return undefined

  const variantNodes = unionVariantTypeNodes(decl.type)
  if (!variantNodes) return undefined

  const variants = variantNodes.map(node => {
    const type = checker.getTypeFromTypeNode(node)
    const properties = serializePropertiesFromType(type, node)
    const entry = {
      kind: properties ? 'object' : variantKind(type),
      type: typeString(type, node, false)
    }
    if (properties) entry.properties = properties
    return entry
  })

  return variants.some(variant => variant.kind === 'object')
    ? variants
    : undefined
}

function containsJsx(node) {
  let found = false
  const visit = child => {
    if (found) return
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      found = true
      return
    }
    ts.forEachChild(child, visit)
  }
  visit(node)
  return found
}

function isReactComponent(name, decl, signature) {
  if (!/^[A-Z]/.test(name)) return false
  if (containsJsx(decl)) return true
  const fileName = decl.getSourceFile().fileName
  if (!/\.(tsx|jsx)$/.test(fileName)) return false
  return !!signature?.returnType.match(
    /\b(JSX\.Element|ReactElement|Element)\b/
  )
}

function addDeclarationMetadata(entry, sym, decl, exportedName, isDefault) {
  Object.assign(entry, declarationLocation(decl))
  entry.exportKind = isDefault ? 'default' : 'named'
  entry.exportedName = isDefault ? 'default' : exportedName

  const jsDoc = serializeJsDoc(decl)
  if (jsDoc) entry.jsDoc = jsDoc

  const signature = serializeSignature(sym, decl)
  if (signature) {
    entry.parameters = signature.parameters
    entry.returnType = signature.returnType
  }

  const properties = serializeProperties(decl)
  if (properties) entry.properties = properties

  const variants = serializeVariants(decl)
  if (variants) entry.variants = variants

  if (/^use[A-Z0-9]/.test(exportedName) && signature) entry.isHook = true
  if (isReactComponent(exportedName, decl, signature)) entry.isComponent = true
}

// ---------------------------------------------------------------------------
// 3. Walk each source file and collect its exports
// ---------------------------------------------------------------------------
/** @type {Record<string, object[]>} */
const knownSymbols = {}
/** @type {Record<string, Set<string>>} */
const knownSignatures = {}
const localEntryRefs = []
const localEntryRefEntries = new Set()
const entriesByDeclKey = new Map()
const dependenciesByEntry = new Map()
const usedByByEntry = new Map()

function upsert(name, entry) {
  if (!knownSymbols[name]) {
    knownSymbols[name] = []
    knownSignatures[name] = new Set()
  }
  const sig = JSON.stringify({
    path: entry.path ?? null,
    module: entry.module ?? null,
    isDefault: entry.isDefault
  })
  if (!knownSignatures[name].has(sig)) {
    knownSignatures[name].add(sig)
    knownSymbols[name].push(entry)
    return entry
  } else if (entry.exportPath) {
    // Definition files are typically scanned before their barrels, so the
    // first entry wins the dedup but has no exportPath. When a barrel scan
    // provides one, merge it into the existing entry (first barrel wins).
    const existing = knownSymbols[name].find(
      e =>
        (e.path ?? null) === (entry.path ?? null) &&
        (e.module ?? null) === (entry.module ?? null) &&
        e.isDefault === entry.isDefault
    )
    if (existing && !existing.exportPath) existing.exportPath = entry.exportPath
    return existing ?? entry
  }
  return knownSymbols[name].find(
    e =>
      (e.path ?? null) === (entry.path ?? null) &&
      (e.module ?? null) === (entry.module ?? null) &&
      e.isDefault === entry.isDefault
  )
}

function registerLocalEntry(entry, sym, decl) {
  const key = declarationKey(decl)
  addToMapSet(entriesByDeclKey, key, entry)
  if (!localEntryRefEntries.has(entry)) {
    localEntryRefEntries.add(entry)
    localEntryRefs.push({ entry, sym, decl })
  }
}

function targetEntriesForNode(node, importedName) {
  const sym = checker.getSymbolAtLocation(node)
  if (!sym) return []
  const resolved = resolveAlias(checker, sym)
  const decl = resolved.valueDeclaration ?? resolved.declarations?.[0]
  if (!decl) return []
  const declFile = normalizePath(decl.getSourceFile().fileName)
  if (!isUnderSrc(declFile)) return []

  const entries = Array.from(entriesByDeclKey.get(declarationKey(decl)) ?? [])
  if (entries.length === 0 || importedName === undefined) return entries

  const filtered = entries.filter(entry =>
    importedName === 'default' ? entry.isDefault : entry.name === importedName
  )
  return filtered.length > 0 ? filtered : entries
}

function addDependency(entry, dependencyName) {
  if (!dependenciesByEntry.has(entry)) dependenciesByEntry.set(entry, new Set())
  dependenciesByEntry.get(entry).add(dependencyName)
}

function addUsedBy(entry, usage) {
  if (!usedByByEntry.has(entry)) usedByByEntry.set(entry, new Map())
  usedByByEntry.get(entry).set(JSON.stringify(usage), usage)
}

const SKIP_NAMES = new Set(['__esModule'])

// Specific (name, path) pairs to exclude: re-exports from secondary/compat files
// where the symbol is already indexed from its canonical source.
// Format: 'symbolName@src/relative/path.ts'
// After alias resolution improvements, all known duplicates now collapse automatically.
const SKIP_PAIRS = new Set()

for (const srcFilePath of srcFiles) {
  const sourceFile = program.getSourceFile(srcFilePath)
  if (!sourceFile) continue
  const fp = normalizePath(sourceFile.fileName)
  if (!isUnderSrc(fp)) continue

  const rel = relPath(sourceFile.fileName)
  const moduleSym = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSym) continue

  // getExportsOfModule resolves export * re-exports transitively
  const moduleExports = checker.getExportsOfModule(moduleSym)
  for (const sym of moduleExports) {
    if (SKIP_NAMES.has(sym.name)) continue
    if (sym.name === 'default') continue // handled in dedicated default-export pass below

    // Exclude underscore-prefixed test/internal helpers
    if (sym.name.startsWith('_')) continue

    const exportedName = sym.name

    // Resolve alias chain to actual definition symbol (handles multi-hop barrels)
    const resolvedSym = resolveAlias(checker, sym)

    // Skip if the resolved declaration lives outside src/
    const decl = resolvedSym.declarations?.[0]
    if (!decl) continue
    const declFile = normalizePath(decl.getSourceFile().fileName)
    if (!isUnderSrc(declFile)) continue

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
      isDefault: false
    }
    addDeclarationMetadata(entry, resolvedSym, decl, exportedName, false)
    if (exportPath !== undefined) entry.exportPath = exportPath
    if (isTypeOnlyExport(sym) || isTypeOnlySym(resolvedSym))
      entry.typeOnly = true

    const storedEntry = upsert(exportedName, entry)
    registerLocalEntry(storedEntry, resolvedSym, decl)
  }

  // --- dedicated default-export pass ---
  const defaultSym = moduleExports.find(s => s.name === 'default')
  if (defaultSym) {
    const defaultTypeOnly = isTypeOnlyExport(defaultSym)
    const resolvedDefault = resolveAlias(checker, defaultSym)

    const defaultDecl = resolvedDefault.declarations?.[0]
    if (defaultDecl) {
      const defaultDeclFile = normalizePath(
        defaultDecl.getSourceFile().fileName
      )
      if (isUnderSrc(defaultDeclFile)) {
        const symName = resolvedDefault.name
        // Use the resolved name only if it is a real identifier, not the
        // synthetic "default" name TypeScript assigns to anonymous exports.
        // For `export default function Foo()`, the symbol name stays 'default'
        // but the declaration carries the real name — fall back to that.
        const declName = /** @type {any} */ (defaultDecl).name?.text
        const defPath = relPath(defaultDeclFile)
        // Anchor anonymous fallback key to the definition file, not the scan
        // file, so re-exporting barrels don't produce multiple identities.
        const key =
          symName && symName !== 'default' && !symName.startsWith('__')
            ? symName
            : declName && declName !== 'default' && !declName.startsWith('__')
              ? declName
              : `default@${defPath}`
        const exportPath = rel !== defPath ? rel : undefined
        const entry = {
          name: key,
          path: defPath,
          source: 'local',
          type: kindLabel(resolvedDefault),
          isDefault: true
        }
        addDeclarationMetadata(entry, resolvedDefault, defaultDecl, key, true)
        if (exportPath !== undefined) entry.exportPath = exportPath
        if (defaultTypeOnly || isTypeOnlySym(resolvedDefault))
          entry.typeOnly = true
        const storedEntry = upsert(key, entry)
        registerLocalEntry(storedEntry, resolvedDefault, defaultDecl)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Add import and call graph metadata
// ---------------------------------------------------------------------------
function collectImportUsage(sourceFile) {
  const rel = relPath(sourceFile.fileName)
  const visitImport = node => {
    if (!ts.isImportDeclaration(node)) return
    if (!ts.isStringLiteral(node.moduleSpecifier)) return
    if (!node.moduleSpecifier.text.startsWith('.')) return

    const importClause = node.importClause
    if (!importClause) return
    const clauseTypeOnly = !!importClause.isTypeOnly

    if (importClause.name) {
      for (const entry of targetEntriesForNode(importClause.name, 'default')) {
        addUsedBy(entry, {
          path: rel,
          importedAs: importClause.name.text,
          typeOnly: clauseTypeOnly
        })
      }
    }

    const bindings = importClause.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) return

    for (const specifier of bindings.elements) {
      const importedName = specifier.propertyName?.text ?? specifier.name.text
      const usage = {
        path: rel,
        importedAs: specifier.name.text
      }
      if (specifier.name.text !== importedName)
        usage.importedName = importedName
      if (clauseTypeOnly || specifier.isTypeOnly) usage.typeOnly = true

      for (const entry of targetEntriesForNode(specifier.name, importedName)) {
        addUsedBy(entry, usage)
      }
    }
  }

  ts.forEachChild(sourceFile, visitImport)
}

function dependencySymbolNode(expression) {
  if (ts.isIdentifier(expression)) return expression
  if (ts.isPropertyAccessExpression(expression)) return expression.name
  return undefined
}

function collectDeclarationDependencies({ entry, decl }) {
  const addTargets = node => {
    for (const target of targetEntriesForNode(node, undefined)) {
      if (target !== entry) addDependency(entry, target.name)
    }
  }

  const visit = node => {
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const targetNode = node.expression
        ? dependencySymbolNode(node.expression)
        : undefined
      if (targetNode) addTargets(targetNode)
    } else if (
      ts.isJsxOpeningElement(node) ||
      ts.isJsxSelfClosingElement(node)
    ) {
      const targetNode = dependencySymbolNode(node.tagName)
      if (targetNode) addTargets(targetNode)
    }
    ts.forEachChild(node, visit)
  }

  visit(decl)
}

for (const srcFilePath of srcFiles) {
  const sourceFile = program.getSourceFile(srcFilePath)
  if (sourceFile && isUnderSrc(sourceFile.fileName))
    collectImportUsage(sourceFile)
}

for (const ref of localEntryRefs) collectDeclarationDependencies(ref)

for (const [entry, dependencies] of dependenciesByEntry) {
  const sorted = Array.from(dependencies).sort((a, b) => a.localeCompare(b))
  if (sorted.length > 0) entry.dependencies = sorted
}

function usageSortKey(usage) {
  return [
    usage.path,
    usage.importedAs,
    usage.importedName ?? '',
    usage.typeOnly ? '1' : '0'
  ].join('\0')
}

for (const [entry, usageByKey] of usedByByEntry) {
  const sorted = Array.from(usageByKey.values()).sort((a, b) =>
    usageSortKey(a).localeCompare(usageSortKey(b))
  )
  if (sorted.length > 0) entry.usedBy = sorted
}

// ---------------------------------------------------------------------------
// 5. Merge static external-module allowlist
// ---------------------------------------------------------------------------
/** @type {Array<{name: string, module: string, isDefault: boolean, typeOnly?: boolean, isNamespace?: boolean}>} */
const EXTERNAL = [
  // React
  { name: 'React', module: 'react', isDefault: true },
  { name: 'useState', module: 'react', isDefault: false },
  { name: 'useEffect', module: 'react', isDefault: false },
  { name: 'useRef', module: 'react', isDefault: false },
  { name: 'useCallback', module: 'react', isDefault: false },
  { name: 'useMemo', module: 'react', isDefault: false },
  { name: 'useReducer', module: 'react', isDefault: false },
  { name: 'useContext', module: 'react', isDefault: false },
  { name: 'useLayoutEffect', module: 'react', isDefault: false },
  { name: 'createContext', module: 'react', isDefault: false },
  { name: 'Suspense', module: 'react', isDefault: false },
  { name: 'Fragment', module: 'react', isDefault: false },
  { name: 'ReactNode', module: 'react', isDefault: false, typeOnly: true },
  { name: 'ReactElement', module: 'react', isDefault: false, typeOnly: true },
  { name: 'FC', module: 'react', isDefault: false, typeOnly: true },
  { name: 'ComponentType', module: 'react', isDefault: false, typeOnly: true },
  { name: 'RefObject', module: 'react', isDefault: false, typeOnly: true },
  {
    name: 'MutableRefObject',
    module: 'react',
    isDefault: false,
    typeOnly: true
  },
  { name: 'Dispatch', module: 'react', isDefault: false, typeOnly: true },
  { name: 'MouseEvent', module: 'react', isDefault: false, typeOnly: true },
  { name: 'KeyboardEvent', module: 'react', isDefault: false, typeOnly: true },
  { name: 'PointerEvent', module: 'react', isDefault: false, typeOnly: true },
  { name: 'ChangeEvent', module: 'react', isDefault: false, typeOnly: true },
  { name: 'SyntheticEvent', module: 'react', isDefault: false, typeOnly: true },
  { name: 'ErrorInfo', module: 'react', isDefault: false, typeOnly: true },
  { name: 'HTMLAttributes', module: 'react', isDefault: false, typeOnly: true },
  { name: 'SVGProps', module: 'react', isDefault: false, typeOnly: true },
  {
    name: 'MouseEventHandler',
    module: 'react',
    isDefault: false,
    typeOnly: true
  },
  {
    name: 'ComponentPropsWithoutRef',
    module: 'react',
    isDefault: false,
    typeOnly: true
  },
  // i18next
  { name: 'TFunction', module: 'i18next', isDefault: false, typeOnly: true },
  // react-i18next
  { name: 'useTranslation', module: 'react-i18next', isDefault: false },
  { name: 'Trans', module: 'react-i18next', isDefault: false },
  // framer-motion
  { name: 'motion', module: 'framer-motion', isDefault: false },
  { name: 'AnimatePresence', module: 'framer-motion', isDefault: false },
  {
    name: 'Variants',
    module: 'framer-motion',
    isDefault: false,
    typeOnly: true
  },
  {
    name: 'HTMLMotionProps',
    module: 'framer-motion',
    isDefault: false,
    typeOnly: true
  },
  {
    name: 'Transition',
    module: 'framer-motion',
    isDefault: false,
    typeOnly: true
  },
  // Tone.js
  { name: 'Tone', module: 'tone', isDefault: false, isNamespace: true },
  // @tonejs/midi
  {
    name: 'ToneJsMidi',
    module: '@tonejs/midi',
    isDefault: false,
    isNamespace: true
  },
  // pixi.js
  { name: 'PIXI', module: 'pixi.js', isDefault: false, isNamespace: true },
  // vitest
  { name: 'describe', module: 'vitest', isDefault: false },
  { name: 'it', module: 'vitest', isDefault: false },
  { name: 'test', module: 'vitest', isDefault: false },
  { name: 'expect', module: 'vitest', isDefault: false },
  { name: 'vi', module: 'vitest', isDefault: false },
  { name: 'beforeEach', module: 'vitest', isDefault: false },
  { name: 'afterEach', module: 'vitest', isDefault: false },
  { name: 'beforeAll', module: 'vitest', isDefault: false },
  { name: 'afterAll', module: 'vitest', isDefault: false },
  // node:assert
  { name: 'assert', module: 'node:assert/strict', isDefault: true }
]

for (const e of EXTERNAL) {
  upsert(e.name, {
    ...e,
    source: 'external',
    exportKind: e.isDefault ? 'default' : 'named',
    exportedName: e.isDefault ? 'default' : e.name
  })
}

// ---------------------------------------------------------------------------
// 6. Write or check
// ---------------------------------------------------------------------------

// Sort an entry object's keys alphabetically so the JSON layout is stable
// regardless of the insertion order in upsert().
function sortKeys(obj) {
  return Object.keys(obj)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}

// Stable per-entry sort key: external entries by module, local entries by
// path then exportPath; default vs named is tiebroken last. Ensures arrays
// are deterministic even if scan order shifts.
function entrySortKey(e) {
  return [
    e.source ?? '',
    e.module ?? '',
    e.path ?? '',
    e.exportPath ?? '',
    e.isDefault ? '1' : '0'
  ].join(' ')
}

// Sort the symbols object keys alphabetically to ensure deterministic diffs
const sortedKnownSymbols = Object.keys(knownSymbols)
  .sort((a, b) => a.localeCompare(b))
  .reduce((acc, key) => {
    const entries = knownSymbols[key]
      .slice()
      .sort((a, b) => entrySortKey(a).localeCompare(entrySortKey(b)))
      .map(sortKeys)
    acc[key] = entries
    return acc
  }, {})

const output = JSON.stringify({ knownSymbols: sortedKnownSymbols }, null, 2)

if (CHECK) {
  const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''
  if (existing === output) {
    console.log('symbols.json is up to date.')
    process.exit(0)
  }
  console.error(
    'symbols.json is out of date. Run: node scripts/update-symbols.mjs'
  )
  process.exit(1)
}

fs.writeFileSync(OUT, output)
console.log(
  `symbols.json written — ${Object.keys(knownSymbols).length} symbols from ${srcFiles.length} src files.`
)
