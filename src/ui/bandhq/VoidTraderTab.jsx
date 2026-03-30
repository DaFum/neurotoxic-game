import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../shared/ActionButton'
import { CONTRABAND_BY_RARITY, VOID_TRADER_COSTS } from '../../data/contraband.js'

export const VoidTraderTab = ({ player, handleTrade, isItemOwned, isItemDisabled, processingItemId }) => {
  const { t } = useTranslation()

  // Filter for epic/rare contraband that are tradeable in the black market
  const voidItems = useMemo(() => {
    return [...(CONTRABAND_BY_RARITY.epic || []), ...(CONTRABAND_BY_RARITY.rare || [])].map(item => {
      // Determine cost in Fame based on rarity
      const fameCost = VOID_TRADER_COSTS[item.rarity] || 1000
      return { ...item, fameCost }
    })
  }, [])

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      <div className='mb-6 p-4 border border-toxic-green/30 bg-void-black/80 flex justify-between items-center'>
        <div>
          <h3 className='text-lg font-bold text-toxic-green tracking-widest uppercase mb-1 font-mono'>
            {t('ui:hq.voidTrader.title', { defaultValue: 'THE VOID TRADER' })}
          </h3>
          <p className='text-sm text-ash-gray uppercase font-mono'>
            {t('ui:hq.voidTrader.subtitle', { defaultValue: 'RARE CONTRABAND FOR THE FAMOUS' })}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-xs text-ash-gray uppercase font-mono mb-1'>
            {t('ui:stats.fame', { defaultValue: 'FAME' })}
          </p>
          <p className='text-xl font-bold text-toxic-green tracking-widest'>
            {player.fame}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-toxic-green scrollbar-track-void-black'>
        {voidItems.map(item => {
          const isProcessingThis = processingItemId === item.id
          const isAnyProcessing = !!processingItemId
          const disabled = isItemDisabled(item) || isAnyProcessing

          return (
            <div
              key={item.id}
              className='border border-toxic-green/20 bg-void-black/60 p-4 flex flex-col justify-between group hover:border-toxic-green/50 transition-colors'
            >
              <div className='flex items-start gap-4 mb-4'>
                <div className='w-16 h-16 border border-toxic-green/30 bg-void-black flex items-center justify-center shrink-0'>
                  {/* Placeholder for icon, text icon instead */}
                  <span className='text-2xl opacity-50 text-toxic-green'>?</span>
                </div>
                <div className='flex-1'>
                  <div className='flex justify-between items-start'>
                    <h4 className='font-bold text-toxic-green uppercase tracking-wide mb-1 font-mono text-sm leading-tight'>
                      {t(item.name)}
                    </h4>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${item.rarity === 'epic' ? 'border-blood-red text-blood-red' : 'border-toxic-green text-toxic-green'}`}>
                      {t(`ui:rarity.${item.rarity}`, { defaultValue: item.rarity })}
                    </span>
                  </div>
                  <p className='text-xs text-ash-gray font-mono leading-relaxed line-clamp-3'>
                    {t(item.description)}
                  </p>
                </div>
              </div>

              <div className='flex items-center justify-between mt-auto pt-4 border-t border-toxic-green/10'>
                <div className='text-sm font-bold text-toxic-green tracking-widest flex items-center gap-2'>
                  <span>{t('ui:hq.voidTrader.cost', { defaultValue: 'COST:' })}</span>
                  <span>{item.fameCost} {t('ui:hq.voidTrader.fame', { defaultValue: 'FAME' })}</span>
                </div>
                <ActionButton
                  variant='primary'
                  onClick={() => handleTrade(item)}
                  disabled={disabled}
                  className='text-xs py-1 px-4 min-w-[120px]'
                >
                  {isProcessingThis
                    ? t('ui:loading', { defaultValue: 'PROCESSING...' })
                    : isItemOwned(item) && !item.stackable
                      ? t('ui:shop.owned', { defaultValue: 'OWNED' })
                      : t('ui:hq.voidTrader.trade', { defaultValue: 'BARTER' })}
                </ActionButton>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

VoidTraderTab.propTypes = {
  player: PropTypes.object.isRequired,
  handleTrade: PropTypes.func.isRequired,
  isItemOwned: PropTypes.func.isRequired,
  isItemDisabled: PropTypes.func.isRequired,
  processingItemId: PropTypes.string
}
