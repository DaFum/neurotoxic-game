// @ts-nocheck
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

export const TourbusHUD = ({ distance, damage }) => {
  const { t } = useTranslation('minigame')

  return (
    <div className='absolute top-4 left-4 z-30 text-star-white font-mono pointer-events-none'>
      <h2 className='text-2xl text-toxic-green'>
        {t('minigame:tourbus.title', { defaultValue: 'TOURBUS TERROR' })}
      </h2>
      <div className='mt-2'>
        <p>
          {t('minigame:tourbus.distance', { defaultValue: 'DISTANCE:' })}{' '}
          {distance}m
        </p>
        <p>
          {t('minigame:tourbus.damage', { defaultValue: 'DAMAGE:' })} {damage}%
        </p>
      </div>
    </div>
  )
}

TourbusHUD.propTypes = {
  distance: PropTypes.number.isRequired,
  damage: PropTypes.number.isRequired
}
