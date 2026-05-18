import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { VolumeSlider } from '../../src/ui/shared/VolumeSlider.tsx'
import { BrutalFader } from '../../src/ui/shared/BrutalistUI.tsx'

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

    // Also verify aria-valuetext if we implement it
    // expect(input.getAttribute('aria-valuetext')).toBe('50%')
  })

  test('BrutalFader delegates to the shared segmented slider primitive', () => {
    const { getByLabelText, getByText } = render(
      React.createElement(BrutalFader, {
        label: 'Master Gain',
        initialValue: 7,
        max: 10
      })
    )

    const input = getByLabelText('Master Gain')
    expect(input).toBeTruthy()
    expect(input.tagName).toBe('INPUT')
    expect(input.type).toBe('range')
    expect(input.value).toBe('7')
    expect(getByText('7')).toBeTruthy()
  })

  test('BrutalFader controlled mode tracks the `value` prop across renders', () => {
    const { getByLabelText, rerender } = render(
      React.createElement(BrutalFader, {
        label: 'Master Gain',
        value: 4,
        onChange: () => {},
        max: 10
      })
    )

    const input = getByLabelText('Master Gain')
    expect(input.value).toBe('4')

    rerender(
      React.createElement(BrutalFader, {
        label: 'Master Gain',
        value: 9,
        onChange: () => {},
        max: 10
      })
    )
    expect(input.value).toBe('9')
  })

  test('BrutalFader clamps controlled values above max', () => {
    const { getByLabelText } = render(
      React.createElement(BrutalFader, {
        label: 'Gain',
        value: 50, // above max
        max: 10
      })
    )
    expect(getByLabelText('Gain').value).toBe('10')
  })

  test('BrutalFader treats NaN/Infinity as uncontrolled at mount', () => {
    const { getByLabelText, unmount } = render(
      React.createElement(BrutalFader, {
        label: 'GainNaN',
        value: Number.NaN,
        initialValue: 3,
        max: 10
      })
    )
    expect(getByLabelText('GainNaN').value).toBe('3')
    unmount()

    const { getByLabelText: getByLabelText2 } = render(
      React.createElement(BrutalFader, {
        label: 'GainInf',
        value: Number.POSITIVE_INFINITY,
        initialValue: 5,
        max: 10
      })
    )
    expect(getByLabelText2('GainInf').value).toBe('5')
  })

  test('BrutalFader preserves last controlled value when reverting to uncontrolled', () => {
    const { getByLabelText, rerender } = render(
      React.createElement(BrutalFader, {
        label: 'Gain',
        value: 6,
        max: 10
      })
    )
    expect(getByLabelText('Gain').value).toBe('6')

    // Switch to uncontrolled — should retain the last controlled value
    // instead of snapping back to `initialValue` (default 7).
    rerender(
      React.createElement(BrutalFader, {
        label: 'Gain',
        max: 10
      })
    )
    expect(getByLabelText('Gain').value).toBe('6')
  })
})
