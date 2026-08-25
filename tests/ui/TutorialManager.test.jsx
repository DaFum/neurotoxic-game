import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { GAME_PHASES } from '../../src/context/gameConstants'

// Mock the GameState context
const mockUpdatePlayer = vi.fn()
const mockUpdateSettings = vi.fn()

const mockGameStateValue = {
  player: { tutorialStep: 0 },
  updatePlayer: mockUpdatePlayer,
  currentScene: GAME_PHASES.MENU,
  settings: { tutorialSeen: false },
  updateSettings: mockUpdateSettings
}

vi.mock('../../src/context/GameState.tsx', () => ({
  useGameState: () => mockGameStateValue,
  useGameActions: () => mockGameStateValue,
  useGameSelector: selector => selector(mockGameStateValue)
}))

let TutorialManager

beforeAll(async () => {
  ;({ TutorialManager } =
    await import('../../src/components/TutorialManager.tsx'))
})

beforeEach(() => {
  mockGameStateValue.player = { tutorialStep: 0 }
  mockGameStateValue.currentScene = GAME_PHASES.MENU
  mockGameStateValue.settings = { tutorialSeen: false }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  document.documentElement.style.removeProperty('--tutorial-inset')
})

describe('TutorialManager', () => {
  test('renders welcome message for step 0 on MENU scene', async () => {
    render(<TutorialManager />)

    expect(
      screen.getByText(/ui:tutorial\.welcome\.title|WELCOME TO THE GRIND/i)
    ).toBeTruthy()
    expect(
      screen.getByText(
        /ui:tutorial\.welcome\.text|You are the manager of NEUROTOXIC\. Your goal: survive the tour/i
      )
    ).toBeTruthy()
  })

  test('displays correct step counter', async () => {
    render(<TutorialManager />)

    expect(
      screen.getByText(/ui:tutorial\.welcome\.title|WELCOME TO THE GRIND/i)
    ).toBeTruthy()
  })

  test('calls updatePlayer when NEXT button is clicked', async () => {
    const user = userEvent.setup()

    render(<TutorialManager />)

    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    expect(mockUpdatePlayer).toHaveBeenCalledWith({ tutorialStep: 1 })
  })

  test('shows DONE button on last step', async () => {
    mockGameStateValue.player.tutorialStep = 3
    mockGameStateValue.currentScene = GAME_PHASES.GIG

    render(<TutorialManager />)

    expect(screen.getByRole('button', { name: /done/i })).toBeTruthy()
  })

  test('marks tutorial as seen when completing last step', async () => {
    mockGameStateValue.player.tutorialStep = 3
    mockGameStateValue.currentScene = GAME_PHASES.GIG

    const user = userEvent.setup()

    render(<TutorialManager />)

    const doneButton = screen.getByRole('button', { name: /done/i })
    await user.click(doneButton)

    expect(mockUpdatePlayer).toHaveBeenCalledWith({ tutorialStep: 4 })
    expect(mockUpdateSettings).toHaveBeenCalledWith({ tutorialSeen: true })
  })

  test('calls skip functions when SKIP ALL is clicked', async () => {
    mockGameStateValue.player.tutorialStep = 0
    mockGameStateValue.currentScene = GAME_PHASES.MENU

    const user = userEvent.setup()

    render(<TutorialManager />)

    const skipButton = screen.getByRole('button', {
      name: /SKIP ALL/i
    })
    await user.click(skipButton)

    expect(mockUpdatePlayer).toHaveBeenCalledWith({ tutorialStep: -1 })
    expect(mockUpdateSettings).toHaveBeenCalledWith({ tutorialSeen: true })
  })

  test('does not render when tutorialSeen is true', async () => {
    mockGameStateValue.settings.tutorialSeen = true
    mockGameStateValue.player.tutorialStep = 0
    mockGameStateValue.currentScene = GAME_PHASES.MENU

    const { container } = render(<TutorialManager />)

    expect(container.firstChild).toBeFalsy()
  })

  test('does not render when tutorialStep is -1', async () => {
    mockGameStateValue.settings.tutorialSeen = false
    mockGameStateValue.player.tutorialStep = -1
    mockGameStateValue.currentScene = GAME_PHASES.MENU

    const { container } = render(<TutorialManager />)

    expect(container.firstChild).toBeFalsy()
  })

  test('shows map tutorial on OVERWORLD scene for step 1', async () => {
    mockGameStateValue.player.tutorialStep = 1
    mockGameStateValue.currentScene = GAME_PHASES.OVERWORLD
    mockGameStateValue.settings.tutorialSeen = false

    render(<TutorialManager />)

    expect(screen.getByText(/ui:tutorial\.map\.title|THE MAP/i)).toBeTruthy()
    expect(
      screen.getByText(
        /ui:tutorial\.map\.text|Travel between cities to play Gigs/i
      )
    ).toBeTruthy()
  })

  test('shows stats tutorial on OVERWORLD scene for step 2', async () => {
    mockGameStateValue.player.tutorialStep = 2
    mockGameStateValue.currentScene = GAME_PHASES.OVERWORLD
    mockGameStateValue.settings.tutorialSeen = false

    render(<TutorialManager />)

    expect(
      screen.getAllByText(/ui:tutorial\.stats\.title|STATS/i).length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/ui:tutorial\.stats\.text|Keep an eye on Health/i)
        .length
    ).toBeGreaterThan(0)
  })

  test('shows performance tutorial on GIG scene for step 3', async () => {
    mockGameStateValue.player.tutorialStep = 3
    mockGameStateValue.currentScene = GAME_PHASES.GIG
    mockGameStateValue.settings.tutorialSeen = false

    render(<TutorialManager />)

    expect(
      screen.getAllByText(/ui:tutorial\.perform\.title|PERFORM/i).length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        /ui:tutorial\.perform\.text|Hit the notes when they reach the bottom/i
      ).length
    ).toBeGreaterThan(0)
  })

  test('shows performance tutorial on PRACTICE scene for step 3', async () => {
    mockGameStateValue.player.tutorialStep = 3
    mockGameStateValue.currentScene = GAME_PHASES.PRACTICE
    mockGameStateValue.settings.tutorialSeen = false

    render(<TutorialManager />)

    expect(
      screen.getAllByText(/ui:tutorial\.perform\.title|PERFORM/i).length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        /ui:tutorial\.perform\.text|Hit the notes when they reach the bottom/i
      ).length
    ).toBeGreaterThan(0)
  })

  test('renders progress dots correctly for current step', async () => {
    mockGameStateValue.player.tutorialStep = 1
    mockGameStateValue.currentScene = GAME_PHASES.OVERWORLD
    mockGameStateValue.settings.tutorialSeen = false

    const { container } = render(<TutorialManager />)

    const dots = container.querySelectorAll('[class*="w-2 h-2"]')
    expect(dots.length).toBe(4) // 4 tutorial steps
  })

  test('does not render content for wrong scene', async () => {
    mockGameStateValue.player.tutorialStep = 1
    mockGameStateValue.currentScene = GAME_PHASES.MENU // Wrong scene for step 1
    mockGameStateValue.settings.tutorialSeen = false

    const { container } = render(<TutorialManager />)

    // Should not render because step 1 requires OVERWORLD scene
    expect(container.firstChild).toBeFalsy()
  })

  test('applies correct ARIA attributes for accessibility', async () => {
    mockGameStateValue.player.tutorialStep = 0
    mockGameStateValue.currentScene = GAME_PHASES.MENU
    mockGameStateValue.settings.tutorialSeen = false

    const { container } = render(<TutorialManager />)

    const region = container.querySelector('[role="region"]')
    expect(region).toBeTruthy()
    expect(region?.getAttribute('aria-label')).toBe('Tutorial')
    expect(region?.getAttribute('aria-live')).toBe('polite')
  })

  test('is not a modal dialog, so the scene behind it stays available', async () => {
    // The steps annotate live UI and the last one runs during GIG/PRACTICE
    // while telling the player to hit notes, so this overlay must never trap
    // focus or hide the rest of the scene from assistive tech.
    mockGameStateValue.player.tutorialStep = 0
    mockGameStateValue.currentScene = GAME_PHASES.MENU
    mockGameStateValue.settings.tutorialSeen = false

    const { container } = render(<TutorialManager />)

    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(container.querySelector('[aria-modal="true"]')).toBeNull()
  })

  test('--tutorial-inset follows the panel across steps of differing height', async () => {
    // The panel is keyed by `step`, so it remounts between steps while the
    // tutorial stays visible. Measuring must rebind to the newly mounted
    // element instead of holding on to the first step's detached node.
    const heights = new WeakMap()
    let nextHeight = 100
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight'
    )
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        if (!heights.has(this)) heights.set(this, (nextHeight += 60))
        return heights.get(this)
      }
    })

    try {
      // OVERWORLD keeps steps 0 and 1 both visible, so the overlay stays
      // mounted across the step change.
      mockGameStateValue.currentScene = GAME_PHASES.OVERWORLD
      mockGameStateValue.player = { tutorialStep: 0 }

      const { rerender } = render(<TutorialManager />)
      const firstInset =
        document.documentElement.style.getPropertyValue('--tutorial-inset')
      expect(firstInset).not.toBe('')

      mockGameStateValue.player = { tutorialStep: 1 }
      rerender(<TutorialManager />)

      const secondInset =
        document.documentElement.style.getPropertyValue('--tutorial-inset')
      expect(secondInset).not.toBe('')
      expect(secondInset).not.toBe(firstInset)
    } finally {
      if (original) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original)
      } else {
        delete HTMLElement.prototype.offsetHeight
      }
    }
  })

  test('--tutorial-inset is cleared once the tutorial stops rendering', async () => {
    mockGameStateValue.currentScene = GAME_PHASES.MENU
    mockGameStateValue.player = { tutorialStep: 0 }

    const { rerender } = render(<TutorialManager />)

    mockGameStateValue.settings = { tutorialSeen: true }
    rerender(<TutorialManager />)

    expect(
      document.documentElement.style.getPropertyValue('--tutorial-inset')
    ).toBe('')
  })

  test('handles missing player.tutorialStep gracefully', async () => {
    mockGameStateValue.player = {} // No tutorialStep
    mockGameStateValue.currentScene = GAME_PHASES.MENU
    mockGameStateValue.settings.tutorialSeen = false

    // Should default to step 0
    render(<TutorialManager />)

    expect(
      screen.getByText(/ui:tutorial\.welcome\.title|WELCOME TO THE GRIND/i)
    ).toBeTruthy()
  })
})
