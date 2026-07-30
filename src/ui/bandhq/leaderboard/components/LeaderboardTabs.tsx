import { GlitchButton } from '../../../GlitchButton'
import type { KeyboardEvent } from 'react'
import type { LeaderboardView } from '../types'

interface LeaderboardTabsProps {
  view: LeaderboardView
  setView: (view: LeaderboardView) => void
  views: Array<{ id: LeaderboardView; label: string }>
}

export const LeaderboardTabs = ({
  view,
  setView,
  views
}: LeaderboardTabsProps) => {
  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % views.length
        break
      case 'ArrowLeft':
        nextIndex = (index - 1 + views.length) % views.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = views.length - 1
        break
      default:
        return
    }

    const nextView = views[nextIndex]
    if (!nextView) return

    event.preventDefault()
    const tabList = event.currentTarget.closest('[role="tablist"]')
    const nextTab =
      tabList?.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex]

    setView(nextView.id)
    nextTab?.focus()
  }

  return (
    <div
      role='tablist'
      className='flex gap-4 mb-2 overflow-x-auto pb-2 custom-scrollbar touch-pan-x'
    >
      {views.map(({ id, label }, index) => (
        <GlitchButton
          key={id}
          role='tab'
          aria-selected={view === id}
          aria-controls={`panel-${id}`}
          id={`tab-${id}`}
          tabIndex={view === id ? 0 : -1}
          size='sm'
          onClick={() => {
            if (view !== id) setView(id)
          }}
          onKeyDown={event => handleKeyDown(event, index)}
          className={`whitespace-nowrap shrink-0 ${view === id ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {label}
        </GlitchButton>
      ))}
    </div>
  )
}
