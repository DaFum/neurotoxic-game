import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { SetlistTab } from '../src/ui/bandhq/SetlistTab'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import assert from 'node:assert'
import { SONGS_DB } from '../src/data/songs'

describe('SetlistTab', () => {
  beforeEach(() => {
    setupJSDOM()
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
})
