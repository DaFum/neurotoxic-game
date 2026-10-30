import { createMotionReactMock } from '../mocks/motionMock'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

// Mock dependencies before import
const changeSceneMock = vi.fn()
const loadGameMock = vi.fn()
const addToastMock = vi.fn()
const resetStateMock = vi.fn()

const mockGameState = {
  changeScene: changeSceneMock,
  loadGame: loadGameMock,
  addToast: addToastMock,
  resetState: resetStateMock
}

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => mockGameState,
  useGameSelector: selector => selector(mockGameState),
  useGameSelectorOptional: selector => selector(mockGameState)
}))
const openHQMock = vi.fn()
vi.mock('../../src/hooks/useBandHQModal', () => ({
  useBandHQModal: () => ({
    showHQ: false,
    openHQ: openHQMock,
    closeHQ: vi.fn()
  })
}))
const glitchButtonRender = vi.fn(({ children, onClick }) => {
  return (
    <button type='button' onClick={onClick}>
      {children}
    </button>
  )
})

vi.mock('../../src/ui/GlitchButton', () => ({
  GlitchButton: glitchButtonRender
}))
vi.mock('../../src/ui/BandHQ', () => ({
  BandHQ: () => <div />
}))
vi.mock('motion/react', () => createMotionReactMock())
vi.mock('../../src/utils/imageGen', () => ({
  isImageGenerationAvailable: () => true,
  resolveGenImageUrl: () => 'mock-url',
  getGeneratedImageFallbackUrl: () => 'mock-fallback',
  getGenImageUrl: () => '',
  IMG_PROMPTS: {}
}))
vi.mock('../../src/utils/audio/AudioManager', () => ({
  audioManager: {
    startAmbient: async () => {},
    ensureAudioContext: async () => {}
  }
}))
vi.mock('../../src/utils/errorHandler', async () => {
  const { createStorageErrorMock } =
    await import('../mocks/storageErrorMock.js')
  return createStorageErrorMock()
})
// Dynamic import
const { MainMenu } = await import('../../src/scenes/MainMenu.tsx')

describe('MainMenu Performance Stability', () => {
  // // setupJSDOM removed removed
  afterEach(() => {
    vi.clearAllMocks()
    glitchButtonRender.mockReset()
  })

  it('handlers should be stable after optimization', async () => {
    const { rerender } = render(<MainMenu />)

    // First render calls
    const initialCalls = [...glitchButtonRender.mock.calls]
    const creditsCall1 = initialCalls.find(
      c => c[0].children === 'ui:credits' || c[0].children === 'CREDITS'
    )
    const startTourCall1 = initialCalls.find(
      c => c[0].children === 'ui:start_game' || c[0].children === 'Start Tour'
    )

    expect(creditsCall1).toBeTruthy()
    expect(startTourCall1).toBeTruthy()

    // Force re-render
    rerender(<MainMenu />)

    const secondCalls = glitchButtonRender.mock.calls.slice(initialCalls.length)
    const creditsCall2 = secondCalls.find(
      c => c[0].children === 'ui:credits' || c[0].children === 'CREDITS'
    )
    const startTourCall2 = secondCalls.find(
      c => c[0].children === 'ui:start_game' || c[0].children === 'Start Tour'
    )

    expect(creditsCall2).toBeDefined()
    expect(startTourCall2).toBeDefined()

    // Assert stability (this should pass after optimization)
    expect(creditsCall1[0].onClick).toBe(creditsCall2[0].onClick)
    expect(startTourCall1[0].onClick).toBe(startTourCall2[0].onClick)
  })
})
