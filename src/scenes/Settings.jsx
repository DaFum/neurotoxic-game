import { useGameState } from '../context/GameState'
import { GlitchButton } from '../ui/GlitchButton'
import { SettingsPanel } from '../ui/shared'

/**
 * Settings scene for configuring audio, visuals, and data management.
 */
export const Settings = () => {
  const { changeScene, settings, updateSettings, deleteSave } = useGameState()

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 p-8'>
      <h1 className="text-6xl text-(--toxic-green) font-['Metal_Mania'] mb-12">
        SYSTEM CONFIG
      </h1>

      <div className='w-full max-w-2xl border-2 border-(--toxic-green) p-8 bg-(--void-black)/80'>
        <SettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          deleteSave={deleteSave}
        />
      </div>

      <div className='mt-8'>
        <GlitchButton onClick={() => changeScene('MENU')}>RETURN</GlitchButton>
      </div>
    </div>
  )
}
