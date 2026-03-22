import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { GAME_PHASES, CLINIC_CONFIG } from '../src/context/gameConstants.js'

// Mock context to prevent errors during render
const mockChangeScene = mock.fn()
const mockAddToast = mock.fn()
const mockClinicHeal = mock.fn()
const mockClinicEnhance = mock.fn()

let mockGameState = {
  player: { money: 1000, fame: 1000, clinicVisits: 0 },
  band: {
    members: [
      { id: 'm1', name: 'M1', stamina: 50, mood: 50, traits: [] },
      {
        id: 'm2',
        name: 'M2',
        stamina: 100,
        mood: 100,
        traits: { cyber_lungs: { id: 'cyber_lungs' } }
      }
    ]
  },
  changeScene: mockChangeScene,
  addToast: mockAddToast,
  clinicHeal: mockClinicHeal,
  clinicEnhance: mockClinicEnhance
}

const mockUseGameState = mock.fn(() => mockGameState)

mock.module('../src/context/GameState.jsx', {
  namedExports: {
    useGameState: mockUseGameState
  }
})

mock.module('react-i18next', {
  namedExports: {
    useTranslation: mock.fn(() => ({
      t: (key, options) => options?.defaultValue || key
    })),
    initReactI18next: { type: '3rdParty', init: () => {} }
  }
})

describe('useClinicLogic', () => {
  let useClinicLogic

  beforeEach(async () => {
    setupJSDOM()

    // Reset mocks
    mockUseGameState.mock.resetCalls()
    mockChangeScene.mock.resetCalls()
    mockAddToast.mock.resetCalls()
    mockClinicHeal.mock.resetCalls()
    mockClinicEnhance.mock.resetCalls()

    mockGameState = {
      player: { money: 1000, fame: 1000, clinicVisits: 0 },
      band: {
        members: [
          { id: 'm1', name: 'M1', stamina: 50, mood: 50, traits: [] },
          {
            id: 'm2',
            name: 'M2',
            stamina: 100,
            mood: 100,
            traits: { cyber_lungs: { id: 'cyber_lungs' } }
          }
        ]
      },
      changeScene: mockChangeScene,
      addToast: mockAddToast,
      clinicHeal: mockClinicHeal,
      clinicEnhance: mockClinicEnhance
    }

    // Polyfill crypto for UUID generation in tests
    if (!globalThis.crypto) {
      globalThis.crypto = {
        randomUUID: () => 'test-uuid-1234'
      }
    }

    // Dynamic import to ensure mocks are applied
    const module = await import('../src/hooks/useClinicLogic.js')
    useClinicLogic = module.useClinicLogic
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('initializes with correct costs', () => {
    const { result } = renderHook(() => useClinicLogic())

    assert.equal(
      result.current.healCostMoney,
      CLINIC_CONFIG.HEAL_BASE_COST_MONEY
    )
    assert.equal(
      result.current.enhanceCostFame,
      CLINIC_CONFIG.ENHANCE_BASE_COST_FAME
    )
  })

  test('healMember successful', () => {
    const { result } = renderHook(() => useClinicLogic())

    act(() => {
      result.current.healMember('m1')
    })

    assert.equal(mockClinicHeal.mock.calls.length, 1)
    const callArgs = mockClinicHeal.mock.calls[0].arguments[0]
    assert.equal(callArgs.memberId, 'm1')
    assert.equal(callArgs.type, 'heal')
    assert.equal(callArgs.staminaGain, CLINIC_CONFIG.HEAL_STAMINA_GAIN)
    assert.equal(callArgs.moodGain, CLINIC_CONFIG.HEAL_MOOD_GAIN)
    assert.ok(callArgs.successToast)
  })

  test('healMember not enough money', () => {
    mockGameState = {
      ...mockGameState,
      player: { ...mockGameState.player, money: 0 }
    }

    const { result } = renderHook(() => useClinicLogic())

    act(() => {
      result.current.healMember('m1')
    })

    assert.equal(mockClinicHeal.mock.calls.length, 0)
    assert.equal(mockAddToast.mock.calls.length, 1)
    assert.equal(mockAddToast.mock.calls[0].arguments[0], 'Not enough money.')
    assert.equal(mockAddToast.mock.calls[0].arguments[1], 'error')
  })

  test('enhanceMember successful', () => {
    const { result } = renderHook(() => useClinicLogic())

    act(() => {
      result.current.enhanceMember('m1', 'cyber_lungs')
    })

    assert.equal(mockClinicEnhance.mock.calls.length, 1)
    const callArgs = mockClinicEnhance.mock.calls[0].arguments[0]
    assert.equal(callArgs.memberId, 'm1')
    assert.equal(callArgs.type, 'enhance')
    assert.equal(callArgs.trait, 'cyber_lungs')
    assert.ok(callArgs.successToast)
  })

  test('enhanceMember not enough fame', () => {
    mockGameState = {
      ...mockGameState,
      player: { ...mockGameState.player, fame: 0 }
    }

    const { result } = renderHook(() => useClinicLogic())

    act(() => {
      result.current.enhanceMember('m1', 'cyber_lungs')
    })

    assert.equal(mockClinicEnhance.mock.calls.length, 0)
    assert.equal(mockAddToast.mock.calls.length, 1)
    assert.equal(
      mockAddToast.mock.calls[0].arguments[0],
      'Not enough fame. The void demands sacrifice.'
    )
    assert.equal(mockAddToast.mock.calls[0].arguments[1], 'error')
  })

  test('enhanceMember already has trait', () => {
    const { result } = renderHook(() => useClinicLogic())

    act(() => {
      result.current.enhanceMember('m2', 'cyber_lungs')
    })

    assert.equal(mockClinicEnhance.mock.calls.length, 0)
    assert.equal(mockAddToast.mock.calls.length, 0)
  })

  test('leaveClinic calls changeScene', () => {
    const { result } = renderHook(() => useClinicLogic())

    act(() => {
      result.current.leaveClinic()
    })

    assert.equal(mockChangeScene.mock.calls.length, 1)
    assert.equal(
      mockChangeScene.mock.calls[0].arguments[0],
      GAME_PHASES.OVERWORLD
    )
  })

  test('does nothing for invalid memberId', () => {
    const { result } = renderHook(() => useClinicLogic())

    act(() => {
      result.current.healMember('invalid')
      result.current.enhanceMember('invalid', 'cyber_lungs')
    })

    assert.equal(mockClinicHeal.mock.calls.length, 0)
    assert.equal(mockClinicEnhance.mock.calls.length, 0)
  })
})
