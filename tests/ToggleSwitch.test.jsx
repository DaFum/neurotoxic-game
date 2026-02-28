import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleSwitch } from '../src/ui/shared/ToggleSwitch.jsx'

describe('ToggleSwitch', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders correctly with ON state', () => {
    const { getByRole, getByText } = render(
      <ToggleSwitch isOn={true} onToggle={() => {}} ariaLabel='Test Switch' />
    )

    const switchButton = getByRole('switch')
    expect(switchButton).toBeTruthy()
    expect(switchButton.getAttribute('aria-checked')).toBe('true')
    expect(switchButton.getAttribute('aria-label')).toBe('Test Switch')
    expect(switchButton.type).toBe('button')

    // Check visual label
    expect(getByText('ui:toggle.on')).toBeTruthy()
  })

  test('renders correctly with OFF state', () => {
    const { getByRole, getByText } = render(
      <ToggleSwitch isOn={false} onToggle={() => {}} ariaLabel='Test Switch' />
    )

    const switchButton = getByRole('switch')
    expect(switchButton.getAttribute('aria-checked')).toBe('false')

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
    const { getByRole } = render(
      <ToggleSwitch
        isOn={true}
        onToggle={() => {}}
        ariaLabel='Accessible Switch'
      />
    )

    const switchButton = getByRole('switch')
    expect(switchButton).toHaveProperty('type', 'button')
    expect(switchButton.getAttribute('aria-label')).toBe('Accessible Switch')
  })
})
