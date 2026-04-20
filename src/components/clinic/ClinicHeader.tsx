/*
 * (#1) Actual Updates: Extracted ClinicHeader into a separate component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import type { ClinicHeaderProps } from '../../types/components'

export const ClinicHeader = ({ player }: ClinicHeaderProps) => {
  const { t } = useTranslation(['ui'])

  return (
    <header className='border-b border-toxic-green/50 pb-4 shrink-0'>
      <h2 className='text-2xl sm:text-3xl text-toxic-green font-[Metal_Mania] tracking-widest uppercase'>
        {t('ui:clinic.title', { defaultValue: 'THE VOID CLINIC' })}
      </h2>
      <p className='text-sm text-ash-gray mt-2 font-mono'>
        {t('ui:clinic.lore', {
          defaultValue:
            'Sacrifice money and fame for immediate cybernetic enhancement or synthetic healing.'
        })}
      </p>
      <div className='flex gap-4 mt-4 text-xs font-mono text-star-white'>
        <span>
          {t('ui:clinic.funds', { defaultValue: 'FUNDS:' })} {player.money}€
        </span>
        <span>
          {t('ui:clinic.fame', { defaultValue: 'FAME:' })} {player.fame}
        </span>
      </div>
    </header>
  )
}

ClinicHeader.propTypes = {
  player: PropTypes.shape({
    money: PropTypes.number.isRequired,
    fame: PropTypes.number.isRequired
  }).isRequired
}
