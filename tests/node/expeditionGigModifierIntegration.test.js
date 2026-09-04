/**
 * @fileoverview Production wiring of the committed Expedition gear profile.
 *
 * The design pillar is "management creates the situation, skill determines the
 * outcome", which only holds if the committed build actually reaches active
 * gameplay. `useRhythmGameLogic` is the real production path that hands
 * `performance` to the scoring hook, so this suite captures that exact argument
 * rather than re-deriving the modifier in the test.
 */

import { test, describe, before, after, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'
import { createInitialState } from '../../src/context/initialState.ts'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults.ts'

// The sub-hook stubs below must keep their `use` prefix: they replace the
// real hook module exports, and the subject imports them by name.
/* eslint-disable @eslint-react/no-unnecessary-use-prefix */

const GUITAR = 'hq_inst_guitar_custom' // guitarDifficulty -0.15
const DRUM_TRIGGER = 'hq_inst_drum_trigger' // drumMultiplier +0.20

let currentState = null
const capturedPerformance = []

const mockUseGameActions = () => ({
  setLastGigStats: () => {},
  addToast: () => {},
  endGig: () => {},
  triggerEvent: () => false
})
const mockGameSelector = selector => selector(currentState)

const gameStateRef = { current: { score: 0 } }

mock.module(new URL('../../src/context/GameState.tsx', import.meta.url).href, {
  namedExports: {
    useGameActions: mockUseGameActions,
    useGameSelector: mockGameSelector
  }
})
mock.module(
  new URL('../../src/context/AudioEngineContext.tsx', import.meta.url).href,
  {
    namedExports: {
      useAudioEngine: () => ({ stopAudio: () => {}, getGigTimeMs: () => 0 })
    }
  }
)
mock.module(
  new URL('../../node_modules/react-i18next/dist/es/index.js', import.meta.url)
    .href,
  {
    namedExports: {
      useTranslation: () => ({ t: key => key }),
      initReactI18next: { type: '3rdParty', init: () => {} }
    }
  }
)
mock.module(
  new URL('../../src/hooks/rhythmGame/useRhythmGameState.ts', import.meta.url)
    .href,
  {
    namedExports: {
      useRhythmGameState: () => ({
        gameStateRef,
        state: {},
        setters: { setScore: () => {} }
      })
    }
  }
)
mock.module(
  new URL('../../src/hooks/rhythmGame/useRhythmGameScoring.ts', import.meta.url)
    .href,
  {
    namedExports: {
      useRhythmGameScoring: ({ performance }) => {
        capturedPerformance.push(performance)
        return { activateToxicMode: () => {} }
      }
    }
  }
)
mock.module(
  new URL('../../src/hooks/rhythmGame/useRhythmGameAudio.ts', import.meta.url)
    .href,
  {
    namedExports: {
      useRhythmGameAudio: () => ({ retryAudioInitialization: async () => {} })
    }
  }
)
mock.module(
  new URL('../../src/hooks/rhythmGame/useRhythmGameLoop.ts', import.meta.url)
    .href,
  { namedExports: { useRhythmGameLoop: () => ({ update: () => {} }) } }
)
mock.module(
  new URL('../../src/hooks/rhythmGame/useRhythmGameInput.ts', import.meta.url)
    .href,
  { namedExports: { useRhythmGameInput: () => ({ registerInput: () => {} }) } }
)

let useRhythmGameLogic

const buildState = ({ owned = [], selected = null }) => {
  const state = createInitialState()
  state.player.van.upgrades = [...owned]
  state.band.performance = { ...state.band.performance }
  // Mirror what an HQ purchase permanently bakes into `band.performance`.
  if (owned.includes(GUITAR)) state.band.performance.guitarDifficulty -= 0.15
  if (owned.includes(DRUM_TRIGGER)) state.band.performance.drumMultiplier += 0.2

  state.expedition =
    selected === null
      ? createDefaultExpeditionState()
      : {
          ...createDefaultExpeditionState(),
          status: 'active',
          runId: 'run_1',
          loadout: {
            tourTypeId: 'standard_tour',
            regionId: 'industrial_belt',
            activeTourbusAssetId: null,
            crewIds: [],
            cargo: { spareParts: 0, supplies: 0 },
            starterPerkId: null,
            nativeContracts: [],
            insurancePolicyId: null,
            pressureModifierIds: [],
            build: {
              setlistSongIds: [],
              equipment: { selectedGearItemIds: selected },
              selectedTourbusModuleIds: [],
              merch: [],
              contraband: [],
              sponsorOfferId: null,
              startingFuelTarget: 100,
              protectedCareerCash: 0
            }
          }
        }

  return {
    ...state,
    setLastGigStats: () => {},
    addToast: () => {},
    endGig: () => {},
    triggerEvent: () => false
  }
}

const renderWith = stateOverrides => {
  currentState = buildState(stateOverrides)
  capturedPerformance.length = 0
  renderHook(() => useRhythmGameLogic())
  const performance = capturedPerformance[capturedPerformance.length - 1]
  assert.ok(performance, 'the scoring hook never received a performance object')
  return performance
}

describe('committed Expedition gear reaches the real gig modifier path', () => {
  before(async () => {
    setupJSDOM()
    ;({ useRhythmGameLogic } =
      await import('../../src/hooks/useRhythmGameLogic.ts'))
  })

  after(() => {
    cleanup()
    teardownJSDOM()
  })

  beforeEach(() => {
    cleanup()
  })

  test('non-Expedition gameplay keeps the existing global purchase behavior', () => {
    const performance = renderWith({
      owned: [GUITAR, DRUM_TRIGGER],
      selected: null
    })
    // Career play: both purchases are live, exactly as before the Expedition.
    assert.ok(Math.abs(performance.guitarDifficulty - 0.85) < 1e-9)
    assert.ok(Math.abs(performance.drumMultiplier - 1.2) < 1e-9)
  })

  test('a purchased but unselected item stops affecting the active run', () => {
    const performance = renderWith({
      owned: [GUITAR, DRUM_TRIGGER],
      selected: [GUITAR]
    })
    assert.ok(
      Math.abs(performance.guitarDifficulty - 0.85) < 1e-9,
      'the committed guitar must still contribute'
    )
    assert.ok(
      Math.abs(performance.drumMultiplier - 1) < 1e-9,
      'the uncommitted drum trigger must be neutralized'
    )
  })

  test('selecting gear changes the modifier the scoring path receives', () => {
    const withGuitar = renderWith({
      owned: [GUITAR, DRUM_TRIGGER],
      selected: [GUITAR]
    })
    const withDrums = renderWith({
      owned: [GUITAR, DRUM_TRIGGER],
      selected: [DRUM_TRIGGER]
    })
    assert.notEqual(withGuitar.guitarDifficulty, withDrums.guitarDifficulty)
    assert.notEqual(withGuitar.drumMultiplier, withDrums.drumMultiplier)
    assert.ok(Math.abs(withDrums.guitarDifficulty - 1) < 1e-9)
    assert.ok(Math.abs(withDrums.drumMultiplier - 1.2) < 1e-9)
  })

  test('an empty selection neutralizes every owned catalog contribution', () => {
    const performance = renderWith({
      owned: [GUITAR, DRUM_TRIGGER],
      selected: []
    })
    assert.ok(Math.abs(performance.guitarDifficulty - 1) < 1e-9)
    assert.ok(Math.abs(performance.drumMultiplier - 1) < 1e-9)
  })

  test('unrelated performance inputs survive the Expedition adjustment', () => {
    currentState = buildState({ owned: [GUITAR], selected: [GUITAR] })
    currentState.band.crit = 0.25
    currentState.band.crowdControl = 0.4
    currentState.band.tempo = 0.1
    capturedPerformance.length = 0
    renderHook(() => useRhythmGameLogic())
    const performance = capturedPerformance[capturedPerformance.length - 1]
    assert.equal(performance.critChance, 0.25)
    assert.equal(performance.crowdControl, 0.4)
    assert.equal(performance.tempo, 0.1)
  })
})
