import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { Panel } from '../shared'
import { logger } from '../../utils/logger'
import { GlitchButton } from '../GlitchButton'

/**
 * LeaderboardTab Component
 * Displays global player rankings for balance and song scores.
 */
export const LeaderboardTab = ({ setlist }) => {
  const { t } = useTranslation()
  const [view, setView] = useState('BALANCE') // 'BALANCE' or 'SONG'
  const [selectedSongId, setSelectedSongId] = useState(setlist[0]?.id || '')
  const [rankings, setRankings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // If we switch to song view and have no song selected, try to select the first one
    if (view === 'SONG' && !selectedSongId && setlist.length > 0) {
      setSelectedSongId(setlist[0].id)
    }
  }, [view, selectedSongId, setlist])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true)
      setError(null)
      try {
        let url = '/api/leaderboard/balance?limit=100'
        if (view === 'SONG') {
          if (!selectedSongId) {
            setRankings([])
            setIsLoading(false)
            return
          }
          url = `/api/leaderboard/song?songId=${encodeURIComponent(selectedSongId)}&limit=100`
        }

        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch data')

        const data = await res.json()
        setRankings(data)
      } catch (err) {
        logger.error('Leaderboard', 'Fetch failed', err)
        setError('Could not load rankings.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [view, selectedSongId])

  return (
    <div className='h-full flex flex-col gap-4'>
      {/* View Switcher */}
      <div className='flex gap-4 mb-2'>
        <GlitchButton
          onClick={() => setView('BALANCE')}
          disabled={view === 'BALANCE'}
          className={view === 'BALANCE' ? 'opacity-50 cursor-default' : ''}
        >
          {t('ui:leaderboard.global_wealth')}
        </GlitchButton>
        <GlitchButton
          onClick={() => setView('SONG')}
          disabled={view === 'SONG'}
          className={view === 'SONG' ? 'opacity-50 cursor-default' : ''}
        >
          {t('ui:leaderboard.song_scores')}
        </GlitchButton>
      </div>

      {/* Song Selector */}
      {view === 'SONG' && (
        <div className='flex flex-col gap-2'>
          <label
            htmlFor='songSelect'
            className='text-(--toxic-green) font-mono text-sm uppercase'
          >
            {t('ui:leaderboard.select_song')}
          </label>
          <select
            id='songSelect'
            className='bg-(--void-black) border border-(--toxic-green) text-(--toxic-green) p-2 font-mono uppercase focus:outline-none'
            value={selectedSongId}
            onChange={e => setSelectedSongId(e.target.value)}
          >
            {setlist.map(song => (
              <option key={song.id} value={song.id}>
                {song.title || song.id}
              </option>
            ))}
            {setlist.length === 0 && (
              <option value='' disabled>
                {t('ui:leaderboard.no_songs')}
              </option>
            )}
          </select>
        </div>
      )}

      {/* Leaderboard Table */}
      <Panel
        className='flex-1 overflow-hidden flex flex-col'
        title={
          view === 'BALANCE'
            ? t('ui:leaderboard.top_100_wealth')
            : t('ui:leaderboard.top_100_scores')
        }
      >
        {isLoading && (
          <div className='flex-1 flex items-center justify-center text-(--toxic-green) animate-pulse font-mono'>
            {t('ui:leaderboard.connecting')}
          </div>
        )}

        {error && (
          <div className='flex-1 flex items-center justify-center text-(--blood-red) font-mono'>
            {error}
          </div>
        )}

        {!isLoading && !error && rankings.length === 0 && (
          <div className='flex-1 flex items-center justify-center text-(--ash-gray) font-mono'>
            {t('ui:leaderboard.no_data')}
          </div>
        )}

        {!isLoading && !error && rankings.length > 0 && (
          <div className='overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-(--toxic-green) scrollbar-track-(--void-black)'>
            <table className='w-full text-left font-mono'>
              <thead className='text-(--ash-gray) border-b border-(--ash-gray)/30 text-xs uppercase sticky top-0 bg-(--void-black)'>
                <tr>
                  <th className='py-2 px-2'>#</th>
                  <th className='py-2 px-2'>
                    {t('ui:leaderboard.col_player')}
                  </th>
                  <th className='py-2 px-2 text-right'>
                    {view === 'BALANCE'
                      ? t('ui:leaderboard.col_net_worth')
                      : t('ui:leaderboard.col_score')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankings.map(entry => {
                  const safeScore = Number.isFinite(entry.score)
                    ? entry.score
                    : 0
                  return (
                    <tr
                      key={entry.playerId}
                      className='border-b border-(--ash-gray)/10 hover:bg-(--toxic-green)/10 transition-colors'
                    >
                      <td className='py-2 px-2 text-(--toxic-green)'>
                        {entry.rank}
                      </td>
                      <td className='py-2 px-2 text-(--star-white)'>
                        {entry.playerName}
                      </td>
                      <td className='py-2 px-2 text-right text-(--toxic-green)'>
                        {view === 'BALANCE'
                          ? `€${safeScore.toLocaleString()}`
                          : safeScore.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

LeaderboardTab.propTypes = {
  setlist: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string
    })
  ).isRequired
}
