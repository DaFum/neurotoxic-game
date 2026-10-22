import assert from 'node:assert/strict'
import { test, describe, mock } from 'node:test'

import {
  canProcessInput,
  processLaneInput,
  registerLaneInput,
  releaseAllLanes
} from '../../src/utils/rhythmGameInputUtils'

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

  describe('registerLaneInput', () => {
    const makeState = () => ({
      songTransitioning: false,
      isGameOver: false,
      hasSubmittedResults: false,
      lanes: [{ active: false }, { active: false }, { active: false }]
    })

    /** Feeds one input edge with the given gating context. */
    const edge = (ctx, laneIndex, isDown) =>
      registerLaneInput({
        laneIndex,
        isDown,
        state: ctx.state,
        activeEvent: ctx.activeEvent,
        transportState: ctx.transportState,
        getNow: () => ctx.now,
        lastInputTimes: ctx.lastInputTimes,
        handleHit: ctx.handleHit
      })

    const makeCtx = () => ({
      state: makeState(),
      activeEvent: null,
      transportState: 'started',
      now: 1000,
      lastInputTimes: [],
      handleHit: mock.fn()
    })

    const blockers = {
      'transport paused': ctx => {
        ctx.transportState = 'paused'
      },
      'event active': ctx => {
        ctx.activeEvent = { id: 'event' }
      },
      'song transition': ctx => {
        ctx.state.songTransitioning = true
      }
    }
    const unblock = ctx => {
      ctx.transportState = 'started'
      ctx.activeEvent = null
      ctx.state.songTransitioning = false
    }

    for (const [name, block] of Object.entries(blockers)) {
      test(`press -> ${name} -> release -> resume leaves lanes inactive with no extra hit`, () => {
        const ctx = makeCtx()
        edge(ctx, 0, true)
        edge(ctx, 2, true)
        assert.equal(ctx.handleHit.mock.callCount(), 2)

        block(ctx)
        ctx.now += 200
        edge(ctx, 0, false)
        edge(ctx, 2, false)
        unblock(ctx)
        ctx.now += 200

        assert.deepEqual(
          ctx.state.lanes.map(lane => lane.active),
          [false, false, false]
        )
        assert.equal(ctx.handleHit.mock.callCount(), 2)
      })

      test(`presses stay rejected while ${name}`, () => {
        const ctx = makeCtx()
        block(ctx)
        edge(ctx, 1, true)
        assert.equal(ctx.state.lanes[1].active, false)
        assert.equal(ctx.handleHit.mock.callCount(), 0)
      })
    }

    test('releases never score and ignore invalid lanes', () => {
      const ctx = makeCtx()
      ctx.state.lanes[1].active = true
      edge(ctx, 1, false)
      edge(ctx, -1, false)
      edge(ctx, 3, false)
      assert.equal(ctx.state.lanes[1].active, false)
      assert.equal(ctx.handleHit.mock.callCount(), 0)
    })
  })

  describe('releaseAllLanes', () => {
    test('clears every held lane visual', () => {
      const state = {
        lanes: [{ active: true }, { active: false }, { active: true }]
      }
      releaseAllLanes(state)
      assert.deepEqual(
        state.lanes.map(lane => lane.active),
        [false, false, false]
      )
    })
  })
})
