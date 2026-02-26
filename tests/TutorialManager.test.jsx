import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

// Mock the GameState context
const mockUpdatePlayer = vi.fn()
const mockUpdateSettings = vi.fn()

const mockGameStateValue = {
  player: { tutorialStep: 0 },
  updatePlayer: mockUpdatePlayer,
  currentScene: 'MENU',
  settings: { tutorialSeen: false },
  updateSettings: mockUpdateSettings
}

vi.mock('../src/context/GameState.jsx', () => ({
  useGameState: () => mockGameStateValue
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('TutorialManager', () => {
  test('renders welcome message for step 0 on MENU scene', async () => {
    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    render(<TutorialManager />)

    expect(screen.getByText('WELCOME TO THE GRIND')).toBeTruthy()
    expect(
      screen.getByText(
        /You are the manager of NEUROTOXIC. Your goal: survive the tour/i
      )
    ).toBeTruthy()
  })

  test('displays correct step counter', async () => {
    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    render(<TutorialManager />)

    expect(screen.getByText('TUTORIAL 1/4')).toBeTruthy()
  })

  test('calls updatePlayer when NEXT button is clicked', async () => {
    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )
    const user = userEvent.setup()

    render(<TutorialManager />)

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(mockUpdatePlayer).toHaveBeenCalledWith({ tutorialStep: 1 })
  })

  test('shows DONE button on last step', async () => {
    mockGameStateValue.player.tutorialStep = 3
    mockGameStateValue.currentScene = 'GIG'

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    render(<TutorialManager />)

    expect(screen.getByRole('button', { name: /done/i })).toBeTruthy()
  })

  test('marks tutorial as seen when completing last step', async () => {
    mockGameStateValue.player.tutorialStep = 3
    mockGameStateValue.currentScene = 'GIG'

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )
    const user = userEvent.setup()

    render(<TutorialManager />)

    const doneButton = screen.getByRole('button', { name: /done/i })
    await user.click(doneButton)

    expect(mockUpdatePlayer).toHaveBeenCalledWith({ tutorialStep: 4 })
    expect(mockUpdateSettings).toHaveBeenCalledWith({ tutorialSeen: true })
  })

  test('calls skip functions when SKIP ALL is clicked', async () => {
    mockGameStateValue.player.tutorialStep = 0
    mockGameStateValue.currentScene = 'MENU'

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )
    const user = userEvent.setup()

    render(<TutorialManager />)

    const skipButton = screen.getByRole('button', { name: /skip all/i })
    await user.click(skipButton)

    expect(mockUpdatePlayer).toHaveBeenCalledWith({ tutorialStep: -1 })
    expect(mockUpdateSettings).toHaveBeenCalledWith({ tutorialSeen: true })
  })

  test('does not render when tutorialSeen is true', async () => {
    mockGameStateValue.settings.tutorialSeen = true
    mockGameStateValue.player.tutorialStep = 0
    mockGameStateValue.currentScene = 'MENU'

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    const { container } = render(<TutorialManager />)

    expect(container.firstChild).toBeFalsy()
  })

  test('does not render when tutorialStep is -1', async () => {
    mockGameStateValue.settings.tutorialSeen = false
    mockGameStateValue.player.tutorialStep = -1
    mockGameStateValue.currentScene = 'MENU'

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    const { container } = render(<TutorialManager />)

    expect(container.firstChild).toBeFalsy()
  })

  test('shows map tutorial on OVERWORLD scene for step 1', async () => {
    mockGameStateValue.player.tutorialStep = 1
    mockGameStateValue.currentScene = 'OVERWORLD'
    mockGameStateValue.settings.tutorialSeen = false

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    render(<TutorialManager />)

    expect(screen.getByText('THE MAP')).toBeTruthy()
    expect(
      screen.getByText(/Travel between cities to play Gigs/i)
    ).toBeTruthy()
  })

  test('shows stats tutorial on OVERWORLD scene for step 2', async () => {
    mockGameStateValue.player.tutorialStep = 2
    mockGameStateValue.currentScene = 'OVERWORLD'
    mockGameStateValue.settings.tutorialSeen = false

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    render(<TutorialManager />)

    expect(screen.getByText('STATS')).toBeTruthy()
    expect(
      screen.getByText(/Keep an eye on Health \(Mood\) and Money/i)
    ).toBeTruthy()
  })

  test('shows performance tutorial on GIG scene for step 3', async () => {
    mockGameStateValue.player.tutorialStep = 3
    mockGameStateValue.currentScene = 'GIG'
    mockGameStateValue.settings.tutorialSeen = false

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    render(<TutorialManager />)

    expect(screen.getByText('PERFORM')).toBeTruthy()
    expect(
      screen.getByText(/Hit the notes when they reach the bottom/i)
    ).toBeTruthy()
  })

  test('renders progress dots correctly for current step', async () => {
    mockGameStateValue.player.tutorialStep = 1
    mockGameStateValue.currentScene = 'OVERWORLD'
    mockGameStateValue.settings.tutorialSeen = false

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    const { container } = render(<TutorialManager />)

    const dots = container.querySelectorAll('[class*="w-2 h-2"]')
    expect(dots.length).toBe(4) // 4 tutorial steps
  })

  test('does not render content for wrong scene', async () => {
    mockGameStateValue.player.tutorialStep = 1
    mockGameStateValue.currentScene = 'MENU' // Wrong scene for step 1
    mockGameStateValue.settings.tutorialSeen = false

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    const { container } = render(<TutorialManager />)

    // Should not render because step 1 requires OVERWORLD scene
    expect(container.firstChild).toBeFalsy()
  })

  test('applies correct ARIA attributes for accessibility', async () => {
    mockGameStateValue.player.tutorialStep = 0
    mockGameStateValue.currentScene = 'MENU'
    mockGameStateValue.settings.tutorialSeen = false

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    const { container } = render(<TutorialManager />)

    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-label')).toBe('Tutorial')
    expect(dialog?.getAttribute('aria-label')).toBe('Tutorial')
  })

  test('handles missing player.tutorialStep gracefully', async () => {
    mockGameStateValue.player = {} // No tutorialStep
    mockGameStateValue.currentScene = 'MENU'
    mockGameStateValue.settings.tutorialSeen = false

    const { TutorialManager } = await import(
      '../src/components/TutorialManager.jsx'
    )

    // Should default to step 0
    render(<TutorialManager />)

    expect(screen.getByText('WELCOME TO THE GRIND')).toBeTruthy()
  })
})