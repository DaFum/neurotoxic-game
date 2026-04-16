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
import { GAME_PHASES } from '../../src/context/gameConstants'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))

vi.mock('../../src/components/SceneRouter.jsx', () => ({
  SceneRouter: ({ currentScene }) => {
    switch (currentScene) {
      case GAME_PHASES.INTRO:
        return <div data-testid='intro-scene'>Intro</div>
      case GAME_PHASES.OVERWORLD:
        return <div data-testid='overworld-scene'>Overworld</div>
      case GAME_PHASES.PRE_GIG:
        return <div data-testid='pregig-scene'>PreGig</div>
      case GAME_PHASES.GIG:
      case GAME_PHASES.PRACTICE:
        return <div data-testid='gig-scene'>Gig</div>
      case GAME_PHASES.POST_GIG:
        return <div data-testid='postgig-scene'>PostGig</div>
      case GAME_PHASES.SETTINGS:
        return <div data-testid='settings-scene'>Settings</div>
      case GAME_PHASES.CREDITS:
        return <div data-testid='credits-scene'>Credits</div>
      case GAME_PHASES.GAMEOVER:
        return <div data-testid='gameover-scene'>GameOver</div>
      case GAME_PHASES.TRAVEL_MINIGAME:
        return <div data-testid='tourbus-scene'>Tourbus</div>
      case GAME_PHASES.PRE_GIG_MINIGAME:
        return <div data-testid='roadie-scene'>Roadie</div>
      case GAME_PHASES.CLINIC:
        return <div data-testid='clinic-scene'>Clinic</div>
      case GAME_PHASES.MENU:
      default:
        return <div data-testid='main-menu-scene'>Main Menu</div>
    }
  }
}))

// Mock all the scene components
vi.mock('../../src/scenes/MainMenu', () => ({
  MainMenu: () => <div data-testid='main-menu-scene'>Main Menu</div>
}))

vi.mock('../../src/scenes/Overworld', () => ({
  Overworld: () => <div data-testid='overworld-scene'>Overworld</div>
}))

vi.mock('../../src/scenes/Gig', () => ({
  Gig: () => <div data-testid='gig-scene'>Gig</div>
}))

vi.mock('../../src/scenes/PreGig', () => ({
  PreGig: () => <div data-testid='pregig-scene'>PreGig</div>
}))

vi.mock('../../src/scenes/PostGig', () => ({
  PostGig: () => <div data-testid='postgig-scene'>PostGig</div>
}))

vi.mock('../../src/scenes/TourbusScene', () => ({
  TourbusScene: () => <div data-testid='tourbus-scene'>Tourbus</div>
}))

vi.mock('../../src/scenes/RoadieRunScene', () => ({
  RoadieRunScene: () => <div data-testid='roadie-scene'>Roadie Run</div>
}))

vi.mock('../../src/scenes/Settings', () => ({
  Settings: () => <div data-testid='settings-scene'>Settings</div>
}))

vi.mock('../../src/scenes/Credits', () => ({
  Credits: () => <div data-testid='credits-scene'>Credits</div>
}))

vi.mock('../../src/scenes/GameOver', () => ({
  GameOver: () => <div data-testid='gameover-scene'>Game Over</div>
}))

vi.mock('../../src/scenes/IntroVideo', () => ({
  IntroVideo: () => <div data-testid='intro-scene'>Intro</div>
}))

// Mock UI components
vi.mock('../../src/ui/HUD', () => ({
  HUD: () => <div data-testid='hud'>HUD</div>
}))

vi.mock('../../src/ui/EventModal', () => ({
  EventModal: () => <div data-testid='event-modal'>Event Modal</div>
}))

vi.mock('../../src/ui/ToastOverlay', () => ({
  ToastOverlay: () => <div data-testid='toast-overlay'>Toast</div>
}))

vi.mock('../../src/ui/DebugLogViewer', () => ({
  DebugLogViewer: () => <div data-testid='debug-log'>Debug</div>
}))

vi.mock('../../src/components/TutorialManager', () => ({
  TutorialManager: () => <div data-testid='tutorial'>Tutorial</div>
}))

const chatterProps = { current: null }
vi.mock('../../src/components/ChatterOverlay', () => ({
  ChatterOverlay: props => {
    chatterProps.current = props
    return <div data-testid='chatter'>Chatter</div>
  }
}))

vi.mock('../../src/ui/CrashHandler', () => ({
  ErrorBoundary: ({ children }) => (
    <div data-testid='error-boundary'>{children}</div>
  )
}))

// Mock Analytics
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid='analytics'>Analytics</div>
}))

vi.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => <div data-testid='speed-insights'>SpeedInsights</div>
}))

// Mock GameState context
const mockResolveEvent = vi.fn()
const defaultMockGameState = {
  currentScene: GAME_PHASES.MENU,
  activeEvent: null,
  resolveEvent: mockResolveEvent,
  settings: { crtEnabled: false },
  band: { members: [] },
  player: { currentNodeId: 'none' },
  gameMap: { nodes: {} },
  social: {},
  lastGigStats: {}
}
const mockGameState = {
  ...defaultMockGameState,
  settings: { ...defaultMockGameState.settings },
  band: { ...defaultMockGameState.band },
  player: { ...defaultMockGameState.player },
  gameMap: { ...defaultMockGameState.gameMap },
  social: { ...defaultMockGameState.social },
  lastGigStats: { ...defaultMockGameState.lastGigStats }
}
let App

vi.mock('../../src/context/GameState.jsx', () => ({
  GameStateProvider: ({ children }) => (
    <div data-testid='game-state-provider'>{children}</div>
  ),
  useGameState: () => mockGameState
}))

const resetMockGameState = () => {
  mockGameState.currentScene = defaultMockGameState.currentScene
  mockGameState.activeEvent = defaultMockGameState.activeEvent
  mockGameState.resolveEvent = defaultMockGameState.resolveEvent
  mockGameState.settings = { ...defaultMockGameState.settings }
  mockGameState.band = { ...defaultMockGameState.band }
  mockGameState.player = { ...defaultMockGameState.player }
  mockGameState.gameMap = { ...defaultMockGameState.gameMap }
  mockGameState.social = { ...defaultMockGameState.social }
  mockGameState.lastGigStats = { ...defaultMockGameState.lastGigStats }
  chatterProps.current = null
}

beforeAll(async () => {
  App = (await import('../../src/App.jsx')).default
})

beforeEach(() => {
  resetMockGameState()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('App', () => {
  test('renders core providers and global overlays once per render', () => {
    const { container } = render(<App />)

    expect(container).toBeTruthy()
    expect(screen.getAllByTestId('error-boundary').length).toBeGreaterThan(0)
    expect(screen.getByTestId('game-state-provider')).toBeTruthy()
    expect(screen.getByTestId('toast-overlay')).toBeTruthy()
    expect(screen.getByTestId('chatter')).toBeTruthy()
    expect(screen.getByTestId('tutorial')).toBeTruthy()
    expect(screen.getByTestId('analytics')).toBeTruthy()
    expect(screen.getByTestId('speed-insights')).toBeTruthy()
  })

  test('renders the correct scene for each supported scene key', () => {
    const sceneCases = [
      { scene: GAME_PHASES.MENU, testId: 'main-menu-scene' },
      { scene: GAME_PHASES.INTRO, testId: 'intro-scene' },
      { scene: GAME_PHASES.OVERWORLD, testId: 'overworld-scene' },
      { scene: GAME_PHASES.PRE_GIG, testId: 'pregig-scene' },
      { scene: GAME_PHASES.GIG, testId: 'gig-scene' },
      { scene: GAME_PHASES.PRACTICE, testId: 'gig-scene' },
      { scene: GAME_PHASES.POST_GIG, testId: 'postgig-scene' },
      { scene: GAME_PHASES.SETTINGS, testId: 'settings-scene' },
      { scene: GAME_PHASES.CREDITS, testId: 'credits-scene' },
      { scene: GAME_PHASES.GAMEOVER, testId: 'gameover-scene' },
      { scene: GAME_PHASES.TRAVEL_MINIGAME, testId: 'tourbus-scene' },
      { scene: GAME_PHASES.PRE_GIG_MINIGAME, testId: 'roadie-scene' },
      { scene: GAME_PHASES.CLINIC, testId: 'clinic-scene' }
    ]

    for (const { scene, testId } of sceneCases) {
      mockGameState.currentScene = scene
      const { unmount } = render(<App />)

      expect(screen.getByTestId(testId)).toBeTruthy()
      unmount()
    }

    mockGameState.currentScene = 'UNKNOWN_SCENE'
    render(<App />)
    expect(screen.getByTestId('main-menu-scene')).toBeTruthy()
  })

  test('renders HUD only for scenes that support it', () => {
    const scenesWithoutHud = [
      GAME_PHASES.INTRO,
      GAME_PHASES.MENU,
      GAME_PHASES.SETTINGS,
      GAME_PHASES.CREDITS,
      GAME_PHASES.GAMEOVER,
      GAME_PHASES.TRAVEL_MINIGAME,
      GAME_PHASES.PRE_GIG_MINIGAME,
      GAME_PHASES.CLINIC
    ]

    for (const scene of scenesWithoutHud) {
      mockGameState.currentScene = scene
      const { unmount } = render(<App />)

      expect(screen.queryByTestId('hud')).toBeFalsy()
      unmount()
    }

    mockGameState.currentScene = GAME_PHASES.OVERWORLD
    let renderResult = render(<App />)
    expect(screen.getByTestId('hud')).toBeTruthy()
    renderResult.unmount()

    mockGameState.currentScene = GAME_PHASES.GIG
    renderResult = render(<App />)
    expect(screen.getByTestId('hud')).toBeTruthy()
    renderResult.unmount()
  })

  test('toggles EventModal with activeEvent state', () => {
    mockGameState.activeEvent = { id: 'event1', title: 'Test Event' }
    const firstRender = render(<App />)

    expect(screen.getByTestId('event-modal')).toBeTruthy()
    firstRender.unmount()

    mockGameState.activeEvent = null
    render(<App />)
    expect(screen.queryByTestId('event-modal')).toBeFalsy()
  })

  test('toggles crt overlay based on settings', () => {
    mockGameState.settings.crtEnabled = false
    const firstRender = render(<App />)
    let crtOverlay = firstRender.container.querySelector('.crt-overlay')
    expect(crtOverlay).toBeFalsy()
    firstRender.unmount()

    mockGameState.settings.crtEnabled = true
    const secondRender = render(<App />)
    crtOverlay = secondRender.container.querySelector('.crt-overlay')
    expect(crtOverlay).toBeTruthy()
  })

  test('passes the expected gameState slice to chatter overlay', () => {
    mockGameState.currentScene = GAME_PHASES.GIG
    mockGameState.band = { members: [{ name: 'Test' }] }
    mockGameState.player = { money: 500 }

    render(<App />)
    expect(screen.getByTestId('chatter')).toBeTruthy()
    expect(chatterProps.current?.gameState?.currentScene).toBe(GAME_PHASES.GIG)
    expect(chatterProps.current?.gameState?.band).toEqual(mockGameState.band)
    expect(chatterProps.current?.gameState?.player).toEqual(
      mockGameState.player
    )
  })

  test('keeps the expected game container styling', () => {
    const { container } = render(<App />)
    const gameContainer = container.querySelector('.game-container')

    expect(gameContainer).toBeTruthy()
    expect(gameContainer?.className).toContain('relative')
    expect(gameContainer?.className).toContain('w-full')
    expect(gameContainer?.className).toContain('h-full')
  })
})
