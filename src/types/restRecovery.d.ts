/** Optimistic rest-day effects derived from pending liabilities and campaigns. */
export interface PendingRestEffects {
  fameDrops: { restDay: number; amount: number }[]
  successes: {
    restDay: number
    fame: number
    dailyIncome: number
    passiveFame: number
    saleProceeds: number
  }[]
}

/** Optimistic one-use recovery from carried consumables. */
export interface ConsumableRecovery {
  harmony: number
  targetedStamina: number
  memberStamina: number
}
