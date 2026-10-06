import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { createRovingTabs } from '../../src/ui/shared/rovingTabs'

const IDS = ['one', 'two', 'three']

const Tabs = ({ activeId = 'one', onSelect, isLocked }) => {
  const { getTabProps } = createRovingTabs({
    ids: IDS,
    activeId,
    onSelect,
    isLocked
  })
  return (
    <div role='tablist'>
      {IDS.map(id => (
        <button key={id} type='button' role='tab' {...getTabProps(id)}>
          {id}
        </button>
      ))}
    </div>
  )
}

describe('createRovingTabs', () => {
  it('puts only the active tab in the page tab sequence', () => {
    render(<Tabs activeId='two' onSelect={vi.fn()} />)

    expect(
      screen.getAllByRole('tab').map(tab => tab.getAttribute('tabindex'))
    ).toEqual(['-1', '0', '-1'])
  })

  it('moves selection and focus with ArrowRight/ArrowLeft, wrapping at the ends', () => {
    const onSelect = vi.fn()
    render(<Tabs onSelect={onSelect} />)
    const [one, two, three] = screen.getAllByRole('tab')

    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith('two')
    expect(two).toHaveFocus()

    fireEvent.keyDown(one, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith('three')
    expect(three).toHaveFocus()

    fireEvent.keyDown(three, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith('one')
    expect(one).toHaveFocus()
  })

  it('jumps to the first and last tab with Home and End', () => {
    const onSelect = vi.fn()
    render(<Tabs onSelect={onSelect} />)
    const [one, , three] = screen.getAllByRole('tab')

    fireEvent.keyDown(one, { key: 'End' })
    expect(onSelect).toHaveBeenLastCalledWith('three')
    expect(three).toHaveFocus()

    fireEvent.keyDown(three, { key: 'Home' })
    expect(onSelect).toHaveBeenLastCalledWith('one')
    expect(one).toHaveFocus()
  })

  it('focuses a locked tab without selecting it', () => {
    const onSelect = vi.fn()
    render(<Tabs onSelect={onSelect} isLocked={id => id === 'two'} />)
    const [one, two] = screen.getAllByRole('tab')

    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(onSelect).not.toHaveBeenCalled()
    expect(two).toHaveFocus()
  })

  it('ignores unrelated keys without preventing default', () => {
    const onSelect = vi.fn()
    render(<Tabs onSelect={onSelect} />)
    const [one] = screen.getAllByRole('tab')

    const notPrevented = fireEvent.keyDown(one, { key: 'a' })
    expect(notPrevented).toBe(true)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
