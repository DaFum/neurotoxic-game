export const CABLES = [
  {
    id: 'midi',
    labelKey: 'ui:minigames.kabelsalat.cables.midi',
    type: 'midi',
    x: 120,
    y: 480,
    color: 'var(--cosmic-purple)'
  },
  {
    id: 'iec',
    labelKey: 'ui:minigames.kabelsalat.cables.pwr',
    type: 'iec',
    x: 260,
    y: 480,
    color: 'var(--blood-red)'
  },
  {
    id: 'jack',
    labelKey: 'ui:minigames.kabelsalat.cables.jack',
    type: 'jack',
    x: 400,
    y: 480,
    color: 'var(--warning-yellow)'
  },
  {
    id: 'xlr',
    labelKey: 'ui:minigames.kabelsalat.cables.xlr',
    type: 'xlr',
    x: 540,
    y: 480,
    color: 'var(--toxic-green)'
  },
  {
    id: 'dc',
    labelKey: 'ui:minigames.kabelsalat.cables.9v',
    type: 'dc',
    x: 680,
    y: 480,
    color: 'var(--info-blue)'
  }
]

export const CABLE_MAP = Object.create(null)
for (let i = 0; i < CABLES.length; i++) {
  const cable = CABLES[i]
  CABLE_MAP[cable.id] = cable
}

export const SLOT_XS = [120, 260, 400, 540, 680]

export const SOCKET_DEFS = {
  mic: {
    id: 'mic',
    labelKey: 'ui:minigames.kabelsalat.sockets.mic',
    type: 'xlr',
    color: 'var(--toxic-green)'
  },
  amp: {
    id: 'amp',
    labelKey: 'ui:minigames.kabelsalat.sockets.amp',
    type: 'jack',
    color: 'var(--warning-yellow)'
  },
  pedal: {
    id: 'pedal',
    labelKey: 'ui:minigames.kabelsalat.sockets.pedal',
    type: 'dc',
    color: 'var(--info-blue)'
  },
  power: {
    id: 'power',
    labelKey: 'ui:minigames.kabelsalat.sockets.power',
    type: 'iec',
    color: 'var(--blood-red)'
  },
  synth: {
    id: 'synth',
    labelKey: 'ui:minigames.kabelsalat.sockets.synth',
    type: 'midi',
    color: 'var(--cosmic-purple)'
  }
}

export const INITIAL_SOCKET_ORDER = ['mic', 'amp', 'pedal', 'power', 'synth']
export const TIME_LIMIT = 25
