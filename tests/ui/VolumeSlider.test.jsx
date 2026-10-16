import React from 'react'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { VolumeSlider } from '../../src/ui/shared/VolumeSlider.tsx'

describe('VolumeSlider', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders with accessible label association', () => {
    const handleChange = () => {}
    const { getByLabelText } = render(
      React.createElement(VolumeSlider, {
        label: 'Music Volume',
        value: 0.5,
        onChange: handleChange
      })
    )

    const input = getByLabelText('Music Volume')
    expect(input).toBeTruthy()
    expect(input.tagName).toBe('INPUT')
    expect(input.type).toBe('range')

    expect(input.getAttribute('aria-valuetext')).toBe('50%')
    expect(input.getAttribute('aria-valuenow')).toBe('0.5')
    expect(input.getAttribute('aria-orientation')).toBe('horizontal')
  })

  test('focuses range input when segment is selected', () => {
    const handleChange = vi.fn()
    const { getByLabelText, container } = render(
      React.createElement(VolumeSlider, {
        label: 'Music Volume',
        value: 0.5,
        onChange: handleChange
      })
    )

    const input = getByLabelText('Music Volume')
    const segmentButtons = container.querySelectorAll('button')
    expect(segmentButtons.length).toBeGreaterThan(0)

    fireEvent.click(segmentButtons[0])
    expect(handleChange).toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
  })

  test('delivers range input changes as a clamped number', () => {
    const handleChange = vi.fn()
    const { getByLabelText } = render(
      React.createElement(VolumeSlider, {
        label: 'Music Volume',
        value: 0.5,
        onChange: handleChange
      })
    )

    fireEvent.change(getByLabelText('Music Volume'), {
      target: { value: '0.7' }
    })

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(0.7)
  })

  test('delivers segment selection as the segment fraction', () => {
    const handleChange = vi.fn()
    const { container } = render(
      React.createElement(VolumeSlider, {
        label: 'Music Volume',
        value: 0.5,
        onChange: handleChange
      })
    )

    fireEvent.click(container.querySelectorAll('button')[2])

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(0.3)
  })

  test('forwards ariaDescribedBy prop to underlying range input', () => {
    const handleChange = () => {}
    const { getByLabelText } = render(
      React.createElement(VolumeSlider, {
        label: 'Music Volume',
        value: 0.5,
        ariaDescribedBy: 'volume-desc-id',
        onChange: handleChange
      })
    )

    const input = getByLabelText('Music Volume')
    expect(input.getAttribute('aria-describedby')).toBe('volume-desc-id')
  })
})
