import assert from 'node:assert'
import test from 'node:test'
import { createInitialState } from '../src/context/initialState.js'
import { applyEventDelta } from '../src/utils/gameStateUtils.js'
import { eventEngine } from '../src/utils/eventEngine.js'
import { checkTraitUnlocks } from '../src/utils/unlockCheck.js'

test('Relationship Mechanics', async (t) => {
  await t.test('Relationship update via applyEventDelta', () => {
    const state = createInitialState()
    const member1 = state.band.members[0] // Matze
    const member2 = state.band.members[1] // Marius

    // Initial: 50
    assert.strictEqual(member1.relationships.Marius, 50)
    assert.strictEqual(member2.relationships.Matze, 50)

    const delta = {
      band: {
        relationshipChange: [
          { member1: 'Matze', member2: 'Marius', change: -10 }
        ]
      }
    }

    const nextState = applyEventDelta(state, delta)
    const nextMember1 = nextState.band.members[0]
    const nextMember2 = nextState.band.members[1]

    // Matze's opinion of Marius drops by 10 => 40
    // Marius's opinion of Matze drops by 10 => 40
    assert.strictEqual(nextMember1.relationships.Marius, 40)
    assert.strictEqual(nextMember2.relationships.Matze, 40)
  })

  await t.test('Grudge Holder Trait amplifies negative change', () => {
    const state = createInitialState()
    const matze = state.band.members.find(m => m.name === 'Matze')
    // Give Matze 'grudge_holder' trait
    matze.traits.push({ id: 'grudge_holder' })

    const delta = {
      band: {
        relationshipChange: [
          { member1: 'Matze', member2: 'Marius', change: -10 }
        ]
      }
    }

    const nextState = applyEventDelta(state, delta)
    const nextMatze = nextState.band.members.find(m => m.name === 'Matze')
    const nextMarius = nextState.band.members.find(m => m.name === 'Marius')

    // Matze (Grudge Holder): -10 * 1.5 = -15. 50 - 15 = 35.
    assert.strictEqual(nextMatze.relationships.Marius, 35)

    // Marius (Normal): -10. 50 - 10 = 40.
    assert.strictEqual(nextMarius.relationships.Matze, 40)
  })

  await t.test('Peacemaker Trait amplifies positive change', () => {
    const state = createInitialState()
    const lars = state.band.members.find(m => m.name === 'Lars')
    // Give Lars 'peacemaker' trait
    lars.traits.push({ id: 'peacemaker' })

    const delta = {
      band: {
        relationshipChange: [
          { member1: 'Lars', member2: 'Marius', change: 10 }
        ]
      }
    }

    const nextState = applyEventDelta(state, delta)
    const nextLars = nextState.band.members.find(m => m.name === 'Lars')

    // Lars (Peacemaker): 10 * 1.5 = 15. 50 + 15 = 65.
    assert.strictEqual(nextLars.relationships.Marius, 65)
  })

  await t.test('Peacemaker Trait dampens negative change', () => {
    const state = createInitialState()
    const lars = state.band.members.find(m => m.name === 'Lars')
    // Give Lars 'peacemaker' trait
    lars.traits.push({ id: 'peacemaker' })

    const delta = {
      band: {
        relationshipChange: [
          { member1: 'Lars', member2: 'Marius', change: -10 }
        ]
      }
    }

    const nextState = applyEventDelta(state, delta)
    const nextLars = nextState.band.members.find(m => m.name === 'Lars')

    // Lars (Peacemaker): -10 * 0.5 = -5. 50 - 5 = 45.
    assert.strictEqual(nextLars.relationships.Marius, 45)
  })

  await t.test('Event Engine Placeholder Resolution', () => {
     // Verify that processEffect resolves placeholders
     const eff = { type: 'relationship', member1: '{member1}', member2: '{member2}', value: -10 }
     const delta = { band: {} }
     const context = { member1: 'Matze', member2: 'Lars' }

     const engine = eventEngine
     const result = { type: 'composite', effects: [eff] }
     const resDelta = engine.applyResult(result, context)

     assert.deepStrictEqual(resDelta.band.relationshipChange, [
       { member1: 'Matze', member2: 'Lars', change: -10 }
     ])
  })

  await t.test('Unlock Checks', () => {
    const state = createInitialState()
    const matze = state.band.members.find(m => m.name === 'Matze')
    matze.relationships.Marius = 20 // Below 30

    const unlocks = checkTraitUnlocks(state, { type: 'EVENT_RESOLVED' })
    const matzeUnlock = unlocks.find(u => u.memberId === 'Matze' && u.traitId === 'grudge_holder')
    assert.ok(matzeUnlock, 'Matze should unlock Grudge Holder')
  })
})
