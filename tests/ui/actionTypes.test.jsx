import { describe, it, expect } from 'vitest'
import { ActionTypes } from '../../src/context/actionTypes'

describe('ActionTypes', () => {
  it('contains expected action strings', () => {
    const expectedTypes = [
      'CHANGE_SCENE',
      'UPDATE_PLAYER',
      'UPDATE_BAND',
      'TOGGLE_NEURO_DECIMATOR',
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
      'SPAWN_RIVAL_BAND',
      'MOVE_RIVAL_BAND',
      'UPDATE_RIVAL_BAND',
      'CHECK_RIVAL_ENCOUNTER',
      'UNLOCK_TRAIT',
      'ADD_VENUE_BLACKLIST',
      'ADD_QUEST',
      'ADVANCE_QUEST',
      'ADD_UNLOCK',
      'USE_CONTRABAND',
      'CLINIC_HEAL',
      'CLINIC_ENHANCE',
      'PIRATE_BROADCAST',
      'MERCH_PRESS',
      'TRADE_VOID_ITEM',
      'BLOOD_BANK_DONATE',
      'DARK_WEB_LEAK',
      'SET_PENDING_BANDHQ_OPEN',
      'SET_PENDING_SUPPLY_STOP_INVENTORY',
      'PURCHASE_CHASSIS',
      'PURCHASE_CHASSIS_FAILED',
      'UPGRADE_CHASSIS_TIER',
      'SELL_CHASSIS',
      'SELL_CHASSIS_FAILED',
      'REPAIR_CHASSIS',
      'INSTALL_MODULE',
      'INSTALL_MODULE_FAILED',
      'REMOVE_MODULE',
      'START_CROWDFUND',
      'ASSET_FORECLOSED'
    ]

    expectedTypes.forEach(type => {
      expect(ActionTypes[type]).toBe(type)
    })

    // Also check that there are no extra unexpected types
    expect(Object.keys(ActionTypes).length).toBe(expectedTypes.length)
  })
})
