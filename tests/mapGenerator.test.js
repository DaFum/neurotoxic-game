import assert from 'node:assert';
import { test } from 'node:test';
import { MapGenerator } from '../src/utils/mapGenerator.js';

test('MapGenerator generates a map with correct structure', () => {
  const generator = new MapGenerator();
  const map = generator.generateMap(5); // shorter depth for test

  assert.ok(Array.isArray(map.layers), 'Should have layers');
  assert.equal(map.layers.length, 6, 'Should have depth + 1 layers'); // 0 to 5
  assert.ok(map.nodes, 'Should have nodes object');
  assert.ok(Array.isArray(map.connections), 'Should have connections array');
});

test('MapGenerator guarantees start node', () => {
    const generator = new MapGenerator();
    const map = generator.generateMap();
    const startNode = map.nodes['node_0_0'];

    assert.ok(startNode, 'Start node exists');
    assert.equal(startNode.type, 'START', 'Start node has correct type');
    assert.equal(startNode.layer, 0, 'Start node is at layer 0');
});

test('MapGenerator guarantees finale node', () => {
    const depth = 5;
    const generator = new MapGenerator();
    const map = generator.generateMap(depth);
    const finaleNode = map.nodes[`node_${depth}_0`];

    assert.ok(finaleNode, 'Finale node exists');
    assert.equal(finaleNode.type, 'FINALE', 'Finale node has correct type');
    assert.equal(finaleNode.layer, depth, 'Finale node is at last layer');
});

test('MapGenerator connections are valid', () => {
    const generator = new MapGenerator();
    const map = generator.generateMap(5);

    map.connections.forEach(conn => {
        assert.ok(map.nodes[conn.from], `From node ${conn.from} exists`);
        assert.ok(map.nodes[conn.to], `To node ${conn.to} exists`);

        const fromLayer = map.nodes[conn.from].layer;
        const toLayer = map.nodes[conn.to].layer;
        assert.equal(toLayer, fromLayer + 1, 'Connections only go forward 1 layer');
    });
});
