import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SONGS_DB } from '../../../data/songs'
import { logger } from '../../../utils/logger'
import { finiteNumberOr } from '../../../utils/finiteNumber'
import { useLeaderboardSyncExhausted } from '../../../hooks/useLeaderboardSync'
import { isLeaderboardSyncEnabled } from '../../../utils/leaderboardSyncFlag'

import { LeaderboardView, LeaderboardEntry, LeaderboardState } from './types'
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

interface LeaderboardTabProps {
  /** Current player, whose stats sync status is shown. */
  playerId: string | null
}

/**
 * Renders leaderboard records inside Band HQ.
 * @param props - The current player's ID.
 */
export const LeaderboardTab = ({ playerId }: LeaderboardTabProps) => {
  const { t } = useTranslation()
  const isSyncExhausted = useLeaderboardSyncExhausted(playerId)
  const isSyncEnabled = isLeaderboardSyncEnabled()

  const [view, setView] = useState<LeaderboardView>('BALANCE')
  const [selectedSongId, setSelectedSongId] = useState<string>(
    () => SONGS_DB[0]?.leaderboardId ?? ''
  )
  const [state, setState] = useState<LeaderboardState>(() =>
    isSyncEnabled ? { status: 'loading' } : { status: 'unavailable' }
  )

  const activeSongId = useMemo(() => {
    if (view !== 'SONG') return ''

    if (selectedSongId) {
      return selectedSongId
    }

    return SONGS_DB[0]?.leaderboardId ?? ''
  }, [selectedSongId, view])

  useEffect(() => {
    if (!isSyncEnabled) return

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
      setState({ status: 'error', message: t('ui:leaderboard.load_error') })
    }, 5000)

    const fetchLeaderboard = async () => {
      setState({ status: 'loading' })

      try {
        const stat = view === 'SONG' ? 'balance' : VIEW_TO_STAT[view]
        let url = `/api/leaderboard/stats?stat=${stat}&limit=100`

        if (view === 'SONG') {
          if (!activeSongId) {
            if (!controller.signal.aborted) {
              setState({ status: 'ready', entries: [] })
            }
            return
          }

          url = `/api/leaderboard/song?songId=${encodeURIComponent(activeSongId)}&limit=100`
        }

        const response = await fetch(url, { signal: controller.signal })
        if (controller.signal.aborted) return
        if (response.status === 404) {
          logger.info('Leaderboard', `Local endpoint unavailable: ${url}`)
          setState({ status: 'unavailable' })
          return
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data: unknown = await response.json()
        if (controller.signal.aborted) return
        if (!Array.isArray(data)) {
          throw new Error('Invalid leaderboard payload')
        }

        const sanitizedEntries: LeaderboardEntry[] = []
        for (let i = 0; i < data.length; i++) {
          const entry = data[i]
          if (typeof entry === 'object' && entry !== null) {
            const raw = entry as Record<string, unknown>
            const own = (key: string): unknown =>
              Object.hasOwn(raw, key) ? raw[key] : undefined
            const rank = own('rank')
            const playerRef = own('playerRef')
            const playerName = own('playerName')
            sanitizedEntries.push({
              rank: typeof rank === 'number' ? rank : 0,
              playerRef:
                typeof playerRef === 'string'
                  ? playerRef
                  : `unknown-player-${i}`,
              playerName:
                typeof playerName === 'string'
                  ? playerName
                  : t('ui:leaderboard.unknownPlayer', {
                      defaultValue: 'Unknown'
                    }),
              score: finiteNumberOr(own('score'), 0)
            })
          }
        }

        if (!controller.signal.aborted) {
          setState({ status: 'ready', entries: sanitizedEntries })
        }
      } catch (fetchError: unknown) {
        if (controller.signal.aborted || isAbortError(fetchError)) return
        logger.error('Leaderboard', 'Fetch failed', fetchError)
        setState({ status: 'error', message: t('ui:leaderboard.load_error') })
      } finally {
        clearTimeout(timeout)
      }
    }

    void fetchLeaderboard()

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [activeSongId, isSyncEnabled, t, view])

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

      {view === 'SONG' && (
        <SongSelector
          activeSongId={activeSongId}
          setSelectedSongId={setSelectedSongId}
        />
      )}

      {isSyncExhausted && (
        <p
          role='status'
          className='font-mono text-sm text-warning-yellow'
          data-testid='leaderboard-sync-disabled-notice'
        >
          {t('ui:leaderboard.sync_disabled')}
        </p>
      )}

      <LeaderboardTable
        view={view}
        state={!isSyncEnabled ? { status: 'unavailable' } : state}
      />

      <p
        className='text-xs text-ash-gray'
        data-testid='leaderboard-honor-notice'
      >
        {t('ui:leaderboard.honor_notice')}
      </p>
    </div>
  )
}
