import assert from 'node:assert'
import { test } from 'node:test'
import { MapGenerator } from '../src/utils/mapGenerator.js'

test('MapGenerator should not have duplicate venues (if possible)', () => {
  const generator = new MapGenerator(Date.now())
  const map = generator.generateMap(10)
  const nodes = Object.values(map.nodes)

  const venueCounts = {}
  let duplicates = 0

  nodes.forEach(node => {
    if (node.venue && node.type !== 'HOME' && node.type !== 'FINALE') {
      const name = node.venue.name
      if (venueCounts[name]) {
        venueCounts[name]++
        duplicates++
        console.log(`Duplicate found: ${name} (Layer ${node.layer})`)
      } else {
        venueCounts[name] = 1
      }
    }
  })

  // We allow a small number of duplicates (e.g., <= 3) because the 'Easy' venue pool is very small (4 items).
  // If the generator creates > 4 easy nodes (Layers 1-2), duplicates are mathematically inevitable without modifying data.
  // The goal is to minimize them (previously we had ~7, now ~2).
  assert.ok(
    duplicates <= 3,
    `Should have minimized duplicate venues (found ${duplicates})`
  )
})
