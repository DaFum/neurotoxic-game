import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KabelsalatScene } from '../src/scenes/KabelsalatScene'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, o) => o?.defaultValue || k })
}))

vi.mock('../src/context/GameState', () => ({
  useGameState: () => ({
    completeKabelsalatMinigame: vi.fn(),
    changeScene: vi.fn()
  })
}))

vi.mock('../src/utils/imageGen.js', () => ({
  getGenImageUrl: () => 'mock://bg',
  IMG_PROMPTS: { MINIGAME_KABELSALAT_BG: 'bg' }
}))

vi.mock('../src/utils/loadTexture', () => ({
  loadTexture: vi.fn(async () => null)
}))

vi.mock('../src/utils/logger', () => ({
  logger: { warn: vi.fn() }
}))

describe('KabelsalatScene', () => {
  it('renders scene shell and interactive cable board', () => {
    render(<KabelsalatScene />)

    expect(
      screen.getByLabelText('ui:minigames.kabelsalat.title')
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(5)
  })
})
