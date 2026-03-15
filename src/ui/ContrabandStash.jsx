import {
  Modal,
  Panel,
  AnimatedDivider,
  ActionButton,
  HexBorder
} from './shared/index.jsx'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from './GlitchButton'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'

/**
 * Contraband Stash Modal Component
 * Displays acquired relics and consumables.
 */
import { useCallback } from 'react'

export const ContrabandStash = ({
  stash = [],
  members = [],
  selectedMember,
  setSelectedMember,
  useItem,
  onClose
}) => {
  const { t } = useTranslation(['ui', 'items'])

  const makeSelectMember = useCallback(
    id => () => setSelectedMember(id),
    [setSelectedMember]
  )

  const makeUseItem = useCallback(
    (instanceId, item) => () => useItem(instanceId, item),
    [useItem]
  )

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      className='max-w-4xl'
      contentClassName='flex-1 min-h-0 flex flex-col max-h-[90vh]'
    >
      <Panel
        title={t('ui:contraband.title', { defaultValue: 'CONTRABAND STASH' })}
        className='w-full max-w-4xl max-h-[85vh] flex flex-col'
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
        <div className='mb-6 bg-shadow-black border border-toxic-green-20 p-4 rounded-sm'>
          <h3 className='text-toxic-green text-sm font-bold mb-3 uppercase tracking-wider'>
            {t('ui:contraband.targetMemberLabel', {
              defaultValue: 'Target Member:'
            })}
          </h3>
          <div className='flex flex-wrap gap-2'>
            {members.map(m => (
              <button
                key={m.id}
                type='button'
                onClick={makeSelectMember(m.id)}
                className={`px-4 py-2 border font-mono text-sm transition-colors ${
                  selectedMember === m.id
                    ? 'border-toxic-green bg-toxic-green-20 text-star-white'
                    : 'border-ash-gray bg-transparent text-ash-gray hover:border-toxic-green hover:text-toxic-green'
                }`}
              >
                {m.name ?? t('ui:member.unknown', { defaultValue: 'Unknown' })}
              </button>
            ))}
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
            stash.map(item => {
              const requiresTarget =
                item.effectType === 'stamina' || item.effectType === 'mood'
              return (
                <HexBorder
                  key={item.instanceId}
                  color='var(--color-toxic-green)'
                  className='bg-void-black flex flex-col justify-between'
                  padding='p-4'
                >
                  <div>
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex flex-col gap-1'>
                        <h4 className='text-toxic-green font-bold text-lg font-[Metal_Mania] tracking-wider uppercase drop-shadow-[0_0_5px_var(--color-toxic-green-20)]'>
                          {t(`items:contraband.${item.id}.name`, {
                            defaultValue: t('ui:item.unknown', {
                              defaultValue: 'Unknown Item'
                            })
                          })}
                        </h4>
                        <div className='flex gap-2 text-xs font-mono'>
                          <span
                            className={
                              item.rarity === 'common'
                                ? 'text-ash-gray'
                                : item.rarity === 'uncommon'
                                  ? 'text-electric-blue'
                                  : item.rarity === 'rare'
                                    ? 'text-toxic-green'
                                    : 'text-alert-amber' // epic
                            }
                          >
                            {t(`ui:rarity.${item.rarity}`, {
                              defaultValue: item.rarity?.toUpperCase()
                            })}
                          </span>
                        </div>
                      </div>
                      <div className='flex flex-col gap-1 items-end'>
                        <span
                          className={`text-xs px-2 py-1 rounded border font-mono ${
                            item.type === 'consumable'
                              ? 'border-blood-red text-blood-red bg-blood-red-20'
                              : 'border-electric-blue text-electric-blue bg-electric-blue-20'
                          }`}
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
                      {item.imagePrompt && (
                        <div className='w-20 h-20 shrink-0 border border-toxic-green-20 bg-black flex items-center justify-center p-1 rounded overflow-hidden shadow-[0_0_10px_var(--color-toxic-green-10)]'>
                          <img
                            src={getGenImageUrl(IMG_PROMPTS[item.imagePrompt])}
                            alt={t(`items:contraband.${item.id}.name`)}
                            className='w-full h-full object-contain'
                            loading='lazy'
                          />
                        </div>
                      )}
                      <p className='text-ash-gray text-xs min-h-[40px] leading-relaxed flex-1'>
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
                      <p className='text-blood-red text-xs mb-2 italic'>
                        {t('ui:contraband.requiresTarget', {
                          defaultValue: 'Requires target member.'
                        })}
                      </p>
                    ) : null}

                    {item.applied ? (
                      <div className='w-full text-center text-xs text-electric-blue border border-electric-blue-20 py-2 bg-electric-blue-10'>
                        {t('ui:contraband.applied', {
                          defaultValue: 'APPLIED'
                        })}
                      </div>
                    ) : item.type === 'consumable' || !item.applyOnAdd ? (
                      <ActionButton
                        onClick={makeUseItem(item.instanceId, item)}
                        disabled={requiresTarget && !selectedMember}
                        variant='primary'
                        className='w-full text-sm font-bold'
                      >
                        {item.type === 'consumable'
                          ? t('ui:contraband.useItem', {
                              defaultValue: 'USE ITEM'
                            })
                          : t('ui:contraband.applyItem', {
                              defaultValue: 'APPLY EFFECT'
                            })}
                      </ActionButton>
                    ) : (
                      <div className='w-full text-center text-xs text-electric-blue border border-electric-blue-20 py-2 bg-electric-blue-10'>
                        {t('ui:contraband.passiveActive', {
                          defaultValue: 'PASSIVE EFFECT ACTIVE'
                        })}
                      </div>
                    )}
                  </div>
                </HexBorder>
              )
            })
          )}
        </div>

        <div className='mt-8 flex justify-end shrink-0'>
          <GlitchButton onClick={onClose} variant='secondary'>
            {t('ui:contraband.close', { defaultValue: 'CLOSE STASH' })}
          </GlitchButton>
        </div>
      </Panel>
    </Modal>
  )
}
