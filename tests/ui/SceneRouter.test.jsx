import { Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { GAME_PHASES, MINIGAME_TYPES } from '../../src/context/gameConstants'
import { SceneRouter } from '../../src/components/SceneRouter.tsx'

vi.mock('../../src/scenes/MainMenu.tsx', () => ({
  MainMenu: () => <div data-testid='main-menu-scene'>Main Menu</div>
}))

vi.mock('../../src/scenes/Gig.tsx', () => ({
  default: () => <div data-testid='gig-scene'>Gig</div>
}))

vi.mock('../../src/scenes/RoadieRunScene.tsx', () => ({
  default: () => <div data-testid='roadie-scene'>Roadie</div>
}))

vi.mock('../../src/scenes/KabelsalatScene.tsx', () => ({
  default: () => <div data-testid='kabelsalat-scene'>Kabelsalat</div>
}))

vi.mock('../../src/scenes/AmpCalibrationScene.tsx', () => ({
  default: () => <div data-testid='amp-scene'>Amp</div>
}))

const renderRouter = props =>
  render(
    <Suspense fallback={<div data-testid='loading-scene'>Loading</div>}>
      <SceneRouter {...props} />
    </Suspense>
  )

describe('SceneRouter', () => {
  test('does not fall back to Roadie when a pre-gig minigame type has already been cleared', async () => {
    renderRouter({
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      minigameType: null
    })

    expect(await screen.findByTestId('gig-scene')).toBeInTheDocument()
    expect(screen.queryByTestId('roadie-scene')).not.toBeInTheDocument()
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
