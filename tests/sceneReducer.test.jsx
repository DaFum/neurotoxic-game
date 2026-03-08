import { describe, it, expect, vi } from 'vitest'
import { handleChangeScene } from '../src/context/reducers/sceneReducer'

vi.mock('../src/utils/logger.js', () => ({
  logger: { info: vi.fn() }
}))

describe('sceneReducer / handleChangeScene', () => {
  it('updates scene on valid transition payload', () => {
    const state = { currentScene: 'MENU', foo: 1 }
    const next = handleChangeScene(state, 'OVERWORLD')

    expect(next).toEqual({ currentScene: 'OVERWORLD', foo: 1 })
    expect(next).not.toBe(state)
  })

  it('accepts unknown payload values and still returns updated state object', () => {
    const state = { currentScene: 'MENU' }
    const next = handleChangeScene(state, 'UNKNOWN_SCENE')

    expect(next.currentScene).toBe('UNKNOWN_SCENE')
    expect(next).not.toBe(state)
  })
})
