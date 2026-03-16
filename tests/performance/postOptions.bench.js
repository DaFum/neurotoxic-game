// TODO: Implement this
import { performance } from 'perf_hooks'

const members = [
  { name: 'Alice', traits: [{ id: 'virtuoso' }, { id: 'gear_nerd' }] },
  { name: 'Bob', traits: [{ id: 'clumsy' }, { id: 'party_animal' }] },
  { name: 'Charlie', traits: [{ id: 'lead_singer' }, { id: 'drama_magnet' }] },
  { name: 'Dave', traits: [{ id: 'tech_wizard' }] }
]

const memberTraitCache = new WeakMap()

function ensureTraitCache(members) {
  let cacheMap = memberTraitCache.get(members)
  if (!cacheMap) {
    cacheMap = new Map()
    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      if (m.traits) {
        for (let j = 0; j < m.traits.length; j++) {
          const tId = m.traits[j].id
          if (!cacheMap.has(tId)) {
            cacheMap.set(tId, m)
          }
        }
      }
    }
    memberTraitCache.set(members, cacheMap)
  }
  return cacheMap
}

function hasMemberWithTrait(members, traitId1, traitId2) {
  if (!members || !members.length) return false
  const cacheMap = ensureTraitCache(members)
  if (cacheMap.has(traitId1)) return true
  if (traitId2 && cacheMap.has(traitId2)) return true
  return false
}

function getMemberWithTrait(members, traitId) {
  if (!members || !members.length) return null
  const cacheMap = ensureTraitCache(members)
  return cacheMap.get(traitId) || null
}

const BAND_SIZE = members.length
const RUNS = 1000000

console.log(
  `Running benchmark with band size ${BAND_SIZE} over ${RUNS} iterations...`
)

// Simulate Redux updates: new array reference, same objects
const startOptimized = performance.now()
let foundCount = 0
for (let i = 0; i < RUNS; i++) {
  const newMembers = [...members] // New array ref
  if (hasMemberWithTrait(newMembers, 'gear_nerd')) foundCount++
  if (hasMemberWithTrait(newMembers, 'clumsy')) foundCount++
  if (hasMemberWithTrait(newMembers, 'missing_trait')) foundCount++
  if (getMemberWithTrait(newMembers, 'virtuoso')) foundCount++
}
const endOptimized = performance.now()
const timeOptimized = endOptimized - startOptimized

console.log(
  `Optimized Implementation Total time: ${timeOptimized.toFixed(2)}ms, found: ${foundCount}`
)
