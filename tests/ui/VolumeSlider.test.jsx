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
})
