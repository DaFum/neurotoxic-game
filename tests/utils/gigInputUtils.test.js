import { test, describe, vi } from "vitest"
import assert from 'node:assert/strict'
import {
  createKeyToLaneMap,
  handleKeyDownLogic,
  handleKeyUpLogic
} from '../../src/utils/gigInputUtils.js'

describe('gigInputUtils', () => {
  describe('createKeyToLaneMap', () => {
    test('returns an empty map when currentLanes is null or undefined', () => {
      assert.equal(createKeyToLaneMap(null).size, 0)
      assert.equal(createKeyToLaneMap(undefined).size, 0)
    })

    test('creates a map of keys to lane indices', () => {
      const lanes = [{ key: 'a' }, { key: 's' }, { id: 'no-key' }, { key: 'd' }]
      const map = createKeyToLaneMap(lanes)

      assert.equal(map.size, 3)
      assert.equal(map.get('a'), 0)
      assert.equal(map.get('s'), 1)
      assert.equal(map.get('d'), 3)
      assert.equal(map.get('no-key'), undefined)
    })
  })

  describe('handleKeyDownLogic', () => {
    test('ignores repeated events', () => {
      const e = { repeat: true, key: 'a' }
      const ensureAudioFromGesture = vi.fn()
      const actions = { registerInput: vi.fn() }

      handleKeyDownLogic({
        e,
        getLaneIndex: () => 0,
        actions,
        triggerBandAnimation: vi.fn(),
        onTogglePause: vi.fn(),
        ensureAudioFromGesture
      })

      assert.equal(ensureAudioFromGesture.mock.calls.length, 0)
      assert.equal(actions.registerInput.mock.calls.length, 0)
    })

    test('calls ensureAudioFromGesture and handles Escape', () => {
      const e = { repeat: false, key: 'Escape' }
      const ensureAudioFromGesture = vi.fn()
      const onTogglePause = vi.fn()
      const actions = { registerInput: vi.fn() }

      handleKeyDownLogic({
        e,
        getLaneIndex: () => undefined,
        actions,
        triggerBandAnimation: vi.fn(),
        onTogglePause,
        ensureAudioFromGesture
      })

      assert.equal(ensureAudioFromGesture.mock.calls.length, 1)
      assert.equal(onTogglePause.mock.calls.length, 1)
      assert.equal(actions.registerInput.mock.calls.length, 0)
    })

    test('registers input and triggers animation for valid lane', () => {
      const e = { repeat: false, key: 's' }
      const ensureAudioFromGesture = vi.fn()
      const getLaneIndex = vi.fn(key => (key === 's' ? 1 : undefined))
      const actions = { registerInput: vi.fn() }
      const triggerBandAnimation = vi.fn()
      const onTogglePause = vi.fn()

      handleKeyDownLogic({
        e,
        getLaneIndex,
        actions,
        triggerBandAnimation,
        onTogglePause,
        ensureAudioFromGesture
      })

      assert.equal(ensureAudioFromGesture.mock.calls.length, 1)
      assert.equal(onTogglePause.mock.calls.length, 0)

      assert.equal(actions.registerInput.mock.calls.length, 1)
      assert.deepEqual(actions.registerInput.mock.calls[0], [1, true])

      assert.equal(triggerBandAnimation.mock.calls.length, 1)
      assert.deepEqual(triggerBandAnimation.mock.calls[0], [1])
    })
  })

  describe('handleKeyUpLogic', () => {
    test('registers false input for valid lane', () => {
      const e = { key: 'd' }
      const getLaneIndex = vi.fn(key => (key === 'd' ? 2 : undefined))
      const actions = { registerInput: vi.fn() }

      handleKeyUpLogic({
        e,
        getLaneIndex,
        actions
      })

      assert.equal(actions.registerInput.mock.calls.length, 1)
      assert.deepEqual(actions.registerInput.mock.calls[0], [
        2,
        false
      ])
    })

    test('does nothing for invalid lane', () => {
      const e = { key: 'unknown' }
      const getLaneIndex = vi.fn(() => undefined)
      const actions = { registerInput: vi.fn() }

      handleKeyUpLogic({
        e,
        getLaneIndex,
        actions
      })

      assert.equal(actions.registerInput.mock.calls.length, 0)
    })
  })
})
