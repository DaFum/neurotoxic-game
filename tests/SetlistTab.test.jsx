import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'

import { SONGS_DB } from '../src/data/songs'

// Mock useGameState before importing component
const mockSetCurrentGig = vi.fn()
const mockChangeScene = vi.fn()

vi.mock('../src/context/GameState', () => ({
    useGameState: () => ({
      setCurrentGig: mockSetCurrentGig,
      changeScene: mockChangeScene
    })
  }))
// Import component after mocking
const { SetlistTab } = await import('../src/ui/bandhq/SetlistTab')

describe('SetlistTab', () => {
  beforeEach(() => {
    //  removed (handled by vitest env)
    mockSetCurrentGig.mockReset()
    mockChangeScene.mockReset()
  })

  afterEach(() => {
    cleanup()

    vi.restoreAllMocks()
  })

  it('renders correctly with empty setlist', () => {
    const setSetlist = vi.fn()
    const addToast = vi.fn()
    const { getByText, queryAllByText } = render(
      <SetlistTab setlist={[]} setSetlist={setSetlist} addToast={addToast} />
    )

    expect(getByText(/SELECTED:/))
    expect(getByText('0')).toBeTruthy()
    // Verify some songs are rendered.
    expect(getByText(SONGS_DB[0].name)).toBeTruthy()

    // Check if SELECT buttons are present
    const selectButtons = queryAllByText('SELECT')
    expect(selectButtons).toBeTruthy()
    expect(selectButtons.length).toBe(SONGS_DB.length)
  })

  it('renders correctly with a selected song', () => {
    const selectedSong = SONGS_DB[0]
    const setlist = [{ id: selectedSong.id }]
    const setSetlist = vi.fn()
    const addToast = vi.fn()
    const { getByText, queryAllByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    expect(getByText(/SELECTED:/))
    expect(getByText('1')).toBeTruthy()
    expect(getByText('ACTIVE')).toBeTruthy()

    // Other songs should still have SELECT
    const selectButtons = queryAllByText('SELECT')
    expect(selectButtons).toBeTruthy()
    expect(selectButtons.length).toBe(SONGS_DB.length - 1)
  })

  it('handles song selection (replaces setlist)', () => {
    const setSetlist = vi.fn()
    const addToast = vi.fn()
    const { queryAllByText } = render(
      <SetlistTab setlist={[]} setSetlist={setSetlist} addToast={addToast} />
    )

    const selectButtons = queryAllByText('SELECT')
    fireEvent.click(selectButtons[0])

    expect(setSetlist.mock.calls.length).toBe(1)
    expect(setSetlist.mock.calls[0][0]).toEqual([{ id: SONGS_DB[0].id }])

    expect(addToast.mock.calls.length).toBe(1)
    expect(addToast.mock.calls[0][0]).toBe('Song selected for next Gig')
    expect(addToast.mock.calls[0][1]).toBe('success')
  })

  it('handles song removal', () => {
    const selectedSong = SONGS_DB[0]
    const setlist = [{ id: selectedSong.id }]
    const setSetlist = vi.fn()
    const addToast = vi.fn()
    const { getByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    const activeButton = getByText('ACTIVE')
    fireEvent.click(activeButton)

    expect(setSetlist.mock.calls.length).toBe(1)
    expect(setSetlist.mock.calls[0][0]).toEqual([])

    expect(addToast.mock.calls.length).toBe(1)
    expect(addToast.mock.calls[0][0]).toBe('Song removed from setlist')
    expect(addToast.mock.calls[0][1]).toBe('info')
  })

  it('handles setlist with string IDs', () => {
    const selectedSong = SONGS_DB[0]
    const setlist = [selectedSong.id] // string instead of object
    const setSetlist = vi.fn()
    const addToast = vi.fn()
    const { getByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    expect(getByText('ACTIVE'))

    const activeButton = getByText('ACTIVE')
    fireEvent.click(activeButton)

    expect(setSetlist.mock.calls.length).toBe(1)
    expect(setSetlist.mock.calls[0][0]).toEqual([])
  })

  it('starts practice mode when button is clicked with songs selected', () => {
    const selectedSong = SONGS_DB[0]
    const setlist = [{ id: selectedSong.id }]
    const setSetlist = vi.fn()
    const addToast = vi.fn()
    const { getByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    const practiceButton = getByText('START PRACTICE')
    fireEvent.click(practiceButton)

    expect(mockSetCurrentGig.mock.calls.length).toBe(1)
    const gigData = mockSetCurrentGig.mock.calls[0][0]
    expect(gigData.name).toBeTruthy()
    expect(gigData.isPractice).toBe(true)

    expect(mockChangeScene.mock.calls.length).toBe(1)
    expect(mockChangeScene.mock.calls[0][0]).toBe('PRACTICE')
  })

  it('shows warning when starting practice with empty setlist', () => {
    const setlist = []
    const setSetlist = vi.fn()
    const addToast = vi.fn()
    const { getByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    const practiceButton = getByText('START PRACTICE')
    fireEvent.click(practiceButton)

    expect(mockSetCurrentGig.mock.calls.length).toBe(0)
    expect(mockChangeScene.mock.calls.length).toBe(0)

    expect(addToast.mock.calls.length).toBe(1)
    expect(addToast.mock.calls[0][0]).toBe('Select at least one song to practice!')
    expect(addToast.mock.calls[0][1]).toBe('warning')
  })
})
