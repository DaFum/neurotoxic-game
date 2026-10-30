/**
 * Spatial Navigation Engine.
 * Calculates directional focus targets using bounding box centers and cone weighting.
 */

import { getFocusableElements, getActiveFocusScope } from '../../ui/shared/useModalBehavior'
import type { DirectionName } from './hysteresis'

export function getNavigableCandidates(): HTMLElement[] {
  const scopes = getActiveFocusScope()
  const candidates: HTMLElement[] = []

  for (const scope of scopes) {
    if (!scope || !scope.isConnected) continue
    const elements = getFocusableElements(scope)
    for (const el of elements) {
      if (
        el.getAttribute('aria-disabled') !== 'true' &&
        !candidates.includes(el)
      ) {
        candidates.push(el)
      }
    }
  }

  return candidates
}

export function getInitialFocusTarget(): HTMLElement | null {
  const candidates = getNavigableCandidates()
  if (candidates.length === 0) return null

  const autofocusTarget = candidates.find(
    el =>
      el.hasAttribute('data-gamepad-autofocus') &&
      el.getAttribute('data-gamepad-autofocus') !== 'false'
  )

  return autofocusTarget ?? candidates[0] ?? null
}

interface RectCenter {
  cx: number
  cy: number
  rect: DOMRect
  element: HTMLElement
}

export function getSpatialNextTarget(
  currentEl: HTMLElement,
  direction: DirectionName
): HTMLElement | null {
  const candidates = getNavigableCandidates()
  const otherCandidates = candidates.filter(el => el !== currentEl)

  if (otherCandidates.length === 0) return null

  const currentRect = currentEl.getBoundingClientRect()
  const currentCenter: RectCenter = {
    cx: currentRect.left + currentRect.width / 2,
    cy: currentRect.top + currentRect.height / 2,
    rect: currentRect,
    element: currentEl
  }

  let bestTarget: HTMLElement | null = null
  let bestScore = Infinity

  for (const candidate of otherCandidates) {
    const rect = candidate.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const dx = cx - currentCenter.cx
    const dy = cy - currentCenter.cy

    let primaryDist = 0
    let secondaryDist = 0
    let isInDirection = false

    switch (direction) {
      case 'right':
        if (dx > 0) {
          isInDirection = true
          primaryDist = dx
          secondaryDist = Math.abs(dy)
        }
        break
      case 'left':
        if (dx < 0) {
          isInDirection = true
          primaryDist = -dx
          secondaryDist = Math.abs(dy)
        }
        break
      case 'down':
        if (dy > 0) {
          isInDirection = true
          primaryDist = dy
          secondaryDist = Math.abs(dx)
        }
        break
      case 'up':
        if (dy < 0) {
          isInDirection = true
          primaryDist = -dy
          secondaryDist = Math.abs(dx)
        }
        break
    }

    if (isInDirection) {
      const score = primaryDist + secondaryDist * 2.5
      if (score < bestScore) {
        bestScore = score
        bestTarget = candidate
      }
    }
  }

  if (!bestTarget) {
    const currentIndex = candidates.indexOf(currentEl)
    if (currentIndex !== -1) {
      if (direction === 'right' || direction === 'down') {
        bestTarget = candidates[(currentIndex + 1) % candidates.length]
      } else {
        bestTarget =
          candidates[
            (currentIndex - 1 + candidates.length) % candidates.length
          ]
      }
    }
  }

  return bestTarget
}
