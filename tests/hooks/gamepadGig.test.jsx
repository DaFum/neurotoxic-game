import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { installGamepadFixture } from '../gamepadFixture'
import { GamepadInputProvider } from '../../src/context/GamepadInputContext'
import { useGigInput } from '../../src/hooks/useGigInput'
import { Modal } from '../../src/ui/shared/Modal'

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ addToast: vi.fn() }),
  useGameSelector: selector =>
    selector({ settings: { gamepadLaneBindings: [2, 0, 1] } })
}))
vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioService: { ensureAudioContext: vi.fn(() => Promise.resolve(true)) }
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue ?? _key
  })
}))

describe('gamepad gig adapter', () => {
  let fixture, pad, registerInput, togglePause, disconnectHint, animate
  beforeEach(() => {
    fixture = installGamepadFixture()
    pad = fixture.makePad()
    fixture.pads.push(pad)
    registerInput = vi.fn()
    togglePause = vi.fn()
    disconnectHint = vi.fn()
    animate = vi.fn()
  })
  afterEach(() => {
    cleanup()
    fixture.restore()
  })
  function Gig() {
    useGigInput({
      actions: { registerInput },
      gameStateRef: { current: { lanes: [] } },
      triggerBandAnimation: animate,
      onTogglePause: togglePause,
      onGamepadDisconnect: disconnectHint
    })
    return null
  }
  it('fires lane edges once, releases behind a modal, and pauses on disconnect', () => {
    const view = render(
      <GamepadInputProvider>
        <Gig />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    pad.buttons[2].pressed = true
    act(() => fixture.step(20))
    act(() => fixture.step(200))
    expect(registerInput.mock.calls).toEqual([[0, true]])
    expect(animate).toHaveBeenCalledTimes(1)
    view.rerender(
      <GamepadInputProvider>
        <Gig />
        <Modal isOpen onClose={() => {}} ariaLabel='Event'>
          <button>OK</button>
        </Modal>
      </GamepadInputProvider>
    )
    pad.buttons[2].pressed = false
    act(() => fixture.step(220))
    pad.buttons[2].pressed = true
    act(() => fixture.step(240))
    expect(registerInput.mock.calls).toEqual([
      [0, true],
      [0, false]
    ])
    act(() => fixture.disconnect(0))
    act(() => fixture.step(260))
    expect(togglePause).toHaveBeenCalledTimes(1)
  })

  it('lets confirm activate the audio unlock control while the gameplay adapter is disabled', () => {
    const unlock = vi.fn()
    function LockedGig() {
      useGigInput({
        actions: { registerInput },
        gameStateRef: { current: { lanes: [] } },
        triggerBandAnimation: animate,
        onTogglePause: togglePause,
        gamepadEnabled: false
      })
      return <button onClick={unlock}>Unlock audio</button>
    }
    const view = render(
      <GamepadInputProvider>
        <LockedGig />
      </GamepadInputProvider>
    )
    view.getByText('Unlock audio').focus()
    act(() => fixture.step(0))
    pad.buttons[0].pressed = true
    act(() => fixture.step(20))
    expect(unlock).toHaveBeenCalledTimes(1)
    expect(registerInput).not.toHaveBeenCalled()
  })
  it('releases a held lane before pausing on disconnect', () => {
    render(
      <GamepadInputProvider>
        <Gig />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    pad.buttons[2].pressed = true
    act(() => fixture.step(20))
    act(() => fixture.disconnect(0))
    act(() => fixture.step(40))
    expect(registerInput.mock.calls).toEqual([
      [0, true],
      [0, false]
    ])
    expect(togglePause).toHaveBeenCalledTimes(1)
  })
  it('keeps the remaining controller active and pauses only after the last disconnect', () => {
    const second = fixture.makePad(1)
    fixture.pads.push(second)
    render(
      <GamepadInputProvider>
        <Gig />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    second.buttons[2].pressed = true
    act(() => fixture.step(20))
    expect(registerInput.mock.calls).toEqual([[0, true]])

    act(() => fixture.disconnect(0))
    act(() => fixture.step(40))
    expect(registerInput.mock.calls).toEqual([[0, true]])
    expect(togglePause).not.toHaveBeenCalled()
    expect(disconnectHint).not.toHaveBeenCalled()

    act(() => fixture.disconnect(1))
    act(() => fixture.step(60))
    expect(registerInput.mock.calls).toEqual([
      [0, true],
      [0, false]
    ])
    expect(togglePause).toHaveBeenCalledTimes(1)
    expect(disconnectHint).toHaveBeenCalledTimes(1)
    expect(registerInput.mock.invocationCallOrder[1]).toBeLessThan(
      togglePause.mock.invocationCallOrder[0]
    )
  })

  it('releases a departing controller’s lane while the other remains held', () => {
    const second = fixture.makePad(1)
    fixture.pads.push(second)
    render(
      <GamepadInputProvider>
        <Gig />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    pad.buttons[0].pressed = true
    second.buttons[2].pressed = true
    act(() => fixture.step(20))
    expect(registerInput.mock.calls).toEqual([
      [1, true],
      [0, true]
    ])

    act(() => fixture.disconnect(0))
    act(() => fixture.step(40))
    expect(registerInput.mock.calls).toEqual([
      [1, true],
      [0, true],
      [1, false]
    ])
    expect(togglePause).not.toHaveBeenCalled()
    expect(disconnectHint).not.toHaveBeenCalled()
  })

  it('uses Start to pause and resumes only the top pause overlay', async () => {
    const { PauseOverlay } =
      await import('../../src/components/minigames/gig/PauseOverlay')
    const resume = vi.fn()
    const view = render(
      <GamepadInputProvider>
        <Gig />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    pad.buttons[9].pressed = true
    act(() => fixture.step(20))
    expect(togglePause).toHaveBeenCalledTimes(1)
    pad.buttons[9].pressed = false
    act(() => fixture.step(40))
    view.rerender(
      <GamepadInputProvider>
        <Gig />
        <PauseOverlay isPaused onResume={resume} onQuit={() => {}} />
      </GamepadInputProvider>
    )
    pad.buttons[9].pressed = true
    act(() => fixture.step(60))
    expect(resume).toHaveBeenCalledTimes(1)
    expect(togglePause).toHaveBeenCalledTimes(1)
  })
})
