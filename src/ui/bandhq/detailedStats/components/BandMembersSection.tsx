import { MemberCard } from './MemberCard'
import type { BandMember } from '../types'
import type { BasicTProps } from '../types'

export const BandMembersSection = ({
  members,
  t
}: { members: BandMember[] } & BasicTProps) => (
  <div className='space-y-4'>
    <h3 className='text-xl text-star-white font-display border-b border-toxic-green pb-2'>
      {t('ui:detailedStats.bandMembers', { defaultValue: 'BAND MEMBERS' })}
    </h3>
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {(members || []).map(member => (
        <MemberCard key={member.name} member={member} t={t} />
      ))}
    </div>
  </div>
)
