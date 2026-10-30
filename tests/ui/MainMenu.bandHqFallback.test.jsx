import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MainMenu } from '../../src/scenes/MainMenu'
import { useGameActions } from '../../src/context/GameState'

vi.mock('../../src/context/GameState', () => {
  const useGameActions = vi.fn()
  return {
    useGameActions,
    useGameSelector: selector => selector(useGameActions()),
  useGameSelectorOptional: selector => selector(useGameActions())
  }
})

vi.mock('../../src/hooks/useBandHQModal', () => ({
  useBandHQModal: () => ({
    showHQ: true,
    openHQ: vi.fn(),
    closeHQ: vi.fn()
  })
}))

vi.mock('../../src/utils/imageGen', () => ({
  isImageGenerationAvailable: () => true,
  resolveGenImageUrl: () => 'mock-url',
  getGeneratedImageFallbackUrl: () => 'mock-fallback',
  getGenImageUrl: vi.fn(() => 'mock-image-url'),
  IMG_PROMPTS: { MAIN_MENU_BG: 'mock-bg' }
}))

vi.mock('../../src/utils/audio/audioEngine', () => {
  const audioManager = {
    startAmbient: vi.fn().mockResolvedValue(),
    ensureAudioContext: vi.fn().mockResolvedValue()
  }
  return { audioManager, audioService: audioManager }
})

// The lazy Band HQ chunk never resolves, so the Suspense fallback stays up.
vi.mock('../../src/ui/BandHQ', () => new Promise(() => {}))

describe('MainMenu Band HQ loading fallback', () => {
  it('shows a status while the Band HQ chunk loads', () => {
    useGameActions.mockReturnValue({
      changeScene: vi.fn(),
      updatePlayer: vi.fn(),
      resetState: vi.fn(),
      addToast: vi.fn(),
      loadGame: vi.fn()
    })
    render(<MainMenu />)
    expect(screen.getByRole('status')).toHaveTextContent('ui:loading')
  })
})
