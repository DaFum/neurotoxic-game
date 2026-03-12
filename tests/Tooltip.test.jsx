import { describe, expect, test, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Tooltip } from '../src/ui/shared/Tooltip.jsx'

describe('Tooltip Component', () => {
  test('does not show content initially', () => {
    const { queryByText } = render(
      <Tooltip content='Tooltip Content'>
        <button type='button'>Hover Me</button>
      </Tooltip>
    )
    expect(queryByText('Tooltip Content')).toBeNull()
  })

  test('shows content on mouse enter and hides on mouse leave', () => {
    const { getByText, queryByText } = render(
      <Tooltip content='Tooltip Content'>
        <button type='button'>Hover Me</button>
      </Tooltip>
    )

    const trigger = getByText('Hover Me')
    fireEvent.mouseEnter(trigger)
    expect(getByText('Tooltip Content')).toBeInTheDocument()

    fireEvent.mouseLeave(trigger)
    expect(queryByText('Tooltip Content')).toBeNull()
  })

  test('shows content on focus and hides on blur', () => {
    const { getByText, queryByText } = render(
      <Tooltip content='Tooltip Content'>
        <button type='button'>Hover Me</button>
      </Tooltip>
    )

    const trigger = getByText('Hover Me')
    fireEvent.focus(trigger)
    expect(getByText('Tooltip Content')).toBeInTheDocument()

    fireEvent.blur(trigger)
    expect(queryByText('Tooltip Content')).toBeNull()
  })

  test('regression: does not call child event handlers if disabled', () => {
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()
    const onFocus = vi.fn()
    const onBlur = vi.fn()

    const { getByText } = render(
      <Tooltip content='Tooltip Content'>
        <button
          type='button'
          disabled
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          Disabled Button
        </button>
      </Tooltip>
    )

    const triggerWrapper = getByText('Disabled Button').parentElement

    fireEvent.mouseEnter(triggerWrapper)
    expect(getByText('Tooltip Content')).toBeInTheDocument()

    fireEvent.mouseLeave(triggerWrapper)

    fireEvent.focus(triggerWrapper)
    expect(getByText('Tooltip Content')).toBeInTheDocument()

    fireEvent.blur(triggerWrapper)

    expect(onMouseEnter).not.toHaveBeenCalled()
    expect(onMouseLeave).not.toHaveBeenCalled()
    expect(onFocus).not.toHaveBeenCalled()
    expect(onBlur).not.toHaveBeenCalled()
  })
})
