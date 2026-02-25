import { test, describe, afterEach, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { VolumeSlider } from '../src/ui/shared/VolumeSlider.jsx'

describe('VolumeSlider', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('renders with accessible label association', () => {
    const handleChange = () => {}
    const { getByLabelText } = render(React.createElement(VolumeSlider, { label: 'Music Volume', value: 0.5, onChange: handleChange }))

    const input = getByLabelText('Music Volume')
    assert.ok(input, 'Input should be accessible by visible label')
    assert.equal(input.tagName, 'INPUT')
    assert.equal(input.type, 'range')
  })
})
