import type { GameState } from './game'
import type { RemoveByIdCallback, TranslationCallback } from './callbacks'

export interface ChatterMessageData {
  id: string
  text: string
  speaker: string
  type: string
  scene: string
}

export interface ChatterOverlayProps {
  gameState: GameState
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
  gameStateRef: { current: unknown }
  onLaneInput: (laneIndex: number, isDown: boolean, now: number) => void
}

export interface MapNodeProps {
  node: Record<string, unknown>
  isCurrentNode?: boolean
  isTargetNode?: boolean
  onSelect?: (nodeId: string) => void
}

export interface MapConnectionProps {
  from: Record<string, unknown>
  to: Record<string, unknown>
  isUnlocked?: boolean
}

export interface HecklerOverlayProps {
  gameStateRef: { current: unknown }
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
  opt: Record<string, unknown>
  index: number
  onSelect: (index: number) => void
}

export interface PauseOverlayProps {
  isPaused: boolean
  onResume: () => void
  onQuit: () => void
}
