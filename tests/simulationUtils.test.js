import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getGigModifiers,
  calculateGigPhysics,
  calculateDailyUpdates
} from '../src/utils/simulationUtils.js'

import { buildBandState, buildBandWithMembers } from './simulationTestUtils.js'

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

// Parametrized: getGigModifiers harmony effect variants
const harmonyEffectVariants = [
  {
    label: 'grants telepathy bonus for high harmony',
    harmony: 85,
    expectedHitWindowBonus: 20,
    expectedNoteJitter: false,
    expectedEffectKeyword: 'TELEPATHY'
  },
  {
    label: 'applies disconnect penalty for low harmony',
    harmony: 25,
    expectedHitWindowBonus: 0,
    expectedNoteJitter: true,
    expectedEffectKeyword: 'DISCONNECT'
  },
  {
    label: 'has no special effects for mid harmony',
    harmony: 50,
    expectedHitWindowBonus: 0,
    expectedNoteJitter: false,
    expectedEffectKeyword: null
  }
]

harmonyEffectVariants.forEach(variant => {
  test(`getGigModifiers ${variant.label}`, () => {
    const band = buildBandState({ harmony: variant.harmony })
    const modifiers = getGigModifiers(band)

    assert.equal(
      modifiers.hitWindowBonus,
      variant.expectedHitWindowBonus,
      `Hit window bonus should be ${variant.expectedHitWindowBonus}`
    )
    assert.equal(
      modifiers.noteJitter,
      variant.expectedNoteJitter,
      `Note jitter should be ${variant.expectedNoteJitter}`
    )

    if (variant.expectedEffectKeyword) {
      assert.ok(
        modifiers.activeEffects.some(e =>
          e.fallback.includes(variant.expectedEffectKeyword)
        ),
        `Should include ${variant.expectedEffectKeyword} effect`
      )
    }
  })
})

// Parametrized: getGigModifiers Matze mood variations
const matzeMoodVariants = [
  {
    label: 'applies grumpy Matze penalty [mood: 15]',
    mood: 15,
    expectedGuitarMult: 0.5,
    shouldHaveEffect: true
  },
  {
    label: 'does not apply Matze penalty when mood is okay [mood: 50]',
    mood: 50,
    expectedGuitarMult: 1.0,
    shouldHaveEffect: false
  }
]

matzeMoodVariants.forEach(variant => {
  test(`getGigModifiers ${variant.label}`, () => {
    const band = buildBandWithMembers([{ name: 'Matze', mood: variant.mood }])
    const modifiers = getGigModifiers(band)

    assert.equal(
      modifiers.guitarScoreMult,
      variant.expectedGuitarMult,
      `Guitar multiplier should be ${variant.expectedGuitarMult}`
    )

    if (variant.shouldHaveEffect) {
      assert.ok(
        modifiers.activeEffects.some(e => e.fallback.includes('GRUMPY MATZE')),
        'Should describe Matze effect'
      )
    }
  })
})

// Parametrized: getGigModifiers Marius stamina variations
const mariusStaminaVariants = [
  {
    label: 'applies tired Marius speed increase [stamina: 15]',
    stamina: 15,
    expectedDrumMult: 1.2,
    shouldHaveEffect: true
  },
  {
    label: 'does not apply Marius penalty when stamina is okay [stamina: 50]',
    stamina: 50,
    expectedDrumMult: 1.0,
    shouldHaveEffect: false
  }
]

mariusStaminaVariants.forEach(variant => {
  test(`getGigModifiers ${variant.label}`, () => {
    const band = buildBandWithMembers([
      { name: 'Marius', stamina: variant.stamina }
    ])
    const modifiers = getGigModifiers(band)

    assert.equal(
      modifiers.drumSpeedMult,
      variant.expectedDrumMult,
      `Drum speed multiplier should be ${variant.expectedDrumMult}`
    )

    if (variant.shouldHaveEffect) {
      assert.ok(
        modifiers.activeEffects.some(e => e.fallback.includes('TIRED MARIUS')),
        'Should describe Marius effect'
      )
    }
  })
})

test('getGigModifiers can apply multiple effects', () => {
  const band = buildBandWithMembers(
    [
      { name: 'Matze', mood: 10 },
      { name: 'Marius', stamina: 10 }
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
  assert.equal(
    modifiers.drumSpeedMult,
    1.2,
    'Should have Marius speed increase'
  )
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
    { name: 'Marius', baseStats: { skill: 1 } },
    { name: 'Lars', baseStats: { skill: 1 } }
  ])
  const highSkillBand = buildBandWithMembers([
    { name: 'Matze', baseStats: { skill: 10 } },
    { name: 'Marius', baseStats: { skill: 10 } },
    { name: 'Lars', baseStats: { skill: 10 } }
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

// Parametrized: calculateGigPhysics speed modifier based on stamina
const speedModifierVariants = [
  {
    label: 'reduces speed for low stamina [20, 25, 20]',
    memberStaminas: [20, 25, 20],
    expectedSpeedModifier: 0.8
  },
  {
    label: 'maintains normal speed for adequate stamina [50, 50, 50]',
    memberStaminas: [50, 50, 50],
    expectedSpeedModifier: 1.0
  }
]

speedModifierVariants.forEach(variant => {
  test(`calculateGigPhysics ${variant.label}`, () => {
    const band = buildBandWithMembers([
      { name: 'Matze', stamina: variant.memberStaminas[0] },
      { name: 'Marius', stamina: variant.memberStaminas[1] },
      { name: 'Lars', stamina: variant.memberStaminas[2] }
    ])
    const song = { bpm: 120 }
    const physics = calculateGigPhysics(band, song)

    assert.equal(
      physics.speedModifier,
      variant.expectedSpeedModifier,
      `Speed modifier should be ${variant.expectedSpeedModifier}`
    )
  })
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

// Parametrized: calculateGigPhysics blast machine trait on different song tempos
const blastMachineVariants = [
  {
    label: 'applies blast machine trait for fast songs [bpm: 180]',
    songBpm: 180,
    expectedDrumMult: 1.5
  },
  {
    label: 'does not apply blast machine for slow songs [bpm: 120]',
    songBpm: 120,
    expectedDrumMult: 1.0
  }
]

blastMachineVariants.forEach(variant => {
  test(`calculateGigPhysics ${variant.label}`, () => {
    const band = buildBandWithMembers([
      { name: 'Marius', traits: [{ id: 'blast_machine' }] }
    ])
    const song = { bpm: variant.songBpm }
    const physics = calculateGigPhysics(band, song)

    assert.equal(
      physics.multipliers.drums,
      variant.expectedDrumMult,
      `Blast machine should ${variant.expectedDrumMult === 1.5 ? 'boost' : 'not affect'} drums`
    )
  })
})

test('calculateGigPhysics includes avgStamina in result', () => {
  const band = buildBandWithMembers([
    { name: 'Matze', stamina: 60 },
    { name: 'Marius', stamina: 75 },
    { name: 'Lars', stamina: 90 }
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

  assert.ok(physics, 'Should handle missing Marius')
  assert.ok(physics.hitWindows, 'Should still calculate hit windows')
})

test('calculateGigPhysics handles missing skill property', () => {
  const band = buildBandState({
    members: [
      { name: 'Matze', mood: 70, stamina: 80, traits: [] },
      { name: 'Marius', mood: 65, stamina: 75, traits: [] },
      { name: 'Lars', mood: 75, stamina: 70, traits: [] }
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

// Parametrized: calculateDailyUpdates decay based on activity recency
const decayVariants = [
  {
    label: 'applies newsletter decay when inactive [lastGigDay: 5 → day: 10]',
    lastGigDay: 5,
    currentDay: 10,
    expectedNewsletter: 96,
    checkInstagram: false
  },
  {
    label: 'does not decay if active recently [lastGigDay: 9 → day: 10]',
    lastGigDay: 9,
    currentDay: 10,
    expectedNewsletter: 100,
    expectedInstagram: 100,
    checkInstagram: true
  }
]

decayVariants.forEach(variant => {
  test(`calculateDailyUpdates ${variant.label}`, () => {
    const currentState = {
      player: { day: variant.currentDay, money: 100, van: { condition: 100 } },
      band: { members: [], harmony: 50 },
      social: {
        instagram: 100,
        tiktok: 100,
        youtube: 100,
        newsletter: 100,
        viral: 0,
        lastGigDay: variant.lastGigDay
      }
    }

    const { social } = calculateDailyUpdates(currentState)

    if (variant.checkInstagram) {
      assert.equal(
        social.instagram,
        variant.expectedInstagram,
        'Instagram should not decay'
      )
    }
    assert.equal(
      social.newsletter,
      variant.expectedNewsletter,
      `Newsletter should be ${variant.expectedNewsletter}`
    )
  })
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

test('calculateGigPhysics applies virtuoso trait hit window bonus', () => {
  const song = { bpm: 120 }

  const normalBand = buildBandWithMembers([
    { name: 'Matze', baseStats: { skill: 8 }, traits: [] }
  ])
  const normalPhysics = calculateGigPhysics(normalBand, song)
  const baseWindow = normalPhysics.hitWindows.guitar

  const virtuosoBand = buildBandWithMembers([
    { name: 'Matze', baseStats: { skill: 8 }, traits: [{ id: 'virtuoso' }] }
  ])
  const virtuosoPhysics = calculateGigPhysics(virtuosoBand, song)

  // 10% bonus
  assert.ok(
    Math.abs(virtuosoPhysics.hitWindows.guitar - baseWindow * 1.1) < 1e-6,
    'Guitar hit window should be increased by 10%'
  )
})
