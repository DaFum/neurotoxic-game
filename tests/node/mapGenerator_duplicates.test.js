import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MapGenerator } from '../../src/utils/mapGenerator'

test('MapGenerator should not have duplicate venues (if possible)', () => {
  // Use fixed seed for deterministic test
  const generator = new MapGenerator(12345)
  const map = generator.generateMap(10)
  const nodes = Object.values(map.nodes)

  const venueCounts = {}
  let duplicates = 0

  nodes.forEach(node => {
    if (node.venue && node.type !== 'START' && node.type !== 'FINALE') {
      const id = node.venue.id
      if (venueCounts[id]) {
        // Only count the first time a venue is duplicated to count "unique duplicated venues"
        if (venueCounts[id] === 1) {
          duplicates++
          console.log(`Duplicate found: ${id} (Layer ${node.layer})`)
        }
        venueCounts[id]++
      } else {
        venueCounts[id] = 1
      }
    }
  })

  assert.strictEqual(
    duplicates,
    0,
    `Should have zero duplicate venues (found ${duplicates})`
  )
})

test('MapGenerator should handle exhaustion depth without StateError', () => {
  // A depth large enough to exhaust unique venue pools (44 venues, 2-4 branching means depth 35 gives 70-140 nodes)
  const generator = new MapGenerator(999)
  // Generating a depth of 35 should force exhaustion and reallocation
  assert.doesNotThrow(() => {
    const map = generator.generateMap(35)
    assert.ok(map.nodes)
  })
})
