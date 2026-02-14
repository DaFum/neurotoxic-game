import PropTypes from 'prop-types'

import { UPGRADES_DB } from '../data/upgrades'

/**
 * Menu interface for purchasing upgrades using Fame currency.
 * @param {object} props
 * @param {Function} props.onClose - Callback to close the menu.
 * @param {object} props.player - The player state.
 * @param {Function} props.onBuyUpgrade - Callback to buy an upgrade.
 * @param {string} [props.className] - Optional custom class name.
 */
export const UpgradeMenu = ({
  onClose,
  player,
  onBuyUpgrade,
  className = ''
}) => {
  return (
    <div
      className={`absolute inset-0 bg-(--void-black)/95 z-50 flex items-center justify-center p-8 ${className}`}
    >
      <div className='w-full max-w-4xl border-4 border-(--toxic-green) p-8 overflow-y-auto max-h-[90vh]'>
        <div className='flex justify-between items-center mb-8'>
          <h2 className="text-4xl text-(--toxic-green) font-['Metal_Mania']">
            BAND HQ (UPGRADES)
          </h2>
          <button
            onClick={onClose}
            className='text-(--blood-red) font-bold border border-(--blood-red) px-4 py-2 hover:bg-(--blood-red) hover:text-(--void-black)'
          >
            CLOSE
          </button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {Object.entries(UPGRADES_DB).map(([category, upgrades]) => (
            <div key={category} className='space-y-4'>
              <h3 className='text-2xl text-(--star-white) uppercase border-b border-(--ash-gray) pb-2'>
                {category}
              </h3>
              {upgrades.map(u => {
                // Owned check logic:
                // We rely on player.van.upgrades or player.hqUpgrades.
                // The unified hook logic ensures purchased items (with currency='fame') are added to player.van.upgrades.
                // So checking player.van.upgrades should be sufficient for visual state.
                const owned = (player.van?.upgrades ?? []).includes(u.id)

                return (
                  <div
                    key={u.id}
                    className={`p-4 border ${owned ? 'border-(--toxic-green) bg-(--toxic-green)/10' : 'border-(--ash-gray)'} relative group`}
                  >
                    <div className='font-bold text-lg mb-1'>{u.name}</div>
                    <div className='text-xs text-(--ash-gray) mb-2'>
                      {u.description}
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-(--warning-yellow) font-mono'>
                        {u.cost} Fame
                      </span>
                      <button
                        disabled={owned || player.fame < u.cost}
                        onClick={() => onBuyUpgrade(u)}
                        className={`px-3 py-1 text-sm font-bold uppercase
                                                  ${
                                                    owned
                                                      ? 'bg-(--void-black) text-(--ash-gray)'
                                                      : player.fame < u.cost
                                                        ? 'bg-(--void-black) text-(--ash-gray) opacity-50'
                                                        : 'bg-(--toxic-green) text-(--void-black) hover:bg-(--ash-gray)'
                                                  }
                                              `}
                      >
                        {owned ? 'OWNED' : 'BUY'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

UpgradeMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
  player: PropTypes.shape({
    fame: PropTypes.number.isRequired,
    van: PropTypes.shape({
      upgrades: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired
  }).isRequired,
  onBuyUpgrade: PropTypes.func.isRequired,
  className: PropTypes.string
}
