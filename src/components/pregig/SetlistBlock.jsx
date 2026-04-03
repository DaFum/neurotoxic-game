/**
 * (#1) Actual Updates: Extracted SetlistBlock from PreGig scene. Added precise PropTypes definitions.
 * (#2) Next Steps: Extract remaining logic.
 * (#3) Found Errors + Solutions: N/A
 */
import React, { useCallback } from 'react'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { getSongId } from '../../utils/audio/songUtils'

const SongRow = React.memo(({ song, isSelected, isLocked, t, toggleSong }) => {
  const handleToggle = useCallback(() => {
    if (isLocked) return
    toggleSong(song)
  }, [isLocked, song, toggleSong])

  return (
    <button
      type='button'
      aria-label={t('ui:pregig.selectSong', { name: song.name })}
      aria-pressed={!!isSelected}
      disabled={isLocked}
      onClick={handleToggle}
      className={`p-3 border-2 flex justify-between items-center transition-all w-full text-left ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${
          isSelected
            ? 'border-toxic-green bg-toxic-green/10 text-toxic-green shadow-[0_0_8px_var(--color-toxic-green-20)]'
            : isLocked
              ? 'border-blood-red/30 bg-blood-red/10 text-blood-red/50 opacity-50'
              : 'border-ash-gray/20 hover:border-star-white/40 text-ash-gray'
        }`}
    >
      <div>
        <div className='font-bold text-sm'>
          {song.name}{' '}
          {isLocked && (
            <span className='text-[10px] text-blood-red ml-2 border border-blood-red/50 px-1'>
              {t('ui:pregig.locked')}
            </span>
          )}
        </div>
        <div className='text-[10px] font-mono mt-0.5 flex gap-2'>
          <span>{t('ui:seconds', { count: song.duration })}</span>
          <span className='text-ash-gray/40'>|</span>
          <span>
            {t('ui:pregig.diff')} {'*'.repeat(song.difficulty)}
          </span>
        </div>
      </div>
      <div className='flex flex-col items-end gap-1'>
        <div className='flex items-center gap-1.5'>
          <span className='text-[9px] text-ash-gray/50 uppercase tracking-wider'>
            {t('ui:pregig.nrg')}
          </span>
          <div className='w-14 h-1.5 bg-shadow-black overflow-hidden border border-ash-gray/20'>
            <div
              className={`h-full transition-all ${isSelected ? 'bg-toxic-green' : 'bg-blood-red/60'}`}
              style={{ width: `${song.energy.peak}%` }}
            />
          </div>
        </div>
        {isSelected && (
          <span className='text-[9px] text-toxic-green tracking-wider'>
            {t('ui:pregig.selected')}
          </span>
        )}
      </div>
    </button>
  )
})

SongRow.displayName = 'SongRow'

const SongShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  difficulty: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  energy: PropTypes.shape({
    peak: PropTypes.number.isRequired
  }).isRequired
})

SongRow.propTypes = {
  song: SongShape.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isLocked: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
  toggleSong: PropTypes.func.isRequired
}

export const SetlistBlock = ({
  t,
  setlist,
  songsDb,
  songsDict,
  selectedSongIds,
  player,
  toggleSong
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className='border-2 border-ash-gray/40 p-4 bg-void-black/70 backdrop-blur-sm flex flex-col max-h-[48vh] sm:max-h-[52vh] lg:max-h-none'
    >
      <h3 className='text-sm text-toxic-green mb-3 tracking-widest font-mono border-b border-toxic-green/30 pb-2 flex justify-between'>
        <span>{t('ui:pregig.setlist')}</span>
        <span className='tabular-nums'>{setlist.length}/3</span>
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
              t={t}
              toggleSong={toggleSong}
            />
          )
        })}
      </div>

      {/* Curve Visualization */}
      <div className='mt-3 h-14 border-t border-ash-gray/20 pt-2 flex items-end justify-between gap-1'>
        {setlist.map((s, i) => {
          const id = getSongId(s)
          const songData = songsDict[id] || {
            energy: { peak: 50 }
          }
          return (
            <motion.div
              key={id}
              initial={{ height: 0 }}
              animate={{ height: `${songData.energy?.peak || 50}%` }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className='flex-1 bg-gradient-to-t from-toxic-green to-toxic-green/40 relative group cursor-default'
            >
              <div className='absolute -top-4 left-0 text-[10px] w-full text-center opacity-0 group-hover:opacity-100 transition-opacity text-star-white tabular-nums'>
                {songData.energy?.peak}%
              </div>
            </motion.div>
          )
        })}
        {setlist.length === 0 && (
          <div className='text-ash-gray/30 text-[10px] w-full text-center font-mono'>
            {t('ui:pregig.selectPreview')}
          </div>
        )}
      </div>
    </motion.div>
  )
}

SetlistBlock.propTypes = {
  t: PropTypes.func.isRequired,
  setlist: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, SongShape]))
    .isRequired,
  songsDb: PropTypes.arrayOf(SongShape).isRequired,
  songsDict: PropTypes.objectOf(SongShape).isRequired,
  selectedSongIds: PropTypes.instanceOf(Set).isRequired,
  player: PropTypes.shape({
    stats: PropTypes.shape({
      proveYourselfMode: PropTypes.bool
    })
  }),
  toggleSong: PropTypes.func.isRequired
}
