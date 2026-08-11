/**
 * Runtime list of every overworld map node type.
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

export type MapNodeType = (typeof MAP_NODE_TYPES)[number]

const MAP_NODE_TYPE_SET: ReadonlySet<string> = new Set(MAP_NODE_TYPES)

/**
 * Narrows an untrusted value to a known map node type.
 *
 * @param value - Candidate node type from a save file or generated map.
 * @returns `true` when the value is a member of {@link MAP_NODE_TYPES}.
 */
export const isMapNodeType = (value: unknown): value is MapNodeType =>
  typeof value === 'string' && MAP_NODE_TYPE_SET.has(value)
