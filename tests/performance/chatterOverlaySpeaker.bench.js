import { performance } from 'perf_hooks'

const RUNS = 1000000;
const bandMembers = Array.from({ length: 10 }, (_, i) => ({
  name: i % 2 === 0 ? `Member ${i}` : null
}))

function mapFilter(members) {
  return (members ?? [])
    .map(member => member.name)
    .filter(memberName => typeof memberName === 'string')
}

function optimized(members) {
  const memberNames = []
  if (members) {
    for (let i = 0; i < members.length; i++) {
      const name = members[i].name
      if (typeof name === 'string') {
        memberNames.push(name)
      }
    }
  }
  return memberNames
}

console.log(`Running benchmark with ${bandMembers.length} members over ${RUNS} iterations...`)

const startMapFilter = performance.now()
for (let i = 0; i < RUNS; i++) {
  mapFilter(bandMembers)
}
const endMapFilter = performance.now()

const startOptimized = performance.now()
for (let i = 0; i < RUNS; i++) {
  optimized(bandMembers)
}
const endOptimized = performance.now()

console.log(`Original map/filter: ${(endMapFilter - startMapFilter).toFixed(2)} ms`)
console.log(`Optimized loop: ${(endOptimized - startOptimized).toFixed(2)} ms`)
