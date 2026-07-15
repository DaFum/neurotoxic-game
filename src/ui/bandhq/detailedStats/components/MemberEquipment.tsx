import type { BandMember } from '../../../../types'
import type { BasicTProps } from '../types'
import { isEmptyObject } from '../../../../utils/gameState'

export const MemberEquipment = ({
  member,
  t
}: { member: BandMember } & BasicTProps) => {
  if (!member.equipment || isEmptyObject(member.equipment)) {
    return (
      <div className='text-xs text-ash-gray/50'>
        {t('ui:detailedStats.standardGear', {
          defaultValue: 'Standard Gear'
        })}
      </div>
    )
  }

  return Object.entries(member.equipment).map(([k, v]) => (
    <div key={k} className='text-xs text-star-white/80 flex justify-between'>
      <span className='capitalize text-ash-gray'>
        {t(`ui:equipment.slots.${k}`, { defaultValue: k })}:
      </span>
      <span>
        {typeof v === 'string'
          ? t(`items:${v}.name`, { defaultValue: v })
          : String(v)}
      </span>
    </div>
  ))
}
