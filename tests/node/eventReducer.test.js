import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

// We will mock checkTraitUnlocks using `mock.module` which works natively in newer Node versions
let checkTraitUnlocksMock = mock.fn(() => [
  { memberId: 'm1', traitId: 'tech_wizard' }
])
mock.module(new URL('../../src/utils/unlockCheck.ts', import.meta.url).href, {
  namedExports: {
    checkTraitUnlocks: checkTraitUnlocksMock
  }
})

// Using a dynamic import so the mock applies before the module is loaded
const {
  handleSetActiveEvent,
  handleSetScreenshotMode,
  handleApplyEventDelta,
  handlePopPendingEvent
} = await import('../../src/context/reducers/eventReducer')

const { migrateLegacyQuestSchema } =
  await import('../../src/domain/questLegacyMigration.ts')

/**
 * Builds a state whose only active quest is the given economy quest, so a
 * single `handleApplyEventDelta` call can be scored end to end.
 */
const stateWithQuest = (quest, player) => ({
  band: { harmony: 50, members: [] },
  player: { day: 1, money: 1000, fame: 100, ...player },
  toasts: [],
  inventory: {},
  activeStoryFlags: [],
  activeQuests: [migrateLegacyQuestSchema(quest)],
  completedQuestIds: [],
  questCooldowns: [],
  quests: {}
})

const questProgress = (state, questId) =>
  state.activeQuests.find(q => q.id === questId)?.progress ?? 0

describe('eventReducer', () => {
  /** @type {import('../../src/types').GameState} */
  let baseState

  beforeEach(() => {
    checkTraitUnlocksMock.mock.resetCalls()
    baseState = /** @type {import('../../src/types').GameState} */ ({
      activeEvent: null,
      band: {
        harmony: 50,
        members: [{ id: 'm1', name: 'Matze', traits: {} }] // Matze exists in characters.js
      },
      player: {
        money: 1000
      },
      toasts: [],
      inventory: {},
      activeStoryFlags: []
    })
  })

  describe('handlePopPendingEvent', () => {
    it('drops the head when no id is supplied', () => {
      const state = { ...baseState, pendingEvents: ['a', 'b'] }

      assert.deepEqual(handlePopPendingEvent(state).pendingEvents, ['b'])
      assert.deepEqual(handlePopPendingEvent(state, {}).pendingEvents, ['b'])
    })

    it('removes the played id from anywhere in the queue', () => {
      // Selection may skip an ineligible head, so the played event is not
      // necessarily at index 0 — leaving it queued would replay it.
      const state = { ...baseState, pendingEvents: ['blocked', 'played'] }

      assert.deepEqual(
        handlePopPendingEvent(state, { eventId: 'played' }).pendingEvents,
        ['blocked']
      )
    })

    it('removes only the first occurrence of a duplicated id', () => {
      const state = { ...baseState, pendingEvents: ['dup', 'other', 'dup'] }

      assert.deepEqual(
        handlePopPendingEvent(state, { eventId: 'dup' }).pendingEvents,
        ['other', 'dup']
      )
    })

    it('returns the same state for an id that is not queued', () => {
      const state = { ...baseState, pendingEvents: ['a'] }

      assert.equal(handlePopPendingEvent(state, { eventId: 'absent' }), state)
    })
  })

  describe('handleSetScreenshotMode', () => {
    it('enables and disables screenshot mode', () => {
      assert.equal(
        handleSetScreenshotMode(baseState, true).isScreenshotMode,
        true
      )
      assert.equal(
        handleSetScreenshotMode({ ...baseState, isScreenshotMode: true }, false)
          .isScreenshotMode,
        false
      )
    })

    it('coerces a hostile payload to a boolean', () => {
      // The reducer stays authoritative: the flag gates PreGig/PostGig event
      // rolls, so a truthy non-boolean must not leave it half-enabled.
      for (const hostile of ['yes', 1, {}, [], null, undefined]) {
        const next = handleSetScreenshotMode(baseState, hostile)
        assert.equal(
          next.isScreenshotMode,
          false,
          `payload ${JSON.stringify(hostile)} should not enable screenshot mode`
        )
      }
    })

    it('does not mutate the input state', () => {
      const next = handleSetScreenshotMode(baseState, true)
      assert.notEqual(next, baseState)
      assert.equal(baseState.isScreenshotMode, undefined)
    })
  })

  describe('handleSetActiveEvent', () => {
    it('should set the active event', () => {
      const payload = { title: 'Test Event', type: 'story' }
      const nextState = handleSetActiveEvent(baseState, payload)

      assert.deepStrictEqual(nextState.activeEvent, payload)
    })

    it('should clear the active event if payload is null', () => {
      baseState.activeEvent = { title: 'Old Event' }
      const nextState = handleSetActiveEvent(baseState, null)

      assert.strictEqual(nextState.activeEvent, null)
    })
  })

  describe('handleApplyEventDelta', () => {
    it('should apply simple deltas through applyEventDelta', () => {
      const payload = {
        band: { harmony: 10 },
        player: { money: -100 }
      }
      const nextState = handleApplyEventDelta(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 60)
      assert.strictEqual(nextState.player.money, 900)
    })

    it('should apply traits correctly if the delta triggers checkTraitUnlocks', () => {
      const payload = {
        band: { harmony: -5 }
      }
      const nextState = handleApplyEventDelta(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 45)
      // checkTraitUnlocks is mocked to return a tech_wizard trait for member m1,
      // and the real trait application logic should add that trait to Matze and emit at least one toast.
      const matze = nextState.band.members.find(m => m.name === 'Matze')
      assert.ok(
        matze,
        'Expected member "Matze" to exist in band after applying delta'
      )
      assert.ok(matze.traits['tech_wizard'])
      assert.ok(nextState.toasts.length > 0)
    })

    it('accumulates raw in-gig score effects for the rhythm HUD', () => {
      baseState.currentScene = 'GIG'
      baseState.gigEventScoreDelta = 0
      baseState.player.score = 0

      const increased = handleApplyEventDelta(baseState, {
        score: 150,
        player: {},
        band: {},
        social: {},
        flags: {}
      })
      const decreased = handleApplyEventDelta(increased, {
        score: -300,
        player: {},
        band: {},
        social: {},
        flags: {}
      })

      assert.strictEqual(increased.gigEventScoreDelta, 150)
      assert.strictEqual(decreased.gigEventScoreDelta, -150)
    })

    it('advances quest_payday from a positive event-delta money gain', () => {
      // Regression: money used to reach the player only through
      // `applyEventDelta`, while `economy.moneyEarned` was emitted at selected
      // post-gig call sites — so event income never scored the quest.
      const state = stateWithQuest({
        id: 'quest_payday',
        progress: 0,
        required: 1000
      })

      const next = handleApplyEventDelta(state, { player: { money: 250 } })

      assert.strictEqual(next.player.money, 1250)
      assert.strictEqual(questProgress(next, 'quest_payday'), 250)
    })

    it('does not advance quest_payday on a money loss', () => {
      const state = stateWithQuest({
        id: 'quest_payday',
        progress: 0,
        required: 1000
      })

      const next = handleApplyEventDelta(state, { player: { money: -250 } })

      assert.strictEqual(next.player.money, 750)
      assert.strictEqual(questProgress(next, 'quest_payday'), 0)
    })

    it('reports the post-clamp money gain, not the requested one', () => {
      // `clampPlayerMoney` floors, so a sub-unit gain is clamped away entirely.
      // Crediting the requested amount would let fractional events farm the quest.
      const state = stateWithQuest({
        id: 'quest_payday',
        progress: 0,
        required: 1000
      })

      const next = handleApplyEventDelta(state, { player: { money: 0.4 } })

      assert.strictEqual(next.player.money, 1000)
      assert.strictEqual(questProgress(next, 'quest_payday'), 0)
    })

    it('advances quest_local_legend from event fame in the stamped region', () => {
      const state = stateWithQuest(
        {
          id: 'quest_local_legend',
          scopeKey: 'magdeburg',
          progress: 0,
          required: 500,
          repeatPolicy: 'perRegion'
        },
        { location: 'venues:magdeburg_kellerclub.name' }
      )

      const next = handleApplyEventDelta(state, { player: { fame: 120 } })

      assert.strictEqual(next.player.fame, 220)
      assert.strictEqual(questProgress(next, 'quest_local_legend'), 120)
    })

    it('does not advance quest_local_legend from fame earned elsewhere', () => {
      const state = stateWithQuest(
        {
          id: 'quest_local_legend',
          scopeKey: 'magdeburg',
          progress: 0,
          required: 500,
          repeatPolicy: 'perRegion'
        },
        { location: 'venues:berlin_suff.name' }
      )

      const next = handleApplyEventDelta(state, { player: { fame: 120 } })

      assert.strictEqual(next.player.fame, 220)
      assert.strictEqual(questProgress(next, 'quest_local_legend'), 0)
    })

    it('credits fame to the region the event resolved in, not the destination', () => {
      // A delta that both awards fame and relocates the player must not credit
      // the town it is moving the band to.
      const state = stateWithQuest(
        {
          id: 'quest_local_legend',
          scopeKey: 'magdeburg',
          progress: 0,
          required: 500,
          repeatPolicy: 'perRegion'
        },
        { location: 'venues:magdeburg_kellerclub.name' }
      )

      const next = handleApplyEventDelta(state, {
        player: { fame: 120, location: 'venues:berlin_suff.name' }
      })

      assert.strictEqual(next.player.location, 'venues:berlin_suff.name')
      assert.strictEqual(questProgress(next, 'quest_local_legend'), 120)
    })

    it('does not advance economy quests when nothing was gained', () => {
      const state = stateWithQuest({
        id: 'quest_payday',
        progress: 0,
        required: 1000
      })

      const next = handleApplyEventDelta(state, { band: { harmony: 5 } })

      assert.strictEqual(questProgress(next, 'quest_payday'), 0)
    })

    it('keeps the cumulative in-gig score finite when addition overflows', () => {
      baseState.currentScene = 'GIG'
      baseState.gigEventScoreDelta = Number.MAX_VALUE

      const nextState = handleApplyEventDelta(baseState, {
        score: Number.MAX_VALUE,
        player: {},
        band: {},
        social: {},
        flags: {}
      })

      assert.strictEqual(nextState.gigEventScoreDelta, Number.MAX_VALUE)
      assert.equal(Number.isFinite(nextState.gigEventScoreDelta), true)
    })
  })
})
