import { useCallback, useMemo } from 'react'
import type { ContrabandStashItem, UnknownRecord } from '../types'
import { Modal, Panel, AnimatedDivider, ActionButton } from './shared/index.tsx'
import { useTranslation } from 'react-i18next'

import { GlitchButton } from './GlitchButton'
import { logger } from '../utils/logger'
import {
  IMG_PROMPTS,
  resolveGenImageUrl,
  getGeneratedImageFallbackUrl
} from '../utils/imageGen'

/**
 * Contraband Stash Modal Component
 * Displays acquired relics and consumables.
 */

interface ContrabandStashProps {
  stash?: UnknownRecord[]
  members?: UnknownRecord[]
  selectedMember?: string | null
  setSelectedMember?: (id: string) => void
  handleUseItem?: (instanceId: string, item: DisplayStashItem) => void
  onClose?: () => void
}

type BandMemberItem = {
  id: string
  name?: string
}

type DisplayStashItem = ContrabandStashItem & {
  id: string
  rarity?: string
  duration?: number
  imagePrompt?: string
  description?: string
  applied?: boolean
  applyOnAdd?: boolean
}

const isBandMember = (value: unknown): value is BandMemberItem => {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    (obj.name === undefined || typeof obj.name === 'string')
  )
}

const isStashItem = (value: unknown): value is DisplayStashItem => {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return typeof obj.id === 'string' && typeof obj.description === 'string'
}

const getRarityClass = (rarity: string | undefined): string => {
  switch (rarity) {
    case 'common':
      return 'text-ash-gray'
    case 'uncommon':
      return 'text-electric-blue'
    case 'rare':
      return 'text-toxic-green'
    default:
      return 'text-alert-amber' // epic
  }
}

interface StashCardProps {
  item: DisplayStashItem
  selectedMember?: string | null
  onUseItem: () => void
  t: ReturnType<typeof useTranslation>['t']
}

const StashCard = ({ item, selectedMember, onUseItem, t }: StashCardProps) => {
  const requiresTarget =
    item.effectType === 'stamina' || item.effectType === 'mood'
  const typeBadgeClass =
    item.type === 'consumable'
      ? 'border-blood-red text-error-red bg-blood-red-20'
      : 'border-electric-blue text-electric-blue bg-electric-blue-20'

  return (
    <div className='bg-void-black flex flex-col justify-between border border-toxic-green p-4'>
      <div>
        <div className='flex justify-between items-start mb-2'>
          <div className='flex flex-col gap-1'>
            <h4 className='text-toxic-green font-bold text-lg font-display tracking-wider uppercase drop-shadow-[0_0_5px_var(--color-toxic-green-20)]'>
              {t(`items:contraband.${item.id}.name`, {
                defaultValue: t('ui:item.unknown', {
                  defaultValue: 'Unknown Item'
                })
              })}
            </h4>
            <div className='flex gap-2 text-xs font-mono'>
              <span className={getRarityClass(item.rarity)}>
                {t(`ui:rarity.${item.rarity ?? 'unknown'}`, {
                  defaultValue: item.rarity?.toUpperCase() ?? 'UNKNOWN'
                })}
              </span>
            </div>
          </div>
          <div className='flex flex-col gap-1 items-end'>
            <span
              className={`text-xs px-2 py-1 border font-mono ${typeBadgeClass}`}
            >
              {item.type
                ? t(`ui:item.type_${item.type}`, {
                    defaultValue: item.type
                  })
                : t('ui:item.typeUnknown', {
                    defaultValue: 'Unknown Type'
                  })}
            </span>
            {item.duration && (
              <span className='text-xs text-ash-gray italic'>
                {item.duration}{' '}
                {t('ui:contraband.gigs', { defaultValue: 'GIGS' })}
              </span>
            )}
          </div>
        </div>
        <div className='flex flex-row gap-4 items-start mb-4'>
          {item.imagePrompt && Object.hasOwn(IMG_PROMPTS, item.imagePrompt) && (
            <div className='w-20 h-20 shrink-0 border border-toxic-green-20 bg-void-black flex items-center justify-center p-1 overflow-hidden shadow-[0_0_10px_var(--color-toxic-green-10)]'>
              <img
                src={resolveGenImageUrl(
                  IMG_PROMPTS[item.imagePrompt as keyof typeof IMG_PROMPTS]
                )}
                alt={t(`items:contraband.${item.id}.name`)}
                className='w-full h-full object-contain'
                loading='lazy'
                onError={e => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = getGeneratedImageFallbackUrl()
                }}
              />
            </div>
          )}
          <p className='text-ash-gray text-xs min-h-10 leading-relaxed flex-1'>
            {item.description
              ? t(item.description, {
                  defaultValue: t('ui:item.descriptionUnknown', {
                    defaultValue: 'Unknown Description'
                  })
                })
              : t('ui:item.descriptionUnknown', {
                  defaultValue: 'Unknown Description'
                })}
          </p>
        </div>
      </div>

      <div className='mt-auto'>
        {requiresTarget &&
        !selectedMember &&
        !item.applied &&
        item.type === 'consumable' ? (
          <p className='text-error-red text-xs mb-2 italic'>
            {t('ui:contraband.requiresTarget', {
              defaultValue: 'Requires target member.'
            })}
          </p>
        ) : null}

        {item.applied ? (
          <div className='w-full text-center text-xs text-electric-blue border border-electric-blue-20 py-2 bg-electric-blue-10'>
            {t('ui:contraband.applied', { defaultValue: 'APPLIED' })}
          </div>
        ) : item.type === 'consumable' || !item.applyOnAdd ? (
          <ActionButton
            onClick={onUseItem}
            disabled={requiresTarget && !selectedMember}
            variant='primary'
            className='w-full text-sm font-bold'
          >
            {item.type === 'consumable'
              ? t('ui:contraband.useItem', { defaultValue: 'USE ITEM' })
              : t('ui:contraband.applyItem', { defaultValue: 'APPLY EFFECT' })}
          </ActionButton>
        ) : (
          <div className='w-full text-center text-xs text-electric-blue border border-electric-blue-20 py-2 bg-electric-blue-10'>
            {t('ui:contraband.passiveActive', {
              defaultValue: 'PASSIVE EFFECT ACTIVE'
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export const ContrabandStash = ({
  stash = [],
  members = [],
  selectedMember,
  setSelectedMember,
  handleUseItem,
  onClose
}: ContrabandStashProps) => {
  const { t } = useTranslation(['ui', 'items'])

  const makeSelectMember = useCallback(
    (id: string) => () => setSelectedMember?.(id),
    [setSelectedMember]
  )

  const makeUseItem = useCallback(
    (instanceId: string, item: DisplayStashItem) => () =>
      handleUseItem?.(instanceId, item),
    [handleUseItem]
  )

  const renderedStashCards = useMemo(() => {
    if (!Array.isArray(stash)) return []
    const cards = []
    for (let i = 0; i < stash.length; i++) {
      const item = stash[i]
      if (isStashItem(item)) {
        cards.push(
          <StashCard
            key={item.instanceId ?? `migrated-${item.id}`}
            item={item}
            selectedMember={selectedMember}
            onUseItem={makeUseItem(item.instanceId ?? item.id, item)}
            t={t}
          />
        )
      }
    }
    return cards
  }, [stash, selectedMember, makeUseItem, t])

  if (
    !Array.isArray(stash) ||
    !Array.isArray(members) ||
    typeof handleUseItem !== 'function' ||
    typeof onClose !== 'function'
  ) {
    logger.error('ContrabandStash', 'Invalid props passed to ContrabandStash')
    return null
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      className='max-w-4xl'
      contentClassName='flex-1 min-h-0 flex flex-col max-h-[calc(100svh-4rem)]'
    >
      <Panel
        title={t('ui:contraband.title', { defaultValue: 'CONTRABAND STASH' })}
        className='w-full max-w-4xl max-h-[calc(100svh-4rem)] flex flex-col'
        contentClassName='flex-1 min-h-0 flex flex-col p-4 sm:p-6 overflow-y-auto'
      >
        <p className='text-ash-gray text-sm mb-4'>
          {t('ui:contraband.description', {
            defaultValue:
              'Artifacts and strange detritus gathered from the void. Use with caution.'
          })}
        </p>
        <AnimatedDivider className='mb-6' />

        {/* Member Selection for targeted items */}
        <div className='mb-6 bg-shadow-black border border-toxic-green-20 p-4 '>
          <h3 className='text-toxic-green text-sm font-bold mb-3 uppercase tracking-wider'>
            {t('ui:contraband.targetMemberLabel', {
              defaultValue: 'Target Member:'
            })}
          </h3>
          <div className='flex flex-wrap gap-2'>
            {members.map(m => {
              if (!isBandMember(m)) return null
              return (
                <button
                  key={m.id}
                  type='button'
                  aria-pressed={selectedMember === m.id}
                  onClick={makeSelectMember(m.id)}
                  className={`px-4 py-2 border font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green ${
                    selectedMember === m.id
                      ? 'border-toxic-green bg-toxic-green-20 text-star-white'
                      : 'border-ash-gray bg-transparent text-ash-gray hover:border-toxic-green hover:text-toxic-green'
                  }`}
                >
                  {m.name ??
                    t('ui:member.unknown', { defaultValue: 'Unknown' })}
                </button>
              )
            })}
          </div>
        </div>

        {/* Stash Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {stash.length === 0 ? (
            <div className='col-span-full text-center py-10 text-ash-gray italic border border-dashed border-toxic-green-20'>
              {t('ui:contraband.noItems', {
                defaultValue: 'No contraband collected yet.'
              })}
            </div>
          ) : (
            renderedStashCards
          )}
        </div>

        <div className='mt-8 flex justify-end shrink-0'>
          <GlitchButton onClick={onClose} variant='primary'>
            {t('ui:contraband.close', { defaultValue: 'CLOSE STASH' })}
          </GlitchButton>
        </div>
      </Panel>
    </Modal>
  )
}
