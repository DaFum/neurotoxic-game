import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/numberUtils'
import type { ClinicHeaderProps } from '../../types/components'

/**
 * Shows the clinic title, flavor copy, and spendable player resources.
 * @param props - Player money and fame available for clinic actions.
 */
export const ClinicHeader = ({ player }: ClinicHeaderProps) => {
  const { t, i18n } = useTranslation(['ui'])

  return (
    <header className='border-b border-toxic-green/50 pb-4 shrink-0'>
      <h2 className='text-2xl sm:text-3xl text-toxic-green font-display tracking-widest uppercase'>
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
          {t('ui:clinic.funds', { defaultValue: 'FUNDS:' })}{' '}
          {formatCurrency(player.money ?? 0, i18n.language)}
        </span>
        <span>
          {t('ui:clinic.fame', { defaultValue: 'FAME:' })} {player.fame}
        </span>
      </div>
    </header>
  )
}
