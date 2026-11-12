import { memo, useMemo } from 'react'
import { useGameSelector } from '../context/GameState'
import { useTranslation } from 'react-i18next'
import {
  BandStatusPanel,
  PlayerStatusCard
} from './hud/shared/SharedHUDComponents'
import { GigControlsCluster } from './hud/GigControlsCluster'
import { translateLocation } from '../utils/locationI18n'
import { readVanCondition } from '../utils/gameState'

/**
 * Heads-Up Display overlay showing player stats, band status, and volume controls.
 */
export const HUD = memo(() => {
  const playerMoney = useGameSelector(state => state.player.money)
  const playerLocation = useGameSelector(state => state.player.location)
  const playerDay = useGameSelector(state => state.player.day)
  const playerVanFuel = useGameSelector(state => state.player.van?.fuel ?? 0)
  const playerVanCondition = useGameSelector(state =>
    readVanCondition(state.player?.van?.condition)
  )

  const bandHarmony = useGameSelector(state => state.band?.harmony ?? 0)
  const bandMembers = useGameSelector(state => state.band?.members)

  // Only the fields BandStatusPanel reads, so band mutations elsewhere
  // no longer re-render the panel.
  const bandStatus = useMemo(
    () => ({ harmony: bandHarmony, members: bandMembers ?? [] }),
    [bandHarmony, bandMembers]
  )

  const { t, i18n } = useTranslation(['ui', 'venues'])
  const locationName = translateLocation(t, playerLocation, playerLocation)

  return (
    <div className='absolute top-0 left-0 w-full p-3 flex justify-between items-start pointer-events-none z-(--z-hud) text-xs font-mono'>
      {/* Left Panel - Player Info */}
      <div className='flex flex-col gap-2 min-w-0'>
        <PlayerStatusCard
          money={playerMoney}
          day={playerDay}
          locationName={locationName}
          fuel={playerVanFuel}
          condition={playerVanCondition}
          language={i18n.language}
          t={t}
        />

        <GigControlsCluster className='relative z-(--z-hud) pointer-events-none' />
      </div>

      {/* Right Panel - Band Status */}
      <div className='flex flex-col gap-2 items-end shrink-0'>
        <BandStatusPanel band={bandStatus} t={t} variant='compact' />
      </div>
    </div>
  )
})
