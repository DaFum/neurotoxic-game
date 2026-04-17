import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

export const TourbusControls = ({ onMoveLeft, onMoveRight }) => {
  const { t } = useTranslation('minigame')

  return (
    <div className='absolute inset-0 z-40 flex justify-between pointer-events-auto'>
      <button
        type='button'
        aria-label={t('minigame:tourbus.moveLeft', {
          defaultValue: 'Move Left'
        })}
        className='w-1/2 h-full active:bg-star-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-inset'
        onClick={onMoveLeft}
      />
      <button
        type='button'
        aria-label={t('minigame:tourbus.moveRight', {
          defaultValue: 'Move Right'
        })}
        className='w-1/2 h-full active:bg-star-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-inset'
        onClick={onMoveRight}
      />
    </div>
  )
}

TourbusControls.propTypes = {
  onMoveLeft: PropTypes.func.isRequired,
  onMoveRight: PropTypes.func.isRequired
}
