import { performance } from 'perf_hooks'

// Compare legacy array `.find`/.some iteration against optimized new map access (`usingForLoop`)
const legacyState = {
  band: {
    members: [
      { id: 'm1', traits: [{ id: 't1' }] },
      { id: 'm2', traits: [{ id: 't2' }] },
      { id: 'm3', traits: [{ id: 't3' }] },
      { id: 'm4', traits: [{ id: 't4' }, { id: 't5' }, { id: 't6' }] }
    ]
  }
}

const optimizedState = {
  band: {
    members: [
      { id: 'm1', traits: { t1: { id: 't1' } } },
      { id: 'm2', traits: { t2: { id: 't2' } } },
      { id: 'm3', traits: { t3: { id: 't3' } } },
      { id: 'm4', traits: { t4: { id: 't4' }, t5: { id: 't5' }, t6: { id: 't6' } } }
    ]
  }
}

const memberId = 'm4'
const resolvedTrait = { id: 't6' }
const ITERATIONS = 100000

function usingFind(state, memberId, resolvedTrait) {
  if (state.band && Array.isArray(state.band.members)) {
    const targetMember = state.band.members.find(m => m.id === memberId)
    if (targetMember && Array.isArray(targetMember.traits)) {
      if (targetMember.traits.some(tr => tr.id === resolvedTrait.id)) {
        return true
      }
    }
  }
  return false
}

function usingForLoop(state, memberId, resolvedTrait) {
  if (state.band && Array.isArray(state.band.members)) {
    let targetMember = null
    for (let i = 0; i < state.band.members.length; i++) {
      if (state.band.members[i].id === memberId) {
        targetMember = state.band.members[i]
        break
      }
    }
    if (targetMember && targetMember.traits) {
      if (Object.hasOwn(targetMember.traits, resolvedTrait.id)) {
        return true
      }
    }
  }
  return false
}

let start = performance.now()
for (let i = 0; i < ITERATIONS; i++) {
  usingFind(legacyState, memberId, resolvedTrait)
}
let end = performance.now()
console.log('legacy baseline (Array.find with arrays):', end - start, 'ms')

start = performance.now()
for (let i = 0; i < ITERATIONS; i++) {
  usingForLoop(optimizedState, memberId, resolvedTrait)
}
end = performance.now()
console.log('optimized structure (O(1) Map access):', end - start, 'ms')
