import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameStateUtils'

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
    <div className='mt-3 w-48 bg-void-black/80 p-2 border border-toxic-green/30 backdrop-blur-sm'>
      <BlockMeter
        label={t('ui:overload.toxic', 'TOXIC OVERLOAD')}
        value={normalizePercentageToScale(overload, 10)}
        max={10}
        isDanger={overload > 80}
      />
    </div>
  )
})
