import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import assert from 'node:assert'
import { SONGS_DB } from '../src/data/songs'

// Mock useGameState before importing component
const mockSetCurrentGig = mock.fn()
const mockChangeScene = mock.fn()

mock.module('../src/context/GameState', {
  namedExports: {
    useGameState: () => ({
      setCurrentGig: mockSetCurrentGig,
      changeScene: mockChangeScene
    })
  }
})

// Import component after mocking
const { SetlistTab } = await import('../src/ui/bandhq/SetlistTab')

describe('SetlistTab', () => {
  beforeEach(() => {
    setupJSDOM()
    mockSetCurrentGig.mock.resetCalls()
    mockChangeScene.mock.resetCalls()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
    mock.restoreAll()
  })

  it('renders correctly with empty setlist', () => {
    const setSetlist = mock.fn()
    const addToast = mock.fn()
    const { getByText, getAllByText } = render(
      <SetlistTab setlist={[]} setSetlist={setSetlist} addToast={addToast} />
    )

    assert.ok(getByText(/SELECTED:/))
    assert.ok(getByText('0'))
    // Verify some songs are rendered.
    assert.ok(getByText(SONGS_DB[0].name))

    // Check if SELECT buttons are present
    const selectButtons = getAllByText('SELECT')
    assert.strictEqual(selectButtons.length, SONGS_DB.length)
  })

  it('renders correctly with a selected song', () => {
    const selectedSong = SONGS_DB[0]
    const setlist = [{ id: selectedSong.id }]
    const setSetlist = mock.fn()
    const addToast = mock.fn()
    const { getByText, getAllByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    assert.ok(getByText(/SELECTED:/))
    assert.ok(getByText('1'))
    assert.ok(getByText('ACTIVE'))

    // Other songs should still have SELECT
    const selectButtons = getAllByText('SELECT')
    assert.strictEqual(selectButtons.length, SONGS_DB.length - 1)
  })

  it('handles song selection (replaces setlist)', () => {
    const setSetlist = mock.fn()
    const addToast = mock.fn()
    const { getAllByText } = render(
      <SetlistTab setlist={[]} setSetlist={setSetlist} addToast={addToast} />
    )

    const selectButtons = getAllByText('SELECT')
    fireEvent.click(selectButtons[0])

    assert.strictEqual(setSetlist.mock.calls.length, 1)
    assert.deepStrictEqual(setSetlist.mock.calls[0].arguments[0], [{ id: SONGS_DB[0].id }])

    assert.strictEqual(addToast.mock.calls.length, 1)
    assert.strictEqual(addToast.mock.calls[0].arguments[0], 'Song selected for next Gig')
    assert.strictEqual(addToast.mock.calls[0].arguments[1], 'success')
  })

  it('handles song removal', () => {
    const selectedSong = SONGS_DB[0]
    const setlist = [{ id: selectedSong.id }]
    const setSetlist = mock.fn()
    const addToast = mock.fn()
    const { getByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    const activeButton = getByText('ACTIVE')
    fireEvent.click(activeButton)

    assert.strictEqual(setSetlist.mock.calls.length, 1)
    assert.deepStrictEqual(setSetlist.mock.calls[0].arguments[0], [])

    assert.strictEqual(addToast.mock.calls.length, 1)
    assert.strictEqual(addToast.mock.calls[0].arguments[0], 'Song removed from setlist')
    assert.strictEqual(addToast.mock.calls[0].arguments[1], 'info')
  })

  it('handles setlist with string IDs', () => {
    const selectedSong = SONGS_DB[0]
    const setlist = [selectedSong.id] // string instead of object
    const setSetlist = mock.fn()
    const addToast = mock.fn()
    const { getByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    assert.ok(getByText('ACTIVE'))

    const activeButton = getByText('ACTIVE')
    fireEvent.click(activeButton)

    assert.strictEqual(setSetlist.mock.calls.length, 1)
    assert.deepStrictEqual(setSetlist.mock.calls[0].arguments[0], [])
  })

  it('starts practice mode when button is clicked with songs selected', () => {
    const selectedSong = SONGS_DB[0]
    const setlist = [{ id: selectedSong.id }]
    const setSetlist = mock.fn()
    const addToast = mock.fn()
    const { getByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    const practiceButton = getByText('START PRACTICE')
    fireEvent.click(practiceButton)

    assert.strictEqual(mockSetCurrentGig.mock.calls.length, 1)
    const gigData = mockSetCurrentGig.mock.calls[0].arguments[0]
    assert.strictEqual(gigData.name, 'Rehearsal Room')
    assert.strictEqual(gigData.isPractice, true)

    assert.strictEqual(mockChangeScene.mock.calls.length, 1)
    assert.strictEqual(mockChangeScene.mock.calls[0].arguments[0], 'PRACTICE')
  })

  it('shows warning when starting practice with empty setlist', () => {
    const setlist = []
    const setSetlist = mock.fn()
    const addToast = mock.fn()
    const { getByText } = render(
      <SetlistTab setlist={setlist} setSetlist={setSetlist} addToast={addToast} />
    )

    const practiceButton = getByText('START PRACTICE')
    fireEvent.click(practiceButton)

    assert.strictEqual(mockSetCurrentGig.mock.calls.length, 0)
    assert.strictEqual(mockChangeScene.mock.calls.length, 0)

    assert.strictEqual(addToast.mock.calls.length, 1)
    assert.strictEqual(addToast.mock.calls[0].arguments[0], 'Select at least one song to practice!')
    assert.strictEqual(addToast.mock.calls[0].arguments[1], 'warning')
  })
})
