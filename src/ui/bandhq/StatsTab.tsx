import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { StatBox, ProgressBar } from '../shared'

export const StatsTab = ({ player, band, social }: Record<string, unknown>) => {
  const { t } = useTranslation(['ui'])
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
      {/* Financials & Fame */}
      <div className='space-y-6'>
        <div className='bg-void-black/40 border-2 border-ash-gray p-4'>
          <h3 className='text-toxic-green text-lg font-bold mb-4 border-b border-ash-gray pb-2 font-mono'>
            {t('ui:stats.career_overview', { defaultValue: 'CAREER STATUS' })}
          </h3>
          <div className='grid grid-cols-2 gap-4'>
            <StatBox
              label={t('ui:stats.funds', { defaultValue: 'Funds' })}
              value={`${(player as any).money}€`}
              icon='€'
            />
            <StatBox
              label={t('ui:stats.fame', { defaultValue: 'Fame' })}
              value={(player as any).fame}
              icon='★'
            />
            <StatBox
              label={t('ui:ui.day', { defaultValue: 'Day' })}
              value={(player as any).day}
              icon='📅'
            />
            <StatBox
              label={t('ui:stats.followers', { defaultValue: 'Followers' })}
              value={
                ((social as any).instagram ?? 0) +
                ((social as any).tiktok ?? 0) +
                ((social as any).youtube ?? 0) +
                ((social as any).newsletter ?? 0)
              }
              icon='👥'
            />
          </div>
        </div>

        <div className='bg-void-black/40 border-2 border-ash-gray p-4'>
          <h3 className='text-toxic-green text-lg font-bold mb-4 border-b border-ash-gray pb-2 font-mono'>
            {t('ui:stats.van_condition', { defaultValue: 'VAN STATUS' })}
          </h3>
          {/* jscpd:ignore-start */}
          <div className='space-y-2'>
            <ProgressBar
              label={t('ui:stats.fuel', { defaultValue: 'Fuel' })}
              value={(player as any).van?.fuel}
              max={100}
              color='bg-fuel-yellow'
            />
            <ProgressBar
              label={t('ui:stats.condition', { defaultValue: 'Condition' })}
              value={(player as any).van?.condition}
              max={100}
              color='bg-condition-blue'
              size='sm'
            />
            <div className='mt-2 text-xs text-ash-gray font-mono'>
              {t('ui:stats.breakdown_chance', {
                defaultValue: 'Breakdown Chance'
              })}
              : {(((player as any).van?.breakdownChance ?? 0) * 100).toFixed(1)}
              %
            </div>
          </div>
          {/* jscpd:ignore-end */}
        </div>
      </div>

      {/* Band Members */}
      <div className='bg-void-black/40 border-2 border-ash-gray p-4'>
        <h3 className='text-toxic-green text-lg font-bold mb-4 border-b border-ash-gray pb-2 font-mono'>
          {t('ui:stats.band_status', { defaultValue: 'BAND STATUS' })}
        </h3>
        <div className='space-y-6'>
          {((band as any).members || []).map((m: unknown) => (
            <div key={(m as any).name} className='flex items-center gap-4'>
              <div className='w-20 font-bold text-star-white font-mono'>
                {(m as any).name}
              </div>
              <div className='flex-1 space-y-1'>
                <ProgressBar
                  label={t('ui:stats.stamina', { defaultValue: 'Stamina' })}
                  value={(m as any).stamina}
                  max={100}
                  color='bg-stamina-green'
                  size='sm'
                />
                <ProgressBar
                  label={t('ui:stats.mood', { defaultValue: 'Mood' })}
                  value={(m as any).mood}
                  max={100}
                  color='bg-mood-pink'
                  size='sm'
                />
              </div>
            </div>
          ))}
        </div>
        <div className='mt-6 pt-4 border-t border-ash-gray'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-ash-gray font-mono text-sm'>
              {t('ui:stats.inventory_slots', {
                defaultValue: 'Inventory Slots'
              })}
              :
            </span>
            <span className='text-star-white font-mono'>
              {(band as any).inventorySlots}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-ash-gray font-mono text-sm'>
              {t('ui:stats.harmony', { defaultValue: 'Harmony' })}:
            </span>
            <span className='text-toxic-green font-mono'>
              {(band as any).harmony}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

StatsTab.propTypes = {
  player: PropTypes.shape({
    money: PropTypes.number,
    fame: PropTypes.number,
    day: PropTypes.number,
    van: PropTypes.shape({
      fuel: PropTypes.number,
      condition: PropTypes.number,
      breakdownChance: PropTypes.number
    })
  }).isRequired,
  band: PropTypes.shape({
    members: PropTypes.array,
    inventorySlots: PropTypes.number,
    harmony: PropTypes.number
  }).isRequired,
  social: PropTypes.shape({
    instagram: PropTypes.number,
    tiktok: PropTypes.number,
    youtube: PropTypes.number,
    newsletter: PropTypes.number
  }).isRequired
}
