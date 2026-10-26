import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  handleMerchPress,
  handlePirateBroadcast
} from '../../src/context/reducers/socialReducer.ts'
import {
  handleBloodBankDonate,
  handleClinicHeal
} from '../../src/context/reducers/clinicReducer.ts'
import { GAME_CONSTANTS } from '../../src/context/gameConstants.ts'
import { createClinicHealAction } from '../../src/context/actionCreators.ts'
import { migrateLegacyQuestSchema } from '../../src/domain/questLegacyMigration.ts'

const buildState = ({ quest, player } = {}) => ({
  band: {
    harmony: 50,
    members: [
      { id: 'm1', stamina: 80, staminaMax: 100, mood: 50 },
      { id: 'm2', stamina: 80, staminaMax: 100, mood: 50 }
    ]
  },
  player: {
    day: 1,
    money: 1000,
    fame: 0,
    location: 'venues:berlin_suff.name',
    clinicVisits: 0,
    ...player
  },
  social: { loyalty: 0, controversyLevel: 0, zealotry: 0, activeDeals: [] },
  toasts: [],
  inventory: {},
  activeStoryFlags: [],
  activeQuests: quest ? [migrateLegacyQuestSchema(quest)] : [],
  completedQuestIds: [],
  questCooldowns: [],
  quests: {}
})

const progress = (state, id) =>
  state.activeQuests.find(q => q.id === id)?.progress ?? 0

const legend = scopeKey => ({
  id: 'quest_local_legend',
  scopeKey,
  progress: 0,
  required: 500,
  repeatPolicy: 'perRegion'
})

describe('handleMerchPress', () => {
  const payload = {
    cost: 100,
    harmonyCost: 5,
    loyaltyGain: 5,
    controversyGain: 5,
    fameGain: 100
  }

  it('rejects negative prices instead of treating them as free', () => {
    const state = buildState()
    for (const bad of [{ cost: -1 }, { harmonyCost: -1 }]) {
      assert.strictEqual(handleMerchPress(state, { ...payload, ...bad }), state)
    }
  })

  it('still accepts zero prices', () => {
    const next = handleMerchPress(buildState(), {
      ...payload,
      cost: 0,
      harmonyCost: 0
    })
    assert.strictEqual(next.player.fame, 100)
  })

  it('advances the regional fame quest for the current region', () => {
    const next = handleMerchPress(
      buildState({ quest: legend('berlin') }),
      payload
    )
    assert.strictEqual(progress(next, 'quest_local_legend'), 100)
  })

  it('does not advance a quest scoped to another region', () => {
    const next = handleMerchPress(
      buildState({ quest: legend('magdeburg') }),
      payload
    )
    assert.strictEqual(progress(next, 'quest_local_legend'), 0)
  })
})

describe('zealotry fame quest integration', () => {
  it('advances the regional fame quest and emits nothing on a replay', () => {
    const state = buildState({ quest: legend('berlin') })
    const payload = { cost: 200, fameGain: 150, harmonyCost: 0 }
    const first = handlePirateBroadcast(state, payload)
    assert.strictEqual(progress(first, 'quest_local_legend'), 150)

    const replay = handlePirateBroadcast(first, payload)
    assert.strictEqual(replay, first)
    assert.strictEqual(progress(replay, 'quest_local_legend'), 150)
  })
})

describe('handleBloodBankDonate quest integration', () => {
  const quest = { id: 'quest_payday', progress: 0, required: 1000 }
  const payload = { kind: 'blood' }
  // fameLevel 0: the blood donation pays its base amount.
  const payout = GAME_CONSTANTS.BLOOD_BANK.BLOOD_BASE_MONEY

  it('credits the money-earned quest with the applied gain', () => {
    const next = handleBloodBankDonate(buildState({ quest }), payload)
    assert.strictEqual(next.player.money, 1000 + payout)
    assert.strictEqual(progress(next, 'quest_payday'), payout)
  })

  it('emits nothing for a rejected donation', () => {
    const state = buildState({ quest })
    // Harmony that cannot pay the donation's cost.
    const poor = { ...state, band: { ...state.band, harmony: 1 } }
    const next = handleBloodBankDonate(poor, payload)
    assert.strictEqual(next, poor)
    assert.strictEqual(progress(next, 'quest_payday'), 0)
  })
})

describe('handleClinicHeal gains', () => {
  const heal = { memberId: 'm1', type: 'heal' }

  it('matches the creator by ignoring negative gains', () => {
    const state = buildState()
    const direct = handleClinicHeal(state, {
      ...heal,
      staminaGain: -20,
      moodGain: -20
    })
    const viaCreator = handleClinicHeal(
      state,
      createClinicHealAction({ ...heal, staminaGain: -20, moodGain: -20 })
        .payload
    )
    const member = next => next.band.members.find(m => m.id === 'm1')
    assert.strictEqual(member(direct).stamina, 80)
    assert.strictEqual(member(direct).mood, 50)
    assert.deepEqual(direct.player.money, viaCreator.player.money)
    assert.deepEqual(member(direct), member(viaCreator))
  })
})
