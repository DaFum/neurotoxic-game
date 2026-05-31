import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared'
import type {
  NegotiationModalProps,
  NegotiationResult
} from '../../types/components'

const TACTICS = [
  {
    id: 'SAFE',
    containerClass:
      'w-full min-h-11 p-3 border-2 border-toxic-green hover:bg-toxic-green/20 text-left group transition-all',
    titleClass: 'text-toxic-green font-bold mb-1 break-words',
    titleKey: 'ui:deals.safe',
    titleDefault: 'SAFE (Low Risk)',
    descKey: 'ui:deals.safeDesc',
    descDefault: 'Attempt to get +10% upfront. High chance of success.'
  },
  {
    id: 'PERSUASIVE',
    containerClass:
      'w-full min-h-11 p-3 border-2 border-electric-blue hover:bg-electric-blue/20 text-left group transition-all',
    titleClass: 'text-electric-blue font-bold mb-1 break-words',
    titleKey: 'ui:deals.persuasive',
    titleDefault: 'PERSUASIVE (Medium Risk)',
    descKey: 'ui:deals.persuasiveDesc',
    descDefault:
      'Try for +20% upfront & +10% per gig. Failure worsens terms (-10%).'
  },
  {
    id: 'AGGRESSIVE',
    containerClass:
      'w-full min-h-11 p-3 border-2 border-blood-red hover:bg-blood-red/20 text-left group transition-all',
    titleClass: 'text-blood-red font-bold mb-1 break-words',
    titleKey: 'ui:deals.aggressive',
    titleDefault: 'AGGRESSIVE (High Risk)',
    descKey: 'ui:deals.aggressiveDesc',
    descDefault: 'Demand +50% upfront. Failure loses the deal completely.'
  }
] as const

const isNegotiationResult = (value: unknown): value is NegotiationResult => {
  if (!value || typeof value !== 'object') return false
  if (
    !Object.hasOwn(value, 'status') ||
    !Object.hasOwn(value, 'success') ||
    !Object.hasOwn(value, 'feedback')
  ) {
    return false
  }
  const record = value as {
    success?: unknown
    feedback?: unknown
    status?: unknown
  }
  return (
    typeof record.success === 'boolean' &&
    typeof record.feedback === 'string' &&
    (record.status === 'ACCEPTED' ||
      record.status === 'REVOKED' ||
      record.status === 'FAILED')
  )
}

export const NegotiationModal = ({
  isOpen,
  onClose,
  negotiationResult,
  handleNegotiationSubmit
}: NegotiationModalProps) => {
  const { t } = useTranslation()
  const typedResult = isNegotiationResult(negotiationResult)
    ? negotiationResult
    : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('ui:deals.negotiationTactics', {
        defaultValue: 'NEGOTIATION TACTICS'
      })}
    >
      {!typedResult ? (
        <div className='space-y-4'>
          <p className='text-sm text-ash-gray text-center mb-4 break-words'>
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
              <div className='text-xs text-ash-gray group-hover:text-star-white break-words'>
                {t(tactic.descKey, { defaultValue: tactic.descDefault })}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className='text-center py-4 sm:py-6'>
          <div
            className={`text-3xl sm:text-4xl mb-4 break-words ${typedResult?.success === true ? 'text-toxic-green' : 'text-blood-red'}`}
          >
            {typedResult?.success === true
              ? t('ui:deals.success', { defaultValue: 'SUCCESS!' })
              : t('ui:deals.failure', { defaultValue: 'FAILURE' })}
          </div>
          <div className='text-base sm:text-lg font-bold text-star-white mb-2 break-words'>
            {typedResult?.feedback ??
              t('ui:deals.negotiationOutcomePending', {
                defaultValue: 'Outcome pending.'
              })}
          </div>
          {typedResult?.status === 'REVOKED' && (
            <div className='text-blood-red font-mono uppercase tracking-widest mt-4 break-words'>
              {t('ui:deals.dealLost', { defaultValue: 'DEAL LOST' })}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
