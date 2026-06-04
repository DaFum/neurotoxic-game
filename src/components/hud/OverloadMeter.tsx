import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameStateUtils'

interface OverloadMeterProps {
  overload: number
}

/**
 * Renders the OverloadMeter component.
 * @param props - Props containing the current overload value.
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
