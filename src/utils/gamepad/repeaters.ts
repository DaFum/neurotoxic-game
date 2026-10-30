/**
 * Directional Navigation Repeater.
 * Repeats immediately on directional activation edge, after ~400 ms initial delay,
 * then every ~120 ms.
 */

import type { DirectionName } from './hysteresis'

export const INITIAL_REPEAT_DELAY_MS = 400
export const REPEAT_INTERVAL_MS = 120

export interface RepeaterResult {
  direction: DirectionName | null
  isRepeat: boolean
}

export class DirectionRepeater {
  private activeDirection: DirectionName | null = null
  private nextRepeatTime = 0

  public update(
    direction: DirectionName | null,
    timestamp: number
  ): RepeaterResult | null {
    if (direction === null) {
      this.reset()
      return null
    }

    if (this.activeDirection !== direction) {
      this.activeDirection = direction
      this.nextRepeatTime = timestamp + INITIAL_REPEAT_DELAY_MS
      return { direction, isRepeat: false }
    }

    if (timestamp >= this.nextRepeatTime) {
      this.nextRepeatTime = timestamp + REPEAT_INTERVAL_MS
      return { direction, isRepeat: true }
    }

    return null
  }

  public reset(): void {
    this.activeDirection = null
    this.nextRepeatTime = 0
  }

  public getActiveDirection(): DirectionName | null {
    return this.activeDirection
  }
}
