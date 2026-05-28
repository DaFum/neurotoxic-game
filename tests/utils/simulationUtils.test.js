import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { calculateGigPhysics } from '../../src/utils/simulationUtils'
import { CHARACTERS } from '../../src/data/characters'

describe('calculateGigPhysics', () => {
  it('handles empty band members gracefully', () => {
    const bandState = { members: [] }
    const song = { bpm: 100, difficulty: 2 }
    const result = calculateGigPhysics(bandState, song)

    assert.deepEqual(result.hitWindows, { guitar: 120, drums: 120, bass: 120 })
    assert.equal(result.speedModifier, 0.8) // Avg stamina is 0 < 40 -> 0.8
    assert.deepEqual(result.multipliers, { guitar: 1.0, drums: 1.0, bass: 1.0 })
    assert.equal(result.avgStamina, 0)
    assert.equal(result.hasPerfektionist, false)
  })

  it('calculates hit windows based on skill (direct and baseStats)', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MATZE.name, skill: 5 }, // direct skill
        { name: CHARACTERS.MARIUS.name, baseStats: { skill: 7 } }, // baseStats.skill
        { name: CHARACTERS.LARS.name, skill: 3 }
      ]
    }
    const song = { bpm: 120, difficulty: 3 }
    const result = calculateGigPhysics(bandState, song)

    // Formula: Base 120ms + (Skill * 4ms)
    assert.equal(result.hitWindows.guitar, 120 + 5 * 4)
    assert.equal(result.hitWindows.drums, 120 + 7 * 4)
    assert.equal(result.hitWindows.bass, 120 + 3 * 4)
  })

  it('applies Virtuoso trait (Matze) for hit window bonus', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MATZE.name, skill: 5, traits: { 'virtuoso': { id: 'virtuoso' } } }
      ]
    }
    const song = { bpm: 120 }
    const result = calculateGigPhysics(bandState, song)
    assert.equal(result.hitWindows.guitar, (120 + 5 * 4) * 1.1)
  })

  it('calculates scroll speed based on stamina (drag effect)', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MATZE.name, stamina: 30 },
        { name: CHARACTERS.MARIUS.name, stamina: 40 }
      ]
    }
    const song = { bpm: 120 }
    const result = calculateGigPhysics(bandState, song)
    assert.equal(result.avgStamina, 35)
    assert.equal(result.speedModifier, 0.8) // < 40
  })

  it('calculates scroll speed based on stamina (normal speed)', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MATZE.name, stamina: 50 },
        { name: CHARACTERS.MARIUS.name, stamina: 40 }
      ]
    }
    const song = { bpm: 120 }
    const result = calculateGigPhysics(bandState, song)
    assert.equal(result.avgStamina, 45)
    assert.equal(result.speedModifier, 1.0) // >= 40
  })

  it('applies Marius blast_machine trait on fast songs', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MARIUS.name, traits: { 'blast_machine': { id: 'blast_machine' } } }
      ]
    }
    const song = { bpm: 170 } // > 160 is fast
    const result = calculateGigPhysics(bandState, song)
    assert.equal(result.multipliers.drums, 1.5)
  })

  it('applies Lars melodic_genius trait on slow songs', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.LARS.name, skill: 5, traits: { 'melodic_genius': { id: 'melodic_genius' } } }
      ]
    }
    const song = { bpm: 110 } // < 120 is slow
    const result = calculateGigPhysics(bandState, song)
    assert.equal(result.hitWindows.bass, (120 + 5 * 4) * 1.15)
  })

  it('applies Matze tech_wizard trait on technical songs', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MATZE.name, traits: { 'tech_wizard': { id: 'tech_wizard' } } }
      ]
    }
    const song = { bpm: 120, difficulty: 4 } // > 3 is technical
    const result = calculateGigPhysics(bandState, song)
    assert.equal(result.multipliers.guitar, 1.15)
  })

  it('applies multiple modifiers and trait multipliers', () => {
    const bandState = {
      members: [
        { name: CHARACTERS.MATZE.name, skill: 5, traits: { 'gear_nerd': { id: 'gear_nerd' }, 'perfektionist': { id: 'perfektionist' } } },
        { name: CHARACTERS.MARIUS.name, traits: { 'party_animal': { id: 'party_animal' } } },
        { name: CHARACTERS.LARS.name, skill: 5, traits: { 'social_manager': { id: 'social_manager' }, 'bandleader': { id: 'bandleader' } } }
      ]
    }
    const song = { bpm: 130, difficulty: 2 }
    const result = calculateGigPhysics(bandState, song)

    assert.equal(result.multipliers.guitar, 1.1)
    assert.equal(result.multipliers.drums, 1.1)
    assert.equal(result.multipliers.bass, 1.1)

    assert.equal(result.hitWindows.guitar, (120 + 5 * 4) + 5)
    assert.equal(result.hitWindows.drums, 120 + 5)
    assert.equal(result.hitWindows.bass, (120 + 5 * 4) + 5)
    assert.equal(result.hasPerfektionist, true)
  })
})
