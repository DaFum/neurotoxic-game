import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameState'

interface OverloadMeterProps {
  overload: number
}

/**
 * Displays toxic overload as a ten-block meter with danger styling above the warning threshold.
 * @param props - Current overload percentage.
 */
export const OverloadMeter = memo(function OverloadMeter({
  overload
}: OverloadMeterProps) {
  const { t } = useTranslation()
  return (
    <div className='w-48 bg-void-black/90 p-3 border-2 border-toxic-green/50 shadow-[4px_4px_0px_var(--color-toxic-green-20)] backdrop-blur-md'>
      <BlockMeter
        label={t('ui:overload.toxic', 'TOXIC OVERLOAD')}
        value={normalizePercentageToScale(overload, 10)}
        max={10}
        isDanger={overload > 80}
      />
    </div>
  )
})
