import React, { useCallback, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { useGameState } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { ActionButton } from '../shared'
import { SONGS_DB, SONGS_BY_ID } from '../../data/songs'

const SongRow = React.memo(({ song, selected, toggleSongInSetlist, t }) => {
  const handleToggle = useCallback(() => {
    toggleSongInSetlist(song.id)
  }, [song.id, toggleSongInSetlist])

  return (
    <div
      className={`flex items-center justify-between p-4 border-2 transition-colors
        ${
          selected
            ? 'border-toxic-green bg-toxic-green/20'
            : 'border-ash-gray bg-void-black/60'
        }`}
    >
      <div className='flex-1'>
        <h4
          className={`font-bold font-mono text-lg uppercase ${selected ? 'text-toxic-green' : 'text-star-white'}`}
        >
          {song.name}
        </h4>
        <div className='flex gap-4 text-xs font-mono text-ash-gray mt-1'>
          <span>
            {t('ui:bandhq.metadata.diff', { defaultValue: 'DIFF' })}:{' '}
            {song.difficulty}/7
          </span>
          <span>
            {t('ui:bandhq.metadata.bpm', { defaultValue: 'BPM' })}: {song.bpm}
          </span>
          <span>
            {t('ui:bandhq.metadata.dur', { defaultValue: 'DUR' })}:{' '}
            {Math.floor(song.duration / 60)}:
            {(song.duration % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <button
        type='button'
        onClick={handleToggle}
        aria-pressed={selected}
        aria-label={
          selected
            ? t('ui:hq.song_deselect_aria', {
                name: song.name,
                defaultValue: 'Remove {{name}} from setlist'
              })
            : t('ui:hq.song_select_aria', {
                name: song.name,
                defaultValue: 'Add {{name}} to setlist'
              })
        }
        className={`px-4 py-2 font-bold uppercase border-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black
          ${
            selected
              ? 'border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black'
              : 'border-ash-gray text-ash-gray hover:border-star-white hover:text-star-white'
          }`}
      >
        {selected
          ? t('ui:hq.song_active', { defaultValue: 'ACTIVE' })
          : t('ui:hq.song_select', { defaultValue: 'SELECT' })}
      </button>
    </div>
  )
})

SongRow.displayName = 'SongRow'

SongRow.propTypes = {
  song: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  toggleSongInSetlist: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export const SetlistTab = ({ setlist, setSetlist, addToast }) => {
  const { t } = useTranslation(['ui', 'venues'])
  const { setCurrentGig, changeScene } = useGameState()

  const latestSetlistRef = useRef(setlist)
  useLayoutEffect(() => {
    latestSetlistRef.current = setlist
  }, [setlist])

  const isSongSelected = useCallback(
    songId => {
      return setlist.some(s => (typeof s === 'string' ? s : s.id) === songId)
    },
    [setlist]
  )

  const toggleSongInSetlist = useCallback(
    songId => {
      const songObj = SONGS_BY_ID.get(songId)
      const songName = songObj ? songObj.name : songId
      const venueName = t('ui:bandhq.venue', { defaultValue: 'Band HQ' })

      const currentList = latestSetlistRef.current
      const currentIndex = currentList.findIndex(
        s => (typeof s === 'string' ? s : s.id) === songId
      )
      const isSelected = currentIndex >= 0

      if (isSelected) {
        addToast(
          t('ui:bandhq.setlist.songRemoved', {
            defaultValue: 'Removed {{song}} from {{venue}}.',
            song: songName,
            venue: venueName
          }),
          'info'
        )
      } else {
        addToast(
          t('ui:bandhq.setlist.songSelected', {
            defaultValue: 'Selected {{song}} for {{venue}}.',
            song: songName,
            venue: venueName
          }),
          'success'
        )
      }

      let nextSetlist
      if (isSelected) {
        nextSetlist = [...currentList]
        nextSetlist.splice(currentIndex, 1)
      } else {
        // Currently allow 1 active song for MVP flow
        nextSetlist = [{ id: songId }]
      }
      latestSetlistRef.current = nextSetlist

      setSetlist(nextSetlist)
    },
    [setSetlist, addToast, t]
  )

  return (
    <div>
      <div className='flex justify-between items-center mb-4 font-mono text-star-white'>
        <ActionButton
          onClick={() => {
            if (setlist.length === 0) {
              addToast(
                t('ui:bandhq.setlist.selectOne', {
                  defaultValue: 'Select at least one song to practice!'
                }),
                'warning'
              )
              return
            }
            setCurrentGig({
              name: t('venues:stendal_proberaum.name'),
              diff: 1,
              venue: t('ui:bandhq.venue', { defaultValue: 'Band HQ' }),
              description: t('ui:hq.practice_desc', {
                defaultValue: 'Practice makes perfect.'
              }),
              isPractice: true
            })
            changeScene(GAME_PHASES.PRACTICE)
          }}
          className='px-4 py-2 text-sm'
        >
          {t('ui:hq.start_practice', { defaultValue: 'START PRACTICE' })}
        </ActionButton>
        <div>
          {t('ui:hq.selected', { defaultValue: 'SELECTED' })}:{' '}
          <span className='text-toxic-green'>{setlist.length}</span>
        </div>
      </div>
      <div className='space-y-2 pb-4'>
        {SONGS_DB.map(song => (
          <SongRow
            key={song.id}
            song={song}
            selected={isSongSelected(song.id)}
            toggleSongInSetlist={toggleSongInSetlist}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}

SetlistTab.propTypes = {
  setlist: PropTypes.array.isRequired,
  setSetlist: PropTypes.func.isRequired,
  addToast: PropTypes.func.isRequired
}
