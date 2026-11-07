// The shared localStorage/AudioContext mocks from tests/vitest.setup.js must
// survive a suite's own vi.unstubAllGlobals(), which restores only the
// globals that suite stubbed (issue #3595).
import { describe, expect, it, vi } from 'vitest'

const baseline = {
  localStorage: globalThis.localStorage,
  AudioContext: globalThis.AudioContext,
  webkitAudioContext: globalThis.webkitAudioContext
}

const expectBaseline = () => {
  for (const [name, value] of Object.entries(baseline)) {
    expect(globalThis[name], name).toBe(value)
    expect(window[name], name).toBe(value)
  }
}

describe('shared setup global mocks', () => {
  it('are restored after a suite unstubs its own globals', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'suite' })
    vi.stubGlobal('ResizeObserver', undefined)
    vi.unstubAllGlobals()
    expectBaseline()
  })

  it('still work in a later test', () => {
    expectBaseline()
    expect(typeof globalThis.AudioContext).toBe('function')
    localStorage.setItem('k', 'v')
    expect(localStorage.getItem('k')).toBe('v')
    localStorage.clear()
    expect(localStorage.getItem('k')).toBeNull()
  })
})
