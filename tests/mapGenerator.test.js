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

test('MapGenerator ensures nodes do not overlap', () => {
  const generator = new MapGenerator(12345) // Seeded for consistency
  const map = generator.generateMap(5)
  const nodes = Object.values(map.nodes)

  nodes.forEach(node => {
    assert.ok(typeof node.x === 'number', 'Node has x')
    assert.ok(typeof node.y === 'number', 'Node has y')
    assert.ok(node.x >= 5 && node.x <= 95, `Node x ${node.x} within bounds`)
    assert.ok(node.y >= 5 && node.y <= 95, `Node y ${node.y} within bounds`)
  })

  // Check distances
  // Note: Since we use simple iterative repulsion, it might not be 100% perfect for very dense maps,
  // but for the generated map it should satisfy a reasonable threshold.
  // We used 4% as target, let's assert > 2.5% to allow for some slight imperfection/clamping at edges.
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
