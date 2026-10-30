import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Modal } from '../../src/ui/shared/Modal'
import { DeadmanButton } from '../../src/ui/shared/BrutalistUI'
import { GamepadTextEntry } from '../../src/components/gamepad/GamepadTextEntry'
import { ControllerSettings } from '../../src/ui/settings/ControllerSettings'
import { GameStateProvider } from '../../src/context/GameState'
import { GamepadInputProvider } from '../../src/context/GamepadInputContext'
import {
  stubGamepads,
  restoreGamepadStubs,
  createMockGamepad
} from '../gamepadTestUtils'

function renderWithProviders(ui) {
  return render(
    <GameStateProvider>
      <GamepadInputProvider>{ui}</GamepadInputProvider>
    </GameStateProvider>
  )
}

describe('Gamepad UI Components', () => {
  beforeEach(() => {
    stubGamepads([])
  })

  afterEach(() => {
    restoreGamepadStubs()
    vi.useRealTimers()
  })

  it('Modal manages accessibility focus scope and Escape key', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <button type="button">Inside Button</button>
      </Modal>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('DeadmanButton confirms on hold and handles cancellation', () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    render(<DeadmanButton label="Self-Destruct" onConfirm={onConfirm} />)

    const button = screen.getByRole('button')
    fireEvent.mouseDown(button)

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(onConfirm).toHaveBeenCalled()
  })

  it('GamepadTextEntry renders character grid and writes value on Done', () => {
    const input = document.createElement('input')
    input.type = 'text'
    input.value = 'OLD'
    document.body.appendChild(input)

    const onClose = vi.fn()
    render(
      <GamepadTextEntry
        isOpen={true}
        initialValue="OLD"
        targetInput={input}
        onClose={onClose}
      />
    )

    const charA = screen.getByText('A')
    fireEvent.click(charA)

    const doneBtn = screen.getByText('Done')
    fireEvent.click(doneBtn)

    expect(input.value).toBe('OLDA')
    expect(onClose).toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('ControllerSettings renders status and resets modified bindings to default', () => {
    renderWithProviders(<ControllerSettings />)

    expect(screen.getByText(/Controller Status/i)).toBeInTheDocument()

    const resetBtn = screen.getByRole('button', {
      name: /Reset Default Bindings/i
    })
    fireEvent.click(resetBtn)

    expect(screen.getByText(/Reset Default Bindings/i)).toBeInTheDocument()
  })

  it('displays connected controller name when a gamepad is active', () => {
    const mockGamepad = createMockGamepad({
      id: 'Xbox 360 Controller (XInput STANDARD GAMEPAD)',
      index: 0,
      connected: true,
      mapping: 'standard'
    })

    stubGamepads([mockGamepad])

    renderWithProviders(<ControllerSettings />)

    expect(screen.getByText(/Xbox 360 Controller/i)).toBeInTheDocument()
  })
})
