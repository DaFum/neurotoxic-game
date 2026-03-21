import test from 'node:test'
import assert from 'node:assert'
import PropTypes from 'prop-types'
import {
  AudioStatePropType,
  OnAudioChangePropType
} from '../src/ui/shared/propTypes.js'

test('propTypes', async t => {
  await t.test('AudioStatePropType defines shape correctly', () => {
    assert.strictEqual(typeof AudioStatePropType, 'function')

    const validProps = {
      audio: {
        musicVol: 0.5,
        sfxVol: 0.8,
        isMuted: false
      }
    }

    let errorCalled = false
    const originalConsoleError = console.error
    try {
      console.error = () => {
        errorCalled = true
      }

      PropTypes.resetWarningCache()
      PropTypes.checkPropTypes(
        { audio: AudioStatePropType },
        validProps,
        'prop',
        'TestComponent'
      )
      assert.strictEqual(errorCalled, false)

      const invalidProps = {
        audio: {
          musicVol: 'loud',
          sfxVol: 0.8,
          isMuted: false
        }
      }

      PropTypes.resetWarningCache()
      PropTypes.checkPropTypes(
        { audio: AudioStatePropType },
        invalidProps,
        'prop',
        'TestComponent'
      )
      assert.strictEqual(errorCalled, true)
    } finally {
      console.error = originalConsoleError
    }
  })

  await t.test('OnAudioChangePropType defines shape correctly', () => {
    assert.strictEqual(typeof OnAudioChangePropType, 'function')

    const validProps = {
      handlers: {
        setMusic: () => {},
        setSfx: () => {},
        toggleMute: () => {}
      }
    }

    let errorCalled = false
    const originalConsoleError = console.error
    try {
      console.error = () => {
        errorCalled = true
      }

      PropTypes.resetWarningCache()
      PropTypes.checkPropTypes(
        { handlers: OnAudioChangePropType },
        validProps,
        'prop',
        'TestComponent'
      )
      assert.strictEqual(errorCalled, false)

      const invalidProps = {
        handlers: {
          setMusic: 'not a function',
          setSfx: () => {},
          toggleMute: () => {}
        }
      }

      PropTypes.resetWarningCache()
      PropTypes.checkPropTypes(
        { handlers: OnAudioChangePropType },
        invalidProps,
        'prop',
        'TestComponent'
      )
      assert.strictEqual(errorCalled, true)
    } finally {
      console.error = originalConsoleError
    }
  })
})
