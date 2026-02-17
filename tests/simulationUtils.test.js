import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getGigModifiers,
  calculateGigPhysics,
  calculateDailyUpdates
} from '../src/utils/simulationUtils.js'

const buildBandState = (overrides = {}) => ({
  harmony: 60,
  members: [
    {
      name: 'Matze',
      mood: 70,
      stamina: 80,
      baseStats: { skill: 5 },
      traits: []
    },
    {
      name: 'Lars',
      mood: 65,
      stamina: 75,
      baseStats: { skill: 4 },
      traits: []
    },
    {
      name: 'Marius',
      mood: 75,
      stamina: 70,
      baseStats: { skill: 3 },
      traits: []
    }
  ],
  ...overrides
})

const buildBandWithMembers = (updates, otherOverrides = {}) => {
  const band = buildBandState(otherOverrides)
  updates.forEach(update => {
    const idx = band.members.findIndex(m => m.name === update.name)
    if (idx !== -1) {
      band.members[idx] = { ...band.members[idx], ...update }
    }
  })
  return band
}

test('getGigModifiers returns default modifiers for average band', () => {
  const band = buildBandState()
  const modifiers = getGigModifiers(band)

  assert.ok(modifiers, 'Should return modifiers object')
  assert.ok(
    typeof modifiers.hitWindowBonus === 'number',
    'Should have hitWindowBonus'
  )
  assert.ok(typeof modifiers.noteJitter === 'boolean', 'Should have noteJitter')
  assert.ok(
    typeof modifiers.drumSpeedMult === 'number',
    'Should have drumSpeedMult'
  )
  assert.ok(
    typeof modifiers.guitarScoreMult === 'number',
    'Should have guitarScoreMult'
  )
  assert.ok(
    Array.isArray(modifiers.activeEffects),
    'Should have activeEffects array'
  )
})

test('getGigModifiers grants telepathy bonus for high harmony', () => {
  const band = buildBandState({ harmony: 85 })
  const modifiers = getGigModifiers(band)

  assert.equal(
    modifiers.hitWindowBonus,
    20,
    'Should grant 20ms bonus for high harmony'
  )
  assert.ok(
    modifiers.activeEffects.some(e => e.includes('TELEPATHY')),
    'Should describe telepathy effect'
  )
})

test('getGigModifiers applies disconnect penalty for low harmony', () => {
  const band = buildBandState({ harmony: 25 })
  const modifiers = getGigModifiers(band)

  assert.equal(
    modifiers.noteJitter,
    true,
    'Should enable note jitter for low harmony'
  )
  assert.ok(
    modifiers.activeEffects.some(e => e.includes('DISCONNECT')),
    'Should describe disconnect effect'
  )
})

test('getGigModifiers has no special effects for mid harmony', () => {
  const band = buildBandState({ harmony: 50 })
  const modifiers = getGigModifiers(band)

  assert.equal(
    modifiers.hitWindowBonus,
    0,
    'Should have no bonus for mid harmony'
  )
  assert.equal(
    modifiers.noteJitter,
    false,
    'Should have no jitter for mid harmony'
  )
})

test('getGigModifiers applies grumpy Matze penalty', () => {
  const band = buildBandWithMembers([{ name: 'Matze', mood: 15 }])
  const modifiers = getGigModifiers(band)

  assert.equal(
    modifiers.guitarScoreMult,
    0.5,
    'Grumpy Matze should halve guitar score'
  )
  assert.ok(
    modifiers.activeEffects.some(e => e.includes('GRUMPY MATZE')),
    'Should describe Matze effect'
  )
})

test('getGigModifiers does not apply Matze penalty when mood is okay', () => {
  const band = buildBandWithMembers([{ name: 'Matze', mood: 50 }])
  const modifiers = getGigModifiers(band)

  assert.equal(
    modifiers.guitarScoreMult,
    1.0,
    'Should have normal guitar multiplier'
  )
})

test('getGigModifiers applies tired Lars speed increase', () => {
  const band = buildBandWithMembers([{ name: 'Lars', stamina: 15 }])
  const modifiers = getGigModifiers(band)

  assert.equal(modifiers.drumSpeedMult, 1.2, 'Tired Lars should speed up tempo')
  assert.ok(
    modifiers.activeEffects.some(e => e.includes('TIRED LARS')),
    'Should describe Lars effect'
  )
})

test('getGigModifiers does not apply Lars penalty when stamina is okay', () => {
  const band = buildBandWithMembers([{ name: 'Lars', stamina: 50 }])
  const modifiers = getGigModifiers(band)

  assert.equal(modifiers.drumSpeedMult, 1.0, 'Should have normal drum speed')
})

test('getGigModifiers can apply multiple effects', () => {
  const band = buildBandWithMembers(
    [
      { name: 'Matze', mood: 10 },
      { name: 'Lars', stamina: 10 }
    ],
    { harmony: 85 }
  )
  const modifiers = getGigModifiers(band)

  assert.ok(
    modifiers.activeEffects.length >= 3,
    'Should have multiple active effects'
  )
  assert.equal(modifiers.hitWindowBonus, 20, 'Should have harmony bonus')
  assert.equal(modifiers.guitarScoreMult, 0.5, 'Should have Matze penalty')
  assert.equal(modifiers.drumSpeedMult, 1.2, 'Should have Lars speed increase')
})

test('calculateGigPhysics returns physics object', () => {
  const band = buildBandState()
  const song = { bpm: 120 }
  const physics = calculateGigPhysics(band, song)

  assert.ok(physics, 'Should return physics object')
  assert.ok(physics.hitWindows, 'Should have hit windows')
  assert.ok(
    typeof physics.speedModifier === 'number',
    'Should have speed modifier'
  )
  assert.ok(physics.multipliers, 'Should have multipliers')
})

test('calculateGigPhysics calculates hit windows based on skill', () => {
  const band = buildBandState()
  const song = { bpm: 120 }
  const physics = calculateGigPhysics(band, song)

  assert.ok(
    physics.hitWindows.guitar >= 150,
    'Guitar hit window should be at least 150ms'
  )
  assert.ok(
    physics.hitWindows.drums >= 150,
    'Drums hit window should be at least 150ms'
  )
  assert.ok(
    physics.hitWindows.bass >= 150,
    'Bass hit window should be at least 150ms'
  )
})

test('calculateGigPhysics skill increases hit windows', () => {
  const lowSkillBand = buildBandWithMembers([
    { name: 'Matze', baseStats: { skill: 1 } },
    { name: 'Lars', baseStats: { skill: 1 } },
    { name: 'Marius', baseStats: { skill: 1 } }
  ])
  const highSkillBand = buildBandWithMembers([
    { name: 'Matze', baseStats: { skill: 10 } },
    { name: 'Lars', baseStats: { skill: 10 } },
    { name: 'Marius', baseStats: { skill: 10 } }
  ])
  const song = { bpm: 120 }

  const lowPhysics = calculateGigPhysics(lowSkillBand, song)
  const highPhysics = calculateGigPhysics(highSkillBand, song)

  assert.ok(
    highPhysics.hitWindows.guitar > lowPhysics.hitWindows.guitar,
    'Higher skill should increase guitar window'
  )
  assert.ok(
    highPhysics.hitWindows.drums > lowPhysics.hitWindows.drums,
    'Higher skill should increase drums window'
  )
  assert.ok(
    highPhysics.hitWindows.bass > lowPhysics.hitWindows.bass,
    'Higher skill should increase bass window'
  )
})

test('calculateGigPhysics reduces speed for low stamina', () => {
  const tiredBand = buildBandWithMembers([
    { name: 'Matze', stamina: 20 },
    { name: 'Lars', stamina: 25 },
    { name: 'Marius', stamina: 20 }
  ])
  const song = { bpm: 120 }
  const physics = calculateGigPhysics(tiredBand, song)

  assert.equal(
    physics.speedModifier,
    0.8,
    'Low stamina should reduce speed to 0.8'
  )
})

test('calculateGigPhysics normal speed for adequate stamina', () => {
  const band = buildBandWithMembers([
    { name: 'Matze', stamina: 50 },
    { name: 'Lars', stamina: 50 },
    { name: 'Marius', stamina: 50 }
  ])
  const song = { bpm: 120 }
  const physics = calculateGigPhysics(band, song)

  assert.equal(
    physics.speedModifier,
    1.0,
    'Adequate stamina should maintain normal speed'
  )
})

test('calculateGigPhysics returns default multipliers', () => {
  const band = buildBandState()
  const song = { bpm: 120 }
  const physics = calculateGigPhysics(band, song)

  assert.equal(
    physics.multipliers.guitar,
    1.0,
    'Default guitar multiplier should be 1.0'
  )
  assert.equal(
    physics.multipliers.drums,
    1.0,
    'Default drums multiplier should be 1.0'
  )
  assert.equal(
    physics.multipliers.bass,
    1.0,
    'Default bass multiplier should be 1.0'
  )
})

test('calculateGigPhysics applies blast machine trait for fast songs', () => {
  const band = buildBandWithMembers([
    { name: 'Lars', traits: [{ id: 'blast_machine' }] }
  ])
  const fastSong = { bpm: 180 }
  const physics = calculateGigPhysics(band, fastSong)

  assert.equal(
    physics.multipliers.drums,
    1.5,
    'Blast machine should boost drums on fast songs'
  )
})

test('calculateGigPhysics does not apply blast machine for slow songs', () => {
  const band = buildBandWithMembers([
    { name: 'Lars', traits: [{ id: 'blast_machine' }] }
  ])
  const slowSong = { bpm: 120 }
  const physics = calculateGigPhysics(band, slowSong)

  assert.equal(
    physics.multipliers.drums,
    1.0,
    'Blast machine should not apply to slow songs'
  )
})

test('calculateGigPhysics includes avgStamina in result', () => {
  const band = buildBandWithMembers([
    { name: 'Matze', stamina: 60 },
    { name: 'Lars', stamina: 75 },
    { name: 'Marius', stamina: 90 }
  ])
  const song = { bpm: 120 }
  const physics = calculateGigPhysics(band, song)

  const expectedAvg = (60 + 75 + 90) / 3
  assert.equal(
    physics.avgStamina,
    expectedAvg,
    'Should calculate average stamina'
  )
})

test('calculateGigPhysics handles missing member gracefully', () => {
  const band = buildBandState({
    members: [
      {
        name: 'Matze',
        mood: 70,
        stamina: 80,
        baseStats: { skill: 5 },
        traits: []
      },
      {
        name: 'Unknown',
        mood: 70,
        stamina: 75,
        baseStats: { skill: 4 },
        traits: []
      }
    ]
  })
  const song = { bpm: 120 }
  const physics = calculateGigPhysics(band, song)

  assert.ok(physics, 'Should handle missing Lars')
  assert.ok(physics.hitWindows, 'Should still calculate hit windows')
})

test('calculateGigPhysics handles missing skill property', () => {
  const band = buildBandState({
    members: [
      { name: 'Matze', mood: 70, stamina: 80, traits: [] },
      { name: 'Lars', mood: 65, stamina: 75, traits: [] },
      { name: 'Marius', mood: 75, stamina: 70, traits: [] }
    ]
  })

  const song = { bpm: 120 }
  const physics = calculateGigPhysics(band, song)

  assert.equal(
    physics.hitWindows.guitar,
    150,
    'Should default to base hit window when skill missing'
  )
})

test('calculateDailyUpdates applies newsletter decay', () => {
  const currentState = {
    player: { day: 10, money: 100, van: { condition: 100 } },
    band: { members: [], harmony: 50 },
    social: {
      instagram: 100,
      tiktok: 100,
      youtube: 100,
      newsletter: 100,
      viral: 0,
      lastGigDay: 5
    }
  }

  const { social } = calculateDailyUpdates(currentState)

  // nextDay = 11. daysSinceActivity = 11 - 5 = 6.
  // Decay logic: 0.01 * (6 - 2) = 0.04
  // 100 * 0.96 = 96
  assert.ok(social.newsletter < 100, 'Newsletter should decay')
  assert.equal(social.newsletter, 96, 'Newsletter decay calculation incorrect')
})

test('calculateDailyUpdates does not decay if active recently', () => {
  const currentState = {
    player: { day: 10, money: 100, van: { condition: 100 } },
    band: { members: [], harmony: 50 },
    social: {
      instagram: 100,
      newsletter: 100,
      lastGigDay: 9
    }
  }

  const { social } = calculateDailyUpdates(currentState)

  assert.equal(social.instagram, 100, 'Instagram should not decay')
  assert.equal(social.newsletter, 100, 'Newsletter should not decay')
})

test('calculateDailyUpdates handles missing lastGigDay safely', () => {
  const currentState = {
    player: { day: 10, money: 100, van: { condition: 100 } },
    band: { members: [], harmony: 50 },
    social: {
      instagram: 100,
      newsletter: 100
    }
  }

  const { social } = calculateDailyUpdates(currentState)

  assert.equal(social.instagram, 100, 'Should not decay if lastGigDay missing')
})
