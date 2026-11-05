import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { LaneInputArea } from '../../src/components/hud/LaneInputArea.tsx'

test('LaneInputArea registers clicks and touch events on lanes', () => {
  const handleInput = vi.fn()

  render(<LaneInputArea onLaneInput={handleInput} />)

  const lanes = screen.getAllByRole('button')
  expect(lanes).toHaveLength(3)

  fireEvent.mouseDown(lanes[0])
  expect(handleInput).toHaveBeenCalledTimes(1)
  expect(handleInput).toHaveBeenNthCalledWith(1, 0, true)

  fireEvent.mouseDown(lanes[2])
  expect(handleInput).toHaveBeenCalledTimes(2)
  expect(handleInput).toHaveBeenNthCalledWith(2, 2, true)

  fireEvent.mouseUp(lanes[2])
  expect(handleInput).toHaveBeenCalledTimes(3)
  expect(handleInput).toHaveBeenNthCalledWith(3, 2, false)

  fireEvent.mouseLeave(lanes[0])
  expect(handleInput).toHaveBeenCalledTimes(4)
  expect(handleInput).toHaveBeenNthCalledWith(4, 0, false)

  fireEvent.touchStart(lanes[1])
  expect(handleInput).toHaveBeenCalledTimes(5)
  expect(handleInput).toHaveBeenNthCalledWith(5, 1, true)

  fireEvent.touchEnd(lanes[1])
  expect(handleInput).toHaveBeenCalledTimes(6)
  expect(handleInput).toHaveBeenNthCalledWith(6, 1, false)
})

for (const key of ['Enter', ' ']) {
  test(`LaneInputArea supports ${key} press/release without repeats or synthetic clicks`, () => {
    const handleInput = vi.fn()
    render(<LaneInputArea onLaneInput={handleInput} />)
    const lane = screen.getAllByRole('button')[0]
    fireEvent.keyDown(lane, { key })
    fireEvent.keyDown(lane, { key, repeat: true })
    expect(handleInput.mock.calls).toEqual([[0, true]])
    fireEvent.keyUp(lane, { key })
    fireEvent.click(lane, { detail: 0 })
    expect(handleInput.mock.calls).toEqual([
      [0, true],
      [0, false]
    ])
  })
}

test('LaneInputArea supports assistive click activation and ignores pointer click duplicates', () => {
  const handleInput = vi.fn()
  render(<LaneInputArea onLaneInput={handleInput} />)
  const lane = screen.getAllByRole('button')[1]
  fireEvent.click(lane, { detail: 0 })
  expect(handleInput.mock.calls).toEqual([
    [1, true],
    [1, false]
  ])
  fireEvent.mouseDown(lane)
  fireEvent.mouseUp(lane)
  fireEvent.click(lane, { detail: 1 })
  expect(handleInput.mock.calls).toEqual([
    [1, true],
    [1, false],
    [1, true],
    [1, false]
  ])
})

test('LaneInputArea releases a keyboard-held lane when focus leaves', () => {
  const handleInput = vi.fn()
  render(<LaneInputArea onLaneInput={handleInput} />)
  const lane = screen.getAllByRole('button')[0]
  fireEvent.keyDown(lane, { key: ' ' })
  fireEvent.blur(lane)
  expect(handleInput.mock.calls).toEqual([
    [0, true],
    [0, false]
  ])
})
