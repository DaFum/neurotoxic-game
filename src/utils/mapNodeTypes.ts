import type { MapNodeType } from '../types'

/**
 * Runtime list of every overworld map node type.
 *
 * @remarks
 * `MapNodeType` is erased at runtime, so arrival-exhaustiveness tests need a
 * value to iterate. The two assertions below make this list and the union fail
 * to compile the moment either side gains or loses a member.
 */
export const MAP_NODE_TYPES = [
  'START',
  'GIG',
  'SPECIAL',
  'REST_STOP',
  'FESTIVAL',
  'FINALE',
  'CITY',
  'REST',
  'SUPPLY_STOP'
] as const

// Every listed value is a MapNodeType…
const _listedAreNodeTypes: readonly MapNodeType[] = MAP_NODE_TYPES
// …and every MapNodeType is listed.
const _nodeTypesAreListed: (typeof MAP_NODE_TYPES)[number] =
  null as unknown as MapNodeType
void _listedAreNodeTypes
void _nodeTypesAreListed

const MAP_NODE_TYPE_SET: ReadonlySet<string> = new Set(MAP_NODE_TYPES)

/**
 * Narrows an untrusted value to a known map node type.
 *
 * @param value - Candidate node type from a save file or generated map.
 * @returns `true` when the value is a member of {@link MAP_NODE_TYPES}.
 */
export const isMapNodeType = (value: unknown): value is MapNodeType =>
  typeof value === 'string' && MAP_NODE_TYPE_SET.has(value)
