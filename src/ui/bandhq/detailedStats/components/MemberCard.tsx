import { ProgressBar } from '../../../shared'
import type { BandMember } from '../types'
import type { BasicTProps } from '../types'
import { MemberEquipment } from './MemberEquipment'
import { MemberTraits } from './MemberTraits'
import { DetailRow } from './DetailRow'
import { isUnlocked } from '../helpers'

export const MemberCard = ({
  member,
  t
}: { member: BandMember } & BasicTProps) => (
  <div className='bg-void-black/60 border border-ash-gray p-4'>
    <div className='flex justify-between items-baseline mb-4'>
      <h4 className='text-lg font-bold text-toxic-green'>{member.name}</h4>
      <span className='text-xs text-ash-gray uppercase'>
        {member.role ??
          t('ui:detailedStats.member', { defaultValue: 'Member' })}
      </span>
    </div>

    <div className='space-y-3 mb-4'>
      <ProgressBar
        label={t('ui:detailedStats.stamina', {
          defaultValue: 'Stamina'
        })}
        value={member?.stamina ?? 0}
        max={100}
        color='bg-stamina-green'
        size='sm'
      />
      <ProgressBar
        label={t('ui:detailedStats.mood', { defaultValue: 'Mood' })}
        value={member?.mood ?? 0}
        max={100}
        color='bg-mood-pink'
        size='sm'
      />
    </div>

    <div className='space-y-1 text-sm'>
      <div className='font-bold text-ash-gray text-xs mb-1 uppercase tracking-wider'>
        {t('ui:detailedStats.skills', { defaultValue: 'Skills' })}
      </div>
      <DetailRow
        label={t('ui:detailedStats.skillBase', {
          defaultValue: 'Skill (Base)'
        })}
        value={member.baseStats?.skill ?? member.skill ?? 0}
      />
      <DetailRow
        label={t('ui:detailedStats.charisma', {
          defaultValue: 'Charisma'
        })}
        value={member.baseStats?.charisma ?? member.charisma ?? 0}
      />
      <DetailRow
        label={t('ui:detailedStats.technical', {
          defaultValue: 'Technical'
        })}
        value={member.baseStats?.technical ?? member.technical ?? 0}
      />
      <DetailRow
        label={t('ui:detailedStats.improv', {
          defaultValue: 'Improv'
        })}
        value={member.baseStats?.improv ?? member.improv ?? 0}
        locked={!isUnlocked(member.baseStats?.improv ?? member.improv ?? 0)}
      />
      <DetailRow
        label={t('ui:detailedStats.composition', {
          defaultValue: 'Composition'
        })}
        value={member.baseStats?.composition ?? member.composition ?? 0}
        locked={
          !isUnlocked(member.baseStats?.composition ?? member.composition ?? 0)
        }
      />
    </div>

    <div className='mt-4 pt-2 border-t border-ash-gray/30'>
      <div className='font-bold text-ash-gray text-xs mb-1 uppercase tracking-wider'>
        {t('ui:detailedStats.traits', { defaultValue: 'Traits' })}
      </div>
      <div className='space-y-1'>
        <MemberTraits member={member} t={t} />
      </div>
    </div>

    <div className='mt-2 pt-2 border-t border-ash-gray/30'>
      <div className='font-bold text-ash-gray text-xs mb-1 uppercase tracking-wider'>
        {t('ui:detailedStats.equipment', {
          defaultValue: 'Equipment'
        })}
      </div>
      <MemberEquipment member={member} t={t} />
    </div>
  </div>
)
