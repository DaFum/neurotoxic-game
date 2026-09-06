import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { EXPEDITION_CREW } from '../../data/expedition/crew'
import { isCrewAvailable } from '../../domain/expedition/crew'

interface ExpeditionCrewPickerProps {
  selectedCrewIds: string[]
  onChange: (crewIds: string[]) => void
}

export const ExpeditionCrewPicker = memo(function ExpeditionCrewPicker({
  selectedCrewIds,
  onChange
}: ExpeditionCrewPickerProps) {
  const { t } = useTranslation('ui')
  const availability = useGameSelector(state =>
    Object.fromEntries(
      EXPEDITION_CREW.map(crew => [crew.id, isCrewAvailable(state, crew.id)])
    )
  )
  return (
    <fieldset className='flex flex-col gap-2 border-2 border-steel-gray p-3'>
      <legend className='px-1 text-xs uppercase tracking-widest text-toxic-green'>
        {t('ui:expedition.crew.picker', {
          count: selectedCrewIds.length,
          max: 3
        })}
      </legend>
      <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
        {EXPEDITION_CREW.map(crew => {
          const selected = selectedCrewIds.includes(crew.id)
          const disabled =
            !availability[crew.id] || (!selected && selectedCrewIds.length >= 3)
          return (
            <button
              key={crew.id}
              type='button'
              aria-pressed={selected}
              disabled={disabled}
              onClick={() =>
                onChange(
                  selected
                    ? selectedCrewIds.filter(id => id !== crew.id)
                    : [...selectedCrewIds, crew.id]
                )
              }
              className='min-h-11 border-2 border-steel-gray bg-charcoal-gray p-2 text-left font-mono uppercase text-star-white shadow-[3px_3px_0_var(--color-toxic-green)] disabled:opacity-40'
            >
              <strong>{t(crew.displayNameKey)}</strong>
              <span className='block text-xs text-ash-gray'>
                {t(`ui:expedition.crew.role.${crew.role}`)}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
})
