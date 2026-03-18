import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GAME_PHASES } from '../src/context/gameConstants.js'
import {
  ALLOWED_DEFAULT_SCENES,
  CHATTER_DB,
  getRandomChatter
} from '../src/data/chatter.js'
import { VENUE_CHATTER_DB } from '../src/data/chatter/venueChatter.js'

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
      inventory:
        overrides.band?.inventory !== undefined
          ? { ...baseBand.inventory, ...overrides.band.inventory }
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
  const expectedScenes = [
    GAME_PHASES.MENU,
    GAME_PHASES.OVERWORLD,
    GAME_PHASES.PRE_GIG,
    GAME_PHASES.POST_GIG,
    GAME_PHASES.TRAVEL_MINIGAME,
    GAME_PHASES.PRE_GIG_MINIGAME
  ]

  assert.deepEqual(
    [...ALLOWED_DEFAULT_SCENES].sort(),
    [...expectedScenes].sort(),
    'ALLOWED_DEFAULT_SCENES does not match the expected contract'
  )

  assert.strictEqual(
    ALLOWED_DEFAULT_SCENES.includes(GAME_PHASES.GIG),
    false,
    'GIG should not be in ALLOWED_DEFAULT_SCENES'
  )

  expectedScenes.forEach(scene => {
    const chatter = getRandomChatter(buildState(scene))
    assert.ok(chatter, `Expected chatter for scene: ${scene}`)
    assert.strictEqual(typeof chatter.text, 'string')
  })
})

test('disallowed scenes are not in ALLOWED_DEFAULT_SCENES', () => {
  const disallowedScenes = [
    GAME_PHASES.GIG,
    GAME_PHASES.SETTINGS,
    GAME_PHASES.CREDITS,
    GAME_PHASES.GAMEOVER
  ]

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

test('every venue chatter line key must have a valid translation key in EN and DE locales', async () => {
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

  VENUE_CHATTER_DB.forEach(venueEntry => {
    Object.values(venueEntry.linesByScene || {}).forEach(lines => {
      lines.forEach(textKey => {
        assert.ok(
          textKey.startsWith('chatter:'),
          `Venue chatter text must be an i18n key starting with 'chatter:', got: ${textKey}`
        )

        const jsonKey = textKey.split('chatter:')[1]

        assert.ok(
          resolveKey(enTranslations, jsonKey),
          `Missing English translation for venue chatter key: ${jsonKey}`
        )
        assert.ok(
          resolveKey(deTranslations, jsonKey),
          `Missing German translation for venue chatter key: ${jsonKey}`
        )
      })
    })
  })
})

// --- NEW: Condition-based chatter categories ---

// Parametrized: Harmony & Van Conditions
const harmonyVanVariants = [
  {
    label: 'harmony [low]',
    state: buildState(GAME_PHASES.OVERWORLD, { band: { harmony: 25 } }),
    expectedKey: 'chatter:standard.msg_230'
  },
  {
    label: 'harmony [high]',
    state: buildState(GAME_PHASES.OVERWORLD, { band: { harmony: 92 } }),
    expectedKey: 'chatter:standard.msg_239'
  },
  {
    label: 'van [low fuel]',
    useDelta: true,
    activeState: buildState(GAME_PHASES.OVERWORLD, {
      player: { van: { fuel: 15, condition: 100 } }
    }),
    inactiveState: buildState(GAME_PHASES.OVERWORLD, {
      player: { van: { fuel: 95, condition: 100 } }
    })
  },
  {
    label: 'van [critical condition]',
    state: buildState(GAME_PHASES.OVERWORLD, {
      player: { van: { fuel: 100, condition: 20 } }
    }),
    expectedKey: 'chatter:standard.msg_249'
  }
]

harmonyVanVariants.forEach(variant => {
  test(`${variant.useDelta ? 'van chatter fires when fuel is low' : 'harmony chatter fires'} ${variant.label}`, () => {
    let matches
    if (variant.useDelta) {
      matches = getConditionDelta({
        activeState: variant.activeState,
        inactiveState: variant.inactiveState
      })
    } else {
      matches = CHATTER_DB.filter(
        e =>
          typeof e.condition === 'function' &&
          e.condition(variant.state) &&
          e.text === variant.expectedKey
      )
    }
    assert.ok(
      matches.length > 0,
      `Expected chatter to activate for ${variant.label}`
    )
  })
})

// Parametrized: Tour Progression, Fame, Inventory, Modifiers, Luck
const tourFameLuckVariants = [
  {
    label: 'tour [late]',
    useDelta: true,
    activeState: buildState(GAME_PHASES.OVERWORLD, { player: { day: 28 } }),
    inactiveState: buildState(GAME_PHASES.OVERWORLD, { player: { day: 5 } })
  },
  {
    label: 'tour [early]',
    useDelta: true,
    activeState: buildState(GAME_PHASES.OVERWORLD, { player: { day: 1 } }),
    inactiveState: buildState(GAME_PHASES.OVERWORLD, { player: { day: 8 } })
  },
  {
    label: 'fame [fameLevel >= 2]',
    state: buildState(GAME_PHASES.OVERWORLD, {
      player: { fameLevel: 2, fame: 200 }
    }),
    expectedKey: 'chatter:standard.msg_275'
  },
  {
    label: 'fame [low]',
    state: buildState(GAME_PHASES.OVERWORLD, {
      player: { fame: 20, fameLevel: 0 }
    }),
    expectedKey: 'chatter:standard.msg_272'
  },
  {
    label: 'inventory [missing strings]',
    state: buildState(GAME_PHASES.OVERWORLD, {
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
    }),
    expectedKey: 'chatter:standard.msg_284'
  },
  {
    label: 'inventory [golden pick]',
    state: buildState(GAME_PHASES.OVERWORLD, {
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
    }),
    expectedKey: 'chatter:standard.msg_290'
  },
  {
    label: 'modifiers [catering booked]',
    useDelta: true,
    activeState: buildState(GAME_PHASES.OVERWORLD, {
      gigModifiers: { catering: true }
    }),
    inactiveState: buildState(GAME_PHASES.OVERWORLD, {
      gigModifiers: { catering: false }
    })
  },
  {
    label: 'modifiers [nothing booked]',
    useDelta: true,
    activeState: buildState(GAME_PHASES.OVERWORLD, {
      gigModifiers: {
        soundcheck: false,
        promo: false,
        catering: false,
        merch: false,
        guestlist: false
      }
    }),
    inactiveState: buildState(GAME_PHASES.OVERWORLD, {
      gigModifiers: {
        soundcheck: true,
        promo: true,
        catering: true,
        merch: false,
        guestlist: false
      }
    })
  },
  {
    label: 'luck [high]',
    useDelta: true,
    activeState: buildState(GAME_PHASES.OVERWORLD, { band: { luck: 5 } }),
    inactiveState: buildState(GAME_PHASES.OVERWORLD, { band: { luck: 0 } })
  },
  {
    label: 'luck [negative]',
    state: buildState(GAME_PHASES.OVERWORLD, { band: { luck: -5 } }),
    expectedKey: 'chatter:standard.msg_312'
  }
]

tourFameLuckVariants.forEach(variant => {
  test(`chatter fires ${variant.label}`, () => {
    let matches
    if (variant.useDelta) {
      matches = getConditionDelta({
        activeState: variant.activeState,
        inactiveState: variant.inactiveState
      })
    } else {
      matches = CHATTER_DB.filter(
        e =>
          typeof e.condition === 'function' &&
          e.condition(variant.state) &&
          e.text === variant.expectedKey
      )
    }
    assert.ok(
      matches.length > 0,
      `Expected chatter to activate for ${variant.label}`
    )
  })
})

// --- POST-GIG PERFORMANCE CONDITIONS (Parametrized) ---

const postGigVariants = [
  {
    label: 'high score',
    state: {
      ...buildState(GAME_PHASES.POST_GIG),
      lastGigStats: { score: 11000, misses: 3 }
    },
    expectedKey: 'chatter:standard.msg_097'
  },
  {
    label: 'high misses',
    state: {
      ...buildState(GAME_PHASES.POST_GIG),
      lastGigStats: { score: 5000, misses: 12 }
    },
    expectedKey: 'chatter:standard.msg_101'
  },
  {
    label: 'score threshold 9000',
    state: {
      ...buildState(GAME_PHASES.POST_GIG),
      lastGigStats: { score: 9500, misses: 2 }
    },
    expectedKey: 'chatter:standard.msg_119'
  },
  {
    label: 'undefined lastGigStats',
    state: buildState(GAME_PHASES.POST_GIG),
    shouldNotActivate: true
  }
]

postGigVariants.forEach(variant => {
  test(`post-gig chatter [${variant.label}]`, () => {
    const matches = CHATTER_DB.filter(
      e =>
        typeof e.condition === 'function' &&
        e.condition(variant.state) &&
        e.text === (variant.expectedKey || 'chatter:standard.msg_120')
    )
    if (variant.shouldNotActivate) {
      assert.strictEqual(
        matches.length,
        0,
        `Should not activate for ${variant.label}`
      )
    } else {
      assert.ok(matches.length > 0, `Expected chatter for ${variant.label}`)
    }
  })
})

// --- MONEY CONDITIONS (Parametrized) ---

const moneyVariants = [
  {
    label: 'very poor [money=50]',
    state: buildState(GAME_PHASES.OVERWORLD, { player: { money: 50 } }),
    expectedKey: 'chatter:standard.msg_172'
  },
  {
    label: 'wealthy [money=2500]',
    state: buildState(GAME_PHASES.OVERWORLD, { player: { money: 2500 } }),
    expectedKey: 'chatter:standard.msg_173'
  }
]

moneyVariants.forEach(variant => {
  test(`money chatter fires ${variant.label}`, () => {
    const matches = CHATTER_DB.filter(
      e =>
        typeof e.condition === 'function' &&
        e.condition(variant.state) &&
        e.text === variant.expectedKey
    )
    assert.ok(matches.length > 0, `Expected chatter for ${variant.label}`)
  })
})

test('money chatter at boundary thresholds', () => {
  const state100 = buildState(GAME_PHASES.OVERWORLD, { player: { money: 100 } })
  const state99 = buildState(GAME_PHASES.OVERWORLD, { player: { money: 99 } })
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
  assert.strictEqual(matches100.length, 0, 'Should not activate at exactly 100')
})

// --- MOOD CONDITIONS (Parametrized) ---

const moodVariants = [
  {
    label: 'very low [mood=15]',
    state: buildState(GAME_PHASES.OVERWORLD, {
      band: { members: [{ name: 'Matze', mood: 15, stamina: 50 }] }
    }),
    expectedKey: 'chatter:standard.msg_135'
  },
  {
    label: 'very high [mood=96]',
    state: buildState(GAME_PHASES.OVERWORLD, {
      band: { members: [{ name: 'Matze', mood: 96, stamina: 80 }] }
    }),
    expectedKey: 'chatter:standard.msg_156'
  },
  {
    label: 'any member low',
    state: buildState(GAME_PHASES.OVERWORLD, {
      band: {
        members: [
          { name: 'Matze', mood: 85, stamina: 80 },
          { name: 'Lars', mood: 50, stamina: 70 },
          { name: 'Marius', mood: 18, stamina: 60 }
        ]
      }
    }),
    expectedKey: 'chatter:standard.msg_135'
  }
]

moodVariants.forEach(variant => {
  test(`mood chatter fires ${variant.label}`, () => {
    const matches = CHATTER_DB.filter(
      e =>
        typeof e.condition === 'function' &&
        e.condition(variant.state) &&
        e.text === variant.expectedKey
    )
    assert.ok(matches.length > 0, `Expected chatter for ${variant.label}`)
  })
})

// --- SOCIAL MEDIA / VIRAL CONDITIONS ---

test('social media chatter fires for high instagram followers', () => {
  const state = buildState(GAME_PHASES.OVERWORLD, {
    social: { instagram: 600 }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_187'
  )
  assert.ok(matches.length > 0, 'Expected instagram chatter')
})

test('social media chatter fires when viral', () => {
  const state = buildState(GAME_PHASES.OVERWORLD, { social: { viral: 1 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text === 'chatter:standard.msg_188'
  )
  assert.ok(matches.length > 0, 'Expected viral chatter')
})

test('social chatter handles optional chaining for undefined social', () => {
  const state = buildState(GAME_PHASES.OVERWORLD)
  state.social = undefined
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

// --- LOCATION-BASED CONDITIONS (Parametrized) ---

const locationVariants = [
  {
    label: 'Stendal [venues:stendal_underground]',
    location: 'venues:stendal_underground',
    expectedKey: 'chatter:standard.msg_202'
  },
  {
    label: 'Stendal [city slug]',
    location: 'stendal',
    expectedKey: 'chatter:standard.msg_202'
  },
  {
    label: 'Berlin [venues:berlin_clubhouse]',
    location: 'venues:berlin_clubhouse',
    expectedKey: 'chatter:standard.msg_203'
  },
  {
    label: 'Stendal [includes partial match]',
    location: 'some_prefix_venues:stendal_suffix',
    expectedKey: 'chatter:standard.msg_202'
  }
]

locationVariants.forEach(variant => {
  test(`location chatter fires ${variant.label}`, () => {
    const state = buildState(GAME_PHASES.OVERWORLD, {
      player: { location: variant.location }
    })
    const matches = CHATTER_DB.filter(
      e =>
        typeof e.condition === 'function' &&
        e.condition(state) &&
        e.text === variant.expectedKey
    )
    assert.ok(matches.length > 0, `Expected chatter for ${variant.label}`)
  })
})

// --- GIG SCENE STAMINA CONDITIONS (Parametrized) ---

const gigStaminaVariants = [
  {
    label: 'high stamina [stamina=85]',
    state: buildState(GAME_PHASES.GIG, {
      band: { members: [{ name: 'Matze', mood: 70, stamina: 85 }] }
    }),
    expectedKey: 'chatter:standard.msg_215'
  },
  {
    label: 'exhausted [stamina=25]',
    state: buildState(GAME_PHASES.GIG, {
      band: { members: [{ name: 'Marius', mood: 60, stamina: 25 }] }
    }),
    expectedKey: 'chatter:standard.msg_216'
  },
  {
    label: 'multi-member check',
    state: buildState(GAME_PHASES.GIG, {
      band: {
        members: [
          { name: 'Matze', mood: 70, stamina: 82 },
          { name: 'Lars', mood: 60, stamina: 50 },
          { name: 'Marius', mood: 65, stamina: 28 }
        ]
      }
    }),
    expectedKeys: ['chatter:standard.msg_215', 'chatter:standard.msg_216']
  }
]

gigStaminaVariants.forEach(variant => {
  test(`gig stamina chatter ${variant.label}`, () => {
    if (variant.expectedKeys) {
      const matches = getActivatedConditionalEntries(variant.state)
      const highStamina = matches.filter(
        e => e.text === 'chatter:standard.msg_215'
      )
      const lowStamina = matches.filter(
        e => e.text === 'chatter:standard.msg_216'
      )
      assert.ok(highStamina.length > 0, 'Should detect high stamina member')
      assert.ok(lowStamina.length > 0, 'Should detect low stamina member')
    } else {
      const matches = CHATTER_DB.filter(
        e =>
          typeof e.condition === 'function' &&
          e.condition(variant.state) &&
          e.text === variant.expectedKey
      )
      assert.ok(matches.length > 0, `Expected chatter for ${variant.label}`)
    }
  })
})

// --- MINIGAME-SPECIFIC CHATTER (Parametrized) ---

const minigameVariants = [
  {
    label: 'travel minigame',
    scene: GAME_PHASES.TRAVEL_MINIGAME,
    expectedKey: 'chatter:standard.msg_314'
  },
  {
    label: 'pre-gig minigame (roadie)',
    scene: GAME_PHASES.PRE_GIG_MINIGAME,
    expectedKey: 'chatter:standard.msg_319'
  }
]

minigameVariants.forEach(variant => {
  test(`minigame chatter activates [${variant.label}]`, () => {
    const state = buildState(variant.scene)
    const matches = CHATTER_DB.filter(
      e =>
        typeof e.condition === 'function' &&
        e.condition(state) &&
        e.text === variant.expectedKey
    )
    assert.ok(matches.length > 0, `Expected chatter for ${variant.label}`)
  })
})

// --- TRAVEL/OVERWORLD CATEGORY CHATTER (Parametrized) ---

const travelCategoryVariants = [
  {
    label: 'OVERWORLD',
    scene: GAME_PHASES.OVERWORLD
  },
  {
    label: 'TRAVEL_MINIGAME',
    scene: GAME_PHASES.TRAVEL_MINIGAME
  }
]

travelCategoryVariants.forEach(variant => {
  test(`travel category chatter activates [${variant.label}]`, () => {
    const state = buildState(variant.scene)
    const matches = CHATTER_DB.filter(
      e =>
        e.category === 'travel' &&
        typeof e.condition === 'function' &&
        e.condition(state) &&
        e.text === 'chatter:standard.msg_001'
    )
    assert.ok(matches.length > 0, `Expected travel chatter in ${variant.label}`)
  })
})

// --- DATA INTEGRITY TESTS (Parametrized) ---

const fieldValidators = [
  {
    name: 'text field (required)',
    validate: (entry, index) => {
      assert.ok(entry.text, `Entry at index ${index} missing text field`)
      assert.strictEqual(
        typeof entry.text,
        'string',
        `Entry ${index} text is not a string`
      )
    }
  },
  {
    name: 'weight field (valid)',
    validate: (entry, index) => {
      assert.ok(
        typeof entry.weight === 'number',
        `Entry ${index} (${entry.text}) missing or invalid weight`
      )
      assert.ok(entry.weight > 0, `Entry ${index} has non-positive weight`)
    }
  },
  {
    name: 'i18n key format',
    validate: (entry, index) => {
      assert.ok(
        entry.text.startsWith('chatter:'),
        `Entry ${index} text doesn't use i18n format: ${entry.text}`
      )
    }
  },
  {
    name: 'speaker field (when present)',
    validate: (entry, index) => {
      const validSpeakers = ['Marius', 'Lars', 'Matze']
      if (entry.speaker) {
        assert.ok(
          validSpeakers.includes(entry.speaker),
          `Entry ${index} (${entry.text}) has invalid speaker: ${entry.speaker}`
        )
      }
    }
  },
  {
    name: 'category field (when present)',
    validate: (entry, index) => {
      const ALLOWED_CATEGORIES = ['travel']
      if (entry.category) {
        assert.ok(
          ALLOWED_CATEGORIES.includes(entry.category),
          `Entry ${index} has invalid category: ${entry.category}`
        )
      }
    }
  },
  {
    name: 'condition field (when present)',
    validate: (entry, index) => {
      if (entry.condition) {
        assert.strictEqual(
          typeof entry.condition,
          'function',
          `Entry ${index} (${entry.text}) condition is not a function`
        )
      }
    }
  }
]

fieldValidators.forEach(validator => {
  test(`all CHATTER_DB entries have valid ${validator.name}`, () => {
    CHATTER_DB.forEach((entry, index) => {
      validator.validate(entry, index)
    })
  })
})

// --- WEIGHT VARIATION TESTS (Parametrized) ---

const weightTests = [
  {
    name: 'weight variations exist across entries',
    validate: () => {
      const weights = new Set(CHATTER_DB.map(e => e.weight))
      assert.ok(weights.size > 1, 'Expected multiple different weight values')
    }
  },
  {
    name: 'high-weight entries for critical conditions',
    validate: () => {
      const criticalEntry = CHATTER_DB.find(
        e => e.text === 'chatter:standard.msg_134'
      )
      assert.ok(criticalEntry, 'Critical low-mood entry exists')
      assert.ok(
        criticalEntry.weight >= 8,
        'Critical conditions should have high weight'
      )
    }
  }
]

weightTests.forEach(testCase => {
  test(testCase.name, testCase.validate)
})

// --- EDGE CASES ---

test('handles empty band members array', () => {
  const state = buildState(GAME_PHASES.OVERWORLD, { band: { members: [] } })
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
  const state = buildState(GAME_PHASES.OVERWORLD, {
    player: { location: undefined }
  })
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
  const state = buildState(GAME_PHASES.OVERWORLD)
  state.band.inventory = undefined
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
  const state = buildState(GAME_PHASES.OVERWORLD, {
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
  const pregigState = buildState(GAME_PHASES.PRE_GIG)
  const miniState = buildState(GAME_PHASES.PRE_GIG_MINIGAME)

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
  const allModsState = buildState(GAME_PHASES.OVERWORLD, {
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
  const earlyState = buildState(GAME_PHASES.OVERWORLD, {
    player: { totalTravels: 1 }
  })
  const lateState = buildState(GAME_PHASES.OVERWORLD, {
    player: { totalTravels: 18 }
  })

  const earlyMatches = getActivatedConditionalEntries(earlyState).filter(
    e => e.text === 'chatter:standard.msg_268'
  )
  const lateMatches = getActivatedConditionalEntries(lateState).filter(
    e => e.text === 'chatter:standard.msg_271'
  )

  assert.ok(earlyMatches.length > 0, 'Early travel chatter should activate')
  assert.ok(lateMatches.length > 0, 'Late travel chatter should activate')
})

// --- ADDITIONAL STRUCTURE VALIDATION TESTS ---

test('chatter.json structure is valid JSON', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const rawContent = fs.readFileSync(
    path.resolve(process.cwd(), 'public/locales/en/chatter.json'),
    'utf-8'
  )
  assert.doesNotThrow(
    () => JSON.parse(rawContent),
    'chatter.json must be valid JSON'
  )
})

test('all chatter keys in en/chatter.json have non-empty string values', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const chatterData = JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), 'public/locales/en/chatter.json'),
      'utf-8'
    )
  )

  Object.entries(chatterData).forEach(([key, value]) => {
    assert.strictEqual(
      typeof value,
      'string',
      `Key ${key} must have string value`
    )
    assert.ok(value.length > 0, `Key ${key} must have non-empty value`)
    assert.ok(
      value.trim() === value,
      `Key ${key} value should not have leading/trailing whitespace`
    )
  })
})

test('chatter keys follow naming convention', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const chatterData = JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), 'public/locales/en/chatter.json'),
      'utf-8'
    )
  )

  Object.keys(chatterData).forEach(key => {
    assert.match(
      key,
      /^(standard|venues)\./,
      `Key ${key} should start with 'standard.' or 'venues.'`
    )
  })
})

test('venue chatter keys include scene phase suffixes', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const chatterData = JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), 'public/locales/en/chatter.json'),
      'utf-8'
    )
  )

  const venueKeys = Object.keys(chatterData).filter(k =>
    k.startsWith('venues.')
  )
  const validSuffixes = ['ANY_', 'OVERWORLD_', 'PREGIG_', 'GIG_', 'POSTGIG_']

  venueKeys.forEach(key => {
    const hasValidSuffix = validSuffixes.some(suffix => {
      const parts = key.split('.')
      const lastPart = parts[parts.length - 1]
      return lastPart.startsWith(suffix)
    })
    assert.ok(
      hasValidSuffix,
      `Venue key ${key} should have a valid scene phase suffix`
    )
  })
})

test('no duplicate chatter text content across all entries', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const chatterData = JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), 'public/locales/en/chatter.json'),
      'utf-8'
    )
  )

  const textValues = Object.values(chatterData)
  const duplicates = textValues.filter(
    (val, idx, arr) => arr.indexOf(val) !== idx
  )

  if (duplicates.length > 0) {
    assert.fail(
      `Found duplicate chatter texts: ${duplicates.slice(0, 3).join(', ')}`
    )
  }
  assert.ok(true, 'All chatter texts are unique')
})

test('chatter text content has reasonable length limits', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const chatterData = JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), 'public/locales/en/chatter.json'),
      'utf-8'
    )
  )

  Object.entries(chatterData).forEach(([key, value]) => {
    assert.ok(
      value.length >= 10,
      `Chatter ${key} too short (${value.length} chars)`
    )
    assert.ok(
      value.length <= 200,
      `Chatter ${key} too long (${value.length} chars)`
    )
  })
})

test('getRandomChatter returns different messages on multiple calls', () => {
  const state = buildState(GAME_PHASES.OVERWORLD)
  const results = new Set()

  for (let i = 0; i < 50; i++) {
    const chatter = getRandomChatter(state)
    if (chatter) {
      results.add(chatter.text)
    }
  }

  assert.ok(results.size > 1, 'Should return varied chatter messages')
})
