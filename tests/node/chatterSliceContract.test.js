import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHATTER_DB, getRandomChatter } from '../../src/data/chatter/index.ts'
import { GAME_PHASES } from '../../src/context/gameConstants.ts'

// Companion to tests/ui/ChatterOverlay.test.jsx. ChatterOverlay forwards a
// narrowed snapshot typed by `ChatterGameState` (src/types/components.d.ts);
// typecheck ties the overlay to that type. This test ties the real chatter DB to
// it: every condition runs against a snapshot that carries exactly the
// `ChatterGameState` fields and throws on any read outside them, so a condition
// reading a field the overlay does not forward fails here.
// Keep these lists in sync with `ChatterGameState`.
const CHATTER_CONTRACT = {
  state: [
    'currentScene',
    'band',
    'player',
    'gameMap',
    'social',
    'lastGigStats',
    'gigModifiers'
  ],
  band: ['members', 'harmony', 'luck', 'inventory'],
  player: [
    'currentNodeId',
    'location',
    'money',
    'day',
    'fame',
    'fameLevel',
    'totalTravels',
    'van'
  ],
  van: ['fuel', 'condition'],
  gameMap: ['nodes']
}

const strictSlice = (value, label) => {
  const allowed = new Set(CHATTER_CONTRACT[label])
  const guard = key => {
    if (typeof key === 'string' && !allowed.has(key)) {
      throw new Error(
        `chatter read ${label}.${key}, which ChatterGameState does not carry`
      )
    }
  }
  return new Proxy(value, {
    get(target, key, receiver) {
      guard(key)
      return Reflect.get(target, key, receiver)
    },
    has(target, key) {
      guard(key)
      return Reflect.has(target, key)
    }
  })
}

// Two value profiles so threshold conditions on both sides (low money, high
// fame, ...) get past their first clause and reach the fields behind it.
const PROFILES = {
  low: {
    mood: 5,
    stamina: 5,
    harmony: 5,
    luck: 0,
    money: 0,
    day: 1,
    fame: 0,
    fameLevel: 0,
    totalTravels: 0,
    fuel: 0,
    condition: 0,
    hasGear: false,
    merch: 0,
    followers: 0,
    misses: 50,
    score: 0,
    modifier: false
  },
  high: {
    mood: 95,
    stamina: 95,
    harmony: 100,
    luck: 10,
    money: 100000,
    day: 200,
    fame: 100000,
    fameLevel: 10,
    totalTravels: 200,
    fuel: 100,
    condition: 100,
    hasGear: true,
    merch: 100,
    followers: 1000000,
    misses: 0,
    score: 1000000,
    modifier: true
  }
}

const buildContractSnapshot = (currentScene, profile, location) => {
  const p = PROFILES[profile]
  return strictSlice(
    {
      currentScene,
      band: strictSlice(
        {
          members: [
            { name: 'Matze', mood: p.mood, stamina: p.stamina },
            { name: 'Marius', mood: p.mood, stamina: p.stamina }
          ],
          harmony: p.harmony,
          luck: p.luck,
          inventory: {
            strings: p.hasGear,
            cables: p.hasGear,
            drum_parts: p.hasGear,
            golden_pick: p.hasGear,
            shirts: p.merch,
            hoodies: p.merch
          }
        },
        'band'
      ),
      player: strictSlice(
        {
          currentNodeId: 'node_none',
          location,
          money: p.money,
          day: p.day,
          fame: p.fame,
          fameLevel: p.fameLevel,
          totalTravels: p.totalTravels,
          van: strictSlice({ fuel: p.fuel, condition: p.condition }, 'van')
        },
        'player'
      ),
      gameMap: strictSlice({ nodes: {} }, 'gameMap'),
      social: { instagram: p.followers, viral: p.followers },
      lastGigStats: { misses: p.misses, score: p.score },
      gigModifiers: {
        soundcheck: p.modifier,
        promo: p.modifier,
        catering: p.modifier,
        guestlist: p.modifier,
        merch: p.modifier
      }
    },
    'state'
  )
}

const forEachContractSnapshot = callback => {
  for (const scene of Object.values(GAME_PHASES)) {
    for (const profile of Object.keys(PROFILES)) {
      for (const location of ['berlin', 'stendal', 'unknown_city']) {
        callback(
          buildContractSnapshot(scene, profile, location),
          `${scene}/${profile}/${location}`
        )
      }
    }
  }
}

test('every chatter condition reads only fields ChatterGameState carries', () => {
  // Empty memo so the band-stat helpers read `band.members` themselves.
  const memo = {}
  let evaluated = 0
  forEachContractSnapshot((state, label) => {
    for (const entry of CHATTER_DB) {
      if (typeof entry.condition !== 'function') continue
      assert.doesNotThrow(
        () => entry.condition(state, memo),
        `${entry.text} (${label})`
      )
      evaluated++
    }
  })
  assert.ok(evaluated > 0, 'CHATTER_DB has no conditions to check')
})

test('getRandomChatter selects a line from a ChatterGameState-shaped snapshot', () => {
  forEachContractSnapshot((state, label) => {
    const chatter = getRandomChatter(state)
    if (chatter !== null) {
      assert.equal(typeof chatter.text, 'string', label)
    }
  })
  const overworld = getRandomChatter(
    buildContractSnapshot(GAME_PHASES.OVERWORLD, 'low', 'berlin')
  )
  assert.ok(overworld, 'expected an overworld chatter line')
  assert.match(overworld.text, /^chatter:/)
})

test('the strict snapshot rejects a field outside ChatterGameState', () => {
  const state = buildContractSnapshot(GAME_PHASES.OVERWORLD, 'low', 'berlin')
  assert.throws(
    () => state.player.score,
    /chatter read player\.score, which ChatterGameState does not carry/
  )
  assert.throws(() => state.band.style, /band\.style/)
  assert.throws(() => state.player.van.upgrades, /van\.upgrades/)
})
