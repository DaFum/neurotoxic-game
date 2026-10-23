import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('devTestHooks', () => {
  beforeEach(() => {
    delete window.neurotoxicTestHooks
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete window.neurotoxicTestHooks
  })

  it('registers a hook on window in DEV and removes it on cleanup', async () => {
    const { registerTestHook } = await import('../../src/utils/devTestHooks')
    const api = { getSnapshot: () => ({ laneActive: [] }) }

    const cleanup = registerTestHook('rhythm', api)
    expect(window.neurotoxicTestHooks?.rhythm).toBe(api)

    cleanup()
    expect(window.neurotoxicTestHooks?.rhythm).toBeUndefined()
  })

  it('removes a registration only while the stored api is the supplied one', async () => {
    const { registerTestHook } = await import('../../src/utils/devTestHooks')
    const first = { enableManualFrames: () => {}, stepFrame: () => {} }
    const second = { enableManualFrames: () => {}, stepFrame: () => {} }

    const cleanupFirst = registerTestHook('tourbusFrames', first)
    const cleanupSecond = registerTestHook('tourbusFrames', second)

    // A late cleanup of the replaced registration must not take the new one.
    cleanupFirst()
    expect(window.neurotoxicTestHooks?.tourbusFrames).toBe(second)

    cleanupSecond()
    expect(window.neurotoxicTestHooks?.tourbusFrames).toBeUndefined()
  })

  it('keeps independent hooks apart', async () => {
    const { registerTestHook } = await import('../../src/utils/devTestHooks')
    const rhythm = { getSnapshot: () => ({}) }
    const tourbus = { setFixture: () => {}, getSnapshot: () => ({}) }

    const cleanupRhythm = registerTestHook('rhythm', rhythm)
    registerTestHook('tourbus', tourbus)
    cleanupRhythm()

    expect(window.neurotoxicTestHooks?.rhythm).toBeUndefined()
    expect(window.neurotoxicTestHooks?.tourbus).toBe(tourbus)
  })
})
