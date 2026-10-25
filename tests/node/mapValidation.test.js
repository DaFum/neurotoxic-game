import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { MapGenerator } from '../../src/utils/mapGenerator'
import {
  deriveCityTraits,
  getCityKeyFromVenueId
} from '../../src/utils/mapGenerator/cityTraits'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'
import { createSetMapAction } from '../../src/context/actionCreators'
import {
  MAP_DIVERSITY_REQUIREMENTS,
  buildMapFailureSignature,
  validateGeneratedMap
} from '../../src/utils/mapValidation'

const generate = seed => new MapGenerator(seed).generateMap()

const buildLinearMap = () => {
  const nodes = {}
  const connections = []
  for (let layer = 0; layer < 6; layer++) {
    const id = `node_${layer}_0`
    nodes[id] = {
      id,
      layer,
      type: layer === 0 ? 'START' : 'GIG',
      x: 50,
      y: layer * 10,
      status: layer === 0 ? 'unlocked' : 'locked',
      venue: { id: `venue_${layer}`, name: `Venue ${layer}` }
    }
    if (layer > 0) {
      connections.push({ from: `node_${layer - 1}_0`, to: id })
    }
  }
  return { nodes, connections }
}

describe('validateGeneratedMap', () => {
  test('accepts every map the generator produces across many seeds', () => {
    const failures = []
    for (let seed = 0; seed < 200; seed++) {
      const result = validateGeneratedMap(generate(seed))
      if (!result.success) failures.push({ seed, signature: result.signature })
    }

    assert.deepEqual(failures, [])
  })

  test('narrows nodes and connections on success', () => {
    const result = validateGeneratedMap(generate(7))

    assert.equal(result.success, true)
    assert.ok(Object.keys(result.data.nodes).length > 0)
    assert.ok(Array.isArray(result.data.connections))
  })

  test('rejects non-object maps', () => {
    for (const raw of [null, undefined, 42, 'map', []]) {
      const result = validateGeneratedMap(raw)
      assert.equal(result.success, false)
      assert.ok(result.signature.length > 0)
    }
  })

  test('rejects a node whose id does not match its record key', () => {
    const map = buildLinearMap()
    map.nodes.node_1_0.id = 'node_9_9'

    const result = validateGeneratedMap(map)
    assert.equal(result.success, false)
    assert.ok(result.issues.some(issue => issue.code === 'node.id.mismatch'))
  })

  test('rejects an unknown node type', () => {
    const map = buildLinearMap()
    map.nodes.node_2_0.type = 'WORMHOLE'

    const result = validateGeneratedMap(map)
    assert.equal(result.success, false)
    assert.ok(result.issues.some(issue => issue.code === 'node.type.invalid'))
  })

  test('rejects connections pointing at unknown nodes', () => {
    const map = buildLinearMap()
    map.connections.push({ from: 'node_0_0', to: 'node_missing' })

    const result = validateGeneratedMap(map)
    assert.equal(result.success, false)
    assert.ok(
      result.issues.some(issue => issue.code === 'connection.danglingEndpoint')
    )
  })

  test('rejects maps without exactly one START node on layer 0', () => {
    const noStart = buildLinearMap()
    noStart.nodes.node_0_0.type = 'GIG'
    assert.ok(
      validateGeneratedMap(noStart).issues.some(
        issue => issue.code === 'map.start.count'
      )
    )
  })

  test('rejects nodes unreachable from START', () => {
    const map = buildLinearMap()
    map.nodes.node_9_9 = {
      id: 'node_9_9',
      layer: 9,
      type: 'GIG',
      x: 10,
      y: 10,
      status: 'locked',
      venue: { id: 'venue_orphan', name: 'Orphan' }
    }

    const result = validateGeneratedMap(map)
    assert.equal(result.success, false)
    assert.ok(
      result.issues.some(issue => issue.code === 'map.unreachableNodes')
    )
  })

  test('rejects a self-looping connection', () => {
    const map = buildLinearMap()
    map.connections.push({ from: 'node_1_0', to: 'node_1_0' })

    const result = validateGeneratedMap(map)
    assert.equal(result.success, false)
    assert.ok(result.issues.some(issue => issue.code === 'connection.selfLoop'))
  })

  test('rejects malformed node coordinates, status, and venue', () => {
    const map = buildLinearMap()
    map.nodes.node_1_0.x = Number.NaN
    map.nodes.node_2_0.status = 'haunted'
    map.nodes.node_3_0.venue = { id: '', name: '' }

    const codes = validateGeneratedMap(map).issues.map(issue => issue.code)
    assert.ok(codes.includes('node.coords.invalid'))
    assert.ok(codes.includes('node.status.invalid'))
    assert.ok(codes.includes('node.venue.invalid'))
  })

  test('rejects a START node that is not on layer 0', () => {
    const map = buildLinearMap()
    map.nodes.node_0_0.layer = 1
    map.nodes.node_1_0.layer = 2

    const codes = validateGeneratedMap(map).issues.map(issue => issue.code)
    assert.ok(codes.includes('map.start.layer'))
  })

  test('rejects a map with no nodes', () => {
    const codes = validateGeneratedMap({
      nodes: {},
      connections: []
    }).issues.map(issue => issue.code)

    assert.ok(codes.includes('map.nodes.empty'))
  })

  test('rejects a prototype-polluting node key instead of swallowing the node', () => {
    // `JSON.parse` yields `__proto__` as an own key. Assigning it would set the
    // accumulator's prototype, dropping the node from every later check.
    const map = buildLinearMap()
    const hostileNodes = JSON.parse(
      '{"__proto__":{"id":"__proto__","layer":1,"type":"GIG","x":1,"y":1,"status":"locked","venue":{"id":"v","name":"V"}}}'
    )
    Object.assign(hostileNodes, map.nodes)
    const result = validateGeneratedMap({
      nodes: hostileNodes,
      connections: map.connections
    })

    assert.equal(result.success, false)
    assert.ok(result.issues.some(issue => issue.code === 'node.key.forbidden'))
  })

  test('rejects a straight line of gig nodes for lacking diversity', () => {
    const result = validateGeneratedMap(buildLinearMap())

    assert.equal(result.success, false)
    const codes = result.issues.map(issue => issue.code)
    assert.ok(codes.includes('diversity.branchPoints'))
    assert.ok(codes.includes('diversity.nonGigNodes'))
    assert.ok(codes.includes('diversity.distinctNodeTypes'))
  })

  test('diversity requirements are all positive', () => {
    for (const [name, value] of Object.entries(MAP_DIVERSITY_REQUIREMENTS)) {
      assert.ok(value > 0, `${name} must be positive`)
    }
  })

  test('failure signatures are stable, sorted, and de-duplicated', () => {
    const issues = [
      { code: 'b', path: '', message: '' },
      { code: 'a', path: '', message: '' },
      { code: 'b', path: '', message: '' }
    ]

    assert.equal(buildMapFailureSignature(issues), 'a|b')
  })
})

describe('validateGeneratedMap city intel', () => {
  const cityKeysOf = nodes =>
    Object.values(nodes)
      .map(node => getCityKeyFromVenueId(node.venue.id))
      .filter(Boolean)

  test('keeps the generator cityStates for a fresh map', () => {
    const raw = generate(1)
    const result = validateGeneratedMap(raw)

    assert.equal(result.success, true)
    assert.ok(Object.keys(result.data.cityStates).length > 0)
    assert.deepEqual(result.data.cityStates, raw.cityStates)
    for (const cityKey of cityKeysOf(result.data.nodes)) {
      assert.ok(Object.hasOwn(result.data.cityStates, cityKey), cityKey)
    }
  })

  test('returns cityStates for every seed that validates', () => {
    const missing = []
    for (let seed = 0; seed < 100; seed++) {
      const result = validateGeneratedMap(generate(seed))
      if (result.success && !result.data.cityStates) missing.push(seed)
    }
    assert.deepEqual(missing, [])
  })

  test('survives SET_MAP, so a new run shows city intel without a reload', () => {
    const result = validateGeneratedMap(generate(1))
    const state = gameReducer(
      createInitialState(),
      createSetMapAction(result.data)
    )
    assert.ok(Object.keys(state.gameMap.cityStates ?? {}).length > 0)
    assert.deepEqual(state.gameMap.cityStates, result.data.cityStates)
  })

  test('derives intel for cities the map did not carry', () => {
    const raw = generate(1)
    const result = validateGeneratedMap({ ...raw, cityStates: undefined })

    assert.equal(result.success, true)
    const cityKeys = [...new Set(cityKeysOf(raw.nodes))]
    assert.ok(cityKeys.length > 0)
    for (const cityKey of cityKeys) {
      assert.deepEqual(
        result.data.cityStates[cityKey],
        deriveCityTraits(cityKey)
      )
    }
  })

  test('derives intel under the normalized city key for a legacy namespaced venue id', () => {
    const raw = generate(1)
    const [nodeId] = Object.keys(raw.nodes)
    const venue = raw.nodes[nodeId].venue
    const cityKey = getCityKeyFromVenueId(venue.id)
    const legacy = {
      ...raw,
      cityStates: undefined,
      nodes: {
        ...raw.nodes,
        [nodeId]: {
          ...raw.nodes[nodeId],
          venue: { ...venue, id: `venues:${venue.id}` }
        }
      }
    }
    const result = validateGeneratedMap(legacy)

    assert.equal(result.success, true)
    assert.ok(Object.hasOwn(result.data.cityStates, cityKey), cityKey)
    assert.equal(
      Object.keys(result.data.cityStates).some(key =>
        key.startsWith('venues:')
      ),
      false
    )
  })

  test('keeps a valid entry and replaces an invalid one with derived traits', () => {
    const raw = generate(1)
    const cityKey = cityKeysOf(raw.nodes)[0]
    const custom = {
      genreBias: 'metal',
      attentionSpan: 42,
      barSpendingProfile: 'high'
    }
    const kept = validateGeneratedMap({
      ...raw,
      cityStates: { [cityKey]: { ...custom, extra: 'dropped' } }
    })
    assert.deepEqual(kept.data.cityStates[cityKey], custom)

    for (const attentionSpan of ['30', Number.NaN]) {
      const repaired = validateGeneratedMap({
        ...raw,
        cityStates: { [cityKey]: { ...custom, attentionSpan } }
      })
      assert.deepEqual(
        repaired.data.cityStates[cityKey],
        deriveCityTraits(cityKey)
      )
    }
  })

  test('skips forbidden keys and survives a malformed container', () => {
    const raw = generate(1)
    const hostile = JSON.parse(
      '{"__proto__":{"genreBias":"x","attentionSpan":1,"barSpendingProfile":"y"}}'
    )
    const withHostile = validateGeneratedMap({ ...raw, cityStates: hostile })
    assert.equal(withHostile.success, true)
    assert.equal(Object.hasOwn(withHostile.data.cityStates, '__proto__'), false)

    for (const container of [null, [], 'x', 5]) {
      const result = validateGeneratedMap({ ...raw, cityStates: container })
      assert.equal(result.success, true)
      for (const cityKey of cityKeysOf(raw.nodes)) {
        assert.deepEqual(
          result.data.cityStates[cityKey],
          deriveCityTraits(cityKey)
        )
      }
    }
  })
})
