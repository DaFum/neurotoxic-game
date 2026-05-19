import type { TFunction } from 'i18next'
import { BRAND_DEALS_BY_ID } from '../data/brandDeals'

type BrandDealTranslator =
  | TFunction
  | ((key: string, options?: Record<string, unknown>) => string)

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
  t: BrandDealTranslator,
  key: string,
  defaultValue: string
): string => {
  const translated = t(key, { defaultValue })
  return typeof translated === 'string' ? translated : defaultValue
}

export const getTranslatedBrandDealDisplay = (
  deal: BrandDealDisplayInput,
  t: BrandDealTranslator,
  index = 0
): BrandDealDisplay | null => {
  if (typeof deal !== 'object' || deal === null) return null
  const id = getNonEmptyString(deal.id)
  const catalogDeal = id ? BRAND_DEALS_BY_ID.get(id) : undefined
  const inlineName = getNonEmptyString(deal.name)
  const inlineDescription = getNonEmptyString(deal.description)
  const fallbackName = catalogDeal?.name ?? inlineName ?? id
  const fallbackDescription = catalogDeal?.description ?? inlineDescription

  if (!fallbackName) return null

  const hasCatalogEntry = id !== undefined && catalogDeal !== undefined

  const name = hasCatalogEntry
    ? translateString(t, getBrandDealNameKey(id), fallbackName)
    : fallbackName
  const description =
    hasCatalogEntry && fallbackDescription
      ? translateString(t, getBrandDealDescriptionKey(id), fallbackDescription)
      : fallbackDescription

  return {
    key: id ? `${id}-${index}` : `active-deal-${index}`,
    name,
    description
  }
}
