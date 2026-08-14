import { MAP_NODE_TYPES, isMapNodeType } from './mapNodeTypes'
import type { MapNodeType } from './mapNodeTypes'
import { isLooseRecord, isForbiddenKey } from './objectUtils'
import { isFiniteNumber } from './finiteNumber'

/**
 * Node shape a validated map is guaranteed to contain.
 *
 * @remarks
 * This module is the single source of truth for the generated-map contract:
 * the exported types are what {@link validateGeneratedMap} narrows to, so
 * there is no separate schema to drift from the declared type.
 */
interface ValidatedMapNode {
  id: string
  layer: number
  type: MapNodeType
  x: number
  y: number
  status: 'unlocked' | 'completed' | 'locked'
  venue: { id: string; name: string }
  neighbors?: string[]
  shopInventory?: import('../types/components').PurchaseItem[]
  [key: string]: unknown
}

/**
 * Connection between two nodes in a validated map.
 */
interface ValidatedMapConnection {
  from: string
  to: string
}

/**
 * Generated map that satisfies the structural and diversity contract.
 */
export interface ValidatedMap {
  nodes: Record<string, ValidatedMapNode>
  connections: ValidatedMapConnection[]
  edges?: Array<{ from: string; to: string }>
  cityStates?: Record<string, import('../types/game').CityTraitState>
  [key: string]: unknown
}

/**
 * One reason a map failed validation.
 */
export interface MapValidationIssue {
  /** Stable machine-readable code used in the failure signature. */
  code: string
  /** Dotted path to the offending value, or `''` for whole-map issues. */
  path: string
  /** Human-readable explanation for logs. */
  message: string
}

/**
 * Outcome of validating a generated map.
 */
export type MapValidationResult =
  | { success: true; data: ValidatedMap }
  | { success: false; issues: MapValidationIssue[]; signature: string }

/**
 * Minimum structural diversity a map must have to be playable.
 *
 * @remarks
 * A single straight line of gig nodes passes every structural check but is not
 * a game, so the contract also requires branching and non-gig variety. The
 * fallback template map is held to the same bar.
 */
export const MAP_DIVERSITY_REQUIREMENTS = {
  /** Nodes with two or more outgoing connections. */
  minBranchPoints: 3,
  /** Nodes whose type is not `GIG`. */
  minNonGigNodes: 3,
  /** Distinct node types present on the map. */
  minDistinctNodeTypes: 3,
  /** Layers between START and the deepest node, inclusive. */
  minLayers: 4
} as const

const NODE_STATUSES = new Set(['unlocked', 'completed', 'locked'])

const validateNode = (
  raw: unknown,
  key: string,
  issues: MapValidationIssue[]
): ValidatedMapNode | null => {
  const path = `nodes.${key}`
  if (!isLooseRecord(raw)) {
    issues.push({
      code: 'node.notObject',
      path,
      message: 'node is not an object'
    })
    return null
  }

  let ok = true
  const fail = (code: string, message: string) => {
    ok = false
    issues.push({ code, path, message })
  }

  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    fail('node.id.invalid', 'node id must be a non-empty string')
  } else if (raw.id !== key) {
    fail(
      'node.id.mismatch',
      `node id "${raw.id}" does not match record key "${key}"`
    )
  }
  if (
    !isFiniteNumber(raw.layer) ||
    raw.layer < 0 ||
    !Number.isInteger(raw.layer)
  ) {
    fail('node.layer.invalid', 'node layer must be a non-negative integer')
  }
  if (!isMapNodeType(raw.type)) {
    fail(
      'node.type.invalid',
      `node type must be one of ${MAP_NODE_TYPES.join(', ')}`
    )
  }
  if (!isFiniteNumber(raw.x) || !isFiniteNumber(raw.y)) {
    fail('node.coords.invalid', 'node x and y must be finite numbers')
  }
  if (typeof raw.status !== 'string' || !NODE_STATUSES.has(raw.status)) {
    fail(
      'node.status.invalid',
      'node status must be unlocked, completed, or locked'
    )
  }
  if (
    !isLooseRecord(raw.venue) ||
    typeof raw.venue.id !== 'string' ||
    raw.venue.id.length === 0 ||
    typeof raw.venue.name !== 'string' ||
    raw.venue.name.length === 0
  ) {
    fail('node.venue.invalid', 'node venue must carry a non-empty id and name')
  }

  return ok ? (raw as unknown as ValidatedMapNode) : null
}

const validateConnections = (
  raw: unknown,
  nodeIds: ReadonlySet<string>,
  issues: MapValidationIssue[]
): ValidatedMapConnection[] | null => {
  if (!Array.isArray(raw)) {
    issues.push({
      code: 'connections.notArray',
      path: 'connections',
      message: 'connections must be an array'
    })
    return null
  }

  const connections: ValidatedMapConnection[] = []
  let ok = true
  for (let i = 0; i < raw.length; i++) {
    const path = `connections[${i}]`
    const entry = raw[i]
    if (
      !isLooseRecord(entry) ||
      typeof entry.from !== 'string' ||
      typeof entry.to !== 'string'
    ) {
      issues.push({
        code: 'connection.shape.invalid',
        path,
        message: 'connection must be { from: string, to: string }'
      })
      ok = false
      continue
    }
    if (entry.from === entry.to) {
      issues.push({
        code: 'connection.selfLoop',
        path,
        message: `connection loops on "${entry.from}"`
      })
      ok = false
      continue
    }
    if (!nodeIds.has(entry.from) || !nodeIds.has(entry.to)) {
      issues.push({
        code: 'connection.danglingEndpoint',
        path,
        message: `connection references unknown node "${nodeIds.has(entry.from) ? entry.to : entry.from}"`
      })
      ok = false
      continue
    }
    connections.push({ from: entry.from, to: entry.to })
  }

  return ok ? connections : null
}

const collectReachable = (
  startId: string,
  connections: readonly ValidatedMapConnection[]
): Set<string> => {
  const outgoing = new Map<string, string[]>()
  for (const connection of connections) {
    const list = outgoing.get(connection.from)
    if (list) list.push(connection.to)
    else outgoing.set(connection.from, [connection.to])
  }

  const seen = new Set<string>([startId])
  const queue = [startId]
  while (queue.length > 0) {
    const current = queue.pop() as string
    for (const next of outgoing.get(current) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push(next)
    }
  }
  return seen
}

const validateDiversity = (
  nodes: Record<string, ValidatedMapNode>,
  connections: readonly ValidatedMapConnection[],
  issues: MapValidationIssue[]
): void => {
  const nodeList = Object.values(nodes)
  const outDegree = new Map<string, number>()
  for (const connection of connections) {
    outDegree.set(connection.from, (outDegree.get(connection.from) ?? 0) + 1)
  }

  // ⚡ BOLT OPTIMIZATION: Replaced .filter(...).length with a for loop to avoid intermediate array allocation.
  let branchPoints = 0
  for (const degree of outDegree.values()) {
    if (degree >= 2) branchPoints++
  }
  if (branchPoints < MAP_DIVERSITY_REQUIREMENTS.minBranchPoints) {
    issues.push({
      code: 'diversity.branchPoints',
      path: 'connections',
      message: `map has ${branchPoints} branch points, needs ${MAP_DIVERSITY_REQUIREMENTS.minBranchPoints}`
    })
  }

  // ⚡ BOLT OPTIMIZATION: Replaced .filter(...).length with a for loop to avoid intermediate array allocation.
  let nonGigNodes = 0
  for (let i = 0; i < nodeList.length; i++) {
    const node = nodeList[i]
    if (node && node.type !== 'GIG') nonGigNodes++
  }
  if (nonGigNodes < MAP_DIVERSITY_REQUIREMENTS.minNonGigNodes) {
    issues.push({
      code: 'diversity.nonGigNodes',
      path: 'nodes',
      message: `map has ${nonGigNodes} non-GIG nodes, needs ${MAP_DIVERSITY_REQUIREMENTS.minNonGigNodes}`
    })
  }

  const distinctTypes = new Set(nodeList.map(node => node.type)).size
  if (distinctTypes < MAP_DIVERSITY_REQUIREMENTS.minDistinctNodeTypes) {
    issues.push({
      code: 'diversity.distinctNodeTypes',
      path: 'nodes',
      message: `map has ${distinctTypes} distinct node types, needs ${MAP_DIVERSITY_REQUIREMENTS.minDistinctNodeTypes}`
    })
  }

  const layers = new Set(nodeList.map(node => node.layer)).size
  if (layers < MAP_DIVERSITY_REQUIREMENTS.minLayers) {
    issues.push({
      code: 'diversity.layers',
      path: 'nodes',
      message: `map has ${layers} layers, needs ${MAP_DIVERSITY_REQUIREMENTS.minLayers}`
    })
  }
}

/**
 * Builds a stable, low-cardinality signature for a validation failure.
 *
 * @param issues - Issues collected during validation.
 * @returns Sorted, de-duplicated issue codes joined by `|`.
 *
 * @remarks
 * Signatures are meant for logs and telemetry grouping, so they intentionally
 * carry codes only — never node ids or seeds, which would make every failure
 * unique.
 */
export const buildMapFailureSignature = (
  issues: readonly MapValidationIssue[]
): string => [...new Set(issues.map(issue => issue.code))].sort().join('|')

/**
 * Validates a generated or committed map against the structural and diversity
 * contract before it reaches gameplay.
 *
 * @param raw - Untrusted map value, straight from the generator or a JSON file.
 * @returns The narrowed map on success, or the issues plus a grouping signature.
 */
export const validateGeneratedMap = (raw: unknown): MapValidationResult => {
  const issues: MapValidationIssue[] = []

  if (!isLooseRecord(raw)) {
    issues.push({
      code: 'map.notObject',
      path: '',
      message: 'map is not an object'
    })
    return {
      success: false,
      issues,
      signature: buildMapFailureSignature(issues)
    }
  }
  if (!isLooseRecord(raw.nodes)) {
    issues.push({
      code: 'map.nodes.notObject',
      path: 'nodes',
      message: 'nodes must be a record'
    })
    return {
      success: false,
      issues,
      signature: buildMapFailureSignature(issues)
    }
  }

  const nodes: Record<string, ValidatedMapNode> = Object.create(null) as Record<
    string,
    ValidatedMapNode
  >
  for (const key of Object.keys(raw.nodes)) {
    if (isForbiddenKey(key)) {
      issues.push({
        code: 'node.key.forbidden',
        path: `nodes.${key}`,
        message: `node key "${key}" is not allowed`
      })
      continue
    }
    if (!Object.hasOwn(raw.nodes, key)) continue
    const node = validateNode(raw.nodes[key], key, issues)
    if (node) nodes[key] = node
  }

  const nodeIds = new Set(Object.keys(raw.nodes))
  if (nodeIds.size === 0) {
    issues.push({
      code: 'map.nodes.empty',
      path: 'nodes',
      message: 'map has no nodes'
    })
  }

  const connections = validateConnections(raw.connections, nodeIds, issues)

  // ⚡ BOLT OPTIMIZATION: Replaced Object.values().filter() with a for...in loop to avoid intermediate array allocation.
  const startNodes: ValidatedMapNode[] = []
  for (const key in nodes) {
    if (Object.hasOwn(nodes, key)) {
      const node = nodes[key]
      if (node && node.type === 'START') {
        startNodes.push(node)
      }
    }
  }
  if (startNodes.length !== 1) {
    issues.push({
      code: 'map.start.count',
      path: 'nodes',
      message: `map must have exactly one START node, found ${startNodes.length}`
    })
  } else if (startNodes[0]?.layer !== 0) {
    issues.push({
      code: 'map.start.layer',
      path: 'nodes',
      message: 'the START node must sit on layer 0'
    })
  }

  if (connections && startNodes.length === 1 && startNodes[0]) {
    const reachable = collectReachable(startNodes[0].id, connections)
    // ⚡ BOLT OPTIMIZATION: Replaced Object.keys().filter() with a for...in loop to avoid intermediate array allocation.
    const orphans: string[] = []
    for (const id in nodes) {
      if (Object.hasOwn(nodes, id) && !reachable.has(id)) {
        orphans.push(id)
      }
    }
    if (orphans.length > 0) {
      issues.push({
        code: 'map.unreachableNodes',
        path: 'nodes',
        message: `${orphans.length} node(s) unreachable from START, first: ${orphans[0]}`
      })
    }
    validateDiversity(nodes, connections, issues)
  }

  if (issues.length > 0) {
    return {
      success: false,
      issues,
      signature: buildMapFailureSignature(issues)
    }
  }

  return { success: true, data: { nodes, connections: connections ?? [] } }
}
