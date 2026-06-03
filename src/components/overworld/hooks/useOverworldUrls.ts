import { useMemo } from 'react'
import { BRAND_COLOR_HEX, HEX_COLOR_PATTERN } from '../../../utils/brandColors'
import {
  getGenImageUrl,
  IMG_PROMPTS,
  isImageGenerationAvailable,
  getGeneratedImageFallbackUrl
} from '../../../utils/imageGen'
import type { TranslationCallback } from '../../../types/callbacks'

const SVG_TOKEN_NAMES = [
  '--color-void-black',
  '--color-star-white',
  '--color-toxic-green',
  '--color-ash-gray'
] as const

type SvgTokenName = (typeof SVG_TOKEN_NAMES)[number]

const SVG_TOKEN_FALLBACKS = {
  '--color-void-black': BRAND_COLOR_HEX['void-black'],
  '--color-star-white': BRAND_COLOR_HEX['star-white'],
  '--color-toxic-green': BRAND_COLOR_HEX['toxic-green'],
  '--color-ash-gray': BRAND_COLOR_HEX['ash-gray']
} as const satisfies Record<SvgTokenName, string>

const SVG_UNSAFE_CSS_PATTERN = /[;{}<>]/

const isSafeSvgColorValue = (value: string): boolean => {
  const trimmedValue = value.trim()
  if (
    !trimmedValue ||
    trimmedValue.includes('var(') ||
    SVG_UNSAFE_CSS_PATTERN.test(trimmedValue)
  ) {
    return false
  }

  if (
    typeof window !== 'undefined' &&
    typeof window.CSS?.supports === 'function'
  ) {
    return window.CSS.supports('color', trimmedValue)
  }

  return HEX_COLOR_PATTERN.test(trimmedValue)
}

const resolveSvgTokenValue = (tokenName: SvgTokenName): string => {
  const fallback = SVG_TOKEN_FALLBACKS[tokenName]
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof window.getComputedStyle !== 'function'
  ) {
    return fallback
  }

  const resolvedValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim()

  return isSafeSvgColorValue(resolvedValue) ? resolvedValue : fallback
}

const createSvgTokenStyle = (): string => {
  const tokenDefinitions = SVG_TOKEN_NAMES.map(
    tokenName => `${tokenName}:${resolveSvgTokenValue(tokenName)}`
  ).join(';')

  return `<defs><style>:root{${tokenDefinitions}}</style></defs>`
}

const escapeSvgText = (value: string): string =>
  value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })

export const useOverworldUrls = (
  isOnlineNetwork: boolean,
  t: TranslationCallback
) => {
  return useMemo(() => {
    const isOnline = isImageGenerationAvailable() && isOnlineNetwork
    const svgTokenStyle = createSvgTokenStyle()
    const createOfflineSvgUrl = (svgMarkup: string) =>
      `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`
    const createOfflinePinUrl = (label: string, symbol: string) =>
      createOfflineSvgUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeSvgText(label)}">
          ${svgTokenStyle}
          <circle cx="32" cy="24" r="16" fill="var(--color-star-white)" stroke="var(--color-void-black)" stroke-width="3"/>
          <path d="M32 58 21 34h22L32 58Z" fill="var(--color-star-white)" stroke="var(--color-void-black)" stroke-width="3" stroke-linejoin="round"/>
          <text x="32" y="29" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="var(--color-void-black)">${escapeSvgText(symbol)}</text>
        </svg>
      `)
    const createOfflineVanUrl = (label: string, text: string) =>
      createOfflineSvgUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${escapeSvgText(label)}">
          ${svgTokenStyle}
          <rect x="10" y="20" width="34" height="20" rx="4" fill="var(--color-star-white)" stroke="var(--color-void-black)" stroke-width="3"/>
          <path d="M44 26h10l4 8v6H44Z" fill="var(--color-star-white)" stroke="var(--color-void-black)" stroke-width="3" stroke-linejoin="round"/>
          <circle cx="22" cy="44" r="5" fill="var(--color-star-white)" stroke="var(--color-void-black)" stroke-width="3"/>
          <circle cx="48" cy="44" r="5" fill="var(--color-star-white)" stroke="var(--color-void-black)" stroke-width="3"/>
          <text x="31" y="34" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="var(--color-void-black)">${escapeSvgText(text)}</text>
        </svg>
      `)
    const offlineCopy = {
      mapAria: t('ui:map.offline.aria', {
        defaultValue: 'Offline overworld map'
      }),
      mapTitle: t('ui:map.offline.title', { defaultValue: 'OFFLINE MAP' }),
      mapDescription: t('ui:map.offline.description', {
        defaultValue: 'Routes and markers remain distinct while offline'
      }),
      playerVan: t('ui:map.offline.playerVan', {
        defaultValue: 'Player van'
      }),
      rivalVan: t('ui:map.offline.rivalVan', {
        defaultValue: 'Rival van'
      }),
      playerMarker: t('ui:map.offline.playerMarker', {
        defaultValue: 'YOU'
      }),
      rivalMarker: t('ui:map.offline.rivalMarker', {
        defaultValue: 'RIVAL'
      }),
      festivalNode: t('ui:map.offline.festivalNode', {
        defaultValue: 'Festival node'
      }),
      homeNode: t('ui:map.offline.homeNode', { defaultValue: 'Home node' }),
      clubNode: t('ui:map.offline.clubNode', { defaultValue: 'Club node' }),
      restNode: t('ui:map.offline.restNode', { defaultValue: 'Rest node' }),
      specialNode: t('ui:map.offline.specialNode', {
        defaultValue: 'Special node'
      }),
      finaleNode: t('ui:map.offline.finaleNode', {
        defaultValue: 'Finale node'
      }),
      supplyNode: t('ui:map.offline.supplyNode', {
        defaultValue: 'Supply node'
      })
    }
    const offlineAssets = {
      mapBgUrl: createOfflineSvgUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="${escapeSvgText(offlineCopy.mapAria)}">
          ${svgTokenStyle}
          <rect width="800" height="450" fill="var(--color-star-white)"/>
          <path d="M40 360C140 320 220 330 320 290S520 210 620 230s100 40 140 20" fill="none" stroke="var(--color-void-black)" stroke-width="10" stroke-linecap="round"/>
          <path d="M90 110c40 10 70 40 120 30s90-50 150-30 100 70 170 60 110-60 170-50" fill="none" stroke="var(--color-toxic-green)" stroke-width="6" stroke-dasharray="18 12" stroke-linecap="round"/>
          <text x="400" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="var(--color-void-black)">${escapeSvgText(offlineCopy.mapTitle)}</text>
          <text x="400" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="var(--color-void-black)">${escapeSvgText(offlineCopy.mapDescription)}</text>
        </svg>
      `),
      vanUrl: createOfflineVanUrl(
        offlineCopy.playerVan,
        offlineCopy.playerMarker
      ),
      rivalVanUrl: createOfflineVanUrl(
        offlineCopy.rivalVan,
        offlineCopy.rivalMarker
      ),
      pinFestivalUrl: createOfflinePinUrl(offlineCopy.festivalNode, 'F'),
      pinHomeUrl: createOfflinePinUrl(offlineCopy.homeNode, 'H'),
      pinClubUrl: createOfflinePinUrl(offlineCopy.clubNode, 'C'),
      pinRestUrl: createOfflinePinUrl(offlineCopy.restNode, 'R'),
      pinSpecialUrl: createOfflinePinUrl(offlineCopy.specialNode, 'S'),
      pinFinaleUrl: createOfflinePinUrl(offlineCopy.finaleNode, '!'),
      pinSupplyUrl: createOfflinePinUrl(offlineCopy.supplyNode, 'B')
    }
    const fallback = getGeneratedImageFallbackUrl()
    return {
      mapBgUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.OVERWORLD_MAP)
        : offlineAssets.mapBgUrl || fallback,
      vanUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_VAN)
        : offlineAssets.vanUrl || fallback,
      rivalVanUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_RIVAL_VAN)
        : offlineAssets.rivalVanUrl || fallback,
      pinFestivalUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_FESTIVAL)
        : offlineAssets.pinFestivalUrl || fallback,
      pinHomeUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_HOME)
        : offlineAssets.pinHomeUrl || fallback,
      pinClubUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_CLUB)
        : offlineAssets.pinClubUrl || fallback,
      pinRestUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_REST)
        : offlineAssets.pinRestUrl || fallback,
      pinSpecialUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_SPECIAL)
        : offlineAssets.pinSpecialUrl || fallback,
      pinFinaleUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_FINALE)
        : offlineAssets.pinFinaleUrl || fallback,
      pinSupplyUrl: isOnline
        ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_SUPPLY)
        : offlineAssets.pinSupplyUrl || fallback
    }
  }, [isOnlineNetwork, t])
}
