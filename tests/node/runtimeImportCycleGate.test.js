import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  buildRuntimeImportGraph,
  evaluateRuntimeGraph,
  findShortestReturnPath
} from '../../scripts/utils/runtime-import-graph.mjs'

const ROOT_URL = new URL('../../', import.meta.url)
const BASELINE_PATH = '.ci/runtime-import-cycle-baseline.json'

/**
 * Baseline groups, one per reviewed cyclic component, named after the
 * directories of its files. A group whose cycles are all broken is removed
 * from the baseline; the gate does not require every name to be present.
 */
const BASELINE_GROUPS = [
  'game-state-economy-assets',
  'logging-error-handling',
  'quest-lifecycle',
  'audio-facade'
]

/**
 * Files allowed to reference declaration-only targets. The types barrel
 * re-exports `.d.ts` contracts, which load nothing at runtime.
 */
const DECLARATION_ONLY_IMPORTERS = ['src/types/index.ts']

/** Far below the ~850 real vertices; catches an empty or partial walk. */
const MIN_VERTICES = 500

/** A known runtime edge outside every cycle. */
const KNOWN_ACYCLIC_EDGE = [
  'src/scenes/MainMenu.tsx',
  'src/hooks/useBandHQModal.ts'
]

const graph = buildRuntimeImportGraph(fileURLToPath(ROOT_URL))

const edgeKey = ([source, target]) => `${source} -> ${target}`

const isPair = value =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every(end => typeof end === 'string' && end.startsWith('src/'))

/** The flattened baseline edges, or a failed assertion naming the defect. */
const readBaseline = () => {
  const baseline = JSON.parse(
    readFileSync(new URL(BASELINE_PATH, ROOT_URL), 'utf8')
  )
  const unknownKeys = Object.keys(baseline).filter(
    key => key !== 'comment' && !BASELINE_GROUPS.includes(key)
  )
  assert.deepEqual(
    unknownKeys,
    [],
    `unknown top-level keys in ${BASELINE_PATH}`
  )
  assert.equal(typeof baseline.comment, 'string', 'baseline comment missing')
  const keys = new Set()
  for (const group of BASELINE_GROUPS.filter(name =>
    Object.hasOwn(baseline, name)
  )) {
    const pairs = baseline[group]
    assert.ok(
      Array.isArray(pairs) && pairs.length > 0 && pairs.every(isPair),
      `${BASELINE_PATH} group '${group}' must be a nonempty list of [source, target] src paths; remove an empty group`
    )
    const groupKeys = pairs.map(edgeKey)
    assert.deepEqual(
      groupKeys,
      [...groupKeys].sort(),
      `${BASELINE_PATH} group '${group}' is not sorted`
    )
    for (const key of groupKeys) {
      assert.ok(!keys.has(key), `${BASELINE_PATH} lists ${key} twice`)
      keys.add(key)
    }
  }
  return keys
}

/**
 * A verdict failure with the source line of a nonliteral dynamic import
 * appended, since the finding itself has no specifier text to name.
 */
const withSourceLine = failure => {
  const match = /^nonliteral dynamic import in (.+):(\d+)$/.exec(failure)
  if (!match) return failure
  const lines = readFileSync(new URL(match[1], ROOT_URL), 'utf8').split('\n')
  return `${failure}: ${lines[Number(match[2]) - 1]?.trim() ?? ''}`
}

test('the runtime import graph of src is complete enough to gate on', () => {
  assert.ok(graph.edges.length > 0, 'the runtime import graph has no edges')
  const { failures } = evaluateRuntimeGraph(graph, {
    minVertices: MIN_VERTICES
  })
  assert.deepEqual(
    failures,
    [],
    `the runtime import graph cannot be trusted; fix each import:\n${failures.map(withSourceLine).join('\n')}`
  )
})

test('declaration-only targets are referenced only from the allowlist', () => {
  const unexpected = graph.diagnostics.declarationOnly
    .filter(finding => !DECLARATION_ONLY_IMPORTERS.includes(finding.importer))
    .map(
      finding =>
        `'${finding.specifier}' in ${finding.importer}:${finding.line} resolves only to ${finding.target}`
    )
  assert.deepEqual(
    unexpected,
    [],
    `declaration-only import(s) load nothing at runtime; use \`import type\` or a code module:\n${unexpected.join('\n')}`
  )
  const unused = DECLARATION_ONLY_IMPORTERS.filter(
    importer =>
      !graph.diagnostics.declarationOnly.some(
        finding => finding.importer === importer
      )
  )
  assert.deepEqual(
    unused,
    [],
    'remove unused DECLARATION_ONLY_IMPORTERS entries'
  )
})

test('a known acyclic runtime edge is present and outside the baseline', () => {
  const key = edgeKey(KNOWN_ACYCLIC_EDGE)
  assert.ok(
    graph.edges.some(edge => edgeKey(edge) === key),
    `${key} runtime edge not found`
  )
  assert.ok(
    !graph.cyclicEdges.some(edge => edgeKey(edge) === key),
    `${key} is unexpectedly cyclic`
  )
  assert.ok(!readBaseline().has(key), `${key} must not be in the baseline`)
})

test('runtime import cycle edges in src match the reviewed baseline', () => {
  const baseline = readBaseline()
  const current = new Set(graph.cyclicEdges.map(edgeKey))
  const added = graph.cyclicEdges
    .filter(edge => !baseline.has(edgeKey(edge)))
    .map(([source, target]) => {
      const back = findShortestReturnPath(graph, source, target) ?? []
      return `${source} -> ${target}\n    cycle: ${[source, ...back].join(' -> ')}`
    })
  assert.deepEqual(
    added,
    [],
    `new runtime import cycle edge(s). Break the cycle, for example by importing the low-level module directly instead of a barrel; do not add the edge to ${BASELINE_PATH}:\n${added.join('\n')}`
  )
  const stale = [...baseline].filter(key => !current.has(key))
  assert.deepEqual(
    stale,
    [],
    `baseline edge(s) no longer cyclic. Remove them from ${BASELINE_PATH}:\n${stale.join('\n')}`
  )
})
