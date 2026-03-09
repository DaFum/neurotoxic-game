import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
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

vi.mock('../src/components/stage/utils.js', async importOriginal => {
  const original = await importOriginal()
  return {
    ...original,
    loadTexture: vi.fn(async () => null)
  }
})

vi.mock('../src/utils/logger', () => ({
  logger: { warn: vi.fn() }
}))

describe('KabelsalatScene', () => {
  it('renders scene shell and interactive cable board', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(
      screen.getByLabelText('ui:minigames.kabelsalat.title')
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(5)
  })

  it('renders header with title and timer', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(screen.getAllByText('ui:minigames.kabelsalat.title').length).toBeGreaterThan(0)
    expect(screen.getByText('ui:minigames.kabelsalat.tMinus')).toBeInTheDocument()
  })

  it('renders rules section', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(screen.getByText(/ui:minigames.kabelsalat.rulesTitle/)).toBeInTheDocument()
  })

  it('renders SVG viewport with correct viewBox', async () => {
    let container
    await act(async () => {
      const result = render(<KabelsalatScene />)
      container = result.container
    })

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg.getAttribute('viewBox')).toBe('0 0 800 600')
  })

  it('has proper accessibility attributes on SVG', async () => {
    let container
    await act(async () => {
      const result = render(<KabelsalatScene />)
      container = result.container
    })

    const svg = container.querySelector('svg')
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBe('ui:minigames.kabelsalat.title')
  })

  it('renders status text in header', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(screen.getByText(/ui:minigames.kabelsalat.status/)).toBeInTheDocument()
  })

  it('renders power LED indicator as SVG circle', async () => {
    let container
    await act(async () => {
      const result = render(<KabelsalatScene />)
      container = result.container
    })

    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThan(0)
  })

  it('renders rack with multiple visual elements', async () => {
    let container
    await act(async () => {
      const result = render(<KabelsalatScene />)
      container = result.container
    })

    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBeGreaterThan(2)
  })

  it('renders interactive cables and sockets', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(5)
  })
})
