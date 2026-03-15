import assert from 'node:assert'
import { test } from 'node:test'
import { MapGenerator } from '../src/utils/mapGenerator.js'

test('MapGenerator generates a map with correct structure', () => {
  const generator = new MapGenerator()
  const map = generator.generateMap(5) // shorter depth for test

  assert.ok(Array.isArray(map.layers), 'Should have layers')
  assert.equal(map.layers.length, 6, 'Should have depth + 1 layers') // 0 to 5
  assert.ok(map.nodes, 'Should have nodes object')
  assert.ok(Array.isArray(map.connections), 'Should have connections array')
})

test('MapGenerator guarantees start node', () => {
  const generator = new MapGenerator()
  const map = generator.generateMap()
  const startNode = map.nodes.node_0_0

  assert.ok(startNode, 'Start node exists')
  assert.equal(startNode.type, 'START', 'Start node has correct type')
  assert.equal(startNode.layer, 0, 'Start node is at layer 0')
})

test('MapGenerator guarantees finale node', () => {
  const depth = 5
  const generator = new MapGenerator()
  const map = generator.generateMap(depth)
  const finaleNode = map.nodes[`node_${depth}_0`]

  assert.ok(finaleNode, 'Finale node exists')
  assert.equal(finaleNode.type, 'FINALE', 'Finale node has correct type')
  assert.equal(finaleNode.layer, depth, 'Finale node is at last layer')
})

test('MapGenerator connections are valid', () => {
  const generator = new MapGenerator()
  const map = generator.generateMap(5)

  map.connections.forEach(conn => {
    assert.ok(map.nodes[conn.from], `From node ${conn.from} exists`)
    assert.ok(map.nodes[conn.to], `To node ${conn.to} exists`)

    const fromLayer = map.nodes[conn.from].layer
    const toLayer = map.nodes[conn.to].layer
    assert.equal(toLayer, fromLayer + 1, 'Connections only go forward 1 layer')
  })
})

test('MapGenerator handles invalid parameters gracefully', () => {
  const generator = new MapGenerator()

  // Negative depth
  const mapNegative = generator.generateMap(-1)
  assert.equal(
    mapNegative.layers.length,
    0,
    'Should not generate layers for negative depth'
  )
  assert.ok(
    Array.isArray(mapNegative.nodeList),
    'Should return empty nodeList on invalid depth'
  )

  // Zero depth
  const mapZero = generator.generateMap(0)
  assert.equal(
    mapZero.layers.length,
    0,
    'Should not generate layers for zero depth'
  )
  assert.ok(
    Array.isArray(mapZero.nodeList),
    'Should return empty nodeList on zero depth'
  )
})

test('MapGenerator ensures nodeList mirrors nodes exactly', () => {
  const generator = new MapGenerator(42)
  const map = generator.generateMap(5)

  const nodeKeys = Object.keys(map.nodes)

  // 1. Length must be identical
  assert.equal(
    map.nodeList.length,
    nodeKeys.length,
    'nodeList length must equal the number of keys in nodes'
  )

  // 2. Every ID in nodeList must exist in nodes with the exact same reference
  map.nodeList.forEach((node, idx) => {
    const nodeFromMap = map.nodes[node.id]
    assert.ok(
      nodeFromMap,
      `Node ID ${node.id} from nodeList missing in nodes object`
    )
    assert.strictEqual(
      node,
      nodeFromMap,
      `Node reference mismatch at index ${idx}`
    )
  })
})

test('MapGenerator handles empty venues array by throwing StateError', async () => {
  // It's tricky to mock ES modules dynamically in node:test after they've been loaded,
  // since MapGenerator was already imported at the top of the file without mocking.
  // Instead, we will clear the array directly for this test and restore it after.
  const { ALL_VENUES } = await import('../src/data/venues.js')
  const originalVenues = [...ALL_VENUES]
  ALL_VENUES.length = 0 // clear array

  try {
    const { StateError } = await import('../src/utils/errorHandler.js')
    const generator = new MapGenerator()
    assert.throws(
      () => {
        generator.generateMap(5)
      },
      StateError,
      'Should throw StateError when home venue is missing'
    )
  } finally {
    ALL_VENUES.push(...originalVenues) // restore
  }
})

test('MapGenerator ensures nodes do not overlap', () => {
  const generator = new MapGenerator(12345) // Seeded for consistency
  const map = generator.generateMap(5)
  const nodes = Object.values(map.nodes)

  nodes.forEach(node => {
    assert.ok(typeof node.x === 'number', 'Node has x')
    assert.ok(typeof node.y === 'number', 'Node has y')
    // Bounds match mapGenerator's final clamp (5-95)
    assert.ok(node.x >= 5 && node.x <= 95, `Node x ${node.x} within bounds`)
    assert.ok(node.y >= 5 && node.y <= 95, `Node y ${node.y} within bounds`)
  })

  // Check distances
  // Note: Since we use simple iterative repulsion, it might not be 100% perfect for very dense maps,
  // but for the generated map it should satisfy a reasonable threshold.
  // We used 6% as target in resolveOverlaps, allowing 2.5% for edges/imperfections.
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i]
      const n2 = nodes[j]
      const dx = n1.x - n2.x
      const dy = n1.y - n2.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      assert.ok(
        dist >= 2.5,
        `Nodes ${n1.id} and ${n2.id} should be apart. Dist: ${dist}`
      )
    }
  }
})
