import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { ProgressBar, Panel, Tooltip } from '../shared'
import { CHARACTERS } from '../../data/characters'

// Helpers (Module Scope)
const isUnlocked = val => {
  if (typeof val === 'number') return val > 0
  if (typeof val === 'boolean') return val
  if (Array.isArray(val)) return val.length > 0
  return !!val
}

const CHAR_MAP = Object.fromEntries(
  Object.values(CHARACTERS).map(c => [c.name, c])
)

const DetailRow = ({ label, value, subtext, locked, className = '' }) => (
  <div
    className={`flex justify-between items-center py-1 border-b border-(--ash-gray)/20 font-mono text-sm ${locked ? 'opacity-40 grayscale' : ''} ${className}`}
  >
    <span className='text-(--ash-gray)'>{label}</span>
    <div className='text-right'>
      <div
        className={`font-bold ${locked ? 'text-(--ash-gray)' : 'text-(--star-white)'}`}
      >
        {value}
      </div>
      {subtext && (
        <div className='text-[10px] text-(--ash-gray)/60'>{subtext}</div>
      )}
    </div>
  </div>
)

export const DetailedStatsTab = ({ player, band, social, ...state }) => {
  const { t } = useTranslation(['ui', 'items', 'venues'])
  const totalReach =
    (social.instagram ?? 0) +
    (social.tiktok ?? 0) +
    (social.youtube ?? 0) +
    (social.newsletter ?? 0)
  const activeQuests = state.activeQuests || []
  const venueBlacklist = state.venueBlacklist || []
  const reputationByRegion = state.reputationByRegion || {}

  return (
    <div className='space-y-8'>
      {/* Top Row: Career & Social Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Panel
          title={t('ui:stats.career_overview', {
            defaultValue: 'Career Overview'
          })}
        >
          <DetailRow
            label={t('ui:stats.funds', { defaultValue: 'Funds' })}
            value={`${player.money}€`}
          />
          <DetailRow
            label={t('ui:stats.fame', { defaultValue: 'Fame' })}
            value={player.fame}
            subtext={`${t('ui:ui.level', { defaultValue: 'Level' })} ${player.fameLevel || 0}`}
          />
          <DetailRow
            label={t('ui:ui.day', { defaultValue: 'Day' })}
            value={player.day}
          />
          <DetailRow
            label={t('ui:ui.time', { defaultValue: 'Time' })}
            value={`${player.time || '12'}:00`}
          />
          <DetailRow
            label={t('ui:ui.location', { defaultValue: 'Location' })}
            value={t(`venues:${player.location}.name`, {
              defaultValue: player.location
            })}
          />
          <DetailRow
            label={t('ui:detailedStats.totalTravels')}
            value={player.totalTravels}
          />
          <DetailRow
            label={t('ui:detailedStats.passiveFollowers')}
            value={t('ui:detailedStats.passiveFollowersPerDay', {
              count: player.passiveFollowers
            })}
            locked={!isUnlocked(player.passiveFollowers)}
          />
          <DetailRow
            label={t('ui:detailedStats.hqUpgrades.count')}
            value={t('ui:detailedStats.hqUpgrades.installed', {
              count: (player.hqUpgrades || []).length,
              defaultValue: `${(player.hqUpgrades || []).length} Installed`
            })}
            subtext={
              player.hqUpgrades?.join(', ') ||
              t('ui:detailedStats.hqUpgrades.none', { defaultValue: 'None' })
            }
          />
          {player.stats?.proveYourselfMode && (
            <DetailRow
              label={t('ui:detailedStats.mode.label')}
              value={t('ui:detailedStats.mode.proveYourself')}
              subtext={t('ui:detailedStats.mode.restrictions')}
              className='bg-(--toxic-green)/10'
            />
          )}
        </Panel>

        <Panel
          title={t('ui:stats.social_reach', {
            defaultValue: 'Social Media Reach'
          })}
        >
          <DetailRow
            label={t('ui:stats.instagram', { defaultValue: 'Instagram' })}
            value={social.instagram}
            locked={!isUnlocked(social.instagram)}
          />
          <DetailRow
            label={t('ui:stats.tiktok', { defaultValue: 'TikTok' })}
            value={social.tiktok}
            locked={!isUnlocked(social.tiktok)}
          />
          <DetailRow
            label={t('ui:stats.youtube', { defaultValue: 'YouTube' })}
            value={social.youtube}
            locked={!isUnlocked(social.youtube)}
          />
          <DetailRow
            label={t('ui:stats.newsletter', { defaultValue: 'Newsletter' })}
            value={social.newsletter}
            locked={!isUnlocked(social.newsletter)}
          />
          <DetailRow
            label={t('ui:stats.totalReach', { defaultValue: 'Total Reach' })}
            value={totalReach}
          />
          <DetailRow
            label={t('ui:stats.viralStatus', { defaultValue: 'Viral Status' })}
            value={
              social.viral
                ? t('ui:stats.viral', { defaultValue: 'VIRAL' })
                : t('ui:stats.normal', { defaultValue: 'Normal' })
            }
            locked={!social.viral}
          />

          <div className='mt-2 border-t border-(--ash-gray)/20 pt-2'>
            <div className='text-xs text-(--ash-gray) mb-1 font-bold italic tracking-tighter'>
              {t('ui:stats.socialDynamics', {
                defaultValue: 'SOCIAL DYNAMICS'
              })}
            </div>
            <DetailRow
              label={t('ui:stats.currentTrend', {
                defaultValue: 'Current Trend'
              })}
              value={social.trend || 'NEUTRAL'}
            />
            <DetailRow
              label={t('ui:stats.repCooldown', {
                defaultValue: 'Rep Cooldown'
              })}
              value={social.reputationCooldown || 0}
              subtext={t('ui:stats.repCooldownDesc', {
                defaultValue: 'Days until rep-gated posts clear'
              })}
              locked={!isUnlocked(social.reputationCooldown)}
            />
            <DetailRow
              label={t('ui:stats.brandDeals', { defaultValue: 'Brand Deals' })}
              value={social.activeDeals?.length || 0}
              subtext={
                social.activeDeals?.map(d => d.id).join(', ') ||
                t('ui:stats.noContracts', {
                  defaultValue: 'No active contracts'
                })
              }
              locked={!isUnlocked(social.activeDeals)}
            />
          </div>

          <div className='mt-2 border-t border-(--ash-gray)/20 pt-2'>
            <div className='text-xs text-(--ash-gray) mb-1 font-bold'>
              {t('ui:stats.advancedMetrics', {
                defaultValue: 'Advanced Metrics'
              })}
            </div>
            <DetailRow
              label={t('ui:stats.fanLoyalty', { defaultValue: 'Fan Loyalty' })}
              value={social.loyalty || 0}
              subtext={t('ui:stats.fanLoyaltyDesc', {
                defaultValue: 'Shields against bad gigs'
              })}
              locked={!isUnlocked(social.loyalty)}
            />
            <DetailRow
              label={t('ui:stats.controversy', { defaultValue: 'Controversy' })}
              value={`${Math.min(100, social.controversyLevel || 0)}/100`}
              subtext={
                social.controversyLevel >= 100
                  ? t('ui:stats.shadowbanned', {
                      defaultValue: 'SHADOWBANNED (-75% Growth)'
                    })
                  : t('ui:stats.riskOfShadowban', {
                      defaultValue: 'Risk of Shadowban'
                    })
              }
              locked={!isUnlocked(social.controversyLevel)}
            />
          </div>
        </Panel>

        <Panel
          title={t('ui:stats.van_condition', { defaultValue: 'Van Condition' })}
        >
          <div className='mb-4 space-y-2'>
            <ProgressBar
              label={t('ui:stats.fuel', { defaultValue: 'Fuel' })}
              value={player.van?.fuel}
              max={100}
              color='bg-(--fuel-yellow)'
              size='sm'
            />
            <ProgressBar
              label={t('ui:stats.condition', { defaultValue: 'Condition' })}
              value={player.van?.condition}
              max={100}
              color='bg-(--condition-blue)'
              size='sm'
            />
          </div>
          <DetailRow
            label={t('ui:detailedStats.breakdownChance', {
              defaultValue: 'Breakdown Chance'
            })}
            value={`${((player.van?.breakdownChance ?? 0) * 100).toFixed(1)}%`}
          />
          <DetailRow
            label={t('ui:detailedStats.upgrades', { defaultValue: 'Upgrades' })}
            value={t('ui:detailedStats.vanUpgrades.installed', {
              count: (player.van?.upgrades || []).length,
              defaultValue: `${(player.van?.upgrades || []).length} Installed`
            })}
            subtext={
              player.van?.upgrades?.join(', ') ||
              t('ui:detailedStats.none', { defaultValue: 'None' })
            }
          />
        </Panel>
      </div>

      {/* Region and Quests */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Panel
          title={t('ui:stats.regional_standing', {
            defaultValue: 'Regional Standing'
          })}
        >
          {Object.keys(reputationByRegion).length === 0 ? (
            <div className='text-xs text-(--ash-gray) italic py-4 text-center'>
              {t('ui:detailedStats.noRegionalData', {
                defaultValue:
                  'No regional data yet. Play gigs to build reputation.'
              })}
            </div>
          ) : (
            <div className='space-y-1'>
              {Object.entries(reputationByRegion).map(([region, rep]) => (
                <DetailRow
                  key={region}
                  label={region}
                  value={rep}
                  subtext={
                    venueBlacklist.some(v => v.includes(region))
                      ? t('ui:detailedStats.blacklisted', {
                          defaultValue: 'BLACKLISTED VENUES'
                        })
                      : null
                  }
                />
              ))}
            </div>
          )}
          {venueBlacklist.length > 0 && (
            <div className='mt-2 pt-2 border-t border-(--ash-gray)/20'>
              <div className='text-[10px] text-(--ash-gray) mb-1 uppercase tracking-widest'>
                {t('ui:detailedStats.blacklistedVenues', {
                  defaultValue: 'Blacklisted Venues'
                })}
              </div>
              <div className='text-xs text-(--toxic-green) font-mono italic'>
                {venueBlacklist.join(', ')}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title={t('ui:stats.active_quests', { defaultValue: 'Active Quests' })}
        >
          {activeQuests.length === 0 ? (
            <div className='text-xs text-(--ash-gray) italic py-4 text-center'>
              {t('ui:detailedStats.noActiveQuests', {
                defaultValue: 'No active quests. Stay toxic to trigger events.'
              })}
            </div>
          ) : (
            <div className='space-y-4'>
              {activeQuests.map(q => (
                <div
                  key={q.id}
                  className='space-y-1 border-b border-(--ash-gray)/10 pb-2 last:border-0'
                >
                  <div className='flex justify-between items-center text-xs'>
                    <span className='font-bold text-(--star-white)'>
                      {q.label}
                    </span>
                    <span className='text-(--ash-gray)'>
                      {t('ui:ui.day', { defaultValue: 'Day' })} {q.deadline}
                    </span>
                  </div>
                  <ProgressBar
                    value={q.progress}
                    max={q.required}
                    color='bg-(--toxic-green)'
                    size='mini'
                    showValue
                  />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Band Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Panel
          title={t('ui:stats.band_metrics', { defaultValue: 'Band Metrics' })}
        >
          <div className='mb-4'>
            <ProgressBar
              label={t('ui:stats.harmony', { defaultValue: 'Harmony' })}
              value={band.harmony}
              max={100}
              color='bg-(--toxic-green)'
            />
          </div>
          <DetailRow
            label={t('ui:detailedStats.luck', { defaultValue: 'Luck' })}
            value={band.luck}
            subtext={t('ui:detailedStats.luckDesc', {
              defaultValue: 'Affects random events'
            })}
          />
          <DetailRow
            label={t('ui:detailedStats.inventorySlots', {
              defaultValue: 'Inventory Slots'
            })}
            value={band.inventorySlots}
          />
          {social.egoFocus && (
            <DetailRow
              label={t('ui:detailedStats.egoSpotlight', {
                defaultValue: 'Ego Spotlight'
              })}
              value={social.egoFocus}
              subtext={t('ui:detailedStats.harmonyDrain', {
                defaultValue: 'Harmony Drain Active'
              })}
              className='bg-(--mood-pink)/10'
            />
          )}
          <div className='mt-2 border-t border-(--ash-gray)/20 pt-2'>
            <div className='text-xs text-(--ash-gray) mb-1 font-bold'>
              {t('ui:detailedStats.perfModifiers', {
                defaultValue: 'Performance Modifiers'
              })}
            </div>
            <DetailRow
              label={t('ui:detailedStats.guitarDiff', {
                defaultValue: 'Guitar Difficulty'
              })}
              value={`x${band.performance?.guitarDifficulty ?? 1.0}`}
            />
            <DetailRow
              label={t('ui:detailedStats.drumSpeed', {
                defaultValue: 'Drum Speed'
              })}
              value={`x${band.performance?.drumMultiplier ?? 1.0}`}
            />
            <DetailRow
              label={t('ui:detailedStats.crowdDecay', {
                defaultValue: 'Crowd Decay'
              })}
              value={`x${band.performance?.crowdDecay ?? 1.0}`}
            />
          </div>
        </Panel>

        <Panel
          title={t('ui:stats.inventory_equipment', {
            defaultValue: 'Inventory & Equipment'
          })}
        >
          <div className='grid grid-cols-2 gap-x-8 gap-y-1'>
            {Object.entries(band.inventory || {}).map(([key, val]) => (
              <DetailRow
                key={key}
                label={t(`items:${key}.name`, {
                  defaultValue: key.replace(/_/g, ' ').toUpperCase()
                })}
                value={
                  val === true
                    ? t('ui:ui.owned', { defaultValue: 'OWNED' })
                    : val === false
                      ? t('ui:ui.locked', { defaultValue: 'LOCKED' })
                      : val
                }
                locked={!isUnlocked(val)}
              />
            ))}
          </div>
        </Panel>
      </div>

      {/* Members Detail */}
      <div className='space-y-4'>
        <h3 className='text-xl text-(--star-white) font-(family-name:--font-display) border-b border-(--toxic-green) pb-2'>
          {t('ui:detailedStats.bandMembers', { defaultValue: 'BAND MEMBERS' })}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {(band.members || []).map(m => (
            <div
              key={m.name}
              className='bg-(--void-black)/60 border border-(--ash-gray) p-4'
            >
              <div className='flex justify-between items-baseline mb-4'>
                <h4 className='text-lg font-bold text-(--toxic-green)'>
                  {m.name}
                </h4>
                <span className='text-xs text-(--ash-gray) uppercase'>
                  {m.role ||
                    t('ui:detailedStats.member', { defaultValue: 'Member' })}
                </span>
              </div>

              <div className='space-y-3 mb-4'>
                <ProgressBar
                  label={t('ui:detailedStats.stamina', {
                    defaultValue: 'Stamina'
                  })}
                  value={m.stamina}
                  max={100}
                  color='bg-(--stamina-green)'
                  size='sm'
                />
                <ProgressBar
                  label={t('ui:detailedStats.mood', { defaultValue: 'Mood' })}
                  value={m.mood}
                  max={100}
                  color='bg-(--mood-pink)'
                  size='sm'
                />
              </div>

              <div className='space-y-1 text-sm'>
                <div className='font-bold text-(--ash-gray) text-xs mb-1 uppercase tracking-wider'>
                  {t('ui:detailedStats.skills', { defaultValue: 'Skills' })}
                </div>
                <DetailRow
                  label={t('ui:detailedStats.skillBase', {
                    defaultValue: 'Skill (Base)'
                  })}
                  value={m.baseStats?.skill ?? m.skill ?? 0}
                />
                <DetailRow
                  label={t('ui:detailedStats.charisma', {
                    defaultValue: 'Charisma'
                  })}
                  value={m.baseStats?.charisma ?? m.charisma ?? 0}
                />
                <DetailRow
                  label={t('ui:detailedStats.technical', {
                    defaultValue: 'Technical'
                  })}
                  value={m.baseStats?.technical ?? m.technical ?? 0}
                />
                <DetailRow
                  label={t('ui:detailedStats.improv', {
                    defaultValue: 'Improv'
                  })}
                  value={m.baseStats?.improv ?? m.improv ?? 0}
                  locked={!isUnlocked(m.baseStats?.improv ?? m.improv ?? 0)}
                />
                <DetailRow
                  label={t('ui:detailedStats.composition', {
                    defaultValue: 'Composition'
                  })}
                  value={m.baseStats?.composition ?? m.composition ?? 0}
                  locked={
                    !isUnlocked(m.baseStats?.composition ?? m.composition ?? 0)
                  }
                />
              </div>

              <div className='mt-4 pt-2 border-t border-(--ash-gray)/30'>
                <div className='font-bold text-(--ash-gray) text-xs mb-1 uppercase tracking-wider'>
                  {t('ui:detailedStats.traits', { defaultValue: 'Traits' })}
                </div>
                <div className='space-y-1'>
                  {(() => {
                    const def = CHAR_MAP[m.name]
                    const potentialTraits = def?.traits || []
                    if (potentialTraits.length === 0)
                      return (
                        <div className='text-xs text-(--ash-gray)'>
                          {t('ui:detailedStats.none', { defaultValue: 'None' })}
                        </div>
                      )

                    return potentialTraits.map(trait => {
                      const isTraitActive = m.traits?.some(
                        t => t.id === trait.id
                      )
                      return (
                        <Tooltip
                          key={trait.id}
                          className='w-full'
                          content={
                            <div className='text-left'>
                              <div className='font-bold mb-1'>{trait.name}</div>
                              <div className='mb-2'>{trait.desc}</div>
                              {!isTraitActive && (
                                <div className='text-(--ash-gray) italic border-t border-(--ash-gray)/30 pt-1'>
                                  {t('ui:detailedStats.toUnlock', {
                                    defaultValue: 'To Unlock'
                                  })}
                                  : {trait.unlockHint}
                                </div>
                              )}
                            </div>
                          }
                        >
                          <div
                            className={`w-full text-xs flex justify-between items-center ${isTraitActive ? 'text-(--toxic-green)' : 'text-(--ash-gray) opacity-50'}`}
                          >
                            <span className='underline decoration-dotted decoration-(--ash-gray)/50 cursor-help'>
                              {trait.name}
                            </span>
                            {isTraitActive ? (
                              <span className='text-[10px] uppercase border border-(--toxic-green) px-1 rounded'>
                                {t('ui:detailedStats.active', {
                                  defaultValue: 'Active'
                                })}
                              </span>
                            ) : (
                              <span className='text-[10px] uppercase'>
                                {t('ui:detailedStats.locked', {
                                  defaultValue: 'Locked'
                                })}
                              </span>
                            )}
                          </div>
                        </Tooltip>
                      )
                    })
                  })()}
                </div>
              </div>

              <div className='mt-2 pt-2 border-t border-(--ash-gray)/30'>
                <div className='font-bold text-(--ash-gray) text-xs mb-1 uppercase tracking-wider'>
                  {t('ui:detailedStats.equipment', {
                    defaultValue: 'Equipment'
                  })}
                </div>
                {m.equipment ? (
                  Object.entries(m.equipment).map(([k, v]) => (
                    <div
                      key={k}
                      className='text-xs text-(--star-white)/80 flex justify-between'
                    >
                      <span className='capitalize text-(--ash-gray)'>{k}:</span>
                      <span>{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <div className='text-xs text-(--ash-gray)/50'>
                    {t('ui:detailedStats.standardGear', {
                      defaultValue: 'Standard Gear'
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

DetailedStatsTab.propTypes = {
  player: PropTypes.object.isRequired,
  band: PropTypes.object.isRequired,
  social: PropTypes.object.isRequired
}
