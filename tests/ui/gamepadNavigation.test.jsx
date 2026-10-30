import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  moveGamepadFocus,
  activateGamepadElement
} from '../../src/utils/gamepad/navigation'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('controller navigation', () => {
  it('moves within its scope and activates a button exactly once', () => {
    document.body.innerHTML =
      '<div id="scope"><button id="a">A</button><button id="b">B</button></div><button id="outside">Outside</button>'
    const a = document.querySelector('#a')
    const b = document.querySelector('#b')
    const click = vi.fn()
    b.addEventListener('click', click)
    a.focus()
    moveGamepadFocus('right', [document.querySelector('#scope')])
    expect(document.activeElement).toBe(b)
    activateGamepadElement(b)
    expect(click).toHaveBeenCalledTimes(1)
  })
  it('steps ranges and preserves their bounds', () => {
    document.body.innerHTML =
      '<input type="range" min="0" max="20" step="10" value="10">'
    const range = document.querySelector('input')
    range.focus()
    moveGamepadFocus('right', [document.body])
    expect(range.value).toBe('20')
    moveGamepadFocus('right', [document.body])
    expect(range.value).toBe('20')
  })
})

it('delivers range changes to React', async () => {
  const React = await import('react')
  const { render, screen } = await import('@testing-library/react')
  function Slider() {
    const [value, setValue] = React.useState(10)
    return (
      <>
        <input
          aria-label='dial'
          type='range'
          min='0'
          max='20'
          step='10'
          value={value}
          onChange={event => setValue(Number(event.target.value))}
        />
        <output>{value}</output>
      </>
    )
  }
  render(<Slider />)
  const range = screen.getByLabelText('dial')
  range.focus()
  moveGamepadFocus('right', [document.body])
  expect(screen.getByText('20')).toBeTruthy()
})

it('activates focusable SVG controls once and leaves focus unchanged when the source changes', async () => {
  const { setActiveInputSource } =
    await import('../../src/utils/gamepad/inputSource')
  document.body.innerHTML =
    '<svg><g role="button" tabindex="0" aria-label="cable"></g></svg>'
  const cable = document.querySelector('g')
  const clicked = vi.fn()
  cable.addEventListener('click', clicked)
  cable.focus()
  setActiveInputSource('gamepad')
  expect(document.activeElement).toBe(cable)
  activateGamepadElement(cable)
  expect(clicked).toHaveBeenCalledTimes(1)
  setActiveInputSource('keyboard')
})

it('sends one directional key to tabs without clicking them', () => {
  document.body.innerHTML =
    '<div role="tablist"><button role="tab">First</button><button role="tab">Second</button></div>'
  const tab = document.querySelector('[role="tab"]')
  const clicks = vi.fn()
  const keys = vi.fn()
  tab.addEventListener('click', clicks)
  tab.addEventListener('keydown', keys)
  tab.focus()
  moveGamepadFocus('right', [document.body])
  expect(keys).toHaveBeenCalledTimes(1)
  expect(keys.mock.calls[0][0].key).toBe('ArrowRight')
  expect(clicks).not.toHaveBeenCalled()
})
