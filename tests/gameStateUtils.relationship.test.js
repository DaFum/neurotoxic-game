import assert from 'node:assert'
import { test } from 'node:test'
import { applyEventDelta } from '../src/utils/gameStateUtils.js'

test('applyEventDelta applies basic relationship changes', () => {
  const state = {
    band: {
      members: [
        { name: 'Alice', relationships: { Bob: 50 }, traits: [] },
        { name: 'Bob', relationships: { Alice: 50 }, traits: [] }
      ]
    }
  }
  const delta = {
    band: {
      relationshipChange: [
        { member1: 'Alice', member2: 'Bob', change: 10 }
      ]
    }
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.band.members[0].relationships.Bob, 60)
  assert.equal(nextState.band.members[1].relationships.Alice, 60)
})

test('applyEventDelta amplifies negative change for grudge_holder', () => {
  const state = {
    band: {
      members: [
        { name: 'Grumpy', relationships: { Happy: 50 }, traits: [{ id: 'grudge_holder' }] },
        { name: 'Happy', relationships: { Grumpy: 50 }, traits: [] }
      ]
    }
  }
  const delta = {
    band: {
      relationshipChange: [
        { member1: 'Grumpy', member2: 'Happy', change: -10 }
      ]
    }
  }

  const nextState = applyEventDelta(state, delta)
  // Grumpy has grudge_holder: -10 * 1.5 = -15. 50 - 15 = 35.
  assert.equal(nextState.band.members[0].relationships.Happy, 35)
  // Happy has no traits: -10. 50 - 10 = 40.
  assert.equal(nextState.band.members[1].relationships.Grumpy, 40)
})

test('applyEventDelta does not amplify positive change for grudge_holder', () => {
  const state = {
    band: {
      members: [
        { name: 'Grumpy', relationships: { Happy: 50 }, traits: [{ id: 'grudge_holder' }] },
        { name: 'Happy', relationships: { Grumpy: 50 }, traits: [] }
      ]
    }
  }
  const delta = {
    band: {
      relationshipChange: [
        { member1: 'Grumpy', member2: 'Happy', change: 10 }
      ]
    }
  }

  const nextState = applyEventDelta(state, delta)
  // Grumpy has grudge_holder, but change is positive. No effect. 50 + 10 = 60.
  assert.equal(nextState.band.members[0].relationships.Happy, 60)
  assert.equal(nextState.band.members[1].relationships.Grumpy, 60)
})

test('applyEventDelta amplifies positive change for peacemaker', () => {
  const state = {
    band: {
      members: [
        { name: 'Peaceful', relationships: { Angry: 50 }, traits: [{ id: 'peacemaker' }] },
        { name: 'Angry', relationships: { Peaceful: 50 }, traits: [] }
      ]
    }
  }
  const delta = {
    band: {
      relationshipChange: [
        { member1: 'Peaceful', member2: 'Angry', change: 10 }
      ]
    }
  }

  const nextState = applyEventDelta(state, delta)
  // Peaceful has peacemaker: 10 * 1.5 = 15. 50 + 15 = 65.
  assert.equal(nextState.band.members[0].relationships.Angry, 65)
  // Angry has no traits: 10. 50 + 10 = 60.
  assert.equal(nextState.band.members[1].relationships.Peaceful, 60)
})

test('applyEventDelta dampens negative change for peacemaker', () => {
  const state = {
    band: {
      members: [
        { name: 'Peaceful', relationships: { Angry: 50 }, traits: [{ id: 'peacemaker' }] },
        { name: 'Angry', relationships: { Peaceful: 50 }, traits: [] }
      ]
    }
  }
  const delta = {
    band: {
      relationshipChange: [
        { member1: 'Peaceful', member2: 'Angry', change: -20 }
      ]
    }
  }

  const nextState = applyEventDelta(state, delta)
  // Peaceful has peacemaker: -20 * 0.5 = -10. 50 - 10 = 40.
  assert.equal(nextState.band.members[0].relationships.Angry, 40)
  // Angry has no traits: -20. 50 - 20 = 30.
  assert.equal(nextState.band.members[1].relationships.Peaceful, 30)
})

test('applyEventDelta clamps relationship scores to 0-100', () => {
  const state = {
    band: {
      members: [
        { name: 'A', relationships: { B: 95 }, traits: [] },
        { name: 'B', relationships: { A: 5 }, traits: [] }
      ]
    }
  }
  const delta = {
    band: {
      relationshipChange: [
        { member1: 'A', member2: 'B', change: 10 },
        { member1: 'A', member2: 'B', change: -10 }
      ]
    }
  }

  // Test overflow
  const deltaOverflow = {
    band: { relationshipChange: [{ member1: 'A', member2: 'B', change: 20 }] }
  }
  const nextStateOverflow = applyEventDelta(state, deltaOverflow)
  assert.equal(nextStateOverflow.band.members[0].relationships.B, 100)

  // Test underflow
  const deltaUnderflow = {
    band: { relationshipChange: [{ member1: 'A', member2: 'B', change: -20 }] }
  }
  const nextStateUnderflow = applyEventDelta(state, deltaUnderflow)
  assert.equal(nextStateUnderflow.band.members[1].relationships.A, 0)
})

test('applyEventDelta handles multiple relationship changes', () => {
    const state = {
        band: {
            members: [
                { name: 'A', relationships: { B: 50, C: 50 }, traits: [] },
                { name: 'B', relationships: { A: 50, C: 50 }, traits: [] },
                { name: 'C', relationships: { A: 50, B: 50 }, traits: [] }
            ]
        }
    }
    const delta = {
        band: {
            relationshipChange: [
                { member1: 'A', member2: 'B', change: 10 },
                { member1: 'B', member2: 'C', change: -10 }
            ]
        }
    }

    const nextState = applyEventDelta(state, delta)

    // A -> B: +10 => 60
    assert.equal(nextState.band.members[0].relationships.B, 60)
    // A -> C: Unchanged => 50
    assert.equal(nextState.band.members[0].relationships.C, 50)

    // B -> A: +10 => 60
    assert.equal(nextState.band.members[1].relationships.A, 60)
    // B -> C: -10 => 40
    assert.equal(nextState.band.members[1].relationships.C, 40)

    // C -> A: Unchanged => 50
    assert.equal(nextState.band.members[2].relationships.A, 50)
    // C -> B: -10 => 40
    assert.equal(nextState.band.members[2].relationships.B, 40)
})

test('applyEventDelta handles both traits simultaneously (edge case)', () => {
    // If a member has both traits (unlikely but possible via bugs/cheats/design changes)
    const state = {
        band: {
            members: [
                { name: 'Weirdo', relationships: { Normal: 50 }, traits: [{ id: 'grudge_holder' }, { id: 'peacemaker' }] },
                { name: 'Normal', relationships: { Weirdo: 50 }, traits: [] }
            ]
        }
    }

    // Negative change:
    // Grudge: * 1.5
    // Peacemaker: * 0.5
    // Net: * 0.75
    const deltaNegative = {
        band: { relationshipChange: [{ member1: 'Weirdo', member2: 'Normal', change: -20 }] }
    }
    const nextStateNegative = applyEventDelta(state, deltaNegative)
    // -20 * 1.5 * 0.5 = -15. 50 - 15 = 35.
    assert.equal(nextStateNegative.band.members[0].relationships.Normal, 35)

    // Positive change:
    // Grudge: No effect
    // Peacemaker: * 1.5
    // Net: * 1.5
    const deltaPositive = {
        band: { relationshipChange: [{ member1: 'Weirdo', member2: 'Normal', change: 20 }] }
    }
    const nextStatePositive = applyEventDelta(state, deltaPositive)
    // 20 * 1.5 = 30. 50 + 30 = 80.
    assert.equal(nextStatePositive.band.members[0].relationships.Normal, 80)
})
