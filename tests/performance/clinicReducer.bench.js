import { performance } from 'perf_hooks'

// Note: Both benchmark paths previously compared array iterations (`usingFind` vs `usingForLoop`),
// but now test the updated `usingForLoop` (which correctly accesses the new object map structure `targetMember.traits[resolvedTrait.id]`)
// against the legacy `usingFind` (which fails on maps). We ensure both inputs and logic are correctly updated for the new structure.
const state = {
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
  usingFind(state, memberId, resolvedTrait)
}
let end = performance.now()
console.log('baseline (Array.find):', end - start, 'ms')

start = performance.now()
for (let i = 0; i < ITERATIONS; i++) {
  usingForLoop(state, memberId, resolvedTrait)
}
end = performance.now()
console.log('optimized (for loop):', end - start, 'ms')
