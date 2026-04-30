import { Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { GAME_PHASES, MINIGAME_TYPES } from '../../src/context/gameConstants'
import { SceneRouter } from '../../src/components/SceneRouter.tsx'

vi.mock('../../src/scenes/MainMenu.tsx', () => ({
  MainMenu: (props) => <div data-testid='main-menu-scene' {...props}>Main Menu</div>
}))

vi.mock('../../src/scenes/Gig.tsx', () => ({
  default: (props) => <div data-testid='gig-scene' {...props}>Gig</div>
}))

vi.mock('../../src/scenes/RoadieRunScene.tsx', () => ({
  default: (props) => <div data-testid='roadie-scene' {...props}>Roadie</div>
}))

vi.mock('../../src/scenes/KabelsalatScene.tsx', () => ({
  default: (props) => <div data-testid='kabelsalat-scene' {...props}>Kabelsalat</div>
}))

vi.mock('../../src/scenes/AmpCalibrationScene.tsx', () => ({
  default: (props) => <div data-testid='amp-scene' {...props}>Amp</div>
}))

const renderRouter = props =>
  render(
    <Suspense fallback={<div data-testid='loading-scene'>Loading</div>}>
      <SceneRouter {...props} />
    </Suspense>
  )

describe('SceneRouter', () => {
  test('keeps the Roadie scene mounted when minigameType is cleared so its completion overlay can be dismissed', async () => {
    // After a minigame completes, reducers leave currentScene at PRE_GIG_MINIGAME
    // so the completion overlay can be shown. The SceneRouter must keep the
    // minigame scene mounted (Roadie is the default) instead of swapping to Gig
    // mid-overlay; the actual transition to GIG is driven by the overlay's
    // CONTINUE button via changeScene(GIG).
    renderRouter({
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      minigameType: null
    })

    expect(await screen.findByTestId('roadie-scene')).toBeInTheDocument()
    expect(screen.queryByTestId('gig-scene')).not.toBeInTheDocument()
  })

  test('routes explicit pre-gig minigames to their matching scene', async () => {
    const { unmount } = renderRouter({
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      minigameType: MINIGAME_TYPES.AMP_CALIBRATION
    })
    expect(await screen.findByTestId('amp-scene')).toBeInTheDocument()
    unmount()

    renderRouter({
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      minigameType: MINIGAME_TYPES.ROADIE
    })
    expect(await screen.findByTestId('roadie-scene')).toBeInTheDocument()
  })
})
