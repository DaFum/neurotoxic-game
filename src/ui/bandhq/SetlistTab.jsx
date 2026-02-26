import PropTypes from 'prop-types'
import { useGameState } from '../../context/GameState'
import { ActionButton } from '../shared'
import { SONGS_DB } from '../../data/songs'

export const SetlistTab = ({ setlist, setSetlist, addToast }) => {
  const { setCurrentGig, changeScene } = useGameState()

  const toggleSongInSetlist = songId => {
    const currentIndex = setlist.findIndex(
      s => (typeof s === 'string' ? s : s.id) === songId
    )

    let newSetlist
    if (currentIndex >= 0) {
      newSetlist = [...setlist]
      newSetlist.splice(currentIndex, 1)
      addToast('Song removed from setlist', 'info')
    } else {
      // Currently allow 1 active song for MVP flow
      newSetlist = [{ id: songId }]
      addToast('Song selected for next Gig', 'success')
    }
    setSetlist(newSetlist)
  }

  const isSongSelected = songId => {
    return setlist.some(s => (typeof s === 'string' ? s : s.id) === songId)
  }

  return (
    <div className='max-h-[60vh] overflow-y-auto'>
      <div className='flex justify-between items-center mb-4 font-mono text-(--star-white)'>
        <ActionButton
          onClick={() => {
            if (setlist.length === 0) {
              addToast('Select at least one song to practice!', 'warning')
              return
            }
            setCurrentGig({
              name: 'Rehearsal Room',
              diff: 1,
              venue: 'Band HQ',
              description: 'Practice makes perfect.',
              isPractice: true
            })
            changeScene('PRACTICE')
          }}
          className='px-4 py-2 text-sm'
        >
          START PRACTICE
        </ActionButton>
        <div>
          SELECTED:{' '}
          <span className='text-(--toxic-green)'>{setlist.length}</span>
        </div>
      </div>
      <div className='space-y-2 pb-4'>
        {SONGS_DB.map(song => {
          const selected = isSongSelected(song.id)
          return (
            <div
              key={song.id}
              className={`flex items-center justify-between p-4 border-2 transition-colors
                ${
                  selected
                    ? 'border-(--toxic-green) bg-(--toxic-green)/20'
                    : 'border-(--ash-gray) bg-(--void-black)/60'
                }`}
            >
              <div className='flex-1'>
                <h4
                  className={`font-bold font-mono text-lg uppercase ${selected ? 'text-(--toxic-green)' : 'text-(--star-white)'}`}
                >
                  {song.name}
                </h4>
                <div className='flex gap-4 text-xs font-mono text-(--ash-gray) mt-1'>
                  <span>DIFF: {song.difficulty}/7</span>
                  <span>BPM: {song.bpm}</span>
                  <span>
                    DUR: {Math.floor(song.duration / 60)}:
                    {(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleSongInSetlist(song.id)}
                className={`px-4 py-2 font-bold uppercase border-2 text-sm transition-all
                  ${
                    selected
                      ? 'border-(--toxic-green) text-(--toxic-green) hover:bg-(--toxic-green) hover:text-(--void-black)'
                      : 'border-(--ash-gray) text-(--ash-gray) hover:border-(--star-white) hover:text-(--star-white)'
                  }`}
              >
                {selected ? 'ACTIVE' : 'SELECT'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

SetlistTab.propTypes = {
  setlist: PropTypes.array.isRequired,
  setSetlist: PropTypes.func.isRequired,
  addToast: PropTypes.func.isRequired
}
