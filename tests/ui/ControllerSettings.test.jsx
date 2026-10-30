import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ControllerSettings } from '../../src/ui/settings/ControllerSettings'
import { GamepadContext } from '../../src/hooks/gamepad/GamepadContext'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, options) => options?.defaultValue ?? key })
}))

describe('controller settings', () => {
  it('swaps conflicting bindings, rejects Start and resets', () => {
    let captured
    const change = vi.fn(),
      reset = vi.fn()
    const controller = {
      register: () => () => {},
      capture: fn => {
        captured = fn
        return () => {}
      },
      status: { available: true, devices: [] },
      bindings: [2, 0, 1]
    }
    render(
      <GamepadContext value={controller}>
        <ControllerSettings
          bindings={[2, 0, 1]}
          onChange={change}
          onReset={reset}
        />
      </GamepadContext>
    )
    fireEvent.click(screen.getAllByText('Rebind')[0])
    captured(0)
    expect(change).toHaveBeenCalledWith([0, 2, 1])
    fireEvent.click(screen.getAllByText('Rebind')[0])
    captured(9)
    expect(change).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Reset to default'))
    expect(reset).toHaveBeenCalledTimes(1)
  })
  it('cancels capture on Escape without changing bindings', () => {
    const change = vi.fn()
    const release = vi.fn()
    const controller = {
      register: () => () => {},
      capture: () => release,
      status: { available: true, devices: [] },
      bindings: [2, 0, 1]
    }
    render(
      <GamepadContext value={controller}>
        <ControllerSettings
          bindings={[2, 0, 1]}
          onChange={change}
          onReset={() => {}}
        />
      </GamepadContext>
    )
    fireEvent.click(screen.getAllByText('Rebind')[0])
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Press a button. Start cancels.')).toBeNull()
    expect(release).toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
  })
})
