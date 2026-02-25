import { test, describe, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { Tooltip } from '../src/ui/shared/Tooltip.jsx'

describe('Tooltip Component', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('does not show content initially', () => {
    const { queryByText } = render(
      <Tooltip content="Tooltip Content">
        <button>Hover Me</button>
      </Tooltip>
    )
    assert.equal(queryByText('Tooltip Content'), null)
  })

  test('shows content on mouse enter and hides on mouse leave', () => {
    const { getByText, queryByText } = render(
      <Tooltip content="Tooltip Content">
        <button>Hover Me</button>
      </Tooltip>
    )
    
    const trigger = getByText('Hover Me').parentElement
    fireEvent.mouseEnter(trigger)
    assert.ok(getByText('Tooltip Content'))

    fireEvent.mouseLeave(trigger)
    assert.equal(queryByText('Tooltip Content'), null)
  })

  test('shows content on focus and hides on blur', () => {
    const { getByText, queryByText } = render(
      <Tooltip content="Tooltip Content">
        <button>Hover Me</button>
      </Tooltip>
    )
    
    const trigger = getByText('Hover Me').parentElement
    fireEvent.focus(trigger)
    assert.ok(getByText('Tooltip Content'))

    fireEvent.blur(trigger)
    assert.equal(queryByText('Tooltip Content'), null)
  })
})
