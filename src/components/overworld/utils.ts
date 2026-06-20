import { MapNodeType } from '../../types'

const ICON_URL_KEY_MAP: Record<string, string> = {
  FESTIVAL: 'pinFestivalUrl',
  START: 'pinHomeUrl',
  REST_STOP: 'pinRestUrl',
  SPECIAL: 'pinSpecialUrl',
  FINALE: 'pinFinaleUrl',
  SUPPLY_STOP: 'pinSupplyUrl'
}

export const getNodeIconUrl = (
  nodeType: MapNodeType,
  urls: Record<string, string | undefined>
): string => {
  const key = ICON_URL_KEY_MAP[nodeType] || 'pinClubUrl'
  return urls[key] || urls.pinClubUrl || ''
}
