/**
 * Cable definitions used by the Kabelsalat board.
 */
export const CABLES = [
  {
    id: 'midi',
    labelKey: 'ui:minigames.kabelsalat.cables.midi',
    type: 'midi',
    x: 120,
    y: 480,
    color: 'var(--color-cosmic-purple)'
  },
  {
    id: 'iec',
    labelKey: 'ui:minigames.kabelsalat.cables.pwr',
    type: 'iec',
    x: 260,
    y: 480,
    color: 'var(--color-blood-red)'
  },
  {
    id: 'jack',
    labelKey: 'ui:minigames.kabelsalat.cables.jack',
    type: 'jack',
    x: 400,
    y: 480,
    color: 'var(--color-warning-yellow)'
  },
  {
    id: 'xlr',
    labelKey: 'ui:minigames.kabelsalat.cables.xlr',
    type: 'xlr',
    x: 540,
    y: 480,
    color: 'var(--color-toxic-green)'
  },
  {
    id: 'dc',
    labelKey: 'ui:minigames.kabelsalat.cables.9v',
    type: 'dc',
    x: 680,
    y: 480,
    color: 'var(--color-info-blue)'
  }
] as const

/**
 * Type contract for Cable.
 */
export type Cable = (typeof CABLES)[number]
/**
 * Type contract for Cable Id.
 */
export type CableId = Cable['id']
type CableMap = Record<CableId, Cable>
/**
 * Cable definitions keyed by cable id for quick lookups.
 */
export const CABLE_MAP = CABLES.reduce<CableMap>((acc, cable) => {
  acc[cable.id] = cable
  return acc
}, {} as CableMap)

/**
 * Horizontal slot positions for cable and socket layout.
 */
export const SLOT_XS = [120, 260, 400, 540, 680]
/**
 * Shared vertical position for socket rendering.
 */
export const SOCKET_Y = 120

/**
 * Socket definitions used by the Kabelsalat board.
 */
export const SOCKET_DEFS = {
  mic: {
    id: 'mic',
    labelKey: 'ui:minigames.kabelsalat.sockets.mic',
    type: 'xlr',
    color: 'var(--color-toxic-green)'
  },
  amp: {
    id: 'amp',
    labelKey: 'ui:minigames.kabelsalat.sockets.amp',
    type: 'jack',
    color: 'var(--color-warning-yellow)'
  },
  pedal: {
    id: 'pedal',
    labelKey: 'ui:minigames.kabelsalat.sockets.pedal',
    type: 'dc',
    color: 'var(--color-info-blue)'
  },
  power: {
    id: 'power',
    labelKey: 'ui:minigames.kabelsalat.sockets.power',
    type: 'iec',
    color: 'var(--color-blood-red)'
  },
  synth: {
    id: 'synth',
    labelKey: 'ui:minigames.kabelsalat.sockets.synth',
    type: 'midi',
    color: 'var(--color-cosmic-purple)'
  }
} as const

/**
 * Default socket order before shuffling.
 */
export const INITIAL_SOCKET_ORDER = [
  'mic',
  'amp',
  'pedal',
  'power',
  'synth'
] as const
/**
 * Time limit for the Kabelsalat minigame in seconds.
 */
export const TIME_LIMIT = 25
