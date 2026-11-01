import { describe, expect, test, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Tooltip } from '../../src/ui/shared/Tooltip.tsx'

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

  test('Escape dismisses a focused tooltip and keeps the child onKeyDown', () => {
    const onKeyDown = vi.fn()
    const { getByText, queryByText } = render(
      <Tooltip content='Tooltip Content'>
        <button type='button' onKeyDown={onKeyDown}>
          Hover Me
        </button>
      </Tooltip>
    )

    const trigger = getByText('Hover Me')
    fireEvent.focus(trigger)
    expect(getByText('Tooltip Content')).toBeInTheDocument()

    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(queryByText('Tooltip Content')).toBeNull()
    expect(trigger).not.toHaveAttribute('aria-describedby')
    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  test('Escape on the document dismisses a hover-opened tooltip and the listener is removed', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const keydownCalls = spy =>
      spy.mock.calls.filter(([type]) => type === 'keydown')
    const { getByText, queryByText, unmount } = render(
      <Tooltip content='Tooltip Content'>
        <button type='button'>Hover Me</button>
      </Tooltip>
    )
    expect(keydownCalls(add)).toHaveLength(0)

    fireEvent.mouseEnter(getByText('Hover Me'))
    expect(getByText('Tooltip Content')).toBeInTheDocument()
    expect(keydownCalls(add)).toHaveLength(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(queryByText('Tooltip Content')).toBeNull()
    expect(keydownCalls(remove)).toHaveLength(1)

    // Reopen, then unmount: cleanup removes the listener again.
    fireEvent.mouseEnter(getByText('Hover Me'))
    expect(keydownCalls(add)).toHaveLength(2)
    unmount()
    expect(keydownCalls(remove)).toHaveLength(2)
    add.mockRestore()
    remove.mockRestore()
  })

  test('Escape dismisses the tooltip of a disabled child', () => {
    const { getByText, queryByText } = render(
      <Tooltip content='Tooltip Content'>
        <button type='button' disabled>
          Disabled Button
        </button>
      </Tooltip>
    )

    const triggerWrapper = getByText('Disabled Button').parentElement
    fireEvent.focus(triggerWrapper)
    expect(getByText('Tooltip Content')).toBeInTheDocument()

    fireEvent.keyDown(triggerWrapper, { key: 'Escape' })
    expect(queryByText('Tooltip Content')).toBeNull()
  })

  test('regression: does not call child event handlers if disabled and wrapper has cursor-not-allowed', () => {
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
    expect(triggerWrapper.className).toContain('cursor-not-allowed')

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

  test('returns invalid children without reading props', () => {
    const { getByText } = render(
      <Tooltip content='Tooltip Content'>plain child</Tooltip>
    )

    expect(getByText('plain child')).toBeInTheDocument()
  })

  test('ignores non-string aria-describedby values', () => {
    const { getByText } = render(
      <Tooltip content='Tooltip Content'>
        <button type='button' aria-describedby={42}>
          Hover Me
        </button>
      </Tooltip>
    )

    const trigger = getByText('Hover Me')
    fireEvent.mouseEnter(trigger)

    expect(getByText('Tooltip Content')).toBeInTheDocument()
  })

  test('treats 0 as valid tooltip content', () => {
    const { getByText } = render(
      <Tooltip content={0}>
        <button type='button'>Hover Me</button>
      </Tooltip>
    )

    const trigger = getByText('Hover Me')
    fireEvent.mouseEnter(trigger)
    expect(getByText('0')).toBeInTheDocument()
  })
})
