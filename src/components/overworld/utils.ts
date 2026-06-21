import { MapNodeType } from '../../types'

const ICON_URL_KEY_MAP: Record<string, string> = {
  FESTIVAL: 'pinFestivalUrl',
  START: 'pinHomeUrl',
  REST_STOP: 'pinRestUrl',
  SPECIAL: 'pinSpecialUrl',
  FINALE: 'pinFinaleUrl',
  SUPPLY_STOP: 'pinSupplyUrl'
}

/**
 * Resolves the appropriate icon URL for a given map node type.
 *
 * @param nodeType - The classification of the map node.
 * @param urls - A dictionary of available icon URLs keyed by their resource identifiers.
 * @returns The resolved icon URL string, falling back to an empty string if no valid URL is found.
 */
export const getNodeIconUrl = (
  nodeType: MapNodeType,
  urls: Record<string, string | undefined>
): string => {
  const key = ICON_URL_KEY_MAP[nodeType] || 'pinClubUrl'
  return urls[key] || urls.pinClubUrl || ''
}
