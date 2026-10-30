/**
 * Edge Detection & Suppressed Hold / Re-arming logic.
 * Suppresses held-button presses until release after consumer registration,
 * modal transition, or window focus regain.
 */

export class ArmedEdges {
  private armedMap = new Map<number | string, boolean>()
  private lastPressedMap = new Map<number | string, boolean>()

  public arm(key: number | string): void {
    this.armedMap.set(key, true)
  }

  public disarm(key: number | string): void {
    this.armedMap.set(key, false)
  }

  public rearmHeld(
    isPressedFn: (key: number | string) => boolean,
    keys: Iterable<number | string>
  ): void {
    for (const key of keys) {
      if (isPressedFn(key)) {
        this.armedMap.set(key, false)
      } else {
        this.armedMap.set(key, true)
      }
    }
  }

  public disarmAll(): void {
    for (const key of this.armedMap.keys()) {
      this.armedMap.set(key, false)
    }
  }

  public reset(): void {
    this.armedMap.clear()
    this.lastPressedMap.clear()
  }

  public processInput(
    key: number | string,
    isPressed: boolean
  ): { pressEdge: boolean; releaseEdge: boolean } {
    const wasPressed = Boolean(this.lastPressedMap.get(key))
    const isArmed = this.armedMap.get(key) !== false

    let pressEdge = false
    let releaseEdge = false

    if (!wasPressed && isPressed) {
      if (isArmed) {
        pressEdge = true
      }
      this.lastPressedMap.set(key, true)
    } else if (wasPressed && !isPressed) {
      releaseEdge = true
      this.lastPressedMap.set(key, false)
      this.armedMap.set(key, true)
    } else if (!isPressed) {
      this.armedMap.set(key, true)
      this.lastPressedMap.set(key, false)
    }

    return { pressEdge, releaseEdge }
  }

  public setLastPressed(key: number | string, isPressed: boolean): void {
    this.lastPressedMap.set(key, isPressed)
    if (!isPressed) {
      this.armedMap.set(key, true)
    }
  }
}
