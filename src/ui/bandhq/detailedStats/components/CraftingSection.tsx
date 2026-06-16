import { getStashStacks } from '../helpers'
import { Panel } from '../../../shared'
import type { BasicTProps } from '../types'
import { CRAFTING_RECIPES } from '../../../../data/craftingRecipes'

export const CraftingSection = ({
  stash,
  onCraft,
  t
}: {
  stash: Record<string, unknown> | undefined
  onCraft?: (recipeId: string) => void
} & BasicTProps) => {
  const recipes = Object.values(CRAFTING_RECIPES)
  return (
    <Panel title={t('ui:crafting.title', { defaultValue: 'Workshop' })}>
      <div className='space-y-2'>
        {recipes.map(recipe => {
          const canCraft = Object.entries(recipe.inputs).every(
            ([itemId, qty]) => getStashStacks(stash, itemId) >= qty
          )
          return (
            <div
              key={recipe.id}
              className='flex items-center justify-between gap-2'
            >
              <div className='min-w-0'>
                <div className='text-xs text-toxic-green font-mono truncate'>
                  {t(recipe.labelKey, { defaultValue: recipe.id })}
                </div>
                <div className='text-[10px] text-ash-gray truncate'>
                  {t(recipe.descKey, { defaultValue: '' })}
                </div>
              </div>
              {onCraft && (
                <button
                  type='button'
                  disabled={!canCraft}
                  onClick={() => onCraft(recipe.id)}
                  aria-label={`${t('ui:crafting.craft', {
                    defaultValue: 'Craft'
                  })} ${t(recipe.labelKey, { defaultValue: recipe.id })}`}
                  className='shrink-0 text-xs px-2 py-0.5 border border-toxic-green/50 text-toxic-green uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-toxic-green/10'
                >
                  {t('ui:crafting.craft', { defaultValue: 'Craft' })}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
