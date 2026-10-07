import { GlitchButton } from '../../../GlitchButton'
import { createRovingTabs } from '../../../shared/rovingTabs'
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
  const { getTabProps } = createRovingTabs({
    ids: views.map(({ id }) => id),
    activeId: view,
    onSelect: setView
  })

  return (
    <div
      role='tablist'
      className='flex gap-4 mb-2 overflow-x-auto pb-2 custom-scrollbar touch-pan-x'
    >
      {views.map(({ id, label }) => (
        <GlitchButton
          key={id}
          role='tab'
          aria-selected={view === id}
          aria-controls={`panel-${id}`}
          id={`tab-${id}`}
          {...getTabProps(id)}
          size='sm'
          onClick={() => {
            if (view !== id) setView(id)
          }}
          className={`whitespace-nowrap shrink-0 ${view === id ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {label}
        </GlitchButton>
      ))}
    </div>
  )
}
