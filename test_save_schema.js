import { initialState } from './src/context/initialState.js'
import { validateSaveData } from './src/utils/saveValidator.js'

try {
  const save = {
    version: initialState.version,
    player: initialState.player,
    band: initialState.band,
    social: initialState.social,
    gameMap: initialState.gameMap,
    minigame: initialState.minigame,
    events: initialState.events,
    system: initialState.system,
    trade: initialState.trade
  }
  validateSaveData(save)
  console.log("Save is valid!")
} catch (e) {
  console.error(e)
}
