import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface ComboDisplayProps {
  /** Current consecutive hit streak. */
  combo: number
  /** Current hit accuracy percentage for the active gig. */
  accuracy: number
}

/**
 * Shows the active hit streak and low-accuracy warning during a gig.
 *
 * @remarks
 * Combo feedback escalates at `20` and `50` hits. Accuracy below `70` displays
 * the low-accuracy warning beside the combo counter.
 */
export const ComboDisplay = memo(function ComboDisplay({
  combo,
  accuracy
}: ComboDisplayProps) {
  const { t } = useTranslation()
  const comboColor =
    combo >= 50
      ? 'var(--color-blood-red)'
      : combo >= 20
        ? 'var(--color-warning-yellow)'
        : combo > 0
          ? 'var(--color-toxic-green)'
          : 'rgb(var(--color-ash-gray-rgb) / 50%)'
  const comboPulseClass = combo >= 50 ? 'animate-pulse' : ''

  return (
    <div
      className='mt-2 backdrop-blur-sm border px-3 py-1.5 inline-flex items-baseline gap-2'
      style={{
        backgroundColor: 'rgb(var(--color-void-black-rgb) / 60%)',
        borderColor: 'var(--color-toxic-green-20)'
      }}
    >
      <div
        className={`text-2xl font-bold transition-all duration-100 tabular-nums ${comboPulseClass} ${
          combo > 0 ? 'scale-110' : 'scale-100'
        }`}
        style={{ color: comboColor }}
      >
        {combo}x
      </div>
      <div
        className='text-xs uppercase tracking-widest'
        style={{ color: 'var(--color-ash-gray)' }}
      >
        {t('ui:gig.combo', 'COMBO')}
      </div>
      {accuracy < 70 && (
        <div
          className='text-xs animate-pulse'
          style={{ color: 'var(--color-warning-yellow)' }}
        >
          {t('ui:gig.lowAcc', 'LOW ACC')}
        </div>
      )}
    </div>
  )
})
