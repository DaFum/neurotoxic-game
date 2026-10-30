export type Direction = 'left' | 'right' | 'up' | 'down'
export type LayoutFamily = 'xbox' | 'playstation' | 'generic'

export type GamepadSnapshot = {
  index: number
  id: string
  mapping: string
  standard: boolean
  buttons: boolean[]
  stick: [number, number]
}

export type GamepadHandlers = {
  onButton?: (button: number, pressed: boolean) => void
  onLane?: (index: number, pressed: boolean) => void
  onBack?: () => void
  onMenu?: () => void
  onHelp?: () => void
  onDirection?: (direction: Direction) => void
  /** Called when the last connected controller is lost. */
  onDisconnect?: () => void
}

export type GamepadConsumer = {
  handlers: { current: GamepadHandlers }
  kind: 'gameplay' | 'scene'
  consumes: readonly number[]
}

export type GamepadDevice = {
  index: number
  id: string
  standard: boolean
  family: LayoutFamily
}
export type GamepadStatus = { available: boolean; devices: GamepadDevice[] }
export type GamepadController = {
  register: (consumer: GamepadConsumer) => () => void
  capture: (callback: (button: number) => void) => () => void
  status: GamepadStatus
  bindings: readonly [number, number, number]
}
