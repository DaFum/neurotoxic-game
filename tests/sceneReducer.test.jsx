// TODO: Implement this
import { describe, it, expect, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../src/utils/logger.js', () => ({
  logger: { info: mocks.info, warn: mocks.warn }
}))

import { handleChangeScene } from '../src/context/reducers/sceneReducer'

describe('sceneReducer / handleChangeScene', () => {
  it('updates scene on valid transition payload', () => {
    const state = { currentScene: 'MENU', foo: 1 }
    const next = handleChangeScene(state, 'OVERWORLD')

    expect(next).toEqual({ currentScene: 'OVERWORLD', foo: 1 })
    expect(next).not.toBe(state)
    expect(mocks.info).toHaveBeenCalled()
  })

  it('ignores unknown scene payload and returns same state reference', () => {
    const state = { currentScene: 'MENU' }
    const next = handleChangeScene(state, 'UNKNOWN_SCENE')

    expect(next).toBe(state)
    expect(next.currentScene).toBe('MENU')
    expect(mocks.warn).toHaveBeenCalled()
  })
})
