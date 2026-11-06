import type { PendingGigSettlement } from '../../types'

type SettlementLifecycleInput = {
  lifecycleStage?: unknown
  socialReconciled?: unknown
}

/** Whether a settlement's marker or stage records completed social effects. */
export const isGigSocialReconciled = (
  settlement: SettlementLifecycleInput | null | undefined
): boolean =>
  settlement != null &&
  ((Object.hasOwn(settlement, 'socialReconciled') &&
    settlement.socialReconciled === true) ||
    settlement.lifecycleStage === 'social_reconciled' ||
    settlement.lifecycleStage === 'complete')

/** Normalizes legacy markers and stages without demoting a complete settlement. */
export const normalizeGigSettlementLifecycle = (
  settlement: SettlementLifecycleInput
): Pick<PendingGigSettlement, 'lifecycleStage' | 'socialReconciled'> => {
  const socialReconciled = isGigSocialReconciled(settlement)
  return {
    lifecycleStage:
      settlement.lifecycleStage === 'complete'
        ? 'complete'
        : socialReconciled
          ? 'social_reconciled'
          : 'pending_social',
    socialReconciled
  }
}

/** Records social reconciliation while preserving completed settlement progress. */
export const markGigSocialReconciled = (
  settlement: PendingGigSettlement
): PendingGigSettlement => ({
  ...settlement,
  ...normalizeGigSettlementLifecycle({
    lifecycleStage: settlement.lifecycleStage,
    socialReconciled: true
  })
})
