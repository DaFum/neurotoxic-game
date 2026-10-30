import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { installGamepadFixture } from '../gamepadFixture'
import { GamepadInputProvider } from '../../src/context/GamepadInputContext'
import { DeadmanButton } from '../../src/ui/shared/BrutalistUI'
import { Modal } from '../../src/ui/shared/Modal'

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ addToast: vi.fn() }),
  useGameSelector: selector =>
    selector({ settings: { gamepadLaneBindings: [2, 0, 1] } })
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) =>
      typeof options === 'string' ? options : (options?.defaultValue ?? key)
  })
}))

let fixture
beforeEach(() => {
  vi.useFakeTimers()
  fixture = installGamepadFixture()
})
afterEach(() => {
  cleanup()
  fixture.restore()
  vi.useRealTimers()
})

it.each([false, true])(
  'cancels early and confirms once for a hold (modal: %s)',
  modal => {
    const pad = fixture.makePad()
    fixture.pads.push(pad)
    const confirm = vi.fn()
    render(
      <GamepadInputProvider>
        {modal ? (
          <Modal isOpen onClose={() => {}} ariaLabel='Confirm'>
            <DeadmanButton label='Execute' onConfirm={confirm} />
          </Modal>
        ) : (
          <DeadmanButton label='Execute' onConfirm={confirm} />
        )}
      </GamepadInputProvider>
    )
    screen.getByRole('button', { name: /execute/i }).focus()
    act(() => fixture.step(0))
    pad.buttons[0].pressed = true
    act(() => fixture.step(20))
    act(() => vi.advanceTimersByTime(200))
    pad.buttons[0].pressed = false
    act(() => fixture.step(40))
    act(() => vi.advanceTimersByTime(300))
    expect(confirm).not.toHaveBeenCalled()
    pad.buttons[0].pressed = true
    act(() => fixture.step(60))
    act(() => vi.advanceTimersByTime(1100))
    expect(confirm).toHaveBeenCalledTimes(1)
    pad.buttons[0].pressed = false
    act(() => fixture.step(80))
    expect(confirm).toHaveBeenCalledTimes(1)
  }
)
