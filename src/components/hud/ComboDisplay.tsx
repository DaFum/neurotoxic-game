// TODO: Review this file
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface ComboDisplayProps {
  combo: number
  accuracy: number
}

export const ComboDisplay = memo(function ComboDisplay({
  combo,
  accuracy
}: ComboDisplayProps) {
  const { t } = useTranslation()
  const comboTier =
    combo >= 50
      ? 'text-blood-red animate-pulse'
      : combo >= 20
        ? 'text-warning-yellow'
        : combo > 0
          ? 'text-toxic-green'
          : 'text-ash-gray/50'

  return (
    <div className='mt-2 bg-void-black/60 backdrop-blur-sm border border-toxic-green/20 px-3 py-1.5 inline-flex items-baseline gap-2'>
      <div
        className={`text-2xl font-bold transition-all duration-100 tabular-nums ${comboTier} ${
          combo > 0 ? 'scale-110' : 'scale-100'
        }`}
      >
        {combo}x
      </div>
      <div className='text-[10px] text-ash-gray uppercase tracking-widest'>
        {t('ui:gig.combo', 'COMBO')}
      </div>
      {accuracy < 70 && (
        <div className='text-[10px] text-warning-yellow animate-pulse'>
          {t('ui:gig.lowAcc', 'LOW ACC')}
        </div>
      )}
    </div>
  )
})
