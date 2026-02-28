import { memo } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'

export const HealthBar = memo(function HealthBar({ health, isToxicMode }) {
  const { t } = useTranslation()
  return (
    <div className='absolute bottom-20 left-1/2 -translate-x-1/2 w-[28rem] z-10 pointer-events-none'>
      <div className="bg-(--void-black)/80 p-4 border border-(--toxic-green)/30 backdrop-blur-sm">
        <BlockMeter
          label={t('ui:crowdEnergy', 'CROWD ENERGY')}
          value={Math.round((health / 100) * 20)}
          max={20}
          isDanger={health < 20}
        />
        {isToxicMode && (
          <div className='mt-3 text-(--blood-red) animate-neon-flicker font-bold tracking-widest text-center font-[var(--font-display)] text-sm border-t border-(--blood-red)/30 pt-2'>
            {t('ui:toxicModeActive', 'TOXIC MODE ACTIVE')}
          </div>
        )}
      </div>
    </div>
  )
})

HealthBar.propTypes = {
  health: PropTypes.number.isRequired,
  isToxicMode: PropTypes.bool
}
