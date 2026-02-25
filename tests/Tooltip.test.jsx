import { describe, expect, test } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Tooltip } from '../src/ui/shared/Tooltip.jsx'

describe('Tooltip Component', () => {

  test('does not show content initially', () => {
    const { queryByText } = render(
      <Tooltip content="Tooltip Content">
        <button type="button">Hover Me</button>
      </Tooltip>
    )
    expect(queryByText('Tooltip Content')).toBeNull()
  })

  test('shows content on mouse enter and hides on mouse leave', () => {
    const { getByText, queryByText } = render(
      <Tooltip content="Tooltip Content">
        <button type="button">Hover Me</button>
      </Tooltip>
    )
    
    const trigger = getByText('Hover Me').parentElement
    fireEvent.mouseEnter(trigger)
    expect(getByText('Tooltip Content')).toBeInTheDocument()

    fireEvent.mouseLeave(trigger)
    expect(queryByText('Tooltip Content')).toBeNull()
  })

  test('shows content on focus and hides on blur', () => {
    const { getByText, queryByText } = render(
      <Tooltip content="Tooltip Content">
        <button type="button">Hover Me</button>
      </Tooltip>
    )
    
    const trigger = getByText('Hover Me').parentElement
    fireEvent.focus(trigger)
    expect(getByText('Tooltip Content')).toBeInTheDocument()

    fireEvent.blur(trigger)
    expect(queryByText('Tooltip Content')).toBeNull()
  })
})
