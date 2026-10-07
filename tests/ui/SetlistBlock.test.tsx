import { describe, test, expect, vi } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { SetlistBlock } from '../../src/components/pregig/SetlistBlock'
import { createMotionReactMock } from '../mocks/motionMock'

vi.mock('motion/react', () => createMotionReactMock())

describe('SetlistBlock', () => {
  const sampleSongs = [
    {
      id: 'song1',
      name: 'Anarchy Anthem',
      duration: 180,
      difficulty: 1,
      energy: { peak: 75 }
    },
    {
      id: 'song2',
      name: 'Toxic Distortion',
      duration: 210,
      difficulty: 3,
      energy: { peak: 90 }
    }
  ]

  const songsDict = {
    song1: sampleSongs[0],
    song2: sampleSongs[1]
  }

  test('renders songs and handles selecting unlocked song', () => {
    const toggleSongMock = vi.fn()
    const selectedSongIds = new Set(['song1'])

    const { getAllByRole, getByText } = render(
      <SetlistBlock
        setlist={[{ id: 'song1' }]}
        maxSongs={3}
        songsDb={sampleSongs}
        songsDict={songsDict}
        selectedSongIds={selectedSongIds}
        toggleSong={toggleSongMock}
      />
    )

    const buttons = getAllByRole('button')
    expect(buttons).toHaveLength(2)

    const song1Btn = buttons[0]
    expect(getByText('Anarchy Anthem')).toBeTruthy()
    expect(song1Btn.getAttribute('aria-pressed')).toBe('true')
    expect(song1Btn.getAttribute('aria-disabled')).toBe('false')
    expect(song1Btn.getAttribute('tabindex')).toBe('0')

    const song2Btn = buttons[1]
    expect(getByText('Toxic Distortion')).toBeTruthy()
    expect(song2Btn.getAttribute('aria-pressed')).toBe('false')
    expect(song2Btn.getAttribute('aria-disabled')).toBe('false')

    fireEvent.click(song2Btn)
    expect(toggleSongMock).toHaveBeenCalledWith(sampleSongs[1])
  })

  test('counts the setlist against the given maximum', () => {
    // An Expedition commits four songs; the header must not read "4/3".
    const { getByText } = render(
      <SetlistBlock
        setlist={[
          { id: 'song1' },
          { id: 'song2' },
          { id: 'song3' },
          { id: 'song4' }
        ]}
        maxSongs={4}
        songsDb={sampleSongs}
        songsDict={songsDict}
        selectedSongIds={new Set(['song1', 'song2'])}
        toggleSong={vi.fn()}
      />
    )

    expect(getByText(/4\/4/)).toBeTruthy()
  })

  test('keeps locked song focusable (tabIndex 0) with aria-disabled="true" and tooltip', () => {
    const toggleSongMock = vi.fn()
    const selectedSongIds = new Set<string>()

    // Prove yourself mode locks songs with difficulty > 2
    const playerState = {
      stats: { proveYourselfMode: true }
    }

    const { getAllByRole, queryByRole } = render(
      <SetlistBlock
        setlist={[]}
        maxSongs={3}
        songsDb={sampleSongs}
        songsDict={songsDict}
        selectedSongIds={selectedSongIds}
        player={playerState}
        toggleSong={toggleSongMock}
      />
    )

    const buttons = getAllByRole('button')
    const lockedSongBtn = buttons[1] // Toxic Distortion has difficulty 3 > 2
    expect(lockedSongBtn.getAttribute('aria-disabled')).toBe('true')
    expect(lockedSongBtn.getAttribute('tabindex')).toBe('0')

    // Click on locked song should NOT call toggleSong
    fireEvent.click(lockedSongBtn)
    expect(toggleSongMock).not.toHaveBeenCalled()

    // Focus triggers tooltip
    expect(queryByRole('tooltip')).toBeNull()
    fireEvent.focus(lockedSongBtn)
    const tooltip = queryByRole('tooltip')
    expect(tooltip).not.toBeNull()
    expect(tooltip?.textContent).toContain('ui:pregig.songLockedReason')
  })
})
