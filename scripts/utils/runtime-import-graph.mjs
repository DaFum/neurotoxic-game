/**
 * Syntax-aware static runtime import graph of the `src` tree.
 *
 * @remarks
 * Every non-declaration `.ts`, `.tsx`, `.js`, `.jsx` and `.mjs` file under
 * `<root>/src` is parsed with the TypeScript compiler API. Statement-level
 * imports and re-exports that survive compilation become directed edges; type
 * forms (`import type`, `export type`, all-inline-type named lists and
 * `import('...')` type nodes) do not. Literal dynamic imports are resolved and
 * reported but add no edge. Local code outside `src` that the graph reaches is
 * followed recursively, and in those followed files a literal `require` is an
 * edge as well.
 *
 * All paths are repository-relative POSIX paths, such as `src/main.tsx`.
 * Use {@link evaluateRuntimeGraph} before trusting a graph: a graph that is
 * empty or was only partly parsed has fewer edges and so fewer cycles, and
 * would otherwise pass any cycle check vacuously.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

/** Extensions of the files discovered under `src`. */
const DISCOVERED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

/** Extensions tried, in order, after the exact path of a local specifier. */
const RESOLUTION_EXTENSIONS = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx']

/** Extensions of files that are modules of code rather than assets. */
const CODE_EXTENSIONS = new Set([...RESOLUTION_EXTENSIONS, '.cjs', '.cts'])

/** Declaration extensions tried once no code candidate exists. */
const DECLARATION_EXTENSIONS = ['.d.ts', '.d.mts', '.d.cts']

/** `import.meta.glob` queries that load files as strings, not modules. */
const ASSET_GLOB_QUERIES = new Set(['?url', '?raw'])

/**
 * One finding that names the file it was found in.
 *
 * @typedef {object} ImporterFinding
 * @property {string} importer - The repository-relative file.
 * @property {number} line - The 1-based line of the finding.
 */

/**
 * @typedef {object} ParseError
 * @property {string} file - The repository-relative file that failed to parse.
 * @property {number} line - The 1-based line of the parser diagnostic.
 * @property {number} column - The 1-based column of the parser diagnostic.
 * @property {string} message - The parser diagnostic text.
 */

/**
 * @typedef {object} SpecifierFinding
 * @property {string} importer - The repository-relative importing file.
 * @property {string} specifier - The specifier as written.
 * @property {number} line - The 1-based line of the import.
 */

/**
 * @typedef {object} ResolvedFinding
 * @property {string} importer - The repository-relative importing file.
 * @property {string} specifier - The specifier as written.
 * @property {string} target - The repository-relative file it resolved to.
 * @property {number} line - The 1-based line of the import.
 */

/**
 * @typedef {object} UnsupportedFinding
 * @property {string} importer - The repository-relative file.
 * @property {number} line - The 1-based line of the construct.
 * @property {'nonliteral-require' | 'eager-code-glob'} kind - What the builder
 *   cannot turn into edges.
 */

/**
 * Number of excluded references per category.
 *
 * @typedef {object} ExcludedCounts
 * @property {number} packages - Bare package specifiers.
 * @property {number} virtualModules - `virtual:` module specifiers.
 * @property {number} assets - Local non-code files and query-suffixed imports.
 * @property {number} assetGlobs - Eager `import.meta.glob` calls over assets.
 */

/**
 * @typedef {object} GraphDiagnostics
 * @property {ParseError[]} parseErrors - TypeScript parser diagnostics.
 * @property {SpecifierFinding[]} unresolved - Local relative, root or `@/`
 *   specifiers that resolve to no file.
 * @property {ImporterFinding[]} nonliteralDynamicImports - `import(expr)`
 *   calls whose argument is not a string literal.
 * @property {UnsupportedFinding[]} unsupported - Constructs that may load code
 *   the graph cannot see.
 * @property {ResolvedFinding[]} declarationOnly - References whose only target
 *   is a declaration file; those targets are not vertices.
 * @property {ResolvedFinding[]} dynamicImports - Resolved literal dynamic
 *   imports of code; they add no edge.
 * @property {ExcludedCounts} excluded - Excluded references by category.
 */

/**
 * @typedef {object} RuntimeGraph
 * @property {string[]} vertices - Every parsed file, sorted: the discovered
 *   `src` files plus the local code they reach outside `src`.
 * @property {Array<[string, string]>} edges - Sorted unique directed runtime
 *   edges as `[importer, target]` pairs.
 * @property {string[][]} sccs - Cyclic strongly connected components: more
 *   than one vertex, or one vertex that imports itself. Members are sorted;
 *   components are ordered by size, largest first, then by first member.
 * @property {Array<[string, string]>} cyclicEdges - Sorted edges whose two
 *   ends lie in the same cyclic component.
 * @property {GraphDiagnostics} diagnostics - What the builder excluded or
 *   could not read.
 */

/**
 * @typedef {object} GraphVerdict
 * @property {boolean} ok - Whether the graph is complete enough to gate on.
 * @property {string[]} failures - One line per reason the graph is not.
 */

const toPosix = value => value.split(path.sep).join('/')

const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0)

const comparePairs = (left, right) =>
  compareText(left[0], right[0]) || compareText(left[1], right[1])

const compareFindings = (left, right) =>
  compareText(left.importer, right.importer) ||
  left.line - right.line ||
  compareText(left.specifier ?? '', right.specifier ?? '')

const scriptKindFor = file => {
  switch (path.extname(file)) {
    case '.ts':
    case '.mts':
    case '.cts':
      return ts.ScriptKind.TS
    case '.tsx':
      return ts.ScriptKind.TSX
    case '.jsx':
      return ts.ScriptKind.JSX
    default:
      return ts.ScriptKind.JS
  }
}

const listDiscoveredFiles = directory =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return listDiscoveredFiles(full)
    return entry.isFile() &&
      DISCOVERED_EXTENSIONS.has(path.extname(entry.name)) &&
      !ts.isDeclarationFileName(entry.name)
      ? [full]
      : []
  })

/**
 * Whether a statement-level import or re-export survives compilation: not
 * `import type` or `export type`, and not a named list whose every element is
 * `type`-qualified.
 */
const isRuntimeStatement = statement => {
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause
    if (!clause) return true
    if (clause.isTypeOnly) return false
    const bindings = clause.namedBindings
    return !(
      !clause.name &&
      bindings &&
      ts.isNamedImports(bindings) &&
      bindings.elements.length > 0 &&
      bindings.elements.every(element => element.isTypeOnly)
    )
  }
  if (statement.isTypeOnly) return false
  const clause = statement.exportClause
  return !(
    clause &&
    ts.isNamedExports(clause) &&
    clause.elements.length > 0 &&
    clause.elements.every(element => element.isTypeOnly)
  )
}

const isImportMetaGlob = callee =>
  ts.isPropertyAccessExpression(callee) &&
  callee.name.text === 'glob' &&
  ts.isMetaProperty(callee.expression) &&
  callee.expression.keywordToken === ts.SyntaxKind.ImportKeyword

/**
 * Whether an `import.meta.glob` call is eager and loads assets only: every
 * pattern is a literal with a non-code extension, or the query loads files as
 * URLs or strings. Returns null for a lazy glob, which behaves like a set of
 * dynamic imports and adds no edge.
 */
const classifyGlob = call => {
  const [patterns, options] = call.arguments
  let eager = false
  let query
  if (options && ts.isObjectLiteralExpression(options)) {
    for (const property of options.properties) {
      if (!ts.isPropertyAssignment(property)) continue
      const name = property.name.getText()
      if (name === 'eager') {
        eager = property.initializer.kind === ts.SyntaxKind.TrueKeyword
      } else if (
        name === 'query' &&
        ts.isStringLiteralLike(property.initializer)
      ) {
        query = property.initializer.text
      }
    }
  }
  if (!eager) return null
  if (query !== undefined && ASSET_GLOB_QUERIES.has(query)) return 'asset'
  const list =
    patterns && ts.isArrayLiteralExpression(patterns)
      ? [...patterns.elements]
      : [patterns]
  return list.every(
    pattern =>
      pattern &&
      ts.isStringLiteralLike(pattern) &&
      !CODE_EXTENSIONS.has(path.extname(pattern.text.replace(/^!/, '')))
  )
    ? 'asset'
    : 'code'
}

/**
 * Builds the static runtime import graph of `<root>/src`.
 *
 * @remarks
 * Local specifiers (`./`, `../`, `/` from the root, and `@/` for `src/`)
 * resolve file-first: the exact path; for a `.js` specifier its `.ts` then
 * `.tsx` sibling; the path with `.mjs`, `.js`, `.mts`, `.ts`, `.jsx`, `.tsx`
 * appended; `index` with those extensions; and last a declaration file. A
 * query suffix or a non-code file makes the reference an asset.
 *
 * @param root - The repository or workspace root that holds `src`.
 * @returns The graph and its diagnostics, all arrays sorted.
 */
export const buildRuntimeImportGraph = root => {
  const rootDir = path.resolve(root)
  const srcDir = path.join(rootDir, 'src')
  const toRelative = file => toPosix(path.relative(rootDir, file))

  /** @type {Map<string, boolean>} */
  const fileCache = new Map()
  const isFile = candidate => {
    let known = fileCache.get(candidate)
    if (known === undefined) {
      known =
        fs.statSync(candidate, { throwIfNoEntry: false })?.isFile() ?? false
      fileCache.set(candidate, known)
    }
    return known
  }

  /**
   * The file a local specifier loads and what it is, or null if none exists
   * inside the root.
   */
  const resolveLocal = (importer, specifier) => {
    const queryIndex = specifier.indexOf('?')
    const pathPart =
      queryIndex === -1 ? specifier : specifier.slice(0, queryIndex)
    const base = specifier.startsWith('@/')
      ? path.join(srcDir, pathPart.slice(2))
      : specifier.startsWith('/')
        ? path.join(rootDir, pathPart)
        : path.resolve(path.dirname(path.join(rootDir, importer)), pathPart)
    const jsStem = base.endsWith('.js') ? base.slice(0, -3) : null
    const codeCandidates = [
      base,
      ...(jsStem === null ? [] : [`${jsStem}.ts`, `${jsStem}.tsx`]),
      ...RESOLUTION_EXTENSIONS.map(extension => base + extension),
      ...RESOLUTION_EXTENSIONS.map(extension =>
        path.join(base, `index${extension}`)
      )
    ]
    const declarationCandidates = [
      ...(jsStem === null ? [] : [`${jsStem}.d.ts`]),
      ...DECLARATION_EXTENSIONS.map(extension => base + extension),
      ...DECLARATION_EXTENSIONS.map(extension =>
        path.join(base, `index${extension}`)
      )
    ]
    const found =
      codeCandidates.find(isFile) ?? declarationCandidates.find(isFile)
    if (found === undefined) return null
    const target = toRelative(found)
    if (target.startsWith('../') || path.isAbsolute(target)) return null
    if (ts.isDeclarationFileName(found)) return { kind: 'declaration', target }
    if (queryIndex !== -1 || !CODE_EXTENSIONS.has(path.extname(found))) {
      return { kind: 'asset', target }
    }
    return { kind: 'code', target }
  }

  const discovered = fs.existsSync(srcDir)
    ? listDiscoveredFiles(srcDir).map(toRelative).sort(compareText)
    : []
  const discoveredSet = new Set(discovered)
  const queue = [...discovered]
  const known = new Set(discovered)
  const edgeKeys = new Set()
  /** @type {Array<[string, string]>} */
  const edges = []
  /** @type {GraphDiagnostics} */
  const diagnostics = {
    parseErrors: [],
    unresolved: [],
    nonliteralDynamicImports: [],
    unsupported: [],
    declarationOnly: [],
    dynamicImports: [],
    excluded: { packages: 0, virtualModules: 0, assets: 0, assetGlobs: 0 }
  }

  const follow = target => {
    if (known.has(target)) return
    known.add(target)
    queue.push(target)
  }

  /** Records one reference; only `edge` references add graph edges. */
  const reference = (importer, specifier, line, isEdge) => {
    if (specifier.startsWith('virtual:')) {
      diagnostics.excluded.virtualModules++
      return
    }
    if (!/^(?:\.|\/|@\/)/.test(specifier)) {
      diagnostics.excluded.packages++
      return
    }
    const resolved = resolveLocal(importer, specifier)
    if (resolved === null) {
      diagnostics.unresolved.push({ importer, specifier, line })
    } else if (resolved.kind === 'asset') {
      diagnostics.excluded.assets++
    } else if (resolved.kind === 'declaration') {
      diagnostics.declarationOnly.push({
        importer,
        specifier,
        target: resolved.target,
        line
      })
    } else {
      follow(resolved.target)
      if (!isEdge) {
        diagnostics.dynamicImports.push({
          importer,
          specifier,
          target: resolved.target,
          line
        })
        return
      }
      const key = `${importer}\0${resolved.target}`
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key)
        edges.push([importer, resolved.target])
      }
    }
  }

  for (let index = 0; index < queue.length; index++) {
    const importer = queue[index]
    const followed = !discoveredSet.has(importer)
    const sourceFile = ts.createSourceFile(
      importer,
      fs.readFileSync(path.join(rootDir, importer), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      scriptKindFor(importer)
    )
    const lineOf = position =>
      sourceFile.getLineAndCharacterOfPosition(position).line + 1

    // `parseDiagnostics` is the parser's own error list; the public API only
    // exposes it through a Program, which would also type-check every file.
    for (const diagnostic of sourceFile.parseDiagnostics) {
      const position = sourceFile.getLineAndCharacterOfPosition(
        diagnostic.start ?? 0
      )
      diagnostics.parseErrors.push({
        file: importer,
        line: position.line + 1,
        column: position.character + 1,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      })
    }

    for (const statement of sourceFile.statements) {
      let specifier
      if (
        ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)
      ) {
        if (!isRuntimeStatement(statement)) continue
        specifier = statement.moduleSpecifier
      } else if (
        ts.isImportEqualsDeclaration(statement) &&
        !statement.isTypeOnly &&
        ts.isExternalModuleReference(statement.moduleReference)
      ) {
        specifier = statement.moduleReference.expression
      }
      if (specifier && ts.isStringLiteralLike(specifier)) {
        reference(
          importer,
          specifier.text,
          lineOf(statement.getStart(sourceFile)),
          true
        )
      }
    }

    const visit = node => {
      if (ts.isCallExpression(node)) {
        const line = lineOf(node.getStart(sourceFile))
        const [argument] = node.arguments
        const literal =
          argument && ts.isStringLiteralLike(argument) ? argument.text : null
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          if (literal === null) {
            diagnostics.nonliteralDynamicImports.push({ importer, line })
          } else {
            reference(importer, literal, line, false)
          }
        } else if (
          followed &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'
        ) {
          if (literal === null) {
            diagnostics.unsupported.push({
              importer,
              line,
              kind: 'nonliteral-require'
            })
          } else {
            reference(importer, literal, line, true)
          }
        } else if (isImportMetaGlob(node.expression)) {
          const glob = classifyGlob(node)
          if (glob === 'asset') diagnostics.excluded.assetGlobs++
          if (glob === 'code') {
            diagnostics.unsupported.push({
              importer,
              line,
              kind: 'eager-code-glob'
            })
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }

  const vertices = [...known].sort(compareText)
  edges.sort(comparePairs)
  const sccs = findCyclicComponents(vertices, edges)
  const componentOf = new Map()
  sccs.forEach((component, index) => {
    for (const member of component) componentOf.set(member, index)
  })
  const cyclicEdges = edges.filter(
    ([source, target]) =>
      componentOf.has(source) &&
      componentOf.get(source) === componentOf.get(target)
  )

  diagnostics.parseErrors.sort(
    (left, right) =>
      compareText(left.file, right.file) ||
      left.line - right.line ||
      left.column - right.column
  )
  diagnostics.unresolved.sort(compareFindings)
  diagnostics.nonliteralDynamicImports.sort(compareFindings)
  diagnostics.unsupported.sort(compareFindings)
  diagnostics.declarationOnly.sort(compareFindings)
  diagnostics.dynamicImports.sort(compareFindings)

  return { vertices, edges, sccs, cyclicEdges, diagnostics }
}

const adjacencyOf = (vertices, edges) => {
  /** @type {Map<string, string[]>} */
  const adjacency = new Map(vertices.map(vertex => [vertex, []]))
  for (const [source, target] of edges) adjacency.get(source)?.push(target)
  return adjacency
}

/**
 * Tarjan's strongly connected components, keeping only the cyclic ones: more
 * than one vertex, or a single vertex with a self-loop.
 */
const findCyclicComponents = (vertices, edges) => {
  const adjacency = adjacencyOf(vertices, edges)
  const index = new Map()
  const lowLink = new Map()
  const stack = []
  const onStack = new Set()
  /** @type {string[][]} */
  const components = []
  const connect = vertex => {
    index.set(vertex, index.size)
    lowLink.set(vertex, index.get(vertex))
    stack.push(vertex)
    onStack.add(vertex)
    for (const next of adjacency.get(vertex) ?? []) {
      if (!index.has(next)) {
        connect(next)
        lowLink.set(vertex, Math.min(lowLink.get(vertex), lowLink.get(next)))
      } else if (onStack.has(next)) {
        lowLink.set(vertex, Math.min(lowLink.get(vertex), index.get(next)))
      }
    }
    if (lowLink.get(vertex) !== index.get(vertex)) return
    const component = []
    let member
    do {
      member = stack.pop()
      onStack.delete(member)
      component.push(member)
    } while (member !== vertex)
    if (component.length > 1 || adjacency.get(vertex)?.includes(vertex)) {
      components.push(component.sort(compareText))
    }
  }
  for (const vertex of vertices) if (!index.has(vertex)) connect(vertex)
  return components.sort(
    (left, right) =>
      right.length - left.length || compareText(left[0], right[0])
  )
}

/**
 * The shortest path that leads from an edge's target back to its source
 * inside their shared cyclic component, so that the edge plus the path is a
 * cycle. Ties go to the lexicographically smaller neighbour.
 *
 * @param graph - A graph from {@link buildRuntimeImportGraph}.
 * @param source - The importing file of the edge.
 * @param target - The imported file of the edge.
 * @returns The path from `target` to `source`, both included (a self-loop
 *   gives `[source]`), or null if the edge is not a cyclic edge.
 */
export const findShortestReturnPath = (graph, source, target) => {
  const isCyclic = graph.cyclicEdges.some(
    ([from, to]) => from === source && to === target
  )
  if (!isCyclic) return null
  const component = new Set(
    graph.sccs.find(members => members.includes(source))
  )
  const adjacency = adjacencyOf(graph.vertices, graph.edges)
  const previous = new Map([[target, null]])
  const queue = [target]
  for (let index = 0; index < queue.length; index++) {
    const vertex = queue[index]
    if (vertex === source) break
    for (const next of adjacency.get(vertex) ?? []) {
      if (!component.has(next) || previous.has(next)) continue
      previous.set(next, vertex)
      queue.push(next)
    }
  }
  const pathBack = []
  for (let vertex = source; vertex !== null; vertex = previous.get(vertex)) {
    pathBack.unshift(vertex)
  }
  return pathBack
}

/**
 * Whether a graph is complete enough to gate on.
 *
 * @remarks
 * A missing edge can only hide a cycle, so the verdict fails closed: on too
 * few vertices, on any parse error (the parser may have skipped statements),
 * on any unresolved local specifier, on any nonliteral dynamic import, and on
 * any construct the builder reports as unsupported.
 *
 * @param graph - A graph from {@link buildRuntimeImportGraph}.
 * @param options - `minVertices` is the fewest vertices accepted; default 1.
 * @returns The verdict and one line per failure.
 */
export const evaluateRuntimeGraph = (graph, { minVertices = 1 } = {}) => {
  const { diagnostics } = graph
  const failures = []
  if (graph.vertices.length < Math.max(1, minVertices)) {
    failures.push(
      `only ${graph.vertices.length} vertices discovered, expected at least ${Math.max(1, minVertices)}`
    )
  }
  for (const error of diagnostics.parseErrors) {
    failures.push(
      `parse error in ${error.file}:${error.line}:${error.column}: ${error.message}`
    )
  }
  for (const finding of diagnostics.unresolved) {
    failures.push(
      `unresolved specifier '${finding.specifier}' in ${finding.importer}:${finding.line}`
    )
  }
  for (const finding of diagnostics.nonliteralDynamicImports) {
    failures.push(
      `nonliteral dynamic import in ${finding.importer}:${finding.line}`
    )
  }
  for (const finding of diagnostics.unsupported) {
    failures.push(
      `unsupported ${finding.kind} in ${finding.importer}:${finding.line}`
    )
  }
  return { ok: failures.length === 0, failures }
}
