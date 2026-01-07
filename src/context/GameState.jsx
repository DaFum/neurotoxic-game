import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { eventEngine } from '../utils/eventEngine';
import { resolveEventChoice } from '../utils/eventResolver';
import { MapGenerator } from '../utils/mapGenerator';
import { applyEventDelta } from '../utils/gameStateUtils';
import { CHARACTERS } from '../data/characters';

// Initial State Definition
const initialState = {
  currentScene: 'MENU',
  player: {
    money: 500,
    day: 1,
    time: 12,
    location: "Stendal",
    currentNodeId: 'node_0_0',
    tutorialStep: 0,
    fame: 0,
    fameLevel: 0,
    van: {
      fuel: 100,
      condition: 100,
      upgrades: []
    }
  },
  band: {
    members: [
      { ...CHARACTERS.MATZE, mood: 80, stamina: 100 },
      { ...CHARACTERS.LARS, mood: 80, stamina: 100 },
      { ...CHARACTERS.MARIUS, mood: 80, stamina: 100 }
    ],
    harmony: 80,
    inventory: {
        shirts: 50,
        hoodies: 20,
        patches: 100,
        cds: 30,
        vinyl: 10,
        strings: true,
        cables: true,
        drum_parts: true
    }
  },
  social: {
      instagram: 228,
      tiktok: 64,
      youtube: 14,
      newsletter: 0,
      viral: 0
  },
  gameMap: null,
  currentGig: null,
  setlist: [],
  lastGigStats: null,
  activeEvent: null,
  toasts: [],
  activeStoryFlags: [],
  eventCooldowns: [],
  pendingEvents: [],
  reputationByRegion: {},
  settings: {
      crtEnabled: true
  },
  npcs: {},
  gigModifiers: {
    promo: false,
    soundcheck: false,
    merch: false,
    energy: false,
    guestlist: false
  }
};

// Reducer Function
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'CHANGE_SCENE':
      return { ...state, currentScene: action.payload };
    
    case 'UPDATE_PLAYER':
      return { ...state, player: { ...state.player, ...action.payload } };
    
    case 'UPDATE_BAND':
      return { ...state, band: { ...state.band, ...action.payload } };
    
    case 'UPDATE_SOCIAL':
      return { ...state, social: { ...state.social, ...action.payload } };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    
    case 'SET_MAP':
      return { ...state, gameMap: action.payload };
    
    case 'SET_GIG':
      return { ...state, currentGig: action.payload };
    
    case 'START_GIG':
      return { ...state, currentGig: action.payload, currentScene: 'PREGIG' };

    case 'SET_SETLIST':
      return { ...state, setlist: action.payload };
    
    case 'SET_LAST_GIG_STATS':
      return { ...state, lastGigStats: action.payload };
    
    case 'SET_ACTIVE_EVENT':
      return { ...state, activeEvent: action.payload };
    
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    
    case 'SET_GIG_MODIFIERS':
      return { ...state, gigModifiers: action.payload };
      
    case 'LOAD_GAME':
      return { ...state, ...action.payload };

    case 'APPLY_EVENT_DELTA': {
        return applyEventDelta(state, action.payload);
    }
    
    case 'POP_PENDING_EVENT':
      return { ...state, pendingEvents: state.pendingEvents.slice(1) };

    case 'CONSUME_ITEM': {
        const itemType = action.payload; // e.g. 'strings'
        const nextBand = { ...state.band };
        if (nextBand.inventory[itemType] === true) {
            nextBand.inventory[itemType] = false; // Simple toggle for now?
        } else if (typeof nextBand.inventory[itemType] === 'number') {
            nextBand.inventory[itemType] = Math.max(0, nextBand.inventory[itemType] - 1);
        }
        return { ...state, band: nextBand };
    }

    case 'ADVANCE_DAY': {
        const nextPlayer = { ...state.player, day: state.player.day + 1 };
        const nextBand = { ...state.band };
        const nextSocial = { ...state.social };

        // 1. Costs
        // Rent/Food
        const dailyCost = 25; 
        nextPlayer.money -= dailyCost;

        // 2. Mood Drift
        // Drift towards 50
        nextBand.members = nextBand.members.map(m => {
            let mood = m.mood;
            if (mood > 50) mood -= 2;
            else if (mood < 50) mood += 2;
            return { ...m, mood };
        });

        // 3. Social Decay
        // Viral decay
        if (nextSocial.viral > 0) nextSocial.viral -= 1;
        
        // Return state with toast handled by side effect or UI? 
        // We can't dispatch side effects here easily.
        // We will return the state, consumer triggers toast.
        
        return { ...state, player: nextPlayer, band: nextBand, social: nextSocial };
    }

    default:
      return state;
  }
};

const GameStateContext = createContext();

export const GameStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize Map if needed
  useEffect(() => {
    if (!state.gameMap) {
        const generator = new MapGenerator();
        const newMap = generator.generateMap();
        dispatch({ type: 'SET_MAP', payload: newMap });
    }
  }, []);

  // Actions wrappers to maintain API
  const changeScene = (scene) => dispatch({ type: 'CHANGE_SCENE', payload: scene });
  const updatePlayer = (updates) => dispatch({ type: 'UPDATE_PLAYER', payload: updates });
  const updateBand = (updates) => dispatch({ type: 'UPDATE_BAND', payload: updates });
  const updateSocial = (updates) => dispatch({ type: 'UPDATE_SOCIAL', payload: updates });
  const updateSettings = (updates) => {
      // Assuming simple merge for now. 
      // Ideally we would dispatch UPDATE_SETTINGS, but we can piggyback on LOAD_GAME or create a new action if strictness needed.
      // Since settings are part of state, let's create a quick reducer case or just mutate for this prototype (bad practice)
      // Let's add UPDATE_SETTINGS case locally? No, can't change reducer inside provider body.
      // Actually, I missed adding UPDATE_SETTINGS to reducer. Let's fix that in next step or just reuse a generic update.
      // For now, I will use a direct dispatch with a new type and add it to reducer in same file if I could, but I can't edit 2 places easily with merge_diff unless I do big block.
      // I'll add the case in the reducer block above first.
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
  };
  const setGameMap = (map) => dispatch({ type: 'SET_MAP', payload: map });
  const setCurrentGig = (gig) => dispatch({ type: 'SET_GIG', payload: gig });
  const startGig = (venue) => dispatch({ type: 'START_GIG', payload: venue });
  const setSetlist = (list) => dispatch({ type: 'SET_SETLIST', payload: list });
  const setLastGigStats = (stats) => dispatch({ type: 'SET_LAST_GIG_STATS', payload: stats });
  const setActiveEvent = (event) => dispatch({ type: 'SET_ACTIVE_EVENT', payload: event });
  const setGigModifiers = (mods) => {
      // If passing function, handle it (useState style) or just value
      if (typeof mods === 'function') {
          // This is tricky with useReducer as we don't have sync access to state in the same way 
          // unless we read it from state.gigModifiers
          // But consumers might expect (prev => ...)
          // For now assume direct object or handle simple merge if needed.
          // Simplification: Consumers pass new object.
          // But looking at existing usage: setGigModifiers(prev => ...)
          // We need to support that pattern or refactor consumers.
          // Let's refactor the wrapper to support it.
          const newMods = mods(state.gigModifiers);
          dispatch({ type: 'SET_GIG_MODIFIERS', payload: newMods });
      } else {
          dispatch({ type: 'SET_GIG_MODIFIERS', payload: mods });
      }
  };

  const addToast = (message, type = 'info') => {
      const id = Date.now();
      dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
      setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', payload: id });
      }, 3000);
  };

  const hasUpgrade = (upgradeId) => state.player.van.upgrades.includes(upgradeId);

  const consumeItem = (itemType) => {
      dispatch({ type: 'CONSUME_ITEM', payload: itemType });
  };

  const advanceDay = () => {
      dispatch({ type: 'ADVANCE_DAY' });
      addToast(`Day ${state.player.day + 1}: Living Costs Deducted.`, 'info');
  };

  // Persistence
  const deleteSave = () => {
    localStorage.removeItem('neurotoxic_v3_save');
    changeScene('MENU');
    window.location.reload(); 
  };

  const saveGame = () => {
    const saveData = { ...state, timestamp: Date.now() };
    try {
        localStorage.setItem('neurotoxic_v3_save', JSON.stringify(saveData));
        alert("GAME SAVED!");
    } catch (e) {
        console.error("Save failed", e);
        alert("Save failed!");
    }
  };

  const loadGame = () => {
    try {
        const saved = localStorage.getItem('neurotoxic_v3_save');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Validate Schema
            const requiredKeys = ['player', 'band', 'social', 'gameMap'];
            const missingKeys = requiredKeys.filter(k => !data[k]);
            
            if (missingKeys.length > 0) {
                console.error("Corrupt Save File: Missing keys", missingKeys);
                alert("Save file is corrupt or outdated. Starting fresh.");
                return false;
            }

            dispatch({ type: 'LOAD_GAME', payload: data });
            return true;
        }
    } catch (e) {
        console.error("Load failed", e);
        return false;
    }
    return false;
  };

  // Event System Integration
  const triggerEvent = (category, triggerPoint = null) => {
    // Pass full state context for flags/cooldowns
    const context = { 
        player: state.player, 
        band: state.band, 
        social: state.social,
        activeStoryFlags: state.activeStoryFlags,
        eventCooldowns: state.eventCooldowns,
        pendingEvents: state.pendingEvents
    };

    let event = eventEngine.checkEvent(category, context, triggerPoint);
    
    if (event) {
        // Process dynamic options (Inventory checks)
        event = eventEngine.processOptions(event, context);
        
        setActiveEvent(event);
        // If it was a pending event, remove it from queue
        if (state.pendingEvents.includes(event.id)) {
            dispatch({ type: 'POP_PENDING_EVENT' });
        }
        return true;
    }
    return false;
  };

  const resolveEvent = (choice) => {
    if (!choice) {
      setActiveEvent(null);
      return { outcomeText: '', description: '', result: null };
    }

    try {
      const { result, delta, outcomeText, description } = resolveEventChoice(choice, {
        player: state.player,
        band: state.band,
        social: state.social
      });

      if (delta) {
        dispatch({ type: 'APPLY_EVENT_DELTA', payload: delta });

        if (delta.flags?.unlock) {
          const currentUnlocks = JSON.parse(localStorage.getItem('neurotoxic_unlocks') || '[]');
          if (!currentUnlocks.includes(delta.flags.unlock)) {
            currentUnlocks.push(delta.flags.unlock);
            localStorage.setItem('neurotoxic_unlocks', JSON.stringify(currentUnlocks));
            addToast(`UNLOCKED: ${delta.flags.unlock.toUpperCase()}!`, 'success');
          }
        }

        if (delta.flags?.gameOver) {
          addToast(`GAME OVER: ${description}`, 'error');
          changeScene('GAMEOVER');
          setActiveEvent(null);
          return { outcomeText, description, result };
        }
      }

      setActiveEvent(null);
      return { outcomeText, description, result };
    } catch (error) {
      console.error('[Event] Failed to resolve event choice:', error);
      addToast('EVENT ERROR: Resolution failed.', 'error');
      setActiveEvent(null);
      return { outcomeText: choice.outcomeText ?? '', description: 'Resolution failed.', result: null };
    }
  };

  return (
    <GameStateContext.Provider value={{
      ...state, // Spread state properties
      changeScene,
      updatePlayer,
      updateBand,
      updateSocial,
      setGameMap,
      setCurrentGig,
      startGig,
      setSetlist,
      setLastGigStats,
      setActiveEvent,
      triggerEvent,
      resolveEvent,
      addToast,
      setGigModifiers,
      hasUpgrade,
      consumeItem,
      advanceDay,
      saveGame,
      loadGame,
      deleteSave,
      updateSettings
    }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => useContext(GameStateContext);
