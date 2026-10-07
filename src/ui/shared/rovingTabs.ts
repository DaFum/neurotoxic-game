/**
 * Keyboard and roving-tabindex behaviour shared by every `role='tablist'`.
 *
 * @remarks
 * A plain factory, not a hook: it keeps no state, so callers can pass fresh
 * arrays and closures each render without defeating any memoisation.
 */

import type { KeyboardEvent } from 'react'

interface RovingTabsOptions<T extends string> {
  /** Tab ids in DOM order; must match the order of the rendered `role='tab'` elements. */
  ids: readonly T[]
  /** Id of the selected tab; only that tab is in the page Tab sequence. */
  activeId: T
  /** Selects a tab when arrow/Home/End navigation lands on it. */
  onSelect: (id: T) => void
  /** Locked tabs receive focus but are not selected. */
  isLocked?: (id: T) => boolean
}

interface RovingTabProps {
  tabIndex: 0 | -1
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}

/**
 * Implements the WAI-ARIA tabs keyboard pattern: ArrowLeft/ArrowRight wrap,
 * Home/End jump to the ends, and selection follows focus.
 * @param options - Ordered tab ids, the active id, the select callback, and an optional lock predicate.
 * @returns `getTabProps(id)`, giving each tab its roving `tabIndex` and `onKeyDown`.
 */
export const createRovingTabs = <T extends string>({
  ids,
  activeId,
  onSelect,
  isLocked
}: RovingTabsOptions<T>): { getTabProps: (id: T) => RovingTabProps } => {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, id: T) => {
    const currentIndex = ids.indexOf(id)
    if (currentIndex === -1) return

    let nextIndex: number
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % ids.length
        break
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + ids.length) % ids.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = ids.length - 1
        break
      default:
        return
    }

    const nextId = ids[nextIndex]
    if (nextId === undefined) return

    event.preventDefault()
    if (!isLocked?.(nextId)) onSelect(nextId)

    event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLElement>('[role="tab"]')
      [nextIndex]?.focus()
  }

  const getTabProps = (id: T): RovingTabProps => ({
    tabIndex: id === activeId ? 0 : -1,
    onKeyDown: event => handleKeyDown(event, id)
  })

  return { getTabProps }
}
