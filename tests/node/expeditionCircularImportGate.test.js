import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC_DIR = fileURLToPath(new URL('../../src/', import.meta.url))
const GATED_DIR = 'domain/expedition/'
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

/**
 * Runtime import cycles through `src/domain/expedition` that are known and
 * tolerated, each written as `a -> b -> ... -> a` with `src`-relative paths,
 * starting at the alphabetically smallest file of the loop. A new cycle is not
 * on this list and fails the gate; an entry whose cycle is gone fails it too,
 * so the list only ever shrinks.
 */
const ALLOWED_CYCLES = []

/** Upper bound on enumerated cycles, so a dense new loop cannot hang the run. */
const MAX_CYCLES = 200

const listSourceFiles = dir =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(full)
    return SOURCE_EXTENSIONS.includes(path.extname(entry.name)) &&
      !entry.name.endsWith('.d.ts')
      ? [full]
      : []
  })

/**
 * The `src`-relative source file an import specifier loads, or null for a
 * package or anything that is not a source file under `src`.
 */
const resolveSpecifier = (fromFile, specifier, files) => {
  let base
  if (specifier.startsWith('.')) {
    base = path.posix.join(path.posix.dirname(fromFile), specifier)
  } else if (specifier.startsWith('@/')) {
    base = specifier.slice(2)
  } else {
    return null
  }
  const stem = base.replace(/\.(ts|tsx|js|jsx)$/, '')
  return (
    [
      base,
      ...SOURCE_EXTENSIONS.map(ext => stem + ext),
      ...SOURCE_EXTENSIONS.map(ext => path.posix.join(base, `index${ext}`))
    ].find(candidate => files.has(candidate)) ?? null
  )
}

/**
 * `import`/`export ... from` statements and bare side-effect imports.
 * `import type` / `export type` statements, and clauses whose every named
 * binding is `type`-qualified, are erased at compile time, so they cannot
 * form a runtime cycle.
 */
const STATEMENT_PATTERN =
  /^(?:import|export)\s+(type\s+)?([^;'"]*?)\s*from\s+['"]([^'"]+)['"]|^import\s+['"]([^'"]+)['"]/gms

const isTypeOnlyClause = clause => {
  const braces = clause.trim().match(/^\{([^}]*)\}$/)
  if (!braces) return false
  const names = braces[1]
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
  return names.length > 0 && names.every(name => name.startsWith('type '))
}

const runtimeImports = (file, files) => {
  const deps = new Set()
  const source = readFileSync(path.join(SRC_DIR, file), 'utf8')
  for (const match of source.matchAll(STATEMENT_PATTERN)) {
    const [, typeKeyword, clause = '', fromSpecifier, bareSpecifier] = match
    if (typeKeyword || isTypeOnlyClause(clause)) continue
    const target = resolveSpecifier(file, fromSpecifier ?? bareSpecifier, files)
    if (target) deps.add(target)
  }
  return deps
}

/** `src`-relative file -> the `src` files it loads at runtime. */
const buildRuntimeImportGraph = () => {
  const files = new Set(
    listSourceFiles(SRC_DIR)
      .map(file => path.relative(SRC_DIR, file).split(path.sep).join('/'))
      .sort()
  )
  return new Map([...files].map(file => [file, runtimeImports(file, files)]))
}

/** Strongly connected components with more than one file, or a self-import. */
const findCyclicComponents = graph => {
  const index = new Map()
  const lowLink = new Map()
  const stack = []
  const onStack = new Set()
  const components = []
  const connect = node => {
    index.set(node, index.size)
    lowLink.set(node, index.get(node))
    stack.push(node)
    onStack.add(node)
    for (const next of graph.get(node)) {
      if (!index.has(next)) {
        connect(next)
        lowLink.set(node, Math.min(lowLink.get(node), lowLink.get(next)))
      } else if (onStack.has(next)) {
        lowLink.set(node, Math.min(lowLink.get(node), index.get(next)))
      }
    }
    if (lowLink.get(node) !== index.get(node)) return
    const component = []
    let member
    do {
      member = stack.pop()
      onStack.delete(member)
      component.push(member)
    } while (member !== node)
    if (component.length > 1 || graph.get(node).has(node)) {
      components.push(component.sort())
    }
  }
  for (const node of graph.keys()) if (!index.has(node)) connect(node)
  return components
}

/**
 * Elementary cycles that pass through a gated file, each enumerated once from
 * its alphabetically smallest file. Only components holding a gated file are
 * searched, since every cycle lies inside one component.
 */
const findGatedCycles = graph => {
  const cycles = []
  for (const component of findCyclicComponents(graph)) {
    if (!component.some(file => file.startsWith(GATED_DIR))) continue
    for (let startIndex = 0; startIndex < component.length; startIndex++) {
      const start = component[startIndex]
      const allowed = new Set(component.slice(startIndex))
      const stack = [start]
      const onStack = new Set(stack)
      const visit = node => {
        for (const next of graph.get(node)) {
          if (cycles.length >= MAX_CYCLES) return
          if (!allowed.has(next)) continue
          if (next === start) {
            if (stack.some(file => file.startsWith(GATED_DIR))) {
              cycles.push([...stack, start].join(' -> '))
            }
          } else if (!onStack.has(next)) {
            stack.push(next)
            onStack.add(next)
            visit(next)
            stack.pop()
            onStack.delete(next)
          }
        }
      }
      visit(start)
    }
  }
  return cycles
}

const graph = buildRuntimeImportGraph()

test('the import graph is parsed, with type-only imports left out', () => {
  // A parser that matched nothing would pass the cycle check vacuously.
  assert.ok(
    graph
      .get('domain/expedition/authority.ts')
      ?.has('domain/expedition/contracts.ts'),
    'authority.ts -> contracts.ts runtime edge not found'
  )
  // `import type { MapNodeType } from '../../utils/mapNodeTypes'` is erased.
  assert.ok(
    !graph.get('domain/expedition/map.ts')?.has('utils/mapNodeTypes.ts'),
    'type-only import counted as a runtime edge'
  )
})

test('no runtime import cycle runs through src/domain/expedition beyond the allowlist', () => {
  const cycles = findGatedCycles(graph)
  const unexpected = cycles.filter(cycle => !ALLOWED_CYCLES.includes(cycle))
  assert.deepEqual(
    unexpected,
    [],
    `new runtime import cycle(s):\n${unexpected.join('\n')}`
  )
  const stale = ALLOWED_CYCLES.filter(cycle => !cycles.includes(cycle))
  assert.deepEqual(
    stale,
    [],
    `allowlisted cycle(s) no longer exist, remove them:\n${stale.join('\n')}`
  )
})
