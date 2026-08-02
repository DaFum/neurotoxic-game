import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import {
  loadFallbackMap,
  validateFallbackMap
} from '../../src/utils/fallbackMap'
import { MAP_DIVERSITY_REQUIREMENTS } from '../../src/utils/mapValidation'
import { VENUES_BY_ID } from '../../src/data/venues'

/**
 * The committed fallback map is the last line of defence for a player's run.
 * It is held to the exact same contract as a generated map, so a schema change,
 * node-type rename, or edge-format change fails CI instead of failing the
 * recovery path at the moment it is needed.
 */
describe('committed fallback map', () => {
  test('passes the generated-map contract', () => {
    const result = validateFallbackMap()

    assert.deepEqual(
      result.success ? [] : result.issues,
      [],
      'src/data/fallbackMap.json drifted from the map contract'
    )
  })

  test('loads as a usable map', () => {
    const map = loadFallbackMap()

    assert.ok(map, 'fallback map must load')
    assert.ok(Object.keys(map.nodes).length > 0)
    assert.ok(map.connections.length > 0)
  })

  test('meets the diversity floor with headroom, not exactly at the limit', () => {
    const map = loadFallbackMap()
    const nodes = Object.values(map.nodes)

    const outDegree = new Map()
    for (const connection of map.connections) {
      outDegree.set(connection.from, (outDegree.get(connection.from) ?? 0) + 1)
    }
    const branchPoints = [...outDegree.values()].filter(d => d >= 2).length

    assert.ok(
      branchPoints >= MAP_DIVERSITY_REQUIREMENTS.minBranchPoints,
      `branch points: ${branchPoints}`
    )
    assert.ok(
      nodes.filter(node => node.type !== 'GIG').length >=
        MAP_DIVERSITY_REQUIREMENTS.minNonGigNodes
    )
    assert.ok(
      new Set(nodes.map(node => node.type)).size >=
        MAP_DIVERSITY_REQUIREMENTS.minDistinctNodeTypes
    )
    assert.ok(
      new Set(nodes.map(node => node.layer)).size >=
        MAP_DIVERSITY_REQUIREMENTS.minLayers
    )
  })

  test('has a START and a FINALE so a run can be played to the end', () => {
    const types = Object.values(loadFallbackMap().nodes).map(node => node.type)

    assert.equal(types.filter(type => type === 'START').length, 1)
    assert.ok(types.includes('FINALE'), 'fallback map must contain a FINALE')
  })

  test('references only venues that still exist', () => {
    const missing = Object.values(loadFallbackMap().nodes)
      .map(node => node.venue.id)
      .filter(venueId => !VENUES_BY_ID.has(venueId))

    assert.deepEqual([...new Set(missing)], [])
  })
})
