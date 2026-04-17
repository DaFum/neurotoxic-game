import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'

interface OverloadMeterProps {
  overload: number
}

export const OverloadMeter = memo(function OverloadMeter({
  overload
}: OverloadMeterProps) {
  const { t } = useTranslation()
  return (
    <div className='mt-3 w-48 bg-void-black/80 p-2 border border-toxic-green/30 backdrop-blur-sm'>
      <BlockMeter
        label={t('ui:overload.toxic', 'TOXIC OVERLOAD')}
        value={Math.min(10, Math.max(0, Math.round((overload / 100) * 10)))}
        max={10}
        isDanger={overload > 80}
      />
    </div>
  )
})
