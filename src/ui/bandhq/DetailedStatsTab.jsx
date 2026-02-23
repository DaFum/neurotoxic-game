import PropTypes from 'prop-types'
import { StatBox, ProgressBar } from '../shared'
import { CHARACTERS } from '../../data/characters'

const DetailRow = ({ label, value, subtext, locked }) => (
  <div className={`flex justify-between items-center py-1 border-b border-(--ash-gray)/20 font-mono text-sm ${locked ? 'opacity-40 grayscale' : ''}`}>
    <span className='text-(--ash-gray)'>{label}</span>
    <div className='text-right'>
      <div className={`font-bold ${locked ? 'text-(--ash-gray)' : 'text-(--star-white)'}`}>{value}</div>
      {subtext && <div className='text-[10px] text-(--ash-gray)/60'>{subtext}</div>}
    </div>
  </div>
)

const Section = ({ title, children }) => (
  <div className='bg-(--void-black)/40 border border-(--ash-gray)/40 p-4 h-full'>
    <h3 className='text-(--toxic-green) text-sm font-bold mb-3 border-b border-(--ash-gray)/40 pb-1 font-mono uppercase tracking-wider'>
      {title}
    </h3>
    <div className='space-y-1'>
      {children}
    </div>
  </div>
)

export const DetailedStatsTab = ({ player, band, social }) => {
  // Helper to check if a feature is unlocked (value > 0 or true)
  const isUnlocked = (val) => {
    if (typeof val === 'number') return val > 0
    if (typeof val === 'boolean') return val
    if (Array.isArray(val)) return val.length > 0
    return !!val
  }

  // Helper to get character definition
  const getCharDef = (name) => {
    return Object.values(CHARACTERS).find(c => c.name === name)
  }

  return (
    <div className='space-y-8'>
      {/* Top Row: Career & Social Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Section title="Career Overview">
          <DetailRow label="Funds" value={`${player.money}€`} />
          <DetailRow label="Fame" value={player.fame} subtext={`Level ${player.fameLevel || 0}`} />
          <DetailRow label="Day" value={player.day} />
          <DetailRow label="Time" value={`${player.time || '12'}:00`} />
          <DetailRow label="Location" value={player.location} />
          <DetailRow label="Total Travels" value={player.totalTravels} />
          <DetailRow label="Passive Followers" value={`+${player.passiveFollowers}/day`} locked={!isUnlocked(player.passiveFollowers)} />
          <DetailRow label="HQ Upgrades" value={`${(player.hqUpgrades || []).length} Installed`} subtext={player.hqUpgrades?.join(', ') || 'None'} />
        </Section>

        <Section title="Social Media Reach">
          <DetailRow label="Instagram" value={social.instagram} locked={!isUnlocked(social.instagram)} />
          <DetailRow label="TikTok" value={social.tiktok} locked={!isUnlocked(social.tiktok)} />
          <DetailRow label="YouTube" value={social.youtube} locked={!isUnlocked(social.youtube)} />
          <DetailRow label="Newsletter" value={social.newsletter} locked={!isUnlocked(social.newsletter)} />
          <DetailRow label="Total Reach" value={social.instagram + social.tiktok + social.youtube + social.newsletter} />
          <DetailRow label="Viral Status" value={social.viral ? 'VIRAL' : 'Normal'} locked={!social.viral} />
        </Section>

        <Section title="Van Condition">
          <div className='mb-4 space-y-2'>
             <ProgressBar label='Fuel' value={player.van?.fuel} max={100} color='bg-(--fuel-yellow)' size='sm' />
             <ProgressBar label='Condition' value={player.van?.condition} max={100} color='bg-(--condition-blue)' size='sm' />
          </div>
          <DetailRow label="Breakdown Chance" value={`${((player.van?.breakdownChance ?? 0) * 100).toFixed(1)}%`} />
          <DetailRow label="Upgrades" value={`${(player.van?.upgrades || []).length} Installed`} subtext={player.van?.upgrades?.join(', ') || 'None'} />
        </Section>
      </div>

      {/* Band Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Section title="Band Metrics">
          <div className='mb-4'>
             <ProgressBar label='Harmony' value={band.harmony} max={100} color='bg-(--toxic-green)' />
          </div>
          <DetailRow label="Luck" value={band.luck} subtext="Affects random events" />
          <DetailRow label="Inventory Slots" value={band.inventorySlots} />
          <div className='mt-2 border-t border-(--ash-gray)/20 pt-2'>
            <div className='text-xs text-(--ash-gray) mb-1 font-bold'>Performance Modifiers</div>
            <DetailRow label="Guitar Difficulty" value={`x${band.performance?.guitarDifficulty ?? 1.0}`} />
            <DetailRow label="Drum Speed" value={`x${band.performance?.drumMultiplier ?? 1.0}`} />
            <DetailRow label="Crowd Decay" value={`x${band.performance?.crowdDecay ?? 1.0}`} />
          </div>
        </Section>

        <Section title="Inventory & Equipment">
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
        </Section>
      </div>

      {/* Members Detail */}
      <div className='space-y-4'>
        <h3 className='text-xl text-(--star-white) font-[Metal_Mania] border-b border-(--toxic-green) pb-2'>
          BAND MEMBERS
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {(band.members || []).map(m => (
            <div key={m.name} className='bg-(--void-black)/60 border border-(--ash-gray) p-4'>
              <div className='flex justify-between items-baseline mb-4'>
                <h4 className='text-lg font-bold text-(--toxic-green)'>{m.name}</h4>
                <span className='text-xs text-(--ash-gray) uppercase'>{m.role || 'Member'}</span>
              </div>

              <div className='space-y-3 mb-4'>
                <ProgressBar label='Stamina' value={m.stamina} max={100} color='bg-(--stamina-green)' size='sm' />
                <ProgressBar label='Mood' value={m.mood} max={100} color='bg-(--mood-pink)' size='sm' />
              </div>

              <div className='space-y-1 text-sm'>
                <div className='font-bold text-(--ash-gray) text-xs mb-1 uppercase tracking-wider'>Skills</div>
                <DetailRow label="Skill (Base)" value={m.baseStats?.skill || m.skill || 0} />
                <DetailRow label="Charisma" value={m.baseStats?.charisma || m.charisma || 0} />
                <DetailRow label="Technical" value={m.baseStats?.technical || m.technical || 0} />
                <DetailRow label="Improv" value={m.baseStats?.improv || m.improv || 0} locked={!isUnlocked(m.baseStats?.improv || m.improv)} />
                <DetailRow label="Composition" value={m.baseStats?.composition || m.composition || 0} locked={!isUnlocked(m.baseStats?.composition || m.composition)} />
              </div>

              <div className='mt-4 pt-2 border-t border-(--ash-gray)/30'>
                <div className='font-bold text-(--ash-gray) text-xs mb-1 uppercase tracking-wider'>Traits</div>
                <div className='space-y-1'>
                  {(() => {
                    const def = getCharDef(m.name)
                    const potentialTraits = def?.traits || []
                    if (potentialTraits.length === 0) return <div className='text-xs text-(--ash-gray)'>None</div>

                    return potentialTraits.map(trait => {
                      const isTraitActive = m.traits?.some(t => t.id === trait.id)
                      return (
                        <div
                          key={trait.id}
                          className={`text-xs flex justify-between items-center ${isTraitActive ? 'text-(--toxic-green)' : 'text-(--ash-gray) opacity-50'}`}
                        >
                          <span>{trait.name}</span>
                          {isTraitActive ? (
                            <span className='text-[10px] uppercase border border-(--toxic-green) px-1 rounded'>Active</span>
                          ) : (
                            <span className='text-[10px] uppercase'>Locked</span>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              <div className='mt-2 pt-2 border-t border-(--ash-gray)/30'>
                 <div className='font-bold text-(--ash-gray) text-xs mb-1 uppercase tracking-wider'>Equipment</div>
                 {m.equipment ? (
                   Object.entries(m.equipment).map(([k, v]) => (
                     <div key={k} className='text-xs text-(--star-white)/80 flex justify-between'>
                       <span className='capitalize text-(--ash-gray)'>{k}:</span>
                       <span>{v}</span>
                     </div>
                   ))
                 ) : (
                   <div className='text-xs text-(--ash-gray)/50'>Standard Gear</div>
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
