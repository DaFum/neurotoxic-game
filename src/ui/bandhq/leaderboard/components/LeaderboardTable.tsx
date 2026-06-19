import { useTranslation } from 'react-i18next'
import { formatCurrency, formatNumber } from '../../../../utils/numberUtils'
import { LeaderboardEntry, LeaderboardView } from '../types'

interface LeaderboardTableProps {
  view: LeaderboardView
  isLoading: boolean
  error: string | null
  isUnavailable: boolean
  rankings: LeaderboardEntry[]
}

export const LeaderboardTable = ({
  view,
  isLoading,
  error,
  isUnavailable,
  rankings
}: LeaderboardTableProps) => {
  const { t, i18n } = useTranslation()

  return (
    <div
      id={`panel-${view}`}
      role='tabpanel'
      aria-labelledby={`tab-${view}`}
      className='flex-1 overflow-hidden flex flex-col'
    >
      {isLoading && (
        <div className='flex-1 flex items-center justify-center text-toxic-green animate-pulse font-mono'>
          {t('ui:leaderboard.connecting')}
        </div>
      )}

      {error && (
        <div className='flex-1 flex items-center justify-center text-blood-red font-mono'>
          {error}
        </div>
      )}

      {!isLoading && !error && isUnavailable && (
        <div className='flex-1 flex items-center justify-center text-ash-gray font-mono text-center px-4'>
          {t('ui:leaderboard.unavailable')}
        </div>
      )}

      {!isLoading && !error && !isUnavailable && rankings.length === 0 && (
        <div className='flex-1 flex items-center justify-center text-ash-gray font-mono'>
          {t('ui:leaderboard.no_data')}
        </div>
      )}

      {!isLoading && !error && !isUnavailable && rankings.length > 0 && (
        <div className='flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar touch-pan-y touch-pinch-zoom'>
          <table className='w-full text-left font-mono'>
            <thead className='text-ash-gray border-b border-ash-gray/30 text-xs uppercase sticky top-0 bg-void-black'>
              <tr>
                <th className='py-2 px-2'>#</th>
                <th className='py-2 px-2'>
                  {t('ui:leaderboard.col_player')}
                </th>
                <th className='py-2 px-2 text-right'>
                  {view === 'BALANCE'
                    ? t('ui:leaderboard.col_net_worth')
                    : view === 'SONG'
                      ? t('ui:leaderboard.col_score')
                      : t('ui:leaderboard.col_value', {
                          defaultValue: 'Value'
                        })}
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map(entry => {
                return (
                  <tr
                    key={entry.playerId}
                    className='border-b border-ash-gray/10 hover:bg-toxic-green/10 transition-colors'
                  >
                    <td className='py-2 px-2 text-toxic-green'>
                      {entry.rank}
                    </td>
                    <td className='py-2 px-2 text-star-white'>
                      {entry.playerName}
                    </td>
                    <td className='py-2 px-2 text-right text-toxic-green'>
                      {view === 'BALANCE'
                        ? formatCurrency(entry.score, i18n.language)
                        : view === 'DISTANCE'
                          ? t('ui:leaderboard.col_value_km', {
                              value: formatNumber(entry.score, i18n.language),
                              unit: t('ui:unit.km', { defaultValue: 'km' }),
                              defaultValue: '{{value}} {{unit}}'
                            })
                          : formatNumber(entry.score, i18n.language)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
