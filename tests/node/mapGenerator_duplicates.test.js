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
      const name = node.venue.name
      if (venueCounts[name]) {
        // Only count the first time a venue is duplicated to count "unique duplicated venues"
        if (venueCounts[name] === 1) {
          duplicates++
          console.log(`Duplicate found: ${name} (Layer ${node.layer})`)
        }
        venueCounts[name]++
      } else {
        venueCounts[name] = 1
      }
    }
  })

  assert.strictEqual(
    duplicates,
    0,
    `Should have zero duplicate venues (found ${duplicates})`
  )
})
