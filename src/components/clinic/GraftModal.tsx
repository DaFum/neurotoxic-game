import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../utils/numberUtils'
import { Modal } from '../../ui/shared/Modal'
import { GlitchButton } from '../../ui/GlitchButton'

/**
 * Configuration properties for the experimental graft confirmation modal.
 */
interface GraftModalProps {
  /** Controls whether the modal is visible on screen. */
  isOpen: boolean
  /** Callback triggered when the user chooses to abort the operation or dismiss the modal. */
  onClose: () => void
  /** Callback triggered when the user confirms the mutation operation. */
  onConfirm: () => void
  /** The name of the band member undergoing the operation. */
  memberName: string
  /** The financial cost required to perform the graft. */
  cost: number
}

/**
 * Renders a modal prompting the user to confirm an experimental neuro-overclocking mutation.
 *
 * @remarks
 * This component displays critical warnings regarding irreversible stat changes, including
 * health decay and stress accumulation, alongside the required financial cost.
 *
 * @param props - The properties required to render the modal, including visibility state and callbacks.
 * @returns The rendered confirmation modal component.
 */
export const GraftModal = ({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  cost
}: GraftModalProps) => {
  const { t, i18n } = useTranslation(['ui'])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('ui:clinic.graft_title', { defaultValue: 'EXPERIMENTAL GRAFT' })}
    >
      <div className='flex flex-col gap-4 text-star-white font-mono text-sm'>
        <p className='text-blood-red font-bold animate-pulse'>
          {t('ui:clinic.graft_warning', {
            defaultValue: 'WARNING: IRREVERSIBLE MUTATION'
          })}
        </p>
        <p>
          {t('ui:clinic.graft_desc', {
            defaultValue:
              'You are about to graft the Neuro-Overclock module into {{memberName}}s neural pathways. Cost: {{cost}}',
            memberName,
            cost: formatCurrency(cost, i18n.language)
          })}
        </p>
        <ul className='list-disc pl-5 text-ash-gray'>
          <li>
            {t('ui:clinic.graft_stat1', {
              defaultValue: 'Rhythm Precision: +50%'
            })}
          </li>
          <li>
            {t('ui:clinic.graft_stat2', {
              defaultValue: 'Stress Accumulation: Severe (+30 Base)'
            })}
          </li>
          <li>
            {t('ui:clinic.graft_stat3', {
              defaultValue: 'Health Decay: Invasive (-20 HP)'
            })}
          </li>
        </ul>
        <p className='text-warning-yellow mt-2'>
          {t('ui:clinic.graft_prompt', {
            defaultValue: 'Do you wish to proceed with the operation?'
          })}
        </p>
        <div className='flex justify-end gap-3 mt-4'>
          <GlitchButton onClick={onClose} variant='primary'>
            [ {t('ui:clinic.abort', { defaultValue: 'ABORT' })} ]
          </GlitchButton>
          <GlitchButton onClick={onConfirm} variant='danger'>
            [{' '}
            {t('ui:clinic.execute_mutation', {
              defaultValue: 'EXECUTE MUTATION'
            })}{' '}
            ]
          </GlitchButton>
        </div>
      </div>
    </Modal>
  )
}
