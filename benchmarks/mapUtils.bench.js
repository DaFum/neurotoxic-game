
import { suite, test } from 'node:test';
import assert from 'node:assert';
import { isConnected } from '../src/utils/mapUtils.js';

suite('MapUtils Performance Benchmark', () => {
    const largeMap = {
        connections: Array.from({ length: 10000 }, (_, i) => ({
            from: `node-${i % 100}`, // Create many connections from same nodes
            to: `node-${(i + 1) % 100}`
        })),
        nodes: {} // Not used by isConnected
    };

    test('isConnected performance with large map', () => {
        const start = performance.now();
        for (let i = 0; i < 100000; i++) {
             isConnected(largeMap, 'node-10', 'node-11');
             isConnected(largeMap, 'node-10', 'node-99'); // Worst case scan
        }
        const end = performance.now();
        console.log(`isConnected 100k ops: ${(end - start).toFixed(2)}ms`);
    });
});
