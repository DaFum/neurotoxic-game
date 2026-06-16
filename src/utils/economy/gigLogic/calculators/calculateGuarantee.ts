import { finiteNumberOr } from '../../../gameState'
import type {} from '../../../../data/merch'
import type { GigEconomyData } from '../../types'
import type {} from '../../../../types'
import type {} from '../../../../types/economy'
import type {} from '../../../../types/assets'
/**
 * Calculates guarantee / base pay.
 *
 * @param gigData - Venue economy data containing guaranteed pay.
 * @returns Guarantee amount and optional income breakdown item.
 */
export const calculateGuarantee = (gigData: GigEconomyData = {}) => {
  gigData = gigData || {}
  const pay = Math.max(0, finiteNumberOr(gigData.pay, 0))
  if (pay > 0) {
    return {
      amount: pay,
      incomeItem: {
        labelKey: 'economy:gigIncome.guarantee.label',
        value: pay,
        detailKey: 'economy:gigIncome.guarantee.detail'
      }
    }
  }
  return { amount: 0, incomeItem: null }
}
