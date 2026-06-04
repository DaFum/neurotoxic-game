import type { FC } from 'react'
import type { TFunction } from 'i18next'
import { HeaderTitle } from './HeaderTitle.tsx'
import { HeaderTimer } from './HeaderTimer.tsx'

interface HeaderProps {
  t: TFunction
  isShocked: boolean
  isPoweredOn: boolean
  isGameOver: boolean
  timeLeft: number
}

/**
 * Shows Kabelsalat title feedback and countdown timer state.
 * @param props - Kabelsalat translator, shock/power/game-over state, and remaining time.
 */
export const Header: FC<HeaderProps> = ({
  t,
  isShocked,
  isPoweredOn,
  isGameOver,
  timeLeft
}) => (
  <div className='w-full flex flex-col md:flex-row justify-between items-end border-b-2 border-toxic-green pb-2 mb-6 gap-4 bg-void-black/80 p-4'>
    <HeaderTitle
      t={t}
      isShocked={isShocked}
      isPoweredOn={isPoweredOn}
      isGameOver={isGameOver}
    />
    <HeaderTimer t={t} timeLeft={timeLeft} isPoweredOn={isPoweredOn} />
  </div>
)
