import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GlitchButton } from '../../ui/GlitchButton'

interface GraftModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  memberName: string
}

export const GraftModal = ({ isOpen, onClose, onConfirm, memberName }: GraftModalProps) => {
  const { t } = useTranslation(['ui'])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='EXPERIMENTAL GRAFT'>
      <div className='flex flex-col gap-4 text-star-white font-mono text-sm'>
        <p className='text-blood-red font-bold animate-pulse'>
          WARNING: IRREVERSIBLE MUTATION
        </p>
        <p>
          You are about to graft the <strong>Neuro-Overclock</strong> module into {memberName}'s neural pathways.
        </p>
        <ul className='list-disc pl-5 text-ash-gray'>
          <li>Rhythm Precision: +50%</li>
          <li>Stress Accumulation: Severe (+5/gig)</li>
          <li>Health Decay: Invasive (-10 max HP)</li>
        </ul>
        <p className='text-warning-yellow mt-2'>
          Do you wish to proceed with the operation?
        </p>
        <div className='flex justify-end gap-3 mt-4'>
          <GlitchButton onClick={onClose} variant='primary'>
            [ ABORT ]
          </GlitchButton>
          <GlitchButton onClick={onConfirm} variant='danger'>
            [ EXECUTE MUTATION ]
          </GlitchButton>
        </div>
      </div>
    </Modal>
  )
}
