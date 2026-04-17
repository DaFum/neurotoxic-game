import { describe, it, expect } from 'vitest'
import { ActionTypes } from '../../src/context/actionTypes'

describe('ActionTypes', () => {
  it('contains expected action strings', () => {
    const expectedTypes = [
      'CHANGE_SCENE',
      'UPDATE_PLAYER',
      'UPDATE_BAND',
      'UPDATE_SOCIAL',
      'UPDATE_SETTINGS',
      'SET_MAP',
      'SET_GIG',
      'START_GIG',
      'SET_SETLIST',
      'SET_LAST_GIG_STATS',
      'SET_ACTIVE_EVENT',
      'ADD_TOAST',
      'REMOVE_TOAST',
      'SET_GIG_MODIFIERS',
      'LOAD_GAME',
      'RESET_STATE',
      'APPLY_EVENT_DELTA',
      'POP_PENDING_EVENT',
      'CONSUME_ITEM',
      'ADVANCE_DAY',
      'ADD_COOLDOWN',
      'START_TRAVEL_MINIGAME',
      'COMPLETE_TRAVEL_MINIGAME',
      'START_ROADIE_MINIGAME',
      'COMPLETE_ROADIE_MINIGAME',
      'START_KABELSALAT_MINIGAME',
      'COMPLETE_KABELSALAT_MINIGAME',
      'START_AMP_CALIBRATION',
      'COMPLETE_AMP_CALIBRATION',
      'UNLOCK_TRAIT',
      'ADD_VENUE_BLACKLIST',
      'ADD_QUEST',
      'ADVANCE_QUEST',
      'COMPLETE_QUEST',
      'FAIL_QUESTS',
      'ADD_UNLOCK',
      'ADD_CONTRABAND',
      'USE_CONTRABAND',
      'CLINIC_HEAL',
      'CLINIC_ENHANCE',
      'PIRATE_BROADCAST',
      'MERCH_PRESS',
      'TRADE_VOID_ITEM',
      'BLOOD_BANK_DONATE'
    ]

    expectedTypes.forEach(type => {
      expect(ActionTypes[type]).toBe(type)
    })

    // Also check that there are no extra unexpected types
    expect(Object.keys(ActionTypes).length).toBe(expectedTypes.length)
  })
})
