export type ExpeditionSocialResultId =
  'push' | 'monetize' | 'suppress' | 'weaponize'
export interface ExpeditionSocialResult {
  money: number
  fame: number
  heat: number
  exposure: number
  crowdHype: number
  intelTargetLevel: 1 | 2 | null
  requiresRival: boolean
  sponsorInterest: number
  rivalPressure: number
}
export const EXPEDITION_SOCIAL_RESULTS: Readonly<
  Record<ExpeditionSocialResultId, ExpeditionSocialResult>
> = {
  push: {
    money: 0,
    fame: 120,
    heat: 5,
    exposure: 18,
    crowdHype: 15,
    intelTargetLevel: 1,
    requiresRival: false,
    sponsorInterest: 15,
    rivalPressure: 5
  },
  monetize: {
    money: 500,
    fame: 0,
    heat: 0,
    exposure: 12,
    crowdHype: 5,
    intelTargetLevel: null,
    requiresRival: false,
    sponsorInterest: 10,
    rivalPressure: 0
  },
  suppress: {
    money: 0,
    fame: 0,
    heat: -12,
    exposure: -15,
    crowdHype: -10,
    intelTargetLevel: 2,
    requiresRival: false,
    sponsorInterest: -5,
    rivalPressure: -5
  },
  weaponize: {
    money: 0,
    fame: 80,
    heat: 12,
    exposure: 15,
    crowdHype: 10,
    intelTargetLevel: 1,
    requiresRival: true,
    sponsorInterest: 0,
    rivalPressure: 25
  }
}
