import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { LaneInputArea } from '../../src/ui/hud/LaneInputArea.tsx'

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

test('pointer movement does not release a keyboard-held lane', () => {
  const handleInput = vi.fn()
  render(<LaneInputArea onLaneInput={handleInput} />)
  const lane = screen.getAllByRole('button')[0]
  fireEvent.keyDown(lane, { key: ' ' })
  fireEvent.mouseEnter(lane)
  fireEvent.mouseLeave(lane)
  expect(handleInput.mock.calls).toEqual([[0, true]])
  fireEvent.keyUp(lane, { key: ' ' })
  expect(handleInput.mock.calls).toEqual([
    [0, true],
    [0, false]
  ])
})

test('mouse release followed by pointer exit releases only once', () => {
  const handleInput = vi.fn()
  render(<LaneInputArea onLaneInput={handleInput} />)
  const lane = screen.getAllByRole('button')[0]
  fireEvent.mouseDown(lane)
  fireEvent.mouseUp(lane)
  fireEvent.mouseLeave(lane)
  expect(handleInput.mock.calls).toEqual([
    [0, true],
    [0, false]
  ])
})

for (const firstReleased of ['keyboard', 'mouse']) {
  test(`mixed input stays pressed until both sources release (${firstReleased} first)`, () => {
    const handleInput = vi.fn()
    render(<LaneInputArea onLaneInput={handleInput} />)
    const lane = screen.getAllByRole('button')[0]
    fireEvent.keyDown(lane, { key: ' ' })
    fireEvent.mouseDown(lane)
    const releaseKeyboard = () => fireEvent.keyUp(lane, { key: ' ' })
    const releaseMouse = () => fireEvent.mouseLeave(lane)
    if (firstReleased === 'keyboard') releaseKeyboard()
    else releaseMouse()
    expect(handleInput.mock.calls).toEqual([[0, true]])
    if (firstReleased === 'keyboard') releaseMouse()
    else releaseKeyboard()
    expect(handleInput.mock.calls).toEqual([
      [0, true],
      [0, false]
    ])
  })
}
