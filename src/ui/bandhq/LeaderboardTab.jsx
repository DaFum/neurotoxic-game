import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel } from '../shared'
import { logger } from '../../utils/logger'
import { GlitchButton } from '../GlitchButton'
import { SONGS_DB } from '../../data/songs'

/**
 * LeaderboardTab Component
 * Displays global player rankings for balance and song scores.
 */
export const LeaderboardTab = () => {
  const { t } = useTranslation()
  // view can be 'BALANCE', 'SONG', 'FAME', 'FOLLOWERS', 'DISTANCE', 'CONFLICTS', 'STAGE_DIVES'
  const [view, setView] = useState('BALANCE')
  const [selectedSongId, setSelectedSongId] = useState(
    () => SONGS_DB[0]?.leaderboardId || ''
  )
  const [rankings, setRankings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const activeSongId =
    view === 'SONG' && !selectedSongId && SONGS_DB.length > 0
      ? SONGS_DB[0].leaderboardId
      : selectedSongId

  useEffect(() => {
    const controller = new AbortController()

    const fetchLeaderboard = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const viewToStat = {
          BALANCE: 'balance',
          FAME: 'fame',
          FOLLOWERS: 'followers',
          DISTANCE: 'distance',
          CONFLICTS: 'conflicts',
          STAGE_DIVES: 'stage_dives'
        }

        let url = `/api/leaderboard/stats?stat=${viewToStat[view] || 'balance'}&limit=100`

        if (view === 'SONG') {
          if (!activeSongId) {
            setRankings([])
            setIsLoading(false)
            return
          }
          url = `/api/leaderboard/song?songId=${encodeURIComponent(activeSongId)}&limit=100`
        }

        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error('Failed to fetch data')

        const data = await res.json()
        setRankings(data)
      } catch (err) {
        if (err.name === 'AbortError') return
        logger.error('Leaderboard', 'Fetch failed', err)
        setError(t('ui:leaderboard.load_error'))
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchLeaderboard()

    return () => {
      controller.abort()
    }
  }, [view, activeSongId, t])

  const viewTitles = {
    BALANCE: t('ui:leaderboard.top_100_wealth'),
    SONG: t('ui:leaderboard.top_100_scores'),
    FAME: t('ui:leaderboard.top_100_fame', { defaultValue: 'Top 100 Fame' }),
    FOLLOWERS: t('ui:leaderboard.top_100_followers', {
      defaultValue: 'Top 100 Followers'
    }),
    DISTANCE: t('ui:leaderboard.top_100_distance', {
      defaultValue: 'Top 100 Distance'
    }),
    CONFLICTS: t('ui:leaderboard.top_100_conflicts', {
      defaultValue: 'Top 100 Conflicts'
    }),
    STAGE_DIVES: t('ui:leaderboard.top_100_stage_dives', {
      defaultValue: 'Top 100 Stage Dives'
    })
  }

  const views = [
    { id: 'BALANCE', label: t('ui:leaderboard.global_wealth') },
    { id: 'SONG', label: t('ui:leaderboard.song_scores') },
    { id: 'FAME', label: t('ui:leaderboard.fame', { defaultValue: 'Fame' }) },
    {
      id: 'FOLLOWERS',
      label: t('ui:leaderboard.followers', { defaultValue: 'Followers' })
    },
    {
      id: 'DISTANCE',
      label: t('ui:leaderboard.distance', { defaultValue: 'Distance' })
    },
    {
      id: 'CONFLICTS',
      label: t('ui:leaderboard.conflicts', { defaultValue: 'Conflicts' })
    },
    {
      id: 'STAGE_DIVES',
      label: t('ui:leaderboard.stage_dives', { defaultValue: 'Stage Dives' })
    }
  ]

  return (
    <div className='h-full flex flex-col gap-4'>
      {/* View Switcher */}
      <div
        role='tablist'
        className='flex gap-4 mb-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-toxic-green scrollbar-track-void-black touch-pan-x'
      >
        {views.map(({ id, label }) => (
          <GlitchButton
            key={id}
            role='tab'
            aria-selected={view === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => setView(id)}
            className={`whitespace-nowrap ${view === id ? 'opacity-50 cursor-default' : ''}`}
          >
            {label}
          </GlitchButton>
        ))}
      </div>

      {/* Song Selector */}
      {view === 'SONG' && (
        <div className='flex flex-col gap-2'>
          <label
            htmlFor='songSelect'
            className='text-toxic-green font-mono text-sm uppercase'
          >
            {t('ui:leaderboard.select_song')}
          </label>
          <select
            id='songSelect'
            className='bg-void-black border border-toxic-green text-toxic-green p-2 font-mono uppercase focus:outline-none'
            value={activeSongId}
            onChange={e => setSelectedSongId(e.target.value)}
          >
            {SONGS_DB.map(song => (
              <option key={song.id} value={song.leaderboardId}>
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
      )}

      {/* Leaderboard Table */}
      <Panel
        id={`panel-${view}`}
        role='tabpanel'
        aria-labelledby={`tab-${view}`}
        className='flex-1 overflow-hidden flex flex-col'
        title={viewTitles[view]}
      >
        {isLoading && (
          <div className='flex-1 flex items-center justify-center text-toxic-green animate-pulse font-mono'>
            {t('ui:leaderboard.connecting')}
          </div>
        )}

        {error && (
          <div className='flex-1 flex items-center justify-center text-blood-red font-mono'>
            {error}
          </div>
        )}

        {!isLoading && !error && rankings.length === 0 && (
          <div className='flex-1 flex items-center justify-center text-ash-gray font-mono'>
            {t('ui:leaderboard.no_data')}
          </div>
        )}

        {!isLoading && !error && rankings.length > 0 && (
          <div className='flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-toxic-green scrollbar-track-void-black touch-pan-y touch-pinch-zoom'>
            <table className='w-full text-left font-mono'>
              <thead className='text-ash-gray border-b border-ash-gray/30 text-xs uppercase sticky top-0 bg-void-black'>
                <tr>
                  <th className='py-2 px-2'>#</th>
                  <th className='py-2 px-2'>
                    {t('ui:leaderboard.col_player')}
                  </th>
                  <th className='py-2 px-2 text-right'>
                    {view === 'BALANCE'
                      ? t('ui:leaderboard.col_net_worth')
                      : view === 'SONG'
                        ? t('ui:leaderboard.col_score')
                        : t('ui:leaderboard.col_value', {
                            defaultValue: 'Value'
                          })}
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
                      className='border-b border-ash-gray/10 hover:bg-toxic-green/10 transition-colors'
                    >
                      <td className='py-2 px-2 text-toxic-green'>
                        {entry.rank}
                      </td>
                      <td className='py-2 px-2 text-star-white'>
                        {entry.playerName}
                      </td>
                      <td className='py-2 px-2 text-right text-toxic-green'>
                        {view === 'BALANCE'
                          ? `€${safeScore.toLocaleString()}`
                          : view === 'DISTANCE'
                            ? t('ui:leaderboard.col_value_km', {
                                value: safeScore.toLocaleString(),
                                unit: t('ui:unit.km', { defaultValue: 'km' }),
                                defaultValue: `${safeScore.toLocaleString()} km`
                              })
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
