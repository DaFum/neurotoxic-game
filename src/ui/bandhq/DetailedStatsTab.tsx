import { useTranslation } from 'react-i18next'
import type {
  PlayerState,
  BandState,
  SocialState,
  QuestState
} from '../../types'
import {
  CareerOverviewSection,
  SocialReachSection,
  VanConditionSection,
  RegionalStandingSection,
  ActiveQuestsSection,
  BandMetricsSection,
  InventoryEquipmentSection,
  CraftingSection,
  BandMembersSection
} from './detailedStats'

export const DetailedStatsTab = ({
  player,
  band,
  social,
  activeQuests = [],
  venueBlacklist = [],
  reputationByRegion = {},
  spendableCash,
  onMakeAmends,
  onCraft,
  craftableStash,
  onConsumeItem
}: {
  player: PlayerState
  band: BandState
  social: SocialState
  activeQuests?: QuestState[]
  venueBlacklist?: string[]
  reputationByRegion?: Record<string, number>
  /** Cash amends may spend: protected Expedition cash is excluded in a run. */
  spendableCash: number
  onMakeAmends?: (venueId: string) => void
  onCraft?: (recipeId: string) => void
  /** Stock the Workshop may use; defaults to the whole stash. */
  craftableStash?: Record<string, unknown>
  onConsumeItem?: (itemId: string) => void
}) => {
  const { t } = useTranslation([
    'ui',
    'events',
    'items',
    'venues',
    'traits',
    'economy'
  ])

  return (
    <div className='space-y-8'>
      {/* Top Row: Career & Social Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <CareerOverviewSection player={player} t={t} />
        <SocialReachSection social={social} t={t} />
        <VanConditionSection player={player} t={t} />
      </div>

      {/* Region and Quests */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <RegionalStandingSection
          reputationByRegion={reputationByRegion}
          venueBlacklist={venueBlacklist}
          playerMoney={spendableCash}
          onMakeAmends={onMakeAmends}
          t={t}
        />
        <ActiveQuestsSection activeQuests={activeQuests} t={t} />
      </div>

      {/* Band Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <BandMetricsSection band={band} social={social} t={t} />
        <InventoryEquipmentSection
          band={band}
          onConsumeItem={onConsumeItem}
          t={t}
        />
      </div>

      {/* Workshop */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <CraftingSection
          stash={craftableStash ?? band.stash}
          onCraft={onCraft}
          t={t}
        />
      </div>

      {/* Members Detail */}
      <BandMembersSection members={band.members || []} t={t} />
    </div>
  )
}
