import { useLayoutEffect, type RefObject } from 'react'
import { pickMapLabelPlacements, type MapLabelEntry } from './mapLabelDeclutter'
import type { Rect } from '../chatterPlacement'

const LABEL_SELECTOR = '[data-testid="map-node-label"]'
const HIDDEN_ATTRIBUTE = 'data-declutter-hidden'
const ANCHOR_ATTRIBUTE = 'data-label-anchor'
const HUD_SELECTOR =
  '.ow-menu button, [data-testid="overworld-phone-resources"], button[aria-label*="keyboard shortcuts" i]'

const clearFlags = (container: HTMLElement): void => {
  for (const label of container.querySelectorAll(LABEL_SELECTOR)) {
    label.removeAttribute(HIDDEN_ATTRIBUTE)
    label.removeAttribute(ANCHOR_ATTRIBUTE)
    if (label instanceof HTMLElement)
      label.style.setProperty('--map-label-gap', '28px')
  }
}

/**
 * Places labels below or above their node before hiding blocked labels.
 *
 * @param containerRef - The map element holding the `.map-node` children.
 * @param enabled - Whether to run; when off, any hidden flag is cleared.
 * @param nodesRevision - Changes whenever the rendered nodes change.
 * @param focusRevision - Changes whenever the hover/focus target changes.
 *
 * @remarks
 * The flag is applied imperatively as `data-declutter-hidden` (styled
 * `invisible` in `MapNodeView`), so the label keeps its layout slot and a hidden
 * label is still part of the next measurement. The node's tooltip and
 * aria-label are untouched.
 */
export const useMapLabelDeclutter = (
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  nodesRevision: unknown,
  focusRevision: unknown
): void => {
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!enabled) {
      clearFlags(container)
      return
    }

    const run = () => {
      clearFlags(container)
      const entries: MapLabelEntry[] = []
      const bounds = container.getBoundingClientRect()
      const hudObstacles: { ownerId: string; rect: Rect }[] = [
        ...document.querySelectorAll<HTMLElement>(HUD_SELECTOR)
      ].flatMap(element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
          ? [{ ownerId: 'hud', rect }]
          : []
      })
      const obstacles = [...hudObstacles]
      container
        .querySelectorAll<HTMLElement>('.map-node')
        .forEach((node, i) => {
          const host = node.getBoundingClientRect()
          const centerX = (host.left + host.right) / 2
          const centerY = (host.top + host.bottom) / 2
          const hex = node.querySelector<HTMLElement>('[data-map-node-hex]')
          if (hex)
            obstacles.push({
              ownerId: String(i),
              // Motion initially scales the hexagon to zero. Reserve its final
              // layout footprint so the reveal cannot grow over a kept label.
              rect: {
                left: centerX - hex.offsetWidth / 2,
                right: centerX + hex.offsetWidth / 2,
                top: centerY - hex.offsetHeight / 2,
                bottom: centerY + hex.offsetHeight / 2
              }
            })
          const label = node.querySelector<HTMLElement>(LABEL_SELECTOR)
          if (!label) return
          const rects = [...label.children]
            .filter(child => getComputedStyle(child).display !== 'none')
            .map(child => child.getBoundingClientRect())
            .filter(r => r.width > 0 && r.height > 0)
            .map(r => ({
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom
            }))
          if (rects.length === 0) return
          const separatedRow = label.getBoundingClientRect().height + 4
          const gaps = [28, 64, 64 + separatedRow, 64 + 2 * separatedRow]
          const top = Math.min(...rects.map(rect => rect.top))
          const bottom = Math.max(...rects.map(rect => rect.bottom))
          const edgeGaps = [
            28 + 2 * centerY - bottom - bounds.top,
            28 + bounds.bottom - bottom
          ].filter(gap => gap >= 28)
          const hudGaps = hudObstacles
            .flatMap(({ rect }) => [
              28 + rect.bottom + 4 - top,
              28 + 2 * centerY - top - rect.top + 4
            ])
            .filter(gap => gap >= 28)
          entries.push({
            id: String(i),
            priority: Number(node.dataset.labelPriority ?? 3),
            candidates: [...gaps, ...hudGaps, ...edgeGaps].flatMap(gap => [
              {
                anchor: 'below' as const,
                gap,
                rects: rects.map(rect => ({
                  ...rect,
                  top: rect.top + gap - 28,
                  bottom: rect.bottom + gap - 28
                }))
              },
              {
                anchor: 'above' as const,
                gap,
                rects: rects.map(rect => ({
                  left: rect.left,
                  right: rect.right,
                  top: 2 * centerY - rect.bottom - gap + 28,
                  bottom: 2 * centerY - rect.top - gap + 28
                }))
              }
            ])
          })
        })
      const placements = pickMapLabelPlacements(entries, {
        bounds,
        obstacles
      })
      container
        .querySelectorAll<HTMLElement>('.map-node')
        .forEach((node, i) => {
          const label = node.querySelector<HTMLElement>(LABEL_SELECTOR)
          const placement = placements.get(String(i))
          if (!label || placement === undefined) return
          if (placement === null) label.setAttribute(HIDDEN_ATTRIBUTE, 'true')
          else {
            label.setAttribute(ANCHOR_ATTRIBUTE, placement.anchor)
            label.style.setProperty('--map-label-gap', `${placement.gap}px`)
          }
        })
    }

    run()
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(run) : null
    observer?.observe(container)
    document
      .querySelectorAll(HUD_SELECTOR)
      .forEach(element => observer?.observe(element))
    // Fixed HUD boxes stay in viewport coordinates as the scene scrolls.
    document.addEventListener('scroll', run, true)
    return () => {
      observer?.disconnect()
      document.removeEventListener('scroll', run, true)
    }
  }, [containerRef, enabled, nodesRevision, focusRevision])
}
