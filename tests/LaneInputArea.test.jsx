import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { LaneInputArea } from '../src/components/hud/LaneInputArea.jsx'
import React from 'react'

test('LaneInputArea registers clicks on lanes', () => {
  const handleInput = vi.fn()

  render(<LaneInputArea onLaneInput={handleInput} />)

  const lanes = screen.getAllByRole('button')
  expect(lanes).toHaveLength(3)

  fireEvent.mouseDown(lanes[0])
  expect(handleInput).toHaveBeenCalledWith(0, true)

  fireEvent.mouseDown(lanes[2])
  expect(handleInput).toHaveBeenCalledWith(2, true)

  fireEvent.mouseUp(lanes[2])
  expect(handleInput).toHaveBeenCalledWith(2, false)
})
