import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleSwitch } from '../../src/ui/shared/ToggleSwitch.tsx'
import { BrutalToggle } from '../../src/ui/shared/BrutalistUI.tsx'

describe('ToggleSwitch', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders correctly with ON state', () => {
    const { getByRole, getByText, container } = render(
      <ToggleSwitch isOn={true} onToggle={() => {}} ariaLabel='Test Switch' />
    )

    const switchButton = getByRole('switch')
    expect(switchButton).toBeTruthy()
    expect(switchButton.getAttribute('aria-checked')).toBe('true')

    const labelledById = switchButton.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()

    const labelElement = container.querySelector(`[id="${labelledById}"]`)
    expect(labelElement).toBeTruthy()
    expect(labelElement.textContent).toBe('Test Switch')

    expect(switchButton.type).toBe('button')

    // Check visual label
    expect(getByText('ui:toggle.on')).toBeTruthy()
  })

  test('renders correctly with OFF state', () => {
    const { getByRole, getByText, container } = render(
      <ToggleSwitch isOn={false} onToggle={() => {}} ariaLabel='Test Switch' />
    )

    const switchButton = getByRole('switch')
    expect(switchButton.getAttribute('aria-checked')).toBe('false')

    const labelledById = switchButton.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()

    const labelElement = container.querySelector(`[id="${labelledById}"]`)
    expect(labelElement).toBeTruthy()
    expect(labelElement.textContent).toBe('Test Switch')

    // Check visual label
    expect(getByText('ui:toggle.off')).toBeTruthy()
  })

  test('calls onToggle when clicked', () => {
    const handleToggle = vi.fn()
    const { getByRole } = render(
      <ToggleSwitch
        isOn={false}
        onToggle={handleToggle}
        ariaLabel='Test Switch'
      />
    )

    const switchButton = getByRole('switch')
    fireEvent.click(switchButton)

    expect(handleToggle).toHaveBeenCalledTimes(1)
  })

  test('calls onToggle when Space or Enter is pressed', async () => {
    const user = userEvent.setup()
    const handleToggle = vi.fn()
    const { getByRole } = render(
      <ToggleSwitch
        isOn={false}
        onToggle={handleToggle}
        ariaLabel='Test Switch'
      />
    )

    const switchButton = getByRole('switch')
    switchButton.focus()
    await user.keyboard(' ')
    await user.keyboard('{Enter}')

    expect(handleToggle).toHaveBeenCalledTimes(2)
  })

  test('has correct accessibility attributes', () => {
    const { getByRole, container } = render(
      <ToggleSwitch
        isOn={true}
        onToggle={() => {}}
        ariaLabel='Accessible Switch'
      />
    )

    const switchButton = getByRole('switch')
    expect(switchButton).toHaveProperty('type', 'button')
    const labelledById = switchButton.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()
    const labelElement = container.querySelector(`[id="${labelledById}"]`)
    expect(labelElement).toBeTruthy()
    expect(labelElement.textContent).toBe('Accessible Switch')
  })

  test('BrutalToggle delegates to the accessible shared switch primitive', () => {
    const { getByRole } = render(
      <BrutalToggle label='Legacy Brutal Switch' initialState={false} />
    )

    const switchButton = getByRole('switch', {
      name: 'Legacy Brutal Switch'
    })
    expect(switchButton.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(switchButton)

    expect(switchButton.getAttribute('aria-checked')).toBe('true')
  })

  test('BrutalToggle controlled mode tracks the `isOn` prop across renders', () => {
    const handleToggle = vi.fn()
    const { getByRole, rerender } = render(
      <BrutalToggle label='Ctrl' isOn={false} onToggle={handleToggle} />
    )
    const switchButton = getByRole('switch', { name: 'Ctrl' })
    expect(switchButton.getAttribute('aria-checked')).toBe('false')

    rerender(<BrutalToggle label='Ctrl' isOn={true} onToggle={handleToggle} />)
    expect(switchButton.getAttribute('aria-checked')).toBe('true')

    // Clicking in controlled mode reports the next value but defers
    // commitment to the parent — the rendered state stays pinned to the prop.
    fireEvent.click(switchButton)
    expect(handleToggle).toHaveBeenCalledWith(false)
    expect(switchButton.getAttribute('aria-checked')).toBe('true')
  })

  test('BrutalToggle preserves controlled value when reverting to uncontrolled', () => {
    const { getByRole, rerender } = render(
      <BrutalToggle label='Ctrl' isOn={true} initialState={false} />
    )
    const switchButton = getByRole('switch', { name: 'Ctrl' })
    expect(switchButton.getAttribute('aria-checked')).toBe('true')

    // Drop the controlled `isOn` prop. The rendered state should retain the
    // last controlled value (true), not snap to `initialState` (false).
    rerender(<BrutalToggle label='Ctrl' initialState={false} />)
    expect(switchButton.getAttribute('aria-checked')).toBe('true')
  })
})
