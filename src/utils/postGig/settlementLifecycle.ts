import type {
  GigSettlementLifecycleStage,
  PendingGigSettlement
} from '../../types'

type SettlementLifecycleInput = {
  lifecycleStage?: unknown
  socialReconciled?: unknown
}

const STAGE_RANK: Record<string, number> = {
  recorded: 0,
  pending_social: 0,
  social_reconciled: 1,
  settled: 2,
  complete: 2
}

/** Canonicalizes a lifecycle stage string into the authoritative 3-stage lifecycle enum. */
export const canonicalizeGigSettlementLifecycleStage = (
  stage: unknown
): GigSettlementLifecycleStage | null => {
  if (stage === 'settled' || stage === 'complete') return 'settled'
  if (stage === 'social_reconciled') return 'social_reconciled'
  if (stage === 'recorded' || stage === 'pending_social') return 'recorded'
  return null
}

/** Advances lifecycleStage monotonically: recorded (0) -> social_reconciled (1) -> settled (2). */
export const advanceSettlementLifecycleStage = (
  current: GigSettlementLifecycleStage,
  target: GigSettlementLifecycleStage
): GigSettlementLifecycleStage => {
  const currentRank = STAGE_RANK[current] ?? 0
  const targetRank = STAGE_RANK[target] ?? 0
  return targetRank > currentRank ? target : current
}

/** Whether a settlement's stage or marker records completed social effects. */
export const isGigSocialReconciled = (
  settlement: SettlementLifecycleInput | null | undefined
): boolean => {
  if (settlement == null) return false
  if (settlement.lifecycleStage != null) {
    return (
      settlement.lifecycleStage !== 'recorded' &&
      settlement.lifecycleStage !== 'pending_social'
    )
  }
  return settlement.socialReconciled === true
}

/** Normalizes legacy markers and stages into authoritative lifecycleStage without demoting progress. */
export const normalizeGigSettlementLifecycle = (
  settlement: SettlementLifecycleInput
): {
  lifecycleStage: GigSettlementLifecycleStage
  socialReconciled: boolean
} => {
  const explicitStage = canonicalizeGigSettlementLifecycleStage(
    settlement.lifecycleStage
  )
  let stage: GigSettlementLifecycleStage
  if (explicitStage !== null) {
    // If legacy socialReconciled is true and explicit stage was recorded, advance to social_reconciled
    if (settlement.socialReconciled === true && explicitStage === 'recorded') {
      stage = 'social_reconciled'
    } else {
      stage = explicitStage
    }
  } else if (settlement.socialReconciled === true) {
    stage = 'social_reconciled'
  } else {
    stage = 'recorded'
  }

  return {
    lifecycleStage: stage,
    socialReconciled: stage !== 'recorded'
  }
}

/** Advances lifecycleStage to social_reconciled monotonically (never demoting 'settled'). */
export const markGigSocialReconciled = (
  settlement: PendingGigSettlement
): PendingGigSettlement => {
  const currentStage =
    canonicalizeGigSettlementLifecycleStage(settlement.lifecycleStage) ??
    'recorded'
  const nextStage = advanceSettlementLifecycleStage(
    currentStage,
    'social_reconciled'
  )
  return {
    ...settlement,
    lifecycleStage: nextStage,
    socialReconciled: true
  }
}
