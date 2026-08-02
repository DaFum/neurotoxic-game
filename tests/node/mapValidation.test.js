import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { MapGenerator } from '../../src/utils/mapGenerator'
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
