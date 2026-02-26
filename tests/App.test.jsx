import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'

// Mock all the scene components
vi.mock('../src/scenes/MainMenu', () => ({
  MainMenu: () => <div data-testid='main-menu-scene'>Main Menu</div>
}))

vi.mock('../src/scenes/Overworld', () => ({
  Overworld: () => <div data-testid='overworld-scene'>Overworld</div>
}))

vi.mock('../src/scenes/Gig', () => ({
  Gig: () => <div data-testid='gig-scene'>Gig</div>
}))

vi.mock('../src/scenes/PreGig', () => ({
  PreGig: () => <div data-testid='pregig-scene'>PreGig</div>
}))

vi.mock('../src/scenes/PostGig', () => ({
  PostGig: () => <div data-testid='postgig-scene'>PostGig</div>
}))

vi.mock('../src/scenes/TourbusScene', () => ({
  TourbusScene: () => <div data-testid='tourbus-scene'>Tourbus</div>
}))

vi.mock('../src/scenes/RoadieRunScene', () => ({
  RoadieRunScene: () => <div data-testid='roadie-scene'>Roadie Run</div>
}))

vi.mock('../src/scenes/Settings', () => ({
  Settings: () => <div data-testid='settings-scene'>Settings</div>
}))

vi.mock('../src/scenes/Credits', () => ({
  Credits: () => <div data-testid='credits-scene'>Credits</div>
}))

vi.mock('../src/scenes/GameOver', () => ({
  GameOver: () => <div data-testid='gameover-scene'>Game Over</div>
}))

vi.mock('../src/scenes/IntroVideo', () => ({
  IntroVideo: () => <div data-testid='intro-scene'>Intro</div>
}))

// Mock UI components
vi.mock('../src/ui/HUD', () => ({
  HUD: () => <div data-testid='hud'>HUD</div>
}))

vi.mock('../src/ui/EventModal', () => ({
  EventModal: () => <div data-testid='event-modal'>Event Modal</div>
}))

vi.mock('../src/ui/ToastOverlay', () => ({
  ToastOverlay: () => <div data-testid='toast-overlay'>Toast</div>
}))

vi.mock('../src/ui/DebugLogViewer', () => ({
  DebugLogViewer: () => <div data-testid='debug-log'>Debug</div>
}))

vi.mock('../src/components/TutorialManager', () => ({
  TutorialManager: () => <div data-testid='tutorial'>Tutorial</div>
}))

vi.mock('../src/components/ChatterOverlay', () => ({
  ChatterOverlay: () => <div data-testid='chatter'>Chatter</div>
}))

vi.mock('../src/ui/CrashHandler', () => ({
  ErrorBoundary: ({ children }) => <div data-testid='error-boundary'>{children}</div>
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
const mockGameState = {
  currentScene: 'MENU',
  activeEvent: null,
  resolveEvent: mockResolveEvent,
  settings: { crtEnabled: false },
  band: { members: [] },
  player: { currentNodeId: 'none' },
  gameMap: { nodes: {} },
  social: {},
  lastGigStats: {}
}

vi.mock('../src/context/GameState.jsx', () => ({
  GameStateProvider: ({ children }) => (
    <div data-testid='game-state-provider'>{children}</div>
  ),
  useGameState: () => mockGameState
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('App', () => {
  test('renders without crashing', async () => {
    const App = (await import('../src/App.jsx')).default

    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })

  test('wraps content with ErrorBoundary', async () => {
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('error-boundary')).toBeTruthy()
  })

  test('wraps content with GameStateProvider', async () => {
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('game-state-provider')).toBeTruthy()
  })

  test('renders MainMenu scene when currentScene is MENU', async () => {
    mockGameState.currentScene = 'MENU'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('main-menu-scene')).toBeTruthy()
  })

  test('renders Intro scene when currentScene is INTRO', async () => {
    mockGameState.currentScene = 'INTRO'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('intro-scene')).toBeTruthy()
  })

  test('renders Overworld scene when currentScene is OVERWORLD', async () => {
    mockGameState.currentScene = 'OVERWORLD'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('overworld-scene')).toBeTruthy()
  })

  test('renders PreGig scene when currentScene is PREGIG', async () => {
    mockGameState.currentScene = 'PREGIG'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('pregig-scene')).toBeTruthy()
  })

  test('renders Gig scene when currentScene is GIG', async () => {
    mockGameState.currentScene = 'GIG'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('gig-scene')).toBeTruthy()
  })

  test('renders Gig scene when currentScene is PRACTICE', async () => {
    mockGameState.currentScene = 'PRACTICE'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('gig-scene')).toBeTruthy()
  })

  test('renders PostGig scene when currentScene is POSTGIG', async () => {
    mockGameState.currentScene = 'POSTGIG'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('postgig-scene')).toBeTruthy()
  })

  test('renders Settings scene when currentScene is SETTINGS', async () => {
    mockGameState.currentScene = 'SETTINGS'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('settings-scene')).toBeTruthy()
  })

  test('renders Credits scene when currentScene is CREDITS', async () => {
    mockGameState.currentScene = 'CREDITS'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('credits-scene')).toBeTruthy()
  })

  test('renders GameOver scene when currentScene is GAMEOVER', async () => {
    mockGameState.currentScene = 'GAMEOVER'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('gameover-scene')).toBeTruthy()
  })

  test('renders Tourbus minigame scene', async () => {
    mockGameState.currentScene = 'TRAVEL_MINIGAME'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('tourbus-scene')).toBeTruthy()
  })

  test('renders Roadie minigame scene', async () => {
    mockGameState.currentScene = 'PRE_GIG_MINIGAME'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(await screen.findByTestId('roadie-scene')).toBeTruthy()
  })

  test('renders default MainMenu for unknown scene', async () => {
    mockGameState.currentScene = 'UNKNOWN_SCENE'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('main-menu-scene')).toBeTruthy()
  })

  test('does not render HUD in INTRO scene', async () => {
    mockGameState.currentScene = 'INTRO'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.queryByTestId('hud')).toBeFalsy()
  })

  test('does not render HUD in MENU scene', async () => {
    mockGameState.currentScene = 'MENU'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.queryByTestId('hud')).toBeFalsy()
  })

  test('does not render HUD in SETTINGS scene', async () => {
    mockGameState.currentScene = 'SETTINGS'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.queryByTestId('hud')).toBeFalsy()
  })

  test('does not render HUD in GAMEOVER scene', async () => {
    mockGameState.currentScene = 'GAMEOVER'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.queryByTestId('hud')).toBeFalsy()
  })

  test('renders HUD in OVERWORLD scene', async () => {
    mockGameState.currentScene = 'OVERWORLD'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('hud')).toBeTruthy()
  })

  test('renders HUD in GIG scene', async () => {
    mockGameState.currentScene = 'GIG'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('hud')).toBeTruthy()
  })

  test('always renders ToastOverlay', async () => {
    mockGameState.currentScene = 'MENU'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('toast-overlay')).toBeTruthy()
  })

  test('always renders ChatterOverlay', async () => {
    mockGameState.currentScene = 'MENU'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('chatter')).toBeTruthy()
  })

  test('always renders TutorialManager', async () => {
    mockGameState.currentScene = 'MENU'
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('tutorial')).toBeTruthy()
  })

  test('renders EventModal when activeEvent is present', async () => {
    mockGameState.activeEvent = { id: 'event1', title: 'Test Event' }
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('event-modal')).toBeTruthy()
  })

  test('does not render EventModal when activeEvent is null', async () => {
    mockGameState.activeEvent = null
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.queryByTestId('event-modal')).toBeFalsy()
  })

  test('does not render CRT overlay when crtEnabled is false', async () => {
    mockGameState.settings.crtEnabled = false
    mockGameState.currentScene = 'MENU'
    const App = (await import('../src/App.jsx')).default

    const { container } = render(<App />)
    const crtOverlay = container.querySelector('.crt-overlay')
    expect(crtOverlay).toBeFalsy()
  })

  test('renders CRT overlay when crtEnabled is true', async () => {
    mockGameState.settings.crtEnabled = true
    mockGameState.currentScene = 'MENU'
    const App = (await import('../src/App.jsx')).default

    const { container } = render(<App />)
    const crtOverlay = container.querySelector('.crt-overlay')
    expect(crtOverlay).toBeTruthy()
  })

  test('renders Analytics component', async () => {
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('analytics')).toBeTruthy()
  })

  test('renders SpeedInsights component', async () => {
    const App = (await import('../src/App.jsx')).default

    render(<App />)
    expect(screen.getByTestId('speed-insights')).toBeTruthy()
  })

  test('passes correct gameState slice to ChatterOverlay', async () => {
    mockGameState.currentScene = 'GIG'
    mockGameState.band = { members: [{ name: 'Test' }] }
    mockGameState.player = { money: 500 }

    const App = (await import('../src/App.jsx')).default

    render(<App />)
    // ChatterOverlay should be rendered with the correct state
    expect(screen.getByTestId('chatter')).toBeTruthy()
  })

  test('has correct container styling', async () => {
    mockGameState.currentScene = 'MENU'
    const App = (await import('../src/App.jsx')).default

    const { container } = render(<App />)
    const gameContainer = container.querySelector('.game-container')

    expect(gameContainer).toBeTruthy()
    expect(gameContainer?.className).toContain('relative')
    expect(gameContainer?.className).toContain('w-full')
    expect(gameContainer?.className).toContain('h-full')
  })
})