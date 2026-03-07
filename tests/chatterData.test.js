import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ALLOWED_DEFAULT_SCENES,
  CHATTER_DB,
  getRandomChatter
} from '../src/data/chatter.js'

const buildState = (scene, overrides = {}) => {
  const baseBand = {
    members: [{ name: 'Matze', mood: 80, stamina: 100 }],
    harmony: 80,
    luck: 0,
    inventory: {
      strings: true,
      cables: true,
      drum_parts: true,
      golden_pick: false,
      shirts: 50,
      hoodies: 20,
      patches: 100,
      cds: 30,
      vinyl: 10
    }
  }

  return {
    currentScene: scene,
    player: {
      currentNodeId: 'none',
      money: 500,
      day: 1,
      totalTravels: 0,
      fame: 0,
      fameLevel: 0,
      van: { fuel: 100, condition: 100, upgrades: [] },
      ...overrides.player
    },
    band: {
      ...baseBand,
      ...overrides.band,
      // Deep merge members or inventory if they exist in overrides but we want defaults too
      inventory: overrides.band?.inventory !== undefined
        ? overrides.band.inventory
        : baseBand.inventory
    },
    social: {
      instagram: 228,
      tiktok: 64,
      youtube: 14,
      viral: 0,
      ...overrides.social
    },
    gameMap: { nodes: {} },
    gigModifiers: {
      promo: false,
      soundcheck: false,
      merch: false,
      catering: false,
      guestlist: false,
      ...overrides.gigModifiers
    },
    ...Object.fromEntries(
      Object.entries(overrides).filter(
        ([k]) => !['player', 'band', 'social', 'gigModifiers'].includes(k)
      )
    )
  }
}

const getActivatedConditionalEntries = state =>
  CHATTER_DB.filter(
    entry => typeof entry.condition === 'function' && entry.condition(state)
  )

const getConditionDelta = ({ activeState, inactiveState }) => {
  const inactiveEntries = new Set(getActivatedConditionalEntries(inactiveState))
  return getActivatedConditionalEntries(activeState).filter(
    entry => !inactiveEntries.has(entry)
  )
}

test('getRandomChatter supports default chatter in all top-level scenes', () => {
  const scenes = ALLOWED_DEFAULT_SCENES

  scenes.forEach(scene => {
    const chatter = getRandomChatter(buildState(scene))
    assert.ok(chatter, `Expected chatter for scene: ${scene}`)
    assert.strictEqual(typeof chatter.text, 'string')
  })
})

test('disallowed scenes are not in ALLOWED_DEFAULT_SCENES', () => {
  const disallowedScenes = ['GIG', 'SETTINGS', 'CREDITS', 'GAMEOVER']

  disallowedScenes.forEach(scene => {
    assert.strictEqual(ALLOWED_DEFAULT_SCENES.includes(scene), false)
  })
})

test('every chatter entry text must have a valid translation key in EN and DE locales', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const enTranslations = JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), 'public/locales/en/chatter.json'),
      'utf-8'
    )
  )
  const deTranslations = JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), 'public/locales/de/chatter.json'),
      'utf-8'
    )
  )

  const resolveKey = (obj, keyPath) => {
    if (obj[keyPath] !== undefined) return obj[keyPath]
    return keyPath.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  CHATTER_DB.forEach(entry => {
    const textKey = entry.text
    assert.ok(
      textKey.startsWith('chatter:'),
      `Chatter text must be an i18n key starting with 'chatter:', got: ${textKey}`
    )

    // Extract the part after 'chatter:'
    const jsonKey = textKey.split('chatter:')[1]

    assert.ok(
      resolveKey(enTranslations, jsonKey),
      `Missing English translation for key: ${jsonKey}`
    )
    assert.ok(
      resolveKey(deTranslations, jsonKey),
      `Missing German translation for key: ${jsonKey}`
    )
  })
})

// --- NEW: Condition-based chatter categories ---

test('harmony chatter fires when band.harmony is low', () => {
  const state = buildState('OVERWORLD', { band: { harmony: 25 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_230'
  )
  assert.ok(matches.length > 0, 'Expected low-harmony chatter to activate')
})

test('harmony chatter fires when band.harmony is high', () => {
  const state = buildState('OVERWORLD', { band: { harmony: 92 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_239'
  )
  assert.ok(matches.length > 0, 'Expected high-harmony chatter to activate')
})

test('van chatter fires when fuel is low', () => {
  const lowFuelState = buildState('OVERWORLD', {
    player: { van: { fuel: 15, condition: 100 } }
  })
  const highFuelState = buildState('OVERWORLD', {
    player: { van: { fuel: 95, condition: 100 } }
  })
  const matches = getConditionDelta({
    activeState: lowFuelState,
    inactiveState: highFuelState
  })
  assert.ok(matches.length > 0, 'Expected low-fuel chatter to activate')
})

test('van chatter fires when condition is critical', () => {
  const state = buildState('OVERWORLD', {
    player: { van: { fuel: 100, condition: 20 } }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_249'
  )
  assert.ok(
    matches.length > 0,
    'Expected bad-condition van chatter to activate'
  )
})

test('tour progression chatter fires for late tour', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', { player: { day: 28 } }),
    inactiveState: buildState('OVERWORLD', { player: { day: 5 } })
  })
  assert.ok(matches.length > 0, 'Expected late-tour chatter to activate')
})

test('tour progression chatter fires for early tour', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', { player: { day: 1 } }),
    inactiveState: buildState('OVERWORLD', { player: { day: 8 } })
  })
  assert.ok(matches.length > 0, 'Expected early-tour chatter to activate')
})

test('fame chatter fires when fameLevel >= 2', () => {
  const state = buildState('OVERWORLD', { player: { fameLevel: 2, fame: 200 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_275'
  )
  assert.ok(matches.length > 0, 'Expected fame-level chatter to activate')
})

test('fame chatter fires when fame is low', () => {
  const state = buildState('OVERWORLD', { player: { fame: 20, fameLevel: 0 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_272'
  )
  assert.ok(matches.length > 0, 'Expected low-fame chatter to activate')
})

test('inventory chatter fires when strings are missing', () => {
  const state = buildState('OVERWORLD', {
    band: {
      inventory: {
        strings: false,
        cables: true,
        drum_parts: true,
        golden_pick: false,
        shirts: 50,
        hoodies: 20,
        patches: 100,
        cds: 30,
        vinyl: 10
      }
    }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_284'
  )
  assert.ok(matches.length > 0, 'Expected missing-strings chatter to activate')
})

test('inventory chatter fires for golden pick', () => {
  const state = buildState('OVERWORLD', {
    band: {
      inventory: {
        strings: true,
        cables: true,
        drum_parts: true,
        golden_pick: true,
        shirts: 50,
        hoodies: 20,
        patches: 100,
        cds: 30,
        vinyl: 10
      }
    }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_290'
  )
  assert.ok(matches.length > 0, 'Expected golden-pick chatter to activate')
})

test('gig modifier chatter fires when catering is booked', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', { gigModifiers: { catering: true } }),
    inactiveState: buildState('OVERWORLD', {
      gigModifiers: { catering: false }
    })
  })
  assert.ok(matches.length > 0, 'Expected catering chatter to activate')
})

test('gig modifier chatter fires when nothing is booked', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', {
      gigModifiers: {
        soundcheck: false,
        promo: false,
        catering: false,
        merch: false,
        guestlist: false
      }
    }),
    inactiveState: buildState('OVERWORLD', {
      gigModifiers: {
        soundcheck: true,
        promo: true,
        catering: true,
        merch: false,
        guestlist: false
      }
    })
  })
  assert.ok(matches.length > 0, 'Expected no-modifiers chatter to activate')
})

test('luck chatter fires when luck is high', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', { band: { luck: 5 } }),
    inactiveState: buildState('OVERWORLD', { band: { luck: 0 } })
  })
  assert.ok(matches.length > 0, 'Expected high-luck chatter to activate')
})

test('luck chatter fires when luck is negative', () => {
  const state = buildState('OVERWORLD', { band: { luck: -5 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_312'
  )
  assert.ok(matches.length > 0, 'Expected bad-luck chatter to activate')
})

// --- POST-GIG PERFORMANCE CONDITIONS ---

test('post-gig chatter fires when score is very high', () => {
  const state = {
    ...buildState('POSTGIG'),
    lastGigStats: { score: 11000, misses: 3 }
  }
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_097'
  )
  assert.ok(matches.length > 0, 'Expected high-score post-gig chatter')
})

test('post-gig chatter fires when misses are high', () => {
  const state = {
    ...buildState('POSTGIG'),
    lastGigStats: { score: 5000, misses: 12 }
  }
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_101'
  )
  assert.ok(matches.length > 0, 'Expected high-miss post-gig chatter')
})

test('post-gig chatter with score threshold at 9000', () => {
  const state = {
    ...buildState('POSTGIG'),
    lastGigStats: { score: 9500, misses: 2 }
  }
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_119'
  )
  assert.ok(matches.length > 0, 'Expected score > 9000 chatter')
})

test('post-gig chatter handles undefined lastGigStats', () => {
  const state = buildState('POSTGIG')
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_120'
  )
  assert.strictEqual(
    matches.length,
    0,
    'Should not activate when lastGigStats is undefined'
  )
})

// --- MONEY CONDITIONS ---

test('money chatter fires when very poor', () => {
  const state = buildState('OVERWORLD', { player: { money: 50 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_172'
  )
  assert.ok(matches.length > 0, 'Expected low-money chatter')
})

test('money chatter fires when wealthy', () => {
  const state = buildState('OVERWORLD', { player: { money: 2500 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_173'
  )
  assert.ok(matches.length > 0, 'Expected high-money chatter')
})

test('money chatter at boundary thresholds', () => {
  const state100 = buildState('OVERWORLD', { player: { money: 100 } })
  const state99 = buildState('OVERWORLD', { player: { money: 99 } })
  const matches99 = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state99) &&
      e.text === 'chatter:standard.msg_172'
  )
  const matches100 = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state100) &&
      e.text === 'chatter:standard.msg_172'
  )
  assert.ok(matches99.length > 0, 'Expected low-money chatter at 99')
  assert.strictEqual(
    matches100.length,
    0,
    'Should not activate at exactly 100'
  )
})

// --- MOOD CONDITIONS ---

test('mood chatter fires when member mood is very low', () => {
  const state = buildState('OVERWORLD', {
    band: { members: [{ name: 'Matze', mood: 15, stamina: 50 }] }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_135'
  )
  assert.ok(matches.length > 0, 'Expected very-low-mood chatter')
})

test('mood chatter fires when member mood is high', () => {
  const state = buildState('OVERWORLD', {
    band: { members: [{ name: 'Matze', mood: 96, stamina: 80 }] }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_156'
  )
  assert.ok(matches.length > 0, 'Expected very-high-mood chatter')
})

test('mood chatter checks any band member', () => {
  const state = buildState('OVERWORLD', {
    band: {
      members: [
        { name: 'Matze', mood: 85, stamina: 80 },
        { name: 'Lars', mood: 50, stamina: 70 },
        { name: 'Marius', mood: 18, stamina: 60 }
      ]
    }
  })
  const lowMoodMatches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_135'
  )
  assert.ok(
    lowMoodMatches.length > 0,
    'Should activate if ANY member has low mood'
  )
})

// --- SOCIAL MEDIA / VIRAL CONDITIONS ---

test('social media chatter fires for high instagram followers', () => {
  const state = buildState('OVERWORLD', { social: { instagram: 600 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_187'
  )
  assert.ok(matches.length > 0, 'Expected instagram chatter')
})

test('social media chatter fires when viral', () => {
  const state = buildState('OVERWORLD', { social: { viral: 1 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_188'
  )
  assert.ok(matches.length > 0, 'Expected viral chatter')
})

test('social chatter handles optional chaining for undefined social', () => {
  const state = buildState('OVERWORLD', { social: undefined })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_191'
  )
  assert.strictEqual(
    matches.length,
    0,
    'Should not crash with undefined social'
  )
})

// --- LOCATION-BASED CONDITIONS ---

test('location chatter fires in Stendal', () => {
  const state = buildState('OVERWORLD', {
    player: { location: 'venues:stendal_underground' }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_202'
  )
  assert.ok(matches.length > 0, 'Expected Stendal chatter')
})

test('location chatter fires in Berlin', () => {
  const state = buildState('OVERWORLD', {
    player: { location: 'venues:berlin_clubhouse' }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_203'
  )
  assert.ok(matches.length > 0, 'Expected Berlin chatter')
})

test('location chatter partial match with includes', () => {
  // It's intentional that location checks use .includes() for substring matching
  // as the game engine appends prefixes/suffixes dynamically to locations.
  const state = buildState('OVERWORLD', {
    player: { location: 'some_prefix_venues:stendal_suffix' }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_202'
  )
  assert.ok(matches.length > 0, 'Should match with includes')
})

// --- GIG SCENE STAMINA CONDITIONS ---

test('gig stamina chatter fires when energy is high', () => {
  const state = buildState('GIG', {
    band: { members: [{ name: 'Matze', mood: 70, stamina: 85 }] }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_215'
  )
  assert.ok(matches.length > 0, 'Expected high-stamina gig chatter')
})

test('gig stamina chatter fires when exhausted', () => {
  const state = buildState('GIG', {
    band: { members: [{ name: 'Marius', mood: 60, stamina: 25 }] }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_216'
  )
  assert.ok(matches.length > 0, 'Expected low-stamina gig chatter')
})

test('gig stamina checks any band member during performance', () => {
  const state = buildState('GIG', {
    band: {
      members: [
        { name: 'Matze', mood: 70, stamina: 82 },
        { name: 'Lars', mood: 60, stamina: 50 },
        { name: 'Marius', mood: 65, stamina: 28 }
      ]
    }
  })
  const highStaminaMatches = getActivatedConditionalEntries(state).filter(
    e => e.text === 'chatter:standard.msg_215'
  )
  const lowStaminaMatches = getActivatedConditionalEntries(state).filter(
    e => e.text === 'chatter:standard.msg_216'
  )
  assert.ok(highStaminaMatches.length > 0, 'Should detect high stamina member')
  assert.ok(lowStaminaMatches.length > 0, 'Should detect low stamina member')
})

// --- MINIGAME-SPECIFIC CHATTER ---

test('travel minigame chatter activates during travel', () => {
  const state = buildState('TRAVEL_MINIGAME')
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_314'
  )
  assert.ok(matches.length > 0, 'Expected travel minigame chatter')
})

test('pre-gig minigame (roadie) chatter activates', () => {
  const state = buildState('PRE_GIG_MINIGAME')
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_319'
  )
  assert.ok(matches.length > 0, 'Expected pre-gig minigame chatter')
})

// --- TRAVEL/OVERWORLD CATEGORY CHATTER ---

test('travel category chatter activates in OVERWORLD', () => {
  const state = buildState('OVERWORLD')
  const matches = CHATTER_DB.filter(
    e =>
      e.category === 'travel' &&
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_001'
  )
  assert.ok(matches.length > 0, 'Expected travel category chatter')
})

test('travel category chatter activates in TRAVEL_MINIGAME', () => {
  const state = buildState('TRAVEL_MINIGAME')
  const matches = CHATTER_DB.filter(
    e =>
      e.category === 'travel' &&
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_001'
  )
  assert.ok(matches.length > 0, 'Expected travel chatter in minigame')
})

// --- DATA INTEGRITY TESTS ---

test('all CHATTER_DB entries have required text field', () => {
  CHATTER_DB.forEach((entry, index) => {
    assert.ok(entry.text, `Entry at index ${index} missing text field`)
    assert.strictEqual(
      typeof entry.text,
      'string',
      `Entry ${index} text is not a string`
    )
  })
})

test('all CHATTER_DB entries have valid weight', () => {
  CHATTER_DB.forEach((entry, index) => {
    assert.ok(
      typeof entry.weight === 'number',
      `Entry ${index} (${entry.text}) missing or invalid weight`
    )
    assert.ok(entry.weight > 0, `Entry ${index} has non-positive weight`)
  })
})

test('all CHATTER_DB entries use i18n key format', () => {
  CHATTER_DB.forEach((entry, index) => {
    assert.ok(
      entry.text.startsWith('chatter:'),
      `Entry ${index} text doesn't use i18n format: ${entry.text}`
    )
  })
})

test('speaker field is valid when present', () => {
  const validSpeakers = ['Marius', 'Lars', 'Matze']
  CHATTER_DB.forEach((entry, index) => {
    if (entry.speaker) {
      assert.ok(
        validSpeakers.includes(entry.speaker),
        `Entry ${index} (${entry.text}) has invalid speaker: ${entry.speaker}`
      )
    }
  })
})

test('category field is valid when present', () => {
  const validCategories = [...new Set(CHATTER_DB.map(e => e.category).filter(Boolean))]
  CHATTER_DB.forEach((entry, index) => {
    if (entry.category) {
      assert.ok(
        validCategories.includes(entry.category),
        `Entry ${index} has invalid category: ${entry.category}`
      )
    }
  })
})

test('condition field is a function when present', () => {
  CHATTER_DB.forEach((entry, index) => {
    if (entry.condition) {
      assert.strictEqual(
        typeof entry.condition,
        'function',
        `Entry ${index} (${entry.text}) condition is not a function`
      )
    }
  })
})

// --- WEIGHT VARIATION TESTS ---

test('weight variations exist across entries', () => {
  const weights = new Set(CHATTER_DB.map(e => e.weight))
  assert.ok(weights.size > 1, 'Expected multiple different weight values')
})

test('high-weight entries for critical conditions', () => {
  const criticalEntry = CHATTER_DB.find(
    e => e.text === 'chatter:standard.msg_134'
  )
  assert.ok(criticalEntry, 'Critical low-mood entry exists')
  assert.ok(
    criticalEntry.weight >= 8,
    'Critical conditions should have high weight'
  )
})

// --- EDGE CASES ---

test('handles empty band members array', () => {
  const state = buildState('OVERWORLD', { band: { members: [] } })
  const moodMatches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_134'
  )
  assert.strictEqual(
    moodMatches.length,
    0,
    'Should not activate with empty members'
  )
})

test('handles undefined player location gracefully', () => {
  const state = buildState('OVERWORLD', { player: { location: undefined } })
  const locationMatches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_202'
  )
  assert.strictEqual(
    locationMatches.length,
    0,
    'Should not crash with undefined location'
  )
})

test('inventory conditions require inventory object', () => {
  const state = buildState('OVERWORLD', { band: { inventory: undefined } })
  const inventoryEntry = CHATTER_DB.find(
    e => e.text === 'chatter:standard.msg_284'
  )
  assert.strictEqual(
    inventoryEntry.condition(state),
    false,
    'Should return false when inventory is undefined'
  )
})

test('inventory conditions work with valid inventory object', () => {
  const state = buildState('OVERWORLD', {
    band: {
      inventory: {
        strings: false,
        cables: true,
        drum_parts: true,
        golden_pick: false,
        shirts: 50,
        hoodies: 20,
        patches: 100,
        cds: 30,
        vinyl: 10
      }
    }
  })
  const inventoryEntry = CHATTER_DB.find(
    e => e.text === 'chatter:standard.msg_284'
  )
  assert.doesNotThrow(
    () => inventoryEntry.condition(state),
    'Should not throw with valid inventory'
  )
  assert.strictEqual(
    inventoryEntry.condition(state),
    true,
    'Should activate when strings === false'
  )
})

// --- REGRESSION TESTS ---

test('PREGIG and PRE_GIG_MINIGAME conditions work', () => {
  const pregigState = buildState('PREGIG')
  const miniState = buildState('PRE_GIG_MINIGAME')

  const pregigMatches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(pregigState) &&
      e.text === 'chatter:standard.msg_056'
  )
  const miniMatches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(miniState) &&
      e.text === 'chatter:standard.msg_056'
  )

  assert.ok(pregigMatches.length > 0, 'Should work in PREGIG')
  assert.ok(miniMatches.length > 0, 'Should work in PRE_GIG_MINIGAME')
})

test('combined gig modifier conditions work correctly', () => {
  const allModsState = buildState('OVERWORLD', {
    gigModifiers: {
      soundcheck: true,
      promo: true,
      catering: true,
      merch: false,
      guestlist: false
    }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(allModsState) &&
      e.text === 'chatter:standard.msg_305'
  )
  assert.ok(matches.length > 0, 'Expected all-modifiers chatter')
})

test('multiple travel count thresholds work', () => {
  const earlyState = buildState('OVERWORLD', { player: { totalTravels: 1 } })
  const lateState = buildState('OVERWORLD', { player: { totalTravels: 18 } })

  const earlyMatches = getActivatedConditionalEntries(earlyState).filter(
    e => e.text === 'chatter:standard.msg_268'
  )
  const lateMatches = getActivatedConditionalEntries(lateState).filter(
    e => e.text === 'chatter:standard.msg_271'
  )

  assert.ok(earlyMatches.length > 0, 'Early travel chatter should activate')
  assert.ok(lateMatches.length > 0, 'Late travel chatter should activate')
})