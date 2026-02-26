import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock dependencies before import
const changeSceneMock = vi.fn()
const loadGameMock = vi.fn()
const addToastMock = vi.fn()
const resetStateMock = vi.fn()

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => ({
    changeScene: changeSceneMock,
    loadGame: loadGameMock,
    addToast: addToastMock,
    resetState: resetStateMock
  })
}))
const openHQMock = vi.fn()
vi.mock('../../src/hooks/useBandHQModal.js', () => ({
  useBandHQModal: () => ({
    showHQ: false,
    openHQ: openHQMock,
    bandHQProps: {}
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
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>
  }
}))
vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: () => '',
  IMG_PROMPTS: {}
}))
vi.mock('../../src/utils/AudioManager', () => ({
  audioManager: {
    startAmbient: async () => {},
    ensureAudioContext: async () => {}
  }
}))
vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))
// Dynamic import
const { MainMenu } = await import('../../src/scenes/MainMenu.jsx')

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
    const creditsCall1 = initialCalls.find(c => c[0].children === 'CREDITS')
    const startTourCall1 = initialCalls.find(
      c => c[0].children === 'Start Tour'
    )

    expect(creditsCall1).toBeTruthy()
    expect(startTourCall1).toBeTruthy()

    // Force re-render
    rerender(<MainMenu />)

    const secondCalls = glitchButtonRender.mock.calls.slice(initialCalls.length)
    const creditsCall2 = secondCalls.find(c => c[0].children === 'CREDITS')
    const startTourCall2 = secondCalls.find(c => c[0].children === 'Start Tour')

    expect(creditsCall2).toBeDefined()
    expect(startTourCall2).toBeDefined()

    // Assert stability (this should pass after optimization)
    expect(creditsCall1[0].onClick).toBe(creditsCall2[0].onClick)
    expect(startTourCall1[0].onClick).toBe(startTourCall2[0].onClick)
  })
})
