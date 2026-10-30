import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { installGamepadFixture } from '../gamepadFixture'
import { GamepadInputProvider } from '../../src/context/GamepadInputContext'
import { useTourbusLogic } from '../../src/hooks/minigames/useTourbusLogic'
import { useRoadieLogic } from '../../src/hooks/minigames/useRoadieLogic'

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    addToast: vi.fn(),
    completeTravelMinigame: vi.fn(),
    completeRoadieMinigame: vi.fn(),
    changeScene: vi.fn()
  }),
  useGameSelector: selector =>
    selector({
      settings: { gamepadLaneBindings: [2, 0, 1] },
      player: { van: { upgrades: [] } },
      band: { stash: {} },
      expedition: null,
      currentScene: 'PRE_GIG_MINIGAME'
    })
}))
vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioService: { playSFX: vi.fn() }
}))
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal()),
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue ?? _key
  })
}))

let fixture
beforeEach(() => {
  fixture = installGamepadFixture()
  fixture.pads.push(fixture.makePad())
})
afterEach(() => {
  cleanup()
  fixture.restore()
})

it('repeats discrete Tourbus steering', () => {
  let logic
  function Tourbus() {
    logic = useTourbusLogic()
    return null
  }
  render(
    <GamepadInputProvider>
      <Tourbus />
    </GamepadInputProvider>
  )
  act(() => fixture.step(0))
  fixture.pads[0].buttons[15].pressed = true
  act(() => fixture.step(20))
  expect(logic.gameStateRef.current.busLane).toBe(2)
  logic.gameStateRef.current.busLane = 0
  act(() => fixture.step(420))
  expect(logic.gameStateRef.current.busLane).toBe(1)
  act(() => fixture.step(540))
  expect(logic.gameStateRef.current.busLane).toBe(2)
})

it('repeats Roadie movement through its normal cooldown', () => {
  let logic
  function Roadie() {
    logic = useRoadieLogic()
    return null
  }
  render(
    <GamepadInputProvider>
      <Roadie />
    </GamepadInputProvider>
  )
  act(() => fixture.step(0))
  fixture.pads[0].buttons[15].pressed = true
  act(() => fixture.step(20))
  expect(logic.gameStateRef.current.playerPos.x).toBe(7)
  logic.gameStateRef.current.elapsedMS += 1000
  act(() => fixture.step(420))
  expect(logic.gameStateRef.current.playerPos.x).toBe(8)
  logic.gameStateRef.current.elapsedMS += 1000
  act(() => fixture.step(540))
  expect(logic.gameStateRef.current.playerPos.x).toBe(9)
})
