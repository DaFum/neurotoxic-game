import { useLayoutEffect, type RefObject } from 'react'
import { pickMapLabelPlacements, type MapLabelEntry } from './mapLabelDeclutter'
import type { Rect } from '../chatterPlacement'

const LABEL_SELECTOR = '[data-testid="map-node-label"]'
const HIDDEN_ATTRIBUTE = 'data-declutter-hidden'
const ANCHOR_ATTRIBUTE = 'data-label-anchor'

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
      const obstacles: { ownerId: string; rect: Rect }[] = []
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
          entries.push({
            id: String(i),
            priority: Number(node.dataset.labelPriority ?? 3),
            candidates: gaps.flatMap(gap => [
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
        bounds: container.getBoundingClientRect(),
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
    return () => observer?.disconnect()
  }, [containerRef, enabled, nodesRevision, focusRevision])
}
