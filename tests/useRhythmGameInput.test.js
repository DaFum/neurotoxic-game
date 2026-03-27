import assert from 'node:assert'
import { test, describe, mock } from 'node:test'

import {
  canProcessInput,
  processLaneInput
} from '../src/utils/rhythmGameInputUtils.js'

describe('useRhythmGameInput Utils', () => {
  describe('canProcessInput', () => {
    test('should return false if there is an active event', () => {
      const state = {
        songTransitioning: false,
        isGameOver: false,
        hasSubmittedResults: false
      }
      assert.strictEqual(canProcessInput(state, {}, 'started'), false)
    })

    test('should return false if song is transitioning', () => {
      const state = {
        songTransitioning: true,
        isGameOver: false,
        hasSubmittedResults: false
      }
      assert.strictEqual(canProcessInput(state, null, 'started'), false)
    })

    test('should return false if game is over', () => {
      const state = {
        songTransitioning: false,
        isGameOver: true,
        hasSubmittedResults: false
      }
      assert.strictEqual(canProcessInput(state, null, 'started'), false)
    })

    test('should return false if results are submitted', () => {
      const state = {
        songTransitioning: false,
        isGameOver: false,
        hasSubmittedResults: true
      }
      assert.strictEqual(canProcessInput(state, null, 'started'), false)
    })

    test('should return false if transport is not started', () => {
      const state = {
        songTransitioning: false,
        isGameOver: false,
        hasSubmittedResults: false
      }
      assert.strictEqual(canProcessInput(state, null, 'stopped'), false)
    })

    test('should return true if no active event, game is active, and transport is started', () => {
      const state = {
        songTransitioning: false,
        isGameOver: false,
        hasSubmittedResults: false
      }
      assert.strictEqual(canProcessInput(state, null, 'started'), true)
    })
  })

  describe('processLaneInput', () => {
    test('should not process input if laneIndex is out of bounds', () => {
      const state = { lanes: [{ active: false }, { active: false }] }
      const handleHit = mock.fn()
      const lastInputTimes = {}

      processLaneInput({
        laneIndex: -1,
        isDown: true,
        now: 1000,
        state,
        lastInputTimes,
        handleHit
      })
      assert.strictEqual(handleHit.mock.callCount(), 0)

      processLaneInput({
        laneIndex: 2,
        isDown: true,
        now: 1000,
        state,
        lastInputTimes,
        handleHit
      })
      assert.strictEqual(handleHit.mock.callCount(), 0)
    })

    test('should toggle lane active state', () => {
      const state = { lanes: [{ active: false }, { active: false }] }
      const handleHit = mock.fn()
      const lastInputTimes = {}

      processLaneInput({
        laneIndex: 0,
        isDown: true,
        now: 1000,
        state,
        lastInputTimes,
        handleHit
      })

      assert.strictEqual(state.lanes[0].active, true)

      processLaneInput({
        laneIndex: 0,
        isDown: false,
        now: 1050,
        state,
        lastInputTimes,
        handleHit
      })

      assert.strictEqual(state.lanes[0].active, false)
    })

    test('should call handleHit if isDown is true and debounce time has passed', () => {
      const state = { lanes: [{ active: false }, { active: false }] }
      const handleHit = mock.fn()
      const lastInputTimes = { 1: 1000 }

      processLaneInput({
        laneIndex: 1,
        isDown: true,
        now: 1050, // exactly 50ms later
        state,
        lastInputTimes,
        handleHit
      })

      assert.strictEqual(handleHit.mock.callCount(), 1)
      assert.deepStrictEqual(handleHit.mock.calls[0].arguments, [1])
      assert.strictEqual(lastInputTimes[1], 1050)
    })

    test('should not call handleHit if isDown is true but debounce time has not passed', () => {
      const state = { lanes: [{ active: false }, { active: false }] }
      const handleHit = mock.fn()
      const lastInputTimes = { 1: 1000 }

      processLaneInput({
        laneIndex: 1,
        isDown: true,
        now: 1049, // 49ms later
        state,
        lastInputTimes,
        handleHit
      })

      assert.strictEqual(handleHit.mock.callCount(), 0)
      assert.strictEqual(lastInputTimes[1], 1000)
    })

    test('should not call handleHit if isDown is false', () => {
      const state = { lanes: [{ active: false }, { active: false }] }
      const handleHit = mock.fn()
      const lastInputTimes = { 1: 1000 }

      processLaneInput({
        laneIndex: 1,
        isDown: false,
        now: 1050,
        state,
        lastInputTimes,
        handleHit
      })

      assert.strictEqual(handleHit.mock.callCount(), 0)
    })
  })
})
