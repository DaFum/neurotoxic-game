import { ToggleRadio } from '../../components/ToggleRadio'

export const OverworldHeader = ({ t, locationName, isTraveling }) => {
  return (
    <>
      <h2 className='absolute top-20 text-4xl text-toxic-green font-[Metal_Mania] z-10 text-shadow-[0_0_10px_var(--color-toxic-green)] pointer-events-none'>
        {t('ui:overworld.header.tourPlan', { defaultValue: 'TOUR PLAN' })}:{' '}
        {locationName}
      </h2>

      {/* Instructions / Status */}
      <div className='absolute top-32 z-20 bg-void-black/80 border border-toxic-green p-2 text-center pointer-events-none'>
        <div className='text-toxic-green font-bold text-sm uppercase'>
          {isTraveling
            ? t('ui:overworld.status.traveling', {
                defaultValue: 'TRAVELING...'
              })
            : t('ui:overworld.status.nextStop', { defaultValue: 'Next Stop' })}
        </div>
        <div className='text-star-white text-xs'>
          {isTraveling
            ? t('ui:overworld.status.onRoad', { defaultValue: 'On the road' })
            : t('ui:overworld.status.selectLocation', {
                defaultValue: 'Select a highlighted location'
              })}
        </div>
      </div>

      {/* Radio Widget */}
      <div className='fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-void-black border border-shadow-black p-2 flex items-center gap-2 rounded shadow-[0_0_10px_var(--color-toxic-green-20)]'>
        <div className='w-2 h-2 rounded-full bg-blood-red animate-pulse' />
        <span className='text-xs text-ash-gray font-mono'>
          {t('ui:overworld.radio_station', { defaultValue: 'FM 66.6' })}
        </span>
        <ToggleRadio />
      </div>
    </>
  )
}
