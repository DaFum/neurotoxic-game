import { performance } from 'perf_hooks'

const ITERATIONS = 100000

// Create a large band to make O(N) vs O(1) more obvious
const members = Array.from({ length: 100 }, (_, i) => ({
  id: `m${i}`,
  stamina: 50,
  mood: 50
}))

const state = {
  band: {
    members
  }
}

const memberId = 'm99' // Worst case

function currentMethod(state, memberId, memberUpdater) {
  const memberExists = state.band.members.some(m => m.id === memberId)
  if (!memberExists) return state

  let memberUpdateResult = null
  const updatedMembers = state.band.members.map(member => {
    if (member.id !== memberId) return member
    memberUpdateResult = memberUpdater(member)
    return memberUpdateResult.updatedMember || memberUpdateResult
  })

  return { ...state, band: { ...state.band, members: updatedMembers } }
}

function optimizedMethod(state, memberId, memberUpdater) {
  let targetIndex = -1
  const len = state.band.members.length
  for (let i = 0; i < len; i++) {
    if (state.band.members[i].id === memberId) {
      targetIndex = i
      break
    }
  }

  if (targetIndex === -1) return state

  const targetMember = state.band.members[targetIndex]
  const memberUpdateResult = memberUpdater(targetMember)
  const updatedMember = memberUpdateResult.updatedMember || memberUpdateResult

  const updatedMembers = [...state.band.members]
  updatedMembers[targetIndex] = updatedMember

  return { ...state, band: { ...state.band, members: updatedMembers } }
}

function optimizedMethodFindIndex(state, memberId, memberUpdater) {
  const targetIndex = state.band.members.findIndex(m => m.id === memberId)
  if (targetIndex === -1) return state

  const targetMember = state.band.members[targetIndex]
  const memberUpdateResult = memberUpdater(targetMember)
  const updatedMember = memberUpdateResult.updatedMember || memberUpdateResult

  const updatedMembers = [...state.band.members]
  updatedMembers[targetIndex] = updatedMember

  return { ...state, band: { ...state.band, members: updatedMembers } }
}

const updater = m => ({ updatedMember: { ...m, stamina: 100 } })

let start = performance.now()
for (let i = 0; i < ITERATIONS; i++) {
  currentMethod(state, memberId, updater)
}
let end = performance.now()
console.log('Current method (.some + .map):', end - start, 'ms')

start = performance.now()
for (let i = 0; i < ITERATIONS; i++) {
  optimizedMethod(state, memberId, updater)
}
end = performance.now()
console.log('Optimized method (for loop + array spread):', end - start, 'ms')

start = performance.now()
for (let i = 0; i < ITERATIONS; i++) {
  optimizedMethodFindIndex(state, memberId, updater)
}
end = performance.now()
console.log('Optimized method (.findIndex + array spread):', end - start, 'ms')
