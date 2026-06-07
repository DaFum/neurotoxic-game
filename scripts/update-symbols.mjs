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
import crypto from 'crypto'
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
const srcFileSet = new Set(srcFiles.map(fileName => normalizePath(fileName)))

function walkFiles(dir, shouldInclude, out = []) {
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(full, shouldInclude, out)
      continue
    }
    if (shouldInclude(entry.name, full)) out.push(full)
  }
  return out
}

function collectReferenceFiles() {
  const testDir = path.join(ROOT, 'tests')
  const referenceFiles = [
    ...walkFiles(
      SRC,
      name => SOURCE_FILE_RE.test(name) && IGNORED_SOURCE_FILE_RE.test(name)
    ),
    ...walkFiles(testDir, name => SOURCE_FILE_RE.test(name))
  ]
  return referenceFiles
    .filter(fileName => !srcFileSet.has(normalizePath(fileName)))
    .sort((a, b) => normalizePath(a).localeCompare(normalizePath(b)))
}

const referenceFiles = collectReferenceFiles()
const programFiles = [...srcFiles, ...referenceFiles]

// ---------------------------------------------------------------------------
// 2. Build program
// ---------------------------------------------------------------------------
let program, checker
try {
  program = ts.createProgram(programFiles, {
    allowJs: true,
    checkJs: false,
    noEmit: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
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

// Minimal host for resolving dynamic `import('...')` specifiers to source files.
const moduleResolutionHost = {
  fileExists: fileName => ts.sys.fileExists(fileName),
  readFile: fileName => ts.sys.readFile(fileName)
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

function normalizeSnippetText(text) {
  return text.replace(/\r\n?/g, '\n')
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

function bindingKind(bindingName) {
  if (!bindingName) return undefined
  if (ts.isObjectBindingPattern(bindingName)) return 'objectPattern'
  if (ts.isArrayBindingPattern(bindingName)) return 'arrayPattern'
  return undefined
}

function collectBindingNames(bindingName, names = []) {
  if (!bindingName) return names
  if (ts.isIdentifier(bindingName)) {
    names.push(bindingName.text)
    return names
  }
  if (ts.isObjectBindingPattern(bindingName)) {
    for (const element of bindingName.elements) {
      collectBindingNames(element.name, names)
    }
    return names
  }
  if (ts.isArrayBindingPattern(bindingName)) {
    for (const element of bindingName.elements) {
      if (ts.isBindingElement(element)) collectBindingNames(element.name, names)
    }
  }
  return names
}

function serializeParameterBinding(paramDecl) {
  if (!paramDecl || !ts.isParameter(paramDecl)) return undefined
  const kind = bindingKind(paramDecl.name)
  if (!kind) return undefined
  const names = collectBindingNames(paramDecl.name)
  const result = { bindingKind: kind }
  if (names.length > 0) result.destructuredNames = names
  return result
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
          ? normalizeSnippetText(
              paramDecl.name.getText(paramDecl.getSourceFile())
            )
          : param.name
      const entry = {
        name,
        optional,
        rest: !!paramDecl?.dotDotDotToken,
        type: typeString(
          checker.getTypeOfSymbolAtLocation(param, paramDecl ?? decl),
          paramDecl ?? decl,
          optional
        )
      }
      const binding = serializeParameterBinding(paramDecl)
      if (binding) Object.assign(entry, binding)
      return entry
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

// The identifier as written at the declaration site. For aliased re-exports
// (`export { TOURBUS_BASE_SPEED as BASE_SPEED }`) this differs from the name the
// module exports, so recording it keeps the entry honest about what an agent
// will actually find at path:lineStart.
function declaredIdentifier(decl) {
  const name = /** @type {any} */ (decl).name
  return name && ts.isIdentifier(name) ? name.text : undefined
}

// Returns the textual base/implemented type names from a heritage clause
// (e.g. interface/class `extends`/`implements`).
function heritageNames(decl, keyword) {
  const clause = decl.heritageClauses?.find(clause => clause.token === keyword)
  if (!clause) return undefined
  const names = clause.types.map(type =>
    type.getText(decl.getSourceFile()).trim()
  )
  return names.length > 0 ? names : undefined
}

// Generic type-parameter declarations as written, e.g. ['T', 'K extends string'].
function typeParameterTexts(host) {
  const params = host?.typeParameters
  if (!params || params.length === 0) return undefined
  return params.map(param => param.getText(param.getSourceFile()).trim())
}

// async / generator flags for the callable behind a declaration.
function callableModifiers(decl) {
  const callable = callableDeclaration(decl)
  if (!callable) return {}
  const flags = ts.getCombinedModifierFlags(callable)
  return {
    async: !!(flags & ts.ModifierFlags.Async),
    generator: !!callable.asteriskToken
  }
}

// Literal value of a primitive `const` export so agents can read constants
// (speeds, costs, thresholds, flags) without opening the file. Returns the
// sentinel `undefined` only when there is no serializable literal — `null`,
// `false`, and `0` are valid recorded values.
function literalConstValue(decl) {
  if (!ts.isVariableDeclaration(decl) || !decl.initializer) return undefined
  let list = decl.parent
  while (list && !ts.isVariableDeclarationList(list)) list = list.parent
  if (!list || !(list.flags & ts.NodeFlags.Const)) return undefined

  const init = decl.initializer
  if (ts.isNumericLiteral(init)) return Number(init.text)
  if (ts.isStringLiteralLike(init)) return init.text
  if (init.kind === ts.SyntaxKind.TrueKeyword) return true
  if (init.kind === ts.SyntaxKind.FalseKeyword) return false
  if (init.kind === ts.SyntaxKind.NullKeyword) return null
  if (
    ts.isPrefixUnaryExpression(init) &&
    init.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(init.operand)
  ) {
    return -Number(init.operand.text)
  }
  return undefined
}

function unwrapLiteralExpression(expression) {
  let current = expression
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression
  }
  return current
}

function literalPropertyName(propertyName) {
  if (ts.isIdentifier(propertyName)) return propertyName.text
  if (ts.isStringLiteralLike(propertyName)) return propertyName.text
  if (ts.isNumericLiteral(propertyName)) return propertyName.text
  return undefined
}

function objectLiteralConstKeys(decl) {
  if (!ts.isVariableDeclaration(decl) || !decl.initializer) return undefined
  let list = decl.parent
  while (list && !ts.isVariableDeclarationList(list)) list = list.parent
  if (!list || !(list.flags & ts.NodeFlags.Const)) return undefined

  const initializer = unwrapLiteralExpression(decl.initializer)
  if (!ts.isObjectLiteralExpression(initializer)) return undefined

  const keys = initializer.properties
    .map(property => {
      if (ts.isSpreadAssignment(property)) return undefined
      if (ts.isShorthandPropertyAssignment(property)) return property.name.text
      const name = /** @type {any} */ (property).name
      return name ? literalPropertyName(name) : undefined
    })
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  return keys.length > 0 ? keys : undefined
}

// Enum member names and their resolved constant values.
function enumMembers(decl) {
  if (!ts.isEnumDeclaration(decl)) return undefined
  const members = decl.members.map(member => {
    const entry = { name: member.name.getText(decl.getSourceFile()) }
    const value = checker.getConstantValue(member)
    if (value !== undefined) entry.value = value
    return entry
  })
  return members.length > 0 ? members : undefined
}

function addDeclarationMetadata(entry, sym, decl, exportedName, isDefault) {
  Object.assign(entry, declarationLocation(decl))
  entry.exportKind = isDefault ? 'default' : 'named'
  entry.exportedName = isDefault ? 'default' : exportedName

  // Flag aliased re-exports and record the real declared identifier so the
  // name/location pair is unambiguous (e.g. BASE_SPEED -> TOURBUS_BASE_SPEED).
  if (!isDefault) {
    const declaredName = declaredIdentifier(decl)
    if (declaredName && declaredName !== exportedName) {
      entry.localName = declaredName
      entry.isAlias = true
    }
  }

  const jsDoc = serializeJsDoc(decl)
  if (jsDoc) entry.jsDoc = jsDoc
  if (jsDoc?.tags?.some(tag => tag.name === 'deprecated')) {
    entry.deprecated = true
  }

  const signature = serializeSignature(sym, decl)
  if (signature) {
    entry.parameters = signature.parameters
    entry.returnType = signature.returnType
  }

  const { async: isAsync, generator } = callableModifiers(decl)
  if (isAsync) entry.async = true
  if (generator) entry.generator = true

  const typeParameters = typeParameterTexts(callableDeclaration(decl) ?? decl)
  if (typeParameters) entry.typeParameters = typeParameters

  if (ts.isInterfaceDeclaration(decl) || ts.isClassDeclaration(decl)) {
    const extendsNames = heritageNames(decl, ts.SyntaxKind.ExtendsKeyword)
    const implementsNames = heritageNames(decl, ts.SyntaxKind.ImplementsKeyword)
    if (extendsNames) entry.extends = extendsNames
    if (implementsNames) entry.implements = implementsNames
  }

  const constValue = literalConstValue(decl)
  if (constValue !== undefined) entry.value = constValue

  const literalKeys = objectLiteralConstKeys(decl)
  if (literalKeys) entry.literalKeys = literalKeys

  const members = enumMembers(decl)
  if (members) entry.enumMembers = members

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
const usedByTestsByEntry = new Map()
const referencedByLocalByEntry = new Map()
const referencedByByEntry = new Map()
const referencedInFileEntries = new Set()
const importsByFile = new Map()

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

// Resolves an export-star re-exported name referenced inside the re-exporting
// module itself. `export * from './npc'` brings `CharacterProfile` into
// game.d.ts's scope, but getSymbolAtLocation on such a reference returns a
// transient merged symbol with no declarations, so the normal resolution path
// fails. The name IS a module export of the referencing file, so re-resolving
// through that module's export table recovers the real declaration (and alias
// chain) — without this, ambient `.d.ts` types used only as field/payload
// types look like orphans.
function resolveViaModuleExports(node) {
  if (!ts.isIdentifier(node)) return undefined
  const refModuleSym = checker.getSymbolAtLocation(node.getSourceFile())
  if (!refModuleSym) return undefined
  const exp = checker
    .getExportsOfModule(refModuleSym)
    .find(s => s.escapedName === node.escapedText)
  if (!exp) return undefined
  const resolved = resolveAlias(checker, exp)
  return resolved.valueDeclaration ?? resolved.declarations?.[0]
}

function targetEntriesForNode(node, importedName) {
  const sym = checker.getSymbolAtLocation(node)
  if (!sym) return []
  const resolved = resolveAlias(checker, sym)
  let decl = resolved.valueDeclaration ?? resolved.declarations?.[0]
  if (!decl || !isUnderSrc(normalizePath(decl.getSourceFile().fileName))) {
    decl = resolveViaModuleExports(node)
  }
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

function addUsedByTests(entry, usage) {
  if (!usedByTestsByEntry.has(entry)) usedByTestsByEntry.set(entry, new Map())
  usedByTestsByEntry.get(entry).set(JSON.stringify(usage), usage)
}

function addReferencedByLocal(entry, reference) {
  if (!referencedByLocalByEntry.has(entry))
    referencedByLocalByEntry.set(entry, new Map())
  referencedByLocalByEntry.get(entry).set(JSON.stringify(reference), reference)
}

function addReferencedBy(entry, reference) {
  if (!referencedByByEntry.has(entry))
    referencedByByEntry.set(entry, new Map())
  referencedByByEntry.get(entry).set(JSON.stringify(reference), reference)
}

// True when `filePath` already imports `targetEntry` (under any local alias).
// The import pass records usedBy/usedByTests keyed by the consuming file path
// regardless of import alias, so this reliably distinguishes a genuine
// import-backed cross-file use from a non-import reference.
function fileImportsTarget(targetEntry, filePath) {
  const usedBy = usedByByEntry.get(targetEntry)
  if (usedBy) {
    for (const usage of usedBy.values()) {
      if (usage.path === filePath) return true
    }
  }
  const usedByTests = usedByTestsByEntry.get(targetEntry)
  if (usedByTests) {
    for (const usage of usedByTests.values()) {
      if (usage.path === filePath) return true
    }
  }
  return false
}

function addFileImport(filePath, importedName) {
  if (!importsByFile.has(filePath)) importsByFile.set(filePath, new Set())
  importsByFile.get(filePath).add(importedName)
}

function isReferenceOnlyFile(fileName) {
  const normalized = normalizePath(fileName)
  const testsPrefix = `${normalizePath(path.join(ROOT, 'tests'))}/`
  return (
    normalized.startsWith(testsPrefix) ||
    IGNORED_SOURCE_FILE_RE.test(path.basename(normalized))
  )
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
  const addUsage = isReferenceOnlyFile(sourceFile.fileName)
    ? addUsedByTests
    : addUsedBy
  const visitImport = node => {
    if (!ts.isImportDeclaration(node)) return
    if (!ts.isStringLiteral(node.moduleSpecifier)) return

    const importClause = node.importClause
    if (!importClause) return
    const clauseTypeOnly = !!importClause.isTypeOnly

    if (importClause.name) {
      addFileImport(rel, importClause.name.text)
      if (node.moduleSpecifier.text.startsWith('.')) {
        for (const entry of targetEntriesForNode(
          importClause.name,
          'default'
        )) {
          addUsage(entry, {
            path: rel,
            importedAs: importClause.name.text,
            typeOnly: clauseTypeOnly
          })
        }
      }
    }

    const bindings = importClause.namedBindings
    if (bindings && ts.isNamespaceImport(bindings)) {
      addFileImport(rel, bindings.name.text)
      return
    }
    if (!bindings || !ts.isNamedImports(bindings)) return

    for (const specifier of bindings.elements) {
      const importedName = specifier.propertyName?.text ?? specifier.name.text
      addFileImport(rel, specifier.name.text)
      const usage = {
        path: rel,
        importedAs: specifier.name.text
      }
      if (specifier.name.text !== importedName)
        usage.importedName = importedName
      if (clauseTypeOnly || specifier.isTypeOnly) usage.typeOnly = true

      if (!node.moduleSpecifier.text.startsWith('.')) continue
      for (const entry of targetEntriesForNode(specifier.name, importedName)) {
        addUsage(entry, usage)
      }
    }
  }

  ts.forEachChild(sourceFile, visitImport)

  // Dynamic imports (`import('./Scene').then(m => m.Scene)`) are not
  // ImportDeclarations, so the static pass above misses them. Without this,
  // lazily-loaded modules (e.g. route-split scene components) look orphaned
  // because nothing statically imports them. Resolve the target module and
  // attribute usage to every export it surfaces.
  const visitDynamicImport = node => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text.startsWith('.')
    ) {
      const resolved = ts.resolveModuleName(
        node.arguments[0].text,
        sourceFile.fileName,
        program.getCompilerOptions(),
        moduleResolutionHost
      )
      const targetFile = resolved.resolvedModule?.resolvedFileName
      if (targetFile && isUnderSrc(targetFile)) {
        const targetSf = program.getSourceFile(targetFile)
        const moduleSym = targetSf && checker.getSymbolAtLocation(targetSf)
        if (moduleSym) {
          for (const exp of checker.getExportsOfModule(moduleSym)) {
            if (SKIP_NAMES.has(exp.name) || exp.name.startsWith('_')) continue
            const resolvedExp = resolveAlias(checker, exp)
            const decl = resolvedExp.declarations?.[0]
            if (!decl) continue
            const entries = entriesByDeclKey.get(declarationKey(decl))
            if (!entries) continue
            for (const entry of entries) {
              addUsage(entry, {
                path: rel,
                importedAs: exp.name,
                dynamic: true
              })
            }
          }
        }
      }
    }
    ts.forEachChild(node, visitDynamicImport)
  }
  ts.forEachChild(sourceFile, visitDynamicImport)
}

function dependencySymbolNode(expression) {
  if (ts.isIdentifier(expression)) return expression
  if (ts.isPropertyAccessExpression(expression)) return expression.name
  return undefined
}

// True when an identifier sits in a value/type *reference* position rather than
// a declaration or property-key position. Declaration names resolve to the
// entry itself (and are skipped by addTargets), but skipping them up front
// avoids needless checker lookups; specifier names are already attributed by
// the import pass. Object-literal keys are not references and must be excluded
// so that `{ key: value }` does not record `key` as a usage.
function isReferencePositionIdentifier(id) {
  const parent = id.parent
  if (!parent) return false
  if (
    (ts.isVariableDeclaration(parent) ||
      ts.isFunctionDeclaration(parent) ||
      ts.isClassDeclaration(parent) ||
      ts.isInterfaceDeclaration(parent) ||
      ts.isTypeAliasDeclaration(parent) ||
      ts.isEnumDeclaration(parent) ||
      ts.isEnumMember(parent) ||
      ts.isModuleDeclaration(parent) ||
      ts.isParameter(parent) ||
      ts.isBindingElement(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isMethodSignature(parent) ||
      ts.isImportClause(parent) ||
      ts.isImportSpecifier(parent) ||
      ts.isExportSpecifier(parent) ||
      ts.isNamespaceImport(parent)) &&
    parent.name === id
  ) {
    return false
  }
  // Object-literal property key (`{ key: value }`); the value side is a
  // separate child and is kept. Shorthand keys ARE references and are kept.
  if (ts.isPropertyAssignment(parent) && parent.name === id) return false
  return true
}

function collectDeclarationDependencies({ entry, decl }) {
  const addTargets = node => {
    for (const target of targetEntriesForNode(node, undefined)) {
      if (target === entry) continue
      addDependency(entry, target.name)
      if (target.path === entry.path) {
        addReferencedByLocal(target, {
          path: entry.path,
          symbol: entry.name
        })
      } else if (!fileImportsTarget(target, entry.path)) {
        // Cross-file reference that no `import` of this symbol backs. Two real
        // cases produce these and the import-only `usedBy` pass misses both,
        // causing false orphan signals:
        //   1. Ambient `.d.ts` type usage — a type declared in one declaration
        //      file used as a field/payload type in another (e.g. GameState's
        //      `npcs: Record<string, CharacterProfile>`) without an import.
        //   2. Namespace-member access — `import * as ns` then `ns.foo()`,
        //      where the import binds `ns`, not `foo`.
        // Record the inverse edge so the symbol is not mistaken for an orphan.
        addReferencedBy(target, {
          path: entry.path,
          symbol: entry.name
        })
      }
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
    } else if (ts.isIdentifier(node) && isReferencePositionIdentifier(node)) {
      // Bare value references (dispatch-table membership like
      // `EFFECT_HANDLERS = { k: applyX }`, const reads in arithmetic, callback
      // passing, `m.Scene` member access). Without this, same-file helpers used
      // outside call/JSX positions look orphaned. The symbol checker resolves
      // each identifier to its real declaration, so locals/params/keys that do
      // not map to an exported entry are filtered out by addTargets.
      addTargets(node)
    }
    ts.forEachChild(node, visit)
  }

  visit(decl)
}

// Whole-file reference scan. `collectDeclarationDependencies` only visits
// *exported* declarations, so a symbol referenced solely from a module-private
// helper (e.g. `QUEST_SLOT_LIMITS` read inside the non-exported `hasQuestSlot`)
// would still look orphaned. This pass marks any same-file entry referenced
// anywhere in its own file outside its own declaration span, so consumers can
// distinguish "used internally" from "truly unreferenced".
function collectSameFileReferences(sourceFile) {
  const filePathRel = relPath(sourceFile.fileName)
  const visit = node => {
    if (ts.isIdentifier(node) && isReferencePositionIdentifier(node)) {
      const entries = targetEntriesForNode(node, undefined)
      if (entries.length > 0) {
        const refLine =
          sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
            .line + 1
        for (const entry of entries) {
          if (entry.path !== filePathRel) continue
          // Skip references inside the entry's own declaration (recursion,
          // self-referential initializers) so they do not mask a true orphan.
          if (refLine >= entry.lineStart && refLine <= entry.lineEnd) continue
          referencedInFileEntries.add(entry)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(sourceFile, visit)
}

for (const filePath of programFiles) {
  const sourceFile = program.getSourceFile(filePath)
  if (sourceFile) collectImportUsage(sourceFile)
}

for (const ref of localEntryRefs) collectDeclarationDependencies(ref)

for (const srcFilePath of srcFiles) {
  const sourceFile = program.getSourceFile(srcFilePath)
  if (sourceFile && isUnderSrc(sourceFile.fileName))
    collectSameFileReferences(sourceFile)
}

for (const entry of referencedInFileEntries) entry.referencedInFile = true

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

for (const [entry, usageByKey] of usedByTestsByEntry) {
  const sorted = Array.from(usageByKey.values()).sort((a, b) =>
    usageSortKey(a).localeCompare(usageSortKey(b))
  )
  if (sorted.length > 0) entry.usedByTests = sorted
}

function localReferenceSortKey(reference) {
  return [reference.path, reference.symbol].join('\0')
}

for (const [entry, referenceByKey] of referencedByLocalByEntry) {
  const sorted = Array.from(referenceByKey.values()).sort((a, b) =>
    localReferenceSortKey(a).localeCompare(localReferenceSortKey(b))
  )
  if (sorted.length > 0) entry.referencedByLocal = sorted
}

for (const [entry, referenceByKey] of referencedByByEntry) {
  const sorted = Array.from(referenceByKey.values()).sort((a, b) =>
    localReferenceSortKey(a).localeCompare(localReferenceSortKey(b))
  )
  if (sorted.length > 0) entry.referencedBy = sorted
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

function emptyFileIndexEntry() {
  return {
    exports: [],
    imports: [],
    components: [],
    hooks: []
  }
}

function getFileIndexEntry(fileMap, filePath) {
  if (!fileMap.has(filePath)) fileMap.set(filePath, emptyFileIndexEntry())
  return fileMap.get(filePath)
}

function addUniqueSorted(array, value) {
  if (!array.includes(value)) array.push(value)
}

function buildFilesIndex() {
  const fileMap = new Map()
  for (const fileName of programFiles) {
    getFileIndexEntry(fileMap, relPath(fileName))
  }

  for (const [filePath, imports] of importsByFile) {
    const fileEntry = getFileIndexEntry(fileMap, filePath)
    for (const importedName of imports) {
      addUniqueSorted(fileEntry.imports, importedName)
    }
  }

  for (const entries of Object.values(sortedKnownSymbols)) {
    for (const entry of entries) {
      if (entry.source !== 'local' || !entry.path) continue
      const fileEntry = getFileIndexEntry(fileMap, entry.path)
      addUniqueSorted(fileEntry.exports, entry.name)
      if (entry.isComponent) addUniqueSorted(fileEntry.components, entry.name)
      if (entry.isHook) addUniqueSorted(fileEntry.hooks, entry.name)
    }
  }

  return Array.from(fileMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [filePath, fileEntry]) => {
      acc[filePath] = {
        exports: fileEntry.exports.sort((a, b) => a.localeCompare(b)),
        imports: fileEntry.imports.sort((a, b) => a.localeCompare(b)),
        components: fileEntry.components.sort((a, b) => a.localeCompare(b)),
        hooks: fileEntry.hooks.sort((a, b) => a.localeCompare(b))
      }
      return acc
    }, {})
}

function sourceHash(files) {
  const hash = crypto.createHash('sha256')
  for (const fileName of files
    .slice()
    .sort((a, b) => normalizePath(a).localeCompare(normalizePath(b)))) {
    hash.update(relPath(fileName))
    hash.update('\0')
    hash.update(fs.readFileSync(fileName))
    hash.update('\0')
  }
  return hash.digest('hex')
}

const files = buildFilesIndex()

// Deterministic summary + inline schema legend so an agent reading the file
// cold understands every field without consulting external docs. No timestamps
// or env-derived data — values depend only on source, preserving --check.
let localSymbols = 0
let externalSymbols = 0
let aliasedReexports = 0
for (const entries of Object.values(knownSymbols)) {
  for (const e of entries) {
    if (e.source === 'external') externalSymbols++
    else localSymbols++
    if (e.isAlias) aliasedReexports++
  }
}

const meta = {
  schemaVersion: 4,
  guidePath: 'docs/agent-symbols-guide.md',
  sourceHash: sourceHash(programFiles),
  description:
    'Exported-symbol index generated by scripts/update-symbols.mjs from the TypeScript compiler API. Do not hand-edit; run `pnpm run symbols:update`. Guide: docs/agent-symbols-guide.md.',
  symbolNames: Object.keys(knownSymbols).length,
  localSymbols,
  externalSymbols,
  aliasedReexports,
  sourceFiles: srcFiles.length,
  referenceFiles: referenceFiles.length,
  indexedFiles: Object.keys(files).length,
  fieldGuide: {
    files:
      'Top-level file navigation index keyed by relative file path; each entry lists exports, imports, React components, and hooks.',
    exports: 'In files entries, exported symbols declared in the file.',
    imports: 'In files entries, imported local or external binding names.',
    components:
      'In files entries, React component exports declared in the file.',
    hooks: 'In files entries, React hook exports declared in the file.',
    guidePath: 'Path to the detailed agent usage guide for this schema.',
    sourceHash:
      'Stable SHA-256 over indexed source and reference files, used to spot stale generated output.',
    path: 'File where the symbol is declared.',
    exportPath:
      'Present when the symbol is re-exported through another module (barrel or alias); value is that re-exporting file.',
    localName:
      'Real declared identifier at path:lineStart when it differs from the exported name (aliased re-export).',
    isAlias:
      'True when the exported name differs from the declared identifier.',
    source: '"local" (defined in src/) or "external" (allowlisted dependency).',
    type: 'Declaration kind: const | let | var | function | class | interface | type | enum.',
    typeOnly: 'True for type-only declarations or `export type` re-exports.',
    isDefault: 'True for default exports.',
    lineStart: '1-based line/column span of the declaration.',
    parameters:
      'Function/hook parameters: name, type, optional, rest. Use to build correct calls.',
    bindingKind:
      'Present on destructured parameters; objectPattern or arrayPattern.',
    destructuredNames:
      'Identifier names bound by a destructured parameter, separate from the raw parameter text.',
    returnType: 'Function/hook return type string.',
    typeParameters:
      'Generic parameter declarations, e.g. ["T", "K extends string"].',
    async: 'True for async functions.',
    generator: 'True for generator functions.',
    deprecated: 'True when the declaration carries an @deprecated JSDoc tag.',
    properties:
      'Members of an interface or object-like type alias for fixture/payload construction.',
    variants: 'Object branches of a union type alias.',
    extends: 'Heritage base interfaces/classes.',
    implements: 'Heritage implemented interfaces (classes).',
    enumMembers: 'Enum member names and resolved constant values.',
    value:
      'Literal value of a primitive const export (number/string/boolean/null).',
    literalKeys:
      'Stable sorted top-level keys for object literal const exports.',
    isComponent: 'True for React components.',
    isHook: 'True for React hooks (use* name with a call signature).',
    jsDoc: 'Parsed JSDoc/TSDoc summary text and tags.',
    dependencies:
      'Local exported symbols this declaration calls, constructs, renders, or references by name.',
    referencedByLocal:
      'Same-file exported declarations that call, construct, render, or reference this symbol by name (e.g. dispatch-table membership).',
    referencedBy:
      'Cross-file exported declarations that reference this symbol WITHOUT importing it — ambient `.d.ts` type usage (a type used as a field/payload type in another declaration file) and namespace-member access (`import * as ns; ns.foo()`). These are invisible to the import-based usedBy pass, so they are tracked here to prevent false orphan signals.',
    referencedInFile:
      'True when the symbol is referenced anywhere in its own file (including from module-private helpers) outside its own declaration; absence of usedBy/usedByTests/referencedBy/referencedByLocal/referencedInFile means truly unreferenced.',
    usedBy:
      'Production files that import this symbol (static imports and resolved dynamic `import()` calls; the latter carry `dynamic: true`).',
    usedByTests:
      'Test, spec, or story files that import this symbol, tracked separately from usedBy.'
  }
}

const output = JSON.stringify(
  { meta, files, knownSymbols: sortedKnownSymbols },
  null,
  2
)

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
