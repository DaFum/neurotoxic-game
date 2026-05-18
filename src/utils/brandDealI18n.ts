import type { TFunction } from 'i18next'
import { BRAND_DEALS_BY_ID } from '../data/brandDeals'

interface BrandDealDisplayInput {
  id?: unknown
  name?: unknown
  description?: unknown
}

export interface BrandDealDisplay {
  key: string
  name: string
  description?: string
}

export const getBrandDealNameKey = (id: string) =>
  `economy:brandDeals.${id}.name`

export const getBrandDealDescriptionKey = (id: string) =>
  `economy:brandDeals.${id}.description`

const getNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const translateString = (
  t: TFunction,
  key: string,
  defaultValue: string
): string => {
  const translated = t(key, { defaultValue })
  return typeof translated === 'string' ? translated : defaultValue
}

export const getTranslatedBrandDealDisplay = (
  deal: BrandDealDisplayInput,
  t: TFunction,
  index = 0
): BrandDealDisplay | null => {
  const id = getNonEmptyString(deal.id)
  const catalogDeal = id ? BRAND_DEALS_BY_ID.get(id) : undefined
  const inlineName = getNonEmptyString(deal.name)
  const inlineDescription = getNonEmptyString(deal.description)
  const fallbackName = inlineName ?? catalogDeal?.name ?? id

  if (!fallbackName) return null

  const shouldTranslateName =
    id !== undefined && (!inlineName || inlineName === catalogDeal?.name)
  const shouldTranslateDescription =
    id !== undefined &&
    (!inlineDescription || inlineDescription === catalogDeal?.description)
  const fallbackDescription = inlineDescription ?? catalogDeal?.description

  const name = shouldTranslateName
    ? translateString(t, getBrandDealNameKey(id), fallbackName)
    : fallbackName
  const description =
    fallbackDescription && shouldTranslateDescription
      ? translateString(t, getBrandDealDescriptionKey(id), fallbackDescription)
      : fallbackDescription

  return {
    key: id ? `${id}-${index}` : `active-deal-${index}`,
    name,
    description
  }
}
