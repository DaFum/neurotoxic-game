import test from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import {
  applyEventDelta,
  calculateAppliedDelta
} from '../../src/utils/gameState'

// Lockstep safeguard for the twin EventDelta walkers in
// src/utils/gameState/delta.ts: `calculateAppliedDelta` (preview) and
// `applyEventDelta` (apply). Every field the EventDelta type
// (src/types/events.d.ts) declares is exercised in isolation below; the test
// fails when one walker produces an effect for a field the other ignores.
//
// When adding a field to EventDelta, add a case to FIELD_CASES. Fields that
// are intentionally handled by only one walker must be declared with
// expect: 'applyOnly' or 'previewOnly' and a reason.

// Mid-range baseline so no clamp collapses a small delta to a zero effect.
const buildState = () => ({
  player: {
    money: 500,
    day: 3,
    time: 12,
    fame: 50,
    fameLevel: 0,
    score: 100,
    location: 'Stendal',
    currentNodeId: 'node_0_0',
    stats: { gigsPlayed: 2 },
    van: { fuel: 50, condition: 60, upgrades: [] }
  },
  band: {
    harmony: 50,
    luck: 5,
    members: [
      {
        id: 'alpha',
        name: 'Alpha',
        mood: 50,
        stamina: 50,
        staminaMax: 100,
        traits: [],
        baseStats: { skill: 5 },
        relationships: { Beta: 10 }
      },
      {
        id: 'beta',
        name: 'Beta',
        mood: 60,
        stamina: 40,
        staminaMax: 100,
        traits: [],
        baseStats: { skill: 5 },
        relationships: { Alpha: 10 }
      }
    ],
    inventory: { sticker: 2 },
    stash: { hot_item: { type: 'consumable', quantity: 1 } },
    banterEvents: []
  },
  social: {
    controversyLevel: 20,
    viral: 10,
    loyalty: 10,
    followers: 100,
    influencers: {},
    egoFocus: null,
    trend: 'NEUTRAL',
    lastGigDay: null,
    lastGigDifficulty: null
  },
  activeStoryFlags: [],
  pendingEvents: [],
  eventCooldowns: []
})

const emptyDelta = () => ({ player: {}, band: {}, social: {}, flags: {} })

const withDelta = section => ({ ...emptyDelta(), ...section })

/**
 * Every EventDelta field, exercised one at a time.
 * expect:
 * - 'both'        — preview reports an effect AND apply changes state.
 * - 'applyOnly'   — only the apply walker acts (documented asymmetry).
 * - 'previewOnly' — only the preview walker reports it (documented asymmetry).
 * previewValue/stateDiff (optional) — numeric lockstep: the previewed delta
 * must equal the actual state difference produced by apply.
 */
const FIELD_CASES = [
  {
    name: 'score (top-level)',
    delta: withDelta({ score: 10 }),
    expect: 'both',
    previewValue: p => p.score,
    stateDiff: (b, a) => a.player.score - b.player.score
  },
  {
    name: 'player.money',
    delta: withDelta({ player: { money: 50 } }),
    expect: 'both',
    previewValue: p => p.player.money,
    stateDiff: (b, a) => a.player.money - b.player.money
  },
  {
    name: 'player.time',
    delta: withDelta({ player: { time: 5 } }),
    expect: 'both',
    previewValue: p => p.player.time,
    stateDiff: (b, a) => a.player.time - b.player.time
  },
  {
    name: 'player.fame',
    delta: withDelta({ player: { fame: 10 } }),
    expect: 'both',
    previewValue: p => p.player.fame,
    stateDiff: (b, a) => a.player.fame - b.player.fame
  },
  {
    name: 'player.score',
    delta: withDelta({ player: { score: 10 } }),
    expect: 'both',
    previewValue: p => p.score,
    stateDiff: (b, a) => a.player.score - b.player.score
  },
  {
    name: 'player.day',
    delta: withDelta({ player: { day: 1 } }),
    expect: 'both',
    previewValue: p => p.player.day,
    stateDiff: (b, a) => a.player.day - b.player.day
  },
  {
    // Scene/location swaps are apply-side only; the preview surface reports
    // clamped numeric changes for the event UI.
    name: 'player.location',
    delta: withDelta({ player: { location: 'Berlin' } }),
    expect: 'applyOnly'
  },
  {
    name: 'player.currentNodeId',
    delta: withDelta({ player: { currentNodeId: 'node_1_1' } }),
    expect: 'applyOnly'
  },
  {
    name: 'player.stats',
    delta: withDelta({ player: { stats: { gigsPlayed: 1 } } }),
    expect: 'both',
    previewValue: p => p.player.stats.gigsPlayed,
    stateDiff: (b, a) => a.player.stats.gigsPlayed - b.player.stats.gigsPlayed
  },
  {
    name: 'player.van.fuel',
    delta: withDelta({ player: { van: { fuel: -10 } } }),
    expect: 'both',
    previewValue: p => p.player.van.fuel,
    stateDiff: (b, a) => a.player.van.fuel - b.player.van.fuel
  },
  {
    name: 'player.van.condition',
    delta: withDelta({ player: { van: { condition: -10 } } }),
    expect: 'both',
    previewValue: p => p.player.van.condition,
    stateDiff: (b, a) => a.player.van.condition - b.player.van.condition
  },
  {
    name: 'band.harmony',
    delta: withDelta({ band: { harmony: 10 } }),
    expect: 'both',
    previewValue: p => p.band.harmony,
    stateDiff: (b, a) => a.band.harmony - b.band.harmony
  },
  {
    name: 'band.inventory',
    delta: withDelta({ band: { inventory: { sticker: 1 } } }),
    expect: 'both',
    previewValue: p => p.band.inventory.sticker,
    stateDiff: (b, a) => a.band.inventory.sticker - b.band.inventory.sticker
  },
  {
    name: 'band.members (uniform record delta)',
    delta: withDelta({
      band: { members: { moodChange: -5, staminaChange: -5 } }
    }),
    expect: 'both',
    previewValue: p => p.band.membersDelta[0].moodChange,
    stateDiff: (b, a) => a.band.members[0].mood - b.band.members[0].mood
  },
  {
    name: 'band.membersDelta (per-member array delta)',
    delta: withDelta({
      band: { membersDelta: [{ moodChange: 5 }, { staminaChange: 5 }] }
    }),
    expect: 'both',
    previewValue: p => p.band.membersDelta[1].staminaChange,
    stateDiff: (b, a) => a.band.members[1].stamina - b.band.members[1].stamina
  },
  {
    name: 'band.relationshipChange',
    delta: withDelta({
      band: {
        relationshipChange: [{ member1: 'Alpha', member2: 'Beta', change: 5 }]
      }
    }),
    expect: 'both',
    // No traits on the fixture members, so the raw change applies 1:1.
    previewValue: p => p.band.relationshipChange[0].change,
    stateDiff: (b, a) =>
      a.band.members[0].relationships.Beta -
      b.band.members[0].relationships.Beta
  },
  {
    name: 'band.luck',
    delta: withDelta({ band: { luck: 2 } }),
    expect: 'both',
    previewValue: p => p.band.luck,
    stateDiff: (b, a) => a.band.luck - b.band.luck
  },
  {
    name: 'band.skill',
    delta: withDelta({ band: { skill: 1 } }),
    expect: 'both',
    previewValue: p => p.band.members[0].skill,
    stateDiff: (b, a) =>
      a.band.members[0].baseStats.skill - b.band.members[0].baseStats.skill
  },
  {
    // Stash confiscation is apply-side only; the preview UI never surfaces it.
    name: 'band.stashRemove',
    delta: withDelta({ band: { stashRemove: ['hot_item'] } }),
    expect: 'applyOnly'
  },
  {
    name: 'social.controversyLevel',
    delta: withDelta({ social: { controversyLevel: 5 } }),
    expect: 'both',
    previewValue: p => p.social.controversyLevel,
    stateDiff: (b, a) => a.social.controversyLevel - b.social.controversyLevel
  },
  {
    name: 'social.viral',
    delta: withDelta({ social: { viral: 5 } }),
    expect: 'both',
    previewValue: p => p.social.viral,
    stateDiff: (b, a) => a.social.viral - b.social.viral
  },
  {
    name: 'social.loyalty',
    delta: withDelta({ social: { loyalty: 5 } }),
    expect: 'both',
    previewValue: p => p.social.loyalty,
    stateDiff: (b, a) => a.social.loyalty - b.social.loyalty
  },
  {
    // Apply handles ANY numeric social key generically; preview only reports
    // the three named channels above. Known asymmetry.
    name: 'social.<generic numeric channel> (followers)',
    delta: withDelta({ social: { followers: 10 } }),
    expect: 'applyOnly'
  },
  {
    name: 'social.egoFocus',
    delta: withDelta({ social: { egoFocus: 'Alpha' } }),
    expect: 'applyOnly'
  },
  {
    name: 'social.trend',
    delta: withDelta({ social: { trend: 'DRAMA' } }),
    expect: 'applyOnly'
  },
  {
    name: 'social.lastGigDay',
    delta: withDelta({ social: { lastGigDay: 4 } }),
    expect: 'applyOnly'
  },
  {
    name: 'social.lastGigDifficulty',
    delta: withDelta({ social: { lastGigDifficulty: 2 } }),
    expect: 'applyOnly'
  },
  {
    name: 'flags.addStoryFlag',
    delta: withDelta({ flags: { addStoryFlag: 'flag_lockstep' } }),
    expect: 'both'
  },
  {
    name: 'flags.queueEvent',
    delta: withDelta({ flags: { queueEvent: 'evt_lockstep' } }),
    expect: 'both'
  },
  {
    name: 'flags.addCooldown',
    delta: withDelta({ flags: { addCooldown: 'cool_lockstep' } }),
    expect: 'both'
  },
  {
    // unlock / gameOver / addQuest are consumed by the event reducer pipeline
    // (not by applyEventDelta); preview forwards them via the copied flags.
    name: 'flags.unlock',
    delta: withDelta({ flags: { unlock: 'song_lockstep' } }),
    expect: 'previewOnly'
  },
  {
    name: 'flags.gameOver',
    delta: withDelta({ flags: { gameOver: true } }),
    expect: 'previewOnly'
  },
  {
    name: 'flags.addQuest',
    delta: withDelta({ flags: { addQuest: [{ id: 'quest_lockstep' }] } }),
    expect: 'previewOnly'
  }
]

/** True when the preview output carries any meaningful (non-empty) effect. */
const hasMeaningfulEffect = value => {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'boolean') return true
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.some(hasMeaningfulEffect)
  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (hasMeaningfulEffect(value[key])) return true
    }
    return false
  }
  return false
}

test('EventDelta walkers stay in lockstep field-by-field', async t => {
  for (const fieldCase of FIELD_CASES) {
    await t.test(fieldCase.name, () => {
      const before = buildState()
      const preview = calculateAppliedDelta(buildState(), fieldCase.delta)
      const after = applyEventDelta(buildState(), fieldCase.delta)

      const previewEffect = hasMeaningfulEffect(preview)
      const applyEffect = !isDeepStrictEqual(before, after)

      switch (fieldCase.expect) {
        case 'both':
          assert.equal(
            previewEffect,
            true,
            'calculateAppliedDelta ignored a field applyEventDelta handles'
          )
          assert.equal(
            applyEffect,
            true,
            'applyEventDelta ignored a field calculateAppliedDelta handles'
          )
          break
        case 'applyOnly':
          assert.equal(
            previewEffect,
            false,
            'calculateAppliedDelta now handles a field marked applyOnly — update FIELD_CASES'
          )
          assert.equal(
            applyEffect,
            true,
            'applyEventDelta no longer handles a field marked applyOnly — update FIELD_CASES'
          )
          break
        case 'previewOnly':
          assert.equal(
            previewEffect,
            true,
            'calculateAppliedDelta no longer reports a field marked previewOnly — update FIELD_CASES'
          )
          assert.equal(
            applyEffect,
            false,
            'applyEventDelta now handles a field marked previewOnly — update FIELD_CASES'
          )
          break
        default:
          assert.fail(`Unknown expectation: ${fieldCase.expect}`)
      }

      if (fieldCase.previewValue && fieldCase.stateDiff) {
        assert.equal(
          fieldCase.previewValue(preview),
          fieldCase.stateDiff(before, after),
          'previewed delta does not match the state diff produced by apply'
        )
      }
    })
  }
})

test('EventDelta lockstep on the fully-populated combined delta', () => {
  // Merge every per-field delta into one EventDelta and re-run both walkers,
  // catching cross-field interference that single-field runs cannot see.
  const combined = emptyDelta()
  for (const { delta } of FIELD_CASES) {
    combined.player = {
      ...combined.player,
      ...delta.player,
      van: { ...combined.player.van, ...delta.player.van },
      stats: { ...combined.player.stats, ...delta.player.stats }
    }
    combined.band = { ...combined.band, ...delta.band }
    combined.social = { ...combined.social, ...delta.social }
    combined.flags = { ...combined.flags, ...delta.flags }
    if (delta.score !== undefined) combined.score = delta.score
  }
  // 'members' and 'membersDelta' cannot coexist meaningfully (membersDelta
  // wins in both walkers); keep only membersDelta for the combined run.
  delete combined.band.members

  const before = buildState()
  const preview = calculateAppliedDelta(buildState(), combined)
  const after = applyEventDelta(buildState(), combined)

  assert.equal(hasMeaningfulEffect(preview), true)
  assert.equal(isDeepStrictEqual(before, after), false)

  for (const fieldCase of FIELD_CASES) {
    if (!fieldCase.previewValue || !fieldCase.stateDiff) continue
    if (fieldCase.delta.band?.members) continue // dropped above
    if (fieldCase.name === 'score (top-level)') continue // player.score wins
    assert.equal(
      fieldCase.previewValue(preview),
      fieldCase.stateDiff(before, after),
      `combined run: previewed delta diverges from applied state diff for ${fieldCase.name}`
    )
  }
})
