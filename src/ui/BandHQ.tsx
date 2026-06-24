import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IMG_PROMPTS, resolveGenImageUrl } from '../utils/imageGen'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useGameSelector } from '../context/GameState.tsx'

import { BandHQTabsList } from './bandhq/BandHQTabsList.tsx'
import { BandHQContentArea } from './bandhq/BandHQContentArea.tsx'

const VOID_TRADER_CONTROVERSY_THRESHOLD = 30

/**
 * Close behavior and optional wrapper styling for the Band HQ modal.
 */
export interface BandHQProps {
  onClose: (e?: React.MouseEvent | React.KeyboardEvent | Event) => void
  className?: string
}

/**
 * Presents the Band HQ modal with tab routing and void-trader gating.
 * @param props - Close handler and optional wrapper class for the Band HQ modal.
 */
import { useEffect } from 'react'

export const BandHQ = ({ onClose, className = '' }: BandHQProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])
  const { t } = useTranslation()
  const isOnline = useNetworkStatus()
  const [activeTab, setActiveTab] = useState('STATS')

  const playerDay = useGameSelector(state => state.player.day)
  const social = useGameSelector(state => state.social)

  const currentTab =
    activeTab === 'VOID' &&
    social.controversyLevel < VOID_TRADER_CONTROVERSY_THRESHOLD
      ? 'STATS'
      : activeTab

  return (
    <div
      className={`fixed inset-0 z-(--z-modal) flex items-center justify-center p-2 sm:p-4 ${className}`}
    >
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-30 bg-void-black/90 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Decorative Background Image overlay */}
      <div
        className='fixed inset-0 z-40 bg-cover bg-center opacity-20 pointer-events-none'
        style={{
          backgroundImage: `url("${resolveGenImageUrl(IMG_PROMPTS.BAND_HQ_BG, isOnline)}")`
        }}
      />

      <div
        className='relative z-(--z-modal) w-full max-w-4xl h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)] sm:h-[calc(100svh-4rem)] border-4 border-toxic-green bg-void-black flex flex-col overflow-hidden shadow-[4px_4px_0px_var(--color-toxic-green)] sm:shadow-[8px_8px_0px_var(--color-toxic-green)]'
        role='dialog'
        aria-modal='true'
        aria-labelledby='band-hq-title'
      >
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-3 sm:p-6 border-b-4 border-toxic-green bg-void-black'>
          <div className='min-w-0'>
            <h2
              id='band-hq-title'
              className='text-3xl sm:text-4xl text-toxic-green font-display drop-shadow-[0_0_5px_var(--color-toxic-green)]'
            >
              {t('ui:hq.title', { defaultValue: 'BAND HQ' })}
            </h2>
            <p className='text-ash-gray text-xs sm:text-sm font-mono uppercase tracking-widest break-words'>
              {t('venues:stendal_proberaum.name')} |{' '}
              {t('ui:ui.day', { defaultValue: 'Day' })} {playerDay}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 border-2 border-blood-red text-blood-red font-bold hover:bg-blood-red hover:text-void-black transition-colors duration-200 uppercase font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-red focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
          >
            {t('ui:hq.leave', { defaultValue: 'LEAVE [ESC]' })}
          </button>
        </div>

        <BandHQTabsList
          currentTab={currentTab}
          setActiveTab={setActiveTab}
          controversyLevel={social.controversyLevel}
          VOID_TRADER_CONTROVERSY_THRESHOLD={VOID_TRADER_CONTROVERSY_THRESHOLD}
        />

        <BandHQContentArea
          currentTab={currentTab}
          VOID_TRADER_CONTROVERSY_THRESHOLD={VOID_TRADER_CONTROVERSY_THRESHOLD}
        />
      </div>
    </div>
  )
}
