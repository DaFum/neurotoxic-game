import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlitchButton } from '../../ui/GlitchButton'
import { EXPENSE_CONSTANTS } from '../../utils/economyEngine'
import { GAME_PHASES } from '../../context/gameConstants'

export const OverworldMenu = React.memo(
  ({
    t,
    isMenuOpen,
    setIsMenuOpen,
    isTraveling,
    vanFuel,
    vanCondition,
    isSaving,
    openStash,
    openQuests,
    openPirateRadio,
    openMerchPress,
    openBloodBank,
    openDarkWebLeak,
    openHQ,
    handleRefuel,
    handleRepair,
    handleSaveWithDelay,
    changeScene
  }) => {
    return (
      <div className='absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-2 items-end'>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              id='overworld-menu-panel'
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className='flex flex-col gap-2 items-end mb-2'
            >
              <GlitchButton
                onClick={openStash}
                disabled={isTraveling}
                variant='primary'
                size='sm'
              >
                [{t('ui:contraband.button', { defaultValue: 'STASH' })}]
              </GlitchButton>
              <GlitchButton
                onClick={openQuests}
                disabled={isTraveling}
                variant='primary'
                size='sm'
              >
                [{t('ui:quests.button', { defaultValue: 'QUESTS' })}]
              </GlitchButton>
              <GlitchButton
                onClick={openPirateRadio}
                disabled={isTraveling}
                variant='warning'
                size='sm'
              >
                [{t('ui:pirate_radio.button', { defaultValue: 'PIRATE RADIO' })}
                ]
              </GlitchButton>
              <GlitchButton
                onClick={openMerchPress}
                disabled={isTraveling}
                variant='warning'
                size='sm'
              >
                [{t('ui:merch_press.button', { defaultValue: 'MERCH PRESS' })}]
              </GlitchButton>
              <GlitchButton
                onClick={openBloodBank}
                disabled={isTraveling}
                variant='danger'
                size='sm'
              >
                [{t('ui:blood_bank.button', { defaultValue: 'VOID CLINIC' })}]
              </GlitchButton>
              <GlitchButton
                onClick={openDarkWebLeak}
                disabled={isTraveling}
                variant='danger'
                size='sm'
              >
                [DARK WEB LEAK]
              </GlitchButton>
              <GlitchButton
                onClick={openHQ}
                disabled={isTraveling}
                variant='primary'
                size='sm'
              >
                [{t('ui:overworld.band_hq_button', { defaultValue: 'BAND HQ' })}
                ]
              </GlitchButton>
              <GlitchButton
                onClick={handleRefuel}
                disabled={
                  isTraveling ||
                  (vanFuel ?? 0) >= EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL
                }
                variant='warning'
                size='sm'
              >
                [{t('ui:overworld.refuel', { defaultValue: 'REFUEL' })}]
              </GlitchButton>
              <GlitchButton
                onClick={() => changeScene(GAME_PHASES.CLINIC)}
                disabled={isTraveling}
                variant='warning'
                size='sm'
              >
                [
                {t('ui:overworld.void_clinic_button', {
                  defaultValue: 'VOID CLINIC'
                })}
                ]
              </GlitchButton>
              <GlitchButton
                onClick={handleRepair}
                disabled={isTraveling || (vanCondition ?? 100) >= 100}
                variant='primary'
                size='sm'
              >
                [{t('ui:overworld.repair', { defaultValue: 'REPAIR' })}]
              </GlitchButton>
              <GlitchButton
                onClick={handleSaveWithDelay}
                disabled={isTraveling}
                isLoading={isSaving}
                variant='primary'
                size='sm'
              >
                [{t('ui:overworld.save_game', { defaultValue: 'SAVE GAME' })}]
              </GlitchButton>
            </motion.div>
          )}
        </AnimatePresence>

        <GlitchButton
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          disabled={isTraveling}
          variant='primary'
          size='sm'
          aria-expanded={isMenuOpen}
          aria-controls='overworld-menu-panel'
        >
          {isMenuOpen
            ? `[${t('ui:menu.close', { defaultValue: 'CLOSE MENU' })}]`
            : `[${t('ui:menu.open', { defaultValue: 'OPEN MENU' })}]`}
        </GlitchButton>
      </div>
    )
  }
)

OverworldMenu.displayName = 'OverworldMenu'
