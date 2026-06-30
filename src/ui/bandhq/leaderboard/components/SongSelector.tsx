import { useTranslation } from 'react-i18next'
import { SONGS_DB } from '../../../../data/songs'

interface SongSelectorProps {
  activeSongId: string
  setSelectedSongId: (id: string) => void
}

export const SongSelector = ({
  activeSongId,
  setSelectedSongId
}: SongSelectorProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-2'>
      <label
        htmlFor='songSelect'
        className='text-toxic-green font-mono text-sm uppercase'
      >
        {t('ui:leaderboard.select_song')}
      </label>
      <select
        id='songSelect'
        className='bg-void-black border border-toxic-green text-toxic-green p-2 font-mono uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
        value={activeSongId}
        onChange={event => setSelectedSongId(event.target.value)}
      >
        {SONGS_DB.map(song => (
          <option key={song.id} value={song.leaderboardId ?? ''}>
            {song.title || song.id}
          </option>
        ))}
        {SONGS_DB.length === 0 && (
          <option value='' disabled>
            {t('ui:leaderboard.no_songs')}
          </option>
        )}
      </select>
    </div>
  )
}
