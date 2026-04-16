// @ts-nocheck
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared'

const TACTICS = [
  {
    id: 'SAFE',
    containerClass:
      'w-full p-3 border border-toxic-green hover:bg-toxic-green/20 text-left group transition-all',
    titleClass: 'text-toxic-green font-bold mb-1',
    titleKey: 'ui:deals.safe',
    titleDefault: 'SAFE (Low Risk)',
    descKey: 'ui:deals.safeDesc',
    descDefault: 'Attempt to get +10% upfront. High chance of success.'
  },
  {
    id: 'PERSUASIVE',
    containerClass:
      'w-full p-3 border border-electric-blue hover:bg-electric-blue/20 text-left group transition-all',
    titleClass: 'text-electric-blue font-bold mb-1',
    titleKey: 'ui:deals.persuasive',
    titleDefault: 'PERSUASIVE (Medium Risk)',
    descKey: 'ui:deals.persuasiveDesc',
    descDefault:
      'Try for +20% upfront & +10% per gig. Failure worsens terms (-10%).'
  },
  {
    id: 'AGGRESSIVE',
    containerClass:
      'w-full p-3 border border-blood-red hover:bg-blood-red/20 text-left group transition-all',
    titleClass: 'text-blood-red font-bold mb-1',
    titleKey: 'ui:deals.aggressive',
    titleDefault: 'AGGRESSIVE (High Risk)',
    descKey: 'ui:deals.aggressiveDesc',
    descDefault: 'Demand +50% upfront. Failure loses the deal completely.'
  }
]

export const NegotiationModal = ({
  isOpen,
  onClose,
  negotiationResult,
  handleNegotiationSubmit
}) => {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('ui:deals.negotiationTactics', {
        defaultValue: 'NEGOTIATION TACTICS'
      })}
    >
      {!negotiationResult ? (
        <div className='space-y-4'>
          <p className='text-sm text-ash-gray text-center mb-4'>
            {t('ui:deals.chooseApproach', {
              defaultValue:
                'Choose your approach. Your fame and traits affect the outcome.'
            })}
          </p>

          {TACTICS.map(tactic => (
            <button
              key={tactic.id}
              type='button'
              onClick={() => handleNegotiationSubmit(tactic.id)}
              className={tactic.containerClass}
            >
              <div className={tactic.titleClass}>
                {t(tactic.titleKey, { defaultValue: tactic.titleDefault })}
              </div>
              <div className='text-xs text-ash-gray group-hover:text-star-white'>
                {t(tactic.descKey, { defaultValue: tactic.descDefault })}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className='text-center py-6'>
          <div
            className={`text-4xl mb-4 ${negotiationResult.success ? 'text-toxic-green' : 'text-blood-red'}`}
          >
            {negotiationResult.success
              ? t('ui:deals.success', { defaultValue: 'SUCCESS!' })
              : t('ui:deals.failure', { defaultValue: 'FAILURE' })}
          </div>
          <div className='text-lg font-bold text-star-white mb-2'>
            {negotiationResult.feedback}
          </div>
          {negotiationResult.status === 'REVOKED' && (
            <div className='text-blood-red font-mono uppercase tracking-widest mt-4'>
              {t('ui:deals.dealLost', { defaultValue: 'DEAL LOST' })}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

NegotiationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  negotiationResult: PropTypes.object,
  handleNegotiationSubmit: PropTypes.func.isRequired
}
