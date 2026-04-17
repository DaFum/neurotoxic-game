import type { EventOption, GameState, MapNode } from './game'
import type { RemoveByIdCallback, TranslationCallback } from './callbacks'

/**
 * Known chatter variants:
 * - `normal`: default emitted by `getRandomChatter`
 * - `hate`: explicit style override (chromatic hostile text)
 *
 * Keep `(string & {})` to allow future/remote variants without breaking.
 */
export type ChatterMessageType = 'normal' | 'hate' | (string & {})

export interface ChatterMessageData {
  id: string
  text: string
  speaker: string
  type: ChatterMessageType
  scene: string
}

export type ChatterGameState = Pick<
  GameState,
  'currentScene' | 'band' | 'player' | 'gameMap' | 'social' | 'lastGigStats'
>

export interface ChatterOverlayProps {
  gameState: ChatterGameState
}

export interface GigHUDProps {
  stats: {
    score: number
    combo: number
    health: number
    overload: number
    isToxicMode: boolean
    isGameOver: boolean
    isAudioReady: boolean
    accuracy: number
  }
  gameStateRef: { current: GameState }
  onLaneInput: (laneIndex: number, isDown: boolean, now: number) => void
}

export interface MapNodeProps {
  node: MapNode
  isCurrentNode?: boolean
  isTargetNode?: boolean
  onSelect?: (nodeId: string) => void
}

export interface MapConnectionProps {
  from: MapNode
  to: MapNode
  isUnlocked?: boolean
}

export interface HecklerOverlayProps {
  gameStateRef: { current: GameState }
}

export interface GenericListProps<TItem = unknown> {
  items: TItem[]
}

export interface ChatterMessageProps {
  msg: ChatterMessageData
  onRemove: RemoveByIdCallback
  t: TranslationCallback
}

export interface SocialOptionButtonProps {
  opt: EventOption
  index: number
  onSelect: (index: number) => void
}

export interface PauseOverlayProps {
  isPaused: boolean
  onResume: () => void
  onQuit: () => void
}
