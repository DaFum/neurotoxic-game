import React, { useId } from 'react'
import * as m from 'motion/react-m'
import { Loader2 } from 'lucide-react'
import { RazorPlayIcon } from '../../ui/shared/Icons'
import { ActionButton } from '../../ui/shared'
import { Tooltip } from '../../ui/shared/Tooltip'
import type { TranslationCallback } from '../../types/callbacks'

type PreGigStartButtonProps = {
  t: TranslationCallback
  isStarting: boolean
  isSetlistEmpty: boolean
  isStartBlocked?: boolean
  onStartShow: () => void | Promise<void>
}

/**
 * Shows the pre-gig start action with disabled-state copy and click handling.
 * @param props - Translator, start-state flag, setlist-empty flag, start-blocked flag, and show-start handler.
 */
export const PreGigStartButton = React.memo(
  ({
    t,
    isStarting,
    isSetlistEmpty,
    isStartBlocked,
    onStartShow
  }: PreGigStartButtonProps) => {
    const disabledReason = isSetlistEmpty
      ? t('ui:bandhq.setlist.selectOne', {
          defaultValue: 'Select at least one song to practice!'
        })
      : isStartBlocked
        ? t('ui:pregig.startBlocked', {
            defaultValue: 'Band cannot perform gig at this time.'
          })
        : undefined

    const isDisabled = isSetlistEmpty || isStarting || Boolean(isStartBlocked)
    const reasonId = useId()
    const showReason = Boolean(disabledReason) && isDisabled

    const button = (
      <ActionButton
        onClick={onStartShow}
        disabled={isDisabled}
        aria-busy={isStarting}
        aria-describedby={showReason ? reasonId : undefined}
        className='w-full px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl tracking-widest shadow-[4px_4px_0px_var(--color-blood-red)] hover:shadow-[4px_4px_0px_var(--color-blood-red)] flex items-center justify-center gap-3 sm:gap-4'
      >
        {!isStarting && <RazorPlayIcon className='w-5 h-5 text-void-black' />}
        {isStarting && (
          <Loader2 className='animate-spin w-5 h-5' aria-hidden='true' />
        )}
        {isStarting ? t('ui:pregig.initializing') : t('ui:pregig.startShow')}
      </ActionButton>
    )

    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='relative z-10 mt-4 lg:mt-6 mb-4 lg:mb-0 w-full max-w-[20rem] sm:w-auto'
      >
        {showReason ? (
          <Tooltip content={disabledReason}>{button}</Tooltip>
        ) : (
          button
        )}
        {/* Persistent copy of the block reason: a tooltip alone needs hover
            or focus, which phones and first-time players rarely give it. */}
        {showReason && (
          <p
            id={reasonId}
            className='mt-2 text-center text-sm font-mono text-warning-yellow'
          >
            {disabledReason}
          </p>
        )}
      </m.div>
    )
  }
)
PreGigStartButton.displayName = 'PreGigStartButton'
