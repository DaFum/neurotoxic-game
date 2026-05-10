import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateGigPhysics } from '../../src/utils/simulationUtils'

describe('calculateGigPhysics - Character Traits', () => {
  const baseMember = {
    name: 'TestMember',
    baseStats: { skill: 10, stamina: 50 },
    traits: {}
  }
  const matze = { ...baseMember, name: 'Matze', role: 'Guitar' }
  const Marius = { ...baseMember, name: 'Marius', role: 'Drums' }
  const Lars = { ...baseMember, name: 'Lars', role: 'Bass' }

  // Three traits that each boost a single instrument multiplier to exactly 1.1
  const multiplierCases = [
    {
      trait: 'gear_nerd',
      member: matze,
      instrument: 'guitar',
      members: () => [
        { ...matze, traits: { gear_nerd: { id: 'gear_nerd' } } },
        Marius,
        Lars
      ]
    },
    {
      trait: 'party_animal',
      member: Marius,
      instrument: 'drums',
      members: () => [
        matze,
        { ...Marius, traits: { party_animal: { id: 'party_animal' } } },
        Lars
      ]
    },
    {
      trait: 'social_manager',
      member: Lars,
      instrument: 'bass',
      members: () => [
        matze,
        Marius,
        { ...Lars, traits: { social_manager: { id: 'social_manager' } } }
      ]
    }
  ]

  multiplierCases.forEach(({ trait, instrument, members }) => {
    it(`should apply ${trait} trait correctly (+0.1 ${instrument} multiplier)`, () => {
      const result = calculateGigPhysics({ members: members() }, { bpm: 120 })
      assert.ok(
        result.multipliers[instrument] > 1.0,
        `${instrument} multiplier should exceed 1.0`
      )
      assert.equal(result.multipliers[instrument], 1.1)
    })
  })

  it('should apply bandleader trait correctly (Lars) — widens all hit windows by 5ms', () => {
    const baseResult = calculateGigPhysics(
      { members: [matze, Marius, Lars] },
      { bpm: 120 }
    )
    const result = calculateGigPhysics(
      {
        members: [
          matze,
          Marius,
          { ...Lars, traits: { bandleader: { id: 'bandleader' } } }
        ]
      },
      { bpm: 120 }
    )

    for (const instrument of ['guitar', 'drums', 'bass']) {
      assert.ok(
        result.hitWindows[instrument] > baseResult.hitWindows[instrument],
        `${instrument} hit window should increase`
      )
    }
    assert.equal(result.hitWindows.guitar, baseResult.hitWindows.guitar + 5)
  })
})
