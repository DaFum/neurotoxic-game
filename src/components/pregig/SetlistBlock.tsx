import { memo, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getSongId } from '../../utils/audio/audioEngine'
import { Tooltip } from '../../ui/shared/Tooltip'
import { buildSetlistChartDensity } from '../../utils/chartDensity'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import type { Song } from '../../types/audio'

interface SetlistPlayerState {
  stats?: {
    proveYourselfMode?: boolean
  }
}

interface SongRowProps {
  song: Song
  isSelected: boolean
  isLocked: boolean
  toggleSong: (song: Song) => void
}

interface SetlistBlockProps {
  setlist: RhythmSetlistEntry[]
  songsDb: Song[]
  songsDict: Record<string, Song>
  player?: SetlistPlayerState
  selectedSongIds: Set<string>
  toggleSong: (song: Song) => void
}

const SongRow = memo(function SongRow({
  song,
  isSelected,
  isLocked,
  toggleSong
}: SongRowProps) {
  const { t } = useTranslation('ui')
  const handleToggle = useCallback(() => {
    if (isLocked) return
    toggleSong(song)
  }, [isLocked, song, toggleSong])

  const buttonContent = (
    <button
      type='button'
      aria-label={t('ui:pregig.selectSong', { name: song.name })}
      aria-pressed={!!isSelected}
      aria-disabled={isLocked}
      tabIndex={isLocked ? -1 : 0}
      onClick={handleToggle}
      className={`p-3 border-2 flex justify-between items-center transition-all w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${
          isSelected
            ? 'border-toxic-green bg-toxic-green/10 text-toxic-green shadow-[0_0_8px_var(--color-toxic-green-20)]'
            : isLocked
              ? 'border-blood-red/50 bg-blood-red/10 text-blood-red-bright'
              : 'border-ash-gray/20 hover:border-star-white/40 text-ash-gray'
        }`}
    >
      <div>
        <div className='font-bold text-sm'>
          {song.name}{' '}
          {isLocked && (
            <span className='text-xs text-blood-red ml-2 border border-blood-red/50 px-1'>
              {t('ui:pregig.locked')}
            </span>
          )}
        </div>
        <div className='text-xs font-mono mt-0.5 flex gap-2'>
          <span>{t('ui:seconds', { count: song.duration })}</span>
          <span className='text-ash-gray/40'>|</span>
          <span>
            {t('ui:pregig.diff')} {'*'.repeat(song.difficulty)}
          </span>
        </div>
      </div>
      <div className='flex flex-col items-end gap-1'>
        <div className='flex items-center gap-1.5'>
          <span className='text-xxs text-ash-gray/50 uppercase tracking-wider'>
            {t('ui:pregig.nrg')}
          </span>
          <div className='w-14 h-1.5 bg-shadow-black overflow-hidden border border-ash-gray/20'>
            <div
              className={`h-full transition-all ${isSelected ? 'bg-toxic-green' : 'bg-blood-red/60'}`}
              style={{ width: `${song.energy?.peak ?? 50}%` }}
            />
          </div>
        </div>
        {isSelected && (
          <span className='text-xxs text-toxic-green tracking-wider'>
            {t('ui:pregig.selected')}
          </span>
        )}
      </div>
    </button>
  )

  if (isLocked) {
    return (
      <Tooltip content={t('ui:pregig.songLockedReason')}>
        {buttonContent}
      </Tooltip>
    )
  }

  return buttonContent
})

SongRow.displayName = 'SongRow'

/**
 * Displays available songs, selected setlist state, locks, and density preview for pre-gig setup.
 * @param props - Setlist, song lookup data, selected song ids, player state, and song toggle callback.
 */
export const SetlistBlock = ({
  setlist,
  songsDb,
  songsDict,
  selectedSongIds,
  player,
  toggleSong
}: SetlistBlockProps) => {
  const { t } = useTranslation('ui')
  const selectedSongs = useMemo(() => {
    const songs: Song[] = []
    for (const entry of setlist) {
      const songId = getSongId(entry)
      if (songId) {
        const song = songsDict[songId]
        if (song) {
          songs.push(song)
        }
      }
    }
    return songs
  }, [setlist, songsDict])

  const densityBars = useMemo(
    () => buildSetlistChartDensity(selectedSongs),
    [selectedSongs]
  )

  const { densityTotal, densityPeak } = useMemo(() => {
    let total = 0
    let peak = 0
    for (const bar of densityBars) {
      total += bar.count
      if (bar.count > peak) {
        peak = bar.count
      }
    }
    return { densityTotal: total, densityPeak: peak }
  }, [densityBars])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className='border-2 border-ash-gray/40 p-4 bg-void-black/70 backdrop-blur-sm flex flex-col max-h-[48svh] sm:max-h-[52svh] lg:max-h-none'
    >
      <h3 className='text-sm text-toxic-green mb-3 tracking-widest font-mono border-b border-toxic-green/30 pb-2 flex justify-between'>
        <span>{t('ui:pregig.setlist')}</span>
        <span className='tabular-nums'>
          {t('ui:pregig.setlistCountMax', {
            count: setlist.length,
            max: 3,
            defaultValue: '{{count}}/{{max}} max'
          })}
        </span>
      </h3>
      <div className='flex-1 overflow-y-auto pr-0 sm:pr-2 space-y-2'>
        {songsDb.map(song => {
          const isSelected = selectedSongIds.has(song.id)
          const isLocked = !!(
            player?.stats?.proveYourselfMode && song.difficulty > 2
          )
          return (
            <SongRow
              key={song.id}
              song={song}
              isSelected={isSelected}
              isLocked={isLocked}
              toggleSong={toggleSong}
            />
          )
        })}
      </div>

      <div className='mt-3 h-16 border-t border-ash-gray/20 pt-2 flex flex-col gap-1'>
        {selectedSongs.length > 0 ? (
          <>
            <div className='flex items-center justify-between text-xxs font-mono uppercase tracking-wider text-ash-gray/60'>
              <span>{t('ui:pregig.noteDensity')}</span>
              {import.meta.env.DEV && (
                <span>
                  {t('ui:pregig.chartDebug', {
                    notes: densityTotal,
                    peak: densityPeak
                  })}
                </span>
              )}
            </div>
            <div className='flex min-h-0 flex-1 items-end justify-between gap-1'>
              {densityBars.map((bar, i) => (
                <motion.div
                  key={`setlist-${bar.timestamp}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(8, bar.intensity * 100)}%` }}
                  transition={{ duration: 0.25, delay: i * 0.015 }}
                  className='flex-1 bg-gradient-to-t from-toxic-green to-toxic-green/40 relative group cursor-default'
                >
                  <div className='absolute -top-4 left-0 text-xs w-full text-center opacity-0 group-hover:opacity-100 transition-opacity text-star-white tabular-nums'>
                    {bar.count}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className='text-ash-gray/30 text-xs w-full text-center font-mono'>
            {t('ui:pregig.selectPreview')}
          </div>
        )}
      </div>
    </motion.div>
  )
}
