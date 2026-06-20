import { MapNodeType } from '../../types'

export const getNodeIconUrl = (
  nodeType: MapNodeType,
  urls: {
    pinClubUrl: string
    pinFestivalUrl: string
    pinHomeUrl: string
    pinRestUrl: string
    pinSpecialUrl: string
    pinFinaleUrl: string
    pinSupplyUrl: string
  }
): string => {
  switch (nodeType) {
    case 'FESTIVAL':
      return urls.pinFestivalUrl
    case 'START':
      return urls.pinHomeUrl
    case 'REST_STOP':
      return urls.pinRestUrl
    case 'SPECIAL':
      return urls.pinSpecialUrl
    case 'FINALE':
      return urls.pinFinaleUrl
    case 'SUPPLY_STOP':
      return urls.pinSupplyUrl
    default:
      return urls.pinClubUrl
  }
}
