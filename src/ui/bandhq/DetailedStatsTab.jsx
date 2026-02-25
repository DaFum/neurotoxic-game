import PropTypes from 'prop-types'
import { StatBox, ProgressBar, Panel, Tooltip } from '../shared'
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
        <Panel title='Career Overview'>
          <DetailRow label='Funds' value={`${player.money}€`} />
          <DetailRow
            label='Fame'
            value={player.fame}
            subtext={`Level ${player.fameLevel || 0}`}
          />
          <DetailRow label='Day' value={player.day} />
          <DetailRow label='Time' value={`${player.time || '12'}:00`} />
          <DetailRow label='Location' value={player.location} />
          <DetailRow label='Total Travels' value={player.totalTravels} />
          <DetailRow
            label='Passive Followers'
            value={`+${player.passiveFollowers}/day`}
            locked={!isUnlocked(player.passiveFollowers)}
          />
          <DetailRow
            label='HQ Upgrades'
            value={`${(player.hqUpgrades || []).length} Installed`}
            subtext={player.hqUpgrades?.join(', ') || 'None'}
          />
          {player.stats?.proveYourselfMode && (
            <DetailRow
              label='Mode'
              value='PROVE YOURSELF'
              subtext='Venue Restrictions Active'
              className='bg-(--toxic-green)/10'
            />
          )}
        </Panel>

        <Panel title='Social Media Reach'>
          <DetailRow
            label='Instagram'
            value={social.instagram}
            locked={!isUnlocked(social.instagram)}
          />
          <DetailRow
            label='TikTok'
            value={social.tiktok}
            locked={!isUnlocked(social.tiktok)}
          />
          <DetailRow
            label='YouTube'
            value={social.youtube}
            locked={!isUnlocked(social.youtube)}
          />
          <DetailRow
            label='Newsletter'
            value={social.newsletter}
            locked={!isUnlocked(social.newsletter)}
          />
          <DetailRow label='Total Reach' value={totalReach} />
          <DetailRow
            label='Viral Status'
            value={social.viral ? 'VIRAL' : 'Normal'}
            locked={!social.viral}
          />

          <div className='mt-2 border-t border-(--ash-gray)/20 pt-2'>
            <div className='text-xs text-(--ash-gray) mb-1 font-bold italic tracking-tighter'>
              SOCIAL DYNAMICS
            </div>
            <DetailRow
              label='Current Trend'
              value={social.trend || 'NEUTRAL'}
            />
            <DetailRow
              label='Rep Cooldown'
              value={social.reputationCooldown || 0}
              subtext='Days until rep-gated posts clear'
              locked={!isUnlocked(social.reputationCooldown)}
            />
            <DetailRow
              label='Brand Deals'
              value={social.activeDeals?.length || 0}
              subtext={
                social.activeDeals?.map(d => d.id).join(', ') ||
                'No active contracts'
              }
              locked={!isUnlocked(social.activeDeals)}
            />
          </div>

          <div className='mt-2 border-t border-(--ash-gray)/20 pt-2'>
            <div className='text-xs text-(--ash-gray) mb-1 font-bold'>
              Advanced Metrics
            </div>
            <DetailRow
              label='Fan Loyalty'
              value={social.loyalty || 0}
              subtext='Shields against bad gigs'
              locked={!isUnlocked(social.loyalty)}
            />
            <DetailRow
              label='Controversy'
              value={`${Math.min(100, social.controversyLevel || 0)}/100`}
              subtext={
                social.controversyLevel >= 100
                  ? 'SHADOWBANNED (-75% Growth)'
                  : 'Risk of Shadowban'
              }
              locked={!isUnlocked(social.controversyLevel)}
            />
          </div>
        </Panel>

        <Panel title='Van Condition'>
          <div className='mb-4 space-y-2'>
            <ProgressBar
              label='Fuel'
              value={player.van?.fuel}
              max={100}
              color='bg-(--fuel-yellow)'
              size='sm'
            />
            <ProgressBar
              label='Condition'
              value={player.van?.condition}
              max={100}
              color='bg-(--condition-blue)'
              size='sm'
            />
          </div>
          <DetailRow
            label='Breakdown Chance'
            value={`${((player.van?.breakdownChance ?? 0) * 100).toFixed(1)}%`}
          />
          <DetailRow
            label='Upgrades'
            value={`${(player.van?.upgrades || []).length} Installed`}
            subtext={player.van?.upgrades?.join(', ') || 'None'}
          />
        </Panel>
      </div>

      {/* Region and Quests */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Panel title='Regional Standing'>
          {Object.keys(reputationByRegion).length === 0 ? (
            <div className='text-xs text-(--ash-gray) italic py-4 text-center'>
              No regional data yet. Play gigs to build reputation.
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
                      ? 'BLACKLISTED VENUES'
                      : null
                  }
                />
              ))}
            </div>
          )}
          {venueBlacklist.length > 0 && (
            <div className='mt-2 pt-2 border-t border-(--ash-gray)/20'>
              <div className='text-[10px] text-(--ash-gray) mb-1 uppercase tracking-widest'>
                Blacklisted Venues
              </div>
              <div className='text-xs text-(--toxic-green) font-mono italic'>
                {venueBlacklist.join(', ')}
              </div>
            </div>
          )}
        </Panel>

        <Panel title='Active Quests'>
          {activeQuests.length === 0 ? (
            <div className='text-xs text-(--ash-gray) italic py-4 text-center'>
              No active quests. Stay toxic to trigger events.
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
                    <span className='text-(--ash-gray)'>Day {q.deadline}</span>
                  </div>
                  <ProgressBar
                    value={q.progress}
                    max={q.required}
                    color='bg-(--toxic-green)'
                    size='mini'
                    showValue={true}
                  />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Band Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Panel title='Band Metrics'>
          <div className='mb-4'>
            <ProgressBar
              label='Harmony'
              value={band.harmony}
              max={100}
              color='bg-(--toxic-green)'
            />
          </div>
          <DetailRow
            label='Luck'
            value={band.luck}
            subtext='Affects random events'
          />
          <DetailRow label='Inventory Slots' value={band.inventorySlots} />
          {social.egoFocus && (
            <DetailRow
              label='Ego Spotlight'
              value={social.egoFocus}
              subtext='Harmony Drain Active'
              className='bg-(--mood-pink)/10'
            />
          )}
          <div className='mt-2 border-t border-(--ash-gray)/20 pt-2'>
            <div className='text-xs text-(--ash-gray) mb-1 font-bold'>
              Performance Modifiers
            </div>
            <DetailRow
              label='Guitar Difficulty'
              value={`x${band.performance?.guitarDifficulty ?? 1.0}`}
            />
            <DetailRow
              label='Drum Speed'
              value={`x${band.performance?.drumMultiplier ?? 1.0}`}
            />
            <DetailRow
              label='Crowd Decay'
              value={`x${band.performance?.crowdDecay ?? 1.0}`}
            />
          </div>
        </Panel>

        <Panel title='Inventory & Equipment'>
          <div className='grid grid-cols-2 gap-x-8 gap-y-1'>
            {Object.entries(band.inventory || {}).map(([key, val]) => (
              <DetailRow
                key={key}
                label={key.replace(/_/g, ' ').toUpperCase()}
                value={val === true ? 'OWNED' : val === false ? 'LOCKED' : val}
                locked={!isUnlocked(val)}
              />
            ))}
          </div>
        </Panel>
      </div>

      {/* Members Detail */}
      <div className='space-y-4'>
        <h3 className='text-xl text-(--star-white) font-(family-name:--font-display) border-b border-(--toxic-green) pb-2'>
          BAND MEMBERS
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
                  {m.role || 'Member'}
                </span>
              </div>

              <div className='space-y-3 mb-4'>
                <ProgressBar
                  label='Stamina'
                  value={m.stamina}
                  max={100}
                  color='bg-(--stamina-green)'
                  size='sm'
                />
                <ProgressBar
                  label='Mood'
                  value={m.mood}
                  max={100}
                  color='bg-(--mood-pink)'
                  size='sm'
                />
              </div>

              <div className='space-y-1 text-sm'>
                <div className='font-bold text-(--ash-gray) text-xs mb-1 uppercase tracking-wider'>
                  Skills
                </div>
                <DetailRow
                  label='Skill (Base)'
                  value={m.baseStats?.skill ?? m.skill ?? 0}
                />
                <DetailRow
                  label='Charisma'
                  value={m.baseStats?.charisma ?? m.charisma ?? 0}
                />
                <DetailRow
                  label='Technical'
                  value={m.baseStats?.technical ?? m.technical ?? 0}
                />
                <DetailRow
                  label='Improv'
                  value={m.baseStats?.improv ?? m.improv ?? 0}
                  locked={!isUnlocked(m.baseStats?.improv ?? m.improv ?? 0)}
                />
                <DetailRow
                  label='Composition'
                  value={m.baseStats?.composition ?? m.composition ?? 0}
                  locked={
                    !isUnlocked(m.baseStats?.composition ?? m.composition ?? 0)
                  }
                />
              </div>

              <div className='mt-4 pt-2 border-t border-(--ash-gray)/30'>
                <div className='font-bold text-(--ash-gray) text-xs mb-1 uppercase tracking-wider'>
                  Traits
                </div>
                <div className='space-y-1'>
                  {(() => {
                    const def = CHAR_MAP[m.name]
                    const potentialTraits = def?.traits || []
                    if (potentialTraits.length === 0)
                      return (
                        <div className='text-xs text-(--ash-gray)'>None</div>
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
                                  To Unlock: {trait.unlockHint}
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
                                Active
                              </span>
                            ) : (
                              <span className='text-[10px] uppercase'>
                                Locked
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
                  Equipment
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
                    Standard Gear
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
