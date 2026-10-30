import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { GamepadTextEntry } from '../../src/ui/shared/GamepadTextEntry'
import { GamepadInputProvider } from '../../src/context/GamepadInputContext'
import { installGamepadFixture } from '../gamepadFixture'

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ addToast: vi.fn() }),
  useGameSelector: selector =>
    selector({ settings: { gamepadLaneBindings: [2, 0, 1] } })
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue ?? _key
  })
}))

describe('controller text entry', () => {
  it('writes through React input change, restores focus, and submits the alias', () => {
    const submit = vi.fn()
    function Prompt() {
      const [value, setValue] = useState('')
      const [open, setOpen] = useState(false)
      const ref = useRef(null)
      return (
        <form
          onSubmit={event => {
            event.preventDefault()
            submit(value)
          }}
        >
          <input
            ref={ref}
            aria-label='Alias'
            maxLength={2}
            value={value}
            onChange={event => setValue(event.target.value)}
          />
          <button
            type='button'
            onClick={() => {
              ref.current.focus()
              setOpen(true)
            }}
          >
            Open
          </button>
          <button type='submit'>Submit</button>
          {open && (
            <GamepadTextEntry
              target={ref.current}
              onClose={() => setOpen(false)}
            />
          )}
        </form>
      )
    }
    render(<Prompt />)
    fireEvent.click(screen.getByText('Open'))
    fireEvent.click(screen.getByRole('button', { name: 'A', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'B', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'C', exact: true }))
    fireEvent.click(screen.getByText('Done'))
    expect(screen.getByLabelText('Alias')).toHaveValue('AB')
    expect(document.activeElement).toBe(screen.getByLabelText('Alias'))
    fireEvent.click(screen.getByText('Submit'))
    expect(submit).toHaveBeenCalledWith('AB')
  })

  it.each([
    ['email', 'a.b@example.com'],
    ['url', 'https://a.b/path?x=1']
  ])(
    'enters a complete %s value after controller confirmation',
    (type, expected) => {
      const fixture = installGamepadFixture()
      const pad = fixture.makePad()
      fixture.pads.push(pad)
      function Prompt() {
        const [value, setValue] = useState('')
        return (
          <input
            type={type}
            aria-label='Target'
            value={value}
            onChange={event => setValue(event.target.value)}
          />
        )
      }
      const view = render(
        <GamepadInputProvider>
          <Prompt />
        </GamepadInputProvider>
      )
      try {
        act(() => fixture.step(0))
        screen.getByLabelText('Target').focus()
        pad.buttons[0].pressed = true
        act(() => fixture.step(20))
        let time = 20
        const confirm = name => {
          pad.buttons[0].pressed = false
          act(() => fixture.step((time += 20)))
          screen.getByRole('button', { name, exact: true }).focus()
          pad.buttons[0].pressed = true
          act(() => fixture.step((time += 20)))
        }
        for (const character of expected) confirm(character)
        confirm('Done')
        expect(screen.getByLabelText('Target')).toHaveValue(expected)
        expect(document.activeElement).toBe(screen.getByLabelText('Target'))
      } finally {
        view.unmount()
        fixture.restore()
      }
    }
  )
})
