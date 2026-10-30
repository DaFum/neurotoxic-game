import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { GamepadTextEntry } from '../../src/ui/shared/GamepadTextEntry'

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
})
