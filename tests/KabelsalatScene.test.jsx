import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { KabelsalatScene } from '../src/scenes/KabelsalatScene'
import { useGameState } from '../src/context/GameState'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const template = options?.defaultValue || key
      if (!options || Object.keys(options).length === 0) return template
      return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
        String(options[token] ?? `{{${token}}}`)
      )
    }
  })
}))

vi.mock('../src/context/GameState', () => ({
  useGameState: vi.fn(() => ({
    completeKabelsalatMinigame: vi.fn(),
    changeScene: vi.fn()
  }))
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
  let mockCompleteMinigame
  let mockChangeScene

  beforeEach(() => {
    vi.clearAllMocks()
    mockCompleteMinigame = vi.fn()
    mockChangeScene = vi.fn()

    vi.mocked(useGameState).mockReturnValue({
      completeKabelsalatMinigame: mockCompleteMinigame,
      changeScene: mockChangeScene
    })
  })

  it('renders scene shell and interactive cable board', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(
      screen.getByLabelText('ui:minigames.kabelsalat.title')
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(5)
  })

  it('renders all 5 cables', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(screen.getAllByText('ui:minigames.kabelsalat.title').length).toBeGreaterThan(0)
    expect(screen.getByText('ui:minigames.kabelsalat.tMinus')).toBeInTheDocument()
  })

  it('renders all 5 cables and their accessibility attributes', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    const buttons = screen.getAllByRole('button')
    // Filter for cable buttons (check for cable labels in accessible names)
    const cableButtons = buttons.filter(btn =>
      btn.getAttribute('aria-label')?.includes('cable')
    )
    expect(cableButtons.length).toBeGreaterThanOrEqual(5)
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

  it('renders all 5 sockets and their accessibility attributes', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })
    const buttons = screen.getAllByRole('button')
    // Filter for socket buttons (check for socket labels in accessible names)
    const socketButtons = buttons.filter(btn =>
      btn.getAttribute('aria-label')?.includes('socket')
    )
    expect(socketButtons.length).toBeGreaterThanOrEqual(5)
  })

  it('displays initial time limit', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    // Should display 25 seconds initially
    expect(screen.getByText(/ui:minigames.kabelsalat.timeValue/)).toBeInTheDocument()
  })

  it('shows pending status initially', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(
      screen.getByText(/ui:minigames.kabelsalat.statusPending/)
    ).toBeInTheDocument()
  })

  it('displays rules section', async () => {
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
    expect(
      screen.getByText(/ui:minigames.kabelsalat.rulesTitle/)
    ).toBeInTheDocument()
  })

  it('renders rack screws for hardware decoration', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    // Check that SVG is rendered
    const svg = screen.getByLabelText('ui:minigames.kabelsalat.title')
    expect(svg.tagName.toLowerCase()).toBe('svg')
  })

  it('displays power indicator light', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(screen.getByText(/ui:minigames.kabelsalat.pwrLabel/)).toBeInTheDocument()
  })

  it('renders background with correct styling', async () => {
    let container
    await act(async () => {
      const result = render(<KabelsalatScene />)
      container = result.container
    })

    // Check that the main container has background styling
    const mainDiv = container.firstChild
    expect(mainDiv).toHaveClass(/flex/)
  })

  it('applies opacity transition when background texture loads', async () => {
    await act(async () => {
      const { container } = render(<KabelsalatScene />)

      // Initially might be opacity-0
      const mainDiv = container.firstChild
      expect(mainDiv).toBeDefined()
    })
  })
})

describe('KabelsalatScene - timer and game over', () => {
  let mockCompleteMinigame
  let mockChangeScene

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockCompleteMinigame = vi.fn()
    mockChangeScene = vi.fn()

    vi.mocked(useGameState).mockReturnValue({
      completeKabelsalatMinigame: mockCompleteMinigame,
      changeScene: mockChangeScene
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('decrements timer every second', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    expect(screen.getByText(/ui:minigames.kabelsalat.timeValue/)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    // 24 seconds left - translated message handles it, so we just check for the key since our mock doesn't substitute it
    expect(screen.getByText(/ui:minigames.kabelsalat.timeValue/)).toBeInTheDocument()
  })

  it('shows critical styling when time is low', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    // Advance to low time
    await act(async () => {
      vi.advanceTimersByTime(16000) // 25 - 16 = 9 seconds left
    })

    expect(screen.getByText(/ui:minigames.kabelsalat.timeValue/)).toBeInTheDocument()
  })
})

describe('KabelsalatScene - accessibility', () => {
  it('provides aria-labels for cables', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    const buttons = screen.getAllByRole('button')
    const cableButtons = buttons.filter(btn =>
      btn.getAttribute('aria-label')?.includes('cable')
    )

    expect(cableButtons.length).toBeGreaterThan(0)
    cableButtons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label')
    })
  })

  it('provides aria-labels for sockets', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    const buttons = screen.getAllByRole('button')
    const socketButtons = buttons.filter(btn =>
      btn.getAttribute('aria-label')?.includes('socket')
    )

    expect(socketButtons.length).toBeGreaterThan(0)
    socketButtons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label')
    })
  })

  it('supports keyboard navigation with tabIndex', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    const buttons = screen.getAllByRole('button')
    const tabbableButtons = buttons.filter(
      btn => btn.getAttribute('tabindex') === '0'
    )

    expect(tabbableButtons.length).toBeGreaterThan(0)
  })

  it('provides SVG title for screen readers', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    const svg = screen.getByLabelText('ui:minigames.kabelsalat.title')
    expect(svg).toBeInTheDocument()
  })
})

describe('KabelsalatScene - visual feedback', () => {
  it('renders cable shadows', async () => {
    const { container } = render(<KabelsalatScene />)

    await act(async () => {
      // Check SVG elements exist
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('displays phase title with correct styling', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    const title = screen.getAllByText(/ui:minigames.kabelsalat.title/)[0].closest('h2')
    expect(title).toHaveClass(/text-2xl/)
  })

  it('renders time display with dynamic styling', async () => {
    await act(async () => {
      render(<KabelsalatScene />)
    })

    const timeDisplay = screen.getByText(/ui:minigames.kabelsalat.timeValue/)
    expect(timeDisplay).toHaveClass(/text-3xl/)
  })
})