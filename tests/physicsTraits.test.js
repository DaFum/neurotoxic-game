
import { test, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateGigPhysics } from '../src/utils/simulationUtils.js'

describe('calculateGigPhysics - Character Traits', () => {
  const baseMember = {
    name: 'TestMember',
    baseStats: { skill: 10, stamina: 50 },
    traits: []
  }

  const matze = { ...baseMember, name: 'Matze', role: 'Guitar' }
  const lars = { ...baseMember, name: 'Lars', role: 'Drums' }
  const marius = { ...baseMember, name: 'Marius', role: 'Bass' }

  it('should apply gear_nerd trait correctly (Matze)', () => {
    const matzeWithTrait = {
      ...matze,
      traits: [{ id: 'gear_nerd' }]
    }
    const bandState = { members: [matzeWithTrait, lars, marius] }
    const result = calculateGigPhysics(bandState, { bpm: 120 })

    assert.ok(result.multipliers.guitar > 1.0, 'Guitar multiplier should be increased by gear_nerd')
    assert.equal(result.multipliers.guitar, 1.1, 'Guitar multiplier should be 1.1')
  })

  it('should apply party_animal trait correctly (Lars)', () => {
    const larsWithTrait = {
      ...lars,
      traits: [{ id: 'party_animal' }]
    }
    const bandState = { members: [matze, larsWithTrait, marius] }
    const result = calculateGigPhysics(bandState, { bpm: 120 })

    assert.ok(result.multipliers.drums > 1.0, 'Drums multiplier should be increased by party_animal')
    assert.equal(result.multipliers.drums, 1.1, 'Drums multiplier should be 1.1')
  })

  it('should apply bandleader trait correctly (Marius)', () => {
    const mariusWithTrait = {
      ...marius,
      traits: [{ id: 'bandleader' }]
    }
    const bandState = { members: [matze, lars, mariusWithTrait] }

    // Calculate base hit windows first
    const baseResult = calculateGigPhysics({ members: [matze, lars, marius] }, { bpm: 120 })
    const result = calculateGigPhysics(bandState, { bpm: 120 })

    assert.ok(result.hitWindows.guitar > baseResult.hitWindows.guitar, 'Guitar hit window should increase')
    assert.ok(result.hitWindows.drums > baseResult.hitWindows.drums, 'Drums hit window should increase')
    assert.ok(result.hitWindows.bass > baseResult.hitWindows.bass, 'Bass hit window should increase')

    assert.equal(result.hitWindows.guitar, baseResult.hitWindows.guitar + 5, 'Should increase by 5ms')
  })

  it('should apply social_manager trait correctly (Marius)', () => {
    const mariusWithTrait = {
      ...marius,
      traits: [{ id: 'social_manager' }]
    }
    const bandState = { members: [matze, lars, mariusWithTrait] }
    const result = calculateGigPhysics(bandState, { bpm: 120 })

    assert.ok(result.multipliers.bass > 1.0, 'Bass multiplier should be increased by social_manager')
    assert.equal(result.multipliers.bass, 1.1, 'Bass multiplier should be 1.1')
  })
})
