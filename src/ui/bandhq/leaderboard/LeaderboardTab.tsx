import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SONGS_DB } from '../../../data/songs'
import { logger } from '../../../utils/logger'
import { finiteNumberOr } from '../../../utils/finiteNumber'

import { LeaderboardView, LeaderboardEntry } from './types'
import { LeaderboardTabs } from './components/LeaderboardTabs'
import { SongSelector } from './components/SongSelector'
import { LeaderboardTable } from './components/LeaderboardTable'

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

/**
 * Renders leaderboard records inside Band HQ.
 */
export const LeaderboardTab = () => {
  const { t } = useTranslation()
  const [view, setView] = useState<LeaderboardView>('BALANCE')
  const [selectedSongId, setSelectedSongId] = useState<string>(
    () => SONGS_DB[0]?.leaderboardId ?? ''
  )
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUnavailable, setIsUnavailable] = useState(false)

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
      setIsUnavailable(false)

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
        if (response.status === 404) {
          logger.info('Leaderboard', `Local endpoint unavailable: ${url}`)
          setRankings([])
          setIsUnavailable(true)
          return
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data: unknown = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('Invalid leaderboard payload')
        }

        const sanitizedEntries = []
        for (let i = 0; i < data.length; i++) {
          const entry = data[i]
          if (typeof entry === 'object' && entry !== null) {
            sanitizedEntries.push({
              rank:
                Object.hasOwn(entry, 'rank') &&
                typeof (entry as Record<string, unknown>).rank === 'number'
                  ? ((entry as Record<string, unknown>).rank as number)
                  : 0,
              playerId:
                Object.hasOwn(entry, 'playerId') &&
                typeof (entry as Record<string, unknown>).playerId === 'string'
                  ? ((entry as Record<string, unknown>).playerId as string)
                  : `unknown-player-${i}`,
              playerName:
                Object.hasOwn(entry, 'playerName') &&
                typeof (entry as Record<string, unknown>).playerName ===
                  'string'
                  ? ((entry as Record<string, unknown>).playerName as string)
                  : t('ui:leaderboard.unknownPlayer', {
                      defaultValue: 'Unknown'
                    }),
              score: finiteNumberOr(
                Object.hasOwn(entry, 'score')
                  ? (entry as Record<string, unknown>).score
                  : 0,
                0
              )
            })
          }
        }

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
      <LeaderboardTabs view={view} setView={setView} views={views} />

      {view === 'SONG' && <SongSelector activeSongId={activeSongId} setSelectedSongId={setSelectedSongId} />}

      <LeaderboardTable
        view={view}
        isLoading={isLoading}
        error={error}
        isUnavailable={isUnavailable}
        rankings={rankings}
      />
    </div>
  )
}
