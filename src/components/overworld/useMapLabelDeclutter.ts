import { useLayoutEffect, type RefObject } from 'react'
import { pickHiddenMapLabels, type MapLabelEntry } from './mapLabelDeclutter'

const LABEL_SELECTOR = '[data-testid="map-node-label"]'
const HIDDEN_ATTRIBUTE = 'data-declutter-hidden'

const clearFlags = (container: HTMLElement): void => {
  for (const label of container.querySelectorAll(LABEL_SELECTOR)) {
    label.removeAttribute(HIDDEN_ATTRIBUTE)
  }
}

/**
 * Hides lower-priority map-node labels that would overlap a more important one.
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
      container
        .querySelectorAll<HTMLElement>('.map-node')
        .forEach((node, i) => {
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
          entries.push({
            id: String(i),
            priority: Number(node.dataset.labelPriority ?? 3),
            rects
          })
        })
      const hidden = pickHiddenMapLabels(entries)
      container
        .querySelectorAll<HTMLElement>('.map-node')
        .forEach((node, i) => {
          if (!hidden.has(String(i))) return
          node
            .querySelector(LABEL_SELECTOR)
            ?.setAttribute(HIDDEN_ATTRIBUTE, 'true')
        })
    }

    run()
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(run) : null
    observer?.observe(container)
    return () => observer?.disconnect()
  }, [containerRef, enabled, nodesRevision, focusRevision])
}
