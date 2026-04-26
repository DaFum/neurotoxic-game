import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SONGS_DB } from '../../data/songs'
import { logger } from '../../utils/logger'
import { GlitchButton } from '../GlitchButton'

type LeaderboardView =
  | 'BALANCE'
  | 'SONG'
  | 'FAME'
  | 'FOLLOWERS'
  | 'DISTANCE'
  | 'CONFLICTS'
  | 'STAGE_DIVES'

type LeaderboardEntry = {
  rank: number
  playerId: string
  playerName: string
  score: number
}

const VIEW_TO_STAT = {
  BALANCE: 'balance',
  FAME: 'fame',
  FOLLOWERS: 'followers',
  DISTANCE: 'distance',
  CONFLICTS: 'conflicts',
  STAGE_DIVES: 'stage_dives'
} as const satisfies Record<Exclude<LeaderboardView, 'SONG'>, string>

const isAbortError = (error: unknown): boolean => {
  return error instanceof DOMException && error.name === 'AbortError'
}

export const LeaderboardTab = () => {
  const { t } = useTranslation()
  const [view, setView] = useState<LeaderboardView>('BALANCE')
  const [selectedSongId, setSelectedSongId] = useState<string>(
    () => SONGS_DB[0]?.leaderboardId ?? ''
  )
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSongId = useMemo(() => {
    if (view !== 'SONG') return ''

    if (selectedSongId) {
      return selectedSongId
    }

    return SONGS_DB[0]?.leaderboardId ?? ''
  }, [selectedSongId, view])

  useEffect(() => {
    const controller = new AbortController()

    const fetchLeaderboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const stat = view === 'SONG' ? 'balance' : VIEW_TO_STAT[view]
        let url = `/api/leaderboard/stats?stat=${stat}&limit=100`

        if (view === 'SONG') {
          if (!activeSongId) {
            setRankings([])
            return
          }

          url = `/api/leaderboard/song?songId=${encodeURIComponent(activeSongId)}&limit=100`
        }

        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data: unknown = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('Invalid leaderboard payload')
        }

        const sanitizedEntries = data
          .filter(
            (
              entry
            ): entry is Partial<LeaderboardEntry> & Record<string, unknown> =>
              typeof entry === 'object' && entry !== null
          )
          .map(entry => ({
            rank: typeof entry.rank === 'number' ? entry.rank : 0,
            playerId:
              typeof entry.playerId === 'string'
                ? entry.playerId
                : 'unknown-player',
            playerName:
              typeof entry.playerName === 'string'
                ? entry.playerName
                : t('ui:leaderboard.unknownPlayer', {
                    defaultValue: 'Unknown'
                  }),
            score: typeof entry.score === 'number' ? entry.score : 0
          }))

        setRankings(sanitizedEntries)
      } catch (fetchError: unknown) {
        if (isAbortError(fetchError)) return
        logger.error('Leaderboard', 'Fetch failed', fetchError)
        setError(t('ui:leaderboard.load_error'))
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchLeaderboard()

    return () => {
      controller.abort()
    }
  }, [activeSongId, t, view])

  const views: Array<{ id: LeaderboardView; label: string }> = useMemo(
    () => [
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
    ],
    [t]
  )

  return (
    <div className='h-full flex flex-col gap-4'>
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
            onClick={() => {
              if (view !== id) setView(id)
            }}
            disabled={view === id}
            className={`whitespace-nowrap ${view === id ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          >
            {label}
          </GlitchButton>
        ))}
      </div>

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
            className='bg-void-black border border-toxic-green text-toxic-green p-2 font-mono uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
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
      )}

      <div
        id={`panel-${view}`}
        role='tabpanel'
        aria-labelledby={`tab-${view}`}
        className='flex-1 overflow-hidden flex flex-col'
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
                  const safeScore = Number.isFinite(entry?.score)
                    ? entry?.score
                    : 0
                  return (
                    <tr
                      key={entry?.playerId}
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
      </div>
    </div>
  )
}
